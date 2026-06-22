"use server";

import { auth } from "@/auth";
import { TraitService } from "@/services/TraitService";
import { revalidatePath } from "next/cache";

export async function getStudentTraitsAction(
    studentId: number,
    sessionId: number,
    term: number,
    branchId?: number
) {
    const sessionUser = await auth();
    if (!sessionUser?.user) return { success: false, error: "Unauthorized" };

    try {
        const data = await TraitService.getStudentRatings(studentId, sessionId, term, branchId);
        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function saveStudentTraitsAction(data: {
    studentId: number;
    sessionId: number;
    term: number;
    ratings: { traitId: number; rating: number }[];
}) {
    const sessionUser = await auth();
    const user = sessionUser?.user as any;
    if (!user) return { success: false, error: "Unauthorized" };

    try {
        const userId = parseInt(user.id);
        await TraitService.saveRatings(
            data.studentId,
            data.sessionId,
            data.term,
            data.ratings,
            userId
        );

        revalidatePath("/student/report-sheets");
        return { success: true };
    } catch (error: any) {
        console.error("Save traits error:", error);
        return { success: false, error: error.message };
    }
}
