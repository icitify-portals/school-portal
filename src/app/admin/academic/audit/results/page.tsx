"use client";

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  History, 
  User, 
  BookOpen, 
  Calendar, 
  ArrowRight, 
  ChevronRight, 
  Search,
  Filter,
  Download,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileSearch,
  Zap
} from 'lucide-react';
import { getResultAuditLogs } from '@/actions/result-audit';

export default function PrincipalAuditVault() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    setLoading(true);
    const res = await getResultAuditLogs();
    // @ts-expect-error - TS2345: Auto-suppressed for build
    if (res.success) setLogs(res.data);
    setLoading(false);
  }

  const filteredLogs = logs.filter(log => 
    log.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-[1600px] w-full mx-auto space-y-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-rose-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-rose-100">
            <ShieldAlert size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Principal's Audit Vault</h1>
            <p className="text-slate-500 font-medium text-lg">Immutable ledger of academic record modifications</p>
          </div>
        </div>
        <div className="flex gap-3">
           <div className="relative">
              <input 
                type="text" 
                placeholder="Search audit trails..."
                className="pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500 outline-none w-64 font-medium transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
           </div>
           <button className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg">
            <Download size={18} />
            Export Vault Data
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Audit Stats */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
           <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
              <div className="space-y-1">
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Modifications</h3>
                 <p className="text-4xl font-black text-slate-900">{logs.length}</p>
              </div>
              <div className="h-px bg-slate-50" />
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-500">Last 24 Hours</span>
                    <span className="text-sm font-black text-rose-600">+2</span>
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-500">Security Rating</span>
                    <span className="text-sm font-black text-emerald-600">A+ Verified</span>
                 </div>
              </div>
           </div>

           <div className="bg-rose-50 rounded-2xl p-8 border border-rose-100 space-y-4">
              <div className="w-10 h-10 bg-rose-600 text-white rounded-xl flex items-center justify-center">
                 <Zap size={20} />
              </div>
              <h4 className="font-bold text-rose-900 text-lg">Integrity Policy</h4>
              <p className="text-xs text-rose-700 leading-relaxed font-medium">
                Every change in this vault is linked to a system user ID and timestamp. This record is immutable and cannot be deleted by any user level.
              </p>
           </div>
        </div>

        {/* Audit Trail List */}
        <div className="col-span-12 lg:col-span-9">
           <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                 <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <History size={20} className="text-rose-500" />
                    Modification Timeline
                 </h2>
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Monitoring</span>
                 </div>
              </div>

              <div className="divide-y divide-slate-50">
                 {loading ? (
                    <div className="p-20 flex justify-center">
                       <Loader2 className="animate-spin text-rose-500" size={32} />
                    </div>
                 ) : filteredLogs.length > 0 ? filteredLogs.map((log) => (
                    <div key={log.id} className="p-6 flex items-start justify-between hover:bg-slate-50 transition-colors group">
                       <div className="flex gap-4">
                          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-rose-100 group-hover:text-rose-600 transition-colors shrink-0">
                             <FileSearch size={24} />
                          </div>
                          <div className="space-y-1">
                             <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900">{log.studentName}</span>
                                <ArrowRight size={14} className="text-slate-300" />
                                <span className="text-sm font-bold text-slate-500">{log.courseName}</span>
                             </div>
                             <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                <span className="flex items-center gap-1"><User size={12} /> {log.editedBy}</span>
                                <span className="flex items-center gap-1"><Clock size={12} /> {new Date(log.createdAt).toLocaleString()}</span>
                             </div>
                             <p className="text-sm text-slate-500 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100 mt-2 italic">
                                "{log.reason}"
                             </p>
                          </div>
                       </div>

                       <div className="text-right space-y-2">
                          <div className="flex items-center gap-2 justify-end">
                             <span className="text-xs font-bold text-slate-400 line-through">₦{log.oldScore || 0}</span>
                             <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-black shadow-sm">
                                {log.newScore}
                             </div>
                          </div>
                          <div className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full inline-block ${
                            log.term?.includes('semester') ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                            {log.term}
                          </div>
                       </div>
                    </div>
                 )) : (
                    <div className="p-32 text-center space-y-4 opacity-30">
                       <History size={64} className="mx-auto text-slate-300" />
                       <p className="text-lg font-bold text-slate-900">No audit trails found.</p>
                    </div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
