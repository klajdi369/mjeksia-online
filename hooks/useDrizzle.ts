// hooks/useDrizzle.ts
import * as schema from "@/services/db/schema";
import type { DbType } from "@/services/db/types";
import { webDrizzleDb } from "@/services/db/webDrizzle";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { migrate } from "drizzle-orm/expo-sqlite/migrator";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import migrations from "../drizzle/migrations";

function useWebDrizzle() {
  return {
    drizzleDb: webDrizzleDb as unknown as DbType,
    migrationSuccess: true,
    migrationError: undefined,
  };
}

function useNativeDrizzle() {
  const db = useSQLiteContext();
  const [migrationSuccess, setMigrationSuccess] = useState(false);
  const [migrationError, setMigrationError] = useState<Error | undefined>(undefined);

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
        if (!isCancelled) {
          setMigrationError(
            error instanceof Error ? error : new Error(String(error)),
          );
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [drizzleDb]);

  return { drizzleDb, migrationSuccess, migrationError };
}

// Platform.OS is a compile-time constant, so selecting the hook at module load
// time is safe and avoids a conditional hook call inside a render function.
export const useDrizzle =
  Platform.OS === "web" ? useWebDrizzle : useNativeDrizzle;
