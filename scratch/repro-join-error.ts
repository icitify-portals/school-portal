
import { db } from "../src/db/db";
import { lessonNotes, users, courses } from "../src/db/schema";
import { eq, desc } from "drizzle-orm";

async function reproduce() {
    try {
        console.log("Testing listPendingApprovals query...");
        const result = await db.select({
            id: lessonNotes.id,
            title: lessonNotes.title,
            teacherName: users.name,
            courseName: courses.name,
            week: lessonNotes.weekNumber,
            status: lessonNotes.status,
            createdAt: lessonNotes.createdAt
        })
        .from(lessonNotes)
        .innerJoin(users, eq(lessonNotes.teacherId, users.id))
        .innerJoin(courses, eq(lessonNotes.courseId, courses.id))
        .where(eq(lessonNotes.status, 'pending'))
        .orderBy(desc(lessonNotes.createdAt));
        
        console.log("Result count:", result.length);
        console.log("Success.");
    } catch (error) {
        console.error("REPRODUCTION FAILED:", error);
    }
    process.exit(0);
}

reproduce();
