"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { updateHealthRegistration } from "@/actions/health";
import { Loader2, CheckCircle } from "lucide-react";

export default function HealthRegistrationForm({ studentId, initialData }: { studentId: number, initialData: any }) {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        bloodGroup: initialData.bloodGroup || "",
        genotype: initialData.genotype || "",
        foodAllergies: initialData.foodAllergies || "",
        ailments: initialData.ailments || "",
        operations: initialData.operations || "",
        doctorName: initialData.doctorName || "",
        doctorPhone: initialData.doctorPhone || "",
        doctorAddress: initialData.doctorAddress || "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setSuccess(false);
        const res = await updateHealthRegistration(studentId, formData);
        if (res.success) {
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest border-b pb-2">Basic Medical Info</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Blood Group</label>
                            <input name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} placeholder="e.g. O+" className="w-full border border-slate-200 rounded-lg h-10 px-3 bg-slate-50" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Genotype</label>
                            <input name="genotype" value={formData.genotype} onChange={handleChange} placeholder="e.g. AA" className="w-full border border-slate-200 rounded-lg h-10 px-3 bg-slate-50" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Food & Drug Allergies</label>
                        <textarea name="foodAllergies" value={formData.foodAllergies} onChange={handleChange} placeholder="List any known allergies..." className="w-full border border-slate-200 rounded-lg p-3 bg-slate-50 h-24" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest border-b pb-2">Medical History</h3>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Chronic Ailments</label>
                        <textarea name="ailments" value={formData.ailments} onChange={handleChange} placeholder="Asthma, Diabetes, etc..." className="w-full border border-slate-200 rounded-lg p-3 bg-slate-50 h-20" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Past Operations / Surgeries</label>
                        <textarea name="operations" value={formData.operations} onChange={handleChange} placeholder="Appendicitis (2018)..." className="w-full border border-slate-200 rounded-lg p-3 bg-slate-50 h-20" />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest border-b pb-2">Primary Care Physician / Family Doctor</h3>
                <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Doctor's Name</label>
                        <input name="doctorName" value={formData.doctorName} onChange={handleChange} className="w-full border border-slate-200 rounded-lg h-10 px-3 bg-slate-50" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Doctor's Phone</label>
                        <input name="doctorPhone" value={formData.doctorPhone} onChange={handleChange} className="w-full border border-slate-200 rounded-lg h-10 px-3 bg-slate-50" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Clinic Address</label>
                        <input name="doctorAddress" value={formData.doctorAddress} onChange={handleChange} className="w-full border border-slate-200 rounded-lg h-10 px-3 bg-slate-50" />
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 px-8 font-bold text-white shadow-lg shadow-emerald-600/20">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Save Medical Profile"}
                </Button>
                {success && <span className="text-emerald-600 flex items-center gap-2 text-sm font-bold"><CheckCircle className="w-4 h-4" /> Profile updated successfully!</span>}
            </div>
        </form>
    );
}
