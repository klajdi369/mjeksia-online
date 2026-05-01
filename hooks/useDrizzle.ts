// hooks/useDrizzle.ts
import * as schema from "@/services/db/schema";
import type { DbType } from "@/services/db/types";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { drizzle as drizzleProxy } from "drizzle-orm/sqlite-proxy";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";

function toErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

function wrapDbError(context: string, error: unknown) {
  return new Error(`${context}. SQLite error: ${toErrorMessage(error)}`);
}

// expo-sqlite WASM on web sometimes throws error-like objects that don't pass
// instanceof Error, so we fall back to String(error) for the message check.
function isIgnorableFinalizeError(error: unknown): boolean {
  const msg =
    error instanceof Error
      ? error.message.toLowerCase()
      : String(error).toLowerCase();
  return msg.includes("error finalizing statement");
}

// SQLITE_DONE (101) is the normal "no more rows" sentinel. On web WASM, the
// prepared-statement iterator can surface it as a thrown error.
function isSqliteDoneError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("101") ||
    msg.toLowerCase().includes("no more rows") ||
    msg.toLowerCase().includes("sqlite_done")
  );
}

// ---------------------------------------------------------------------------
// Parse the column names from a drizzle-generated SELECT statement.
//
// drizzle always emits:  select "col1", "col2", ... from "table" ...
//
// We extract the names in SELECT-clause order so we can build value arrays
// explicitly by name rather than relying on Object.values() insertion-order
// (which is unreliable for expo-sqlite web result objects).
// ---------------------------------------------------------------------------
function parseSelectColumns(sql: string): string[] {
  const m = sql.match(/^\s*select\s+([\s\S]+?)\s+from\s+/i);
  if (!m) return [];

  const cols: string[] = [];
  let depth = 0;
  let cur = "";

  for (const ch of m[1]) {
    if (ch === "(") { depth++; cur += ch; }
    else if (ch === ")") { depth--; cur += ch; }
    else if (ch === "," && depth === 0) {
      const nameMatch = cur.trim().match(/^"([^"]+)"/);
      if (nameMatch) cols.push(nameMatch[1]);
      cur = "";
    } else {
      cur += ch;
    }
  }
  const nameMatch = cur.trim().match(/^"([^"]+)"/);
  if (nameMatch) cols.push(nameMatch[1]);

  return cols;
}

// Build a positional value array that drizzle's mapResultRow expects.
// We access properties by name in SELECT-clause order so the result is
// independent of how expo-sqlite web orders the object keys.
function rowToValues(row: unknown, cols: string[]): unknown[] {
  if (Array.isArray(row)) return row;
  if (!row || typeof row !== "object") return [];
  if (cols.length > 0) {
    return cols.map((c) => (row as Record<string, unknown>)[c]);
  }
  return Object.values(row as object);
}

// ---------------------------------------------------------------------------
// Web-only drizzle hook.
//
// db.getAllAsync() on web expo-sqlite goes through the Expo JS bridge which
// truncates large JSON responses → "Unexpected end of JSON input".
//
// Using prepareAsync + executeAsync returns rows one at a time through the
// WASM step API, which avoids that buffer limit entirely.  We wrap the result
// in a drizzle-orm/sqlite-proxy so the rest of the app uses the standard
// drizzle ORM API unchanged.
// ---------------------------------------------------------------------------
function useWebDrizzle() {
  const db = useSQLiteContext();
  const [migrationSuccess, setMigrationSuccess] = useState(false);
  const [migrationError, setMigrationError] = useState<Error | undefined>(
    undefined,
  );

  const drizzleDb = useMemo(() => {
    return drizzleProxy(
      async (query, params, method) => {
        const cols = parseSelectColumns(query);
        const statement = await db.prepareAsync(query);

        try {
          let result: any;

          if (!params || (Array.isArray(params) && params.length === 0)) {
            result = await statement.executeAsync();
          } else if (Array.isArray(params)) {
            result = await statement.executeAsync(...params);
          } else if (typeof params === "object") {
            const entries = Object.entries(params as Record<string, unknown>);
            const allNumeric =
              entries.length > 0 && entries.every(([k]) => /^\d+$/.test(k));
            if (allNumeric) {
              const ordered = entries
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([, v]) => v as any);
              result = await statement.executeAsync(...ordered);
            } else {
              result = await statement.executeAsync(
                params as Record<string, any>,
              );
            }
          } else {
            result = await statement.executeAsync(params as any);
          }

          if (method === "run") return { rows: [] };

          // Safely fetch all rows, treating SQLITE_DONE as end-of-results.
          const safeAll = async (): Promise<unknown[][]> => {
            if (Array.isArray(result)) {
              return result.map((r) => rowToValues(r, cols));
            }
            try {
              const rows = await result.getAllAsync();
              return rows.map((r: unknown) => rowToValues(r, cols));
            } catch (err) {
              if (isSqliteDoneError(err)) return [];
              throw err;
            }
          };

          const safeFirst = async (): Promise<unknown[] | undefined> => {
            if (Array.isArray(result)) {
              return result[0] ? rowToValues(result[0], cols) : undefined;
            }
            try {
              const row = await result.getFirstAsync();
              return row ? rowToValues(row, cols) : undefined;
            } catch (err) {
              if (isSqliteDoneError(err)) return undefined;
              throw err;
            }
          };

          if (method === "get") {
            return { rows: await safeFirst() };
          }

          if (method === "values") {
            return { rows: await safeAll() };
          }

          // "all" — drizzle calls Object.values(row) on each entry; because we
          // already converted to a positional array, Object.values([...]) is a
          // no-op and drizzle maps fields correctly.
          return { rows: await safeAll() };
        } finally {
          try {
            await statement.finalizeAsync();
          } catch {
            // ignore finalize errors
          }
        }
      },
      { schema },
    ) as unknown as DbType;
  }, [db]);

  useEffect(() => {
    let isCancelled = false;
    setMigrationSuccess(false);
    setMigrationError(undefined);

    repairNativeSchema(db)
      .then(() => {
        if (isCancelled) return;
        setMigrationSuccess(true);
        setMigrationError(undefined);
      })
      .catch((error: unknown) => {
        if (isCancelled) return;
        setMigrationError(wrapDbError("Web database bootstrap failed", error));
      });

    return () => {
      isCancelled = true;
    };
  }, [db]);

  return { drizzleDb, migrationSuccess, migrationError };
}

