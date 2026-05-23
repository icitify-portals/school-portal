"use server";

import { db } from "@/db/db";
import {
    users, staffProfiles, students, results,
    enrollments, courses, departments, faculties,
    academicSessions, institutionalUnits, programmes,
    courseDepartmentSettings
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function seedAuditDemoData() {
    try {
        console.log("🌱 Seeding Result Auditing Demo Data...");

        try {
            const [cols]: any = await db.execute(sql`DESCRIBE results`);
            console.log("Seeder sees Results columns:", cols.map((c: any) => c.Field || c.field).join(", "));
        } catch (e) {
            console.error("Failed to describe results in seeder:", e);
        }

        const password = await bcrypt.hash("password123", 10);

        // 1. Get/Create Foundation Entities
        const [mainUnit] = await db.select().from(institutionalUnits).where(eq(institutionalUnits.code, "MAIN")).limit(1);
        if (!mainUnit) throw new Error("Main unit not found. Please run seedDatabase first.");

        const [sciFaculty] = await db.select().from(faculties).where(eq(faculties.code, "FOS")).limit(1);
        const [cscDept] = await db.select().from(departments).where(eq(departments.code, "CSC")).limit(1);
        const [cscProg] = await db.select().from(programmes).where(eq(programmes.deptId, cscDept.id)).limit(1);

        const sessions = await db.select().from(academicSessions).limit(1);
        const currentSession = sessions[0]?.name || "2025/2026";

        // 2. Create Dean User (Science Faculty)
        const deanEmail = "dean.science@school.com";
        let [deanUser] = await db.select().from(users).where(eq(users.email, deanEmail)).limit(1);
        if (!deanUser) {
            const [res] = await db.insert(users).values({
                email: deanEmail,
                name: "Prof. Ada Lovelace",
                password,
                role: "staff",
                status: "active"
            });
            deanUser = { id: res.insertId } as any;
        } else {
            await db.update(users).set({ password, role: "staff", status: "active" }).where(eq(users.id, deanUser.id));
        }

        await db.insert(staffProfiles).values({
            userId: deanUser.id,
            staffId: "STF-DEAN-SCI",
            departmentId: cscDept.id, // Hods/Deans are still in a dept
            unitId: mainUnit.id,
            jobTitle: "Dean of Faculty",
            rank: "Professor",
            isActive: true
        } as any).onDuplicateKeyUpdate({ set: { jobTitle: "Dean of Faculty" } });

        // 3. Create HOD User (Computer Science)
        const hodEmail = "hod.csc@school.com";
        let [hodUser] = await db.select().from(users).where(eq(users.email, hodEmail)).limit(1);
        if (!hodUser) {
            const [res] = await db.insert(users).values({
                email: hodEmail,
                name: "Dr. Grace Hopper",
                password,
                role: "staff",
                status: "active"
            });
            hodUser = { id: res.insertId } as any;
        } else {
            await db.update(users).set({ password, role: "staff", status: "active" }).where(eq(users.id, hodUser.id));
        }

        await db.insert(staffProfiles).values({
            userId: hodUser.id,
            staffId: "STF-HOD-CSC",
            departmentId: cscDept.id,
            unitId: mainUnit.id,
            jobTitle: "Head of Department",
            rank: "Associate Professor",
            isActive: true
        } as any).onDuplicateKeyUpdate({ set: { jobTitle: "Head of Department" } });

        // 4. Create Audit Demo Student
        const studentEmail = "audit.student@school.com";
        let [auditStudentUser] = await db.select().from(users).where(eq(users.email, studentEmail)).limit(1);
        if (!auditStudentUser) {
            const [res] = await db.insert(users).values({
                email: studentEmail,
                name: "Audit Testing Student",
                password,
                role: "student",
                status: "active"
            });
            auditStudentUser = { id: res.insertId } as any;
        } else {
            await db.update(users).set({ password, role: "student", status: "active" }).where(eq(users.id, auditStudentUser.id));
        }

        let [studentProfile] = await db.select().from(students).where(eq(students.userId, auditStudentUser.id)).limit(1);
        if (!studentProfile) {
            const [res] = await db.insert(students).values({
                userId: auditStudentUser.id,
                matricNumber: "AUDIT/2025/001",
                programmeId: cscProg.id,
                deptId: cscDept.id,
                unitId: mainUnit.id,
                currentLevel: 100,
                admissionYear: 2025
            });
            studentProfile = { id: res.insertId, matricNumber: "AUDIT/2025/001" } as any;
        }

        // 5. Seed some results for testing
        const cscCourses = await db.select().from(courses).where(eq(courses.code, "CSC 101")).limit(1);
        if (cscCourses.length > 0) {
            const course = cscCourses[0];

            // Check enrollment
            let [enrollment] = await db.select().from(enrollments).where(and(
                eq(enrollments.studentId, studentProfile.id),
                eq(enrollments.courseId, course.id)
            )).limit(1);

            if (!enrollment) {
                const [res] = await db.insert(enrollments).values({
                    studentId: studentProfile.id,
                    courseId: course.id,
                    academicYear: currentSession,
                    semester: 1
                });
                enrollment = { id: res.insertId } as any;
            }

            // Clean up existing result for this enrollment to avoid conflicts
            await db.delete(results).where(eq(results.enrollmentId, enrollment.id));

            // Create initial result using RAW SQL to bypass any Drizzle mapping issues
            await db.execute(sql`
                INSERT INTO results 
                (enrollment_id, ca_score, exam_score, total_score, grade, grade_point, is_gpa_course, is_approved) 
                VALUES 
                (${enrollment.id}, '15.00', '45.00', '60.00', 'B', '4.00', true, true)
            `);
        }

        console.log("✅ Audit Demo Seeding Complete!");
        return {
            success: true,
            message: "Seeded Dean, HOD, and Audit Student.",
            data: {
                dean: { email: deanEmail, password: "password123" },
                hod: { email: hodEmail, password: "password123" },
                student: { email: studentEmail, password: "password123", matric: studentProfile.matricNumber }
            }
        };

    } catch (error: any) {
        console.error("Audit Seeding Failed:", error);
        return { success: false, error: error.message };
    }
}
