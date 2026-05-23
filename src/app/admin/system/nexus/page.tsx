"use client";

import React, { useState } from 'react';
import { 
  CloudSync, 
  ShieldCheck, 
  Database, 
  Globe, 
  Zap, 
  RefreshCw, 
  Download, 
  Server, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Lock,
  Cpu,
  Unplug
} from 'lucide-react';
import { synchronizeNodeFromCloudAction, orchestrateNodeSetupAction } from '@/actions/nexus-actions';

export default function NexusControlCenter() {
  const [syncing, setSyncing] = useState(false);
  const [setupMode, setSetupMode] = useState(false);
  const [nodeId, setNodeId] = useState('NODE-774');
  const [schoolName, setSchoolName] = useState('');
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => setLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

  const handleCloudSync = async () => {
    setSyncing(true);
    addLog(`Initiating Cloud Sync for ${nodeId}...`);
    const res = await synchronizeNodeFromCloudAction(nodeId);
    if (res.success) {
      addLog(`SUCCESS: ${res.message}`);
    } else {
      addLog(`FAILURE: ${res.error}`);
    }
    setSyncing(false);
  };

  const handleSetup = async () => {
    if (!schoolName) return;
    setSyncing(true);
    addLog(`Orchestrating Setup for ${schoolName}...`);
    const res = await orchestrateNodeSetupAction(nodeId, schoolName);
    if (res.success) {
      addLog(`SUCCESS: ${res.message}`);
      setSetupMode(false);
    }
    setSyncing(false);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-slate-950 min-h-screen text-slate-300 font-sans">
      {/* Header: Institutional Nexus Branding */}
      <div className="flex justify-between items-end border-b border-slate-800 pb-8">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-indigo-600 rounded-[28px] flex items-center justify-center shadow-2xl shadow-indigo-900/40">
            <Globe size={40} className="text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-3">
                <h1 className="text-4xl font-black text-white tracking-tighter">Institutional Nexus</h1>
                <span className="px-3 py-1 bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full">SuperAdmin Restricted</span>
            </div>
            <p className="text-slate-500 font-bold text-lg mt-1 italic">"Orchestrating Institutional Immortality across the Cloud Vault"</p>
          </div>
        </div>
        
        <div className="flex gap-4">
           <div className="text-right">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Kernel Status</div>
              <div className="text-emerald-500 font-black flex items-center gap-2 justify-end">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                 SYNCHRONIZED
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Main Orchestration Panel */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
           <div className="grid grid-cols-2 gap-6">
              <button 
                onClick={() => setSetupMode(false)}
                className={`p-8 rounded-[40px] border transition-all text-left space-y-4 ${!setupMode ? 'bg-indigo-600 border-indigo-400 text-white shadow-2xl' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
              >
                 <Download size={32} />
                 <div>
                    <h3 className="text-xl font-bold">Cloud Pull</h3>
                    <p className="text-xs opacity-60 font-medium">Synchronize local data with the remote Wasabi Cloud Vault.</p>
                 </div>
              </button>

              <button 
                onClick={() => setSetupMode(true)}
                className={`p-8 rounded-[40px] border transition-all text-left space-y-4 ${setupMode ? 'bg-emerald-600 border-emerald-400 text-white shadow-2xl' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
              >
                 <Zap size={32} />
                 <div>
                    <h3 className="text-xl font-bold">Node Deploy</h3>
                    <h3 className="text-xl font-bold">Node Deploy</h3>
                    <p className="text-xs opacity-60 font-medium">Orchestrate end-to-end setup for a new institutional node.</p>
                 </div>
              </button>
           </div>

           <div className="bg-slate-900 rounded-[40px] border border-slate-800 p-12 space-y-10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-5">
                 <Server size={200} />
              </div>
              
              <div className="flex items-center gap-4 relative z-10">
                 <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-indigo-400">
                    <Database size={24} />
                 </div>
                 <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Sync Configuration</h2>
              </div>

              <div className="grid grid-cols-2 gap-8 relative z-10">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Target Node ID</label>
                    <input 
                      type="text" 
                      value={nodeId}
                      onChange={(e) => setNodeId(e.target.value)}
                      className="w-full p-5 bg-slate-950 border border-slate-800 rounded-2xl font-black text-xl text-indigo-400 focus:border-indigo-500 outline-none transition-all"
                    />
                 </div>

                 {setupMode && (
                   <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">New Institution Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. ICITIFY Academy"
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        className="w-full p-5 bg-slate-950 border border-slate-800 rounded-2xl font-black text-xl text-emerald-400 focus:border-emerald-500 outline-none transition-all"
                      />
                   </div>
                 )}
              </div>

              <div className="pt-8 relative z-10">
                 <button 
                   onClick={setupMode ? handleSetup : handleCloudSync}
                   disabled={syncing}
                   className={`w-full py-6 rounded-[28px] font-black text-xl flex items-center justify-center gap-4 shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] ${setupMode ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-white text-slate-950 hover:bg-slate-100'}`}
                 >
                    {syncing ? <Loader2 className="animate-spin" /> : (setupMode ? <Zap size={24} /> : <RefreshCw size={24} />)}
                    {syncing ? "ORCHESTRATING..." : (setupMode ? "START NODE DEPLOYMENT" : "INITIALIZE CLOUD SYNC")}
                 </button>
              </div>
           </div>

           <div className="bg-slate-950 rounded-[40px] border border-slate-900 p-8 space-y-6">
              <div className="flex justify-between items-center">
                 <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Database size={14} className="text-indigo-500" />
                    Cloud Vault Directory
                 </h3>
                 <button className="text-[10px] font-bold text-indigo-500 hover:underline">Refresh Vault</button>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                 {[
                   { id: 'SCHOOL-ALPHA', date: 'Oct 24, 2026' },
                   { id: 'CITY-PORTAL', date: 'Oct 22, 2026' },
                   { id: 'LEADERS-ACAD', date: 'Oct 15, 2026' },
                 ].map((node) => (
                    <button 
                      key={node.id}
                      onClick={() => setNodeId(node.id)}
                      className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-left hover:border-indigo-500 transition-all group"
                    >
                       <div className="text-xs font-black text-white group-hover:text-indigo-400">{node.id}</div>
                       <div className="text-[9px] font-bold text-slate-600 uppercase mt-1">Synced {node.date}</div>
                    </button>
                 ))}
              </div>
           </div>

           <div className="bg-slate-950 rounded-[40px] border border-slate-900 p-8 space-y-6">
              <div className="flex justify-between items-center">
                 <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <RefreshCw size={14} />
                    Live Orchestration Logs
                 </h3>
                 <button onClick={() => setLog([])} className="text-[10px] font-bold text-indigo-500 hover:underline">Clear Logs</button>
              </div>
              <div className="font-mono text-xs space-y-2 h-40 overflow-y-auto custom-scrollbar">
                 {log.length === 0 && <div className="text-slate-700 italic">Waiting for orchestration command...</div>}
                 {log.map((entry, i) => (
                    <div key={i} className={entry.includes('SUCCESS') ? 'text-emerald-500' : entry.includes('FAILURE') ? 'text-rose-500' : 'text-slate-500'}>
                       {entry}
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Sidebar: Infrastructure Stats */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
           <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 rounded-[40px] p-8 text-white space-y-8 shadow-2xl relative overflow-hidden">
              <div className="absolute -bottom-8 -right-8 opacity-10">
                 <Lock size={160} />
              </div>
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-indigo-400">
                 <ShieldCheck size={28} />
              </div>
              <div className="space-y-4 relative z-10">
                 <h3 className="text-2xl font-bold">Wasabi Vault Info</h3>
                 <div className="space-y-4">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                       <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Region</div>
                       <div className="text-sm font-black tracking-tight">US-EAST-1 (Wasabi Sys)</div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                       <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Encryption Standard</div>
                       <div className="text-sm font-black tracking-tight">AES-256-GCM (Kernel Grade)</div>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-slate-900 rounded-[40px] p-8 border border-slate-800 space-y-8">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                 <Cpu size={20} className="text-indigo-500" />
                 Nexus Health Status
              </h3>
              <div className="space-y-6">
                 <div className="space-y-3">
                    <div className="flex justify-between text-xs font-bold">
                       <span className="text-slate-500 uppercase">S3 Connection Latency</span>
                       <span className="text-emerald-500">42ms</span>
                    </div>
                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-500 w-[90%]" />
                    </div>
                 </div>
                 
                 <div className="space-y-3">
                    <div className="flex justify-between text-xs font-bold">
                       <span className="text-slate-500 uppercase">Restoration Buffer</span>
                       <span className="text-amber-500">Optimized</span>
                    </div>
                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                       <div className="h-full bg-amber-500 w-[75%]" />
                    </div>
                 </div>
              </div>
              
              <div className="pt-4 border-t border-slate-800">
                 <div className="flex items-center gap-3 text-rose-500 group cursor-pointer">
                    <Unplug size={18} className="group-hover:animate-bounce" />
                    <span className="text-xs font-black uppercase tracking-widest">Emergency Disconnect</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
