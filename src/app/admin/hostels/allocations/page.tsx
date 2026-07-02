import { getHostelApplications } from "@/actions/hostels";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Search, Clock, Home } from "lucide-react";
import { AllocationActions } from "../components/allocation-actions";
import { db } from "@/db/db";
import { hostelBlocks, hostelRooms } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function AllocationsPage() {
    const applications = await getHostelApplications();

    // Utility component to fetch and display room name
    async function RoomDetails({ roomId }: { roomId: number }) {
        if (!roomId) return <span className="text-slate-400 italic text-xs">Unallocated</span>;
        try {
            const [roomInfo] = await db.select({
                roomNumber: hostelRooms.roomNumber,
                blockName: hostelBlocks.name,
            })
                .from(hostelRooms)
                .innerJoin(hostelBlocks, eq(hostelRooms.blockId, hostelBlocks.id))
                .where(eq(hostelRooms.id, roomId))
                .limit(1);

            return (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-700 text-sm">{roomInfo.blockName}</span>
                    <span className="text-xs font-mono text-slate-500">RM-{roomInfo.roomNumber}</span>
                </div>
            );
        } catch {
            return <span>Unknown</span>;
        }
    }

    return (
        <div className="space-y-8 text-slate-800">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden border border-slate-800">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-slate-650/30 opacity-50 mix-blend-overlay" />
                <div className="relative z-10 flex-1">
                    <h3 className="text-2xl font-black uppercase italic tracking-tight">Bed Allocations</h3>
                    <p className="text-slate-350 text-xs font-medium mt-1 uppercase tracking-wide opacity-90">Review requests, approve allocations, and manage student beds.</p>
                </div>
                <div className="relative w-full md:w-72 z-10">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        placeholder="Search matric or name..."
                        className="w-full bg-white/10 border border-white/20 rounded-xl h-12 pl-10 pr-4 text-xs font-bold text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-inner"
                    />
                </div>
            </div>

            <Card className="border border-white/40 shadow-2xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl overflow-hidden rounded-[3rem]">
                <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead>
                            <tr className="bg-slate-900 text-white">
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Student</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Hostel Preference</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Status</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Allocation</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Applied Date</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/40 bg-white/20">
                            {applications.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center text-slate-400">
                                        <Home className="w-12 h-12 mx-auto mb-4 text-slate-300 animate-pulse" />
                                        <p className="text-xs font-black uppercase tracking-widest">No applications found</p>
                                    </td>
                                </tr>
                            ) : (
                                applications.map((app: any) => (
                                    <tr key={app.id} className="group hover:bg-white/40 transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col">
                                                <span className="font-black text-sm text-slate-800 uppercase">{app.student.name || "(No Name)"}</span>
                                                <span className="text-[10px] font-black text-slate-400 uppercase mt-0.5">{app.student.matricNumber}</span>
                                                <div className="flex gap-2 mt-1.5">
                                                    <Badge className="text-[8px] px-2 py-0.5 font-black uppercase bg-slate-100 text-slate-500 border border-slate-200">
                                                        {app.student.level}L
                                                    </Badge>
                                                    {app.isPriority && (
                                                        <Badge className="text-[8px] px-2 py-0.5 font-black uppercase text-amber-600 border border-amber-250 bg-amber-50 shadow-sm">
                                                            Priority
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 font-black text-sm text-slate-700 uppercase italic">
                                            {app.hostel.name}
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col items-start gap-1">
                                                {app.status === 'pending' && <Badge className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-amber-50 border border-amber-250 text-amber-600 shadow-sm gap-1"><Clock className="w-3 h-3" /> Pending</Badge>}
                                                {app.status === 'approved' && <Badge className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-indigo-50 border border-indigo-250 text-indigo-600 shadow-sm gap-1">Approved</Badge>}
                                                {app.status === 'allocated' && <Badge className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-emerald-50 border border-emerald-250 text-emerald-600 shadow-sm gap-1"><CheckCircle2 className="w-3 h-3" /> Allocated</Badge>}
                                                {app.status === 'rejected' && <Badge className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-rose-50 border border-rose-250 text-rose-600 shadow-sm gap-1"><XCircle className="w-3 h-3" /> Rejected</Badge>}
                                                {app.status === 'expired' && <Badge className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-slate-50 border border-slate-250 text-slate-400 shadow-sm gap-1">Expired</Badge>}

                                                {app.paymentStatus === 'paid' && <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-1">Paid</p>}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <RoomDetails roomId={app.allocatedRoomId} />
                                        </td>
                                        <td className="px-8 py-5 text-xs font-black text-slate-500 font-mono">
                                            {new Date(app.appliedAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <AllocationActions
                                                applicationId={app.id}
                                                status={app.status}
                                                paymentStatus={app.paymentStatus}
                                                hostelId={app.hostel.id}
                                            />
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
