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
import { updateStaffProfile } from "@/actions/hr";

interface StaffProfileEditorModalProps {
    staff: any | null;
    departments: any[];
    onClose: () => void;
    onUpdate?: () => void;
}

export function StaffProfileEditorModal({ staff, departments, onClose, onUpdate }: StaffProfileEditorModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<any>({});

    // Initialize form data when staff changes
    if (staff && Object.keys(formData).length === 0 && !loading) {
        setFormData({
            title: staff.title || "",
            jobTitle: staff.jobTitle || "",
            departmentId: staff.departmentId || "",
            gradeLevel: staff.gradeLevel || "",
            gender: staff.gender || "",
            pencomNo: staff.pencomNo || "",
            pfa: staff.pfa || "",
            ippisNo: staff.ippisNo || "",
            bankName: staff.bankName || "",
            accountName: staff.accountName || "",
            accountNumber: staff.accountNumber || "",
            stateOfOrigin: staff.stateOfOrigin || "",
            lga: staff.lga || "",
            nin: staff.nin || ""
        });
    }

    if (!staff) return null;

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
        if (dataToSubmit.departmentId) {
            dataToSubmit.departmentId = parseInt(dataToSubmit.departmentId);
        }

        const res = await updateStaffProfile(staff.userId, dataToSubmit);
        if (res.success) {
            onUpdate?.();
            onClose();
        } else {
            alert(res.error);
        }
        setLoading(false);
    };

    return (
        <Dialog open={!!staff} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Edit Staff Profile</DialogTitle>
                    <DialogDescription>
                        Update human resources and payroll records for {staff.user?.name}.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    
                    {/* Basic Info */}
                    <div>
                        <h3 className="font-bold uppercase tracking-widest text-xs text-blue-600 mb-3 border-b pb-2">Basic Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-xs">Title</Label>
                                <Input name="title" value={formData.title} onChange={handleInputChange} placeholder="e.g. Mr, Mrs, Dr, Prof" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Job Title</Label>
                                <Input name="jobTitle" value={formData.jobTitle} onChange={handleInputChange} required />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Department</Label>
                                <select 
                                    name="departmentId" 
                                    value={formData.departmentId} 
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
                                <Label className="text-xs">Grade Level</Label>
                                <select 
                                    name="gradeLevel" 
                                    value={formData.gradeLevel} 
                                    onChange={handleInputChange}
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="">Select Level</option>
                                    {['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9', 'L10', 'L11', 'L12', 'L13', 'L14', 'L15'].map(l => (
                                        <option key={l} value={l}>{l}</option>
                                    ))}
                                </select>
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
                        </div>
                    </div>

                    {/* Payroll & Pension */}
                    <div>
                        <h3 className="font-bold uppercase tracking-widest text-xs text-blue-600 mb-3 border-b pb-2">Payroll & Pension</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <Label className="text-xs">IPPIS Number</Label>
                                <Input name="ippisNo" value={formData.ippisNo} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Pencom Number</Label>
                                <Input name="pencomNo" value={formData.pencomNo} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">PFA (Pension Fund Admin)</Label>
                                <Input name="pfa" value={formData.pfa} onChange={handleInputChange} />
                            </div>
                        </div>
                    </div>

                    {/* Banking */}
                    <div>
                        <h3 className="font-bold uppercase tracking-widest text-xs text-blue-600 mb-3 border-b pb-2">Banking Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <Label className="text-xs">Bank Name</Label>
                                <Input name="bankName" value={formData.bankName} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Account Name</Label>
                                <Input name="accountName" value={formData.accountName} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Account Number</Label>
                                <Input name="accountNumber" value={formData.accountNumber} onChange={handleInputChange} />
                            </div>
                        </div>
                    </div>

                    {/* Personal / State */}
                    <div>
                        <h3 className="font-bold uppercase tracking-widest text-xs text-blue-600 mb-3 border-b pb-2">Personal & Origin</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <Label className="text-xs">State of Origin</Label>
                                <Input name="stateOfOrigin" value={formData.stateOfOrigin} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">LGA</Label>
                                <Input name="lga" value={formData.lga} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">NIN</Label>
                                <Input name="nin" value={formData.nin} onChange={handleInputChange} />
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
