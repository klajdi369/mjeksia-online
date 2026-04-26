// hooks/useDrizzle.ts
import * as schema from "@/services/db/schema";
import type { DbType } from "@/services/db/types";
import { initializeWebDb, webDrizzleDb } from "@/services/db/webDrizzle";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { migrate } from "drizzle-orm/expo-sqlite/migrator";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import migrations from "../drizzle/migrations";

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

    migrate(drizzleDb, migrations)
      .then(() => {
        if (!isCancelled) {
          setMigrationSuccess(true);
        }
      })
      .catch((error: unknown) => {
        Promise.all([
          hasRequiredColumns(
            db,
            "test_sessions",
            REQUIRED_TEST_SESSION_COLUMNS,
          ),
          hasRequiredColumns(
            db,
            "user_answers",
            REQUIRED_USER_ANSWER_COLUMNS,
          ),
        ])
          .then(([hasSessionColumns, hasAnswerColumns]) => {
            if (isCancelled) return;

            if (hasSessionColumns && hasAnswerColumns) {
              setMigrationSuccess(true);
              setMigrationError(undefined);
              return;
            }

            setMigrationError(
              error instanceof Error ? error : new Error(String(error)),
            );
          })
          .catch((schemaCheckError: unknown) => {
            if (isCancelled) return;
            setMigrationError(
              schemaCheckError instanceof Error
                ? schemaCheckError
                : new Error(String(schemaCheckError)),
            );
          });
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
