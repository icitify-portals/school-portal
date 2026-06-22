const fs = require('fs');
const path = require('path');

const bursaryPath = path.join(__dirname, '../src/actions/bursary.ts');
let content = fs.readFileSync(bursaryPath, 'utf8');

// 1. Add imports for vendorBills and vendorBillPayments
if (!content.includes('vendorBills')) {
    content = content.replace('export {', 'import {\n    vendorBills,\n    vendorBillPayments\n} from "@/db/schema";\nexport {');
    // Actually, bursary.ts imports from "@/db/schema". Let's inject into the schema import.
    content = content.replace('expenditureRequests,', 'expenditureRequests,\n    vendorBills,\n    vendorBillPayments,');
}

// 2. Rewrite approveExpenditureRequest to create a vendorBill
const approveMatch = content.match(/export async function approveExpenditureRequest\([\s\S]*?revalidatePath\("\/admin\/bursary\/expenditure"\);\s*return { success: true };\s*} catch \(error\) {[\s\S]*?}\s*}/);

if (approveMatch) {
    const newApprove = `export async function approveExpenditureRequest(id: number, userId: number, glAccountId?: number, bypassBudget = false) {
    try {
        await ensureBursar();
        const [request] = await db.select().from(expenditureRequests).where(eq(expenditureRequests.id, id));
        if (!request) return { success: false, error: "Request not found" };

        // --- Budget Check (Phase 4) ---
        if (request.departmentId && !bypassBudget) {
            const currentSession = await getCurrentSession();
            const yearToUse = currentSession?.name || \`\${new Date().getFullYear()}/\${new Date().getFullYear() + 1}\`;
            const analysis = await getBudgetAnalysis(request.departmentId, yearToUse);

            if (analysis.budget > 0 && parseFloat(request.amount) > analysis.remaining) {
                return {
                    success: false,
                    error: \`EXCEEDS_BUDGET: This request of ₦\${parseFloat(request.amount).toLocaleString()} exceeds the remaining departmental budget of ₦\${analysis.remaining.toLocaleString()}.\`,
                    analysis
                };
            }
        }

        const poNumber = \`PO-\${new Date().getFullYear()}-\${Math.floor(1000 + Math.random() * 9000)}\`;

        await db.transaction(async (tx) => {
            await tx.update(expenditureRequests)
                .set({
                    status: 'approved',
                    approvedBy: userId,
                    approvedAt: new Date(),
                    purchaseOrderNumber: poNumber,
                    glAccountId: glAccountId || request.glAccountId
                })
                .where(eq(expenditureRequests.id, id));

            // Create Vendor Bill (Accounts Payable Accrual)
            if (request.vendorId) {
                const settings = await getBursarySettings();
                const baseCurrency = settings.base_currency || 'NGN';
                const apLiabilityAcc = settings['gl_accounts_payable'] || '0'; // Should map to AP Liability Account
                const expenseAcc = glAccountId || request.glAccountId || settings['gl_general_expense_account'] || '0';

                await tx.insert(vendorBills).values({
                    vendorId: request.vendorId,
                    expenditureRequestId: request.id,
                    invoiceNumber: \`INV-\${poNumber}\`, // Auto-gen if not provided
                    amount: request.amount,
                    currency: baseCurrency,
                    exchangeRate: '1.0000',
                    dateReceived: new Date(),
                    dueDate: request.dueDate || new Date(),
                    status: 'unpaid'
                });

                // Post Accrual to GL
                if (parseInt(expenseAcc) > 0 && parseInt(apLiabilityAcc) > 0) {
                    await recordTransaction({
                        description: \`Accrual for PO: \${poNumber} (\${request.title})\`,
                        reference: poNumber,
                        recordedBy: userId,
                        entries: [
                            { accountId: parseInt(expenseAcc.toString()), debit: request.amount, credit: "0" },
                            { accountId: parseInt(apLiabilityAcc.toString()), debit: "0", credit: request.amount }
                        ]
                    });
                }
            }
        });

        revalidatePath("/admin/bursary/expenditure");
        return { success: true };
    } catch (error) {
        console.error("Failed to approve expenditure:", error);
        return { success: false, error: (error as Error).message };
    }
}`;
    content = content.replace(approveMatch[0], newApprove);
}


