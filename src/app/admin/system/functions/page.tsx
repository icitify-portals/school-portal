"use client";

import React, { useState, useEffect } from 'react';
import { 
  Code2, 
  Save, 
  Play, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Terminal,
  HelpCircle,
  FileCode,
  Zap,
  ChevronRight,
  Database,
  ShieldCheck
} from 'lucide-react';
import { getSchoolFunction, setSchoolFunction, listSchoolFunctions, validateFunctionScript } from '@/actions/school-functions';

const COMMON_HOOKS = [
  { id: 'tuition_fee_logic', label: 'Tuition Fee Calculation', desc: 'Custom logic for student billing' },
  { id: 'loan_eligibility', label: 'Loan Eligibility Hook', desc: 'Determine if staff qualifies for a loan' },
  { id: 'audit_risk_rules', label: 'Audit Risk Engine', desc: 'Automatic flagging of suspicious transactions' },
  { id: 'result_aggregation', label: 'Result Aggregation Rule', desc: 'Custom GPA/CGPA calculation logic' },
];

export default function SchoolFunctionEditor() {
  const [functions, setFunctions] = useState<any[]>([]);
  const [selectedProp, setSelectedProp] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [validation, setValidation] = useState<{ valid: boolean, error?: string } | null>(null);

  useEffect(() => {
    loadFunctions();
  }, []);

  async function loadFunctions() {
    const res = await listSchoolFunctions(1); // Placeholder branch ID
    if (res.success) setFunctions(res.data);
  }

  async function handleLoad(prop: string) {
    setLoading(true);
    setSelectedProp(prop);
    const res = await getSchoolFunction(1, prop);
    if (res.success) {
      setCode(res.data.value);
      setDescription(res.data.description || '');
      setStatus(null);
      setValidation(null);
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    const res = await setSchoolFunction({
      branchId: 1,
      property: selectedProp,
      value: code,
      description
    });
    setSaving(false);
    
    if (res.success) {
      setStatus({ type: 'success', text: 'Institutional function updated and deployed.' });
      loadFunctions();
    } else {
      setStatus({ type: 'error', text: res.error || 'Failed to save function.' });
    }
  }

  const validateCode = async () => {
    const res = await validateFunctionScript(code);
    setValidation(res);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-slate-900 text-emerald-400 rounded-2xl flex items-center justify-center shadow-xl font-mono border-2 border-emerald-400/20">
            <Terminal size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Institutional Script Editor</h1>
            <p className="text-slate-500 font-medium text-lg">Dynamic Hook Configuration & Runtime Logic</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-bold border border-emerald-100">
            <ShieldCheck size={16} />
            ICITIFY_DEV ACCESS ACTIVE
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Sidebar: Function List */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Database size={14} />
                Common Hooks
              </h2>
              <div className="grid grid-cols-1 gap-2">
                {COMMON_HOOKS.map((hook) => (
                  <button 
                    key={hook.id}
                    onClick={() => handleLoad(hook.id)}
                    className={`w-full p-4 rounded-2xl text-left transition-all border flex items-center justify-between group ${
                      selectedProp === hook.id ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500/10' : 'bg-white border-slate-50 hover:border-indigo-100'
                    }`}
                  >
                    <div>
                      <div className={`font-bold transition-colors ${selectedProp === hook.id ? 'text-indigo-600' : 'text-slate-700 group-hover:text-indigo-600'}`}>
                        {hook.label}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-1">{hook.id}</div>
                    </div>
                    <ChevronRight size={16} className={`transition-all ${selectedProp === hook.id ? 'text-indigo-600 translate-x-1' : 'text-slate-300 group-hover:text-indigo-400'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="h-px bg-slate-50" />

            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Zap size={14} />
                Deployed Functions
              </h2>
              <div className="space-y-2">
                {functions.length > 0 ? functions.map((f) => (
                  <button 
                    key={f.id}
                    onClick={() => handleLoad(f.property)}
                    className={`w-full p-3 rounded-xl text-left transition-all flex items-center gap-3 ${
                      selectedProp === f.property ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <FileCode size={16} className={selectedProp === f.property ? 'text-emerald-400' : 'text-slate-400'} />
                    <span className="text-sm font-semibold truncate">{f.property}</span>
                  </button>
                )) : (
                  <p className="text-xs text-slate-400 italic">No custom functions deployed.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main: Editor Area */}
        <div className="col-span-12 lg:col-span-9 space-y-6">
          {selectedProp ? (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden flex flex-col min-h-[70vh]">
              {/* Toolbar */}
              <div className="bg-slate-900 p-4 flex justify-between items-center border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 bg-slate-800 rounded text-emerald-400 font-mono text-xs border border-slate-700">
                    {selectedProp}.js
                  </div>
                  <span className="text-slate-500 text-xs font-medium italic">Target: Institutional Runtime</span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={validateCode}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-700 transition-colors flex items-center gap-2"
                  >
                    <Play size={14} />
                    Check Syntax
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-lg ${
                      saving ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-900/20'
                    }`}
                  >
                    <Save size={14} />
                    {saving ? 'Deploying...' : 'Save & Deploy'}
                  </button>
                </div>
              </div>

              {/* Status Bar */}
              {status && (
                <div className={`p-3 px-6 flex items-center gap-2 text-xs font-bold border-b ${
                  status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                }`}>
                  {status.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  {status.text}
                </div>
              )}

              {validation && !validation.valid && (
                <div className="bg-rose-900 text-rose-100 p-3 px-6 text-xs font-mono flex items-start gap-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">COMPILATION ERROR:</span> {validation.error}
                  </div>
                </div>
              )}

              {/* Code Editor (Textarea Styled) */}
              <div className="flex-1 relative bg-slate-900 p-0">
                <div className="absolute left-0 top-0 bottom-0 w-12 bg-slate-800 border-r border-slate-700 flex flex-col items-center pt-6 text-[10px] text-slate-500 font-mono select-none">
                  {Array.from({ length: 50 }).map((_, i) => (
                    <div key={i} className="h-6 leading-6">{i + 1}</div>
                  ))}
                </div>
                <textarea 
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full h-full min-h-[500px] pl-16 pr-6 pt-6 bg-transparent text-emerald-400 font-mono text-sm outline-none resize-none leading-6 placeholder:text-slate-700"
                  placeholder="// Enter institutional logic here..."
                  spellCheck={false}
                />
              </div>

              {/* Metadata Area */}
              <div className="bg-slate-50 border-t border-slate-100 p-6 space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <HelpCircle size={18} className="text-indigo-500" />
                  Function Documentation
                </div>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this logic does, who it affects, and any dependencies..."
                  className="w-full p-4 rounded-2xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all h-24"
                />
              </div>
            </div>
          ) : (
            <div className="bg-white p-20 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-4 opacity-50 h-full">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 animate-pulse">
                <Code2 size={48} />
              </div>
              <div className="max-w-md">
                <h3 className="text-2xl font-bold text-slate-900">Logic Hub</h3>
                <p className="text-slate-500 mt-2">Select a system hook from the sidebar to modify institutional logic in real-time. Changes are deployed instantly across all branches.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
