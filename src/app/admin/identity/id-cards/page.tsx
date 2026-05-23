import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getAllIDCardsAction, revokeIDCardAction } from "@/actions/id-cards";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldAlert, Search, Filter, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function AdminIDCardManagementPage() {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== 'admin') {
        redirect("/login");
    }

    const cards = await getAllIDCardsAction();

    return (
        <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase italic">Credential Registry</h1>
                    <p className="text-slate-500 font-medium tracking-tight">ICT Unit management dashboard for official identity cards.</p>
                </div>
                <div className="flex gap-4">
                    <Card className="bg-white border-none shadow-sm px-6 py-4 flex items-center gap-4 rounded-2xl">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                            <ShieldCheck className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Issued</p>
                            <p className="text-xl font-black text-slate-900">{cards.length}</p>
                        </div>
                    </Card>
                </div>
            </div>

            <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
                <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between space-y-0">
                    <div>
                        <CardTitle className="text-xl font-black uppercase italic tracking-tight">Issued ID Cards</CardTitle>
                        <CardDescription className="text-slate-400 font-medium tracking-tight">Real-time repository of all student and staff credentials.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="rounded-xl border-slate-100 h-11 px-6 font-black uppercase text-[10px] tracking-widest gap-2">
                            <Filter className="w-4 h-4" /> Filter
                        </Button>
                        <Button className="rounded-xl bg-slate-900 h-11 px-6 font-black uppercase text-[10px] tracking-widest gap-2">
                            <Search className="w-4 h-4" /> Search
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="hover:bg-transparent border-slate-50">
                                <TableHead className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Issue ID</TableHead>
                                <TableHead className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">User</TableHead>
                                <TableHead className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</TableHead>
                                <TableHead className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identifier</TableHead>
                                <TableHead className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</TableHead>
                                <TableHead className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Issued On</TableHead>
                                <TableHead className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {cards.map((c) => (
                                <TableRow key={c.id} className="hover:bg-slate-50/50 transition-all border-slate-50">
                                    <TableCell className="px-8 py-6 font-black text-slate-900 text-xs tracking-tighter">
                                        {c.issueId}
                                    </TableCell>
                                    <TableCell className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-slate-900 italic tracking-tight">{c.userName}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{c.userId} (UID)</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-8 py-6">
                                        <Badge variant="outline" className={`rounded-lg font-black uppercase text-[9px] tracking-widest py-1 px-2.5 ${c.userType === 'student' ? 'text-indigo-600 bg-indigo-50 border-indigo-100' : 'text-slate-600 bg-slate-50 border-slate-100'}`}>
                                            {c.userType}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="px-8 py-6 font-bold text-slate-600 text-xs">
                                        {c.identifier}
                                    </TableCell>
                                    <TableCell className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${c.status === 'active' ? 'bg-emerald-500 animate-pulse' : c.status === 'revoked' ? 'bg-red-500' : 'bg-slate-300'}`} />
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${c.status === 'active' ? 'text-emerald-600' : c.status === 'revoked' ? 'text-red-600' : 'text-slate-400'}`}>
                                                {c.status}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-8 py-6 text-xs text-slate-500 font-medium">
                                        {new Date(c.issuedAt!).toLocaleDateString('en-GB')}
                                    </TableCell>
                                    <TableCell className="px-8 py-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Link href={`/verify/id/${c.verificationCode}`} target="_blank">
                                                <Button size="icon" variant="ghost" className="h-9 w-9 bg-slate-50 hover:bg-white hover:shadow-md transition-all rounded-xl">
                                                    <ExternalLink className="w-4 h-4 text-slate-400" />
                                                </Button>
                                            </Link>
                                            {c.status === 'active' && (
                                                <form action={async () => {
                                                    "use server";
                                                    await revokeIDCardAction(c.id);
                                                }}>
                                                    <Button size="icon" variant="ghost" className="h-9 w-9 bg-red-50 hover:bg-red-600 group transition-all rounded-xl border border-red-100">
                                                        <Trash2 className="w-4 h-4 text-red-500 group-hover:text-white" />
                                                    </Button>
                                                </form>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {cards.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="px-8 py-20 text-center">
                                        <ShieldAlert className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                                        <p className="text-sm font-black text-slate-400 uppercase italic">No ID cards issued yet</p>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
