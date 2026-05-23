"use client";

import React, { useEffect, useRef } from 'react';
import { Terminal, ShieldAlert, Square, Play, Trash2, Loader2 } from 'lucide-react';
import { useWebsocketTerminal } from '@/hooks/useWebsocketTerminal';

interface SystemTerminalProps {
    onReady?: (run: (args: string[]) => void) => void;
}

export default function SystemTerminal({ onReady }: SystemTerminalProps) {
  const { 
    connect, 
    isConnected, 
    output, 
    runCommand, 
    terminateProcess, 
    activeProcess,
    clearOutput 
  } = useWebsocketTerminal();
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    connect("wss://localhost:8087"); // Institutional Default
  }, [connect]);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [output]);

  useEffect(() => {
    if (isConnected && onReady) {
        onReady((args: string[]) => runCommand("2.4.0", args));
    }
  }, [isConnected, onReady, runCommand]);

  return (
    <div className="bg-slate-950 rounded-[40px] border border-slate-800 text-slate-300 shadow-2xl flex flex-col h-[500px] overflow-hidden">
        {/* Terminal Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-widest">
                    <Terminal size={18} className="text-emerald-500" />
                    Institutional Kernel Console
                </h3>
            </div>
            
            <div className="flex items-center gap-3">
                {activeProcess && (
                    <button 
                        onClick={terminateProcess}
                        className="flex items-center gap-2 px-4 py-1.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-lg text-[10px] font-black uppercase hover:bg-rose-500 hover:text-white transition-all"
                    >
                        <Square size={12} fill="currentColor" />
                        Kill PID: {activeProcess.pid}
                    </button>
                )}
                <button 
                    onClick={clearOutput}
                    className="p-1.5 text-slate-500 hover:text-white transition-colors"
                    title="Clear Buffer"
                >
                    <Trash2 size={16} />
                </button>
                <div className="flex gap-1.5 ml-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                </div>
            </div>
        </div>

        {/* Console Buffer */}
        <div 
            ref={scrollRef}
            className="flex-1 p-8 font-mono text-xs overflow-y-auto space-y-1.5 custom-scrollbar selection:bg-emerald-500/30"
        >
            {!isConnected && (
                <div className="flex items-center gap-3 text-rose-500 bg-rose-500/5 p-4 rounded-2xl border border-rose-500/10">
                    <ShieldAlert size={20} />
                    <span className="font-bold">Gateway Offline: Institutional WebSocket (Port 8087) is unreachable.</span>
                </div>
            )}

            {output.map((line, i) => (
                <div key={i} className={`flex gap-4 group ${
                    line.type === 'Error' ? 'text-rose-400 bg-rose-400/5 p-1 rounded' : 
                    line.pipe === 'StdErr' ? 'text-amber-400' : 'text-slate-300'
                }`}>
                    <span className="text-slate-700 shrink-0 select-none">[{new Date(line.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                    <span className="whitespace-pre-wrap leading-relaxed">
                        {line.type === 'Data' ? (
                            <>
                                <span className="text-emerald-500 mr-2">➜</span>
                                {line.message}
                            </>
                        ) : line.type === 'Complete' ? (
                            <span className="text-emerald-500 font-bold">✓ Institutional process completed successfully.</span>
                        ) : line.type === 'Error' ? (
                            <span className="font-bold underline">SECURITY ERROR: {line.message}</span>
                        ) : line.message}
                    </span>
                </div>
            ))}
            
            {activeProcess && (
                <div className="flex items-center gap-2 text-emerald-500 mt-4 animate-pulse">
                    <Loader2 size={14} className="animate-spin" />
                    <span className="font-black uppercase tracking-[0.2em] text-[10px]">Kernel Streaming active...</span>
                </div>
            )}
        </div>

        {/* Terminal Footer */}
        <div className="px-8 py-4 border-t border-slate-800 bg-slate-900/30 flex justify-between items-center">
            <div className="flex gap-6">
                <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-slate-500 uppercase">Gateway</span>
                    <span className="text-[10px] font-black text-emerald-500">WSS://PORTAL-WS:8087</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-slate-500 uppercase">Buffer</span>
                    <span className="text-[10px] font-black text-slate-400">{output.length} LINES</span>
                </div>
            </div>
            <div className="text-[10px] font-black text-slate-600 flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                {isConnected ? 'LIVE SYNC ACTIVE' : 'KERNEL DISCONNECTED'}
            </div>
        </div>
    </div>
  );
}
