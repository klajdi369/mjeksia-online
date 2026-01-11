// hooks/useDrizzle.ts
import * as schema from "@/db/schema";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { useSQLiteContext } from "expo-sqlite";
import { useMemo } from "react";

export function useDrizzle() {
  const db = useSQLiteContext();

  const drizzleDb = useMemo(() => {
    return drizzle(db, { schema });
  }, [db]);

  return drizzleDb;
}
