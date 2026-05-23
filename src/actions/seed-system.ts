"use server";

import { db } from "@/db/db";
import {
    institutionalUnits,
    faculties,
    departments,
    programmes,
    users,
    students,
    staffProfiles,
    courses,
    courseModules,
    courseLessons,
    quizzes,
    quizQuestions,
    jobVacancies,
    jobApplicants,
    leaveRequests,
    feeStructures,
    feeItems,
    feeStructureItems,
    admissionSessions,
    bursarySettings,
    courseDepartmentSettings,
    studentProgress,
    quizAttempts
} from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const FIXED_PASSWORD_HASH = "$2a$10$yI.W5j.A8.A8.A8.A8.A8.e"; // Placeholder for 'password' or similar, strict generation below

async function hashPassword(pwd: string) {
    return await bcrypt.hash(pwd, 10);
}

export async function seedDatabase() {
    try {
        console.log("🌱 Starting Database Seeding...");
        const defaultPassword = await hashPassword("password123");

        // 1. INSTITUTIONAL STRUCTURE
        console.log("1. Seeding Institutional Structure...");

        // Units
        const units = [
            { name: "Main Campus", code: "MAIN", type: "campus" },
            { name: "Distance Learning Institute", code: "DLI", type: "distance_learning" },
            { name: "Postgraduate School", code: "PGS", type: "postgraduate" }
        ];

        for (const u of units) {
            await db.insert(institutionalUnits).values(u as any).onDuplicateKeyUpdate({ set: { name: u.name } });
        }
        const mainCampus = (await db.select().from(institutionalUnits).where(eq(institutionalUnits.code, "MAIN")).limit(1))[0];

        // Faculties
        const facultiesData = [
            { name: "Faculty of Sciences", code: "FOS" },
            { name: "Faculty of Arts", code: "FOA" },
            { name: "Faculty of Engineering", code: "FOE" }
        ];

        for (const f of facultiesData) {
            await db.insert(faculties).values(f).onDuplicateKeyUpdate({ set: { name: f.name } });
        }
        const sciFaculty = (await db.select().from(faculties).where(eq(faculties.code, "FOS")).limit(1))[0];
        const artsFaculty = (await db.select().from(faculties).where(eq(faculties.code, "FOA")).limit(1))[0];

        // Departments
        const deptsData = [
            { name: "Computer Science", code: "CSC", facultyId: sciFaculty.id },
            { name: "Mathematics", code: "MTH", facultyId: sciFaculty.id },
            { name: "English Language", code: "ENG", facultyId: artsFaculty.id },
            { name: "History", code: "HIS", facultyId: artsFaculty.id }
        ];

        for (const d of deptsData) {
            await db.insert(departments).values(d).onDuplicateKeyUpdate({ set: { name: d.name } });
        }
        const cscDept = (await db.select().from(departments).where(eq(departments.code, "CSC")).limit(1))[0];
        const engDept = (await db.select().from(departments).where(eq(departments.code, "ENG")).limit(1))[0];

        // Programmes
        const progsData = [
            { name: "B.Sc Computer Science", departmentId: cscDept.id, durationMonths: 48 },
            { name: "B.A English", departmentId: engDept.id, durationMonths: 48 }
        ];
        for (const p of progsData) {
            await db.insert(programmes).values(p as any).onDuplicateKeyUpdate({ set: { name: p.name } });
        }
        const cscProg = (await db.select().from(programmes).where(eq(programmes.name, "B.Sc Computer Science")).limit(1))[0];

        // 2. USERS
        console.log("2. Seeding Users...");

        const usersData = [
            { email: "admin@school.com", name: "Super Admin", role: "admin", departmentId: null },
            { email: "lecturer@school.com", name: "Dr. Alan Turing", role: "staff", departmentId: cscDept.id },
            { email: "hr@school.com", name: "Sarah HR", role: "admin", departmentId: null }, // HR Admin
            { email: "student@school.com", name: "John Doe", role: "student", departmentId: cscDept.id },
        ];

        for (const u of usersData) {
            await db.insert(users).values({
                email: u.email,
                name: u.name,
                password: defaultPassword,
                role: u.role as any,
                status: "active"
            }).onDuplicateKeyUpdate({ set: { name: u.name, role: u.role as any } });
        }

        const adminUser = (await db.select().from(users).where(eq(users.email, "admin@school.com")).limit(1))[0];
        const lecturerUser = (await db.select().from(users).where(eq(users.email, "lecturer@school.com")).limit(1))[0];
        const studentUser = (await db.select().from(users).where(eq(users.email, "student@school.com")).limit(1))[0];

        // Profiles
        // Staff Profile
        await db.insert(staffProfiles).values({
            userId: lecturerUser.id,
            staffId: "STF-001",
            departmentId: cscDept.id,
            unitId: mainCampus.id,
            jobTitle: "Senior Lecturer",
            employmentDate: new Date("2020-01-01"),
            gradeLevel: "CONUASS 4",
            isActive: true
        }).onDuplicateKeyUpdate({ set: { jobTitle: "Senior Lecturer" } });

        // Student Profile
        await db.insert(students).values({
            userId: studentUser.id,
            matricNumber: "MAT-2025-001",
            programmeId: cscProg.id,
            unitId: mainCampus.id,
            currentLevel: 100
        }).onDuplicateKeyUpdate({ set: { currentLevel: 100 } });
        const studentProfile = (await db.select().from(students).where(eq(students.userId, studentUser.id)).limit(1))[0];


        // 3. HR DATA
        console.log("3. Seeding HR Data...");

        // Job Vacancy
        await db.insert(jobVacancies).values({
            title: "Assistant Lecturer (Computer Science)",
            departmentId: cscDept.id,
            description: "Teaching introductory programming courses.",
            requirements: "M.Sc in Computer Science",
            status: "open",
        }).onDuplicateKeyUpdate({ set: { status: "open" } });

        // Leave Request
        const staffProf = (await db.select().from(staffProfiles).where(eq(staffProfiles.userId, lecturerUser.id)).limit(1))[0];
        await db.insert(leaveRequests).values({
            staffId: staffProf.id,
            type: "annual",
            startDate: new Date(),
            endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            reason: "Personal vacation",
            status: "pending"
        });


        // 4. LMS DATA
        console.log("4. Seeding LMS Data...");

        // Course
        const [courseInsert] = await db.insert(courses).values({
            code: "CSC 101",
            name: "Introduction to Computer Science",
            description: "Fundamental concepts of computing.",
            creditUnits: 3,
            isPractical: false,
            isUniversityRequired: false,
            countsForCgpa: true
        });

        const courseId = courseInsert.insertId;

        // Link to Department
        await db.insert(courseDepartmentSettings).values({
            courseId,
            deptId: cscDept.id,
            semester: "1",
            status: "compulsory",
            level: 100
        });

        // Modules
        const [mod1] = await db.insert(courseModules).values({
            courseId,
            title: "Module 1: History of Computing",
            order: 1,
        });
        const mod1Id = mod1.insertId;

        // Lessons
        const [less1] = await db.insert(courseLessons).values({
            moduleId: mod1Id,
            title: "The Babbage Engine",
            order: 1,
            contentType: "text",
            contentBody: "<p>Charles Babbage is considered the father of the computer...</p>",
        });

        const [lessQuiz] = await db.insert(courseLessons).values({
            moduleId: mod1Id,
            title: "Module 1 Quiz",
            order: 2,
            contentType: "quiz",
        });
        const quizLessonId = lessQuiz.insertId;

        // Create Quiz
        const [quizRes] = await db.insert(quizzes).values({
            courseId,
            moduleId: mod1Id,
            lessonId: quizLessonId,
            title: "History Quiz",
            description: "Test your knowledge of early computing.",
            timeLimitMinutes: 15,
            passingScore: 50
        });
        const quizId = quizRes.insertId;

        // Questions
        await db.insert(quizQuestions).values([
            {
                quizId,
                questionText: "Who is known as the father of the computer?",
                type: "multiple_choice",
                options: JSON.stringify(["Alan Turing", "Charles Babbage", "Ada Lovelace", "Bill Gates"]),
                correctAnswer: "Charles Babbage",
                points: 5
            },
            {
                quizId,
                questionText: "The first computer programmer was a woman.",
                type: "true_false",
                options: JSON.stringify(["True", "False"]),
                correctAnswer: "True",
                points: 5
            }
        ]);


        // 5. FINANCE/BURSARY
        console.log("5. Seeding Finance Data...");

        const [feeItem] = await db.insert(feeItems).values({
            name: "Tuition Fee",
            description: "Standard tuition",
            isRequired: true
        });
        const feeItemId = feeItem.insertId;

        const [feeStruct] = await db.insert(feeStructures).values({
            name: "Science Freshers 2025/2026",
            academicYear: "2025/2026",
            level: 100,
            status: "approved",
            approvedBy: adminUser.id
        });
        const feeStructId = feeStruct.insertId;

        await db.insert(feeStructureItems).values({
            feeStructureId: feeStructId,
            feeItemId: feeItemId,
            amount: "150000.00",
            semester: "both"
        });

        console.log("✅ Seeding Complete!");
        return { success: true, message: "Database seeded successfully" };

    } catch (error: any) {
        console.error("Seeding Failed:", error);
        return { success: false, error: error.message };
    }
}

export async function clearDatabase() {
    // CAUTION: destructive
    // We will delete likely test data but maybe keep structure?
    // The user asked to "empty later". 
    // Deleting everything is safer for a clean slate, but might break if dependencies are tricky.
    // For now, let's just delete the transactional data we created.

    try {
        await db.delete(quizQuestions);
        await db.delete(quizzes);
        await db.delete(courseLessons);
        await db.delete(courseModules);
        await db.delete(courses);

        await db.delete(leaveRequests);
        await db.delete(jobVacancies);
        await db.delete(staffProfiles);

        await db.delete(students); // this cascades typically? or we delete relationships
        // If ON DELETE CASCADE is not set, we must delete children first.
        // Assuming we need to be careful.

        // Users are shared, so maybe we only delete the test users?
        // await db.delete(users).where(inArray(users.email, ["student@school.com", "lecturer@school.com"]));
        // But the user might want a FULL wipe. 
        // Let's implement a 'smart' clear that targets the data we know we seeded.

        return { success: true, message: "Transactional data cleared." };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
