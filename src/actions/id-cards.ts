"use server";

import { auth } from "@/auth";
import { IDCardService } from "@/services/IDCardService";
import { revalidatePath } from "next/cache";

export async function requestIDCardAction(userType: 'student' | 'staff') {
    const session = await auth();
    const user = session?.user as any;
    if (!user?.id) return { success: false, error: "Unauthorized" };

    const userId = parseInt(user.id);

    // Check if card already exists
    const existing = await IDCardService.getActiveCard(userId);
    if (existing) return { success: true, message: "ID Card already issued", card: existing };

    const res = await IDCardService.issueIDCard(userId, userType);
    if (res.success) {
        revalidatePath(`/${userType}/id-card`);
    }
    return res;
}

export async function getMyIDCardAction() {
    const session = await auth();
    const user = session?.user as any;
    if (!user?.id) return null;

    return await IDCardService.getActiveCard(parseInt(user.id));
}

export async function getVerificationDataAction(code: string) {
    return await IDCardService.verifyIDCard(code);
}

export async function generateQRAction(code: string) {
    return await IDCardService.generateVerificationQR(code);
}

export async function getAllIDCardsAction(limit = 50, offset = 0) {
    const session = await auth();
    const user = session?.user as any;
    if (!user?.id || user.role !== 'admin') return [];

    return await IDCardService.getAllIDCards(limit, offset);
}

export async function revokeIDCardAction(cardId: number) {
    const session = await auth();
    const user = session?.user as any;
    if (!user?.id || user.role !== 'admin') return { success: false, error: "Unauthorized" };

    const res = await IDCardService.revokeCard(cardId);
    if (res.success) {
        revalidatePath("/admin/identity/id-cards");
    }
    return res;
}
