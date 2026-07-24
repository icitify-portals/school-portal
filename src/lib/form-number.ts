import crypto from "crypto";
import { db } from "@/db";
import { admissionApplicationsV2 } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

const LEVEL_MAP: Record<string, string> = {
    primary: "PR",
    secondary: "SC",
    tertiary: "UG",
};

const INSTITUTION_CODE = "FSS";

export async function generateFormNumber(level: string): Promise<string> {
    const year = new Date().getFullYear();
    const levelCode = LEVEL_MAP[level] || "UG";

    const prefix = `${INSTITUTION_CODE}/${year}/${levelCode}/`;

    const [row] = await db
        .select({ maxNum: sql<number>`COALESCE(MAX(CAST(SUBSTRING_INDEX(form_number, '/', -1) AS UNSIGNED)), 0)` })
        .from(admissionApplicationsV2)
        .where(sql`form_number LIKE ${prefix + "%"}`);

    const nextNum = (row?.maxNum || 0) + 1;
    const numStr = nextNum.toString().padStart(5, "0");

    return `${prefix}${numStr}`;
}

export function generateFormHash(
    formNumber: string,
    applicantName: string,
    dateOfBirth: string,
    photoUrl: string
): string {
    const payload = `${formNumber}|${applicantName}|${dateOfBirth}|${photoUrl}|${Date.now()}`;
    return crypto.createHash("sha256").update(payload).digest("hex").substring(0, 16).toUpperCase();
}

export async function checkAndGenerateFormNumber(applicationId: number, transactionDb: any = db): Promise<{ success: boolean; formNumber?: string }> {
    const { admissionFormTemplates } = await import('@/db/schema');
    const [app] = await transactionDb.select({
        id: admissionApplicationsV2.id,
        formNumber: admissionApplicationsV2.formNumber,
        paymentStatus: admissionApplicationsV2.paymentStatus,
        processingFeeStatus: admissionApplicationsV2.processingFeeStatus,
        template: {
            level: admissionFormTemplates.level,
            applicationFee: admissionFormTemplates.applicationFee,
            processingFee: admissionFormTemplates.processingFee
        }
    }).from(admissionApplicationsV2)
      .innerJoin(admissionFormTemplates, eq(admissionApplicationsV2.templateId, admissionFormTemplates.id))
      .where(eq(admissionApplicationsV2.id, applicationId))
      .limit(1);

    if (!app) return { success: false };

    // Determine if fully paid
    const isAppFeePaid = app.template.applicationFee === '0.00' || app.paymentStatus === 'paid';
    const isProcFeePaid = app.template.processingFee === '0.00' || app.processingFeeStatus === 'paid';

    if (isAppFeePaid && isProcFeePaid && !app.formNumber) {
        const newFormNumber = await generateFormNumber(app.template.level || 'tertiary');
        await transactionDb.update(admissionApplicationsV2)
            .set({ formNumber: newFormNumber })
            .where(eq(admissionApplicationsV2.id, applicationId));
        return { success: true, formNumber: newFormNumber };
    }
    
    return { success: !!app.formNumber, formNumber: app.formNumber || undefined };
}
