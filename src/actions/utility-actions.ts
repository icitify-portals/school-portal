"use server";

import { InstitutionalUtilsService } from "@/services/InstitutionalUtilsService";

export async function spelloutAmountAction(amount: number) {
    try {
        const words = InstitutionalUtilsService.spellout(amount);
        return { success: true, words };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function generateIdentityQRCodeAction(content: string) {
    try {
        const dataUrl = await InstitutionalUtilsService.generateQRCode(content);
        return { success: true, dataUrl };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function hashInstitutionalPasswordAction(password: string) {
    try {
        const hash = await InstitutionalUtilsService.hashPassword(password);
        return { success: true, hash };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}