// 3. Add payVendorBill action
const payVendorBillCode = `
export async function payVendorBill(billId: number, amount: number, userId: number, reference: string) {
    try {
        await ensureBursar();
        const [bill] = await db.select().from(vendorBills).where(eq(vendorBills.id, billId));
        if (!bill) return { success: false, error: "Vendor bill not found" };

        const currentPaid = parseFloat(bill.amountPaid || '0');
        const total = parseFloat(bill.amount);
        const newPaid = currentPaid + amount;

        if (newPaid > total + 0.01) {
            return { success: false, error: "Payment exceeds bill amount" };
        }

        const newStatus = Math.abs(total - newPaid) < 0.01 ? 'paid' : 'partially_paid';

        await db.transaction(async (tx) => {
            await tx.update(vendorBills).set({
                amountPaid: newPaid.toString(),
                status: newStatus
            }).where(eq(vendorBills.id, billId));

            await tx.insert(vendorBillPayments).values({
                vendorBillId: billId,
                amount: amount.toString(),
                currency: bill.currency || 'NGN',
                exchangeRate: bill.exchangeRate || '1.0000',
                paymentDate: new Date(),
                reference,
                recordedBy: userId
            });

            // Post Payment to GL
            const settings = await getBursarySettings();
            const bankAcc = settings['gl_cash_bank_account'];
            const apLiabilityAcc = settings['gl_accounts_payable'];

            if (bankAcc && apLiabilityAcc) {
                await recordTransaction({
                    description: \`Payment for Vendor Bill: \${bill.invoiceNumber}\`,
                    reference: reference,
                    recordedBy: userId,
                    entries: [
                        { accountId: parseInt(apLiabilityAcc), debit: amount.toString(), credit: "0" }, // Reduce Liability
                        { accountId: parseInt(bankAcc), debit: "0", credit: amount.toString() }        // Reduce Cash
                    ]
                });
            }

            // Update original expenditure request status if fully paid
            if (newStatus === 'paid' && bill.expenditureRequestId) {
                 await tx.update(expenditureRequests)
                    .set({ status: 'disbursed', disbursedAt: new Date() })
                    .where(eq(expenditureRequests.id, bill.expenditureRequestId));
            }
        });

        revalidatePath("/admin/bursary/payables");
        return { success: true };
    } catch (error) {
        console.error("Failed to pay vendor bill:", error);
        return { success: false, error: (error as Error).message };
    }
}

// --- Aging Analytics ---
export async function getAPAging() {
    try {
        await ensureBursaryStaff();
        const bills = await db.select().from(vendorBills).where(eq(vendorBills.status, 'unpaid'));
        const now = new Date();
        const buckets = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };

        bills.forEach(b => {
            const days = Math.floor((now.getTime() - new Date(b.dueDate).getTime()) / (1000 * 60 * 60 * 24));
            const owed = parseFloat(b.amount) - parseFloat(b.amountPaid || '0');
            if (days <= 30) buckets['0-30'] += owed;
            else if (days <= 60) buckets['31-60'] += owed;
            else if (days <= 90) buckets['61-90'] += owed;
            else buckets['90+'] += owed;
        });

        return { success: true, data: buckets };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function getARAging() {
    try {
        await ensureBursaryStaff();
        const bills = await db.select().from(studentBills).where(eq(studentBills.status, 'pending'));
        const now = new Date();
        const buckets = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };

        bills.forEach(b => {
            const days = Math.floor((now.getTime() - (b.createdAt?.getTime() || now.getTime())) / (1000 * 60 * 60 * 24));
            const owed = parseFloat(b.totalAmount) - parseFloat(b.amountPaid || '0');
            if (days <= 30) buckets['0-30'] += owed;
            else if (days <= 60) buckets['31-60'] += owed;
            else if (days <= 90) buckets['61-90'] += owed;
            else buckets['90+'] += owed;
        });

        return { success: true, data: buckets };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}
`;

content += payVendorBillCode;

fs.writeFileSync(bursaryPath, content, 'utf8');
console.log("Updated bursary.ts AP logic successfully!");
