"use server";

import { db } from "@/db/db";
import { 
    lessonNotes, 
    lessonNoteApprovers, 
    academicSessions, 
    courses, 
    users
} from "@/db/schema";
import { eq } from "drizzle-orm";

export async function seedLmsData() {
    try {
        console.log("Starting LMS Seeding...");

        // 1. Ensure an academic session exists
        let [session] = await db.select().from(academicSessions).where(eq(academicSessions.isCurrent, true)).limit(1);
        if (!session) {
            const [res] = await db.insert(academicSessions).values({
                name: "2025/2026 Academic Session",
                isCurrent: true,
                currentSemester: '1',
                status: 'active'
            } as any);
            session = { id: res.insertId } as any;
        }

        // 2. Identify a teacher and a supervisor
        const staffUsers = await db.select().from(users).where(eq(users.role, 'staff')).limit(2);
        const adminUsers = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);

        if (staffUsers.length < 2 || adminUsers.length === 0) {
            return { 
                success: false, 
                error: "Insufficient users for seeding. Please ensure at least 2 staff and 1 admin are registered in the system." 
            };
        }

        const teacher1 = staffUsers[0];
        const teacher2 = staffUsers[1];
        const supervisor = adminUsers[0];

        // 3. Get courses
        const courseList = await db.select().from(courses).limit(5);
        if (courseList.length === 0) {
            return { success: false, error: "No courses found. Please ensure courses are seeded first." };
        }

        // 4. Setup Supervisor Assignment (Map Supervisor to Teacher 1)
        await db.insert(lessonNoteApprovers).values({
            supervisorId: supervisor.id,
            targetUserId: teacher1.id,
        }).onDuplicateKeyUpdate({ set: { supervisorId: supervisor.id } });

        // 5. Seed Lesson Notes with diverse states
        const noteSeeds = [
            {
                teacherId: teacher1.id,
                courseId: courseList[0].id,
                sessionId: session.id,
                termId: 1,
                weekNumber: 1,
                title: `Introduction to ${courseList[0].name}`,
                objectives: "1. Define core terminology. 2. Understand historical milestones.",
                contentBody: `
                    <h2>Lesson Overview</h2>
                    <p>Welcome to the first week of <strong>${courseList[0].name}</strong>. In this module, we will explore the foundations that underpin modern practices in this field.</p>
                    <h3>Learning Outcomes</h3>
                    <ul>
                        <li>Recall the primary inventors/founders.</li>
                        <li>Differentiate between classical and modern approaches.</li>
                    </ul>
                `,
                status: 'approved' as const,
                isPublished: true,
                scheduledAt: new Date()
            },
            {
                teacherId: teacher1.id,
                courseId: courseList[1 % courseList.length].id,
                sessionId: session.id,
                termId: 1,
                weekNumber: 2,
                title: `Advanced Concepts in ${courseList[1 % courseList.length].name}`,
                objectives: "Master complex derivation and practical application of theories.",
                contentBody: "<h2>Higher Level Module</h2><p>Expanding on the basics...</p>",
                status: 'pending' as const,
                isPublished: false
            },
            {
                teacherId: teacher2.id,
                courseId: courseList[2 % courseList.length].id,
                sessionId: session.id,
                termId: 1,
                weekNumber: 1,
                title: `Basic Principles: ${courseList[2 % courseList.length].name}`,
                objectives: "Understand the ethical frameworks governing the subject.",
                contentBody: "<h2>Drafting Phase</h2><p>This content is still being developed by the teacher.</p>",
                status: 'draft' as const,
                isPublished: false
            },
            {
                teacherId: teacher1.id,
                courseId: courseList[3 % courseList.length].id,
                sessionId: session.id,
                termId: 1,
                weekNumber: 3,
                title: `Case Studies in ${courseList[3 % courseList.length].name}`,
                objectives: "Analyze real-world scenarios and provide solutions.",
                contentBody: "<h2>Module 3</h2><p>Analyzing the 2024 global shift...</p>",
                status: 'rejected' as const,
                supervisorId: supervisor.id,
                supervisorFeedback: "The case study chosen is slightly outdated. Please use the 2025 revision instead.",
                isPublished: false
            }
        ];

        // Insert notes
        for (const note of noteSeeds) {
            await db.insert(lessonNotes).values(note as any);
        }

        // 6. Create an H5P Lesson reference in courses (Mock)
        // We find the first lesson and update it to h5p or create one
        // (This would typically be done in the CourseEditor)

        console.log("LMS Seeding Completed Successfully.");
        return { success: true };
    } catch (error) {
        console.error("LMS Seeding Failed:", error);
        return { success: false, error: (error as Error).message };
    }
}
