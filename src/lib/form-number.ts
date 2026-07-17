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

export function generateVerificationUrl(formNumber: string): string {
    const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return `${base}/verify/${encodeURIComponent(formNumber)}`;
}
