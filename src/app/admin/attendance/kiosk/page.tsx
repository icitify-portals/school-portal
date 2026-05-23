"use client";

import GateKiosk from "@/components/attendance/GateKiosk";
import { ShieldCheck, LogIn, LogOut, Clock } from "lucide-react";

export default function KioskPage() {
    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 space-y-12">
            <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-full shadow-lg shadow-blue-200">
                    <ShieldCheck className="w-5 h-5" />
                    <span className="font-black uppercase tracking-widest text-xs">Secure Gate Entry</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-black text-slate-900 italic uppercase tracking-tight">
                    Smart <span className="text-blue-600 underline decoration-8 decoration-blue-100 underline-offset-8">Attendance</span> Hub
                </h1>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Main Campus Entrance • Identity Verification Live</p>
            </div>

            <GateKiosk />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">
                <div className="flex items-center gap-4 bg-white p-6 rounded-[2rem] shadow-xl border border-slate-50">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <LogIn className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Step 1</p>
                        <p className="font-bold text-slate-900">Scan QR Code</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 bg-white p-6 rounded-[2rem] shadow-xl border border-slate-50">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Step 2</p>
                        <p className="font-bold text-slate-900">Wait for Confirmation</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 bg-white p-6 rounded-[2rem] shadow-xl border border-slate-50">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <LogOut className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Step 3</p>
                        <p className="font-bold text-slate-900">Proceed to Entry</p>
                    </div>
                </div>
            </div>

            <div className="text-center space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                    Parents receive instant check-in/out notifications via email
                </p>
                <div className="flex items-center justify-center gap-4 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all cursor-default">
                    <div className="w-24 h-8 bg-slate-200 rounded-lg" />
                    <div className="w-24 h-8 bg-slate-200 rounded-lg" />
                    <div className="w-24 h-8 bg-slate-200 rounded-lg" />
                </div>
            </div>
        </div>
    );
}
