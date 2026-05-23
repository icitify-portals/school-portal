"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    approveHostelApplication,
    rejectHostelApplication,
    allocateStudentToRoom,
    getHostelStructure
} from "@/actions/hostels";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, XCircle, Home } from "lucide-react";

export function AllocationActions({
    applicationId,
    status,
    paymentStatus,
    hostelId
}: {
    applicationId: number,
    status: string,
    paymentStatus: string,
    hostelId: number
}) {
    const [loading, setLoading] = useState(false);
    const [showAllocateDialog, setShowAllocateDialog] = useState(false);

    const [blocks, setBlocks] = useState<any[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [selectedRoomId, setSelectedRoomId] = useState<string>("");

    useEffect(() => {
        if (showAllocateDialog) {
            fetchRooms();
        }
    }, [showAllocateDialog]);

    async function fetchRooms() {
        const res = await getHostelStructure(hostelId);
        if (res.success && 'data' in res && res.data) {
            setBlocks(res.data.blocks);
            // Only show available rooms for this hostel
            const availableRooms = (res.data.rooms as any[]).filter((r: any) => r.isAvailable && r.occupiedCount < r.capacity);
            setRooms(availableRooms);
        }
    }

    async function handleApprove() {
        setLoading(true);
        const res = await approveHostelApplication(applicationId);
        if (res.success) {
            toast.success(res.message);
        } else {
            toast.error(res.error);
        }
        setLoading(false);
    }

    async function handleReject() {
        if (!confirm("Are you sure you want to reject this application?")) return;
        setLoading(true);
        const res = await rejectHostelApplication(applicationId);
        if (res.success) {
            toast.success(res.message);
        } else {
            toast.error(res.error);
        }
        setLoading(false);
    }

    async function handleAllocate() {
        if (!selectedRoomId) return;
        setLoading(true);
        const res = await allocateStudentToRoom(applicationId, parseInt(selectedRoomId));
        if (res.success) {
            toast.success(res.message);
            setShowAllocateDialog(false);
        } else {
            toast.error(res.error);
        }
        setLoading(false);
    }

    if (status === 'pending') {
        return (
            <div className="flex gap-2 justify-end">
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-[10px] font-bold uppercase tracking-widest text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                    onClick={handleApprove}
                    disabled={loading}
                >
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Approve
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-[10px] font-bold uppercase tracking-widest text-red-600 border-red-200 hover:bg-red-50"
                    onClick={handleReject}
                    disabled={loading}
                >
                    <XCircle className="w-3 h-3 mr-1" /> Reject
                </Button>
            </div>
        );
    }

    if (status === 'approved' && paymentStatus === 'paid') {
        return (
            <Dialog open={showAllocateDialog} onOpenChange={setShowAllocateDialog}>
                <DialogTrigger asChild>
                    <Button size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700">
                        <Home className="w-3 h-3 mr-1" /> Allocate Room
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Select Room for Allocation</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label>Available Rooms</Label>
                            <Select onValueChange={setSelectedRoomId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a room" />
                                </SelectTrigger>
                                <SelectContent>
                                    {blocks.map(block => (
                                        <div key={block.id}>
                                            <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase bg-slate-50">{block.name}</div>
                                            {rooms.filter(r => r.blockId === block.id).map(room => (
                                                <SelectItem key={room.id} value={room.id.toString()}>
                                                    Room {room.roomNumber} ({room.occupiedCount}/{room.capacity} Full) - {room.gender}
                                                </SelectItem>
                                            ))}
                                        </div>
                                    ))}
                                    {rooms.length === 0 && <p className="p-4 text-center text-xs text-slate-400">No rooms available</p>}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            className="bg-indigo-600 w-full"
                            disabled={loading || !selectedRoomId}
                            onClick={handleAllocate}
                        >
                            {loading ? "Allocating..." : "Confirm Allocation"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    return null;
}
