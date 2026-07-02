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
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
            <div className="max-w-[1600px] w-full mx-auto space-y-8">
                {/* Header Section */}
                <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-8 lg:p-12 text-white shadow-2xl border border-slate-800">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-indigo-600/30 opacity-50 mix-blend-overlay" />
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Building className="w-12 h-12 text-blue-400" />
                                <h1 className="text-4xl lg:text-5xl font-black tracking-tighter drop-shadow-md italic">
                                    Student Hostels
                                </h1>
                            </div>
                            <p className="text-slate-300 font-medium tracking-tight max-w-2xl text-lg opacity-90">
                                Accommodations, occupancy tracking, and bed space allocations
                            </p>
                        </div>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-indigo-600 text-white backdrop-blur-3xl rounded-[2rem] hover:-translate-y-1 transition-all duration-300 overflow-hidden group p-2">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Total Hostels</p>
                                <h3 className="text-3xl font-black mt-2 italic tracking-tighter">{hostels?.length || 0}</h3>
                            </div>
                            <div className="p-4 bg-white/20 rounded-2xl text-white shadow-inner group-hover:scale-110 transition-transform">
                                <Building className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[2rem] hover:-translate-y-1 transition-all duration-300 overflow-hidden group p-2">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Bed Spaces</p>
                                <h3 className="text-3xl font-black text-slate-900 mt-2 italic tracking-tighter">{totalCapacity}</h3>
                            </div>
                            <div className="p-4 bg-slate-100/50 rounded-2xl text-slate-600 shadow-inner group-hover:scale-110 transition-transform">
                                <Bed className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[2rem] hover:-translate-y-1 transition-all duration-300 overflow-hidden group p-2">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Occupied Beds</p>
                                <div className="p-2 bg-rose-50 rounded-xl text-rose-500 shadow-inner group-hover:scale-110 transition-transform">
                                    <Users className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="flex items-end justify-between">
                                <h3 className="text-3xl font-black text-slate-900 italic tracking-tighter">{totalOccupied}</h3>
                                <p className="text-xs font-black text-rose-500 mb-1">{occupancyRate}% Full</p>
                            </div>
                            <div className="mt-4 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div className="bg-rose-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${occupancyRate}%` }}></div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[2rem] hover:-translate-y-1 transition-all duration-300 overflow-hidden group p-2">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Pending Allocations</p>
                                <h3 className="text-3xl font-black text-amber-600 mt-2 italic tracking-tighter">{pendingAllocations.length}</h3>
                            </div>
                            <div className="p-4 bg-amber-50 rounded-2xl text-amber-500 shadow-inner group-hover:scale-110 transition-transform">
                                <Clock className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Grids */}
                <div className="grid md:grid-cols-2 gap-6">
                    <Card className="bg-white/60 backdrop-blur-3xl border border-white/40 shadow-xl shadow-slate-200/50 rounded-[3rem] overflow-hidden">
                        <CardHeader className="border-b border-white/40 bg-white/40 pb-6 px-10 pt-10">
                            <CardTitle className="text-2xl font-black text-slate-900 italic tracking-tighter flex items-center gap-3">
                                <Building className="w-6 h-6 text-indigo-600" />
                                Occupancy Overview
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 overflow-x-auto">
                            <table className="w-full text-left whitespace-nowrap">
                                <thead>
                                    <tr className="bg-slate-100/30 border-b border-white/40 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        <th className="px-10 py-6">Hostel Name</th>
                                        <th className="px-10 py-6">Type</th>
                                        <th className="px-10 py-6 text-right">Occupancy</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100/50">
                                    {hostels?.map((h: any) => {
                                        const capacity = Number(h.capacity || 0);
                                        const occupied = Number(h.occupiedCount || 0);
                                        const occRate = capacity > 0 ? (occupied / capacity) * 100 : 0;
                                        return (
                                            <tr key={h.id} className="hover:bg-white/40 transition-colors">
                                                <td className="px-10 py-5 font-black text-sm text-slate-900">{h.name}</td>
                                                <td className="px-10 py-5 text-xs font-bold text-slate-500 capitalize">{h.type}</td>
                                                <td className="px-10 py-5 text-right">
                                                    <div className="flex items-center justify-end gap-3 text-sm font-black text-slate-800">
                                                        {occupied} / {capacity}
                                                        <div className="w-20 bg-slate-200/50 rounded-full h-2">
                                                            <div className={`h-2 rounded-full ${occRate > 90 ? 'bg-rose-500' : occRate > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${occRate}%` }}></div>
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

                    <Card className="bg-white/60 backdrop-blur-3xl border border-white/40 shadow-xl shadow-slate-200/50 rounded-[3rem] overflow-hidden">
                        <CardHeader className="border-b border-white/40 bg-white/40 pb-6 px-10 pt-10">
                            <CardTitle className="text-2xl font-black text-slate-900 italic tracking-tighter flex items-center gap-3">
                                <Users className="w-6 h-6 text-indigo-600" />
                                Recent Allocations
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {pendingAllocations.length === 0 ? (
                                <div className="p-16 text-center">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Users className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <p className="text-sm font-black text-slate-500 uppercase tracking-widest">No Pending Requests</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100/50">
                                    {pendingAllocations.slice(0, 5).map((app: any) => (
                                        <div key={app.id} className="p-6 px-10 flex justify-between items-center hover:bg-white/40 transition-colors">
                                            <div>
                                                <p className="text-sm font-black text-slate-900 uppercase">{app.student.name || app.student.matricNumber}</p>
                                                <p className="text-[10px] font-bold text-indigo-500 mt-1 uppercase tracking-widest">{app.student.level}L • {app.student.gender}</p>
                                            </div>
                                            <div className="text-right bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                                                <p className="text-xs font-black text-slate-700">{app.hostel.name}</p>
                                                <p className="text-[10px] text-amber-600 font-black mt-1 uppercase tracking-widest">Pending</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
