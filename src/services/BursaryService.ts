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
    feeStructures,
    feeItems,
    studentBills,
    studentBillItems,
    studentLedger,
    academicSessions,
    scholarships,
    studentScholarships,
    discounts,
    bursarySettings,
} from "@/db/schema";
import { eq, sum, and, sql, desc, inArray, isNotNull } from "drizzle-orm";

export class BursaryService {

    static async getFinancialOverview() {
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
     * Resolve active scholarships for a student + session and compute total reduction
     */
    static async resolveScholarships(studentId: number, sessionId: number) {
        const activeScholarships = await db.select({
            scholarship: scholarships,
            ss: studentScholarships,
        })
        .from(studentScholarships)
        .innerJoin(scholarships, eq(studentScholarships.scholarshipId, scholarships.id))
        .where(
            and(
                eq(studentScholarships.studentId, studentId),
                eq(studentScholarships.sessionId, sessionId),
                eq(studentScholarships.status, 'active')
            )
        );

        if (activeScholarships.length === 0) return { type: 'none', amount: 0, details: [] };

        const details: any[] = [];

        for (const { scholarship } of activeScholarships) {
            if (scholarship.type === 'full') {
                return { type: 'full', amount: 0, details: [{ name: scholarship.name, type: 'full' }] };
            }
            if (scholarship.type === 'partial_percentage') {
                details.push({
                    name: scholarship.name,
                    type: 'partial_percentage',
                    percentage: parseFloat(scholarship.percentage || '0'),
                });
            }
            if (scholarship.type === 'partial_fixed') {
                details.push({
                    name: scholarship.name,
                    type: 'partial_fixed',
                    amount: parseFloat(scholarship.amount || '0'),
                });
            }
        }

        return { type: 'partial', amount: 0, details };
    }

    /**
     * Resolve approved discounts for a student (optionally for a specific fee item)
     */
    static async resolveDiscounts(studentId: number, feeItemId?: number) {
        const conditions = [
            eq(discounts.studentId, studentId),
            eq(discounts.status, 'approved'),
        ];
        if (feeItemId) {
            conditions.push(eq(discounts.feeItemId, feeItemId));
        }

        return await db.select()
            .from(discounts)
            .where(and(...conditions));
    }

    static async processSingleStudentBill(
        studentId: number,
        sessionId: number,
        options?: {
            note?: string;
            tuitionInstallmentEnabled?: boolean;
            tuitionInstallmentPercentage?: number;
            tuitionInstallmentDeadline?: Date;
        }
    ) {
        return await db.transaction(async (tx) => {
            const [student] = await tx.select()
                .from(students)
                .where(eq(students.id, studentId))
                .limit(1);

            if (!student) throw new Error("Student not found.");

            let allocation = null;
            let directFeeStructureId = null;

            if (student.academicStatus === 'spill_over') {
                const [spillOverStruct] = await tx.select()
                    .from(feeStructures)
                    .where(and(
                        eq(feeStructures.isSpillOver, true),
                        eq(feeStructures.status, 'approved'),
                        eq(feeStructures.level, student.currentLevel || 100)
                    ))
                    .limit(1);
                
                if (spillOverStruct) {
                    directFeeStructureId = spillOverStruct.id;
                }
            }

            if (!directFeeStructureId) {
                const [specificAlloc] = await tx.select()
                    .from(feeAllocations)
                    .where(and(
                        eq(feeAllocations.studentId, studentId),
                        eq(feeAllocations.sessionId, sessionId)
                    ))
                    .limit(1);
                allocation = specificAlloc;

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

                if (!allocation && student.deptId) {
                    const [deptAlloc] = await tx.select()
                        .from(feeAllocations)
                        .where(and(
                            eq(feeAllocations.deptId, student.deptId),
                            eq(feeAllocations.sessionId, sessionId)
                        ))
                        .limit(1);
                    allocation = deptAlloc;
                }

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
            }

            const targetStructureId = directFeeStructureId || allocation?.feeStructureId;

            if (!targetStructureId) {
                throw new Error("No applicable fee structure allocated for this student this session.");
            }

            // Fetch fee items with their categories
            const rawItems = await tx.select({
                feeItemId: feeStructureItems.feeItemId,
                amount: feeStructureItems.amount,
                currency: feeItems.currency,
                category: feeItems.category,
                name: feeItems.name,
            })
                .from(feeStructureItems)
                .innerJoin(feeItems, eq(feeStructureItems.feeItemId, feeItems.id))
                .where(eq(feeStructureItems.feeStructureId, targetStructureId));

            if (rawItems.length === 0) {
                throw new Error("Resolved fee structure contains no fee items.");
            }

            // --- Apply Scholarships ---
            const scholarshipResult = await this.resolveScholarships(studentId, sessionId);
            let totalScholarshipApplied = 0;

            // If full scholarship, all items drop to 0
            if (scholarshipResult.type === 'full') {
                totalScholarshipApplied = rawItems.reduce((s, item) => s + parseFloat(item.amount || "0"), 0);
            }

            // Build items with original amounts
            const itemsWithDiscounts = rawItems.map((item) => {
                const originalAmt = parseFloat(item.amount || "0");
                let finalAmt = originalAmt;

                // Apply partial scholarship reductions
                if (scholarshipResult.type === 'partial') {
                    for (const detail of scholarshipResult.details) {
                        if (detail.type === 'partial_percentage') {
                            finalAmt = finalAmt * (1 - detail.percentage / 100);
                        } else if (detail.type === 'partial_fixed') {
                            finalAmt = Math.max(0, finalAmt - detail.amount);
                        }
                    }
                }

                const discountAmount = originalAmt - finalAmt;
                totalScholarshipApplied += discountAmount;

                return { ...item, originalAmount: originalAmt, finalAmount: finalAmt, scholarshipApplied: discountAmount, discountApplied: 0 };
            });

            // --- Apply Discounts ---
            const approvedDiscounts = await this.resolveDiscounts(studentId);
            let totalDiscountApplied = 0;

            for (const item of itemsWithDiscounts) {
                let itemDiscount = 0;

                // Find specific discounts for this fee item
                const specificDiscounts = approvedDiscounts.filter(d => d.feeItemId === item.feeItemId);
                for (const d of specificDiscounts) {
                    if (d.percentage) {
                        const pctDisc = item.finalAmount * (parseFloat(d.percentage) / 100);
                        itemDiscount += pctDisc;
                    } else if (d.amount) {
                        itemDiscount += parseFloat(d.amount);
                    }
                }

                // Find general discounts (no specific feeItemId)
                const generalDiscounts = approvedDiscounts.filter(d => !d.feeItemId);
                for (const d of generalDiscounts) {
                    if (d.percentage) {
                        const pctDisc = item.finalAmount * (parseFloat(d.percentage) / 100);
                        itemDiscount += pctDisc;
                    } else if (d.amount) {
                        // For general discounts, split equally across items
                        itemDiscount += parseFloat(d.amount) / itemsWithDiscounts.length;
                    }
                }

                itemDiscount = Math.min(itemDiscount, item.finalAmount);
                item.discountApplied = Math.round(itemDiscount * 100) / 100;
                item.finalAmount = Math.round((item.finalAmount - itemDiscount) * 100) / 100;
                totalDiscountApplied += item.discountApplied;
            }

            totalScholarshipApplied = Math.round(totalScholarshipApplied * 100) / 100;
            totalDiscountApplied = Math.round(totalDiscountApplied * 100) / 100;

            // Calculate total
            const total = itemsWithDiscounts.reduce((sum, item) => sum + item.finalAmount, 0);
            const billCurrency = itemsWithDiscounts.length > 0 && itemsWithDiscounts[0].currency ? itemsWithDiscounts[0].currency : 'NGN';

            // Determine tuition installment deadline (end of second semester = 6 months from now)
            const deadline = options?.tuitionInstallmentDeadline || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);

            // Generate bill
            const billNumber = `BILL-${Date.now()}-${studentId}`;
            const [newBill] = await tx.insert(studentBills).values({
                studentId,
                sessionId,
                billNumber,
                currency: billCurrency,
                totalAmount: total.toFixed(2),
                amountPaid: "0.00",
                totalScholarshipApplied: totalScholarshipApplied.toFixed(2),
                totalDiscountApplied: totalDiscountApplied.toFixed(2),
                tuitionInstallmentEnabled: options?.tuitionInstallmentEnabled || false,
                tuitionInstallmentPercentage: options?.tuitionInstallmentPercentage
                    ? options.tuitionInstallmentPercentage.toFixed(2)
                    : "60",
                tuitionInstallmentDeadline: deadline,
                status: 'pending',
                note: options?.note || "Session Bill Generation",
            });

            // Insert bill items
            for (const item of itemsWithDiscounts) {
                await tx.insert(studentBillItems).values({
                    billId: newBill.insertId,
                    feeItemId: item.feeItemId,
                    originalAmount: item.originalAmount.toFixed(2),
                    amount: item.finalAmount.toFixed(2),
                    scholarshipApplied: item.scholarshipApplied.toFixed(2),
                    discountApplied: item.discountApplied.toFixed(2),
                    amountPaid: "0.00",
                });
            }

            // Ledger entry
            const [lastLedgerEntry] = await tx.select()
                .from(studentLedger)
                .where(eq(studentLedger.studentId, studentId))
                .orderBy(desc(studentLedger.createdAt))
                .limit(1);

            const lastBalance = lastLedgerEntry ? parseFloat(lastLedgerEntry.balance) : 0;
            const newBalanceOwed = lastBalance + total;

            await tx.insert(studentLedger).values({
                studentId,
                description: `Billing: ${options?.note || "Session Bill Generation"} (${billNumber})`,
                debit: total.toFixed(2),
                credit: "0.00",
                balance: newBalanceOwed.toFixed(2)
            });

            return {
                success: true,
                billId: newBill.insertId,
                total,
                totalScholarshipApplied,
                totalDiscountApplied,
                items: itemsWithDiscounts.map(i => ({
                    feeItemId: i.feeItemId,
                    name: i.name,
                    category: i.category,
                    originalAmount: i.originalAmount,
                    finalAmount: i.finalAmount,
                    scholarshipApplied: i.scholarshipApplied,
                    discountApplied: i.discountApplied,
                })),
            };
        });
    }

