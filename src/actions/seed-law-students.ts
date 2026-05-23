"use server";

import { db } from "@/db/db";
import {
    users,
    students,
    enrollments,
    courses,
    programmes,
    academicSessions,
    departments,
    faculties,
    jambCandidates
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function seedLawStudents() {
    try {
        console.log("⚖️ Seeding Law Faculty Students...");

        // 1. Get Prerequisites
        const passwordHash = await bcrypt.hash("password123", 10);

        const [currentSession] = await db.select().from(academicSessions).where(eq(academicSessions.isCurrent, true)).limit(1);

        if (!currentSession) {
            return { success: false, error: "No active academic session found." };
        }

        const [lawFaculty] = await db.select().from(faculties).where(eq(faculties.code, "LAW")).limit(1);

        if (!lawFaculty) {
            return { success: false, error: "Law Faculty not found. Please seed Law curriculum first." };
        }

        const [lawProg] = await db.select().from(programmes).where(eq(programmes.name, "Bachelor of Laws")).limit(1);

        if (!lawProg) {
            return { success: false, error: "Law Programme (Bachelor of Laws) not found." };
        }

        const lawDepts = await db.select().from(departments).where(eq(departments.facultyId, lawFaculty.id));
        const deptMap = new Map(lawDepts.map(d => [d.code, d.id]));

        const [lawCourse] = await db.select().from(courses).where(eq(courses.code, "LAW 101")).limit(1);

        // 2. Student Data (Realistic)
        const lawStudents = [
            { name: "Chinedu Okoro", email: "chinedu@school.com", phone: "+2347043091081", matric: "LAW/2025/001", level: 100, dept: "PUL" },
            { name: "Fatima Yusuf", email: "fatima@school.com", phone: "+2348033091082", matric: "LAW/2025/002", level: 100, dept: "PPL" },
            { name: "Tunde Adeyemi", email: "tunde@school.com", phone: "+2349033091083", matric: "LAW/2024/001", level: 200, dept: "CIL" },
            { name: "Ngozi Obi", email: "ngozi@school.com", phone: "+2347013091084", matric: "LAW/2024/002", level: 200, dept: "JIL" },
            { name: "Amina Bello", email: "amina@school.com", phone: "+2348083091085", matric: "LAW/2023/001", level: 300, dept: "LAW_GEN" },
            { name: "Ibrahim Musa", email: "ibrahim@school.com", phone: "+2347063091086", matric: "LAW/2022/001", level: 400, dept: "PUL" },
            { name: "Zainab Dahiru", email: "zainab@school.com", phone: "+2348123091087", matric: "LAW/2022/002", level: 400, dept: "PPL" },
            { name: "Emeka Nwosu", email: "emeka@school.com", phone: "+2349053091088", matric: "LAW/2021/001", level: 500, dept: "CIL" },
            { name: "Olawale Shittu", email: "olawale@school.com", phone: "+2347043091089", matric: "LAW/2021/002", level: 500, dept: "JIL" },
            { name: "Blessing Okura", email: "blessing@school.com", phone: "+2348033091090", matric: "LAW/2025/003", level: 100, dept: "LAW_GEN" },
        ];

        let createdCount = 0;
        let enrolledCount = 0;

        await db.transaction(async (tx) => {
            for (const s of lawStudents) {
                // Check if user exists
                let [userRecord] = await tx.select().from(users).where(eq(users.email, s.email)).limit(1);

                let userId: number;
                let studentId: number;

                if (!userRecord) {
                    const [newUser] = await tx.insert(users).values({
                        name: s.name,
                        email: s.email,
                        password: passwordHash,
                        role: 'student'
                    });
                    userId = newUser.insertId;

                    const [newStudent] = await tx.insert(students).values({
                        userId: userId,
                        matricNumber: s.matric,
                        programmeId: lawProg.id,
                        deptId: deptMap.get(s.dept) || null,
                        currentLevel: s.level,
                        barcode: `${s.name} | ${s.matric}`
                    });

                    studentId = newStudent.insertId;
                    createdCount++;

                    // Seed JAMB Candidate for phone number (Mock)
                    await tx.insert(jambCandidates).values({
                        jambRegNo: `JAMB/LAW/${s.matric.split('/').join('')}`,
                        surname: s.name.split(' ')[1] || s.name,
                        firstname: s.name.split(' ')[0],
                        dob: "2005-01-01",
                        email: s.email,
                        phone: s.phone,
                        isClaimed: true,
                        claimedUserId: userId,
                        facultyId: lawFaculty.id,
                        deptId: deptMap.get(s.dept) || null,
                    });
                } else {
                    const [studentRecord] = await tx.select().from(students).where(eq(students.userId, userRecord.id)).limit(1);
                    if (!studentRecord) continue;
                    studentId = studentRecord.id;
                }

                // Enroll in LAW 101 if level 100 and course exists
                if (s.level === 100 && lawCourse) {
                    const [existingEnrollment] = await tx.select().from(enrollments).where(and(
                        eq(enrollments.studentId, studentId),
                        eq(enrollments.courseId, lawCourse.id)
                    )).limit(1);

                    if (!existingEnrollment) {
                        await tx.insert(enrollments).values({
                            studentId,
                            courseId: lawCourse.id,
                            academicYear: currentSession.name,
                            semester: 1 // First semester
                        });
                        enrolledCount++;
                    }
                }
            }
        });

        // revalidatePath("/admin/students");
        return {
            success: true,
            message: `Created ${createdCount} Law students and enrolled ${enrolledCount} in LAW 101.`
        };

    } catch (error: any) {
        console.error("Seeding Law Students Failed:", error);
        return { success: false, error: error.message };
    }
}
