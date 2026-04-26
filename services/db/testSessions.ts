import { desc } from "drizzle-orm";
import { testSessions, userAnswers } from "./schema";
import { DbType } from "./types";

type SessionData = {
  score: number;
  time_left: number;
  total_questions: number;
  is_completed: boolean;
  topic?: string | null;
  test_type?: "focus" | "mock";
};

type QuestionData = {
  questionId: number;
  selected_option: "A" | "B" | "C" | "D" | null;
  is_correct: boolean;
  answered_at?: number | null;
  seconds_spend: number;
  correct_option: "A" | "B" | "C" | "D";
};

export async function getRecentTests(db: DbType, amount: number) {
  return await db
    .select()
    .from(testSessions)
    .orderBy(desc(testSessions.createdAt))
    .limit(amount);
}

export async function insertTestSession(
  db: DbType,
  sessionData: SessionData,
  questionData: QuestionData[],
) {
  return await db.transaction(async (tx) => {
    const [{ insertedId }] = await tx
      .insert(testSessions)
      .values(sessionData)
      .returning({ insertedId: testSessions.id });

    await tx.insert(userAnswers).values(
      questionData.map((q) => ({
        sessionId: insertedId,
        questionId: q.questionId,
        selected_option: q.selected_option,
        is_correct: q.is_correct,
        answered_at: q.answered_at,
        seconds_spend: q.seconds_spend,
        correct_option: q.correct_option,
      })),
    );

    return insertedId;
  });
}
