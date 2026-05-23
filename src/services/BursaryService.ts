import { db } from "@/db/db";
import { 
    transactions, 
    expenditureRequests, 
    chartOfAccounts, 
    users, 
    departments,
    students,
    feeAllocations,
    feeStructureItems,
    studentBills,
    studentBillItems,
    studentLedger,
    academicSessions
} from "@/db/schema";
import { eq, sum, and, sql, desc } from "drizzle-orm";

export class BursaryService {

    /**
     * Retrieves the institutional financial overview (Revenue vs Expenditure).
     */
    static async getFinancialOverview() {
        // 1. Calculate Total Revenue (Successful Student Payments)
        const revenue = await db.select({ 
            total: sum(transactions.amount) 
        })
        .from(transactions)
        .where(
            and(
                eq(transactions.type, 'credit'),
                eq(transactions.status, 'completed')
            )
        );

        // 2. Calculate Total Expenditure (Disbursed Requests)
        const expenditure = await db.select({ 
            total: sum(expenditureRequests.amount) 
        })
        .from(expenditureRequests)
        .where(eq(expenditureRequests.status, 'disbursed'));

        const totalRevenue = parseFloat(revenue[0]?.total || "0");
        const totalExpenditure = parseFloat(expenditure[0]?.total || "0");

        return {
            revenue: totalRevenue,
            expenditure: totalExpenditure,
            balance: totalRevenue - totalExpenditure
        };
    }

    /**
     * Records a new expenditure request.
     */
    static async requestExpenditure(data: {
        requestedBy: number,
        title: string,
        purpose: string,
        amount: number,
        glAccountId?: number,
        departmentId?: number
    }) {
        return await db.insert(expenditureRequests).values({
            requestedBy: data.requestedBy,
            title: data.title,
            purpose: data.purpose,
            amount: data.amount.toString(),
            glAccountId: data.glAccountId,
            departmentId: data.departmentId,
            status: 'pending'
        });
    }

    /**
     * Approves and Disburses an expenditure.
     */
    static async approveAndDisburse(requestId: number, adminId: number) {
        return await db.update(expenditureRequests)
            .set({ 
                status: 'disbursed',
                approvedBy: adminId,
                approvedAt: new Date(),
                disbursedAt: new Date()
            })
            .where(eq(expenditureRequests.id, requestId));
    }

    /**
     * Retrieves a detailed ledger of all expenditures.
     */
    static async getExpenditureLedger() {
        return await db.select({
            id: expenditureRequests.id,
            title: expenditureRequests.title,
            amount: expenditureRequests.amount,
            status: expenditureRequests.status,
            requestedBy: users.name,
            department: departments.name,
            date: expenditureRequests.createdAt
        })
        .from(expenditureRequests)
        .leftJoin(users, eq(expenditureRequests.requestedBy, users.id))
        .leftJoin(departments, eq(expenditureRequests.departmentId, departments.id))
        .orderBy(desc(expenditureRequests.createdAt));
    }

