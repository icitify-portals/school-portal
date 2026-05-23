
import { db } from "../src/db/db";
import { 
    lessonNotes, 
    courses, 
    staffProfiles, 
    academicSessions, 
    courseLecturers,
    assignments,
    quizzes,
    gradingConfigurations,
    users
} from "../src/db/schema";
import { eq, and, sql } from "drizzle-orm";

async function seedLifecycle() {
    try {
        console.log("🌱 Seeding Smart Lesson Note & CA Lifecycle Data...");

        // 1. Get Context
        const [course] = await db.select().from(courses).limit(1);
        const [staff] = await db.select().from(staffProfiles).limit(1);
        const [session] = await db.select().from(academicSessions).where(eq(academicSessions.isCurrent, true)).limit(1);
        
        if (!course || !staff || !session) {
            console.error("Missing baseline data (Course, Staff, or Session). Please ensure basic seeding is done.");
            return;
        }

        console.log(`Using Course: ${course.code}, Staff: ${staff.id}, Session: ${session.name}`);

        // 2. Ensure Assignment to Course
        const [existingLink] = await db.select().from(courseLecturers).where(and(
            eq(courseLecturers.courseId, course.id),
            eq(courseLecturers.staffId, staff.id),
            eq(courseLecturers.sessionId, session.id)
        )).limit(1);

        if (!existingLink) {
            console.log("Linking staff to course...");
            await db.insert(courseLecturers).values({
                courseId: course.id,
                staffId: staff.id,
                sessionId: session.id,
                role: 'primary'
            });
        }

        // 3. Seed Lesson Notes
        console.log("Seeding Lesson Notes...");
        
        // Clean old test notes for these weeks to avoid duplicates if re-running
        await db.delete(lessonNotes).where(and(
            eq(lessonNotes.courseId, course.id),
            eq(lessonNotes.teacherId, staff.id)
        ));

        // Approved Note (Visible to students)
        const [noteA] = await db.insert(lessonNotes).values({
            teacherId: staff.id,
            courseId: course.id,
            sessionId: session.id,
            termId: 1,
            weekNumber: 1,
            title: "Foundations of Computational Logic",
            objectives: "1. Understand Boolean Algebra\n2. Master Truth Tables\n3. Apply logic to gate design",
            contentBody: `
                <h2>Introduction to Logic</h2>
                <p>Welcome to Week 1. Today we explore the binary foundations of computing.</p>
                <ul>
                    <li><strong>AND Gate</strong>: Both must be true.</li>
                    <li><strong>OR Gate</strong>: At least one must be true.</li>
                </ul>
                <p>Logic is the heartbeat of every algorithm we will write this semester.</p>
            `,
            status: 'approved',
            isPublished: true
        } as any);

        // Pending Note (Awaiting Supervisor)
        const [noteB] = await db.insert(lessonNotes).values({
            teacherId: staff.id,
            courseId: course.id,
            sessionId: session.id,
            termId: 1,
            weekNumber: 2,
            title: "Complexity Analysis & Big O",
            objectives: "Analyze time and space complexity of iterations.",
            contentBody: "<p>Content still being refined for pedagogical clarity...</p>",
            status: 'pending'
        } as any);

        // Rejected Note (Needs correction)
        const [noteC] = await db.insert(lessonNotes).values({
            teacherId: staff.id,
            courseId: course.id,
            sessionId: session.id,
            termId: 1,
            weekNumber: 3,
            title: "Recursive Functions",
            objectives: "Master recursion limits and stack management.",
            contentBody: "<p>Recursion is when a function calls itself.</p>",
            status: 'rejected',
            supervisorId: 1,
            supervisorFeedback: "The explanation of base cases is too brief. Please add a diagram showing the call stack to help students visualize the process."
        } as any);

        // 4. Seed CA Activities
        console.log("Seeding CA Activities (Assignments & Quizzes)...");

        const [asn] = await db.insert(assignments).values({
            courseId: course.id,
            title: "Logic Gate Design Project",
            description: "Design a 4-bit adder using the principles discovered in Week 1.",
            maxScore: 20,
            includeInCa: true,
            caAveragingMethod: 'simple'
        } as any);

        const [qz] = await db.insert(quizzes).values({
            courseId: course.id,
            title: "Week 1 Proficiency Quiz",
            description: "Test your understanding of Boolean Logic.",
            passingScore: 50,
            includeInCa: true,
            caAveragingMethod: 'simple'
        } as any);

        // 5. Seed Grading Configuration
        console.log("Setting up Grading Layout...");
        
        await db.delete(gradingConfigurations).where(eq(gradingConfigurations.courseId, course.id));

        await db.insert(gradingConfigurations).values([
            {
                courseId: course.id,
                sessionId: session.id,
                name: "Theory Assignment 1",
                type: 'assignment',
                linkedId: asn.insertId,
                maxMarks: 20,
                weight: 10,
                order: 1
            },
            {
                courseId: course.id,
                sessionId: session.id,
                name: "Online Quiz 1",
                type: 'quiz',
                linkedId: qz.insertId,
                maxMarks: 100,
                weight: 5,
                order: 2
            }
        ]);

        console.log("✅ Full Lifecycle Seeding Completed Successfully.");
    } catch (error) {
        console.error("❌ Seeding Failed:", error);
    }
    process.exit(0);
}

seedLifecycle();
