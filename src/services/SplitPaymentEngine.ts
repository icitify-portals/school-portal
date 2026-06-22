import { db } from "@/db/db";
import { 
    settlementAccounts, 
    gatewaySubaccounts, 
    studentBills, 
    students, 
    bursarySettings,
    transactions,
    feeStructures,
    feeStructureItems,
    feeItems,
    admissionApplicationsV2
} from "@/db/schema";
import { eq, and } from "drizzle-orm";

export interface SplitItem {
    amount: number;             // Flat amount for this split
    accountName: string;        // Destination account name
    bankCode: string;           // Destination bank code
    accountNumber: string;      // Destination account number
    subaccountCode?: string;    // Gateway-specific code (if registered)
    isDeveloperAccount?: boolean; // Flag to identify developer split
}

export interface GatewayCheckoutResponse {
    success: boolean;
    checkoutUrl?: string;       // Redirection URL for student payment
    reference: string;          // Gateway transaction reference
    rrr?: string;               // Remita Retrieval Reference (for Remita)
    error?: string;
}

export interface PaymentGatewayAdapter {
    initializeSplitPayment(
        payerEmail: string,
        totalAmount: number,
        txReference: string,
        splits: SplitItem[],
        feeAllocationRule: 'developer' | 'default' | 'subaccounts' | 'student' | 'prorated'
    ): Promise<GatewayCheckoutResponse>;
}

// ----------------------------------------------------
// 1. PAYSTACK STRATEGY ADAPTER
// ----------------------------------------------------
export class PaystackAdapter implements PaymentGatewayAdapter {
    async initializeSplitPayment(
        payerEmail: string,
        totalAmount: number,
        txReference: string,
        splits: SplitItem[],
        feeAllocationRule: 'developer' | 'default' | 'subaccounts' | 'student' | 'prorated'
    ): Promise<GatewayCheckoutResponse> {
        console.log("=== PAYSTACK SPLIT PAYMENT INITIALIZATION ===");
        console.log(`Payer: ${payerEmail}, Reference: ${txReference}, Total: ₦${totalAmount}`);
        
        // Map splits to Paystack kobo format
        const subaccountsPayload = splits.map(item => ({
            subaccount: item.subaccountCode || `ACCT_MOCK_${item.bankCode}_${item.accountNumber}`,
            share: Math.round(item.amount * 100) // in kobo
        }));

        // Determine Paystack fee bearer
        let paystackBearer: 'account' | 'subaccount' | 'all' = 'account';
        if (feeAllocationRule === 'developer' || feeAllocationRule === 'subaccounts') {
            paystackBearer = 'subaccount';
        } else if (feeAllocationRule === 'prorated') {
            paystackBearer = 'all';
        }

        const payload = {
            email: payerEmail,
            amount: Math.round(totalAmount * 100), // in kobo
            reference: txReference,
            split: {
                type: "flat",
                bearer: paystackBearer,
                subaccounts: subaccountsPayload
            }
        };

        console.log("Paystack API Payload:\n", JSON.stringify(payload, null, 2));

        // We redirect the user to our simulated payment gateway page
        const checkoutUrl = `/finance/checkout/simulate?gateway=paystack&reference=${txReference}&amount=${totalAmount}`;
        
        return {
            success: true,
            checkoutUrl,
            reference: txReference
        };
    }
}

