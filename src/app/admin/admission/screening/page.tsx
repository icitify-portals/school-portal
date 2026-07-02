import { getApplicants } from "@/actions/admin-admission";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Search, Filter, Edit2, CheckCircle, XCircle, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
export default async function AdminScreeningPage() {
    const { success, applications, error } = await getApplicants();

    if (!success || !applications) {
        return <div className="p-6">Error: {error}</div>;
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
            <div className="max-w-[1600px] w-full mx-auto space-y-8">
                {/* Header Section */}
                <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-8 lg:p-12 text-white shadow-2xl border border-slate-800">
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-600/30 to-cyan-600/30 opacity-50 mix-blend-overlay" />
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <FileText className="w-12 h-12 text-teal-400" />
                                <h1 className="text-4xl lg:text-5xl font-black tracking-tighter drop-shadow-md italic uppercase">
                                    Post-UTME Screening
                                </h1>
                            </div>
                            <p className="text-slate-300 font-medium tracking-tight max-w-2xl text-lg opacity-90">
                                Review and score candidates for admission based on set criteria.
                            </p>
                        </div>
                        
                        <div className="flex bg-white/10 p-1.5 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner gap-2 flex-wrap">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                                <Input
                                    placeholder="Search candidates..."
                                    className="bg-black/20 border-white/10 text-white placeholder:text-white/50 pl-9 w-[250px] h-10 rounded-xl"
                                />
                            </div>
                            <button className="flex items-center gap-2 px-6 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap bg-teal-600 text-white hover:bg-teal-500 shadow-lg hover:-translate-y-1">
                                <Filter className="h-4 w-4" /> Filter
                            </button>
                        </div>
                    </div>
                </div>

            <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] overflow-hidden">
                <CardHeader className="bg-white/40 border-b border-white/20 p-8">
                    <CardTitle className="text-xl font-black text-slate-800 uppercase tracking-widest">Applicants List ({applications.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-b-slate-200/50">
                                <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-[10px] py-4 pl-8">Candidate</TableHead>
                                <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-[10px] py-4">JAMB Reg No</TableHead>
                                <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-[10px] py-4">Programme</TableHead>
                                <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-[10px] py-4">JAMB Score</TableHead>
                                <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-[10px] py-4">Screening Score</TableHead>
                                <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-[10px] py-4">Aggregate</TableHead>
                                <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-[10px] py-4">Status</TableHead>
                                <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-[10px] py-4 pr-8 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {applications.map((app) => (
                                <TableRow key={app.id} className="hover:bg-white/40 transition-colors border-b-slate-100">
                                    <TableCell className="font-bold text-slate-800 pl-8">
                                        {app.candidate?.surname}, {app.candidate?.firstname}
                                    </TableCell>
                                    <TableCell className="text-slate-600 font-medium">{app.jambRegNo}</TableCell>
                                    <TableCell className="text-slate-600 font-medium">{app.programme?.name}</TableCell>
                                    <TableCell className="text-slate-600 font-bold">{app.candidate?.score}</TableCell>
                                    <TableCell className="text-slate-600 font-bold">{app.screeningScore || "—"}</TableCell>
                                    <TableCell>
                                        <span className="font-black text-teal-600">
                                            {app.aggregateScore ? `${app.aggregateScore}%` : "—"}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn(
                                            "border-0 px-3 py-1 text-[9px] font-black uppercase tracking-widest",
                                            app.status === 'admitted' ? 'bg-emerald-100 text-emerald-700' :
                                                app.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                                        )}>
                                            {(app.status || 'pending')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right pr-8">
                                        <Link href={`/admin/admission/screening/${app.id}`}>
                                            <Button size="sm" variant="ghost" className="hover:bg-white/60 text-indigo-600 font-bold text-xs">
                                                <Edit2 className="h-4 w-4 mr-1" /> Score
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
        </div>
    );
}
