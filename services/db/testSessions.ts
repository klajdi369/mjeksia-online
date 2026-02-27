import { desc } from "drizzle-orm";
import { testSessions, userAnswers } from "./schema";
import { DbType } from "./types";

type SessionData = {
  score: number;
  time_left: number;
  total_questions: number;
  is_completed: boolean;
};

type QuestionData = {
  questionId: number;
  selected_option: "A" | "B" | "C" | "D" | null;
  is_correct: boolean;
};

export async function getRecentTests(db: DbType, amount: number) {
  const result = await db.query.testSessions.findMany({
    orderBy: desc(testSessions.createdAt),
    limit: amount,
  });
  return result;
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
      })),
    );

    return insertedId;
  });
}
