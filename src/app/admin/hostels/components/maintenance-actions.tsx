"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { updateMaintenanceRequest } from "@/actions/hostels";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function MaintenanceActions({ requestId, currentStatus }: { requestId: number, currentStatus: string }) {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(currentStatus);
    const [notes, setNotes] = useState("");
    const [open, setOpen] = useState(false);

    async function handleUpdate() {
        setLoading(true);
        const res = await updateMaintenanceRequest(requestId, {
            status,
            resolutionNotes: notes
        });
        if (res.success) {
            toast.success(res.message);
            setOpen(false);
        } else {
            toast.error(res.error);
        }
        setLoading(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                    Update Status
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Update Maintenance Request</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Status</Label>
                        <Select onValueChange={setStatus} defaultValue={status}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="in-progress">In Progress</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Resolution Notes</Label>
                        <Textarea
                            placeholder="Add notes about the fix..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        className="bg-indigo-600 w-full"
                        disabled={loading}
                        onClick={handleUpdate}
                    >
                        {loading ? "Updating..." : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
