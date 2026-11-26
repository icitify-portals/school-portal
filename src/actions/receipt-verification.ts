"use server";

import { db } from "@/db/db";
import {
    transactions,
    payment_transactions,
    students,
    users,
    programmes,
    departments,
    admissionApplicationsV2,
} from "@/db/schema";
import { eq, or } from "drizzle-orm";

export interface ReceiptVerificationResult {
    found: boolean;
    authentic: boolean;
    status: "VERIFIED" | "UNPAID_PENDING" | "FAILED" | "REVERSED" | "NOT_FOUND";
    isLegacy?: boolean;
    source?: "transactions" | "payment_transactions";
    reference: string;
    rrr?: string | null;
    amount?: number;
    purpose?: string;
    gateway?: string | null;
    paymentDate?: string | null;
    sessionLabel?: string | null;
    payer?: {
        fullName: string;
        email?: string | null;
        matricNumber?: string | null;
        formNumber?: string | null;
        department?: string | null;
        programme?: string | null;
        level?: string | null;
    };
    warningMessage?: string | null;
}

export async function verifyReceiptByReferenceAction(rawRef: string): Promise<ReceiptVerificationResult> {
    const cleaned = decodeURIComponent(String(rawRef || "")).trim();
    if (!cleaned) {
        return {
            found: false,
            authentic: false,
            status: "NOT_FOUND",
            reference: "",
            warningMessage: "No receipt reference or Remita RRR was provided.",
        };
    }

    try {
        // 1. Search primary `transactions` table by gatewayReference, rrr, or gatewayTransactionId
        const txRows = await db
            .select({
                tx: transactions,
                student: students,
                user: users,
                programme: programmes,
                department: departments,
            })
            .from(transactions)
            .leftJoin(students, eq(transactions.studentId, students.id))
            .leftJoin(users, eq(students.userId, users.id))
            .leftJoin(programmes, eq(students.programmeId, programmes.id))
            .leftJoin(departments, eq(students.deptId, departments.id))
            .where(
                or(
                    eq(transactions.gatewayReference, cleaned),
                    eq(transactions.rrr, cleaned),
                    eq(transactions.gatewayTransactionId, cleaned)
                )
            )
            .limit(1);

        if (txRows.length > 0) {
            const row = txRows[0];
            const tx = row.tx;
            let student = row.student;
            let user = row.user;
            let programme = row.programme;
            let department = row.department;
            let formNumber: string | null = null;

            // If student_id is NULL (e.g. SCH-684-... or ACC-684-... admission flow), resolve via admission_applications_v2
            const appMatch = String(tx.gatewayReference || "").match(/^(?:SCH|ACC|PROC|FORM)-(\d+)-/);
            if (appMatch) {
                const appId = parseInt(appMatch[1]);
                const [appRow] = await db
                    .select()
                    .from(admissionApplicationsV2)
                    .where(eq(admissionApplicationsV2.id, appId))
                    .limit(1);
                if (appRow) {
                    formNumber = appRow.formNumber || appRow.applicationNumber || null;
                    if (!student && appRow.studentId) {
                        const [sRow] = await db
                            .select({
                                student: students,
                                user: users,
                                programme: programmes,
                                department: departments,
                            })
                            .from(students)
                            .leftJoin(users, eq(students.userId, users.id))
                            .leftJoin(programmes, eq(students.programmeId, programmes.id))
                            .leftJoin(departments, eq(students.deptId, departments.id))
                            .where(eq(students.id, appRow.studentId))
                            .limit(1);
                        if (sRow) {
                            student = sRow.student;
                            user = sRow.user;
                            programme = sRow.programme;
                            department = sRow.department;
                        }
                    } else if (!user && appRow.applicantId) {
                        const [uRow] = await db.select().from(users).where(eq(users.id, appRow.applicantId)).limit(1);
                        if (uRow) user = uRow;
                    }
                }
            }

            const rawStatus = String(tx.status || "").toLowerCase();
            const isCompleted = rawStatus === "completed";
            const status: ReceiptVerificationResult["status"] = isCompleted
                ? "VERIFIED"
                : rawStatus === "pending"
                ? "UNPAID_PENDING"
                : rawStatus === "reversed"
                ? "REVERSED"
                : "FAILED";

            const fullName =
                [student?.lastName, student?.firstName, student?.otherNames].filter(Boolean).join(" ").trim() ||
                user?.name ||
                "Unknown Payer";

            return {
                found: true,
                authentic: isCompleted,
                status,
                isLegacy: false,
                source: "transactions",
                reference: tx.gatewayReference || cleaned,
                rrr: tx.rrr || null,
                amount: parseFloat(String(tx.amount || 0)),
                purpose: tx.purpose || "Portal Payment",
                gateway: tx.gateway || null,
                paymentDate: tx.createdAt ? new Date(tx.createdAt).toISOString() : null,
                sessionLabel: null,
                payer: {
                    fullName: fullName.toUpperCase(),
                    email: user?.email || null,
                    matricNumber: student?.matricNumber || student?.admissionNumber || null,
                    formNumber,
                    department: department?.name || null,
                    programme: programme?.name || null,
                    level: student?.currentLevel ? `${student.programmeType || ""} ${student.currentLevel}`.trim() : null,
                },
                warningMessage: isCompleted
                    ? null
                    : `WARNING: This transaction has status "${rawStatus.toUpperCase()}" and has NOT been paid/settled. Do NOT accept any receipt claiming payment for this reference.`,
            };
        }

        // 2. Search `payment_transactions` table (online payments + legacy migrated records)
        const ptRows = await db
            .select({
                pt: payment_transactions,
                user: users,
                student: students,
                programme: programmes,
                department: departments,
            })
            .from(payment_transactions)
            .leftJoin(users, eq(payment_transactions.userId, users.id))
            .leftJoin(students, eq(students.userId, payment_transactions.userId))
            .leftJoin(programmes, eq(students.programmeId, programmes.id))
            .leftJoin(departments, eq(students.deptId, departments.id))
            .where(
                or(
                    eq(payment_transactions.transactionReference, cleaned),
                    eq(payment_transactions.gatewayTransactionId, cleaned)
                )
            )
            .limit(1);

        if (ptRows.length > 0) {
            const row = ptRows[0];
            const pt = row.pt;
            let meta: Record<string, any> = {};
            try {
                meta = pt.metadata ? (typeof pt.metadata === "string" ? JSON.parse(pt.metadata) : pt.metadata) : {};
            } catch {}

            const rawStatus = String(pt.status || "").toLowerCase();
            const isCompleted = ["completed", "paid", "successful", "success"].includes(rawStatus);
            const isLegacy =
                String(pt.paymentMethod || "").toLowerCase() === "legacy" ||
                String(pt.transactionType || "").toLowerCase().includes("legacy");

            const status: ReceiptVerificationResult["status"] = isCompleted
                ? "VERIFIED"
                : rawStatus === "pending"
                ? "UNPAID_PENDING"
                : "FAILED";

            const fullName =
                (meta.fullname && String(meta.fullname).trim()) ||
                [row.student?.lastName, row.student?.firstName, row.student?.otherNames].filter(Boolean).join(" ").trim() ||
                row.user?.name ||
                "Unknown Payer";

            const sessionLabel = meta.session ? String(meta.session) : null;

            return {
                found: true,
                authentic: isCompleted,
                status,
                isLegacy,
                source: "payment_transactions",
                reference: pt.transactionReference,
                rrr: meta.rrr || pt.gatewayTransactionId || null,
                amount: parseFloat(String(pt.amount || 0)),
                purpose: pt.transactionType || "Online Payment",
                gateway: pt.paymentGateway || pt.paymentMethod || null,
                paymentDate: pt.createdAt ? new Date(pt.createdAt).toISOString() : null,
                sessionLabel,
                payer: {
                    fullName: fullName.toUpperCase(),
                    email: meta.email || row.user?.email || null,
                    matricNumber: row.student?.matricNumber || meta.matric_no || meta.jamb_reg || null,
                    formNumber: null,
                    department: row.department?.name || null,
                    programme: row.programme?.name || null,
                    level: row.student?.currentLevel
                        ? `${row.student.programmeType || ""} ${row.student.currentLevel}`.trim()
                        : null,
                },
                warningMessage: !isCompleted
                    ? `WARNING: This transaction has status "${rawStatus.toUpperCase()}" and has NOT been paid.`
                    : isLegacy
                    ? `LEGACY RECORD ALERT: This reference belongs to a historical ${sessionLabel || "legacy"} payment (${pt.transactionType} — ₦${parseFloat(String(pt.amount || 0)).toLocaleString()}). Verify that the payer name, amount, and session match the printed receipt — do NOT accept recycled legacy references for 2026/2027 fees.`
                    : null,
            };
        }

        return {
            found: false,
            authentic: false,
            status: "NOT_FOUND",
            reference: cleaned,
            warningMessage:
                "No transaction matching this reference or RRR exists in the official school portal database. The receipt may be forged or invalid.",
        };
    } catch (error: any) {
        console.error("verifyReceiptByReferenceAction error:", error);
        return {
            found: false,
            authentic: false,
            status: "NOT_FOUND",
            reference: cleaned,
            warningMessage: "Verification error occurred. Please retry.",
        };
    }
}
