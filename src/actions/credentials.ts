"use server";

import { CredentialService } from "@/services/CredentialService";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getMyAchievements() {
    const session = await auth();
    const user = session?.user as any;
    if (!user?.id || user.role !== 'student') {
        return { success: false, error: "Unauthorized" };
    }

    const studentId = parseInt(user.id);
    return await CredentialService.getStudentCredentials(studentId);
}

export async function issueCourseCertificate(courseId: number) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const studentId = parseInt(session.user.id);
    const res = await CredentialService.checkAndIssueCourseCertificate(courseId, studentId);

    if (res.success) {
        revalidatePath("/student/achievements");
    }

    return res;
}

export async function verifyCertificateAction(code: string) {
    return await CredentialService.verifyCertificateByCode(code);
}
