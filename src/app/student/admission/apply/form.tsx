
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { submitAdmissionApplication } from "@/actions/admission-application";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Props {
    programmes: any[];
    session: any;
}

export default function ApplyForm({ programmes, session }: Props) {
    const [selectedProgramme, setSelectedProgramme] = useState<string>("");
    const [extraData, setExtraData] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const dynamicFields = session.dynamicFields ? JSON.parse(session.dynamicFields) : [];

    const handleApply = async () => {
        if (!selectedProgramme) return;

        // Basic validation for required dynamic fields
        for (const field of dynamicFields) {
            if (field.required && !extraData[field.id]) {
                toast({
                    title: "Validation Error",
                    description: `Please fill in the required field: ${field.label}`,
                    variant: "destructive"
                });
                return;
            }
        }

        setLoading(true);
        const res = await submitAdmissionApplication({
            templateId: parseInt(selectedProgramme),
            formData: extraData
        });

        if (res.success) {
            toast({
                title: "Application Submitted",
                description: "Your Post-UTME screening application has been received.",
            });
            router.push("/student/admission");
            router.refresh();
        } else {
            toast({
                title: "Error",
                description: res.error || "Failed to submit application.",
                variant: "destructive"
            });
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="programme">Select Programme of Study</Label>
                <Select value={selectedProgramme} onValueChange={setSelectedProgramme}>
                    <SelectTrigger id="programme">
                        <SelectValue placeholder="Choose a programme..." />
                    </SelectTrigger>
                    <SelectContent>
                        {programmes.map((p) => (
                            <SelectItem key={p.id} value={p.id.toString()}>
                                {p.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Dynamic Custom Fields */}
            {dynamicFields.length > 0 && (
                <div className="pt-4 border-t space-y-4">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Additional Information</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {dynamicFields.map((field: any) => (
                            <div key={field.id} className={cn("space-y-2", field.type === 'textarea' ? 'sm:col-span-2' : '')}>
                                <Label htmlFor={field.id}>
                                    {field.label} {field.required && <span className="text-red-500">*</span>}
                                </Label>
                                {field.type === 'select' ? (
                                    <Select
                                        value={extraData[field.id] || ""}
                                        onValueChange={v => setExtraData({ ...extraData, [field.id]: v })}
                                    >
                                        <SelectTrigger id={field.id}>
                                            <SelectValue placeholder="Select..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {field.options?.split(',').map((opt: string) => (
                                                <SelectItem key={opt.trim()} value={opt.trim()}>
                                                    {opt.trim()}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : field.type === 'textarea' ? (
                                    <Textarea
                                        id={field.id}
                                        value={extraData[field.id] || ""}
                                        onChange={e => setExtraData({ ...extraData, [field.id]: e.target.value })}
                                        placeholder={field.label}
                                    />
                                ) : (
                                    <Input
                                        id={field.id}
                                        type={field.type}
                                        value={extraData[field.id] || ""}
                                        onChange={e => setExtraData({ ...extraData, [field.id]: e.target.value })}
                                        placeholder={field.label}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <Button
                onClick={handleApply}
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={!selectedProgramme || loading}
            >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Submit Application & Proceed to Payment
            </Button>

            <p className="text-[10px] text-center text-slate-400">
                By submitting this form, you agree that the information provided is accurate and verifiable.
            </p>
        </div>
    );
}

