import { sql } from "drizzle-orm";
import { int, real, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

export const questions = sqliteTable(
  "questions",
  {
    id: int("id").primaryKey(),
    subId: int("subId").notNull(),
    exam_title: text("exam_title").notNull(),

    question_text: text("question_text").notNull(),
    table_content: text("table_content"),
    image: text("image"),

    option_a: text("option_a").notNull(),
    option_b: text("option_b").notNull(),
    option_c: text("option_c").notNull(),
    option_d: text("option_d").notNull(),

    answer: text("answer").$type<"A" | "B" | "C" | "D">().notNull(),
    explanation: text("explanation").notNull(),
    reasoning: text("reasoning").notNull(),
  },
  (table) => [unique("unique_exam_question").on(table.exam_title, table.subId)],
);

export const testSessions = sqliteTable("test_sessions", {
  id: int("id").primaryKey({ autoIncrement: true }),
  createdAt: int("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s','now'))`),

  time_left: int("time_left"),

  score: int("score").notNull().default(0),
  total_questions: int("total_questions").notNull(),
  is_completed: int("is_completed", { mode: "boolean" })
    .notNull()
    .default(false),
});

export const userAnswers = sqliteTable("user_answers", {
  id: int("id").primaryKey({ autoIncrement: true }),
  sessionId: int("session_id")
    .notNull()
    .references(() => testSessions.id, { onDelete: "cascade" }),
  questionId: int("question_id")
    .notNull()
    .references(() => questions.id),

  selected_option: text("selected_option").$type<
    "A" | "B" | "C" | "D" | null
  >(),
  is_correct: int("is_correct", { mode: "boolean" }).notNull(),
});

export const math_svgs = sqliteTable("math_svgs", {
  hash: text("hash").primaryKey(),
  xml: text("xml").notNull(),
  w: real("w").notNull(),
  h: real("h").notNull(),
  v: real("v").notNull(),
});
