
import { getAdmissionSessions } from "@/actions/admission-session";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Plus, Settings, Calendar, CreditCard, Activity } from "lucide-react";
import { format } from "date-fns";

export default async function AdmissionSessionsPage() {
    const { success, sessions, error } = await getAdmissionSessions();

    if (!success || !sessions) {
        return <div className="p-6">Error: {error}</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                    <Activity className="h-8 w-8 text-indigo-600" />
                    Admission Cycles
                </h1>
                <Link href="/admin/admission/sessions/new/settings">
                    <Button className="bg-indigo-600 hover:bg-indigo-700">
                        <Plus className="mr-2 h-4 w-4" /> New Admission Session
                    </Button>
                </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="bg-indigo-50 border-indigo-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-indigo-600 uppercase tracking-wider">Total Cycles</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-indigo-900">{sessions.length}</div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-50 border-emerald-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-600 uppercase tracking-wider">Active Cycles</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-emerald-900">{sessions.filter(s => s.isActive).length}</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="overflow-hidden border-slate-200">
                <CardHeader className="bg-slate-50 border-b border-slate-200">
                    <CardTitle className="text-lg text-slate-700 font-semibold">Configured Sessions</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow>
                                <TableHead className="w-[300px]">Session Name</TableHead>
                                <TableHead>Window (Start - End)</TableHead>
                                <TableHead>Application Fee</TableHead>
                                <TableHead>Mode</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right px-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sessions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-slate-500 italic">
                                        No admission cycles configured yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sessions.map((session) => (
                                    <TableRow key={session.id} className="hover:bg-slate-50 transition-colors">
                                        <TableCell className="font-semibold text-slate-900">
                                            {session.name}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-slate-600 text-sm">
                                                <Calendar className="h-3.5 w-3.5" />
                                                {format(new Date(session.startDate), 'MMM d, yyyy')} - {format(new Date(session.endDate), 'MMM d, yyyy')}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 font-medium text-slate-900">
                                                <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                                                {settings?.base_currency || '₦'}{Number(session.applicationFee).toLocaleString()}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                {session.screeningMode}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={session.isActive ? "default" : "secondary"} className={session.isActive ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-200 text-slate-600"}>
                                                {session.isActive ? "ACTIVE" : "INACTIVE"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right px-6">
                                            <Link href={`/admin/admission/sessions/${session.id}/settings`}>
                                                <Button size="sm" variant="ghost" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                                                    <Settings className="h-4 w-4 mr-2" /> Configure
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
