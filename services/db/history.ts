import { avg, count, desc, eq, sql, sum } from "drizzle-orm";
import { questions, testSessions, userAnswers } from "./schema";
import { DbType } from "./types";

export async function getOverallStatistics(db: DbType) {
  // Aggregate data from testSessions
  const sessionsResult = await db
    .select({
      totalTests: count(testSessions.id),
      averageScore: avg(testSessions.score),
      totalTimeSpentSeconds: sum(userAnswers.seconds_spend), // Joined via userAnswers
    })
    .from(testSessions)
    .leftJoin(userAnswers, eq(testSessions.id, userAnswers.sessionId));

  // The above join might duplicate totalTimeSpent if we aren't careful, actually let's calculate them separately for simplicity or correctly with group by.

  // Better approach:
  const sessionStats = await db
    .select({
      totalTests: count(testSessions.id),
      averageScore: avg(testSessions.score),
    })
    .from(testSessions)
    .where(eq(testSessions.is_completed, true));

  const answersStats = await db
    .select({
      totalTimeSpentSeconds: sum(userAnswers.seconds_spend),
      totalAnswers: count(userAnswers.id),
      correctAnswers: sum(
        sql`CASE WHEN ${userAnswers.is_correct} THEN 1 ELSE 0 END`,
      ),
    })
    .from(userAnswers);

  const testCount = sessionStats[0]?.totalTests || 0;
  const avgScore = sessionStats[0]?.averageScore || 0;

  const timeSpent = Number(answersStats[0]?.totalTimeSpentSeconds || 0);
  const totalAnswers = answersStats[0]?.totalAnswers || 0;
  const correctAnswers = Number(answersStats[0]?.correctAnswers || 0);

  const accuracyRate = totalAnswers > 0 ? correctAnswers / totalAnswers : 0;

  return {
    totalTests: testCount,
    averageScore: Math.round(Number(avgScore)),
    totalTimeSpentSeconds: timeSpent,
    accuracyRate,
    correctAnswers,
    totalAnswers,
  };
}

export async function getAllTestSessions(db: DbType) {
  return await db.query.testSessions.findMany({
    orderBy: desc(testSessions.createdAt),
    with: {
      // we might not have relations defined, let's keep it simple
    },
  });
}

// We'll define relations in schema.ts if needed, but for now we can just select direct.
export async function getTestSessionsSimple(db: DbType) {
  return await db
    .select()
    .from(testSessions)
    .orderBy(desc(testSessions.createdAt));
}

export async function getTestSessionDetails(db: DbType, sessionId: number) {
  const session = await db.query.testSessions.findFirst({
    where: eq(testSessions.id, sessionId),
  });

  if (!session) return null;

  const answers = await db
    .select({
      userAnswer: userAnswers,
      question: questions,
    })
    .from(userAnswers)
    .innerJoin(questions, eq(userAnswers.questionId, questions.id))
    .where(eq(userAnswers.sessionId, sessionId));

  return {
    ...session,
    answers,
  };
}

export async function getUserMistakes(db: DbType) {
  // Get all user answers that are incorrect, joined with the actual questions
  return await db
    .select({
      userAnswer: userAnswers,
      question: questions,
    })
    .from(userAnswers)
    .innerJoin(questions, eq(userAnswers.questionId, questions.id))
    .where(eq(userAnswers.is_correct, false))
    .orderBy(desc(userAnswers.answered_at));
}
