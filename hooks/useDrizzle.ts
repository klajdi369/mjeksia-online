// hooks/useDrizzle.ts
import * as schema from "@/services/db/schema";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { useSQLiteContext } from "expo-sqlite";
import { useMemo } from "react";
import migrations from "../drizzle/migrations";

export function useDrizzle() {
  const db = useSQLiteContext();

  const drizzleDb = useMemo(() => {
    return drizzle(db, { schema });
  }, [db]);

  const { success, error } = useMigrations(drizzleDb, migrations);

  return { drizzleDb, migrationSuccess: success, migrationError: error };
}