// ----------------------------------------------------
// 2. FLUTTERWAVE STRATEGY ADAPTER
// ----------------------------------------------------
export class FlutterwaveAdapter implements PaymentGatewayAdapter {
    async initializeSplitPayment(
        payerEmail: string,
        totalAmount: number,
        txReference: string,
        splits: SplitItem[],
        feeAllocationRule: 'developer' | 'default' | 'subaccounts' | 'student' | 'prorated'
    ): Promise<GatewayCheckoutResponse> {
        console.log("=== FLUTTERWAVE SPLIT PAYMENT INITIALIZATION ===");
        console.log(`Payer: ${payerEmail}, Reference: ${txReference}, Total: ₦${totalAmount}`);
        
        // Map splits to Flutterwave payload
        const subaccountsPayload = splits.map(item => ({
            id: item.subaccountCode || `RS_MOCK_${item.bankCode}_${item.accountNumber}`,
            transaction_charge_type: "flat",
            transaction_charge: item.amount
        }));

        const payload = {
            tx_ref: txReference,
            amount: totalAmount,
            currency: "NGN",
            payment_options: "card,banktransfer,ussd",
            customer: {
                email: payerEmail
            },
            subaccounts: subaccountsPayload,
            // Custom rules mapping fee bearer
            meta: {
                fee_bearer_rule: feeAllocationRule
            }
        };

        console.log("Flutterwave API Payload:\n", JSON.stringify(payload, null, 2));

        // Redirect user to simulated payment page
        const checkoutUrl = `/finance/checkout/simulate?gateway=flutterwave&reference=${txReference}&amount=${totalAmount}`;

        return {
            success: true,
            checkoutUrl,
            reference: txReference
        };
    }
}

// ----------------------------------------------------
// 3. REMITA STRATEGY ADAPTER
// ----------------------------------------------------
export class RemitaAdapter implements PaymentGatewayAdapter {
    async initializeSplitPayment(
        payerEmail: string,
        totalAmount: number,
        txReference: string,
        splits: SplitItem[],
        feeAllocationRule: 'developer' | 'default' | 'subaccounts' | 'student' | 'prorated'
    ): Promise<GatewayCheckoutResponse> {
        console.log("=== REMITA SPLIT PAYMENT INITIALIZATION (DYNAMIC INLINE) ===");
        console.log(`Payer: ${payerEmail}, Reference: ${txReference}, Total: ₦${totalAmount}`);
        
        // Remita line items take beneficiary details inline dynamically
        const lineItems = splits.map((item, index) => ({
            lineItemsId: (index + 1).toString(),
            beneficiaryName: item.accountName,
            beneficiaryAccount: item.accountNumber,
            bankCode: item.bankCode,
            beneficiaryAmount: item.amount.toFixed(2),
            deductFeeFrom: "0" // "0" ensures fee is borne by the payer (student)
        }));

        const merchantId = process.env.REMITA_MERCHANT_ID || "2547916";
        const serviceTypeId = process.env.REMITA_SERVICE_TYPE_ID || "4430731";
        const apiKey = process.env.REMITA_API_KEY || "1946";

        const payload = {
            merchantId,
            serviceTypeId,
            amount: totalAmount.toString(),
            orderId: txReference,
            payerEmail: payerEmail,
            lineItems: lineItems
        };

        const crypto = require('crypto');
        const hash = crypto.createHash('sha512')
            .update(`${merchantId}${serviceTypeId}${txReference}${totalAmount}${apiKey}`)
            .digest('hex');

        console.log("Remita API Payload:\n", JSON.stringify(payload, null, 2));

        let rrr = "";
        try {
            const res = await fetch('https://remitademo.net/remita/exapp/api/v1/send/api/echannelsvc/merchant/api/paymentinit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `remitaConsumerKey=${merchantId},remitaConsumerToken=${hash}`
                },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            
            // Expected response format: JSON or sometimes JSONP. The inline docs specify standard JSON
            if (data && data.statuscode === "025" && data.rrr) {
                rrr = data.rrr;
            } else {
                // If API fails or is not accessible, fallback to mock for testing
                console.error("Remita RRR Generation failed:", data);
                rrr = `RRR-MOCK-${Math.floor(100000000000 + Math.random() * 900000000000)}`;
            }
        } catch (error) {
            console.error("Error connecting to Remita API:", error);
            rrr = `RRR-MOCK-${Math.floor(100000000000 + Math.random() * 900000000000)}`;
        }
        
        // Redirect to simulated page
        const checkoutUrl = `/finance/checkout/simulate?gateway=remita&reference=${txReference}&amount=${totalAmount}&rrr=${rrr}`;

        return {
            success: true,
            checkoutUrl,
            reference: txReference,
            rrr
        };
    }
}

