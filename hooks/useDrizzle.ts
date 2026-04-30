// hooks/useDrizzle.ts
import * as schema from "@/services/db/schema";
import type { DbType } from "@/services/db/types";
import { drizzle } from "drizzle-orm/expo-sqlite";
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

// SQLITE_DONE (101) is the normal SQLite "no more rows" sentinel. On native,
// expo-sqlite absorbs it internally. On web WASM, getAllAsync / getFirstAsync
// can throw it as an actual error instead.
function isSqliteDoneError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("101") ||
    msg.toLowerCase().includes("no more rows") ||
    msg.toLowerCase().includes("sqlite_done")
  );
}

// Wrap the expo-sqlite database so that SQLITE_DONE errors from the web WASM
// implementation are silently treated as "no rows" rather than propagating up
// and being wrapped in a DrizzleQueryError.
function patchWebDb(
  db: ReturnType<typeof useSQLiteContext>,
): ReturnType<typeof useSQLiteContext> {
  if (Platform.OS !== "web") return db;

  return new Proxy(db, {
    get(target, prop) {
      const value = (target as any)[prop];

      if (prop === "getAllAsync" && typeof value === "function") {
        return async (...args: any[]) => {
          try {
            return await (value as (...a: any[]) => any).apply(target, args);
          } catch (err) {
            if (isSqliteDoneError(err)) return [];
            throw err;
          }
        };
      }

      if (prop === "getFirstAsync" && typeof value === "function") {
        return async (...args: any[]) => {
          try {
            return await (value as (...a: any[]) => any).apply(target, args);
          } catch (err) {
            if (isSqliteDoneError(err)) return null;
            throw err;
          }
        };
      }

      if (typeof value === "function") return value.bind(target);
      return value;
    },
  });
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

export function useDrizzle() {
  const rawDb = useSQLiteContext();
  const [migrationSuccess, setMigrationSuccess] = useState(false);
  const [migrationError, setMigrationError] = useState<Error | undefined>(
    undefined,
  );

  // patchWebDb is cheap (just creates a Proxy) and rawDb identity is stable.
  const db = useMemo(() => patchWebDb(rawDb), [rawDb]);

  const drizzleDb: DbType = useMemo(
    () => drizzle(db as ReturnType<typeof useSQLiteContext>, { schema }),
    [db],
  );

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
        setMigrationError(wrapDbError("Database bootstrap failed", error));
      });

    return () => {
      isCancelled = true;
    };
  }, [db, drizzleDb]);

  return { drizzleDb, migrationSuccess, migrationError };
}
