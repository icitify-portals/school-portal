"use client";

import React, { useState, useEffect } from 'react';
import { 
  Split, 
  Plus, 
  Trash2, 
  Save, 
  Info, 
  ChevronRight, 
  LayoutGrid, 
  ArrowRight,
  Database,
  PieChart,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { getAllocationData, getRulesForFee, saveAllocationRules } from '@/actions/fee-allocation';

export default function FeeAllocationManager() {
  const [feeItems, setFeeItems] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedFee, setSelectedFee] = useState<any>(null);
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const res = await getAllocationData();
    if (res.success) {
      setFeeItems(res.feeItems || []);
      setAccounts(res.accounts || []);
    }
    setLoading(false);
  }

  async function handleFeeSelect(fee: any) {
    setSelectedFee(fee);
    const res = await getRulesForFee(fee.id);
    if (res.success) {
      // @ts-expect-error - TS2345: Auto-suppressed for build
      setRules(res.data);
      setStatus(null);
    }
  }

  const addRule = () => {
    setRules([...rules, { targetAccountId: accounts[0]?.id, percentage: '0', priority: rules.length }]);
  };

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const updateRule = (index: number, field: string, value: any) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], [field]: value };
    setRules(newRules);
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await saveAllocationRules(selectedFee.id, rules);
    setSaving(false);
    
    if (res.success) {
      setStatus({ type: 'success', text: 'Fee allocation rules successfully updated and deployed.' });
    } else {
      // @ts-expect-error - TS2339: Auto-suppressed for build
      setStatus({ type: 'error', text: res.error || 'Failed to save rules.' });
    }
  };

  const totalPercentage = rules.reduce((sum, r) => sum + parseFloat(r.percentage || '0'), 0);

  return (
    <div className="p-8 max-w-[1600px] w-full mx-auto space-y-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100">
            <Split size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Revenue Allocation Manager</h1>
            <p className="text-slate-500 font-medium text-lg">Define granular GL distribution rules for student fees</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Left: Fee Item Sidebar */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Database size={14} />
              University Fee Library
            </h2>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
              {loading ? (
                <div className="p-10 flex justify-center">
                  <Loader2 className="animate-spin text-indigo-500" size={24} />
                </div>
              ) : feeItems.map((fee) => (
                <button 
                  key={fee.id}
                  onClick={() => handleFeeSelect(fee)}
                  className={`w-full p-4 rounded-2xl text-left border flex items-center justify-between group transition-all ${
                    selectedFee?.id === fee.id ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500/10' : 'bg-white border-slate-50 hover:border-indigo-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedFee?.id === fee.id ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600'}`}>
                      <LayoutGrid size={18} />
                    </div>
                    <div>
                      <div className="text-slate-900 font-bold">{fee.name}</div>
                      <div className="text-slate-400 text-xs">₦{parseFloat(fee.defaultAmount).toLocaleString()} • {fee.category}</div>
                    </div>
                  </div>
                  <ChevronRight size={18} className={`transition-all ${selectedFee?.id === fee.id ? 'text-indigo-600 translate-x-1' : 'text-slate-300 group-hover:text-indigo-400'}`} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Allocation Rules */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {selectedFee ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden animate-in fade-in slide-in-from-right-4">
              <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl border border-slate-200 flex items-center justify-center text-indigo-600">
                    <PieChart size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{selectedFee.name}</h3>
                    <p className="text-slate-500 text-sm">Configure how payments for this fee are distributed</p>
                  </div>
                </div>
                <button 
                  onClick={addRule}
                  className="bg-white border border-slate-200 p-2 px-4 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add Split
                </button>
              </div>

              {status && (
                <div className={`p-4 mx-8 mt-6 rounded-2xl flex items-center gap-3 font-semibold text-sm ${
                  status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}>
                  {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                  {status.text}
                </div>
              )}

              <div className="p-8 space-y-4">
                {rules.length > 0 ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-12 gap-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <div className="col-span-6">Target General Ledger Account</div>
                      <div className="col-span-3 text-center">Split %</div>
                      <div className="col-span-2 text-center">Fixed (₦)</div>
                      <div className="col-span-1"></div>
                    </div>
                    {rules.map((rule, index) => (
                      <div key={index} className="grid grid-cols-12 gap-4 p-2 bg-slate-50 rounded-2xl border border-slate-100 items-center group">
                        <div className="col-span-6">
                          <select 
                            className="w-full bg-white px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold"
                            value={rule.targetAccountId}
                            onChange={(e) => updateRule(index, 'targetAccountId', parseInt(e.target.value))}
                          >
                            {accounts.map(acc => (
                              <option key={acc.id} value={acc.id}>[{acc.code}] {acc.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-3">
                          <div className="relative">
                            <input 
                              type="number" 
                              className="w-full bg-white px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-center font-bold text-sm"
                              value={rule.percentage}
                              onChange={(e) => updateRule(index, 'percentage', e.target.value)}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">%</span>
                          </div>
                        </div>
                        <div className="col-span-2">
                           <input 
                              type="number" 
                              placeholder="0"
                              className="w-full bg-white px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-center font-bold text-sm"
                              value={rule.fixedAmount}
                              onChange={(e) => updateRule(index, 'fixedAmount', e.target.value)}
                            />
                        </div>
                        <div className="col-span-1 flex justify-center">
                          <button onClick={() => removeRule(index)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-20 text-center space-y-4 opacity-40">
                    <PieChart size={48} className="mx-auto text-slate-300" />
                    <p className="text-slate-500 font-medium">No allocation rules defined for this fee yet.<br/>By default, 100% goes to the primary revenue account.</p>
                  </div>
                )}
              </div>

              <div className="p-8 bg-slate-50/50 border-t border-slate-50 space-y-6">
                 {/* Allocation Summary */}
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                       <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configured Allocation</span>
                          <div className={`text-2xl font-black ${totalPercentage === 100 ? 'text-emerald-600' : totalPercentage > 100 ? 'text-rose-600' : 'text-amber-600'}`}>
                            {totalPercentage}%
                          </div>
                       </div>
                       <div className="h-10 w-px bg-slate-200" />
                       <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unallocated Balance</span>
                          <div className="text-2xl font-black text-slate-900">
                            {Math.max(0, 100 - totalPercentage)}%
                          </div>
                       </div>
                    </div>
                    
                    <button 
                      onClick={handleSave}
                      disabled={saving || totalPercentage > 100}
                      className={`px-8 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-lg transition-all ${
                        saving ? 'bg-slate-200 text-slate-400' : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                      Save & Deploy Allocation
                    </button>
                 </div>

                 {totalPercentage > 100 && (
                   <div className="p-4 bg-rose-50 text-rose-700 rounded-2xl flex items-center gap-3 text-sm font-bold animate-pulse">
                     <AlertCircle size={20} />
                     Critical: Total allocation exceeds 100%. Please adjust rules before saving.
                   </div>
                 )}

                 <div className="p-6 bg-white rounded-2xl border border-slate-100 flex items-start gap-3">
                    <Info size={20} className="text-indigo-500 shrink-0" />
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Any unallocated balance (remainder) will be automatically posted to the <span className="font-bold text-slate-700">Default Tuition Revenue Account [4001]</span> to ensure the Ledger remains balanced. 
                      Fixed amounts take priority over percentage splits.
                    </p>
                 </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-20 rounded-2xl border-2 border-dashed border-slate-200 text-center space-y-4 opacity-50 h-full flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                <Split size={40} />
              </div>
              <div className="max-w-xs">
                <h3 className="text-xl font-bold text-slate-900">Revenue Orchestration</h3>
                <p className="text-sm text-slate-500">Select a fee item from the library to configure its dynamic distribution across the institution's General Ledger.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
