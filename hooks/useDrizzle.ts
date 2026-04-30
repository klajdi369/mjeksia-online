// hooks/useDrizzle.ts
import * as schema from "@/services/db/schema";
import type { DbType } from "@/services/db/types";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useMemo, useState } from "react";

function toErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

function wrapDbError(context: string, error: unknown) {
  return new Error(`${context}. SQLite error: ${toErrorMessage(error)}`);
}


function isIgnorableFinalizeError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return error.message.toLowerCase().includes("error finalizing statement");
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

export const useDrizzle = useNativeDrizzle;
