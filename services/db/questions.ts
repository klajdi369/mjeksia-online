import * as schema from "@/services/db/schema";
import { sql } from "drizzle-orm";
import { DbType } from "./types";

export async function getRandomQuestion(db: DbType) {
  const result = await db
    .select()
    .from(schema.questions)
    .orderBy(sql`RANDOM()`)
    .limit(1);

  return result;
}

export async function loadNQuestions(db: DbType, number: number) {
  const result = await db
    .select()
    .from(schema.questions)
    .orderBy(sql`RANDOM()`)
    .limit(number);

  return result;
}
