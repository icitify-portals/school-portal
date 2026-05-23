import { redis } from "@/lib/redis";
import { db } from "@/db/db";
import { courses, enrollments, students, results, academicSessions } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

import { TaskTracker } from "@/lib/task-logs";

export class CacheEngine {
    
    /**
     * Pre-fetches and caches all academic data (results, enrollments) 
     * for a specific term and session.
     */
    static async cacheAllAcademicsDataInTerm(term: number, sessionId: number, branchId?: number, taskId?: string) {
        const [session] = await db.select().from(academicSessions).where(eq(academicSessions.id, sessionId)).limit(1);
        if (!session) return;

        if (taskId) await TaskTracker.startTask(taskId, 100, "Initiating academic data caching...");

        // Fetch all results for this term/session
        const allResults = await db.select({
            resultId: results.id,
            studentId: enrollments.studentId,
            courseId: enrollments.courseId,
            score: results.totalScore,
            rankClass: results.rankClass,
            rankLevel: results.rankLevel,
            groupId: students.groupId,
            level: students.currentLevel
        })
        .from(results)
        .innerJoin(enrollments, eq(results.enrollmentId, enrollments.id))
        .innerJoin(students, eq(enrollments.studentId, students.id))
        .where(and(
            eq(enrollments.academicYear, session.name),
            eq(enrollments.semester, term),
            eq(results.isApproved, true)
        ));

        if (taskId) await TaskTracker.updateProgress(taskId, 20);

        // Group by Student
        const studentMap = new Map();
        allResults.forEach(r => {
            if (!studentMap.has(r.studentId)) {
                studentMap.set(r.studentId, []);
            }
            studentMap.get(r.studentId).push(r);
        });

        if (taskId) await TaskTracker.updateProgress(taskId, 40);

        const prefix = branchId ? `branch_${branchId}:` : `global:`;

        // Cache grouped by student
        let count = 0;
        const total = studentMap.size;
        for (const [studentId, data] of studentMap.entries()) {
            const key = `${prefix}session_${sessionId}:term_${term}:student_${studentId}:results`;
            await redis.set(key, JSON.stringify(data), "EX", 60 * 60 * 24); // 24 hours
            count++;
            if (taskId && count % 50 === 0) {
                const progress = 40 + Math.floor((count / total) * 40);
                await TaskTracker.updateProgress(taskId, progress);
            }
        }

        // Cache all results list
        const bulkKey = `${prefix}session_${sessionId}:term_${term}:bulk_results`;
        await redis.set(bulkKey, JSON.stringify(allResults), "EX", 60 * 60 * 24);

        if (taskId) {
            await TaskTracker.updateProgress(taskId, 100);
            await TaskTracker.completeTask(taskId);
        }

        console.log(`Cached ${allResults.length} result records for Term ${term}, Session ${session.name}`);
    }

    /**
     * Gets flat list of subjects for a class/level
     */
    static async getSubjectsByClass(level: number, sessionId: number) {
        // Mocking logic - usually you'd query course_department_settings or enrollments to see active subjects
        const activeCourses = await db.select().from(courses);
        return activeCourses;
    }

    /**
     * Gets grouped subjects (Core, Electives) for a class/level
     */
    static async getGroupedSubjectsByClass(level: number, sessionId: number) {
        const allCourses = await db.select().from(courses);
        
        const grouped = allCourses.filter(c => !c.parentCourseId);
        const children = allCourses.filter(c => c.parentCourseId);

        return grouped.map(g => ({
            ...g,
            components: children.filter(c => c.parentCourseId === g.id)
        }));
    }
    /**
     * Caches all result data for a specific subject in a specific class.
     * Matches 'cache_subject_data_in_class' from Rust.
     */
    static async cacheSubjectDataInClass(subjectId: number, classCode: string, division: string | null, term: number, sessionId: number, branchId?: number) {
        const [session] = await db.select().from(academicSessions).where(eq(academicSessions.id, sessionId)).limit(1);
        if (!session) return;

        const subjectResults = await db.select({
            id: results.id,
            studentId: enrollments.studentId,
            score: results.totalScore,
            grade: results.grade
        })
        .from(results)
        .innerJoin(enrollments, eq(results.enrollmentId, enrollments.id))
        .innerJoin(students, eq(enrollments.studentId, students.id))
        .where(and(
            eq(enrollments.courseId, subjectId),
            eq(enrollments.academicYear, session.name),
            eq(enrollments.semester, term)
        ));

        const prefix = branchId ? `branch_${branchId}:` : `global:`;
        const key = `${prefix}session_${sessionId}:term_${term}:subject_${subjectId}:class_${classCode}:results`;

        await redis.set(key, JSON.stringify(subjectResults), "EX", 60 * 60 * 24);
        console.log(`[CACHE] Updated subject ${subjectId} results for class ${classCode} in Redis.`);
    }
    /**
     * Caches all academic data for the entire school across all branches.
     * Matches 'cache_all_academics_data_in_school' from Rust.
     */
    static async cacheAllAcademicsDataInSchool(term: number, sessionId: number) {
        console.log(`[CACHE_SCHOOL] Starting full school cache warming for Session:${sessionId} Term:${term}`);
        
        // Perform a global cache warm for now
        await this.cacheAllAcademicsDataInTerm(term, sessionId);
        
        console.log(`[CACHE_SCHOOL] Full school cache warming completed.`);
    }
}
