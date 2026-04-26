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
  // Use runAsync instead of execAsync because execAsync on web WASM can throw
  // SQLITE_DONE (101) "no more rows available" for DDL that produces no result set.
  await db.runAsync(
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

  await db.runAsync(
    `CREATE TABLE IF NOT EXISTS user_answers (
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
    );`,
  );
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
        const asset = await Asset.fromModule(
          require("@/assets/data.db"),
        ).downloadAsync();

        if (!asset.localUri) {
          throw new Error(
            "Failed to resolve bundled questions database asset.",
          );
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

export async function initializeWebDb() {
  try {
    await getWebSQLiteDatabase();
    return { success: true as const, error: undefined };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

function isSqliteDoneError(err: unknown): boolean {
  if (err instanceof Error) {
    return err.message.includes("101") || err.message.includes("no more rows");
  }
  return false;
}

export const webDrizzleDb = drizzle(
  async (query, params, method) => {
    const db = await getWebSQLiteDatabase();
    const statement = await db.prepareAsync(query);

    try {
      let result: any;

      if (Array.isArray(params) && params.length === 0) {
        result = await statement.executeAsync();
      } else if (Array.isArray(params)) {
        result = await statement.executeAsync(...params);
      } else if (params && typeof params === "object") {
        const entries = Object.entries(params);
        const hasOnlyNumericKeys =
          entries.length > 0 && entries.every(([key]) => /^\d+$/.test(key));

        if (hasOnlyNumericKeys) {
          const orderedValues = entries
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([, value]) => value as any);
          result = await statement.executeAsync(...orderedValues);
        } else {
          result = await statement.executeAsync(
            params as Record<string, any>,
          );
        }
      } else if (typeof params === "undefined") {
        result = await statement.executeAsync();
      } else {
        result = await statement.executeAsync(params as any);
      }

      // Web sometimes returns rows directly instead of a statement result object.
      const isDirectRows = Array.isArray(result);

      const safeGetAll = async (): Promise<any[]> => {
        if (isDirectRows) return result;
        try {
          return await result.getAllAsync();
        } catch (err) {
          if (isSqliteDoneError(err)) return [];
          throw err;
        }
      };

      const safeGetFirst = async (): Promise<any> => {
        if (isDirectRows) return result[0] ?? undefined;
        try {
          return (await result.getFirstAsync()) ?? undefined;
        } catch (err) {
          if (isSqliteDoneError(err)) return undefined;
          throw err;
        }
      };

      if (method === "run") {
        return { rows: [] };
      }

      if (method === "get") {
        const first = await safeGetFirst();
        return { rows: first };
      }

      if (method === "values") {
        const rows = await safeGetAll();
        return {
          rows: rows.map((row: any) =>
            Array.isArray(row) ? row : Object.values(row),
          ),
        };
      }

      return { rows: await safeGetAll() };
    } finally {
      try {
        await statement.finalizeAsync();
      } catch {
        // Ignore finalize errors so they don't mask real query errors.
      }
    }
  },
  { schema },
);