    static async queueBatchBilling(data: {
        sessionId: number;
        scope: 'all' | 'department' | 'level' | 'programme' | 'faculty';
        filters: {
            deptId?: number;
            level?: number;
            programmeId?: number;
            facultyId?: number;
        };
        note?: string;
        tuitionInstallmentEnabled?: boolean;
        tuitionInstallmentPercentage?: number;
        tuitionInstallmentDeadline?: Date;
    }) {
        const conditions = [eq(students.status, 'active')];
        
        if (data.scope === 'department' && data.filters.deptId) {
            conditions.push(eq(students.deptId, data.filters.deptId));
        } else if (data.scope === 'programme' && data.filters.programmeId) {
            conditions.push(eq(students.programmeId, data.filters.programmeId));
        } else if (data.scope === 'level' && data.filters.level) {
            conditions.push(eq(students.currentLevel, data.filters.level));
        } else if (data.scope === 'faculty' && data.filters.facultyId) {
            const depts = await db.select({ id: departments.id })
                .from(departments)
                .where(eq(departments.facultyId, data.filters.facultyId));
            const deptIds = depts.map(d => d.id);
            if (deptIds.length > 0) {
                conditions.push(inArray(students.deptId, deptIds));
            } else {
                return { success: false, error: "No departments found for this faculty." };
            }
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
                await this.processSingleStudentBill(s.id, data.sessionId, {
                    note: data.note,
                    tuitionInstallmentEnabled: data.tuitionInstallmentEnabled,
                    tuitionInstallmentPercentage: data.tuitionInstallmentPercentage,
                    tuitionInstallmentDeadline: data.tuitionInstallmentDeadline,
                });
                successCount++;
            } catch (err) {
                console.error(`Failed to process bill for student ${s.id}:`, err);
                failCount++;
            }
        }

