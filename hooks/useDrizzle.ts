// hooks/useDrizzle.ts
import * as schema from "@/services/db/schema";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { migrate } from "drizzle-orm/expo-sqlite/migrator";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import migrations from "../drizzle/migrations";

export function useDrizzle() {
  const db = useSQLiteContext();
  const [migrationSuccess, setMigrationSuccess] = useState(Platform.OS === "web");
  const [migrationError, setMigrationError] = useState<Error | undefined>(undefined);

  const drizzleDb = useMemo(() => {
    return drizzle(db, { schema });
  }, [db]);

  useEffect(() => {
    if (Platform.OS === "web") {
      setMigrationSuccess(true);
      setMigrationError(undefined);

      return;
    }

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
