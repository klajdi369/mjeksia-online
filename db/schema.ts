import { int, real, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

export const questions = sqliteTable(
  "questions",
  {
    // Using the newer builder style (preferred for 2026)
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

    // Using .$type for strict literal types
    answer: text("answer").$type<"A" | "B" | "C" | "D">().notNull(),
    explanation: text("explanation").notNull(),
    reasoning: text("reasoning").notNull(),
  },
  (table) => [unique("unique_exam_question").on(table.exam_title, table.subId)]
);

export const math_svgs = sqliteTable("math_svgs", {
  hash: text("hash").primaryKey(),
  xml: text("xml").notNull(),
  w: real("w").notNull(),
  h: real("h").notNull(),
  v: real("v").notNull(),
});
