
import { db } from "../src/db/db";
import { 
    lessonNotes, 
    lessonNoteApprovers, 
    academicSessions,
    courseLecturers,
    users
} from "../src/db/schema";
import { eq, sql } from "drizzle-orm";

async function automatedPush() {
    try {
        console.log("🚀 Starting Final Automated Database Push...");

        // 1. Apply Schema Updates (Manual check for lesson_notes table)
        console.log("检查 Schema...");
        const tables = await db.execute(sql`SHOW TABLES`);
        const tableList = (tables[0] as any).map((t: any) => Object.values(t)[0]);
        
        if (!tableList.includes('lesson_notes')) {
            console.log("Creating lesson_notes table...");
            await db.execute(sql`
                CREATE TABLE lesson_notes (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    teacher_id INT NOT NULL,
                    course_id INT NOT NULL,
                    session_id INT NOT NULL,
                    term_id INT NOT NULL,
                    week_number INT NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    objectives TEXT,
                    content_body MEDIUMTEXT,
                    status ENUM('draft', 'pending', 'approved', 'rejected') DEFAULT 'draft',
                    supervisor_id INT,
                    supervisor_feedback TEXT,
                    scheduled_at DATETIME,
                    is_published BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            `);
        }

        if (!tableList.includes('lesson_note_approvers')) {
            console.log("Creating lesson_note_approvers table...");
            await db.execute(sql`
                CREATE TABLE lesson_note_approvers (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    supervisor_id INT NOT NULL,
                    target_user_id INT,
                    target_dept_id INT,
                    target_faculty_id INT,
                    unit_id INT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
        }

        // 2. Ensure Academic Session exists
        console.log("Checking Academic Sessions...");
        const [session] = await db.select().from(academicSessions).where(eq(academicSessions.isCurrent, true)).limit(1);
        if (!session) {
            console.log("Creating default active session...");
            await db.insert(academicSessions).values({
                name: "2025/2026 Academic Session",
                startDate: new Date("2025-09-01"),
                endDate: new Date("2026-07-30"),
                isCurrent: true,
                isActive: true,
                currentSemester: "1"
            });
        }

        // 3. Seed Sample Note if empty
        const count = await db.select({ count: sql`count(*)` }).from(lessonNotes);
        if ((count[0] as any).count === 0) {
            console.log("Seeding initial Lesson Note...");
            const [teacher] = await db.select().from(users).where(eq(users.role, 'staff')).limit(1);
            const [course] = await db.select({ id: sql`id` }).from(sql`courses`).limit(1);
            
            if (teacher && course) {
                await db.insert(lessonNotes).values({
                    teacherId: teacher.id,
                    courseId: (course as any).id,
                    sessionId: session?.id || 1,
                    termId: 1,
                    weekNumber: 1,
                    title: "Introduction to Advanced Algorithms",
                    objectives: "Students will understand Big O notation and basic sorting algorithms.",
                    contentBody: "<h2>Welcome to Week 1</h2><p>Today we cover sorting...</p>",
                    status: 'draft'
                });
            }
        }

        console.log("✅ Automated Push Completed Successfully.");
    } catch (error) {
        console.error("❌ ERROR during push:", error);
    }
    process.exit(0);
}

automatedPush();
