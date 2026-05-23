import { db } from "@/db/db";
import { 
    results, 
    enrollments, 
    students, 
    academicSessions, 
    annualSummaries,
    systemSettings
} from "@/db/schema";
import { eq, and, sql, desc, inArray } from "drizzle-orm";
import { redis } from "@/lib/redis";
import { CommentService } from "@/services/CommentService";

export class RankingService {
    /**
     * Contexts: 'Mid-Term', 'End-of-Term', 'Mock', etc.
     */
    
    /**
     * Batch computes subject positions for a class cohort and caches/stores them.
     */
    static async computeBatchPositions(courseId: number, level: number, groupId: number | undefined, semester: number, sessionId: number, context: string) {
        const [session] = await db.select().from(academicSessions).where(eq(academicSessions.id, sessionId)).limit(1);
        if (!session) return;

        let query = db.select({
            resultId: results.id,
            studentId: enrollments.studentId,
            score: results.totalScore, // In reality, you'd calculate CA score for Mid-Term, Total for End-of-Term
        })
        .from(results)
        .innerJoin(enrollments, eq(results.enrollmentId, enrollments.id))
        .innerJoin(students, eq(enrollments.studentId, students.id))
        .where(and(
            eq(enrollments.courseId, courseId),
            eq(enrollments.academicYear, session.name),
            eq(enrollments.semester, semester),
            eq(students.currentLevel, level)
        )) as any;

        if (groupId) {
            query = query.where(eq(students.groupId, groupId));
        }

        const allResults = await query;
        if (allResults.length === 0) return;

        const sorted = [...allResults].sort((a, b) => parseFloat(b.score?.toString() || '0') - parseFloat(a.score?.toString() || '0'));
        
        const rankData = [];
        let currentRank = 1;

        for (let i = 0; i < sorted.length; i++) {
            if (i > 0 && sorted[i].score !== sorted[i-1].score) {
                currentRank = i + 1;
            }
            const posString = `${currentRank}/${sorted.length}`;
            rankData.push({
                studentId: sorted[i].studentId,
                position: posString
            });

            // Cache immediately to Redis for single-queries
            const cacheKey = `rank:session_${sessionId}:term_${semester}:context_${context.replace(/\s/g, '_')}:course_${courseId}:student_${sorted[i].studentId}`;
            await redis.set(cacheKey, JSON.stringify({ position: posString }), "EX", 60 * 60 * 24 * 7); // Cache for 7 days
        }
        
        return rankData;
    }

    /**
     * Gets a single student's subject position instantly.
     */
    static async getStudentSubjectPosition(studentId: number, courseId: number, semester: number, sessionId: number, context: string) {
        const cacheKey = `rank:session_${sessionId}:term_${semester}:context_${context.replace(/\s/g, '_')}:course_${courseId}:student_${studentId}`;
        const cached = await redis.get(cacheKey);
        
        if (cached) {
            return JSON.parse(cached);
        }

        // Fallback: If not cached, we'd theoretically have to trigger a batch compute or fetch from DB
        return { position: null };
    }

    /**
     * Calculates and updates subject positions for all students in a cohort.
     * @param courseId The course/subject ID
     * @param sessionId The academic session ID
     * @param semester 1, 2, or 3
     */
    static async calculateSubjectRankings(courseId: number, sessionId: number, semester: number) {
        const [session] = await db.select().from(academicSessions).where(eq(academicSessions.id, sessionId)).limit(1);
        if (!session) return;

        // 1. Fetch all students enrolled in this subject for this session/term
        const allResults = await db.select({
            resultId: results.id,
            studentId: enrollments.studentId,
            score: results.totalScore,
            groupId: students.groupId,
            level: students.currentLevel
        })
        .from(results)
        .innerJoin(enrollments, eq(results.enrollmentId, enrollments.id))
        .innerJoin(students, eq(enrollments.studentId, students.id))
        .where(and(
            eq(enrollments.courseId, courseId),
            eq(enrollments.academicYear, session.name),
            eq(enrollments.semester, semester),
            eq(results.isApproved, true)
        ));

        if (allResults.length === 0) return;

        // 2. Determine Scope (Class vs Level)
        const isAnnualT3 = semester === 3;

        // Local helper for ranking
        const computeRanks = (list: typeof allResults) => {
            const sorted = [...list].sort((a, b) => parseFloat(b.score?.toString() || '0') - parseFloat(a.score?.toString() || '0'));
            const ranks = new Map<number, string>();
            let currentRank = 1;
            
            for (let i = 0; i < sorted.length; i++) {
                // Handle ties
                if (i > 0 && sorted[i].score === sorted[i-1].score) {
                    // Same rank as previous
                } else {
                    currentRank = i + 1;
                }
                ranks.set(sorted[i].resultId, `${currentRank}/${sorted.length}`);
            }
            return ranks;
        };

        const updateBatch: { id: number, rankClass?: string, rankLevel?: string }[] = [];

        if (isAnnualT3) {
            // Rank across the whole level
            const levels = Array.from(new Set(allResults.map(r => r.level).filter(Boolean)));
            for (const level of levels) {
                const levelCohort = allResults.filter(r => r.level === level);
                const resultsRanks = computeRanks(levelCohort);
                
                resultsRanks.forEach((rank, id) => {
                    updateBatch.push({ id, rankLevel: rank });
                });
            }
        } else {
            // Rank within the Class Arm (Group)
            const groups = Array.from(new Set(allResults.map(r => r.groupId).filter(Boolean)));
            for (const groupId of groups) {
                const classCohort = allResults.filter(r => r.groupId === groupId);
                const resultsRanks = computeRanks(classCohort);
                
                resultsRanks.forEach((rank, id) => {
                    updateBatch.push({ id, rankClass: rank });
                });
            }
        }

        // 3. Batch Update Results
        for (const item of updateBatch) {
            await db.update(results)
                .set({ 
                    rankClass: item.rankClass, 
                    rankLevel: item.rankLevel 
                })
                .where(eq(results.id, item.id));
        }
    }

