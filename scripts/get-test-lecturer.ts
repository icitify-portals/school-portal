
import { db } from "../src/db/db";
import { users, staffProfiles, courseLecturers, courses } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
    console.log("Fetching lecturer accounts...");

    const lecturers = await db.selectDistinct({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        staffId: staffProfiles.staffId,
        jobTitle: staffProfiles.jobTitle,
    })
        .from(users)
        .innerJoin(staffProfiles, eq(users.id, staffProfiles.userId))
        .innerJoin(courseLecturers, eq(courseLecturers.staffId, staffProfiles.id)) // Ensure they have courses
        .where(eq(users.role, 'staff'))
        .limit(5);

    for (const lecturer of lecturers) {
        const assignments = await db.select({
            courseCode: courses.code,
            courseName: courses.name
        })
            .from(courseLecturers)
            .innerJoin(courses, eq(courseLecturers.courseId, courses.id))
            .where(eq(courseLecturers.staffId, lecturer.id)); // Note: courseLecturers.staffId usually links to staffProfiles.id, let's double check schema if needed, but usually it's staffProfiles.id

        // Wait, schema check: courseLecturers.staffId references staff_profiles.id or users.id?
        // Let's assume staffProfiles.id for now based on naming convention, but I'll query assuming `lecturer.id` is `users.id` and I might need `staffProfiles.id`.

        // Actually, let's just get the staff profile ID first to be sure
        const [profile] = await db.select().from(staffProfiles).where(eq(staffProfiles.userId, lecturer.id));

        const realAssignments = await db.select({
            courseCode: courses.code,
            courseName: courses.name
        })
            .from(courseLecturers)
            .innerJoin(courses, eq(courseLecturers.courseId, courses.id))
            .where(eq(courseLecturers.staffId, profile.id));

        console.log(`\nName: ${lecturer.name}`);
        console.log(`Email: ${lecturer.email}`);
        console.log(`Staff ID: ${lecturer.staffId}`);
        console.log(`Courses: ${realAssignments.length > 0 ? realAssignments.map(c => c.courseCode).join(", ") : "None"}`);
    }

    process.exit(0);
}

main();
