"use server";

import { MatriculationRegisterService } from "@/services/MatriculationRegisterService";
import { revalidatePath } from "next/cache";
import { hasRole } from "@/lib/rbac";
import { headers } from "next/headers";

export async function signMatriculationOathAction(data: {
    studentId: number,
    sessionId: number,
    signature: string
}) {
    try {
        const headerList = headers();
        const ip = headerList.get("x-forwarded-for") || "unknown";
        const ua = headerList.get("user-agent") || "unknown";

        await MatriculationRegisterService.signRegister({
            ...data,
            ipAddress: ip,
            userAgent: ua
        });

        revalidatePath("/student/matriculation");
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function checkMatriculationStatusAction(studentId: number, sessionId: number) {
    try {
        const status = await MatriculationRegisterService.checkStatus(studentId, sessionId);
        return { success: true, signed: status };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function getMatriculationLedgerAction(sessionId: number) {
    try {
        const isAuth = await hasRole("admin") || await hasRole("superadmin") || await hasRole("registrar");
        if (!isAuth) throw new Error("Unauthorized: Registrar access required");

        const data = await MatriculationRegisterService.getSessionLedger(sessionId);
        return { success: true, data };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}