    /**
     * Processes single student billing generation.
     */
    static async processSingleStudentBill(studentId: number, sessionId: number, note?: string) {
        return await db.transaction(async (tx) => {
            // 1. Fetch student profile
            const [student] = await tx.select()
                .from(students)
                .where(eq(students.id, studentId))
                .limit(1);

            if (!student) throw new Error("Student not found.");

            // 2. Resolve applicable fee structure
            let allocation = null;

            // Student-specific
            const [specificAlloc] = await tx.select()
                .from(feeAllocations)
                .where(and(
                    eq(feeAllocations.studentId, studentId),
                    eq(feeAllocations.sessionId, sessionId)
                ))
                .limit(1);
            allocation = specificAlloc;

            // Programme-specific
            if (!allocation && student.programmeId) {
                const [progAlloc] = await tx.select()
                    .from(feeAllocations)
                    .where(and(
                        eq(feeAllocations.programmeId, student.programmeId),
                        eq(feeAllocations.sessionId, sessionId)
                    ))
                    .limit(1);
                allocation = progAlloc;
            }

            // Department-specific
            if (!allocation && student.departmentId) {
                const [deptAlloc] = await tx.select()
                    .from(feeAllocations)
                    .where(and(
                        eq(feeAllocations.deptId, student.departmentId),
                        eq(feeAllocations.sessionId, sessionId)
                    ))
                    .limit(1);
                allocation = deptAlloc;
            }

            // Default level/general fallback
            if (!allocation) {
                const [levelAlloc] = await tx.select()
                    .from(feeAllocations)
                    .where(and(
                        eq(feeAllocations.sessionId, sessionId),
                        sql`faculty_id IS NULL AND dept_id IS NULL AND programme_id IS NULL AND student_id IS NULL`
                    ))
                    .limit(1);
                allocation = levelAlloc;
            }

            if (!allocation) {
                throw new Error("No applicable fee structure allocated for this student this session.");
            }

            // 3. Fetch items for this fee structure
            const items = await tx.select()
                .from(feeStructureItems)
                .where(eq(feeStructureItems.feeStructureId, allocation.feeStructureId));

            if (items.length === 0) {
                throw new Error("Resolved fee structure contains no fee items.");
            }

            const total = items.reduce((sum, item) => sum + parseFloat(item.amount || "0"), 0);

            // 4. Create the bill
            const billNumber = `BILL-${Date.now()}-${studentId}`;
            const [newBill] = await tx.insert(studentBills).values({
                studentId,
                sessionId,
                billNumber,
                totalAmount: total.toFixed(2),
                amountPaid: "0.00",
                status: 'pending',
                note: note || "Session Bill Generation"
            });

            // 5. Insert bill items
            for (const item of items) {
                await tx.insert(studentBillItems).values({
                    billId: newBill.insertId,
                    feeItemId: item.feeItemId,
                    amount: item.amount
                });
            }

            // 6. Post debit entry in student ledger
            const [lastLedgerEntry] = await tx.select()
                .from(studentLedger)
                .where(eq(studentLedger.studentId, studentId))
                .orderBy(desc(studentLedger.createdAt))
                .limit(1);

            const lastBalance = lastLedgerEntry ? parseFloat(lastLedgerEntry.balance) : 0;
            const newBalanceOwed = lastBalance + total;

            await tx.insert(studentLedger).values({
                studentId,
                description: `Billing: ${note || "Session Bill Generation"} (${billNumber})`,
                debit: total.toFixed(2),
                credit: "0.00",
                balance: newBalanceOwed.toFixed(2)
            });

            return { success: true, billId: newBill.insertId, total };
        });
    }

    /**
     * Queues and triggers batch billing generation.
     */
    static async queueBatchBilling(data: {
        sessionId: number;
        scope: 'all' | 'department' | 'level' | 'programme';
        filters: {
            deptId?: number;
            level?: number;
            programmeId?: number;
        };
        note?: string;
    }) {
        const conditions = [];
        
        if (data.scope === 'department' && data.filters.deptId) {
            conditions.push(eq(students.departmentId, data.filters.deptId));
        } else if (data.scope === 'programme' && data.filters.programmeId) {
            conditions.push(eq(students.programmeId, data.filters.programmeId));
        } else if (data.scope === 'level' && data.filters.level) {
            conditions.push(eq(students.currentLevel, data.filters.level));
        }

        const studentList = await db.select({ id: students.id })
            .from(students)
            .where(conditions.length > 0 ? and(...conditions) : undefined);

        if (studentList.length === 0) {
            return { success: false, error: "No students matching filters." };
        }

        let successCount = 0;
        let failCount = 0;

        for (const s of studentList) {
            try {
                await this.processSingleStudentBill(s.id, data.sessionId, data.note);
                successCount++;
            } catch (err) {
                console.error(`Failed to process bill for student ${s.id}:`, err);
                failCount++;
            }
        }

        return { success: true, processed: studentList.length, successCount, failCount };
    }
}
