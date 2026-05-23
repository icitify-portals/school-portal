import { getHostels, getHostelApplications } from "@/actions/hostels";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Building, Users, Bed, Clock } from "lucide-react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function HostelAdminDashboardPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const hostelsRes = await getHostels();
    const hostels = (hostelsRes.success ? hostelsRes.data : []) || [];

    // Applications that are pending action
    const allApplications = await getHostelApplications();
    const pendingAllocations = allApplications.filter(a => a.status === 'pending');

    let totalCapacity = 0;
    let totalOccupied = 0;

    hostels.forEach((h: any) => {
        totalCapacity += Number(h.capacity || 0);
        totalOccupied += Number(h.occupiedCount || 0);
    });

    const totalAvailable = totalCapacity - totalOccupied;
    const occupancyRate = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-none shadow-sm bg-indigo-600 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Building className="w-16 h-16" />
                    </div>
                    <CardContent className="p-6">
                        <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest mb-2">Total Hostels</p>
                        <h3 className="text-3xl font-extrabold">{hostels?.length || 0}</h3>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm border border-slate-100">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-2 text-slate-500 mb-2">
                            <Bed className="w-4 h-4" />
                            <p className="text-[10px] font-bold uppercase tracking-widest">Total Bed Spaces</p>
                        </div>
                        <h3 className="text-3xl font-extrabold text-slate-900">{totalCapacity}</h3>
                        <p className="text-xs text-slate-500 mt-2 font-medium">Campus Capacity</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm border border-slate-100">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-2 text-rose-500 mb-2">
                            <Users className="w-4 h-4" />
                            <p className="text-[10px] font-bold uppercase tracking-widest">Occupied Beds</p>
                        </div>
                        <h3 className="text-3xl font-extrabold text-slate-900">{totalOccupied}</h3>
                        <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5">
                            <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: `${occupancyRate}%` }}></div>
                        </div>
                        <p className="text-xs text-slate-500 mt-2 font-medium">{occupancyRate}% Full</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm border border-slate-100">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-2 text-amber-500 mb-2">
                            <Clock className="w-4 h-4" />
                            <p className="text-[10px] font-bold uppercase tracking-widest">Pending Allocations</p>
                        </div>
                        <h3 className="text-3xl font-extrabold text-slate-900">{pendingAllocations.length}</h3>
                        <p className="text-xs text-slate-500 mt-2 font-medium">Require Approval</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-none shadow-sm border border-slate-100">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Building className="w-4 h-4 text-indigo-600" />
                            Hostel Occupancy Overview
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100">
                                    <th className="px-6 py-3">Hostel Name</th>
                                    <th className="px-6 py-3">Type</th>
                                    <th className="px-6 py-3 text-right">Occupancy</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {hostels?.map((h: any) => {
                                    const capacity = Number(h.capacity || 0);
                                    const occupied = Number(h.occupiedCount || 0);
                                    const occRate = capacity > 0 ? (occupied / capacity) * 100 : 0;
                                    return (
                                        <tr key={h.id} className="hover:bg-slate-50/50">
                                            <td className="px-6 py-4 font-bold text-sm text-slate-800">{h.name}</td>
                                            <td className="px-6 py-4 text-xs font-medium text-slate-500 capitalize">{h.type}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 text-sm font-bold text-slate-700">
                                                    {occupied} / {capacity}
                                                    <div className="w-16 bg-slate-100 rounded-full h-1.5 ml-2">
                                                        <div className={`h-1.5 rounded-full ${occRate > 90 ? 'bg-rose-500' : occRate > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${occRate}%` }}></div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm border border-slate-100">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Users className="w-4 h-4 text-indigo-600" />
                            Recent Allocation Requests
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {pendingAllocations.length === 0 ? (
                            <div className="p-12 text-center text-slate-400">
                                <Users className="w-8 h-8 mx-auto mb-3 opacity-20" />
                                <p className="text-sm font-medium">No pending requests</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {pendingAllocations.slice(0, 5).map((app: any) => (
                                    <div key={app.id} className="p-4 flex justify-between items-center hover:bg-slate-50/50">
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 uppercase">{app.student.name || app.student.matricNumber}</p>
                                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{app.student.level}L • {app.student.gender}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-semibold text-slate-700">Pref: {app.hostel.name}</p>
                                            <p className="text-[10px] text-amber-600 font-bold mt-1 uppercase tracking-widest">Pending</p>
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
