"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { updateDeveloperFeeSettings } from "@/actions/developer-subscriptions";
import { toast } from "sonner";

export default function DeveloperFeeSettingsForm({ initialData }: { initialData?: any }) {
    const [loading, setLoading] = useState(false);
    const [feeName, setFeeName] = useState(initialData?.feeName || "Platform Subscription Fee");
    const [feeAmount, setFeeAmount] = useState(initialData?.feeAmount || "0");
    const [billingCycle, setBillingCycle] = useState(initialData?.billingCycle || "per_term");
    const [durationMonths, setDurationMonths] = useState(initialData?.durationMonths || 4);
    const [syncWithCalendar, setSyncWithCalendar] = useState(initialData?.syncWithCalendar || false);
    const [lockWeek, setLockWeek] = useState(initialData?.lockWeek || 4);
    const [isActive, setIsActive] = useState(initialData?.isActive ?? true);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateDeveloperFeeSettings({
                feeName,
                feeAmount: parseFloat(feeAmount),
                billingCycle,
                durationMonths: parseInt(durationMonths),
                syncWithCalendar,
                lockWeek: parseInt(lockWeek),
                isActive
            });
            toast.success("Subscription settings updated!");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <Label>Fee Name</Label>
                <Input value={feeName} onChange={(e) => setFeeName(e.target.value)} required />
            </div>

            <div className="space-y-2">
                <Label>Fee Amount (₦)</Label>
                <Input type="number" step="0.01" value={feeAmount} onChange={(e) => setFeeAmount(e.target.value)} required />
            </div>

            <div className="space-y-2">
                <Label>Billing Cycle</Label>
                <Select value={billingCycle} onValueChange={setBillingCycle}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select cycle" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="per_term">Per Term</SelectItem>
                        <SelectItem value="per_semester">Per Semester</SelectItem>
                        <SelectItem value="per_annum">Per Annum (Session)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center justify-between border p-4 rounded-lg">
                <div className="space-y-0.5">
                    <Label className="text-base">Sync Expiry With Global Calendar</Label>
                    <p className="text-sm text-muted-foreground">
                        If enabled, subscription expiry dates strictly match the Global Calendar's term/semester end dates instead of fixed months.
                    </p>
                </div>
                <Switch checked={syncWithCalendar} onCheckedChange={setSyncWithCalendar} />
            </div>

            {!syncWithCalendar && (
                <div className="space-y-2">
                    <Label>Default Duration (Months)</Label>
                    <Input type="number" min="1" max="12" value={durationMonths} onChange={(e) => setDurationMonths(e.target.value)} required />
                    <p className="text-xs text-muted-foreground">How many months this subscription covers if calendar sync is disabled.</p>
                </div>
            )}

            <div className="space-y-2">
                <Label>Lock Week Enforement</Label>
                <Input type="number" min="1" max="16" value={lockWeek} onChange={(e) => setLockWeek(e.target.value)} required />
                <p className="text-xs text-muted-foreground">Week number to enforce portal lock (e.g., 4 = Week 4). Daily notifications start before this.</p>
            </div>

            <div className="flex items-center justify-between border p-4 rounded-lg">
                <div className="space-y-0.5">
                    <Label className="text-base">Enable Auto-Billing</Label>
                    <p className="text-sm text-muted-foreground">
                        Automatically generate bills for active students.
                    </p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Saving..." : "Save Configuration"}
            </Button>
        </form>
    );
}