// ---------------------------------------------------------------------------
// Native drizzle hook (unchanged from original).
// ---------------------------------------------------------------------------
async function runDdl(db: ReturnType<typeof useSQLiteContext>, sql: string) {
  try {
    await db.runAsync(sql);
  } catch (error) {
    if (isIgnorableFinalizeError(error)) return;
    throw error;
  }
}

async function ensureColumn(
  db: ReturnType<typeof useSQLiteContext>,
  tableName: string,
  columnName: string,
  columnDefinition: string,
) {
  const alter = async (definition: string) =>
    runDdl(db, `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition};`);

  try {
    await alter(columnDefinition);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    const isDuplicateColumn =
      message.includes("duplicate column name") ||
      message.includes("already exists");
    if (isDuplicateColumn) return;

    const cannotAddNotNull =
      message.includes("cannot add a not null") &&
      columnDefinition.toLowerCase().includes("not null");
    if (cannotAddNotNull) {
      const relaxedDefinition = columnDefinition
        .replace(/\s+not\s+null/gi, "")
        .replace(/\s+default\s+['"][^'"]*['"]/gi, "")
        .trim();
      try {
        await alter(relaxedDefinition);
        return;
      } catch {
        // Fall through to throw original error.
      }
    }

    throw wrapDbError(
      `Failed to add column '${columnName}' on table '${tableName}'`,
      error,
    );
  }
}

async function repairNativeSchema(db: ReturnType<typeof useSQLiteContext>) {
  try {
    await runDdl(
      db,
      `CREATE TABLE IF NOT EXISTS test_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
        time_left INTEGER,
        score INTEGER NOT NULL DEFAULT 0,
        total_questions INTEGER NOT NULL,
        is_completed INTEGER NOT NULL DEFAULT 0,
        topic TEXT,
        test_type TEXT DEFAULT 'mock'
      );`,
    );
  } catch (error: unknown) {
    throw wrapDbError("Failed creating/verifying 'test_sessions' table", error);
  }

  try {
    await runDdl(
      db,
      `CREATE TABLE IF NOT EXISTS user_answers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        question_id INTEGER NOT NULL,
        selected_option TEXT,
        is_correct INTEGER NOT NULL,
        answered_at INTEGER,
        seconds_spend INTEGER DEFAULT 0,
        correct_option TEXT NOT NULL DEFAULT '',
        FOREIGN KEY(session_id) REFERENCES test_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY(question_id) REFERENCES questions(id)
      );`,
    );
  } catch (error: unknown) {
    throw wrapDbError("Failed creating/verifying 'user_answers' table", error);
  }

  await ensureColumn(db, "test_sessions", "topic", "TEXT");
  await ensureColumn(db, "test_sessions", "test_type", "TEXT DEFAULT 'mock'");
  await ensureColumn(db, "user_answers", "answered_at", "INTEGER");
  await ensureColumn(db, "user_answers", "seconds_spend", "INTEGER DEFAULT 0");
  await ensureColumn(
    db,
    "user_answers",
    "correct_option",
    "TEXT NOT NULL DEFAULT ''",
  );
}

function useNativeDrizzle() {
  const db = useSQLiteContext();
  const [migrationSuccess, setMigrationSuccess] = useState(false);
  const [migrationError, setMigrationError] = useState<Error | undefined>(
    undefined,
  );

  const drizzleDb = useMemo(() => drizzle(db, { schema }), [db]);

  useEffect(() => {
    let isCancelled = false;
    setMigrationSuccess(false);
    setMigrationError(undefined);

    repairNativeSchema(db)
      .then(() => {
        if (isCancelled) return;
        setMigrationSuccess(true);
        setMigrationError(undefined);
      })
      .catch((error: unknown) => {
        if (isCancelled) return;
        setMigrationError(
          wrapDbError("Native database bootstrap failed", error),
        );
      });

    return () => {
      isCancelled = true;
    };
  }, [db, drizzleDb]);

  return { drizzleDb, migrationSuccess, migrationError };
}

export const useDrizzle =
  Platform.OS === "web" ? useWebDrizzle : useNativeDrizzle;
