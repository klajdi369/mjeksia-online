// hooks/useDrizzle.ts
import * as schema from "@/services/db/schema";
import type { DbType } from "@/services/db/types";
import { initializeWebDb, webDrizzleDb } from "@/services/db/webDrizzle";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";

const REQUIRED_TEST_SESSION_COLUMNS = new Set(["topic", "test_type"]);
const REQUIRED_USER_ANSWER_COLUMNS = new Set([
  "answered_at",
  "seconds_spend",
  "correct_option",
]);

type TableInfoRow = {
  name?: string;
};

async function hasRequiredColumns(
  db: ReturnType<typeof useSQLiteContext>,
  tableName: string,
  requiredColumns: Set<string>,
) {
  const rows = (await db.getAllAsync(
    `PRAGMA table_info(${tableName});`,
  )) as TableInfoRow[];
  const existing = new Set(
    rows
      .map((row) => row?.name)
      .filter((columnName): columnName is string => Boolean(columnName)),
  );
  return [...requiredColumns].every((column) => existing.has(column));
}

async function ensureColumn(
  db: ReturnType<typeof useSQLiteContext>,
  tableName: string,
  columnName: string,
  columnDefinition: string,
) {
  const hasColumn = await hasRequiredColumns(db, tableName, new Set([columnName]));
  if (hasColumn) return;
  await db.execAsync(
    `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition};`,
  );
}

async function repairNativeSchema(db: ReturnType<typeof useSQLiteContext>) {
  await db.execAsync(
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

  await db.execAsync(
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

function useWebDrizzle() {
  const [migrationSuccess, setMigrationSuccess] = useState(false);
  const [migrationError, setMigrationError] = useState<Error | undefined>(
    undefined,
  );

  useEffect(() => {
    let isCancelled = false;

    setMigrationSuccess(false);
    setMigrationError(undefined);

    initializeWebDb()
      .then(({ success, error }) => {
        if (isCancelled) return;
        if (success) {
          setMigrationSuccess(true);
        } else {
          setMigrationError(error);
        }
      })
      .catch((error: unknown) => {
        if (!isCancelled) {
          setMigrationError(
            error instanceof Error ? error : new Error(String(error)),
          );
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  return {
    drizzleDb: webDrizzleDb as unknown as DbType,
    migrationSuccess,
    migrationError,
  };
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
      .then(async () => {
        const [hasSessionColumns, hasAnswerColumns] = await Promise.all([
          hasRequiredColumns(db, "test_sessions", REQUIRED_TEST_SESSION_COLUMNS),
          hasRequiredColumns(db, "user_answers", REQUIRED_USER_ANSWER_COLUMNS),
        ]);

        if (isCancelled) return;

        if (hasSessionColumns && hasAnswerColumns) {
          setMigrationSuccess(true);
          setMigrationError(undefined);
          return;
        }

        setMigrationError(
          new Error("Native database schema is missing required columns."),
        );
      })
      .catch((error: unknown) => {
        if (isCancelled) return;
        setMigrationError(
          error instanceof Error ? error : new Error(String(error)),
        );
      });

    return () => {
      isCancelled = true;
    };
  }, [db, drizzleDb]);

  return { drizzleDb, migrationSuccess, migrationError };
}

// Platform.OS is a compile-time constant, so selecting the hook at module load
// time is safe and avoids a conditional hook call inside a render function.
export const useDrizzle =
  Platform.OS === "web" ? useWebDrizzle : useNativeDrizzle;
