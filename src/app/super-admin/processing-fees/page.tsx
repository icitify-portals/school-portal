"use client";

import React, { useState, useEffect } from "react";
import { getAllProcessingFeeRules, saveProcessingFeeRule, deleteProcessingFeeRule } from "@/actions/processing-fees";
import { Save, Trash, Plus, CheckCircle, XCircle } from "lucide-react";

export default function ProcessingFeesDashboard() {
    const [rules, setRules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");
    
    const [newRule, setNewRule] = useState({ serviceType: "", amount: 0, isActive: true });

    useEffect(() => {
        fetchRules();
    }, []);

    async function fetchRules() {
        const res = await getAllProcessingFeeRules();
        if (res.success && res.data) {
            setRules(res.data);
        } else {
            setError(res.error || "Failed to load rules.");
        }
        setLoading(false);
    }

    async function handleAddRule(e: React.FormEvent) {
        e.preventDefault();
        setIsSaving(true);
        setError("");
        
        const res = await saveProcessingFeeRule(newRule);
        if (res.success) {
            setNewRule({ serviceType: "", amount: 0, isActive: true });
            fetchRules();
        } else {
            setError(res.error || "Failed to save rule.");
        }
        setIsSaving(false);
    }

    async function handleToggleRule(rule: any) {
        setIsSaving(true);
        await saveProcessingFeeRule({ ...rule, isActive: !rule.isActive });
        fetchRules();
        setIsSaving(false);
    }

    async function handleDeleteRule(id: number) {
        if (!confirm("Are you sure you want to delete this rule?")) return;
        setIsSaving(true);
        await deleteProcessingFeeRule(id);
        fetchRules();
        setIsSaving(false);
    }

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold mb-2">Processing Fees Management</h1>
            <p className="text-slate-500 mb-8">Manage dynamic processing fees across the system (Icitify Developer Only).</p>
            
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium">
                    {error}
                </div>
            )}

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-indigo-500"/> Add New Rule</h2>
                <form onSubmit={handleAddRule} className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Service Type</label>
                        <input required type="text" placeholder="e.g. CERTIFICATE_REQUEST" className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" value={newRule.serviceType} onChange={e => setNewRule({...newRule, serviceType: e.target.value.toUpperCase()})} />
                    </div>
                    <div className="w-32">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₦)</label>
                        <input required type="number" min="0" step="100" className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" value={newRule.amount} onChange={e => setNewRule({...newRule, amount: Number(e.target.value)})} />
                    </div>
                    <button disabled={isSaving} type="submit" className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                        <Save className="w-4 h-4"/> Add Rule
                    </button>
                </form>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-xs">
                        <tr>
                            <th className="p-4">Service Type</th>
                            <th className="p-4">Amount</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-500">Loading rules...</td></tr>
                        ) : rules.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-500">No processing fee rules found.</td></tr>
                        ) : rules.map(rule => (
                            <tr key={rule.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                <td className="p-4 font-bold text-slate-800">{rule.serviceType}</td>
                                <td className="p-4 text-emerald-600 font-bold">₦{Number(rule.amount).toLocaleString()}</td>
                                <td className="p-4">
                                    <button onClick={() => handleToggleRule(rule)} disabled={isSaving} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${rule.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                                        {rule.isActive ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                        {rule.isActive ? 'ACTIVE' : 'INACTIVE'}
                                    </button>
                                </td>
                                <td className="p-4">
                                    <button onClick={() => handleDeleteRule(rule.id)} disabled={isSaving} className="text-red-500 hover:bg-red-50 p-2 rounded-lg">
                                        <Trash className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