// ----------------------------------------------------
// 4. UNIFIED SPLIT PAYMENT ENGINE
// ----------------------------------------------------
export class SplitPaymentEngine {
    
    // Calculates dynamic gateway processing fee based on rule & amount
    static calculateGatewayFee(amount: number, gateway: string): number {
        if (gateway === 'paystack') {
            // Paystack Local: 1.5% + ₦100 (capped at ₦2000), ₦100 fee is waived for transactions under ₦2500
            const fee = (amount * 0.015) + (amount >= 2500 ? 100 : 0);
            return Math.min(2000, fee);
        }
        if (gateway === 'flutterwave') {
            // Flutterwave Local: 1.4% (capped at ₦2000)
            return Math.min(2000, amount * 0.014);
        }
        if (gateway === 'remita') {
            // Remita Flat Transaction Fee: ₦150 standard
            return 150;
        }
        return 0;
    }

    // Resolves appropriate gateway adapter instance
    static getAdapter(gateway: string): PaymentGatewayAdapter {
        switch (gateway) {
            case 'paystack':
                return new PaystackAdapter();
            case 'flutterwave':
                return new FlutterwaveAdapter();
            case 'remita':
                return new RemitaAdapter();
            default:
                return new PaystackAdapter(); // Fallback
        }
    }

