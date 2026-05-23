"use client";

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Upload, 
  FileText, 
  Download, 
  ChevronRight, 
  Search,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  DollarSign,
  ArrowRight,
  Loader2,
  Plus
} from 'lucide-react';
import { getRecentReconciliations, runPayrollReconciliation, getReconciliationDetails } from '@/actions/payroll-reconciliation';

export default function PayrollReconciliationDashboard() {
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Form State
  const [month, setMonth] = useState('2024-05');
  const [csvContent, setCsvContent] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    setLoading(true);
    const res = await getRecentReconciliations();
    if (res.success) setLogs(res.data);
    setLoading(false);
  }

  async function handleReconcile() {
    setProcessing(true);
    // Simulate CSV parsing: email,amount
    const lines = csvContent.split('\n').filter(l => l.trim());
    const bankReport = lines.map(line => {
      const [email, amount] = line.split(',');
      return { staffEmail: email?.trim(), paidAmount: parseFloat(amount?.trim() || "0") };
    });

    const res = await runPayrollReconciliation({ month, bankReport });
    setProcessing(false);
    
    if (res.success) {
      setShowUpload(false);
      setCsvContent('');
      loadLogs();
    } else {
      alert(res.error);
    }
  }

  async function viewDetails(id: number) {
    const res = await getReconciliationDetails(id);
    if (res.success) setSelectedLog(res.data);
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100">
            <ShieldCheck size={30} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Payroll Integrity Center</h1>
            <p className="text-slate-500 font-medium text-lg">Automated reconciliation and ghost-worker detection</p>
          </div>
        </div>
        <button 
          onClick={() => setShowUpload(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
          <Plus size={20} />
          New Reconciliation Run
        </button>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Main Feed: Reconciliation History */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">Recent Reconciliation Audits</h2>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">History</div>
            </div>

            <div className="divide-y divide-slate-50">
              {loading ? (
                <div className="p-20 flex justify-center">
                  <Loader2 className="animate-spin text-indigo-500" size={32} />
                </div>
              ) : logs.length > 0 ? logs.map((log) => (
                <div 
                  key={log.id} 
                  className={`p-6 flex items-center justify-between group cursor-pointer hover:bg-slate-50 transition-colors ${selectedLog?.id === log.id ? 'bg-indigo-50/50' : ''}`}
                  onClick={() => viewDetails(log.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      log.status === 'matched' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                    }`}>
                      {log.status === 'matched' ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
                    </div>
                    <div>
                      <div className="text-slate-900 font-bold text-lg leading-tight">{log.month} Reconciliation</div>
                      <div className="text-slate-400 text-sm font-medium">Reconciled by {log.reconciledBy || 'System'} • {new Date(log.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-right hidden sm:block">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Discrepancies</div>
                      <div className={`text-lg font-bold ${log.discrepancyCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {log.discrepancyCount} Detected
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              )) : (
                <div className="p-20 text-center space-y-4 opacity-50">
                  <FileText size={48} className="mx-auto text-slate-300" />
                  <p className="text-slate-500 font-medium">No reconciliation logs found.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: Details / Summary */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {selectedLog ? (
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl space-y-8 animate-in fade-in slide-in-from-right-4">
              <div className="space-y-2">
                <div className={`w-fit px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                  selectedLog.status === 'matched' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}>
                  {selectedLog.status === 'matched' ? 'Integrity Verified' : 'Action Required'}
                </div>
                <h3 className="text-2xl font-bold text-slate-900">{selectedLog.month} Detailed Report</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Expected</div>
                  <div className="text-lg font-bold text-slate-900">₦{parseFloat(selectedLog.totalExpected).toLocaleString()}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Actual</div>
                  <div className="text-lg font-bold text-slate-900">₦{parseFloat(selectedLog.totalActual).toLocaleString()}</div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldAlert size={16} className="text-rose-500" />
                  Discrepancy Breakdown
                </h4>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {selectedLog.discrepancyDetails.map((d: any, i: number) => (
                    <div key={i} className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl space-y-1">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-rose-700 uppercase tracking-widest">{d.type}</span>
                        {d.diff && <span className="text-[10px] font-bold text-rose-600">₦{d.diff.toLocaleString()} diff</span>}
                      </div>
                      <div className="text-sm font-bold text-slate-900">{d.name || d.email}</div>
                      <div className="text-xs text-slate-500">{d.reason || `Expected ₦${d.expected?.toLocaleString()}, but paid ₦${d.actual?.toLocaleString()}`}</div>
                    </div>
                  ))}
                  {selectedLog.discrepancyDetails.length === 0 && (
                    <div className="text-center p-8 opacity-30 italic text-sm">No discrepancies to display</div>
                  )}
                </div>
              </div>

              <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg">
                <Download size={18} />
                Download Full Audit Report
              </button>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-3xl border-2 border-dashed border-slate-200 text-center space-y-4 opacity-50">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <Search size={32} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Audit Insight</h3>
                <p className="text-sm text-slate-500">Select a reconciliation log from the feed to view detailed discrepancy analysis and integrity reports.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: New Reconciliation */}
      {showUpload && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-slate-900">New Payroll Audit</h2>
                  <p className="text-slate-500 text-sm">Paste bank disbursement records for cross-verification</p>
                </div>
                <button onClick={() => setShowUpload(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Payroll Month</label>
                  <input 
                    type="month" 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-semibold"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex justify-between">
                  <span>Bank Report Data (CSV)</span>
                  <span className="text-[10px] text-slate-400">FORMAT: email,amount</span>
                </label>
                <textarea 
                  placeholder="john.doe@university.edu,150000.00&#10;jane.smith@university.edu,125000.00"
                  className="w-full h-48 p-4 rounded-xl border border-slate-200 font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  value={csvContent}
                  onChange={(e) => setCsvContent(e.target.value)}
                />
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setShowUpload(false)}
                  className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleReconcile}
                  disabled={processing || !csvContent}
                  className={`flex-[2] py-4 rounded-2xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                    processing ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200'
                  }`}
                >
                  {processing ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Auditing Payroll...
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={20} />
                      Execute Reconciliation Audit
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
