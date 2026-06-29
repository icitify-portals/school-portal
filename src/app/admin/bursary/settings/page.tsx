"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
    Loader2, 
    Settings2, 
    Landmark, 
    Sparkles, 
    Eye, 
    EyeOff, 
    CreditCard, 
    FileText,
    ArrowRightLeft,
    Plus,
    Building2,
    Link,
    Lock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
    getBursarySettings, 
    updateBursarySetting, 
    getSettlementAccounts, 
    createSettlementAccount, 
    getFeeItemsWithSettlement, 
    linkFeeItemToSettlementAccount,
    createGatewaySubaccountAction
} from "@/actions/bursary";
import { getCOA } from "@/actions/accounting";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface GLAccount {
    id: number;
    code: string;
    name: string;
    category: string;
}

interface SettlementAccount {
    id: number;
    accountName: string;
    bankName: string;
    bankCode: string;
    accountNumber: string;
    isActive: boolean | null;
}

interface FeeItem {
    id: number;
    name: string;
    description: string | null;
    defaultAmount: string;
    category: 'tuition' | 'hostel' | 'library' | 'lab' | 'other' | null;
    recurrence: 'once' | 'per_semester' | 'per_session' | null;
    isRequired: boolean | null;
    settlementAccountId: number | null;
    settlementAccount: SettlementAccount | null;
}