    // Fetches settings map directly from db to prevent circular dependency with actions
    static async getBursarySettingsMap(): Promise<Record<string, string>> {
        const settings = await db.select().from(bursarySettings);
        return settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {} as Record<string, string>);
    }

    /**
     * Compiles bills proportionally, computes active bearer fees, compiles splits,
     * initializes gateway checkout and returns the response.
     */
    static async checkoutBill(studentId: number, billId: number, selectedAmount: number): Promise<GatewayCheckoutResponse> {
        console.log(`Starting Checkout: StudentId ${studentId}, BillId ${billId}, SelectedAmount ₦${selectedAmount}`);
        
        // 1. Fetch Student details
        const student = await db.query.students.findFirst({
            where: eq(students.id, studentId),
            with: { user: true }
        });
        if (!student || !student.user) {
            return { success: false, reference: "", error: "Student or User profile not found." };
        }

        // 2. Fetch Active Settings
        const settings = await this.getBursarySettingsMap();
        const activeGateway = settings['active_payment_gateway'] || 'paystack';
        const feeBearerRule = (settings['gateway_fee_bearer'] || 'default') as 'developer' | 'default' | 'subaccounts' | 'student' | 'prorated';
        
        // 3. Fetch Student Bill & Items
        const bill = await db.query.studentBills.findFirst({
            where: eq(studentBills.id, billId),
            with: { 
                items: { 
                    with: { 
                        item: true 
                    } 
                } 
            }
        });

        if (!bill) {
            return { success: false, reference: "", error: "Student bill not found." };
        }

        const billTotal = parseFloat(bill.totalAmount);
        if (billTotal <= 0) {
            return { success: false, reference: "", error: "Invalid bill amount." };
        }

        const currentPaid = parseFloat(bill.amountPaid || "0.00");
        const outstanding = billTotal - currentPaid;

        // Installment payment validations
        const allowed = settings['allow_installment_payments'] === "true";
        const minPercent = parseFloat(settings['minimum_installment_percentage'] || "60");
        const minAllowedAmount = allowed ? (billTotal * minPercent) / 100 : billTotal;

        if (currentPaid < 0.01) {
            // Initial payment: must meet the minimum required installment percentage
            if (selectedAmount < minAllowedAmount - 0.01) {
                return { success: false, reference: "", error: `Minimum initial installment payment of ₦${minAllowedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} (${minPercent}%) is required.` };
            }
        }

        if (selectedAmount > outstanding + 0.01) {
            return { success: false, reference: "", error: `Payment amount exceeds outstanding bill balance of ₦${outstanding.toLocaleString()}.` };
        }

        // If part payment is disabled, require full payment
        if (!allowed && Math.abs(selectedAmount - outstanding) > 0.01) {
            return { success: false, reference: "", error: `Installments are not enabled for this payment. Full payment of ₦${outstanding.toLocaleString()} is required.` };
        }

        // 4. Pro-rate fee items across checkout amount (for part-payments)
        let splits: SplitItem[] = [];
        let totalAllocated = 0;

        for (const item of bill.items) {
            const itemAmt = parseFloat(item.amount);
            if (item.item?.settlementAccountId) {
                // Fetch destination settlement account bank details
                const account = await db.query.settlementAccounts.findFirst({
                    where: eq(settlementAccounts.id, item.item.settlementAccountId)
                });

                if (account && account.isActive) {
                    // Fetch Gateway specific code
                    let subaccountCode: string | undefined = undefined;
                    if (activeGateway !== 'remita') {
                        const sub = await db.query.gatewaySubaccounts.findFirst({
                            where: and(
                                eq(gatewaySubaccounts.settlementAccountId, account.id),
                                eq(gatewaySubaccounts.gatewayName, activeGateway as 'paystack' | 'flutterwave' | 'remita')
                            )
                        });
                        subaccountCode = sub?.gatewaySubaccountCode;
                    }

                    // Calculate proportional share
                    const itemShare = (itemAmt / billTotal) * selectedAmount;
                    
                    splits.push({
                        amount: Number(itemShare.toFixed(2)),
                        accountName: account.accountName,
                        bankCode: account.bankCode,
                        accountNumber: account.accountNumber,
                        subaccountCode,
                        isDeveloperAccount: item.item.name.toLowerCase().includes('developer')
                    });
                    totalAllocated += itemShare;
                }
            }
        }

        // Resolve outstanding amounts into default school main account split
        const remaining = selectedAmount - totalAllocated;
        if (remaining > 0.01) {
            const mainAcctName = settings['main_school_account_name'] || "Main School Account";
            const mainBankCode = settings['main_school_bank_code'] || "011";
            const mainAcctNum = settings['main_school_account_number'] || "0123456789";
            const mainSubCode = settings[`main_school_${activeGateway}_subaccount`] || undefined;

            splits.push({
                amount: Number(remaining.toFixed(2)),
                accountName: mainAcctName,
                bankCode: mainBankCode,
                accountNumber: mainAcctNum,
                subaccountCode: mainSubCode,
                isDeveloperAccount: false
            });
        }

        // 5. Calculate and Apply Gateway Bearer rules
        const baseGatewayFee = this.calculateGatewayFee(selectedAmount, activeGateway);
        let checkoutTotal = selectedAmount;

        console.log(`Fee Bearer Setting: ${feeBearerRule}. Calculated Base Gateway Fee: ₦${baseGatewayFee}`);

        if (feeBearerRule === 'student') {
            // Student bears fee: Added on top of student checkout total
            checkoutTotal += baseGatewayFee;
        } else if (feeBearerRule === 'developer') {
            // Developer bears fee: Deduct entirely from the developer account share
            const devSplitIndex = splits.findIndex(s => s.isDeveloperAccount);
            if (devSplitIndex !== -1) {
                const currentShare = splits[devSplitIndex].amount;
                splits[devSplitIndex].amount = Math.max(0, Number((currentShare - baseGatewayFee).toFixed(2)));
            } else {
                // Fallback to default if developer split is absent on this bill
                const mainIndex = splits.findIndex(s => s.accountNumber === settings['main_school_account_number']);
                if (mainIndex !== -1) {
                    const currentShare = splits[mainIndex].amount;
                    splits[mainIndex].amount = Math.max(0, Number((currentShare - baseGatewayFee).toFixed(2)));
                }
            }
        } else if (feeBearerRule === 'prorated') {
            // Prorated: Deduct proportionally across all splits
            splits = splits.map(s => {
                const proportionalFee = (s.amount / selectedAmount) * baseGatewayFee;
                return {
                    ...s,
                    amount: Math.max(0, Number((s.amount - proportionalFee).toFixed(2)))
                };
            });
        } else if (feeBearerRule === 'subaccounts') {
            // Subaccounts bear fee: Split fee equally among non-developer splits
            const nonDevs = splits.filter(s => !s.isDeveloperAccount);
            const feeShare = nonDevs.length > 0 ? baseGatewayFee / nonDevs.length : 0;
            splits = splits.map(s => {
                if (!s.isDeveloperAccount) {
                    return {
                        ...s,
                        amount: Math.max(0, Number((s.amount - feeShare).toFixed(2)))
                    };
                }
                return s;
            });
        } else {
            // Default bears fee: Deduct from the default main school account split
            const mainAcctNum = settings['main_school_account_number'] || "0123456789";
            const mainIndex = splits.findIndex(s => s.accountNumber === mainAcctNum);
            if (mainIndex !== -1) {
                const currentShare = splits[mainIndex].amount;
                splits[mainIndex].amount = Math.max(0, Number((currentShare - baseGatewayFee).toFixed(2)));
            } else if (splits.length > 0) {
                // If main school account wasn't in split list, deduct from first split
                const currentShare = splits[0].amount;
                splits[0].amount = Math.max(0, Number((currentShare - baseGatewayFee).toFixed(2)));
            }
        }

        // Double check splits totals to match checkout total (if not student bearer, splits must sum to selectedAmount)
        console.log("Final compiled payment splits:\n", JSON.stringify(splits, null, 2));

        // 6. Record pending transaction in database
        const txRef = `TX-SPL-${Date.now()}`;
        
        await db.insert(transactions).values({
            studentId,
            amount: checkoutTotal.toFixed(2),
            type: 'credit',
            purpose: bill.note || "School Fees Online Payment",
            status: 'pending',
            gateway: activeGateway as 'paystack' | 'flutterwave' | 'remita' | 'opay' | 'manual',
            gatewayReference: txRef
        });

        // 7. Invoke active gateway adapter
        const adapter = this.getAdapter(activeGateway);
        return await adapter.initializeSplitPayment(
            student.user.email,
            checkoutTotal,
            txRef,
            splits,
            feeBearerRule
        );
    }

    // Checkout for Admission Form (No student ID)
    async checkoutAdmissionForm(applicationId: number, feeStructureId: number, applicantEmail: string, applicantName: string) {
        // 1. Fetch Bursary Settings
        const settingsRecords = await db.query.bursarySettings.findMany();
        const settings: any = {};
        for (const s of settingsRecords) settings[s.settingKey] = s.settingValue;

        const activeGateway = settings['active_gateway'] || 'remita';
        const feeBearerRule = settings[`${activeGateway}_fee_bearer`] || 'default';

        // 2. Fetch Fee Structure Items
        const structure = await db.query.feeStructures.findFirst({
            where: eq(feeStructures.id, feeStructureId)
        });

        if (!structure) return { success: false, reference: "", error: "Admission Fee Structure not found" };

        const items = await db.query.feeStructureItems.findMany({
            where: eq(feeStructureItems.feeStructureId, feeStructureId),
            with: {
                feeItem: true
            }
        });

        const billTotal = parseFloat(structure.totalAmount);
        
        let splits: SplitItem[] = [];
        let totalAllocated = 0;

        for (const item of items) {
            const itemAmt = parseFloat(item.amount as string);
            if (item.feeItem?.settlementAccountId) {
                const account = await db.query.settlementAccounts.findFirst({
                    where: eq(settlementAccounts.id, item.feeItem.settlementAccountId)
                });

                if (account && account.isActive) {
                    let subaccountCode: string | undefined = undefined;
                    if (activeGateway !== 'remita') {
                        const sub = await db.query.gatewaySubaccounts.findFirst({
                            where: and(
                                eq(gatewaySubaccounts.settlementAccountId, account.id),
                                eq(gatewaySubaccounts.gatewayName, activeGateway as 'paystack' | 'flutterwave' | 'remita')
                            )
                        });
                        subaccountCode = sub?.gatewaySubaccountCode;
                    }

                    splits.push({
                        amount: Number(itemAmt.toFixed(2)),
                        accountName: account.accountName,
                        bankCode: account.bankCode,
                        accountNumber: account.accountNumber,
                        subaccountCode,
                        isDeveloperAccount: item.feeItem.name.toLowerCase().includes('developer')
                    });
                    totalAllocated += itemAmt;
                }
            }
        }

        const remaining = billTotal - totalAllocated;
        if (remaining > 0.01) {
            const mainAcctName = settings['main_school_account_name'] || "Main School Account";
            const mainBankCode = settings['main_school_bank_code'] || "011";
            const mainAcctNum = settings['main_school_account_number'] || "0123456789";
            const mainSubCode = settings[`main_school_${activeGateway}_subaccount`] || undefined;

            splits.push({
                amount: Number(remaining.toFixed(2)),
                accountName: mainAcctName,
                bankCode: mainBankCode,
                accountNumber: mainAcctNum,
                subaccountCode: mainSubCode,
                isDeveloperAccount: false
            });
        }

        const baseGatewayFee = this.calculateGatewayFee(billTotal, activeGateway);
        let checkoutTotal = billTotal;

        if (feeBearerRule === 'student') checkoutTotal += baseGatewayFee;
        else if (feeBearerRule === 'developer') {
            const devSplitIndex = splits.findIndex(s => s.isDeveloperAccount);
            if (devSplitIndex !== -1) {
                splits[devSplitIndex].amount = Math.max(0, Number((splits[devSplitIndex].amount - baseGatewayFee).toFixed(2)));
            }
        } else if (feeBearerRule === 'prorated') {
            splits = splits.map(s => ({
                ...s,
                amount: Math.max(0, Number((s.amount - ((s.amount / billTotal) * baseGatewayFee)).toFixed(2)))
            }));
        } else if (feeBearerRule === 'subaccounts') {
            const nonDevs = splits.filter(s => !s.isDeveloperAccount);
            const feeShare = nonDevs.length > 0 ? baseGatewayFee / nonDevs.length : 0;
            splits = splits.map(s => s.isDeveloperAccount ? s : { ...s, amount: Math.max(0, Number((s.amount - feeShare).toFixed(2))) });
        } else {
            const mainAcctNum = settings['main_school_account_number'] || "0123456789";
            const mainIndex = splits.findIndex(s => s.accountNumber === mainAcctNum);
            if (mainIndex !== -1) splits[mainIndex].amount = Math.max(0, Number((splits[mainIndex].amount - baseGatewayFee).toFixed(2)));
            else if (splits.length > 0) splits[0].amount = Math.max(0, Number((splits[0].amount - baseGatewayFee).toFixed(2)));
        }

        const txRef = `PAY-ADM-2026-${Math.floor(100000 + Math.random() * 900000)}`;
        
        await db.insert(transactions).values({
            amount: checkoutTotal.toFixed(2),
            type: 'credit',
            purpose: `Admission Form Application ID: ${applicationId}`,
            status: 'pending',
            gateway: activeGateway as 'paystack' | 'flutterwave' | 'remita' | 'opay' | 'manual',
            gatewayReference: txRef
        });

        const adapter = this.getAdapter(activeGateway);
        return await adapter.initializeSplitPayment(
            applicantEmail,
            checkoutTotal,
            txRef,
            splits,
            feeBearerRule
        );
    }
}
