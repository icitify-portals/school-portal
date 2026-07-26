"use server";

import { db } from "@/db/db";
import { students } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";

export async function transitionToAlumni(studentId: number) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" };
        }

        const [student] = await db.select({ programmeType: students.programmeType })
            .from(students).where(eq(students.id, studentId)).limit(1);
        
        const gradStatus = student?.programmeType === 'HND' ? 'hnd_graduated' : 'nd_graduated';

        await db.update(students)
            .set({ 
                status: gradStatus,
                isProfileLocked: true, 
                isFinanciallyLocked: true 
            })
            .where(eq(students.id, studentId));

        return { success: true };
    } catch (error: any) {
        console.error("Failed to transition student:", error);
        return { success: false, error: error.message };
    }
}
