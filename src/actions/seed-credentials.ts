"use server";

import { db } from "@/db/db";
import { courseCertificates, badgeTemplates, courses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function seedCredentialTemplates() {
    try {
        // 1. Create Course Certificate Templates for all courses
        const allCourses = await db.select().from(courses);

        for (const course of allCourses) {
            // Check if already exists
            const existing = await db.select().from(courseCertificates).where(eq(courseCertificates.courseId, course.id)).limit(1);
            if (existing.length === 0) {
                await db.insert(courseCertificates).values({
                    courseId: course.id,
                    title: `Certificate of Course Excellence`,
                    description: `This certifies that the student has demonstrated exceptional mastery of the curriculum and practical requirements for ${course.name}.`,
                    signatureName: "Prof. John Academic",
                    signatureTitle: "University Registrar",
                    minCompletionThreshold: 100,
                    isActive: true
                });
            }
        }

        // 2. Create Global Badge Templates
        const badges = [
            { name: "Top Performer", description: "Awarded for scoring in the top 5% of your class.", imageUrl: null, criteria: "Score 90% or higher in final assessments." },
            { name: "Fast Learner", description: "Awarded for completing a course in record time.", imageUrl: null, criteria: "Complete all modules within 7 days of enrollment." },
            { name: "Community Contributor", description: "Awarded for active participation in global forums.", imageUrl: null, criteria: "Post 10 or more helpful replies in course forums." },
            { name: "Code Ninja", description: "Mastery in Computer Science and Programming modules.", imageUrl: null, criteria: "Complete all CS-coded courses with a Distinction." }
        ];

        for (const badge of badges) {
            const existing = await db.select().from(badgeTemplates).where(eq(badgeTemplates.name, badge.name)).limit(1);
            if (existing.length === 0) {
                await db.insert(badgeTemplates).values(badge);
            }
        }

        revalidatePath("/student/achievements");
        return { success: true, message: "Credential templates seeded successfully" };
    } catch (error) {
        console.error("Seeding error:", error);
        return { success: false, error: "Failed to seed templates" };
    }
}
