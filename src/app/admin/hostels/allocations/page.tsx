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
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Bed Allocations</h3>
                    <p className="text-xs text-slate-500">Review requests, approve allocations, and manage student beds.</p>
                </div>
                <div className="relative w-full md:w-72">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        placeholder="Search matric or name..."
                        className="w-full bg-white border border-slate-200 rounded-xl h-10 pl-9 pr-4 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                    />
                </div>
            </div>

            <Card className="border-none shadow-sm border border-slate-100 overflow-hidden">
                <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                                <th className="px-6 py-4">Student</th>
                                <th className="px-6 py-4">Hostel Preference</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Allocation</th>
                                <th className="px-6 py-4">Applied Date</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {applications.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                        <Home className="w-8 h-8 mx-auto mb-3 opacity-20" />
                                        <p className="text-sm">No applications found.</p>
                                    </td>
                                </tr>
                            ) : (
                                applications.map((app: any) => (
                                    <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-sm text-slate-900 uppercase">{app.student.name || "(No Name)"}</p>
                                            <p className="text-[10px] font-mono font-bold text-slate-500 mt-0.5">{app.student.matricNumber}</p>
                                            <div className="flex gap-2 mt-1">
                                                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 font-bold uppercase">{app.student.level}L</Badge>
                                                {app.isPriority && <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-bold uppercase text-amber-600 border-amber-200 bg-amber-50">Priority</Badge>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-sm text-slate-700">
                                            {app.hostel.name}
                                        </td>
                                        <td className="px-6 py-4">
                                            {app.status === 'pending' && <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200 gap-1"><Clock className="w-3 h-3" /> Pending</Badge>}
                                            {app.status === 'approved' && <Badge variant="outline" className="text-indigo-600 bg-indigo-50 border-indigo-200 gap-1">Approved</Badge>}
                                            {app.status === 'allocated' && <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-200 gap-1"><CheckCircle2 className="w-3 h-3" /> Allocated</Badge>}
                                            {app.status === 'rejected' && <Badge variant="outline" className="text-red-600 bg-red-50 border-red-200 gap-1"><XCircle className="w-3 h-3" /> Rejected</Badge>}
                                            {app.status === 'expired' && <Badge variant="outline" className="text-slate-500 bg-slate-50 border-slate-200 gap-1">Expired</Badge>}

                                            {app.paymentStatus === 'paid' && <p className="text-[9px] font-bold text-emerald-600 uppercase mt-1">Paid</p>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <RoomDetails roomId={app.allocatedRoomId} />
                                        </td>
                                        <td className="px-6 py-4 text-xs font-medium text-slate-500">
                                            {new Date(app.appliedAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
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
