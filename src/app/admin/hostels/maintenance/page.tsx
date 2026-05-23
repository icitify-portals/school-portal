import { getAllMaintenanceRequests } from "@/actions/hostels";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wrench, Clock, User, Home, AlertTriangle } from "lucide-react";
import { MaintenanceActions } from "../components/maintenance-actions";

export default async function AdminMaintenancePage() {
    const requests = await getAllMaintenanceRequests();

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-slate-900">Hostel Maintenance Requests</h2>
                <p className="text-xs text-slate-500 font-medium">Monitor and manage facility issues reported by students.</p>
            </div>

            <Card className="border-none shadow-sm border border-slate-100 overflow-hidden">
                <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                                <th className="px-6 py-4">Request / Student</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Priority</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {requests.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                                        <Wrench className="w-8 h-8 mx-auto mb-3 opacity-20" />
                                        No maintenance requests found.
                                    </td>
                                </tr>
                            ) : (
                                requests.map((req: any) => (
                                    <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm text-slate-900 uppercase">{req.title}</span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase">
                                                        <User className="w-2.5 h-2.5" /> {req.student.name}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase">
                                                        <Home className="w-2.5 h-2.5" /> Room {req.room.roomNumber}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="secondary" className="text-[10px] font-bold uppercase py-0.5 px-2 bg-slate-100 text-slate-600 border-none">
                                                {req.category}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge className={`text-[10px] font-bold uppercase py-0.5 px-2 border-none ${req.priority === 'urgent' ? 'bg-red-50 text-red-600' :
                                                    req.priority === 'high' ? 'bg-orange-50 text-orange-600' :
                                                        'bg-slate-50 text-slate-400'
                                                }`}>
                                                {req.priority}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="outline" className={`text-[10px] font-bold uppercase py-0.5 px-2 gap-1 ${req.status === 'pending' ? 'text-amber-600 bg-amber-50 border-amber-100' :
                                                    req.status === 'in-progress' ? 'text-indigo-600 bg-indigo-50 border-indigo-100' :
                                                        req.status === 'resolved' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' :
                                                            'text-slate-400 bg-slate-50 border-slate-100'
                                                }`}>
                                                {req.status === 'pending' && <Clock className="w-3 h-3" />}
                                                {req.status === 'resolved' && <CheckCircle className="w-3 h-3 text-emerald-500" />}
                                                {req.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-medium text-slate-500">
                                            {new Date(req.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <MaintenanceActions requestId={req.id} currentStatus={req.status} />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
}

function CheckCircle(props: any) {
    return <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></svg>;
}
