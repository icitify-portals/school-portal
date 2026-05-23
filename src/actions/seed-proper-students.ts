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
    jambCandidates
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function seedProperTestStudents() {
    try {
        console.log("🚀 Seeding Extensive Test Students...");

        const passwordHash = await bcrypt.hash("password123", 10);
        const [currentSession] = await db.select().from(academicSessions).where(eq(academicSessions.isCurrent, true)).limit(1);

        if (!currentSession) return { success: false, error: "No active academic session." };

        // 1. Get Academic Structure
        const allProgs = await db.select().from(programmes);
        const allDepts = await db.select().from(departments);

        if (allProgs.length === 0) return { success: false, error: "No programmes found." };

        // 2. Sample Data Generator Helpers
        const firstNames = ["James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda", "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen"];
        const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"];

        const levels = [100, 200, 300, 400, 500];

        let createdCount = 0;

        await db.transaction(async (tx) => {
            for (let i = 1; i <= 50; i++) {
                const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
                const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
                const email = `${fn.toLowerCase()}.${ln.toLowerCase()}.${i}@test.com`;
                const prog = allProgs[Math.floor(Math.random() * allProgs.length)];
                const level = levels[Math.floor(Math.random() * levels.length)];
                const dept = allDepts.find(d => d.id === prog.deptId);

                const matricPrefix = dept?.code || "GEN";
                const year = 2026 - (level / 100) + 1;
                const matric = `${matricPrefix}/${year}/${String(i).padStart(3, '0')}`;

                // Create User
                const [newUser] = await tx.insert(users).values({
                    name: `${fn} ${ln}`,
                    email: email,
                    password: passwordHash,
                    role: 'student'
                });
                const userId = newUser.insertId;

                // Create Student
                const [newStudent] = await tx.insert(students).values({
                    userId: userId,
                    matricNumber: matric,
                    programmeId: prog.id,
                    deptId: prog.deptId,
                    currentLevel: level,
                    barcode: `${fn} ${ln} | ${matric}`,
                    admissionYear: year,
                    admissionSessionId: currentSession.id,

                    // Extra Profile Data
                    guardianName: `Mr. ${ln} Parent`,
                    guardianPhone: `+234${Math.floor(7000000000 + Math.random() * 1000000000)}`,
                    guardianWhatsapp: `+234${Math.floor(7000000000 + Math.random() * 1000000000)}`,
                    guardianEmail: `parent.${ln.toLowerCase()}@example.com`,
                    guardianOccupation: "Civil Servant",
                    guardianAddress: `No ${i}, ${fn} Close, Lagos State`,

                    kinName: `${fn} ${ln} Junior`,
                    kinPhone: `+234${Math.floor(8000000000 + Math.random() * 1000000000)}`,
                    kinWhatsapp: `+234${Math.floor(8000000000 + Math.random() * 1000000000)}`,
                    kinEmail: `${fn.toLowerCase()}.${ln.toLowerCase()}@example.com`,
                    kinOccupation: "Student",
                    kinAddress: `No ${i}, ${fn} Close, Lagos State`,

                    doctorName: "Dr. Medical Professional",
                    doctorPhone: "+2349012345678",
                    doctorWhatsapp: "+2349012345678",
                    doctorEmail: "doctor@hospital.com",
                    doctorAddress: "General Hospital Health Road, Abuja",
                    ailments: i % 10 === 0 ? "Asthma" : "None",
                    foodAllergies: i % 15 === 0 ? "Peanuts" : "None",
                    bloodGroup: ["A+", "B+", "O+", "AB-"][Math.floor(Math.random() * 4)],
                    genotype: ["AA", "AS", "AC"][Math.floor(Math.random() * 3)],
                });
                const studentId = newStudent.insertId;

                // Create JAMB Record (for WhatsApp tests)
                const phone = `+234${Math.floor(1000000000 + Math.random() * 9000000000)}`;
                await tx.insert(jambCandidates).values({
                    jambRegNo: `JAMB/${matricPrefix}/${String(i).padStart(5, '0')}`,
                    surname: ln,
                    firstname: fn,
                    dob: "2006-05-15",
                    email: email,
                    phone: phone,
                    isClaimed: true,
                    claimedUserId: userId,
                    deptId: prog.deptId
                });

                createdCount++;
            }
        });

        revalidatePath("/admin/students");
        return {
            success: true,
            message: `Successfully seeded ${createdCount} diverse student records across all programmes.`
        };

    } catch (error: any) {
        console.error("Critical Seeding Failure:", error);
        return { success: false, error: error.message };
    }
}
