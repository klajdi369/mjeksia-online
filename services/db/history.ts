import { asc, avg, count, desc, eq, max, sql, sum } from "drizzle-orm";
import { questions, testSessions, userAnswers } from "./schema";
import { DbType } from "./types";

function latestAnswersSubquery(db: DbType) {
  return db
    .select({
      questionId: userAnswers.questionId,
      latestAnswerId: max(userAnswers.id).as("latest_answer_id"),
    })
    .from(userAnswers)
    .groupBy(userAnswers.questionId)
    .as("latest_answers");
}

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

  const latestAnswers = latestAnswersSubquery(db);
  const activeMistakesStats = await db
    .select({
      activeMistakes: count(userAnswers.id),
    })
    .from(userAnswers)
    .innerJoin(latestAnswers, eq(userAnswers.id, latestAnswers.latestAnswerId))
    .where(eq(userAnswers.is_correct, false));

  const testCount = sessionStats[0]?.totalTests || 0;
  const avgScore = sessionStats[0]?.averageScore || 0;

  const timeSpent = Number(answersStats[0]?.totalTimeSpentSeconds || 0);
  const totalAnswers = answersStats[0]?.totalAnswers || 0;
  const correctAnswers = Number(answersStats[0]?.correctAnswers || 0);
  const activeMistakes = activeMistakesStats[0]?.activeMistakes || 0;

  const accuracyRate = totalAnswers > 0 ? correctAnswers / totalAnswers : 0;

  return {
    totalTests: testCount,
    averageScore: Math.round(Number(avgScore)),
    totalTimeSpentSeconds: timeSpent,
    accuracyRate,
    correctAnswers,
    totalAnswers,
    activeMistakes,
  };
}

export async function getAllTestSessions(db: DbType) {
  return await db
    .select()
    .from(testSessions)
    .orderBy(desc(testSessions.createdAt));
}

export async function getTestSessionsSimple(db: DbType) {
  return await getAllTestSessions(db);
}

export async function getTestSessionDetails(db: DbType, sessionId: number) {
  const rows = await db
    .select()
    .from(testSessions)
    .where(eq(testSessions.id, sessionId))
    .limit(1);
  const session = rows[0];

  if (!session) return null;

  const answers = await db
    .select({
      userAnswer: userAnswers,
      question: questions,
    })
    .from(userAnswers)
    .innerJoin(questions, eq(userAnswers.questionId, questions.id))
    .where(eq(userAnswers.sessionId, sessionId))
    .orderBy(asc(userAnswers.id));

  return {
    ...session,
    answers,
  };
}

export async function getUserMistakes(db: DbType) {
  const latestAnswers = latestAnswersSubquery(db);

  // Get questions whose latest saved answer is incorrect.
  return await db
    .select({
      userAnswer: userAnswers,
      question: questions,
    })
    .from(userAnswers)
    .innerJoin(latestAnswers, eq(userAnswers.id, latestAnswers.latestAnswerId))
    .innerJoin(questions, eq(userAnswers.questionId, questions.id))
    .where(eq(userAnswers.is_correct, false))
    .orderBy(desc(userAnswers.id));
}

export async function getUniqueUserMistakes(db: DbType) {
  return await getUserMistakes(db);
}
