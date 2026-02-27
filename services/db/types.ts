import * as schema from "@/services/db/schema";
import { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import { SQLiteDatabase } from "expo-sqlite";

export type DbType = ExpoSQLiteDatabase<typeof schema> & {
  $client: SQLiteDatabase;
};
