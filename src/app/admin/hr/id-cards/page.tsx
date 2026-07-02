import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getAllIDCardsAction, revokeIDCardAction } from "@/actions/id-cards";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldAlert, Search, Filter, Trash2, ExternalLink, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function HRIDCardManagementPage() {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== 'admin') {
        redirect("/login");
    }

    const cards = await getAllIDCardsAction();

    return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-transparent">
      <div className="max-w-[1600px] w-full mx-auto space-y-10 text-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 text-white rounded-[3rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden border border-slate-800">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-650/30 to-indigo-600/30 opacity-50 mix-blend-overlay" />
            <div className="relative z-10 flex-1">
                <div className="flex items-center gap-4 mb-2">
                    <ShieldCheck className="w-12 h-12 text-indigo-400 drop-shadow-md" />
                    <h2 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase italic drop-shadow-md">
                        Credential Registry
                    </h2>
                </div>
                <p className="text-slate-300 font-medium mt-1 uppercase text-sm tracking-wide opacity-90">
                    Human Resources management dashboard for official identity cards
                </p>
            </div>
            
            <div className="relative z-10 w-full md:w-auto shrink-0 flex gap-4">
                <Card className="bg-white/10 backdrop-blur-md border border-white/10 px-8 py-5 flex items-center gap-4 rounded-[2rem] shadow-lg">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <Briefcase className="w-6 h-6 text-indigo-350" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Total Active</p>
                        <p className="text-2xl font-black text-white leading-none">{cards.filter(c => c.status === 'active').length}</p>
                    </div>
                </Card>
            </div>
        </div>

        <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] overflow-hidden">
            <CardHeader className="p-8 lg:p-10 border-b border-white/40 bg-white/40">
                <CardTitle className="text-2xl font-black text-slate-900 italic tracking-tight uppercase">Institutional Credentials</CardTitle>
                <CardDescription className="text-slate-500 font-bold uppercase tracking-wider text-xs">Official staff and student identification records managed by HR.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-white/40 bg-slate-900 text-white">
                                <TableHead className="px-8 py-6 text-[10px] font-extrabold uppercase tracking-widest text-white">Issue ID</TableHead>
                                <TableHead className="px-8 py-6 text-[10px] font-extrabold uppercase tracking-widest text-white">User</TableHead>
                                <TableHead className="px-8 py-6 text-[10px] font-extrabold uppercase tracking-widest text-white">Type</TableHead>
                                <TableHead className="px-8 py-6 text-[10px] font-extrabold uppercase tracking-widest text-white">Identifier</TableHead>
                                <TableHead className="px-8 py-6 text-[10px] font-extrabold uppercase tracking-widest text-white">Status</TableHead>
                                <TableHead className="px-8 py-6 text-[10px] font-extrabold uppercase tracking-widest text-white">Issued On</TableHead>
                                <TableHead className="px-8 py-6 text-right text-[10px] font-extrabold uppercase tracking-widest text-white">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-white/40 bg-white/20">
                            {cards.map((c) => (
                                <TableRow key={c.id} className="hover:bg-white/40 transition-colors border-white/40">
                                    <TableCell className="px-8 py-6 font-black text-slate-900 text-sm font-mono">
                                        {c.issueId}
                                    </TableCell>
                                    <TableCell className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-base font-black text-slate-800 uppercase tracking-tight">{c.userName}</span>
                                            <span className="text-[10px] font-bold text-slate-400 font-mono mt-0.5">{c.userId}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-8 py-6">
                                        <Badge variant="outline" className={`rounded-xl font-black uppercase text-[9px] tracking-wider py-1 px-3 border shadow-sm ${c.userType === 'student' ? 'text-indigo-700 bg-indigo-100 border-indigo-200' : 'text-slate-700 bg-slate-100 border-slate-200'}`}>
                                            {c.userType}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="px-8 py-6 font-bold text-slate-655 font-mono text-xs">
                                        {c.identifier}
                                    </TableCell>
                                    <TableCell className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2.5 h-2.5 rounded-full ${c.status === 'active' ? 'bg-emerald-500 animate-pulse' : c.status === 'revoked' ? 'bg-rose-500' : 'bg-slate-355'}`} />
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${c.status === 'active' ? 'text-emerald-600' : c.status === 'revoked' ? 'text-rose-655' : 'text-slate-400'}`}>
                                                {c.status}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-8 py-6 text-sm font-bold text-slate-500 font-mono">
                                        {new Date(c.issuedAt!).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </TableCell>
                                    <TableCell className="px-8 py-6 text-right">
                                        <div className="flex justify-end gap-3">
                                            <Link href={`/verify/id/${c.verificationCode}`} target="_blank">
                                                <Button size="icon" variant="ghost" className="h-10 w-10 bg-white/60 hover:bg-white hover:shadow-md border border-white/60 transition-all rounded-xl">
                                                    <ExternalLink className="w-4 h-4 text-slate-500" />
                                                </Button>
                                            </Link>
                                            {c.status === 'active' && (
                                                <form action={async () => {
                                                    "use server";
                                                    await revokeIDCardAction(c.id);
                                                }}>
                                                    <Button size="icon" variant="ghost" className="h-10 w-10 bg-rose-50/50 hover:bg-rose-600 group transition-all rounded-xl border border-rose-100 hover:shadow-lg hover:shadow-rose-100">
                                                        <Trash2 className="w-4 h-4 text-rose-500 group-hover:text-white" />
                                                    </Button>
                                                </form>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {cards.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="px-8 py-24 text-center">
                                        <ShieldAlert className="w-16 h-16 text-slate-350 mx-auto mb-4 animate-bounce" />
                                        <h4 className="text-xl font-black text-slate-800 italic uppercase">No credentials issued</h4>
                                        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-2">ID cards will appear here once generated by users.</p>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
