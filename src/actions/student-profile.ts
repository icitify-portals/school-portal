"use server";

import { db } from "@/db/db";
import { students, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getStudentProfileStatus() {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Not authenticated" };

    const student = await db.query.students.findFirst({
        where: eq(students.userId, session.user.id),
        columns: {
            id: true,
            firstName: true,
            lastName: true,
            otherNames: true,
            gender: true,
            nin: true,
            jambNumber: true,
            phone: true,
            stateOfOrigin: true,
            lga: true,
            profileCompleted: true,
            currentLevel: true,
            programmeType: true,
            deptId: true,
            matricNumber: true,
            currentSessionId: true,
            admissionYear: true,
            studyMode: true,
        },
    });

    if (!student) return { success: false, error: "Student record not found" };

    const user = await db.query.users.findFirst({
        where: eq(users.id, session.user.id),
        columns: { email: true, phone: true },
    });

    const missing: string[] = [];
    if (!student.firstName?.trim()) missing.push("first_name");
    if (!student.lastName?.trim()) missing.push("last_name");
    if (!student.gender) missing.push("gender");
    if (!student.nin?.trim()) missing.push("nin");
    if (!student.jambNumber?.trim()) missing.push("jamb_number");
    if (!student.stateOfOrigin?.trim()) missing.push("state_of_origin");
    if (!student.lga?.trim()) missing.push("lga");
    if (!user?.phone?.trim()) missing.push("phone");
    if (!user?.email?.trim()) missing.push("email");

    return {
        success: true,
        profile: {
            ...student,
            email: user?.email || "",
            phone: user?.phone || student.phone || "",
        },
        missing,
        isComplete: missing.length === 0 || student.profileCompleted === true,
    };
}

export async function completeStudentProfile(data: {
    firstName: string;
    lastName: string;
    otherNames?: string;
    gender: string;
    nin: string;
    jambNumber: string;
    phone: string;
    email: string;
    stateOfOrigin: string;
    lga: string;
}) {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Not authenticated" };

    const student = await db.query.students.findFirst({
        where: eq(students.userId, session.user.id),
        columns: { id: true },
    });
    if (!student) return { success: false, error: "Student record not found" };

    // Validate required fields
    if (!data.firstName?.trim()) return { success: false, error: "First name is required" };
    if (!data.lastName?.trim()) return { success: false, error: "Last name is required" };
    if (!data.gender) return { success: false, error: "Gender is required" };
    if (!data.nin?.trim() || data.nin.trim().length !== 11) return { success: false, error: "NIN must be exactly 11 digits" };
    if (!data.jambNumber?.trim()) return { success: false, error: "JAMB Registration Number is required" };
    if (!data.phone?.trim()) return { success: false, error: "Phone number is required" };
    if (!data.email?.trim()) return { success: false, error: "Email is required" };
    if (!data.stateOfOrigin?.trim()) return { success: false, error: "State of Origin is required" };
    if (!data.lga?.trim()) return { success: false, error: "Local Government Area is required" };

    // Update student record
    await db.update(students)
        .set({
            firstName: data.firstName.trim(),
            lastName: data.lastName.trim(),
            otherNames: data.otherNames?.trim() || null,
            gender: data.gender as any,
            nin: data.nin.trim(),
            jambNumber: data.jambNumber.trim(),
            stateOfOrigin: data.stateOfOrigin.trim(),
            lga: data.lga.trim(),
            phone: data.phone.trim(),
            profileCompleted: true,
        })
        .where(eq(students.id, student.id));

    // Update user record
    await db.update(users)
        .set({
            firstName: data.firstName.trim(),
            surname: data.lastName.trim(),
            phone: data.phone.trim(),
            email: data.email.trim(),
        })
        .where(eq(users.id, session.user.id));

    revalidatePath("/student");
    revalidatePath("/student/complete-profile");
    return { success: true, message: "Profile completed successfully." };
}