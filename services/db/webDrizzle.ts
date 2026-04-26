import * as schema from "@/services/db/schema";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import { deserializeDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";
import { Asset } from "expo-asset";

declare global {
  // Keep a single web SQLite connection across Fast Refresh/module reloads.
  // eslint-disable-next-line no-var
  var __mjeksiaWebDbPromise: Promise<SQLiteDatabase> | undefined;
  // Ensure schema bootstrap runs even when DB promise already exists.
  // eslint-disable-next-line no-var
  var __mjeksiaWebDbReadyPromise: Promise<SQLiteDatabase> | undefined;
}

const getCachedDbPromise = () => globalThis.__mjeksiaWebDbPromise;
const setCachedDbPromise = (promise: Promise<SQLiteDatabase>) => {
  globalThis.__mjeksiaWebDbPromise = promise;
};

async function ensureWebAppTables(db: SQLiteDatabase) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS test_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
      time_left INTEGER,
      score INTEGER NOT NULL DEFAULT 0,
      total_questions INTEGER NOT NULL,
      is_completed INTEGER NOT NULL DEFAULT 0,
      topic TEXT,
      test_type TEXT DEFAULT 'mock'
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS user_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      selected_option TEXT,
      is_correct INTEGER NOT NULL,
      answered_at INTEGER,
      seconds_spend INTEGER DEFAULT 0,
      correct_option TEXT NOT NULL,
      FOREIGN KEY(session_id) REFERENCES test_sessions(id) ON DELETE CASCADE,
      FOREIGN KEY(question_id) REFERENCES questions(id)
    );
  `);
}

async function getWebSQLiteDatabase() {
  if (globalThis.__mjeksiaWebDbReadyPromise) {
    return globalThis.__mjeksiaWebDbReadyPromise;
  }

  const readyPromise = (async () => {
    const cachedPromise = getCachedDbPromise();
    const db =
      (await cachedPromise) ??
      (await (async () => {
        const asset = await Asset.fromModule(require("@/assets/data.db")).downloadAsync();

        if (!asset.localUri) {
          throw new Error("Failed to resolve bundled questions database asset.");
        }

        const response = await fetch(asset.localUri);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch bundled DB asset: ${response.statusText}`,
          );
        }

        const bytes = new Uint8Array(await response.arrayBuffer());
        const openedDb = await deserializeDatabaseAsync(bytes);
        setCachedDbPromise(Promise.resolve(openedDb));
        return openedDb;
      })());

    await ensureWebAppTables(db);
    return db;
  })();

  globalThis.__mjeksiaWebDbReadyPromise = readyPromise.catch((error) => {
    globalThis.__mjeksiaWebDbReadyPromise = undefined;
    globalThis.__mjeksiaWebDbPromise = undefined;
    throw error;
  });

  return globalThis.__mjeksiaWebDbReadyPromise;
}

export const webDrizzleDb = drizzle(
  async (query, params, method) => {
    const db = await getWebSQLiteDatabase();
    const statement = await db.prepareAsync(query);

    try {
      const executeWithBoundParams = async () => {
        if (Array.isArray(params)) {
          return await statement.executeAsync(...params);
        }

        if (params && typeof params === "object") {
          const entries = Object.entries(params);
          const hasOnlyNumericKeys =
            entries.length > 0 && entries.every(([key]) => /^\d+$/.test(key));

          if (hasOnlyNumericKeys) {
            const orderedValues = entries
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([, value]) => value as any);
            return await statement.executeAsync(...orderedValues);
          }

          return await statement.executeAsync(params as Record<string, any>);
        }

        if (typeof params === "undefined") {
          return await statement.executeAsync([]);
        }

        return await statement.executeAsync(params as any);
      };

      const result = await executeWithBoundParams();

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
