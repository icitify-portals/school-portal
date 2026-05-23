
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateScreeningScore, updateAdmissionStatus } from "@/actions/admin-admission";
import { useRouter } from "next/navigation";
import { Loader2, Save, Send, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface Props {
    applicationId: number;
    currentScore: number;
    currentStatus: string;
}

export default function ScoringForm({ applicationId, currentScore, currentStatus }: Props) {
    const [score, setScore] = useState<string>(currentScore.toString());
    const [loading, setLoading] = useState(false);
    const [calculatedAggregate, setCalculatedAggregate] = useState<number | null>(null);
    const router = useRouter();
    const { toast } = useToast();

    const handleUpdateScore = async () => {
        setLoading(true);
        const res = await updateScreeningScore(applicationId, parseFloat(score));

        if (res.success) {
            setCalculatedAggregate(res.aggregate!);
            toast({
                title: "Scores Updated",
                description: `Candidate screening score updated. Aggregate: ${res.aggregate}%`,
            });
            router.refresh();
        } else {
            toast({
                title: "Error",
                description: res.error || "Failed to update score.",
                variant: "destructive"
            });
        }
        setLoading(false);
    };

    const handleStatusUpdate = async (status: 'admitted' | 'rejected') => {
        setLoading(true);
        const res = await updateAdmissionStatus(applicationId, status);
        if (res.success) {
            toast({
                title: "Status Updated",
                description: `Candidate status set to ${status}.`,
            });
            router.refresh();
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="score">Post-UTME / Interview Score</Label>
                    <div className="flex gap-2">
                        <Input
                            id="score"
                            type="number"
                            step="0.01"
                            value={score}
                            onChange={(e) => setScore(e.target.value)}
                            disabled={loading || currentStatus === 'admitted'}
                            placeholder="e.g. 75.5"
                        />
                        <Button onClick={handleUpdateScore} disabled={loading || !score || currentStatus === 'admitted'}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>

                <div className="space-y-2 bg-indigo-50 p-4 rounded-lg flex flex-col justify-center border border-indigo-100">
                    <p className="text-xs text-indigo-600 uppercase font-bold tracking-wider">Final Aggregate</p>
                    <p className="text-3xl font-black text-indigo-900">
                        {calculatedAggregate !== null ? `${calculatedAggregate}%` : (currentStatus !== 'applied' ? 'CALCULATED' : '—')}
                    </p>
                </div>
            </div>

            <div className="pt-6 border-t space-y-4">
                <Label>Decision Action</Label>
                <div className="flex flex-wrap gap-4">
                    <Button
                        variant="default"
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => handleStatusUpdate('admitted')}
                        disabled={loading || currentStatus === 'admitted'}
                    >
                        <Send className="mr-2 h-4 w-4" /> Recommend Admission
                    </Button>
                    <Button
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => handleStatusUpdate('rejected')}
                        disabled={loading || currentStatus === 'admitted'}
                    >
                        <XCircle className="mr-2 h-4 w-4" /> Reject Candidate
                    </Button>
                </div>
                {currentStatus === 'admitted' && (
                    <div className="mt-2 flex items-center gap-2 text-emerald-600 text-sm font-medium">
                        <Badge className="bg-emerald-600">ADMITTED</Badge>
                        Decision has been finalized and student profile created (simulated).
                    </div>
                )}
            </div>
        </div>
    );
}
