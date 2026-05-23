"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { seedSampleStudents } from "@/actions/seed-students";
import { seedLawStudents } from "@/actions/seed-law-students";
import { seedProperTestStudents } from "@/actions/seed-proper-students";
import { seedDatabase } from "@/actions/seed-system";
import { toast } from "sonner";
import { UserPlus, Loader2 } from "lucide-react";

export function StudentSeeder() {
    const [loading, setLoading] = useState(false);
    const [sysLoading, setSysLoading] = useState(false);

    const handleSeed = async () => {
        setLoading(true);
        const res = await seedSampleStudents();
        if (res.success) {
            toast.success(res.message);
        } else {
            toast.error(res.error || "Failed to seed students");
        }
        setLoading(false);
    };

    const handleLawSeed = async () => {
        setLoading(true);
        const res = await seedLawStudents();
        if (res.success) {
            toast.success(res.message);
        } else {
            toast.error(res.error || "Failed to seed Law students");
        }
        setLoading(false);
    };

    const handleProperSeed = async () => {
        setLoading(true);
        const res = await seedProperTestStudents();
        if (res.success) {
            toast.success(res.message);
        } else {
            toast.error(res.error || "Failed to seed proper students");
        }
        setLoading(false);
    };

    const handleSystemSeed = async () => {
        setSysLoading(true);
        const res = await seedDatabase();
        if (res.success) {
            toast.success("System data seeded successfully!");
        } else {
            toast.error(res.error || "Failed to seed system data");
        }
        setSysLoading(false);
    };

    return (
        <div className="p-8 bg-slate-900 rounded-[2.5rem] border border-slate-800 text-white flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative group">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full" />
            <div className="flex gap-6 items-center">
                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xl shadow-blue-500/20">
                    <UserPlus className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                    <h4 className="font-black uppercase text-xs tracking-widest text-blue-400">Testing Tools</h4>
                    <p className="text-xl font-black italic uppercase tracking-tight">Need test data?</p>
                    <p className="text-xs font-bold text-slate-400 max-w-sm leading-relaxed">
                        Generate 10 sample students and enroll them in CSC 101 to test the attendance system live.
                    </p>
                </div>
            </div>
            <div className="flex gap-4">
                <Button
                    onClick={handleSystemSeed}
                    disabled={sysLoading || loading}
                    className="bg-slate-800 text-white hover:bg-slate-700 font-bold uppercase tracking-widest text-[10px] px-6 h-14 rounded-2xl border border-slate-700 transition-all"
                >
                    {sysLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "1. Seed System Data"}
                </Button>
                <Button
                    onClick={handleSeed}
                    disabled={loading || sysLoading}
                    className="bg-white text-slate-900 hover:bg-blue-50 font-black uppercase tracking-widest text-[10px] px-6 h-14 rounded-2xl shadow-lg shrink-0 transition-all hover:scale-105 active:scale-95"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "2. CSC Students"}
                </Button>
                <Button
                    onClick={handleLawSeed}
                    disabled={loading || sysLoading}
                    className="bg-blue-600 text-white hover:bg-blue-500 font-black uppercase tracking-widest text-[10px] px-6 h-14 rounded-2xl shadow-lg shrink-0 transition-all hover:scale-105 active:scale-95"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "3. Law Students"}
                </Button>
                <Button
                    onClick={handleProperSeed}
                    disabled={loading || sysLoading}
                    className="bg-emerald-600 text-white hover:bg-emerald-500 font-black uppercase tracking-widest text-[10px] px-6 h-14 rounded-2xl shadow-lg shrink-0 transition-all hover:scale-105 active:scale-95"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "4. Large Test Set (50+)"}
                </Button>
            </div>
        </div>
    );
}
