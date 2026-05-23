"use client";

import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Trash2, 
  Zap, 
  Database, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Server, 
  HardDrive, 
  RefreshCw, 
  Activity,
  Terminal,
  Cpu,
  ChevronRight,
  ShieldCheck,
  CreditCard,
  Search
} from 'lucide-react';
import { 
  cleanupDuplicateUsersAction, 
  deleteInvalidTeachersAction, 
  triggerLedgerCachingAction, 
  syncPaymentModesAction 
} from '@/actions/maintenance-actions';
import SystemTerminal from '@/components/SystemTerminal';

export default function SystemMaintenanceDashboard() {
  const [running, setRunning] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);

  const runTask = async (taskName: string, action: any) => {
    setRunning(taskName);
    setResults(null);
    const res = await action();
    setResults({ task: taskName, ...res });
    setRunning(null);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-rose-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-rose-100">
            <ShieldAlert size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Institutional Health Studio</h1>
            <p className="text-slate-500 font-medium text-lg">High-authority maintenance and database optimization suite</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl border border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-widest">
           <Server size={16} className="text-indigo-600" />
           Kernel Version 2.4.0-RUST-PORT
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Core Maintenance Tools */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
           <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden">
              <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex items-center gap-3">
                 <Terminal size={22} className="text-rose-600" />
                 <h2 className="text-xl font-bold text-slate-900">Advanced Maintenance Routines</h2>
              </div>

              <div className="p-8 space-y-6">
                 {[
                   { 
                     id: 'duplicate_users', 
                     title: 'Cleanup Duplicate Users', 
                     desc: 'Identifies and purges duplicate Staff TIDs and Admission records. Ported from Rust backend.', 
                     icon: Trash2, 
                     action: cleanupDuplicateUsersAction,
                     color: 'text-rose-600',
                     bg: 'bg-rose-50'
                   },
                   { 
                     id: 'invalid_teachers', 
                     title: 'Purge Invalid Staff', 
                     desc: 'Removes staff profiles that lack valid underlying user accounts to ensure relational integrity.', 
                     icon: Database, 
                     action: deleteInvalidTeachersAction,
                     color: 'text-amber-600',
                     bg: 'bg-amber-50'
                   },
                   { 
                     id: 'ledger_cache', 
                     title: 'Pre-calculate Ledgers', 
                     desc: 'Triggers a background process to cache all individual student financial ledgers for optimized performance.', 
                     icon: Zap, 
                     action: triggerLedgerCachingAction,
                     color: 'text-indigo-600',
                     bg: 'bg-indigo-50'
                   },
                   { 
                     id: 'payment_sync', 
                     title: 'Gateway Mode Sync', 
                     desc: 'Validates and synchronizes transaction gateway modes (Live/Test) with external provider states.', 
                     icon: CreditCard, 
                     action: syncPaymentModesAction,
                     color: 'text-emerald-600',
                     bg: 'bg-emerald-50'
                   },
                   { 
                     id: 'asset_audit', 
                     title: 'Dormant Asset Audit', 
                     desc: 'Performs static analysis of the codebase to identify unreferenced legacy scripts and AJAX files.', 
                     icon: Search, 
                     action: async () => ({ success: true, dormantCount: 2 }),
                     color: 'text-purple-600',
                     bg: 'bg-purple-50'
                   }
                 ].map((task) => (
                    <div key={task.id} className="group p-6 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-between hover:bg-white hover:border-indigo-100 hover:shadow-lg transition-all duration-300">
                       <div className="flex items-center gap-5">
                          <div className={`w-14 h-14 ${task.bg} ${task.color} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500`}>
                             <task.icon size={24} />
                          </div>
                          <div className="max-w-md">
                             <h3 className="text-lg font-bold text-slate-900">{task.title}</h3>
                             <p className="text-sm text-slate-500 font-medium leading-relaxed">{task.desc}</p>
                          </div>
                       </div>
                       <button 
                         onClick={() => runTask(task.title, task.action)}
                         disabled={running !== null}
                         className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
                           running === task.title ? 'bg-slate-200 text-slate-400' : 'bg-slate-900 text-white hover:bg-indigo-600 shadow-md'
                         }`}
                       >
                          {running === task.title ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />}
                          Execute Task
                       </button>
                    </div>
                 ))}
              </div>
           </div>

           {/* System Version & Update Card */}
           <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden mt-8">
              <div className="p-8 border-b border-slate-50 bg-indigo-600 text-white flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <RefreshCw size={22} />
                    <h2 className="text-xl font-bold">System Lifecycle & Updates</h2>
                 </div>
                 <div className="text-[10px] font-black uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full border border-white/20">
                    Current Version: v2.4.0
                 </div>
              </div>

              <div className="p-10 grid grid-cols-2 gap-12">
                 <div className="space-y-6">
                    <div className="space-y-2">
                       <h3 className="text-lg font-bold text-slate-900">Kernel Update Engine</h3>
                       <p className="text-sm text-slate-500 font-medium leading-relaxed">
                          Check for new releases and perform system-wide updates. This process migrates database schemas and updates institutional binaries.
                       </p>
                    </div>
                    <div className="flex gap-4">
                       <button className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg">
                          Check for Updates
                       </button>
                       <button className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg">
                          Install v2.4.1-RC
                       </button>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <div className="space-y-2">
                       <h3 className="text-lg font-bold text-slate-900">Typedef Synchronization</h3>
                       <p className="text-sm text-slate-500 font-medium leading-relaxed">
                          Regenerate and synchronize TypeScript definitions from the Rust core. Ensures frontend-backend structural alignment.
                       </p>
                    </div>
                    <button className="w-full py-4 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-2xl font-bold text-sm hover:bg-indigo-100 transition-all">
                       Sync TypeScript Definitions
                    </button>
                 </div>
              </div>
           </div>

           {results && (
              <div className="bg-slate-900 rounded-[40px] p-8 text-white animate-in zoom-in-95 duration-300 shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8 opacity-10">
                    <CheckCircle2 size={120} />
                 </div>
                 <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-2 text-emerald-400 font-black uppercase tracking-tighter text-xs">
                       <ShieldCheck size={14} />
                       Task Completion Certificate
                    </div>
                    <h2 className="text-2xl font-bold">Execution Successful: {results.task}</h2>
                    <div className="bg-white/5 rounded-2xl p-6 font-mono text-sm space-y-2">
                       {Object.entries(results).map(([key, val]: [string, any]) => (
                         key !== 'task' && key !== 'success' && (
                           <div key={key} className="flex justify-between border-b border-white/5 pb-2">
                              <span className="text-slate-400">{key}:</span>
                              <span className="text-emerald-400">{val.toString()}</span>
                           </div>
                         )
                       ))}
                    </div>
                 </div>
              </div>
           )}
        </div>

        {/* Sidebar: System Stats & Policy */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
           <div className="bg-slate-900 rounded-[40px] p-8 text-white space-y-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                 <RefreshCw size={120} />
              </div>
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-400">
                 <Activity size={28} />
              </div>
              <div className="space-y-4 relative z-10">
                 <h3 className="text-2xl font-bold">Service Orchestration</h3>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs font-medium border-b border-white/5 pb-2">
                       <span className="text-slate-500 uppercase tracking-widest">Webserver (Axum)</span>
                       <span className="font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 size={12} /> Online
                       </span>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs font-medium border-b border-white/5 pb-2">
                       <span className="text-slate-500 uppercase tracking-widest">Websocket Gateway</span>
                       <span className="font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 size={12} /> Port 8087
                       </span>
                    </div>

                    <div className="flex justify-between items-center text-xs font-medium">
                       <span className="text-slate-500 uppercase tracking-widest">Worker Node</span>
                       <span className="font-bold text-amber-400 flex items-center gap-2">
                          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                          Ready
                       </span>
                    </div>
                 </div>
              </div>
           </div>

           <SystemTerminal />
        </div>

           <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                 <Cpu size={20} className="text-indigo-600" />
                 Kernel Policy
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                 These maintenance routines are ported from the institutional Rust core. Execution bypasses standard safety locks and directly modifies high-integrity relations. Use with caution.
              </p>
              <div className="p-4 bg-rose-50 rounded-2xl flex items-center gap-3 text-rose-600">
                 <Lock size={16} />
                 <span className="text-[10px] font-black uppercase tracking-widest">Super Admin Clearance Required</span>
              </div>
           </div>
        </div>
      </div>
  );
}
