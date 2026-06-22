
import { db } from "@/db/db";
import { students, parentStudentMappings, feeAllocations, feeStructureItems, feeItems, studentLedger } from "@/db/schema";
import { auth } from "@/auth";
import { eq, and, sql } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
    Wallet, 
    CreditCard, 
    History, 
    FileText, 
    ChevronLeft, 
    ArrowUpRight,
    ArrowDownRight,
    Download,
    Printer,
    CheckCircle2,
    Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";

export default async function ParentChildFinancialPage({ params }: { params: { id: string } }) {
    const sessionToken = await auth();
    if (!sessionToken?.user?.id) redirect("/login");

    const parentId = parseInt(sessionToken.user.id);
    const studentId = parseInt(params.id);

    // 1. Verify Parent-Student Mapping
    const [mapping] = await db.select().from(parentStudentMappings)
        .where(and(eq(parentStudentMappings.parentId, parentId), eq(parentStudentMappings.studentId, studentId)))
        .limit(1);

    if (!mapping) return <div className="p-12 text-center font-black text-rose-500 uppercase">Unauthorized</div>;

    const [student] = await db.select().from(students).where(eq(students.id, studentId)).limit(1);

    // 2. Fetch Fee Items (Invoices)
    const fees = await db.select({
        item: feeItems,
        amount: feeStructureItems.amount
    })
    .from(feeAllocations)
    .innerJoin(feeStructureItems, eq(feeAllocations.feeStructureId, feeStructureItems.feeStructureId))
    .innerJoin(feeItems, eq(feeStructureItems.feeItemId, feeItems.id))
    .where(eq(feeAllocations.studentId, studentId));

    // 3. Fetch Payment History
    const payments = await db.select()
        .from(studentLedger)
        .where(eq(studentLedger.studentId, studentId))
        .limit(10);
    
    // In a real system, we'd calculate balance properly. For demo, we sum.
    const totalInvoiced = fees.reduce((acc, f) => acc + parseFloat(f.amount || "0"), 0);
    const totalPaid = payments.reduce((acc, p) => acc + parseFloat(p.credit || "0"), 0);
    const balance = totalInvoiced - totalPaid;

    return (
        <div className="p-8 max-w-[1600px] w-full mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                    <Link href={`/parent/child/${studentId}`} className="text-indigo-600 flex items-center gap-1 text-xs font-black uppercase tracking-widest hover:gap-2 transition-all">
                        <ChevronLeft className="w-4 h-4" /> Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Financial <span className="text-indigo-600">Statement</span></h1>
                    <p className="text-slate-500 font-medium">Billing history and payment tracking for {student.matricNumber}.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="h-12 px-6 rounded-2xl border-2 font-black uppercase tracking-widest text-[10px] gap-2">
                        <Download className="w-4 h-4" /> Export Statement
                    </Button>
                    <Button className="h-12 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200 font-black uppercase tracking-widest text-[10px] gap-2">
                        <CreditCard className="w-4 h-4" /> Pay Online
                    </Button>
                </div>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-white overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform">
                        <Wallet className="w-32 h-32" />
                    </div>
                    <CardContent className="p-10 space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Balance</p>
                        <h2 className="text-5xl font-black text-slate-900 tracking-tighter italic">{settings?.base_currency || '₦'}{balance.toLocaleString()}</h2>
                        <div className="flex items-center gap-2">
                            <Badge className={cn("rounded-lg", balance > 0 ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600")}>
                                {balance > 0 ? "Outstanding" : "Cleared"}
                            </Badge>
                            <span className="text-[10px] font-bold text-slate-400">Updated just now</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-indigo-900 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <ArrowUpRight className="w-32 h-32 text-white" />
                    </div>
                    <CardContent className="p-10 space-y-4 text-white">
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Total Invoiced</p>
                        <h2 className="text-4xl font-black tracking-tighter">{settings?.base_currency || '₦'}{totalInvoiced.toLocaleString()}</h2>
                        <p className="text-[10px] font-medium text-indigo-400">Total fees allocated for this session</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-emerald-600 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <ArrowDownRight className="w-32 h-32 text-white" />
                    </div>
                    <CardContent className="p-10 space-y-4 text-white">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-200">Total Paid</p>
                        <h2 className="text-4xl font-black tracking-tighter">{settings?.base_currency || '₦'}{totalPaid.toLocaleString()}</h2>
                        <p className="text-[10px] font-medium text-emerald-100">Confirmed sessional payments</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Active Invoices */}
                <Card className="border-none shadow-2xl shadow-indigo-500/5 rounded-[2.5rem] bg-white overflow-hidden flex flex-col">
                    <CardHeader className="p-8 border-b border-slate-50 flex-row justify-between items-center space-y-0">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                                <FileText className="w-5 h-5" />
                            </div>
                            <CardTitle className="text-lg font-black uppercase tracking-tight">Active Invoices</CardTitle>
                        </div>
                        <Printer className="w-5 h-5 text-slate-300 hover:text-indigo-600 cursor-pointer transition-colors" />
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-50">
                            {fees.map((fee, idx) => (
                                <div key={idx} className="p-6 flex items-center justify-between group hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-indigo-600 transition-colors">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900">{fee.item.name}</h4>
                                            <p className="text-[10px] font-black uppercase text-slate-400">{fee.item.category}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-slate-900">{settings?.base_currency || '₦'}{parseFloat(fee.amount || "0").toLocaleString()}</p>
                                        <Badge variant="secondary" className="text-[8px] font-black text-emerald-600 uppercase">Mandatory</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Payments */}
                <Card className="border-none shadow-2xl shadow-indigo-500/5 rounded-[2.5rem] bg-white overflow-hidden flex flex-col">
                    <CardHeader className="p-8 border-b border-slate-50 flex-row justify-between items-center space-y-0">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                                <History className="w-5 h-5" />
                            </div>
                            <CardTitle className="text-lg font-black uppercase tracking-tight">Recent Payments</CardTitle>
                        </div>
                        <Badge className="bg-emerald-50 text-emerald-700 border-none rounded-lg px-3 py-1 font-black uppercase text-[10px]">History</Badge>
                    </CardHeader>
                    <CardContent className="p-0 flex-1">
                        {payments.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-50">
                                <Clock className="w-12 h-12 mb-4" />
                                <p className="text-xs font-black uppercase tracking-widest">No payments recorded</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {payments.map((p, idx) => (
                                    <div key={idx} className="p-6 flex items-center justify-between hover:bg-emerald-50/30 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                                                <CheckCircle2 className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900">Online Remittance</h4>
                                                <p className="text-[10px] font-black uppercase text-slate-400">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "N/A"}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-emerald-600">{settings?.base_currency || '₦'}{parseFloat(p.credit || "0").toLocaleString()}</p>
                                            <span className="text-[8px] font-black uppercase text-slate-400">TXN_ID_{p.id}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