    /**
     * Calculates the Overall Annual Result (Simple Average of T1-T3)
     */
    static async processAnnualResults(sessionId: number, level: number) {
        const [session] = await db.select().from(academicSessions).where(eq(academicSessions.id, sessionId)).limit(1);
        if (!session) return;

        const settings = await db.select().from(systemSettings);
        const isProrationDefault = settings.find(s => s.settingKey === 'grading.default_proration')?.settingValue === 'true';

        // 1. Fetch all student results for this session/level across all 3 terms
        const allStudentEnrollments = await db.select({
            studentId: enrollments.studentId,
            score: results.totalScore,
            term: enrollments.semester
        })
        .from(enrollments)
        .innerJoin(results, eq(enrollments.id, results.enrollmentId))
        .innerJoin(students, eq(enrollments.studentId, students.id))
        .where(and(
            eq(enrollments.academicYear, session.name),
            eq(students.currentLevel, level),
            eq(results.isApproved, true)
        ));

        // 2. Aggregate per student
        const studentMap = new Map<number, { scores: number[] }>();
        allStudentEnrollments.forEach(e => {
            const sid = e.studentId as number;
            if (!studentMap.has(sid)) studentMap.set(sid, { scores: [] });
            studentMap.get(sid)!.scores.push(parseFloat(e.score?.toString() || '0'));
        });

        const studentsData: { studentId: number, average: number }[] = [];

        for (const [sid, data] of studentMap.entries()) {
            if (data.scores.length === 0) continue;
            const sum = data.scores.reduce((a, b) => a + b, 0);
            
            // If proration is OFF, we use a fixed divisor (3 terms)
            // If proration is ON, we use the actual number of terms present
            const divisor = isProrationDefault ? data.scores.length : 3;
            const average = sum / divisor;
            
            studentsData.push({ studentId: sid, average });

            // Generate automated comment
            const automatedComment = await CommentService.generateComment(average);

            // Upsert Annual Summary
            const [existing] = await db.select().from(annualSummaries).where(and(
                eq(annualSummaries.studentId, sid),
                eq(annualSummaries.sessionId, sessionId)
            )).limit(1);

            if (existing) {
                await db.update(annualSummaries)
                    .set({ 
                        totalScore: sum.toString(), 
                        averageScore: average.toString(),
                        // Only overwrite if it's currently empty (allows principal manual override)
                        principalComment: existing.principalComment || automatedComment
                    })
                    .where(eq(annualSummaries.id, existing.id));
            } else {
                await db.insert(annualSummaries).values({
                    studentId: sid,
                    sessionId: sessionId,
                    totalScore: sum.toString(),
                    averageScore: average.toString(),
                    principalComment: automatedComment
                });
            }
        }

        // 3. Rank Annual Results within the Level
        const sorted = [...studentsData].sort((a, b) => b.average - a.average);
        for (let i = 0; i < sorted.length; i++) {
            const rank = `${i + 1}/${sorted.length}`;
            await db.update(annualSummaries)
                .set({ rankLevel: rank })
                .where(and(
                    eq(annualSummaries.studentId, sorted[i].studentId),
                    eq(annualSummaries.sessionId, sessionId)
                ));
        }
    }
}
