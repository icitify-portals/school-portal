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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Buildings & Rooms Management</h3>
                    <p className="text-xs text-slate-500">Configure hostel blocks and individual room capacities.</p>
                </div>
                <AddHostelDialog />
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {hostels?.map((h: any) => (
                    <Card key={h.id} className="border-none shadow-sm border border-slate-100 overflow-hidden group">
                        <div className="h-2 bg-indigo-600 w-full" />
                        <CardHeader className="border-b border-slate-50 bg-slate-50/50">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-base font-bold text-slate-800">{h.name}</CardTitle>
                                        {!h.isActive && <Badge variant="secondary" className="text-[10px] bg-red-100 text-red-700">Inactive</Badge>}
                                    </div>
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">CODE: {h.code}</p>
                                </div>
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                    <Building className="w-5 h-5" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Total Capacity</p>
                                    <p className="text-xl font-black text-slate-700 flex items-center gap-2">
                                        <Home className="w-4 h-4 text-slate-400" />
                                        {Number(h.capacity || 0)} Beds
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Hostel Type</p>
                                    <p className="text-sm font-bold text-slate-700 capitalize mt-1.5">{h.type}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Rooms Count</p>
                                    <p className="text-sm font-bold text-slate-700">{Number(h.roomCount || 0)} Rooms</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Available Beds</p>
                                    <p className="text-sm font-bold text-emerald-600">{Number(h.capacity || 0) - Number(h.occupiedCount || 0)} Available</p>
                                </div>
                            </div>

                            <Link href={`/admin/hostels/buildings?id=${h.id}`} className="w-full">
                                <Button variant="outline" className="w-full text-xs font-bold gap-2 text-indigo-600 border-indigo-100 hover:bg-indigo-50 hover:text-indigo-700">
                                    <Settings className="w-3.5 h-3.5" /> Manage Blocks & Rooms
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

// Just importing the icon used in the component
import { Settings } from "lucide-react";
