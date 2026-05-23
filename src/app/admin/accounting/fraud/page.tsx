
import { db } from "@/db/db";
import { 
    generalLedger, 
    chartOfAccounts, 
    transactions, 
    users 
} from "@/db/schema";
import { eq, sql, desc, count, and } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
    ShieldAlert, 
    CheckCircle2, 
    AlertTriangle, 
    Search,
    History,
    Activity,
    FileSearch,
    UserCircle
} from "lucide-react";

export default async function FraudAuditDashboard() {
    // 1. Detect Unbalanced Batches
    const unbalancedBatches = await db.execute(sql`
        SELECT batch_id, SUM(debit) as total_debit, SUM(credit) as total_credit, description
        FROM ${generalLedger}
        GROUP BY batch_id
        HAVING ABS(SUM(debit) - SUM(credit)) > 0.01
    `);

    // 2. Suspicious High-Value Transactions
    const highValueThreshold = 1000000; // 1M
    const highValueEntries = await db.select({
        id: generalLedger.id,
        description: generalLedger.description,
        debit: generalLedger.debit,
        credit: generalLedger.credit,
        date: generalLedger.transactionDate,
        batchId: generalLedger.batchId
    })
    .from(generalLedger)
    .where(sql`CAST(${generalLedger.debit} AS DECIMAL(10,2)) > ${highValueThreshold} OR CAST(${generalLedger.credit} AS DECIMAL(10,2)) > ${highValueThreshold}`)
    .orderBy(desc(generalLedger.transactionDate))
    .limit(10);

    // 3. User Activity Trends
    const activityLog = await db.select({
        count: count(),
        userName: users.name,
        role: users.role
    })
    .from(generalLedger)
    .innerJoin(users, eq(generalLedger.recordedBy, users.id))
    .groupBy(users.id)
    .orderBy(desc(count()));

    return (
        <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Audit & <span className="text-rose-600">Governance</span></h1>
                    <p className="text-slate-500 mt-1 italic">Real-time fraud detection and sessional financial auditing.</p>
                </div>
                <Badge className="bg-rose-50 text-rose-700 py-2 px-4 rounded-xl border-rose-100 shadow-sm flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" />
                    Security Level: High
                </Badge>
            </div>

            {/* Critical Alerts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Unbalanced Batches */}
                <Card className="border-none shadow-xl shadow-rose-500/5 rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="bg-rose-50/50 border-b border-rose-100 pb-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="text-rose-900 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5" />
                                    Unbalanced Journals
                                </CardTitle>
                                <CardDescription className="text-rose-600 font-medium">Critical IFRS violations detected.</CardDescription>
                            </div>
                            <Badge className="bg-rose-600 text-white">{(unbalancedBatches as any[]).length} Alerts</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-rose-50">
                            {(unbalancedBatches as any[]).map((batch, idx) => (
                                <div key={idx} className="p-6 flex justify-between items-center hover:bg-rose-50/20 transition-colors">
                                    <div className="space-y-1">
                                        <p className="text-sm font-black text-slate-900">{batch.description || "System Transaction"}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{batch.batch_id}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-rose-600 font-black">Diff: ₦{Math.abs(batch.total_debit - batch.total_credit).toLocaleString()}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Action Required</p>
                                    </div>
                                </div>
                            ))}
                            {(unbalancedBatches as any[]).length === 0 && (
                                <div className="p-12 text-center">
                                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                                    <p className="text-slate-500 font-bold">No unbalanced journals found. Your ledger is healthy.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* High Value Monitor */}
                <Card className="border-none shadow-xl shadow-indigo-500/5 rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="bg-indigo-50/50 border-b border-indigo-100 pb-6">
                        <CardTitle className="text-indigo-900 flex items-center gap-2">
                            <Activity className="w-5 h-5" />
                            High-Value Entries
                        </CardTitle>
                        <CardDescription className="text-indigo-600 font-medium">Monitoring transactions {'>'} ₦{highValueThreshold.toLocaleString()}.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-indigo-50">
                            {highValueEntries.map((entry, idx) => (
                                <div key={idx} className="p-6 flex justify-between items-center hover:bg-indigo-50/20 transition-colors">
                                    <div className="space-y-1">
                                        <p className="text-sm font-black text-slate-900 truncate max-w-[200px]">{entry.description}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(entry.date!).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-indigo-600 font-black">₦{Math.max(parseFloat(entry.debit || "0"), parseFloat(entry.credit || "0")).toLocaleString()}</p>
                                        <Badge className="bg-white border-indigo-100 text-indigo-500 text-[8px] px-2">Verify</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Audit Trail & Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* User Activity Ranking */}
                <Card className="lg:col-span-1 border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem]">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <UserCircle className="w-5 h-5 text-indigo-500" />
                            Active Recorders
                        </CardTitle>
                        <CardDescription>Ledger entry volume per staff member.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {activityLog.map((log, idx) => (
                            <div key={idx} className="flex items-center gap-4 group">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                    {log.userName?.[0]}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-900">{log.userName}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">{log.role}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-black text-indigo-600">{log.count}</p>
                                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Entries</p>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* System Integrity Log (Mock / Placeholder for more complex rules) */}
                <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] bg-white">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <FileSearch className="w-5 h-5 text-indigo-500" />
                            Session Integrity Log
                        </CardTitle>
                        <CardDescription>Automated system checks for IFRS compliance.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[
                                { rule: "Account Code Uniqueness", status: "Pass", desc: "No duplicate COA codes detected." },
                                { rule: "Closing Date Verification", status: "Pass", desc: "All transactions are within active session dates." },
                                { rule: "Null Reference Check", status: "Warning", desc: "14 transactions missing reference numbers." },
                                { rule: "Duplicate Transaction Check", status: "Pass", desc: "No exact duplicate entries found in last 48 hours." },
                            ].map((rule, idx) => (
                                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center group hover:border-indigo-200 transition-all">
                                    <div className="space-y-1">
                                        <p className="text-sm font-black text-slate-900">{rule.rule}</p>
                                        <p className="text-xs text-slate-500 font-medium">{rule.desc}</p>
                                    </div>
                                    <Badge className={`
                                        ${rule.status === 'Pass' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}
                                        border-none px-4 py-1.5 rounded-lg font-black text-xs
                                    `}>
                                        {rule.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
