"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { seedDatabase, clearDatabase } from "@/actions/seed-system";
import { Loader2, Database, Trash2, CheckCircle, AlertTriangle, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DeveloperSettingsPage() {
    const [loading, setLoading] = useState(false);
    const [actionType, setActionType] = useState<"seed" | "clear" | null>(null);
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    const handleAction = async (type: "seed" | "clear") => {
        if (type === "clear" && !confirm("WARNING: This will delete seeded transactional data. Are you sure?")) return;

        setLoading(true);
        setActionType(type);
        setLogs([]);
        addLog(`Starting ${type} operation...`);

        try {
            const action = type === "seed" ? seedDatabase : clearDatabase;
            const res = await action();

            if (res.success) {
                addLog("Operation completed successfully.");
                addLog(res.message || "Done.");
            } else {
                addLog("Operation failed.");
                addLog("Error: " + (res.error || "Unknown error"));
            }
        } catch (error: any) {
            addLog("System Error: " + error.message);
        }

        setLoading(false);
        setActionType(null);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Developer Tools</h1>
                <p className="text-slate-500">Manage database state and system configurations.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* API Auth Card */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 mb-2">
                        <Database className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg">API Authentication</h3>
                    <p className="text-sm text-slate-500">
                        The Portal API uses Bearer Tokens for authentication.
                        Manage your API keys using the <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">PORTAL_API_KEYS</code> env variable.
                    </p>
                    <div className="p-3 bg-slate-900 rounded-lg overflow-x-auto text-xs font-mono text-green-400">
                        curl -X GET \<br/>
                        &nbsp;&nbsp;https://portal.example.com/api/v1/students \<br/>
                        &nbsp;&nbsp;-H 'Authorization: Bearer YOUR_API_KEY'
                    </div>
                </div>

                {/* API Endpoints Card */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-800 text-lg">Available Endpoints</h3>
                    <div className="space-y-3">
                        <div className="pb-3 border-b border-slate-100">
                            <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-black uppercase rounded mb-1">GET</span>
                            <code className="text-xs font-bold text-slate-700 ml-2">/api/v1/students</code>
                            <p className="text-[11px] text-slate-500 mt-1">Filters: page, limit, search, department_id, level, status</p>
                        </div>
                        <div className="pb-3 border-b border-slate-100">
                            <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-black uppercase rounded mb-1">GET</span>
                            <code className="text-xs font-bold text-slate-700 ml-2">/api/v1/courses</code>
                            <p className="text-[11px] text-slate-500 mt-1">Filters: page, limit, department_id, semester, level</p>
                        </div>
                        <div>
                            <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-black uppercase rounded mb-1">GET</span>
                            <code className="text-xs font-bold text-slate-700 ml-2">/api/v1/results</code>
                            <p className="text-[11px] text-slate-500 mt-1">Filters: page, limit, student_id, enrollment_id, status</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Seeding Card */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 mb-2">
                        <Database className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg">Database Seeding</h3>
                    <p className="text-sm text-slate-500">
                        Populate the database with comprehensive sample data for testing.
                        Includes: Units, Faculties, Users, LMS Content, HR Records, and Finance.
                    </p>
                    <div className="pt-2">
                        <Button
                            onClick={() => handleAction("seed")}
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700"
                        >
                            {loading && actionType === "seed" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                            Seed Database
                        </Button>
                    </div>
                </div>

                {/* Clearing Card */}
                <div className="bg-white p-6 rounded-xl border border-red-200 shadow-sm space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <ShieldAlert className="w-32 h-32 text-red-600" />
                    </div>
                    <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center text-red-600 mb-2">
                        <Trash2 className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg">Clear Test Data</h3>
                    <p className="text-sm text-slate-500">
                        Remove all seeded transactional data (Students, Leaves, Lessons, etc.).
                        <strong className="text-red-600 block mt-1">Warning: This action is destructive.</strong>
                    </p>
                    <div className="pt-2">
                        <Button
                            onClick={() => handleAction("clear")}
                            disabled={loading}
                            variant="danger"
                            className="w-full"
                        >
                            {loading && actionType === "clear" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
                            Clear Database
                        </Button>
                    </div>
                </div>
            </div>

            {/* Logs Console */}
            <div className="bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-800">
                <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex justify-between items-center">
                    <span className="text-xs font-mono text-slate-400">Execution Log</span>
                    {loading && <span className="flex items-center gap-2 text-xs text-indigo-400"><Loader2 className="w-3 h-3 animate-spin" /> Processing...</span>}
                </div>
                <div className="p-4 font-mono text-xs md:text-sm h-[300px] overflow-y-auto space-y-1">
                    {logs.length === 0 && (
                        <div className="h-full flex items-center justify-center text-slate-600 italic">
                            Waiting for command...
                        </div>
                    )}
                    {logs.map((log, i) => (
                        <div key={i} className={cn(
                            "break-all",
                            log.includes("Error") ? "text-red-400" :
                                log.includes("Success") ? "text-green-400" : "text-slate-300"
                        )}>
                            {log}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
