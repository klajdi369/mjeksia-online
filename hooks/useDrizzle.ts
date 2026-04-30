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

function isSqliteDoneError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("101") || msg.toLowerCase().includes("no more rows");
}

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
        // Fall through and throw the original error for better context.
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

// On web, drizzle-orm/expo-sqlite's getAllAsync path goes through an internal
// JSON serialization layer in the SQLite WASM worker. Question text with literal
// newlines or other control characters causes JSON.parse to fail with
// "Unterminated string". Using prepareAsync + executeAsync bypasses that path
// and returns rows as structured JS objects directly.
function useWebDrizzle() {
  const db = useSQLiteContext();
  const [migrationSuccess, setMigrationSuccess] = useState(false);
  const [migrationError, setMigrationError] = useState<Error | undefined>(
    undefined,
  );

  const drizzleDb = useMemo(() => {
    return drizzleProxy(
      async (query, params, method) => {
        const statement = await db.prepareAsync(query);
        try {
          let result: any;

          if (!params || (Array.isArray(params) && params.length === 0)) {
            result = await statement.executeAsync();
          } else if (Array.isArray(params)) {
            result = await statement.executeAsync(...params);
          } else if (typeof params === "object") {
            const entries = Object.entries(params as Record<string, unknown>);
            const hasOnlyNumericKeys =
              entries.length > 0 &&
              entries.every(([key]) => /^\d+$/.test(key));
            if (hasOnlyNumericKeys) {
              const orderedValues = entries
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([, v]) => v as any);
              result = await statement.executeAsync(...orderedValues);
            } else {
              result = await statement.executeAsync(
                params as Record<string, any>,
              );
            }
          } else {
            result = await statement.executeAsync(params as any);
          }

          const isDirectRows = Array.isArray(result);

          const safeGetAll = async (): Promise<any[]> => {
            if (isDirectRows) return result;
            try {
              return await result.getAllAsync();
            } catch (err) {
              if (isSqliteDoneError(err)) return [];
              throw err;
            }
          };

          const safeGetFirst = async (): Promise<any> => {
            if (isDirectRows) return result[0] ?? undefined;
            try {
              return (await result.getFirstAsync()) ?? undefined;
            } catch (err) {
              if (isSqliteDoneError(err)) return undefined;
              throw err;
            }
          };

          if (method === "run") return { rows: [] };

          if (method === "get") {
            const first = await safeGetFirst();
            return { rows: first };
          }

          if (method === "values") {
            const rows = await safeGetAll();
            return {
              rows: rows.map((row: any) =>
                Array.isArray(row) ? row : Object.values(row),
              ),
            };
          }

          return { rows: await safeGetAll() };
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

function useNativeDrizzle() {
  const db = useSQLiteContext();
  const [migrationSuccess, setMigrationSuccess] = useState(false);
  const [migrationError, setMigrationError] = useState<Error | undefined>(
    undefined,
  );

  const drizzleDb = useMemo(() => {
    return drizzle(db, { schema });
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
