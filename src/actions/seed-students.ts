"use server";

import { db } from "@/db/db";
import { users, students, enrollments, courses, programmes, academicSessions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function seedSampleStudents() {
    try {
        console.log("🌱 Seeding Sample Students...");

        // 1. Get Prerequisites
        const passwordHash = await bcrypt.hash("password123", 10);

        const [currentSession] = await db.select().from(academicSessions).where(eq(academicSessions.isCurrent, true)).limit(1);

        if (!currentSession) {
            return { success: false, error: "No active academic session. Please seed system first." };
        }

        const [cscProg] = await db.select().from(programmes).where(eq(programmes.name, "B.Sc Computer Science")).limit(1);

        const [cscCourse] = await db.select().from(courses).where(eq(courses.code, "CSC 101")).limit(1);

        if (!cscProg || !cscCourse) {
            return { success: false, error: "Prerequisite data (CSC Programme/Course) not found." };
        }

        // 2. Student Data
        const sampleStudents = [
            { name: "Alice Thompson", email: "alice@school.com", matric: "CSC/2025/002", level: 100 },
            { name: "Bob Smith", email: "bob@school.com", matric: "CSC/2025/003", level: 100 },
            { name: "Charlie Davis", email: "charlie@school.com", matric: "CSC/2025/004", level: 100 },
            { name: "Diana Prince", email: "diana@school.com", matric: "CSC/2025/005", level: 100 },
            { name: "Ethan Hunt", email: "ethan@school.com", matric: "CSC/2025/006", level: 100 },
            { name: "Fiona Apple", email: "fiona@school.com", matric: "CSC/2025/007", level: 100 },
            { name: "George Miller", email: "george@school.com", matric: "CSC/2025/008", level: 100 },
            { name: "Hannah Abbott", email: "hannah@school.com", matric: "CSC/2025/009", level: 100 },
            { name: "Ivan Drago", email: "ivan@school.com", matric: "CSC/2025/010", level: 100 },
            { name: "Jane Foster", email: "jane@school.com", matric: "CSC/2025/011", level: 100 },
        ];

        let createdCount = 0;
        let enrolledCount = 0;

        await db.transaction(async (tx) => {
            for (const s of sampleStudents) {
                // Check if user exists
                let [userRecord] = await tx.select().from(users).where(eq(users.email, s.email)).limit(1);

                let studentId: number;

                if (!userRecord) {
                    const [newUser] = await tx.insert(users).values({
                        name: s.name,
                        email: s.email,
                        password: passwordHash,
                        role: 'student'
                    });

                    const [newStudent] = await tx.insert(students).values({
                        userId: newUser.insertId,
                        matricNumber: s.matric,
                        programmeId: cscProg.id,
                        currentLevel: s.level,
                        barcode: `${s.name} | ${s.matric}`
                    });

                    studentId = newStudent.insertId;
                    createdCount++;
                } else {
                    const [studentRecord] = await tx.select().from(students).where(eq(students.userId, userRecord.id)).limit(1);
                    if (!studentRecord) continue;
                    studentId = studentRecord.id;
                }

                // Enroll in CSC 101 if not already
                const [existingEnrollment] = await tx.select().from(enrollments).where(and(
                    eq(enrollments.studentId, studentId),
                    eq(enrollments.courseId, cscCourse.id)
                )).limit(1);

                if (!existingEnrollment) {
                    await tx.insert(enrollments).values({
                        studentId,
                        courseId: cscCourse.id,
                        academicYear: currentSession.name,
                        semester: parseInt(currentSession.currentSemester || "1")
                    });
                    enrolledCount++;
                }
            }
        });

        revalidatePath("/admin/students");
        return {
            success: true,
            message: `Created ${createdCount} students and enrolled ${enrolledCount} in ${cscCourse.code}.`
        };

    } catch (error: any) {
        console.error("Seeding Students Failed:", error);
        return { success: false, error: error.message };
    }
}