        return { success: true, processed: studentList.length, successCount, failCount };
    }

    /**
     * Calculate the minimum payment required for a bill considering tuition-only installment mode
     */
    static async calculateMinimumPayment(billId: number) {
        const [bill] = await db.select()
            .from(studentBills)
            .where(eq(studentBills.id, billId))
            .limit(1);

        if (!bill) throw new Error("Bill not found.");

        const billItems = await db.select({
            item: studentBillItems,
            feeItem: feeItems,
        })
        .from(studentBillItems)
        .innerJoin(feeItems, eq(studentBillItems.feeItemId, feeItems.id))
        .where(eq(studentBillItems.billId, billId));

        const currentPaid = parseFloat(bill.amountPaid || "0.00");
        const totalAmount = parseFloat(bill.totalAmount);
        const outstanding = totalAmount - currentPaid;

        if (currentPaid >= totalAmount) return { minPayment: 0, outstanding, isFullyPaid: true };

        // Tuition-only installment mode
        if (bill.tuitionInstallmentEnabled) {
            const installPct = parseFloat(bill.tuitionInstallmentPercentage || "60") / 100;
            const deadline = bill.tuitionInstallmentDeadline;

            // Separate tuition items from others
            let tuitionTotal = 0;
            let otherTotal = 0;

            for (const bi of billItems) {
                const itemAmt = parseFloat(bi.item.amount);
                if (bi.feeItem.category === 'tuition') {
                    tuitionTotal += itemAmt;
                } else {
                    otherTotal += itemAmt;
                }
            }

            if (currentPaid === 0) {
                // First payment: must cover all non-tuition items + installment % of tuition
                const tuitionPart = tuitionTotal * installPct;
                const minFirst = otherTotal + tuitionPart;
                return {
                    minPayment: Math.min(outstanding, minFirst),
                    outstanding,
                    tuitionTotal,
                    otherTotal,
                    tuitionDueNow: tuitionPart,
                    tuitionRemaining: tuitionTotal - tuitionPart,
                    installmentDeadline: deadline,
                    isFullyPaid: false,
                    isTuitionInstallment: true,
                };
            }

            // Installment mode, subsequent payments: minimum is just the remaining tuition
            return {
                minPayment: Math.min(outstanding, 1000),
                outstanding,
                tuitionTotal,
                otherTotal,
                isFullyPaid: false,
                isTuitionInstallment: true,
            };
        }

        // Standard mode: applies to all items proportionally
        const settings = await db.select()
            .from(bursarySettings)
            .where(inArray(bursarySettings.key, ['allow_installment_payments', 'minimum_installment_percentage', 'min_part_payment_amount']));

        const settingsMap: Record<string, string> = {};
        for (const s of settings) settingsMap[s.key] = s.value;

        const allowed = settingsMap['allow_installment_payments'] === "true";
        const minPercent = parseFloat(settingsMap['minimum_installment_percentage'] || "60");
        const minFlatAmount = parseFloat(settingsMap['min_part_payment_amount'] || "5000");

        if (currentPaid === 0) {
            const pctAmount = (totalAmount * minPercent) / 100;
            const minPayment = Math.max(pctAmount, minFlatAmount);
            return {
                minPayment: allowed ? Math.min(outstanding, minPayment) : outstanding,
                outstanding,
                isFullyPaid: false,
                isTuitionInstallment: false,
            };
        }

        return {
            minPayment: Math.min(outstanding, 1000),
            outstanding,
            isFullyPaid: false,
            isTuitionInstallment: false,
        };
    }
}
