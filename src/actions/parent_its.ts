"use server";

import { db } from "@/db/db";
import { 
    itsSessions, 
    lessons, 
    curriculumTopics, 
    itsResponses,
    itsQuestions,
    students
} from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";

export async function getStudentITSAnalytics(studentId: number) {
    try {
        // Fetch recent ITS sessions for the student
        const sessions = await db.select({
            session: itsSessions,
            lesson: lessons,
            topic: curriculumTopics
        })
        .from(itsSessions)
        .innerJoin(lessons, eq(itsSessions.lessonId, lessons.id))
        .innerJoin(curriculumTopics, eq(lessons.topicId, curriculumTopics.id))
        .where(eq(itsSessions.studentId, studentId))
        .orderBy(desc(itsSessions.startedAt))
        .limit(10);

        // Calculate aggregate stats
        const avgEngagement = sessions.reduce((acc, s) => acc + (s.session.engagementScore || 0), 0) / (sessions.length || 1);

        // Fetch assessment performance
        const responses = await db.select({
            id: itsResponses.id,
            isCorrect: itsResponses.isCorrect,
            question: itsQuestions.question,
            lesson: lessons.title
        })
        .from(itsResponses)
        .innerJoin(itsQuestions, eq(itsResponses.questionId, itsQuestions.id))
        .innerJoin(lessons, eq(itsQuestions.lessonId, lessons.id))
        .where(eq(itsResponses.studentId, studentId))
        .orderBy(desc(itsResponses.createdAt))
        .limit(20);

        return {
            sessions,
            avgEngagement: Math.round(avgEngagement),
            totalMinutes: sessions.reduce((acc, s) => acc + (s.lesson.durationMinutes || 0), 0),
            assessmentScore: responses.length > 0 ? Math.round((responses.filter(r => r.isCorrect).length / responses.length) * 100) : 0,
            responses
        };
    } catch (error) {
        console.error("Parent ITS Analytics Error:", error);
        return null;
    }
}
