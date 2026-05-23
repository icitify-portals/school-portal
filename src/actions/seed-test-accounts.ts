"use server";

import { db } from "@/db";
import { users, students, staffProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function seedTestAccounts() {
    try {
        const password = "Test@123";
        const hashedPassword = await bcrypt.hash(password, 10);

        // 1. Admin Account
        await db.insert(users).values({
            name: "System Administrator",
            email: "admin@test.edu",
            password: hashedPassword,
            role: "admin",
            status: "active",
            createdAt: new Date(),
        }).onDuplicateKeyUpdate({
            set: { 
                password: hashedPassword,
                status: "active" 
            }
        });

        // 2. Student Account
        await db.insert(users).values({
            name: "John Doe",
            email: "student@test.edu",
            password: hashedPassword,
            role: "student",
            status: "active",
            createdAt: new Date(),
        }).onDuplicateKeyUpdate({
            set: { 
                password: hashedPassword,
                status: "active" 
            }
        });

        // Get the student user ID
        const studentUser = await db.select({ id: users.id }).from(users).where(eq(users.email, "student@test.edu"));
        
        if (studentUser.length > 0) {
            // Create student record
            await db.insert(students).values({
                userId: studentUser[0].id,
                firstName: "John",
                lastName: "Doe",
                matricNumber: "STU/2024/001",
                programmeId: 1,
                deptId: 1,
                currentLevel: 100,
                admissionYear: 2024,
                status: "active",
                gender: "male",
            }).onDuplicateKeyUpdate({
                set: { status: "active" }
            });
        }

        // 3. Lecturer Account (Staff role)
        await db.insert(users).values({
            name: "Dr. Jane Smith",
            email: "lecturer@test.edu",
            password: hashedPassword,
            role: "staff",
            status: "active",
            createdAt: new Date(),
        }).onDuplicateKeyUpdate({
            set: { 
                password: hashedPassword,
                status: "active" 
            }
        });

        // Get the staff user ID
        const staffUser = await db.select({ id: users.id }).from(users).where(eq(users.email, "lecturer@test.edu"));

        if (staffUser.length > 0) {
            try {
                // Create staff profile record without department (departments may not exist yet)
                await db.insert(staffProfiles).values({
                    userId: staffUser[0].id,
                    staffId: "LEC/2024/001",
                    jobTitle: "Lecturer",
                    gradeLevel: "L1",
                    rank: "Senior Lecturer",
                    designation: "Academic Staff",
                    isActive: true,
                }).onDuplicateKeyUpdate({
                    set: { isActive: true }
                });
            } catch (staffError) {
                console.log("Note: Staff profile creation skipped (departments table may be empty)", staffError);
            }
        }

        return {
            success: true,
            message: "Test accounts created successfully",
            accounts: [
                { role: "Admin", email: "admin@test.edu", password: "Test@123" },
                { role: "Student", email: "student@test.edu", password: "Test@123", matric: "STU/2024/001" },
                { role: "Lecturer", email: "lecturer@test.edu", password: "Test@123", staffId: "LEC/2024/001" }
            ]
        };

    } catch (error) {
        console.error("Error seeding test accounts:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
        };
    }
}
