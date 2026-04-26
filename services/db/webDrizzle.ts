import * as schema from "@/services/db/schema";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import { deserializeDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";
import { Asset } from "expo-asset";

declare global {
  // Keep a single web SQLite connection across Fast Refresh/module reloads.
  // eslint-disable-next-line no-var
  var __mjeksiaWebDbPromise: Promise<SQLiteDatabase> | undefined;
}

const getCachedDbPromise = () => globalThis.__mjeksiaWebDbPromise;
const setCachedDbPromise = (promise: Promise<SQLiteDatabase>) => {
  globalThis.__mjeksiaWebDbPromise = promise;
};

async function getWebSQLiteDatabase() {
  const cachedPromise = getCachedDbPromise();
  if (cachedPromise) return cachedPromise;

  const nextPromise = (async () => {
    const asset = await Asset.fromModule(require("@/assets/data.db")).downloadAsync();

    if (!asset.localUri) {
      throw new Error("Failed to resolve bundled questions database asset.");
    }

    const response = await fetch(asset.localUri);
    if (!response.ok) {
      throw new Error(`Failed to fetch bundled DB asset: ${response.statusText}`);
    }

    const bytes = new Uint8Array(await response.arrayBuffer());
    return deserializeDatabaseAsync(bytes);
  })();

  setCachedDbPromise(
    nextPromise.catch((error) => {
      globalThis.__mjeksiaWebDbPromise = undefined;
      throw error;
    }),
  );
  return getCachedDbPromise()!;
}

export const webDrizzleDb = drizzle(
  async (query, params, method) => {
    const db = await getWebSQLiteDatabase();
    const statement = await db.prepareAsync(query);

    try {
      const bindParams = Array.isArray(params)
        ? params
        : params && typeof params === "object"
          ? Object.values(params)
          : [];
      const result = await statement.executeAsync(bindParams);

      if (method === "run") {
        return { rows: [] };
      }

      if (method === "get") {
        const first = await result.getFirstAsync();
        return { rows: (first as any) ?? undefined };
      }

      if (method === "values") {
        const rows = await result.getAllAsync();
        return {
          rows: rows.map((row: any) =>
            Array.isArray(row) ? row : Object.values(row),
          ),
        };
      }

      return { rows: await result.getAllAsync() };
    } finally {
      await statement.finalizeAsync();
    }
  },
  { schema },
);
