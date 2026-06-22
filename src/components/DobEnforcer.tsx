"use client";

import { useEffect, useState } from "react";
import { checkDateOfBirth, saveDateOfBirth } from "@/actions/user_profile";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, CalendarHeart } from "lucide-react";

export function DobEnforcer() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [dob, setDob] = useState("");

    useEffect(() => {
        const verifyDob = async () => {
            const res = await checkDateOfBirth();
            if (res.missing) {
                setOpen(true);
            }
            setLoading(false);
        };
        verifyDob();
    }, []);

    const handleSave = async () => {
        if (!dob) {
            toast.error("Please enter your date of birth.");
            return;
        }

        setSaving(true);
        const res = await saveDateOfBirth(dob);
        if (res.success) {
            toast.success("Date of Birth saved successfully!");
            setOpen(false);
        } else {
            toast.error(res.error || "Failed to save. Please try again.");
        }
        setSaving(false);
    };

    // Render nothing while checking
    if (loading) return null;

    return (
        <Dialog open={open} onOpenChange={(val) => {
            // Prevent closing by clicking outside or pressing escape
            if (val === true) setOpen(true);
        }}>
            <DialogContent className="sm:max-w-md [&>button]:hidden">
                <DialogHeader className="flex flex-col items-center sm:text-center pt-6">
                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                        <CalendarHeart className="w-6 h-6" />
                    </div>
                    <DialogTitle className="text-xl font-bold">Complete Your Profile</DialogTitle>
                    <DialogDescription className="text-center mt-2">
                        To help us personalize your experience and send you timely communications, your <strong>Date of Birth</strong> is now required to proceed.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="dob">Date of Birth <span className="text-rose-500">*</span></Label>
                        <Input 
                            id="dob" 
                            type="date" 
                            value={dob} 
                            onChange={(e) => setDob(e.target.value)} 
                            max={new Date().toISOString().split('T')[0]} // Cannot be in the future
                        />
                    </div>
                </div>

                <DialogFooter className="sm:justify-center pb-4">
                    <Button onClick={handleSave} disabled={saving} className="w-full">
                        {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Save & Continue"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
