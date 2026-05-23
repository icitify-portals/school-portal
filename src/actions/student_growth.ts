"use server";

import { db } from "@/db/db";
import { studentCertifications, students, users } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function getStudentCertifications(studentId?: number) {
    let query = db.select({
        certification: studentCertifications,
        student: students,
        user: users,
    })
        .from(studentCertifications)
        .innerJoin(students, eq(studentCertifications.studentId, students.id))
        .innerJoin(users, eq(students.userId, users.id))
        .$dynamic();

    if (studentId) {
        query = query.where(eq(studentCertifications.studentId, studentId));
    }

    return await query.orderBy(desc(studentCertifications.createdAt));
}

export async function uploadStudentCertification(data: any) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    try {
        await db.insert(studentCertifications).values({
            ...data,
            completionDate: data.completionDate ? new Date(data.completionDate) : null,
            expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
            status: 'pending',
        });
        revalidatePath("/student/growth");
        revalidatePath("/admin/hr/relations"); // Maybe admin also sees student growth? 
        return { success: true };
    } catch (error) {
        console.error("Upload certification error:", error);
        return { success: false, error: "Failed to upload certification" };
    }
}

export async function verifyStudentCertification(id: number, status: 'verified' | 'rejected') {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    try {
        await db.update(studentCertifications)
            .set({
                status,
                verifiedBy: parseInt(session.user.id),
                verifiedAt: new Date()
            })
            .where(eq(studentCertifications.id, id));
        revalidatePath("/admin/hr/relations");
        revalidatePath("/student/growth");
        return { success: true };
    } catch (error) {
        console.error("Verify certification error:", error);
        return { success: false, error: "Failed to verify certification" };
    }
}
