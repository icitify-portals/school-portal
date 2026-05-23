import { getStudentHealthData } from "@/actions/health";
import { getStudentByUserId } from "@/actions/students";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar, Clock, CheckCircle2, XCircle, AlertCircle, Plus, Stethoscope } from "lucide-react";
import AppointmentBookingForm from "./booking-form";
import { Badge } from "@/components/ui/badge";
import { revalidatePath } from "next/cache";

export default async function StudentAppointmentsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const studentData = await getStudentByUserId(parseInt(session.user.id));
    if (!studentData) redirect("/student");

    const healthRes = await getStudentHealthData(studentData.id);
    const health = healthRes.success ? healthRes.data : null;

    if (!health) {
        return <div className="p-8 text-center text-red-500">Failed to load health data.</div>;
    }

    const appointments = (health as any).appointments || [];

    const handleRefresh = async () => {
        "use server";
        revalidatePath("/student/health/appointments");
    };

    return (
        <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
                <Card className="border-none shadow-sm border border-slate-100/50 overflow-hidden">
                    <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/50">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-emerald-600" />
                            My Appointments
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {appointments.length === 0 ? (
                            <div className="p-20 text-center text-slate-400">
                                <Stethoscope className="w-16 h-16 mx-auto mb-4 opacity-10" />
                                <p className="font-bold uppercase tracking-widest text-xs italic">No appointments on record.</p>
                                <p className="text-sm mt-1">Book your first clinic visit using the form.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {appointments.map((appointment: any) => (
                                    <div key={appointment.id} className="p-6 flex items-start justify-between hover:bg-slate-50/50 transition-colors">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm text-center min-w-[70px]">
                                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">
                                                    {new Date(appointment.appointmentDate).toLocaleString('default', { month: 'short' })}
                                                </p>
                                                <p className="text-2xl font-black text-slate-900 leading-none">
                                                    {new Date(appointment.appointmentDate).getDate()}
                                                </p>
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-800 uppercase italic tracking-tight mb-1">Clinic Consultation</h4>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Clock className="w-3 h-3 text-slate-400" />
                                                    <span className="text-xs font-bold text-slate-500 italic">
                                                        {new Date(appointment.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                                                    "{appointment.reason}"
                                                </p>
                                                {appointment.doctorNotes && (
                                                    <div className="mt-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                                        <h5 className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-1 flex items-center gap-1">
                                                            <CheckCircle2 className="w-3 h-3" /> Doctor's Feedback
                                                        </h5>
                                                        <p className="text-sm font-medium text-emerald-800">{appointment.doctorNotes}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant="outline" className={cn(
                                                "uppercase tracking-widest text-[9px] font-black h-7 rounded-lg italic border",
                                                appointment.status === 'pending' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                                    appointment.status === 'approved' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                        appointment.status === 'completed' ? "bg-indigo-50 text-indigo-600 border-indigo-100" :
                                                            "bg-rose-50 text-rose-600 border-rose-100"
                                            )}>
                                                {appointment.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="md:col-span-1">
                <Card className="border-none shadow-sm border border-slate-100/50 sticky top-24 overflow-hidden rounded-[2.5rem]">
                    <CardHeader className="bg-emerald-600 text-white p-8">
                        <CardTitle className="text-lg flex items-center gap-3 font-black uppercase tracking-tight italic">
                            <Plus className="w-6 h-6" />
                            Schedule a Visit
                        </CardTitle>
                        <p className="text-[11px] text-emerald-100 font-medium italic">Book a session with the university medical officer.</p>
                    </CardHeader>
                    <CardContent className="p-8">
                        <AppointmentBookingForm studentId={studentData.id} onSuccess={handleRefresh} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
