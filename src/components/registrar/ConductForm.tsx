"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { logInfraction } from "@/actions/registrar_conduct";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ConductForm({ students, staff }: { students: any[], staff: any[] }) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [targetType, setTargetType] = useState<"student" | "staff">("student");
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const filteredStudents = students.filter(s => 
        s.matricNo?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.name?.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5);

    const filteredStaff = staff.filter(s => 
        s.staffId?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.name?.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedId) {
            toast.error(`Please select a ${targetType}`);
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        formData.append("targetType", targetType);
        
        if (targetType === "student") {
            formData.append("studentId", selectedId.toString());
        } else {
            formData.append("staffId", selectedId.toString());
        }

        const result = await logInfraction(formData);
        
        setIsSubmitting(false);

        if (result.success) {
            toast.success("Infraction logged successfully");
            router.push("/admin/registrar/conduct");
            router.refresh();
        } else {
            toast.error(result.error || "An error occurred");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Target Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Tabs value={targetType} onValueChange={(v) => {
                        setTargetType(v as "student" | "staff");
                        setSelectedId(null);
                        setSearchQuery("");
                    }}>
                        <TabsList className="w-full max-w-md">
                            <TabsTrigger value="student" className="w-1/2">Student</TabsTrigger>
                            <TabsTrigger value="staff" className="w-1/2">Staff</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="space-y-2">
                        <Label>Search {targetType === 'student' ? 'Student (Matric No or Name)' : 'Staff (Staff ID or Name)'}</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input 
                                placeholder="Search..." 
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        {searchQuery && !selectedId && targetType === 'student' && (
                            <div className="border rounded-md mt-2 max-h-40 overflow-y-auto">
                                {filteredStudents.map(student => (
                                    <div 
                                        key={student.id} 
                                        className="p-2 hover:bg-slate-50 cursor-pointer text-sm"
                                        onClick={() => {
                                            setSelectedId(student.id);
                                            setSearchQuery(`${student.name} (${student.matricNo})`);
                                        }}
                                    >
                                        <div className="font-medium">{student.name}</div>
                                        <div className="text-slate-500 text-xs">{student.matricNo}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {searchQuery && !selectedId && targetType === 'staff' && (
                            <div className="border rounded-md mt-2 max-h-40 overflow-y-auto">
                                {filteredStaff.map(s => (
                                    <div 
                                        key={s.id} 
                                        className="p-2 hover:bg-slate-50 cursor-pointer text-sm"
                                        onClick={() => {
                                            setSelectedId(s.id);
                                            setSearchQuery(`${s.name} (${s.staffId})`);
                                        }}
                                    >
                                        <div className="font-medium">{s.name}</div>
                                        <div className="text-slate-500 text-xs">{s.staffId}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Incident Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Infraction Type</Label>
                            <Input name="infraction" required placeholder={targetType === 'student' ? "e.g. Examination Malpractice" : "e.g. Gross Misconduct"} />
                        </div>
                        <div className="space-y-2">
                            <Label>Date of Incident</Label>
                            <Input type="date" name="dateOfIncident" required />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <Label>Detailed Description</Label>
                        <Textarea 
                            name="description" 
                            required 
                            placeholder="Describe the incident in detail..."
                            className="min-h-[100px]"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Sanction (Optional)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Sanction Type</Label>
                        <Select name="senateSanction" defaultValue="none">
                            <SelectTrigger>
                                <SelectValue placeholder="Select Sanction" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None / Pending</SelectItem>
                                <SelectItem value="warning">Warning</SelectItem>
                                <SelectItem value="suspension">Suspension</SelectItem>
                                {targetType === 'student' && <SelectItem value="rustication">Rustication</SelectItem>}
                                {targetType === 'staff' && <SelectItem value="demotion">Demotion</SelectItem>}
                                {targetType === 'staff' ? <SelectItem value="termination">Termination</SelectItem> : <SelectItem value="expulsion">Expulsion</SelectItem>}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Sanction Start Date (If applicable)</Label>
                            <Input type="date" name="sanctionStartDate" />
                        </div>
                        <div className="space-y-2">
                            <Label>Sanction End Date (If applicable)</Label>
                            <Input type="date" name="sanctionEndDate" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
                <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Logging..." : "Log Infraction"}
                </Button>
            </div>
        </form>
    );
}
