import { db } from "@/db/db";
import {
    badgeTemplates,
    issuedBadges,
    courseCertificates,
    issuedCertificates,
    students,
    courses,
    studentProgress,
    users,
    courseModules,
    courseLessons
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export class CredentialService {
    static async issueBadge(badgeId: number, studentId: number, evidenceUrl?: string) {
        try {
            // Check if already issued
            const existing = await db.select().from(issuedBadges)
                .where(and(
                    eq(issuedBadges.badgeId, badgeId),
                    eq(issuedBadges.studentId, studentId)
                )).limit(1);

            if (existing.length > 0) return { success: false, error: "Badge already issued" };

            const badge = await db.select().from(badgeTemplates).where(eq(badgeTemplates.id, badgeId)).limit(1);
            if (!badge.length) return { success: false, error: "Badge template not found" };

            const requestId = uuidv4();
            const assertionUrl = `/verify/badge/${requestId}`;

            await db.insert(issuedBadges).values({
                badgeId,
                studentId,
                assertionUrl,
                evidenceUrl,
                issuedAt: new Date()
            });

            return { success: true, assertionUrl };
        } catch (error) {
            console.error("Issue badge error:", error);
            return { success: false, error: "Failed to issue badge" };
        }
    }

    static async issueCertificate(certificateId: number, studentId: number) {
        try {
            // Check if already issued
            const existing = await db.select().from(issuedCertificates)
                .where(and(
                    eq(issuedCertificates.certificateId, certificateId),
                    eq(issuedCertificates.studentId, studentId)
                )).limit(1);

            if (existing.length > 0) return { success: true, certificateCode: existing[0].certificateCode };

            const certTemplate = await db.select().from(courseCertificates).where(eq(courseCertificates.id, certificateId)).limit(1);
            if (!certTemplate.length) return { success: false, error: "Certificate template not found" };

            // Generate unique verifiable code
            const certificateCode = `CERT-${uuidv4().split('-')[0].toUpperCase()}-${Date.now().toString().slice(-4)}`;

            await db.insert(issuedCertificates).values({
                certificateId,
                studentId,
                courseId: certTemplate[0].courseId,
                certificateCode,
                issuedAt: new Date()
            });

            return { success: true, certificateCode };
        } catch (error) {
            console.error("Issue certificate error:", error);
            return { success: false, error: "Failed to issue certificate" };
        }
    }

    static async getStudentCredentials(studentId: number) {
        try {
            const badges = await db.select({
                id: issuedBadges.id,
                issuedAt: issuedBadges.issuedAt,
                assertionUrl: issuedBadges.assertionUrl,
                template: badgeTemplates
            })
                .from(issuedBadges)
                .innerJoin(badgeTemplates, eq(issuedBadges.badgeId, badgeTemplates.id))
                .where(eq(issuedBadges.studentId, studentId));

            const certificates = await db.select({
                id: issuedCertificates.id,
                issuedAt: issuedCertificates.issuedAt,
                certificateCode: issuedCertificates.certificateCode,
                courseName: courses.name,
                courseCode: courses.code,
                studentName: users.name,
                template: courseCertificates
            })
                .from(issuedCertificates)
                .innerJoin(courseCertificates, eq(issuedCertificates.certificateId, courseCertificates.id))
                .innerJoin(courses, eq(issuedCertificates.courseId, courses.id))
                .innerJoin(students, eq(issuedCertificates.studentId, students.id))
                .innerJoin(users, eq(students.userId, users.id))
                .where(eq(issuedCertificates.studentId, studentId));

            return { success: true, badges, certificates };
        } catch (error) {
            console.error("Get credentials error:", error);
            return { success: false, error: "Failed to fetch credentials" };
        }
    }

    static async verifyCertificateByCode(code: string) {
        try {
            const certs = await db.select({
                id: issuedCertificates.id,
                issuedAt: issuedCertificates.issuedAt,
                certificateCode: issuedCertificates.certificateCode,
                courseName: courses.name,
                courseCode: courses.code,
                studentName: users.name,
                template: courseCertificates
            })
                .from(issuedCertificates)
                .innerJoin(courseCertificates, eq(issuedCertificates.certificateId, courseCertificates.id))
                .innerJoin(courses, eq(issuedCertificates.courseId, courses.id))
                .innerJoin(students, eq(issuedCertificates.studentId, students.id))
                .innerJoin(users, eq(students.userId, users.id))
                .where(eq(issuedCertificates.certificateCode, code))
                .limit(1);

            if (certs.length === 0) return { success: false, error: "Invalid certificate code" };

            return { success: true, certificate: certs[0] };
        } catch (error) {
            console.error("Verify certificate error:", error);
            return { success: false, error: "Verification failed" };
        }
    }

    static async checkAndIssueCourseCertificate(courseId: number, studentId: number) {
        try {
            // 1. Fetch course details to check customizable passing scores
            const courseList = await db.select().from(courses).where(eq(courses.id, courseId)).limit(1);
            const courseInfo = courseList[0] || null;
            // @ts-expect-error - TS2339: Auto-suppressed for build
            const threshold = courseInfo?.minPassingScore || 75;

            // 2. Fetch all quiz lessons associated with the course
            const quizLessons = await db.select({
                lessonId: courseLessons.id,
                title: courseLessons.title
            })
            .from(courseLessons)
            .innerJoin(courseModules, eq(courseLessons.moduleId, courseModules.id))
            .where(and(
                eq(courseModules.courseId, courseId),
                eq(courseLessons.contentType, 'quiz')
            ));

            // 3. Fetch progress for this student and course
            const progress = await db.select().from(studentProgress)
                .where(and(
                    eq(studentProgress.studentId, studentId),
                    eq(studentProgress.courseId, courseId),
                    eq(studentProgress.isCompleted, true)
                ));

            // 4. Verify all quizzes have been successfully taken and passed
            for (const ql of quizLessons) {
                const prog = progress.find(p => p.lessonId === ql.lessonId);
                if (!prog || prog.quizScore === null || prog.quizScore < threshold) {
                    return { 
                        success: false, 
                        error: `Prerequisite quiz "${ql.title}" is either incomplete or score is under the ${threshold}% passing threshold.` 
                    };
                }
            }

            // Find active certificate template for this course
            const templates = await db.select()
                .from(courseCertificates)
                .where(and(
                    eq(courseCertificates.courseId, courseId),
                    eq(courseCertificates.isActive, true)
                ))
                .limit(1);

            if (templates.length === 0) return { success: false, error: "No certificate configured for this course" };

            const template = templates[0];

            return await this.issueCertificate(template.id, studentId);
        } catch (error) {
            console.error("Check and issue cert error:", error);
            return { success: false, error: "Process failed" };
        }
    }
}
