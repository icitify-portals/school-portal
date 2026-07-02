"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { updateStudentProfile } from "@/actions/students";

interface StudentProfileEditorModalProps {
    student: any | null;
    departments: any[];
    programmes: any[];
    onClose: () => void;
    onUpdate?: () => void;
}

export function StudentProfileEditorModal({ student, departments, programmes, onClose, onUpdate }: StudentProfileEditorModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<any>({});

    // Initialize form data when student changes
    if (student && Object.keys(formData).length === 0 && !loading) {
        setFormData({
            firstName: student.firstName || "",
            lastName: student.lastName || "",
            otherNames: student.otherNames || "",
            matricNumber: student.matricNumber || "",
            jambNumber: student.jambNumber || "",
            currentLevel: student.currentLevel || 100,
            deptId: student.deptId || "",
            programmeId: student.programmeId || "",
            gender: student.gender || "",
            dob: student.dob || "",
            nin: student.nin || "",
            guardianName: student.guardianName || "",
            guardianPhone: student.guardianPhone || "",
            kinName: student.kinName || "",
            kinPhone: student.kinPhone || "",
        });
    }

    if (!student) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const dataToSubmit = { ...formData };
        if (dataToSubmit.deptId) dataToSubmit.deptId = parseInt(dataToSubmit.deptId);
        if (dataToSubmit.programmeId) dataToSubmit.programmeId = parseInt(dataToSubmit.programmeId);
        if (dataToSubmit.currentLevel) dataToSubmit.currentLevel = parseInt(dataToSubmit.currentLevel);

        const res = await updateStudentProfile(student.userId, dataToSubmit);
        if (res.success) {
            onUpdate?.();
            onClose();
        } else {
            alert(res.error);
        }
        setLoading(false);
    };

    return (
        <Dialog open={!!student} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Edit Student Profile</DialogTitle>
                    <DialogDescription>
                        Update academic and personal records for {student.user?.name || student.firstName + ' ' + student.lastName}.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    
                    {/* Academic Info */}
                    <div>
                        <h3 className="font-bold uppercase tracking-widest text-xs text-blue-600 mb-3 border-b pb-2">Academic Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <Label className="text-xs">First Name</Label>
                                <Input name="firstName" value={formData.firstName} onChange={handleInputChange} required />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Last Name</Label>
                                <Input name="lastName" value={formData.lastName} onChange={handleInputChange} required />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Other Names</Label>
                                <Input name="otherNames" value={formData.otherNames} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Matric Number</Label>
                                <Input name="matricNumber" value={formData.matricNumber} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">JAMB Number</Label>
                                <Input name="jambNumber" value={formData.jambNumber} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Current Level</Label>
                                <Input name="currentLevel" type="number" value={formData.currentLevel} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Department</Label>
                                <select 
                                    name="deptId" 
                                    value={formData.deptId} 
                                    onChange={handleInputChange}
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="">Select Department</option>
                                    {departments.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Programme</Label>
                                <select 
                                    name="programmeId" 
                                    value={formData.programmeId} 
                                    onChange={handleInputChange}
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="">Select Programme</option>
                                    {programmes.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Bio Data */}
                    <div>
                        <h3 className="font-bold uppercase tracking-widest text-xs text-blue-600 mb-3 border-b pb-2">Bio Data</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <Label className="text-xs">Date of Birth</Label>
                                <Input type="date" name="dob" value={formData.dob} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Gender</Label>
                                <select 
                                    name="gender" 
                                    value={formData.gender} 
                                    onChange={handleInputChange}
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="">Select Gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">NIN</Label>
                                <Input name="nin" value={formData.nin} onChange={handleInputChange} />
                            </div>
                        </div>
                    </div>

                    {/* Guardian / Next of Kin */}
                    <div>
                        <h3 className="font-bold uppercase tracking-widest text-xs text-blue-600 mb-3 border-b pb-2">Guardian / Next of Kin</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-xs">Guardian Name</Label>
                                <Input name="guardianName" value={formData.guardianName} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Guardian Phone</Label>
                                <Input name="guardianPhone" value={formData.guardianPhone} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Next of Kin Name</Label>
                                <Input name="kinName" value={formData.kinName} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Next of Kin Phone</Label>
                                <Input name="kinPhone" value={formData.kinPhone} onChange={handleInputChange} />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Save Profile
                        </Button>
                    </div>
                </form>

            </DialogContent>
        </Dialog>
    );
}
