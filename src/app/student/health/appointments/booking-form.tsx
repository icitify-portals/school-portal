"use client";

import { useState } from "react";
import { bookAppointment } from "@/actions/health";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

export default function AppointmentBookingForm({ studentId, onSuccess }: { studentId: number, onSuccess: () => void }) {
    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [reason, setReason] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!date || !time || !reason) {
            toast.error("Please fill all fields");
            return;
        }

        setLoading(true);
        const appointmentDate = new Date(`${date}T${time}`);

        const res = await bookAppointment({
            studentId,
            appointmentDate,
            reason
        });

        if (res.success) {
            toast.success("Appointment booked successfully");
            setDate("");
            setTime("");
            setReason("");
            onSuccess();
        } else {
            toast.error(res.error || "Failed to book appointment");
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Preferred Date</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="pl-10 h-10 border-slate-100 focus:ring-emerald-500 rounded-xl font-medium"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Preferred Time</label>
                    <div className="relative">
                        <Clock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <Input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="pl-10 h-10 border-slate-100 focus:ring-emerald-500 rounded-xl font-medium"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Reason for Visit</label>
                <Textarea
                    placeholder="Describe your symptoms or reason for the appointment..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="min-h-[120px] border-slate-100 focus:ring-emerald-500 rounded-2xl p-4 font-medium"
                />
            </div>

            <Button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-[10px] h-12 rounded-2xl shadow-lg shadow-emerald-100 gap-2"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Confirm Appointment Request
            </Button>
            <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-widest italic">
                Note: All requests are subject to clinic availability and officer approval.
            </p>
        </form>
    );
}
