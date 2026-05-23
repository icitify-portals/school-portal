import { db } from "../src/db/db";
import { users, staffProfiles, courseLecturers, students, enrollments, academicSessions } from "../src/db/schema";
import { eq, and } from "drizzle-orm";

async function main() {
    // 1. Get lecturer user
    const lecturerUser = await db.query.users.findFirst({
        where: eq(users.email, "araromi@school.com")
    });

    if (!lecturerUser) {
        console.error("Lecturer not found");
        process.exit(1);
    }

    // Get staff profile
    const staff = await db.query.staffProfiles.findFirst({
        where: eq(staffProfiles.userId, lecturerUser.id)
    });

    if (!staff) {
        console.error("Staff profile not found");
        process.exit(1);
    }

    // 2. Get course assignment for lecturer
    const assignment = await db.select({
        courseId: courseLecturers.courseId,
        sessionId: courseLecturers.sessionId,
        semester: courseLecturers.semester
    })
        .from(courseLecturers)
        .where(eq(courseLecturers.staffId, staff.id))
        .limit(1);

    if (assignment.length === 0) {
        console.error("Lecturer has no course assignments");
        process.exit(1);
    }

    const { courseId, sessionId, semester } = assignment[0];

    // 3. Get student user
    const studentUser = await db.query.users.findFirst({
        where: eq(users.email, "aa.adelopo2@gmail.com")
    });

    if (!studentUser) {
        console.error("Student user not found");
        process.exit(1);
    }

    // Get student profile
    const student = await db.query.students.findFirst({
        where: eq(students.userId, studentUser.id)
    });

    if (!student) {
        console.error("Student profile not found");
        process.exit(1);
    }

    // 4. Get active session to ensure academicYear
    const session = await db.query.academicSessions.findFirst({
        where: eq(academicSessions.id, sessionId)
    });
    const academicYear = session?.name || "2024/2025";

    // 5. Register student for the course
    try {
        await db.insert(enrollments).values({
            studentId: student.id,
            courseId: courseId,
            sessionId: sessionId,
            academicYear: academicYear,
            semester: semester === '1' ? 1 : (semester === '2' ? 2 : 1),
            status: "approved"
        });
        console.log(`Successfully registered student ${studentUser.email} to course ${courseId}`);
    } catch (e: any) {
        if (e.code === 'ER_DUP_ENTRY') {
            const updateResult = await db.update(enrollments)
                .set({ status: "approved" })
                .where(and(
                    eq(enrollments.studentId, student.id),
                    eq(enrollments.courseId, courseId),
                    eq(enrollments.sessionId, sessionId)
                ));
            console.log("Student is already registered to this course, updated status to approved. Result:", updateResult);
        } else {
            console.error("Failed to register student", e);
        }
    }

    process.exit(0);
}

main();
