"use server";

import { db } from "@/db/db";
import { bankStatements, bankStatementEntries, generalLedger, users } from "@/db/schema";
import { eq, and, desc, sql, like, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function uploadBankStatement(data: {
    filename: string;
    uploadedBy: number;
    bankName: string;
    csvContent: string;
}) {
    try {
        const [statement] = await db.insert(bankStatements).values({
            filename: data.filename,
            uploadedBy: data.uploadedBy,
            bankName: data.bankName,
            statementDate: new Date()
        });

        const lines = data.csvContent.split('\n').filter(line => line.trim());
        const entries = [];

        // Simple CSV parser (assuming Date,Description,Reference,Debit,Credit)
        // Skip header if it exists
        const startIdx = lines[0].toLowerCase().includes('date') ? 1 : 0;

        for (let i = startIdx; i < lines.length; i++) {
            const parts = lines[i].split(',').map(p => p.trim());
            if (parts.length < 5) continue;

            const [dateStr, desc, ref, deb, cre] = parts;
            entries.push({
                statementId: statement.insertId,
                transactionDate: new Date(dateStr),
                description: desc,
                reference: ref,
                debit: deb || "0.00",
                credit: cre || "0.00",
                status: 'unmatched'
            } as any);
        }

        if (entries.length > 0) {
            await db.insert(bankStatementEntries).values(entries);
        }

        revalidatePath("/admin/bursary/reconciliation");
        return { success: true, statementId: statement.insertId };
    } catch (error) {
        console.error("Upload failed:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function getBankStatements() {
    try {
        return await db.select().from(bankStatements).orderBy(desc(bankStatements.createdAt));
    } catch (error) {
        console.error("Failed to fetch statements:", error);
        return [];
    }
}

export async function getReconciliationEntries(statementId: number) {
    try {
        const bankEntries = await db.select().from(bankStatementEntries).where(eq(bankStatementEntries.statementId, statementId));

        // Enhance with suggested matches
        const entriesWithMatches = await Promise.all(bankEntries.map(async (entry) => {
            if (entry.status === 'matched') return { ...entry, suggestedMatch: null };

            const amount = parseFloat(entry.debit || "0") > 0 ? entry.debit : entry.credit;
            const isDebit = parseFloat(entry.debit || "0") > 0;

            // Simple matching logic: find GL entry with same amount and similar reference/description
            const suggested = await db.select().from(generalLedger).where(
                and(
                    isDebit ? eq(generalLedger.debit, amount!) : eq(generalLedger.credit, amount!),
                    or(
                        like(generalLedger.reference, `%${entry.reference}%`),
                        like(generalLedger.description, `%${entry.description}%`)
                    )
                )
            ).limit(1);

            return {
                ...entry,
                suggestedMatch: suggested[0] || null
            };
        }));

        return entriesWithMatches;
    } catch (error) {
        console.error("Failed to fetch entries:", error);
        return [];
    }
}

export async function matchEntry(entryId: number, ledgerId: number) {
    try {
        await db.update(bankStatementEntries)
            .set({
                status: 'matched',
                matchedLedgerId: ledgerId
            })
            .where(eq(bankStatementEntries.id, entryId));

        revalidatePath("/admin/bursary/reconciliation");
        return { success: true };
    } catch (error) {
        console.error("Match failed:", error);
        return { success: false, error: (error as Error).message };
    }
}
