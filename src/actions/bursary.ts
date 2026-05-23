"use server";

import { db } from "@/db/db";
import {
    feeItems,
    feeStructures,
    feeStructureItems,
    feeAllocations,
    discounts,
    bursarySettings,
    studentLedger,
    students,
    transactions,
    users,
    vendors,
    studentBills,
    studentBillItems,
    scholarships,
    studentScholarships,
    academicSessions,
    programmes,
    departments,
    faculties,
    refundRequests,
    nelfundDisbursements,
    nelfundBeneficiaries,
    externalInflows,
    expenditureRequests
} from "@/db/schema";
import { eq, and, desc, sql, inArray, gte, lte, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { hasRole, hasPermission } from "@/lib/rbac";
import { recordTransaction } from "./accounting";
import { getBudgetAnalysis } from "./budgets";
import { getCurrentSession } from "./portal";
import { getBrandingSettings } from "./settings";
import { BursaryService } from "@/services/BursaryService";
import { NotificationService } from "@/services/NotificationService";
import { OfficialService } from "@/services/OfficialService";
import { ExcelBacklogService } from "@/services/ExcelBacklogService";

// --- MIDDLEWARE HELPERS ---
async function ensureBursar() {
    const isBursar = await hasRole("bursar");
    if (!isBursar) throw new Error("Unauthorized: Only the Bursar can perform this action");
}

async function ensureBursaryStaff() {
    const isStaff = await hasRole("bursary_staff");
    const isBursar = await hasRole("bursar");
    if (!isStaff && !isBursar) throw new Error("Unauthorized: Bursary staff access required");
}

// --- Excel Backlog ---
export async function listBacklogs(branchId: number) {
    await ensureBursaryStaff();
    return await ExcelBacklogService.listUploads(branchId);
}

export async function previewBacklog(filePath: string) {
    await ensureBursaryStaff();
    return await ExcelBacklogService.previewFile(filePath);
}

export async function initiateBacklog(data: { name: string; filePath: string; branchId: number; uploadedBy: number }) {
    await ensureBursaryStaff();
    return await ExcelBacklogService.initiateUpload(data.name, data.filePath, data.branchId, data.uploadedBy);
}

export async function processBacklog(uploadId: number, filePath: string) {
    await ensureBursaryStaff();
    const res = await ExcelBacklogService.processFile(uploadId, filePath);
    revalidatePath("/admin/bursary/backlog");
    return res;
}

export async function deleteBacklog(uploadId: number) {
    await ensureBursaryStaff();
    const res = await ExcelBacklogService.deleteUpload(uploadId);
    revalidatePath("/admin/bursary/backlog");
    return res;
}

// --- Fee Items ---
export async function getFeeItems() {
    return await db.select().from(feeItems);
}

export async function createFeeItem(data: { name: string; description?: string; isRequired?: boolean }) {
    try {
        await db.insert(feeItems).values(data);
        revalidatePath("/admin/bursary/fees");
        return { success: true };
    } catch (error) {
        console.error("Failed to create fee item:", error);
        return { success: false, error: "Failed to create fee item" };
    }
}

// --- Fee Structures ---
export async function getFeeStructures() {
    try {
        const structures = await db.select().from(feeStructures);

        // Fetch relations separately using explicit joins
        const allItemsRaw = await db
            .select({
                item: feeItems,
                structureItem: feeStructureItems,
            })
            .from(feeStructureItems)
            .innerJoin(feeItems, eq(feeStructureItems.feeItemId, feeItems.id));

        const allUsers = await db.select().from(users);

        return structures.map(s => ({
            ...s,
            items: allItemsRaw
                .filter(i => i.structureItem.feeStructureId === s.id)
                .map(i => ({
                    ...i.structureItem,
                    item: i.item
                })),
            approvedBy: allUsers.find(u => u.id === s.approvedBy)
        }));
    } catch (error) {
        console.error("Failed to fetch fee structures:", error);
        return [];
    }
}

export async function createFeeStructure(data: {
    name: string;
    academicYear?: string;
    level: number;
    items: { feeItemId: number; amount: string; semester: '1' | '2' | 'both' }[]
}) {
    try {
        let yearToUse = data.academicYear;
        if (!yearToUse) {
            const currentSession = await getCurrentSession();
            yearToUse = currentSession?.name || "2025/2026";
        }

        const result = await db.transaction(async (tx) => {
            const [newStructure] = await tx.insert(feeStructures).values({
                name: data.name,
                academicYear: yearToUse,
                level: data.level,
                status: 'draft'
            });

            if (data.items.length > 0) {
                await tx.insert(feeStructureItems).values(
                    data.items.map(item => ({
                        feeStructureId: newStructure.insertId,
                        feeItemId: item.feeItemId,
                        amount: item.amount,
                        semester: item.semester
                    }))
                );
            }
            return newStructure.insertId;
        });

        revalidatePath("/admin/bursary/fees");
        return { success: true, id: result };
    } catch (error) {
        console.error("Failed to create fee structure:", error);
        return { success: false, error: "Failed to create fee structure" };
    }
}

export async function approveFeeStructure(id: number, userId: number) {
    try {
        await db.update(feeStructures)
            .set({
                status: 'approved',
                approvedBy: userId,
                approvedAt: new Date()
            })
            .where(eq(feeStructures.id, id));

        revalidatePath("/admin/bursary/fees");
        return { success: true };
    } catch (error) {
        console.error("Failed to approve fee structure:", error);
        return { success: false, error: "Failed to approve fee structure" };
    }
}

// --- Fee Allocations ---
export async function allocateFeeStructure(data: {
    feeStructureId: number;
    facultyId?: number;
    deptId?: number;
    programmeId?: number;
    level?: number;
    academicYear?: string;
    semester?: '1' | '2' | 'both';
}) {
    try {
        let yearToUse = data.academicYear;
        let semesterToUse = data.semester || 'both';

        if (!yearToUse) {
            const currentSession = await getCurrentSession();
            yearToUse = currentSession?.name || "2025/2026";
            if (!data.semester) semesterToUse = (currentSession?.currentSemester as '1' | '2') || '1';
        }

        await db.insert(feeAllocations).values({
            feeStructureId: data.feeStructureId,
            facultyId: data.facultyId,
            deptId: data.deptId,
            programmeId: data.programmeId,
        });
        revalidatePath("/admin/bursary/allocations");
        return { success: true };
    } catch (error) {
        console.error("Failed to allocate fee structure:", error);
        return { success: false, error: "Failed to allocate fee structure" };
    }
}

// --- Discounts ---
export async function requestDiscount(data: {
    studentId: number;
    feeItemId?: number;
    amount?: string;
    percentage?: string;
    reason: string;
}) {
    try {
        await db.insert(discounts).values(data);
        return { success: true };
    } catch (error) {
        console.error("Failed to request discount:", error);
        return { success: false, error: "Failed to request discount" };
    }
}

export async function approveDiscount(id: number, userId: number) {
    try {
        await db.update(discounts)
            .set({
                status: 'approved',
                approvedBy: userId,
                approvedAt: new Date()
            })
            .where(eq(discounts.id, id));

        revalidatePath("/admin/bursary/discounts");
        return { success: true };
    } catch (error) {
        console.error("Failed to approve discount:", error);
        return { success: false, error: "Failed to approve discount" };
    }
}

// --- Ledger & Payments ---
export async function getStudentLedger(studentId: number) {
    try {
        const ledger = await db.select()
            .from(studentLedger)
            .where(eq(studentLedger.studentId, studentId))
            .orderBy(desc(studentLedger.createdAt));

        // Fetch transactions separately
        const tIds = ledger.map(l => l.transactionId).filter(Boolean) as number[];
        const txs = tIds.length > 0
            ? await db.select().from(transactions).where(sql`${transactions.id} in (${sql.join(tIds, sql`,`)})`)
            : [];

        return ledger.map(l => ({
            ...l,
            transaction: txs.find(t => t.id === l.transactionId)
        }));
    } catch (error) {
        console.error("Failed to fetch student ledger:", error);
        return [];
    }
}

export async function processPayment(data: {
    studentId: number;
    amount: string;
    purpose: string;
    gateway?: 'paystack' | 'flutterwave' | 'remita' | 'opay' | 'manual';
    gatewayReference?: string;
}) {
    try {
        const result = await db.transaction(async (tx) => {
            // 1. Create transaction
            const [newTx] = await tx.insert(transactions).values({
                studentId: data.studentId,
                amount: data.amount,
                type: 'credit',
                purpose: data.purpose,
                status: 'completed',
                gateway: data.gateway || 'manual',
                gatewayReference: data.gatewayReference
            });

            // 2. Get current student balance
            const [student] = await tx.select().from(students).where(eq(students.id, data.studentId));
            const currentBalance = parseFloat(student.walletBalance || '0');
            const paymentAmount = parseFloat(data.amount);
            const newBalance = currentBalance + paymentAmount;

            // 3. Update student wallet
            await tx.update(students)
                .set({ walletBalance: newBalance.toFixed(2) })
                .where(eq(students.id, data.studentId));

            // 4. Record in Ledger
            // First get the last ledger balance
            const [lastLedgerEntry] = await tx.select()
                .from(studentLedger)
                .where(eq(studentLedger.studentId, data.studentId))
                .orderBy(desc(studentLedger.createdAt))
                .limit(1);

            const lastBalance = lastLedgerEntry ? parseFloat(lastLedgerEntry.balance) : 0;
            // In a school portal ledger, usually charges (debits) increase balance owed, 
            // and payments (credits) decrease balance owed.
            // So: newBalanceOwed = lastBalance - paymentAmount
            const newBalanceOwed = lastBalance - paymentAmount;

            await tx.insert(studentLedger).values({
                studentId: data.studentId,
                transactionId: newTx.insertId,
                description: data.purpose,
                credit: data.amount,
                balance: newBalanceOwed.toFixed(2)
            });

            return { success: true, transactionId: newTx.insertId };
        });

        revalidatePath("/student/finance");

        // Send Multi-channel Confirmation (Toast + Email + WhatsApp)
        if (result.success) {
            const studentRows = await db.select({
                student: students,
                user: users
            })
                .from(students)
                .innerJoin(users, eq(students.userId, users.id))
                .where(eq(students.id, data.studentId))
                .limit(1);

            const student = studentRows[0] ? {
                ...studentRows[0].student,
                user: studentRows[0].user
            } : null;

            if (student?.user?.id) {
                NotificationService.notifyTransaction(student.user.id, {
                    amount: data.amount,
                    purpose: data.purpose,
                    type: 'credit',
                    status: 'completed'
                });
            }

            // Keep WhatsApp as fallback/legacy integration
            if (student?.barcode) {
                NotificationService.sendDirectWhatsApp(
                    student.barcode,
                    `✅ Payment Confirmed: Your payment of ₦${data.amount} for "${data.purpose}" was successful.`
                );
            }
        }

        // --- Automated GL Posting (Phase 3) ---
        if (result.success) {
            try {
                const settings = await getBursarySettings();
                const bankAcc = settings['gl_cash_bank_account'];
                const revenueAcc = settings['gl_tuition_revenue_account'];
                const staffId = 1; // System default or current user

                if (bankAcc && revenueAcc) {
                    await recordTransaction({
                        description: `Fee Payment: ${data.purpose} (Student ID: ${data.studentId})`,
                        recordedBy: staffId,
                        entries: [
                            { accountId: parseInt(bankAcc), debit: data.amount, credit: "0" },    // Bank (Asset) DR ↑
                            { accountId: parseInt(revenueAcc), debit: "0", credit: data.amount }  // Revenue CR ↑
                        ]
                    });
                }
            } catch (glError) {
                console.error("Automated GL Posting failed (Fees):", glError);
                // We don't fail the payment if GL posting fails, but we log it
            }
        }

        return result;
    } catch (error) {
        console.error("Failed to process payment:", error);
        return { success: false, error: "Failed to process payment" };
    }
}

// --- School Bills ---

export async function getStudentBills(studentId: number) {
    try {
        const bills = await db.select().from(studentBills)
            .where(eq(studentBills.studentId, studentId))
            .orderBy(desc(studentBills.createdAt));

        const sessionData = await db.select().from(academicSessions);
        const billItemsRaw = await db.select({
            items: studentBillItems,
            fee: feeItems
        }).from(studentBillItems)
            .innerJoin(feeItems, eq(studentBillItems.feeItemId, feeItems.id));

        return bills.map(b => ({
            ...b,
            session: sessionData.find(s => s.id === b.sessionId),
            items: billItemsRaw.filter(bi => bi.items.billId === b.id).map(bi => ({
                ...bi.items,
                feeItem: bi.fee
            }))
        }));
    } catch (error) {
        console.error("Failed to fetch student bills:", error);
        return [];
    }
}

export async function generateBillForStudent(data: {
    studentId: number;
    sessionId: number;
    note?: string;
}) {
    try {
        await ensureBursaryStaff();
        const res = await BursaryService.processSingleStudentBill(data.studentId, data.sessionId, data.note);

        revalidatePath("/student/finance");
        revalidatePath("/admin/bursary/bills");
        return res;
    } catch (error) {
        console.error("Failed to generate bill:", error);
        return { success: false, error: (error as Error).message };
    }
}

// processSingleStudentBill moved to BursaryService

export async function generateBatchBills(data: {
    sessionId: number;
    scope: 'all' | 'department' | 'level' | 'programme';
    filters: {
        deptId?: number;
        level?: number;
        programmeId?: number;
    };
    note?: string;
}) {
    try {
        await ensureBursaryStaff();
        const res = await BursaryService.queueBatchBilling(data);

        revalidatePath("/admin/bursary/bills");
        return res;
    } catch (error) {
        console.error("Batch bill generation failed:", error);
        return { success: false, error: (error as Error).message };
    }
}

// --- Reversals & Gateway Verification ---

export async function reverseTransaction(transactionId: number) {
    try {
        await ensureBursaryStaff();

        const result = await db.transaction(async (tx) => {
            const [transaction] = await tx.select().from(transactions).where(eq(transactions.id, transactionId));
            if (!transaction) throw new Error("Transaction not found");
            if (transaction.status === 'reversed') throw new Error("Transaction is already reversed");

            // 1. Update status
            await tx.update(transactions).set({ status: 'reversed' }).where(eq(transactions.id, transactionId));

            // 2. Reverse Ledger Impact
            const [student] = await tx.select().from(students).where(eq(students.id, transaction.studentId!));
            const [lastLedgerEntry] = await tx.select()
                .from(studentLedger)
                .where(eq(studentLedger.studentId, transaction.studentId!))
                .orderBy(desc(studentLedger.createdAt))
                .limit(1);

            const lastBalance = lastLedgerEntry ? parseFloat(lastLedgerEntry.balance) : 0;
            const amount = parseFloat(transaction.amount);

            let newBalanceOwed;
            let debit = "0.00";
            let credit = "0.00";

            if (transaction.type === 'credit') {
                newBalanceOwed = lastBalance + amount;
                debit = transaction.amount;
            } else {
                newBalanceOwed = lastBalance - amount;
                credit = transaction.amount;
            }

            await tx.insert(studentLedger).values({
                studentId: transaction.studentId!,
                transactionId: transaction.id,
                description: `REVERSAL of Ref: ${transaction.id} (${transaction.purpose})`,
                debit: debit,
                credit: credit,
                balance: newBalanceOwed.toFixed(2)
            });

            // 3. Update Wallet Balance
            const currentWallet = parseFloat(student.walletBalance || "0");
            const newWallet = transaction.type === 'credit' ? currentWallet - amount : currentWallet + amount;

            await tx.update(students)
                .set({ walletBalance: newWallet.toFixed(2) })
                .where(eq(students.id, student.id));

            return { success: true };
        });

        revalidatePath("/student/finance");
        revalidatePath("/admin/bursary/history");
        return result;
    } catch (error) {
        console.error("Failed to reverse transaction:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function reverseExternalInflow(inflowId: number) {
    try {
        await ensureBursaryStaff();
        await db.update(externalInflows)
            .set({ status: 'reversed' })
            .where(eq(externalInflows.id, inflowId));

        revalidatePath("/admin/bursary/inflows");
        return { success: true };
    } catch (error) {
        console.error("Failed to reverse external inflow:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function verifyGatewayPayment(reference: string, gateway: 'paystack' | 'flutterwave' | 'remita' | 'opay') {
    try {
        const { GatewayTransactionService } = await import("@/services/GatewayTransactionService");
        const res = await GatewayTransactionService.verifyTransaction(gateway, reference);

        if (res.success) {
            // --- CONSOLIDATION HOOK ---
            const { FinancialConsolidationService } = await import("@/services/FinancialConsolidationService");
            const [transaction] = await db.select({
                studentId: transactions.studentId,
                amount: transactions.amount,
                studentName: users.name
            })
            .from(transactions)
            .innerJoin(students, eq(transactions.studentId, students.id))
            .innerJoin(users, eq(students.userId, users.id))
            .where(eq(transactions.gatewayReference, reference))
            .limit(1);

            if (transaction) {
                await FinancialConsolidationService.postStudentPaymentToGL({
                    amount: res.amount,
                    studentId: transaction.studentId!,
                    studentName: transaction.studentName!,
                    feeItemId: (transaction as any).feeItemId,
                    reference: reference,
                    method: 'gateway',
                    recordedBy: 0 // System automated
                });
            }
        }

        return { 
            success: res.success, 
            verified: res.success,
            status: res.status,
            amount: res.amount
        };
    } catch (error) {
        console.error(`Failed to verify ${gateway} payment:`, error);
        return { success: false, error: "Payment verification failed" };
    }
}

// --- Bursary Settings ---
export async function getBursarySettings() {
    const settings = await db.select().from(bursarySettings);
    return settings.reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
    }, {} as Record<string, string>);
}

export async function updateBursarySetting(key: string, value: string) {
    try {
        await db.insert(bursarySettings)
            .values({ key, value })
            .onDuplicateKeyUpdate({ set: { value } });

        revalidatePath("/admin/bursary/settings");
        return { success: true };
    } catch (error) {
        console.error("Failed to update setting:", error);
        return { success: false, error: "Failed to update setting" };
    }
}

// --- Expenditure (Outflow) ---
export async function getExpenditureRequests() {
    try {
        const requests = await db.select().from(expenditureRequests).orderBy(desc(expenditureRequests.createdAt));

        // Fetch relations separately
        const allUsers = await db.select().from(users);
        const allDepts = await db.select().from(departments);
        const allFaculties = await db.select().from(faculties);
        const allVendors = await db.select().from(vendors);

        // faculties/departments are from schema, need to verify imports
        // Wait, the file doesn't have departments, faculties, vendors imported.
        // I need to add them to the imports at the top.

        return requests.map(r => ({
            ...r,
            requestedBy: allUsers.find(u => u.id === r.requestedBy),
            approvedBy: allUsers.find(u => u.id === r.approvedBy),
            department: allDepts.find(d => d.id === r.departmentId),
            faculty: allFaculties.find(f => f.id === r.facultyId),
            vendor: allVendors.find(v => v.id === r.vendorId)
        }));
    } catch (error) {
        console.error("Failed to fetch expenditure requests:", error);
        return [];
    }
}

export async function createExpenditureRequest(data: {
    title: string;
    purpose: string;
    amount: string;
    requestedBy: number;
    departmentId?: number;
    facultyId?: number;
    vendorId?: number;
    dueDate?: Date;
    attachmentUrl?: string;
}) {
    try {
        await db.insert(expenditureRequests).values({
            ...data,
            attachmentPath: data.attachmentUrl,
            status: 'pending'
        });
        revalidatePath("/admin/bursary/expenditure");
        revalidatePath("/staff/expenditure");
        return { success: true };
    } catch (error) {
        console.error("Failed to create expenditure request:", error);
        return { success: false, error: "Failed to submit request" };
    }
}

export async function cancelExpenditureRequest(id: number) {
    try {
        const [request] = await db.select().from(expenditureRequests).where(eq(expenditureRequests.id, id));
        if (!request) return { success: false, error: "Request not found" };

        if (request.status !== 'pending') {
            return { success: false, error: "Can only cancel pending requests" };
        }

        await db.update(expenditureRequests)
            .set({ status: 'cancelled' })
            .where(eq(expenditureRequests.id, id));

        revalidatePath("/admin/bursary/expenditure");
        revalidatePath("/staff/expenditure");
        return { success: true };
    } catch (error) {
        console.error("Failed to cancel expenditure request:", error);
        return { success: false, error: "Failed to cancel request" };
    }
}

export async function approveExpenditureRequest(id: number, userId: number, glAccountId?: number, bypassBudget = false) {
    try {
        await ensureBursar();
        const [request] = await db.select().from(expenditureRequests).where(eq(expenditureRequests.id, id));
        if (!request) return { success: false, error: "Request not found" };

        // --- Budget Check (Phase 4) ---
        if (request.departmentId && !bypassBudget) {
            const currentSession = await getCurrentSession();
            const yearToUse = currentSession?.name || `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;
            const analysis = await getBudgetAnalysis(request.departmentId, yearToUse);

            if (analysis.budget > 0 && parseFloat(request.amount) > analysis.remaining) {
                return {
                    success: false,
                    error: `EXCEEDS_BUDGET: This request of ₦${parseFloat(request.amount).toLocaleString()} exceeds the remaining departmental budget of ₦${analysis.remaining.toLocaleString()}.`,
                    analysis
                };
            }
        }

        const poNumber = `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

        await db.update(expenditureRequests)
            .set({
                status: 'approved',
                approvedBy: userId,
                approvedAt: new Date(),
                purchaseOrderNumber: poNumber,
                glAccountId: glAccountId || request.glAccountId
            })
            .where(eq(expenditureRequests.id, id));

        revalidatePath("/admin/bursary/expenditure");
        return { success: true };
    } catch (error) {
        console.error("Failed to approve expenditure:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function disburseExpenditure(id: number) {
    try {
        await ensureBursar();
        const [request] = await db.select().from(expenditureRequests).where(eq(expenditureRequests.id, id));
        if (!request) return { success: false, error: "Request not found" };

        await db.update(expenditureRequests)
            .set({
                status: 'disbursed',
                disbursedAt: new Date()
            })
            .where(eq(expenditureRequests.id, id));

        revalidatePath("/admin/bursary/expenditure");

        // Notify the requester
        NotificationService.notifyTransaction(request.requestedBy, {
            amount: request.amount,
            purpose: request.title,
            type: 'debit',
            status: 'disbursed'
        });

        // --- Automated GL Posting (Phase 3) ---
        try {
            const settings = await getBursarySettings();
            const bankAcc = settings['gl_cash_bank_account'];
            const fallbackExpenseAcc = settings['gl_general_expense_account'];
            const expenseAcc = request.glAccountId ? request.glAccountId.toString() : fallbackExpenseAcc;
            const staffId = 1; // System default

            if (bankAcc && expenseAcc) {
                await recordTransaction({
                    description: `Disbursement: ${request.title} (${request.purchaseOrderNumber || 'No PO'})`,
                    reference: request.purchaseOrderNumber || undefined,
                    recordedBy: staffId,
                    entries: [
                        { accountId: parseInt(expenseAcc), debit: request.amount, credit: "0" }, // Expense DR ↑
                        { accountId: parseInt(bankAcc), debit: "0", credit: request.amount }    // Bank (Asset) CR ↓
                    ]
                });
            }
        } catch (glError) {
            console.error("Automated GL Posting failed (Disbursement):", glError);
        }

        return { success: true };
    } catch (error) {
        console.error("Failed to disburse expenditure:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function getTransactions() {
    try {
        const data = await db.select({
            id: transactions.id,
            amount: transactions.amount,
            type: transactions.type,
            purpose: transactions.purpose,
            status: transactions.status,
            gateway: transactions.gateway,
            gatewayReference: transactions.gatewayReference,
            createdAt: transactions.createdAt,
            student: {
                id: students.id,
                firstName: students.firstName,
                lastName: students.lastName,
            }
        }).from(transactions)
            .leftJoin(students, eq(transactions.studentId, students.id))
            .orderBy(desc(transactions.createdAt));

        return data;
    } catch (error) {
        console.error("Failed to fetch transactions:", error);
        return [];
    }
}

export async function getTransactionForReceipt(id: number) {
    try {
        const data = await db.select({
            transaction: transactions,
            student: students,
            programme: {
                name: programmes.name
            }
        })
            .from(transactions)
            .leftJoin(students, eq(transactions.studentId, students.id))
            .leftJoin(programmes, eq(students.programmeId, programmes.id))
            .where(eq(transactions.id, id))
            .limit(1);

        if (data.length === 0) return null;

        const branding = await getBrandingSettings();
        const bursarySettings = await getBursarySettings();
        const bursar = await OfficialService.getBursarSignature(data[0].student?.unitId || undefined);

        return {
            ...data[0],
            branding,
            bursar,
            template: bursarySettings['receipt_template'] || 'modern'
        };
    } catch (error) {
        console.error("Failed to fetch transaction for receipt:", error);
        return null;
    }
}

// --- External Inflows ---
export async function getExternalInflows() {
    try {
        const inflows = await db.select().from(externalInflows).orderBy(desc(externalInflows.receivedAt));

        // Fetch relations separately
        const allUsers = await db.select().from(users);

        return inflows.map(i => ({
            ...i,
            recordedBy: allUsers.find(u => u.id === i.recordedBy)
        }));
    } catch (error) {
        console.error("Failed to fetch external inflows:", error);
        return [];
    }
}

export async function recordExternalInflow(data: {
    source: string;
    amount: string;
    purpose?: string;
    recordedBy: number;
    receivedAt: Date;
}) {
    try {
        await ensureBursaryStaff();
        await db.insert(externalInflows).values(data);
        revalidatePath("/admin/bursary/inflows");

        // Notify the recorder
        NotificationService.notifyUser(data.recordedBy, {
            title: "Inflow Recorded",
            message: `External inflow of ₦${parseFloat(data.amount).toLocaleString()} from "${data.source}" has been recorded.`,
            type: 'success',
            channels: ['toast']
        });

        // --- Automated GL Posting (Phase 3) ---
        try {
            const settings = await getBursarySettings();
            const bankAcc = settings['gl_cash_bank_account'];
            const revenueAcc = settings['gl_external_revenue_account'];

            if (bankAcc && revenueAcc) {
                await recordTransaction({
                    description: `External Inflow: ${data.source} - ${data.purpose || 'N/A'}`,
                    recordedBy: data.recordedBy,
                    entries: [
                        { accountId: parseInt(bankAcc), debit: data.amount, credit: "0" },    // Bank (Asset) DR ↑
                        { accountId: parseInt(revenueAcc), debit: "0", credit: data.amount }  // Revenue CR ↑
                    ]
                });
            }
        } catch (glError) {
            console.error("Automated GL Posting failed (External Inflow):", glError);
        }

        return { success: true };
    } catch (error) {
        console.error("Failed to record inflow:", error);
        return { success: false, error: (error as Error).message };
    }
}

// --- Overriding set actions for approval checking ---
export async function approveFeeStructureWithAuth(id: number, userId: number) {
    try {
        await ensureBursar();
        return await approveFeeStructure(id, userId);
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function approveDiscountWithAuth(id: number, userId: number) {
    try {
        await ensureBursar();
        return await approveDiscount(id, userId);
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}
// --- Refund Module ---

export async function requestRefund(data: {
    studentId: number;
    transactionId?: number;
    amount: string;
    reason: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
}) {
    try {
        await db.insert(refundRequests).values({
            ...data,
            status: 'pending'
        });
        revalidatePath("/student/finance");
        revalidatePath("/admin/bursary/refunds");
        return { success: true };
    } catch (error) {
        console.error("Failed to submit refund request:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function getRefundRequests(status?: 'pending' | 'approved' | 'rejected' | 'disbursed') {
    try {
        let query = db.select({
            request: refundRequests,
            student: students
        }).from(refundRequests)
            .leftJoin(students, eq(refundRequests.studentId, students.id));

        if (status) {
            query = query.where(eq(refundRequests.status, status)) as any;
        }

        return await query.orderBy(desc(refundRequests.createdAt));
    } catch (error) {
        console.error("Failed to fetch refund requests:", error);
        return [];
    }
}

export async function approveRefund(requestId: number, bursarId: number) {
    try {
        await ensureBursar();
        await db.update(refundRequests).set({
            status: 'approved',
            bursarApprovedBy: bursarId,
            bursarApprovedAt: new Date()
        }).where(eq(refundRequests.id, requestId));

        revalidatePath("/admin/bursary/refunds");
        return { success: true };
    } catch (error) {
        console.error("Failed to approve refund:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function rejectRefund(requestId: number) {
    try {
        await ensureBursar();
        await db.update(refundRequests).set({
            status: 'rejected'
        }).where(eq(refundRequests.id, requestId));

        revalidatePath("/admin/bursary/refunds");
        return { success: true };
    } catch (error) {
        console.error("Failed to reject refund:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function disburseRefund(requestId: number) {
    try {
        await ensureBursaryStaff();

        const result = await db.transaction(async (tx) => {
            const [request] = await tx.select().from(refundRequests).where(eq(refundRequests.id, requestId));
            if (!request) throw new Error("Refund request not found");
            if (request.status !== 'approved') throw new Error("Only approved refunds can be disbursed");

            // 1. Update status
            await tx.update(refundRequests).set({
                status: 'disbursed',
                disbursedAt: new Date()
            }).where(eq(refundRequests.id, requestId));

            // 2. Ledger Impact (Debit Student Wallet / Credit Bank)
            // In portal logic: refunding means we pay them. 
            // So we DEBIT their wallet balance (reduce it) and CREDIT their student ledger (reducing their balance owed IF they have any, or creating a credit).
            // Actually, if it's a refund of overpayment, it reduces their credit.

            const [student] = await tx.select().from(students).where(eq(students.id, request.studentId));
            const [lastLedgerEntry] = await tx.select()
                .from(studentLedger)
                .where(eq(studentLedger.studentId, request.studentId))
                .orderBy(desc(studentLedger.createdAt))
                .limit(1);

            const lastBalance = lastLedgerEntry ? parseFloat(lastLedgerEntry.balance) : 0;
            const amount = parseFloat(request.amount);

            // Refund increases the "balance owed" from the student's perspective (or reduces their credit)
            // If balance was -1000 (overpaid), refunding 1000 brings it to 0.
            const newBalanceOwed = lastBalance + amount;

            await tx.insert(studentLedger).values({
                studentId: request.studentId,
                description: `REFUND DISBURSED: ${request.reason}`,
                debit: request.amount, // Refunding is a debit to the student (we are taking back the credit they had)
                balance: newBalanceOwed.toFixed(2)
            });

            // 3. Update Wallet Balance
            const currentWallet = parseFloat(student.walletBalance || "0");
            const newWallet = currentWallet - amount;

            await tx.update(students)
                .set({ walletBalance: newWallet.toFixed(2) })
                .where(eq(students.id, student.id));

            // 4. Automated GL Posting
            try {
                const settings = await getBursarySettings();
                const bankAcc = settings['gl_cash_bank_account'];
                const liabilityAcc = settings['gl_tuition_revenue_account']; // Or a refund liability account

                if (bankAcc && liabilityAcc) {
                    await recordTransaction({
                        description: `Refund Disbursement: ${request.accountName} (Student ID: ${request.studentId})`,
                        recordedBy: 1, // System
                        entries: [
                            { accountId: parseInt(liabilityAcc), debit: request.amount, credit: "0" }, // Reduce Revenue (Liability/Revenue) DR ↓
                            { accountId: parseInt(bankAcc), debit: "0", credit: request.amount }    // Bank (Asset) CR ↓
                        ]
                    });
                }
            } catch (glError) {
                console.error("GL Posting failed for refund:", glError);
            }

            return { success: true };
        });

        revalidatePath("/student/finance");
        revalidatePath("/admin/bursary/refunds");
        return result;
    } catch (error) {
        console.error("Failed to disburse refund:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function getFinancialReports(filters: {
    startDate?: Date;
    endDate?: Date;
    level?: number;
    deptId?: number;
    programmeId?: number;
    feeItemId?: number;
}) {
    try {
        await ensureBursaryStaff();

        const conditions = [eq(transactions.status, 'completed')];

        if (filters.startDate) conditions.push(gte(transactions.createdAt, filters.startDate));
        if (filters.endDate) conditions.push(lte(transactions.createdAt, filters.endDate));
        if (filters.level) conditions.push(eq(students.currentLevel, filters.level));
        if (filters.deptId) conditions.push(eq(students.deptId, filters.deptId));
        if (filters.programmeId) conditions.push(eq(students.programmeId, filters.programmeId));

        if (filters.feeItemId) {
            const [item] = await db.select().from(feeItems).where(eq(feeItems.id, filters.feeItemId));
            if (item) {
                conditions.push(sql`${transactions.purpose} LIKE ${`%${item.name}%`}`);
            }
        }

        const data = await db.select({
            transaction: transactions,
            student: students,
            programme: programmes,
            department: departments
        })
            .from(transactions)
            .leftJoin(students, eq(transactions.studentId, students.id))
            .leftJoin(programmes, eq(students.programmeId, programmes.id))
            .leftJoin(departments, eq(students.deptId, departments.id))
            .where(and(...conditions))
            .orderBy(desc(transactions.createdAt));

        // Aggregate Data for KPIs
        const totalRevenue = data.reduce((acc, curr) =>
            curr.transaction.type === 'credit' ? acc + parseFloat(curr.transaction.amount) : acc - parseFloat(curr.transaction.amount), 0);

        const totalCollections = data.filter(d => d.transaction.type === 'credit')
            .reduce((acc, curr) => acc + parseFloat(curr.transaction.amount), 0);

        const totalRefunds = data.filter(d => d.transaction.type === 'debit')
            .reduce((acc, curr) => acc + parseFloat(curr.transaction.amount), 0);

        // Aggregate for Charts
        const levelDataMap: Record<number, number> = {};
        data.forEach(d => {
            const lvl = d.student?.currentLevel || 0;
            const amt = parseFloat(d.transaction.amount);
            levelDataMap[lvl] = (levelDataMap[lvl] || 0) + (d.transaction.type === 'credit' ? amt : -amt);
        });
        const revenueByLevel = Object.entries(levelDataMap).map(([lvl, amt]) => ({ level: `${lvl}L`, amount: amt }));

        const categoryMap: Record<string, number> = {};
        data.forEach(d => {
            const cat = d.transaction.purpose.split(':')[0] || 'General';
            const amt = parseFloat(d.transaction.amount);
            categoryMap[cat] = (categoryMap[cat] || 0) + (d.transaction.type === 'credit' ? amt : -amt);
        });
        const revenueByCategory = Object.entries(categoryMap).map(([cat, amt]) => ({ name: cat, value: amt }));

        const trendMap: Record<string, number> = {};
        data.forEach(d => {
            const date = d.transaction.createdAt?.toISOString().split('T')[0] || 'Unknown';
            const amt = parseFloat(d.transaction.amount);
            trendMap[date] = (trendMap[date] || 0) + (d.transaction.type === 'credit' ? amt : -amt);
        });
        const dailyTrend = Object.entries(trendMap)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([date, amt]) => ({ date, amount: amt }));

        return {
            transactions: data,
            stats: {
                totalRevenue,
                totalCollections,
                totalRefunds,
                count: data.length
            },
            charts: {
                revenueByLevel,
                revenueByCategory,
                dailyTrend
            }
        };
    } catch (error) {
        console.error("Failed to fetch financial reports:", error);
        return {
            transactions: [],
            stats: { totalRevenue: 0, totalCollections: 0, totalRefunds: 0, count: 0 },
            charts: { revenueByLevel: [], revenueByCategory: [], dailyTrend: [] }
        };
    }
}

export async function getStudentFinancialSummary(studentId: number) {
    try {
        const [student] = await db.select().from(students).where(eq(students.id, studentId));
        if (!student) throw new Error("Student not found");

        const bills = await db.select().from(studentBills).where(eq(studentBills.studentId, studentId));

        const outstanding = bills.filter(b => b.status !== 'paid')
            .reduce((acc, curr) => acc + parseFloat(curr.totalAmount), 0);

        const totalPaidRes = await db.select({
            total: sql<string>`sum(${studentLedger.credit})`
        })
            .from(studentLedger)
            .where(eq(studentLedger.studentId, studentId));

        return {
            success: true,
            walletBalance: parseFloat(student.walletBalance || "0"),
            outstandingBalance: outstanding,
            totalPaid: parseFloat(totalPaidRes[0]?.total || "0")
        };
    } catch (error) {
        console.error("Failed to fetch financial summary:", error);
        return { success: false, error: (error as Error).message };
    }
}

// --- Scholarships ---
export async function getScholarships() {
    return await db.select().from(scholarships).orderBy(desc(scholarships.createdAt));
}

export async function createScholarship(data: {
    name: string;
    description?: string;
    provider?: string;
    type: 'full' | 'partial_fixed' | 'partial_percentage';
    amount?: string;
    percentage?: string;
}) {
    try {
        await ensureBursaryStaff();
        await db.insert(scholarships).values(data);
        revalidatePath("/admin/bursary/scholarships");
        return { success: true };
    } catch (error) {
        console.error("Failed to create scholarship:", error);
        return { success: false, error: "Failed to create scholarship" };
    }
}

export async function allocateScholarship(data: {
    studentId: number;
    scholarshipId: number;
    sessionId: number;
}) {
    try {
        await ensureBursaryStaff();
        await db.insert(studentScholarships).values(data);
        revalidatePath("/admin/bursary/scholarships");
        return { success: true };
    } catch (error) {
        console.error("Failed to allocate scholarship:", error);
        return { success: false, error: "Failed to allocate scholarship" };
    }
}

export async function getScholarshipAllocations() {
    try {
        const results = await db.select({
            allocation: studentScholarships,
            student: students,
            user: users,
            scholarship: scholarships
        })
            .from(studentScholarships)
            .innerJoin(students, eq(studentScholarships.studentId, students.id))
            .innerJoin(users, eq(students.userId, users.id))
            .innerJoin(scholarships, eq(studentScholarships.scholarshipId, scholarships.id))
            .orderBy(desc(studentScholarships.appliedAt));

        return results;
    } catch (error) {
        console.error("Failed to fetch scholarship allocations:", error);
        return [];
    }
}

// --- NELFUND (Student Loans) ---

export async function getNelfundDisbursements() {
    try {
        const data = await db.select().from(nelfundDisbursements).orderBy(desc(nelfundDisbursements.disbursementDate));
        const recorders = await db.select().from(users);
        return data.map(d => ({
            ...d,
            recordedBy: recorders.find(u => u.id === d.recordedBy)
        }));
    } catch (error) {
        console.error("Failed to fetch NELFUND disbursements:", error);
        return [];
    }
}

export async function recordNelfundBatch(data: {
    batchReference: string;
    totalAmount: string;
    disbursementDate: Date;
    recordedBy: number;
    beneficiaries: { studentId: number; amount: string; institutionFeeAmount?: string; upkeepAmount?: string }[];
}) {
    try {
        await ensureBursar();
        await db.transaction(async (tx) => {
            // 1. Create Disbursement Batch
            const [batch] = await tx.insert(nelfundDisbursements).values({
                batchReference: data.batchReference,
                totalAmount: data.totalAmount,
                disbursementDate: data.disbursementDate,
                recordedBy: data.recordedBy,
                status: 'processed'
            });

            // 2. Create Beneficiaries and Credit Ledger
            for (const b of data.beneficiaries) {
                await tx.insert(nelfundBeneficiaries).values({
                    disbursementId: batch.insertId,
                    studentId: b.studentId,
                    amount: b.amount,
                    institutionFeeAmount: b.institutionFeeAmount,
                    upkeepAmount: b.upkeepAmount,
                    verificationStatus: 'verified',
                    verifiedAt: new Date()
                });

                // ONLY credit the Institutional Fee portion to the student's ledger
                const creditAmount = b.institutionFeeAmount || b.amount;

                // Record in Student Ledger
                const [lastEntry] = await tx.select()
                    .from(studentLedger)
                    .where(eq(studentLedger.studentId, b.studentId))
                    .orderBy(desc(studentLedger.createdAt))
                    .limit(1);

                const lastBalance = lastEntry ? parseFloat(lastEntry.balance) : 0;
                const newBalance = lastBalance - parseFloat(creditAmount);

                await tx.insert(studentLedger).values({
                    studentId: b.studentId,
                    description: `NELFUND Loan Credit (Ref: ${data.batchReference})`,
                    credit: creditAmount,
                    balance: newBalance.toFixed(2)
                });
            }

            // 3. Automated GL Posting (Institutional Fees Revenue)
            const settings = await getBursarySettings();
            const bankAcc = settings['gl_cash_bank_account'];
            const nelfundRevenueAcc = settings['gl_nelfund_revenue_account'] || settings['gl_tuition_revenue_account'];

            if (bankAcc && nelfundRevenueAcc) {
                await recordTransaction({
                    description: `NELFUND Disbursement Batch: ${data.batchReference}`,
                    reference: data.batchReference,
                    recordedBy: data.recordedBy,
                    entries: [
                        { accountId: parseInt(bankAcc), debit: data.totalAmount, credit: "0" },    // Bank DR ↑
                        { accountId: parseInt(nelfundRevenueAcc), debit: "0", credit: data.totalAmount }  // Revenue CR ↑
                    ]
                });
            }
        });

        revalidatePath("/admin/bursary/nelfund");
        return { success: true };
    } catch (error) {
        console.error("Failed to process NELFUND batch:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function getNelfundBeneficiaries(disbursementId: number) {
    try {
        const data = await db.select({
            beneficiary: nelfundBeneficiaries,
            student: students
        })
            .from(nelfundBeneficiaries)
            .innerJoin(students, eq(nelfundBeneficiaries.studentId, students.id))
            .where(eq(nelfundBeneficiaries.disbursementId, disbursementId));

        return data;
    } catch (error) {
        console.error("Failed to fetch NELFUND beneficiaries:", error);
        return [];
    }
}

export async function generateNelfundSvsExport() {
    try {
        await ensureBursar();
        // Fetch students and their current session details
        const data = await db.select({
            id: students.id,
            matricNumber: students.matricNumber,
            firstName: students.firstName,
            lastName: students.lastName,
            jambNumber: students.jambNumber,
            nin: students.nin,
            email: users.email,
            phone: users.phone,
            level: students.currentLevel,
            programme: programmes.name,
            department: departments.name
        })
            .from(students)
            .innerJoin(users, eq(students.userId, users.id))
            .leftJoin(programmes, eq(students.programmeId, programmes.id))
            .leftJoin(departments, eq(students.deptId, departments.id))
            .where(eq(users.status, 'active'));

        // Format for CSV
        const csvRows = [
            ["Matric Number", "First Name", "Last Name", "JAMB Number", "NIN", "Email", "Phone", "Level", "Programme", "Department"],
            ...data.map(s => [
                s.matricNumber || "",
                s.firstName || "",
                s.lastName || "",
                s.jambNumber || "",
                s.nin || "",
                s.email || "",
                s.phone || "",
                s.level?.toString() || "",
                s.programme || "",
                s.department || ""
            ].map(v => `"${v}"`)) // Escape commas in values
        ];

        return { success: true, csv: csvRows.map(r => r.join(",")).join("\n") };
    } catch (error) {
        console.error("Failed to generate SVS export:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function getAccountsReceivableAging() {
    try {
        await ensureBursar();
        const allBills = await db.select({
            id: studentBills.id,
            studentId: studentBills.studentId,
            totalAmount: studentBills.totalAmount,
            amountPaid: studentBills.amountPaid,
            status: studentBills.status,
            createdAt: studentBills.createdAt,
            student: {
                firstName: students.firstName,
                lastName: students.lastName,
                matricNumber: students.matricNumber,
                level: students.currentLevel
            }
        })
            .from(studentBills)
            .innerJoin(students, eq(studentBills.studentId, students.id))
            .where(ne(studentBills.status, 'paid'));

        const now = new Date();
        const analysis = {
            current: { amount: 0, count: 0 },
            days30: { amount: 0, count: 0 },
            days60: { amount: 0, count: 0 },
            days90Plus: { amount: 0, count: 0 },
            total: 0
        };

        const detailedBills = allBills.map(bill => {
            const billDate = bill.createdAt ? new Date(bill.createdAt) : new Date();
            const ageDays = Math.floor((now.getTime() - billDate.getTime()) / (1000 * 3600 * 24));
            const outstanding = parseFloat(bill.totalAmount) - parseFloat(bill.amountPaid || "0");

            let bracket = '';
            if (ageDays <= 30) {
                analysis.current.amount += outstanding;
                analysis.current.count++;
                bracket = '0-30 Days';
            } else if (ageDays <= 60) {
                analysis.days30.amount += outstanding;
                analysis.days30.count++;
                bracket = '31-60 Days';
            } else if (ageDays <= 90) {
                analysis.days60.amount += outstanding;
                analysis.days60.count++;
                bracket = '61-90 Days';
            } else {
                analysis.days90Plus.amount += outstanding;
                analysis.days90Plus.count++;
                bracket = '90+ Days';
            }
            analysis.total += outstanding;

            return {
                ...bill,
                outstanding,
                ageDays,
                bracket
            };
        });

        // Sort by oldest first
        detailedBills.sort((a, b) => b.ageDays - a.ageDays);

        return { success: true, analysis, details: detailedBills };
    } catch (error) {
        console.error("Failed to generate aging analysis:", error);
        return { success: false, error: (error as Error).message };
    }
}