export default function BursarySettingsPage() {
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [accounts, setAccounts] = useState<GLAccount[]>([]);
    const [settlements, setSettlements] = useState<SettlementAccount[]>([]);
    const [feeItemsList, setFeeItemsList] = useState<FeeItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});

    // New Settlement Form state
    const [newAcctName, setNewAcctName] = useState("");
    const [newBankName, setNewBankName] = useState("");
    const [newBankCode, setNewBankCode] = useState("");
    const [newAcctNum, setNewAcctNum] = useState("");
    const [addingSettlement, setAddingSettlement] = useState(false);

    // New Subaccount mapping state
    const [mappingAcctId, setMappingAcctId] = useState<number | null>(null);
    const [mappingGateway, setMappingGateway] = useState<'paystack' | 'flutterwave' | 'remita'>('paystack');
    const [mappingCode, setMappingCode] = useState("");
    const [mappingLoading, setMappingLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [settingsData, coaData, settlementsData, feeItemsData] = await Promise.all([
                getBursarySettings(),
                getCOA(),
                getSettlementAccounts(),
                getFeeItemsWithSettlement()
            ]);
            setSettings(settingsData);
            setAccounts(coaData);
            setSettlements(settlementsData);
            // @ts-expect-error - TS2345: Auto-suppressed for build
            setFeeItemsList(feeItemsData);
        } catch (error) {
            console.error("Failed to load settings data:", error);
            toast.error("Failed to load settings data. Please reload.");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (key: string, value: string) => {
        const res = await updateBursarySetting(key, value);
        if (res.success) {
            setSettings(prev => ({ ...prev, [key]: value }));
            toast.success(`Setting '${key}' updated successfully.`);
        } else {
            toast.error(res.error || "Failed to update setting.");
        }
    };

    const handleCreateSettlement = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAcctName || !newBankName || !newBankCode || !newAcctNum) {
            toast.error("Please fill in all settlement account fields.");
            return;
        }
        setAddingSettlement(true);
        try {
            const res = await createSettlementAccount({
                accountName: newAcctName,
                bankName: newBankName,
                bankCode: newBankCode,
                accountNumber: newAcctNum
            });
            if (res.success) {
                toast.success("Settlement account registered successfully.");
                setNewAcctName("");
                setNewBankName("");
                setNewBankCode("");
                setNewAcctNum("");
                // Reload data
                const freshSettlements = await getSettlementAccounts();
                setSettlements(freshSettlements);
            } else {
                toast.error(res.error || "Failed to create settlement account.");
            }
        } catch (error) {
            const err = error as Error;
            toast.error(err.message || "Failed to create account.");
        } finally {
            setAddingSettlement(false);
        }
    };

    const handleCreateMapping = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!mappingAcctId || !mappingCode) {
            toast.error("Please provide subaccount mapping details.");
            return;
        }
        setMappingLoading(true);
        try {
            const res = await createGatewaySubaccountAction({
                settlementAccountId: mappingAcctId,
                gatewayName: mappingGateway,
                gatewaySubaccountCode: mappingCode
            });
            if (res.success) {
                toast.success("Gateway subaccount mapping registered.");
                setMappingCode("");
                setMappingAcctId(null);
                // Refresh
                fetchData();
            } else {
                toast.error(res.error || "Failed to map subaccount.");
            }
        } catch (error) {
            const err = error as Error;
            toast.error(err.message || "Failed to map subaccount.");
        } finally {
            setMappingLoading(false);
        }
    };

    const handleLinkFeeItem = async (feeItemId: number, acctId: string) => {
        const parsedAcctId = acctId ? parseInt(acctId) : null;
        try {
            const res = await linkFeeItemToSettlementAccount(feeItemId, parsedAcctId);
            if (res.success) {
                toast.success("Fee item linked to settlement bank account.");
                // Update local list
                setFeeItemsList(prev => prev.map(item => {
                    if (item.id === feeItemId) {
                        const matchedAcct = settlements.find(s => s.id === parsedAcctId);
                        return { ...item, settlementAccountId: parsedAcctId, settlementAccount: matchedAcct || null };
                    }
                    return item;
                }));
            } else {
                toast.error(res.error || "Failed to link fee item.");
            }
        } catch (error) {
            const err = error as Error;
            toast.error(err.message || "Failed to link fee item.");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        );
    }

    const glSettings = [
        { label: "Default Cash/Bank Account (Asset)", key: "gl_cash_bank_account", category: "asset" },
        { label: "Tuition Revenue Account (Revenue)", key: "gl_tuition_revenue_account", category: "revenue" },
        { label: "General Expense Account (Expense)", key: "gl_general_expense_account", category: "expense" },
        { label: "External Funds Account (Revenue)", key: "gl_external_revenue_account", category: "revenue" },
        { label: "Salary Expense Account (Expense)", key: "gl_salary_expense_account", category: "expense" },
        { label: "PAYE Liability Account (Liability)", key: "gl_paye_liability_account", category: "liability" },
        { label: "Pension Liability Account (Liability)", key: "gl_pension_liability_account", category: "liability" },
        { label: "Other Payroll Deductions (Liability)", key: "gl_other_payroll_liability_account", category: "liability" },
    ];

    return (
        <div className="p-8 max-w-[1600px] w-full mx-auto space-y-8">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                    <Settings2 className="w-8 h-8 text-indigo-600 animate-pulse" />
                    Bursary Settings
                </h2>
                <p className="text-slate-500 mt-1">Configure financial policies, gateways, split settling rules, and ledger mappings</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {/* 0. GLOBAL FINANCIAL & CURRENCY */}
                <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                        <CardTitle className="text-base font-bold text-slate-800">Global Financial & Currency</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Base Currency</label>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">The default currency for the institution</p>
                                <select
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                                    value={settings['base_currency'] || "NGN"}
                                    onChange={(e) => handleSave('base_currency', e.target.value)}
                                >
                                    <option value="NGN">Nigerian Naira (NGN)</option>
                                    <option value="USD">US Dollar (USD)</option>
                                    <option value="EUR">Euro (EUR)</option>
                                    <option value="GBP">British Pound (GBP)</option>
                                </select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 0.5. FINANCIAL LOCKING RULES */}
                <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
                        <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <Lock className="w-5 h-5 text-rose-500" />
                            Financial Locking Rules
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Lock Type</label>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">How to restrict owing students</p>
                                <select
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                                    value={settings['financial_lock_type'] || "soft"}
                                    onChange={(e) => handleSave('financial_lock_type', e.target.value)}
                                >
                                    <option value="soft">Soft Lock (Warning Banner, allow navigation)</option>
                                    <option value="hard">Hard Lock (Force Redirect to Payment Page)</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Lock Threshold Amount</label>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Amount of debt before lock triggers (0 = any debt)</p>
                                <input
                                    type="number"
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                                    placeholder="e.g. 0"
                                    defaultValue={settings['financial_lock_threshold'] || "0"}
                                    onBlur={(e) => handleSave('financial_lock_threshold', e.target.value)}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 1. PAYMENT CONFIGURATION CARD */}
                <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                        <CardTitle className="text-base font-bold text-slate-800">Payment Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                            <div>
                                <p className="font-bold text-slate-900">Payment Mode</p>
                                <p className="text-sm text-slate-500">Determine if students pay annually or by semester</p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => handleSave('payment_mode', 'semester')}
                                    variant={settings['payment_mode'] === 'semester' ? 'default' : 'outline'}
                                    className={cn("font-semibold rounded-lg", settings['payment_mode'] === 'semester' ? 'bg-indigo-600 text-white' : '')}
                                >
                                    Semester
                                </Button>
                                <Button
                                    onClick={() => handleSave('payment_mode', 'annual')}
                                    variant={settings['payment_mode'] === 'annual' ? 'default' : 'outline'}
                                    className={cn("font-semibold rounded-lg", settings['payment_mode'] === 'annual' ? 'bg-indigo-600 text-white' : '')}
                                >
                                    Annual
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Late Payment Fee Amount</label>
                            <div className="flex gap-4">
                                <input
                                    type="number"
                                    className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                                    placeholder="e.g. 5000"
                                    defaultValue={settings['late_fee_amount']}
                                    onBlur={(e) => handleSave('late_fee_amount', e.target.value)}
                                />
                                <div className="p-2 bg-slate-100 rounded-lg text-slate-500 text-sm flex items-center px-4 font-bold">
                                    NGN
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* PART PAYMENT CONFIGURATION CARD */}
                <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden bg-slate-50/10">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                        <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-indigo-500" />
                            Installment & Part Payment Policy Defaults
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                            <div>
                                <p className="font-bold text-slate-900">Enable Installment Payments</p>
                                <p className="text-sm text-slate-500">Allow students to make partial fee payments by default</p>
                            </div>
                            <Button
                                onClick={() => handleSave('part_payment_enabled', settings['part_payment_enabled'] === 'false' ? 'true' : 'false')}
                                variant={settings['part_payment_enabled'] !== 'false' ? 'default' : 'outline'}
                                className={cn("font-semibold rounded-lg", settings['part_payment_enabled'] !== 'false' ? 'bg-indigo-600 text-white hover:bg-indigo-700' : '')}
                            >
                                {settings['part_payment_enabled'] !== 'false' ? 'Enabled' : 'Disabled'}
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Default Minimum Initial Installment (%)</label>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Minimum percentage required for the first payment</p>
                                <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                                    placeholder="e.g. 60"
                                    defaultValue={settings['min_part_payment_percentage'] || "60"}
                                    onBlur={(e) => handleSave('min_part_payment_percentage', e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Default Minimum Flat Amount (₦)</label>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Enforced minimum flat currency amount threshold</p>
                                <input
                                    type="number"
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                                    placeholder="e.g. 5000"
                                    defaultValue={settings['min_part_payment_amount'] || "5000"}
                                    onBlur={(e) => handleSave('min_part_payment_amount', e.target.value)}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. SPLIT PAYMENT GATEWAY bearer RULES */}
                <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden bg-slate-50/10">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row justify-between items-center">
                        <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <ArrowRightLeft className="w-5 h-5 text-indigo-500" />
                            Multi-Gateway split Payments & Bearer Rules
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Payment Gateway</label>
                                <select
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 h-11 text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
                                    value={settings['active_payment_gateway'] || "remita"}
                                    onChange={(e) => handleSave('active_payment_gateway', e.target.value)}
                                >
                                    {(settings['gateway_remita_active'] !== "false") && <option value="remita">Remita API (Dynamic Line Items)</option>}
                                    {(settings['gateway_paystack_active'] === "true") && <option value="paystack">Paystack API (Subaccounts)</option>}
                                    {(settings['gateway_flutterwave_active'] === "true") && <option value="flutterwave">Flutterwave API (Subaccounts)</option>}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gateway Fee Bearer Strategy</label>
                                <select
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 h-11 text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
                                    value={settings['gateway_fee_bearer'] || "default"}
                                    onChange={(e) => handleSave('gateway_fee_bearer', e.target.value)}
                                >
                                    <option value="default">Default: Deduct entire fee from School Main Account</option>
                                    <option value="developer">Developer: Deduct entire fee from Developer share</option>
                                    <option value="subaccounts">Sub-accounts: Deduct fee from other subaccounts</option>
                                    <option value="student">Student: Add fee on top of student total amount</option>
                                    <option value="prorated">Prorated: Deduct proportionally across all splits</option>
                                </select>
                            </div>
                        </div>

                        {/* Gateway Enable/Disable Toggles */}
                        <div className="flex gap-4 p-4 bg-white rounded-xl border border-slate-200">
                            <div className="flex items-center gap-2">
                                <Switch 
                                    checked={settings['gateway_remita_active'] !== "false"}
                                    onCheckedChange={(c) => handleSave('gateway_remita_active', c ? "true" : "false")}
                                />
                                <span className="text-sm font-bold text-slate-700">Remita</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch 
                                    checked={settings['gateway_paystack_active'] === "true"}
                                    onCheckedChange={(c) => handleSave('gateway_paystack_active', c ? "true" : "false")}
                                />
                                <span className="text-sm font-bold text-slate-700">Paystack</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch 
                                    checked={settings['gateway_flutterwave_active'] === "true"}
                                    onCheckedChange={(c) => handleSave('gateway_flutterwave_active', c ? "true" : "false")}
                                />
                                <span className="text-sm font-bold text-slate-700">Flutterwave</span>
                            </div>
                        </div>

                        {/* Installment Payment Rules */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-white rounded-xl border border-slate-200">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Allow Installment Payments</label>
                                <div className="flex items-center gap-2 mt-2">
                                    <Switch 
                                        checked={settings['allow_installment_payments'] === "true"}
                                        onCheckedChange={(c) => handleSave('allow_installment_payments', c ? "true" : "false")}
                                    />
                                    <span className="text-sm font-bold text-slate-700">Enable part-payments for students</span>
                                </div>
                            </div>
                            
                            {settings['allow_installment_payments'] === "true" && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Minimum Initial Installment (%)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 h-11 text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
                                        value={settings['minimum_installment_percentage'] || "60"}
                                        onChange={(e) => handleSave('minimum_installment_percentage', e.target.value)}
                                        placeholder="e.g. 60"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Students cannot pay less than this percentage on their first installment.</p>
                                </div>
                            )}
                        </div>

                        {/* Default Main school commercial bank configuration */}
                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/60 space-y-4">
                            <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <Landmark className="w-4 h-4 text-indigo-500" />
                                Primary Default Bank Account
                            </h4>
                            <p className="text-xs text-slate-400 leading-normal">
                                Used as the fallback settlement bank account for unallocated splits and default fee absorbs.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account Name</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
                                        defaultValue={settings['main_school_account_name'] || "FSS Ibadan Main Account"}
                                        onBlur={(e) => handleSave('main_school_account_name', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bank Name & CBN Code</label>
                                    <select
                                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
                                        value={settings['main_school_bank_code'] || "011"}
                                        onChange={(e) => handleSave('main_school_bank_code', e.target.value)}
                                    >
                                        <option value="011">First Bank (011)</option>
                                        <option value="058">GTBank (058)</option>
                                        <option value="033">United Bank for Africa (033)</option>
                                        <option value="301">Jaiz Bank (301)</option>
                                        <option value="057">Zenith Bank (057)</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account Number</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
                                        defaultValue={settings['main_school_account_number'] || "1022340092"}
                                        onBlur={(e) => handleSave('main_school_account_number', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. SETTLEMENT ACCOUNTS MANAGER */}
                <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
                        <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <Landmark className="w-5 h-5 text-indigo-500" />
                            Settlement Accounts Console
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        {/* List registered settlements */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {settlements.map((acct) => (
                                <div key={acct.id} className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col justify-between hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-3">
                                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0 h-10 w-10 flex items-center justify-center">
                                                <Building2 className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 text-sm leading-tight">{acct.accountName}</p>
                                                <p className="text-xs text-slate-400 mt-1">{acct.bankName} • {acct.accountNumber}</p>
                                                <p className="text-[10px] font-mono text-slate-500 mt-0.5">CBN Bank Code: {acct.bankCode}</p>
                                            </div>
                                        </div>
                                        <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px]">
                                            Active
                                        </Badge>
                                    </div>
                                    
                                    {/* Action to map subaccount code */}
                                    <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gateway Mappings</span>
                                        <Button 
                                            size="sm" 
                                            variant="outline"
                                            className="text-xs font-semibold py-1 px-3 text-indigo-600 hover:text-indigo-700"
                                            onClick={() => setMappingAcctId(acct.id)}
                                        >
                                            <Link className="w-3.5 h-3.5 mr-1" />
                                            Map Subaccount
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Map Gateway Subaccount Code Modal/Popover simulator */}
                        {mappingAcctId && (
                            <form onSubmit={handleCreateMapping} className="p-5 rounded-2xl bg-indigo-50/30 border border-indigo-100 space-y-4">
                                <h4 className="text-xs font-extrabold text-indigo-900 uppercase tracking-widest flex items-center gap-1.5">
                                    <Link className="w-4 h-4" />
                                    Map Commercial Account to Gateway Subaccount Identifier
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gateway Provider</label>
                                        <select
                                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
                                            value={mappingGateway}
                                            onChange={(e) => setMappingGateway(e.target.value as 'paystack' | 'flutterwave' | 'remita')}
                                        >
                                            <option value="paystack">Paystack</option>
                                            <option value="flutterwave">Flutterwave</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1 sm:col-span-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                            Gateway Subaccount ID (e.g. ACCT_tuition123 or RS_B6B23C9C)
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
                                                placeholder="Enter gateway code..."
                                                value={mappingCode}
                                                onChange={(e) => setMappingCode(e.target.value)}
                                            />
                                            <Button 
                                                type="submit" 
                                                disabled={mappingLoading}
                                                className="bg-indigo-600 text-white px-4 text-xs font-semibold"
                                            >
                                                {mappingLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save"}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        )}

                        {/* Add new physical bank account form */}
                        <form onSubmit={handleCreateSettlement} className="bg-slate-50 rounded-2xl p-6 border border-slate-200/60 space-y-4">
                            <h4 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                                <Plus className="w-4 h-4 text-slate-500" />
                                Register New Settlement Bank Account
                            </h4>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Account Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Tuition Account"
                                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
                                        value={newAcctName}
                                        onChange={(e) => setNewAcctName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bank Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. First Bank"
                                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
                                        value={newBankName}
                                        onChange={(e) => setNewBankName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">CBN Bank Code</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 011"
                                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
                                        value={newBankCode}
                                        onChange={(e) => setNewBankCode(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Account Number</label>
                                    <input
                                        type="text"
                                        placeholder="10 Digits"
                                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
                                        value={newAcctNum}
                                        onChange={(e) => setNewAcctNum(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end pt-2">
                                <Button 
                                    type="submit" 
                                    disabled={addingSettlement}
                                    className="bg-indigo-600 text-white font-semibold rounded-lg flex items-center gap-1.5 text-xs py-2.5"
                                >
                                    {addingSettlement ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <>
                                            <Plus className="w-3.5 h-3.5" />
                                            Add Account
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* 4. FEE ITEM MAPPINGS */}
                <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden bg-slate-50/10">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                        <CardTitle className="text-base font-bold text-slate-800">Fee Items Settlement Account Mappings</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                                        <th className="p-4">FEE ITEM NAME</th>
                                        <th className="p-4">CATEGORY</th>
                                        <th className="p-4">DEFAULT AMOUNT</th>
                                        <th className="p-4">DESTINATION SETTLEMENT BANK ACCOUNT</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {feeItemsList.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="p-4 font-bold text-slate-800">{item.name}</td>
                                            <td className="p-4">
                                                <Badge variant="outline" className="capitalize px-2 py-0.5 border-slate-200 text-slate-600 bg-white">
                                                    {item.category}
                                                </Badge>
                                            </td>
                                            <td className="p-4 font-mono text-slate-700">{settings?.base_currency || '₦'}{parseFloat(item.defaultAmount).toLocaleString()}</td>
                                            <td className="p-4">
                                                <select
                                                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 bg-white outline-none w-full max-w-xs"
                                                    value={item.settlementAccountId || ""}
                                                    onChange={(e) => handleLinkFeeItem(item.id, e.target.value)}
                                                >
                                                    <option value="">Primary Default Account fallback</option>
                                                    {settlements.map((acct) => (
                                                        <option key={acct.id} value={acct.id}>
                                                            {acct.accountName} ({acct.bankName} - {acct.accountNumber})
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* 5. RECEIPT CUSTOMIZATION */}
                <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden bg-indigo-50/10">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                        <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-indigo-500" />
                            Receipt Customization Template
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {[
                                { id: 'modern', name: 'Modern', desc: 'Sleek, colorful, and highly premium look.' },
                                { id: 'classic', name: 'Classic', desc: 'Traditional official style with formal borders.' },
                                { id: 'minimalist', name: 'Minimalist', desc: 'Clean, simple, and high readability.' },
                                { id: 'heritage', name: 'Heritage Classic', desc: 'Nigerian federal style paper receipt with spelled-out amounts.' }
                            ].map((tpl) => (
                                <div
                                    key={tpl.id}
                                    onClick={() => handleSave('receipt_template', tpl.id)}
                                    role="button"
                                    tabIndex={0}
                                    className={cn(
                                        "p-4 rounded-2xl border-2 transition-all text-left group cursor-pointer",
                                        settings['receipt_template'] === tpl.id
                                            ? "border-indigo-600 bg-white shadow-md shadow-indigo-100"
                                            : "border-slate-100 bg-slate-50/50 hover:border-slate-200"
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className={cn(
                                            "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                            settings['receipt_template'] === tpl.id ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-400 group-hover:bg-slate-300"
                                        )}>
                                            <FileText className="w-4 h-4" />
                                        </div>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                window.open(`/student/finance/receipt-preview?template=${tpl.id}`, '_blank');
                                            }}
                                            className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                                        >
                                            <Eye className="w-3 h-3" /> Preview
                                        </button>
                                    </div>
                                    <p className="font-bold text-slate-900 mb-1">{tpl.name}</p>
                                    <p className="text-[10px] text-slate-500 leading-tight">{tpl.desc}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* 6. GL ACCOUNT MAPPING CARD */}
                <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
                        <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <Landmark className="w-5 h-5 text-indigo-500" />
                            GL Account Mapping (GL Mappings)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                        {glSettings.map((item) => (
                            <div key={item.key} className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{item.label}</label>
                                <select
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 h-11 text-sm focus:ring-2 focus:ring-indigo-500 bg-white outline-none"
                                    value={settings[item.key] || ""}
                                    onChange={(e) => handleSave(item.key, e.target.value)}
                                >
                                    <option value="">Select Account...</option>
                                    {accounts
                                        .filter(acc => acc.category === item.category)
                                        .map(acc => (
                                            <option key={acc.id} value={acc.id}>
                                                [{acc.code}] {acc.name}
                                            </option>
                                        ))}
                                </select>
                            </div>
                        ))}
                    </CardContent>
                    <div className="px-6 pb-6 mt-2">
                        <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3 items-start">
                            <Landmark className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-800 leading-relaxed font-medium">
                                <strong>Important:</strong> These mappings ensure that for every bursary transaction (payment, disbursement, etc.),
                                a corresponding double-entry is automatically recorded in the General Ledger.
                                Ensure you select valid accounts from your Chart of Accounts.
                            </p>
                        </div>
                    </div>
                </Card>

                {/* 7. APPROVAL WORKFLOW CARD */}
                <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                        <CardTitle className="text-base font-bold text-slate-800">Approval Workflow</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-bold text-slate-900">Require Approval for Fee Structures</p>
                                <p className="text-sm text-slate-500">New fee structures must be reviewed before they become active</p>
                            </div>
                            <Button
                                onClick={() => handleSave('require_fee_approval', settings['require_fee_approval'] === 'true' ? 'false' : 'true')}
                                variant={settings['require_fee_approval'] === 'true' ? 'default' : 'outline'}
                                className={cn("font-semibold rounded-lg", settings['require_fee_approval'] === 'true' ? 'bg-green-600 hover:bg-green-700 text-white' : '')}
                            >
                                {settings['require_fee_approval'] === 'true' ? 'Enabled' : 'Disabled'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* 8. PAYMENT GATEWAY API KEYS */}
                <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                        <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-indigo-500" />
                            Payment Gateway Integrations Credentials
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        {[
                            { name: "Paystack API Key", key: "gateway_paystack_key", help: "Secret Key from Paystack Dashboard" },
                            { name: "Flutterwave Secret Key", key: "gateway_flutterwave_key", help: "Secret Key (FLWSECK-X)" },
                            { name: "Remita API Key", key: "gateway_remita_key", help: "API Key / Public Key" },
                            { name: "OPay Secret Key", key: "gateway_opay_key", help: "Merchant ID / Secret Key" },
                        ].map((gateway) => (
                            <div key={gateway.key} className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">{gateway.name}</label>
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">{gateway.help}</p>
                                <div className="flex gap-4 relative">
                                    <input
                                        type={showApiKey[gateway.key] ? "text" : "password"}
                                        className="flex-1 px-4 py-2.5 pr-12 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                                        placeholder={`Enter ${gateway.name} credentials...`}
                                        defaultValue={settings[gateway.key]}
                                        onBlur={(e) => handleSave(gateway.key, e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowApiKey(prev => ({ ...prev, [gateway.key]: !prev[gateway.key] }))}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showApiKey[gateway.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
