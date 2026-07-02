import { getHostels } from "@/actions/hostels";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Building, Home, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AddHostelDialog } from "../components/add-hostel-dialog";
import { RoomManager } from "../components/room-manager";
import Link from "next/link";

interface PageProps {
    searchParams: Promise<{
        id?: string;
    }>;
}

export default async function BuildingsPage(props: PageProps) {
    const searchParams = await props.searchParams;
    const selectedHostelId = searchParams.id ? parseInt(searchParams.id) : null;

    const hostelsRes = await getHostels();
    const hostels = (hostelsRes.success ? hostelsRes.data : []) || [];

    const selectedHostel = selectedHostelId ? hostels.find((h: any) => h.id === selectedHostelId) : null;

    if (selectedHostelId && selectedHostel) {
        return <RoomManager hostelId={selectedHostelId} hostelName={selectedHostel.name} />;
    }

    return (
        <div className="space-y-8 text-slate-800">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden border border-slate-800">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-650/30 opacity-50 mix-blend-overlay" />
                <div className="relative z-10 flex-1">
                    <h3 className="text-2xl font-black uppercase italic tracking-tight">Buildings & Rooms Management</h3>
                    <p className="text-slate-350 text-xs font-medium mt-1 uppercase tracking-wide opacity-90">Configure hostel blocks and individual room capacities.</p>
                </div>
                <div className="relative z-10">
                    <AddHostelDialog />
                </div>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {hostels?.map((h: any) => (
                    <Card key={h.id} className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between">
                        <div>
                            <div className="h-2 bg-indigo-600 w-full" />
                            <CardHeader className="border-b border-white/40 bg-white/20 p-8">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <CardTitle className="text-lg font-black uppercase italic text-slate-800">{h.name}</CardTitle>
                                            {!h.isActive && <Badge className="text-[9px] font-black uppercase tracking-widest bg-red-100 text-red-700 border border-red-200 shadow-sm">Inactive</Badge>}
                                        </div>
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">CODE: {h.code}</p>
                                    </div>
                                    <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl shadow-inner">
                                        <Building className="w-5 h-5" />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Total Capacity</p>
                                        <p className="text-base font-black text-slate-700 flex items-center gap-2">
                                            <Home className="w-4 h-4 text-slate-400" />
                                            {Number(h.capacity || 0)} Beds
                                        </p>
                                    </div>
                                    <div className="space-y-1 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Hostel Type</p>
                                        <p className="text-sm font-black text-slate-700 uppercase italic mt-1">{h.type}</p>
                                    </div>
                                    <div className="space-y-1 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Rooms Count</p>
                                        <p className="text-sm font-black text-slate-700 font-mono">{Number(h.roomCount || 0)} Rooms</p>
                                    </div>
                                    <div className="space-y-1 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Available Beds</p>
                                        <p className="text-sm font-black text-emerald-600 font-mono">{Number(h.capacity || 0) - Number(h.occupiedCount || 0)} Beds</p>
                                    </div>
                                </div>
                            </CardContent>
                        </div>
                        <div className="p-8 pt-0">
                            <Link href={`/admin/hostels/buildings?id=${h.id}`} className="w-full">
                                <Button variant="outline" className="w-full text-[10px] font-black uppercase tracking-widest gap-2 text-indigo-600 border-indigo-100 hover:bg-indigo-50 hover:text-indigo-700 h-12 rounded-xl transition-all">
                                    <Settings className="w-4 h-4" /> Manage Blocks & Rooms
                                </Button>
                            </Link>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}

// Just importing the icon used in the component
import { Settings } from "lucide-react";
