"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save, Loader2, Settings2, Landmark, Sparkles, Eye, EyeOff, CreditCard, FileText } from "lucide-react";
import { getBursarySettings, updateBursarySetting } from "@/actions/bursary";
import { getCOA } from "@/actions/accounting";
import { cn } from "@/lib/utils";

export default function BursarySettingsPage() {
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const [settingsData, coaData] = await Promise.all([
            getBursarySettings(),
            getCOA()
        ]);
        setSettings(settingsData);
        setAccounts(coaData);
        setLoading(false);
    };

    const handleSave = async (key: string, value: string) => {
        setSubmitting(true);
        await updateBursarySetting(key, value);
        // Refresh settings locally to update UI immediately
        setSettings(prev => ({ ...prev, [key]: value }));
        setSubmitting(false);
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
    ];

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                    <Settings2 className="w-8 h-8 text-indigo-600" />
                    Bursary Settings
                </h2>
                <p className="text-slate-500 mt-1">Configure financial policies and module behavior</p>
            </div>

            <div className="space-y-6">
                <Card className="border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Payment Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                            <div>
                                <p className="font-bold text-slate-900">Payment Mode</p>
                                <p className="text-sm text-slate-500">Determine if students pay annually or by semester</p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => handleSave('payment_mode', 'semester')}
                                    variant={settings['payment_mode'] === 'semester' ? 'default' : 'outline'}
                                    className={settings['payment_mode'] === 'semester' ? 'bg-indigo-600' : ''}
                                >
                                    Semester
                                </Button>
                                <Button
                                    onClick={() => handleSave('payment_mode', 'annual')}
                                    variant={settings['payment_mode'] === 'annual' ? 'default' : 'outline'}
                                    className={settings['payment_mode'] === 'annual' ? 'bg-indigo-600' : ''}
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
                                    className="flex-1 px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 text-sm"
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

                <Card className="border-none shadow-sm overflow-hidden bg-indigo-50/10">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-indigo-500" />
                            Receipt Customization
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { id: 'modern', name: 'Modern', desc: 'Sleek, colorful, and highly premium look.' },
                                { id: 'classic', name: 'Classic', desc: 'Traditional official style with formal borders.' },
                                { id: 'minimalist', name: 'Minimalist', desc: 'Clean, simple, and high readability.' },
                            ].map((tpl) => (
                                <button
                                    key={tpl.id}
                                    onClick={() => handleSave('receipt_template', tpl.id)}
                                    className={cn(
                                        "p-4 rounded-2xl border-2 transition-all text-left group",
                                        settings['receipt_template'] === tpl.id
                                            ? "border-indigo-600 bg-white shadow-md shadow-indigo-100"
                                            : "border-slate-100 bg-slate-50/50 hover:border-slate-200"
                                    )}
                                >
                                    <div className={cn(
                                        "w-8 h-8 rounded-lg mb-3 flex items-center justify-center transition-colors",
                                        settings['receipt_template'] === tpl.id ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-400 group-hover:bg-slate-300"
                                    )}>
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    <p className="font-bold text-slate-900 mb-1">{tpl.name}</p>
                                    <p className="text-[10px] text-slate-500 leading-tight">{tpl.desc}</p>
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Landmark className="w-5 h-5 text-indigo-500" />
                            GL Account Mapping
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {glSettings.map((item) => (
                            <div key={item.key} className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{item.label}</label>
                                <select
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 h-10 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
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

                <Card className="border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Approval Workflow</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-bold text-slate-900">Require Approval for Fee Structures</p>
                                <p className="text-sm text-slate-500">New fee structures must be reviewed before they become active</p>
                            </div>
                            <Button
                                onClick={() => handleSave('require_fee_approval', settings['require_fee_approval'] === 'true' ? 'false' : 'true')}
                                variant={settings['require_fee_approval'] === 'true' ? 'default' : 'outline'}
                                className={settings['require_fee_approval'] === 'true' ? 'bg-green-600 hover:bg-green-700 border-none' : ''}
                            >
                                {settings['require_fee_approval'] === 'true' ? 'Enabled' : 'Disabled'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-indigo-500" />
                            Payment Gateway Integrations
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {[
                            { name: "Paystack", key: "gateway_paystack_key", help: "Secret Key from Paystack Dashboard" },
                            { name: "Flutterwave", key: "gateway_flutterwave_key", help: "Secret Key (FLWSECK-X)" },
                            { name: "Remita", key: "gateway_remita_key", help: "API Key / Public Key" },
                            { name: "OPay", key: "gateway_opay_key", help: "Merchant ID / Secret Key" },
                        ].map((gateway) => (
                            <div key={gateway.key} className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">{gateway.name}</label>
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">{gateway.help}</p>
                                <div className="flex gap-4 relative">
                                    <input
                                        type={showApiKey[gateway.key] ? "text" : "password"}
                                        className="flex-1 px-4 py-2 pr-12 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
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

                <Card className="border-none shadow-sm overflow-hidden bg-indigo-50/30">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 text-indigo-900">
                            <Sparkles className="w-5 h-5 text-indigo-500" />
                            AI & Institutional Intelligence
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Google Gemini API Key</label>
                            <p className="text-xs text-slate-500 mb-3">Required for Intelligent OCR (Invoice Scanning) and Bursary-Bot. Get your key from Google AI Studio.</p>
                            <div className="flex gap-4 relative">
                                <input
                                    type={showApiKey['gemini_api_key'] ? "text" : "password"}
                                    className="flex-1 px-4 py-2 pr-12 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                                    placeholder="Enter your Gemini API key..."
                                    defaultValue={settings['gemini_api_key']}
                                    onBlur={(e) => handleSave('gemini_api_key', e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowApiKey(prev => ({ ...prev, gemini_api_key: !prev.gemini_api_key }))}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showApiKey['gemini_api_key'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="p-4 bg-white/60 border border-indigo-100 rounded-xl flex gap-3 items-center">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-[10px] font-bold text-indigo-800 uppercase tracking-widest">
                                AI Status: {settings['gemini_api_key'] ? 'Configured & Ready' : 'Awaiting Integration'}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
