import { getStudentHealthData } from "@/actions/health";
import { getStudentByUserId } from "@/actions/students";
import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Thermometer, Weight, HeartPulse, Droplet, User, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { redirect } from "next/navigation";

export default async function HealthDashboardPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const studentData = await getStudentByUserId(parseInt(session.user.id));
    if (!studentData) redirect("/student");

    const healthRes = await getStudentHealthData(studentData.id);
    const health = healthRes.success ? healthRes.data : null;

    if (!health) {
        return <div className="p-8 text-center text-red-500">Failed to load health data.</div>;
    }

    const latestVitals = health.vitals?.[0];
    const statusColor =
        health.healthStatus === 'cleared' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
            health.healthStatus === 'flagged' ? 'bg-red-50 text-red-600 border-red-200' :
                'bg-amber-50 text-amber-600 border-amber-200';

    const StatusIcon =
        health.healthStatus === 'cleared' ? CheckCircle2 :
            health.healthStatus === 'flagged' ? AlertCircle : Clock;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className={`col-span-1 md:col-span-3 border-2 ${statusColor} shadow-none`}>
                <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <StatusIcon className="w-8 h-8" />
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-widest opacity-80">Health Clearance Status</h3>
                            <p className="text-2xl font-black capitalize">{health.healthStatus || 'Pending'}</p>
                        </div>
                    </div>
                    {health.healthNotes && (
                        <div className="bg-white/50 px-4 py-2 rounded-lg text-sm font-medium">
                            {health.healthNotes}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="border-none shadow-sm border border-slate-100/50">
                <CardHeader>
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <Droplet className="w-4 h-4 text-rose-500" /> Basic Info
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                        <span className="text-xs font-semibold text-slate-500">Blood Group</span>
                        <span className="font-bold text-slate-900">{health.bloodGroup || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                        <span className="text-xs font-semibold text-slate-500">Genotype</span>
                        <span className="font-bold text-slate-900">{health.genotype || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                        <span className="text-xs font-semibold text-slate-500">Allergies</span>
                        <span className="font-bold text-slate-900 text-right max-w-[150px] truncate" title={health.foodAllergies || 'N/A'}>
                            {health.foodAllergies || 'None'}
                        </span>
                    </div>
                </CardContent>
            </Card>

            <Card className="col-span-1 md:col-span-2 border-none shadow-sm border border-slate-100/50 bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Activity className="w-48 h-48" />
                </div>
                <CardHeader>
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                        <HeartPulse className="w-4 h-4" /> Latest Vitals Readout
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {latestVitals ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4 relative z-10">
                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Blood Pressure</p>
                                <p className="text-3xl font-black">{latestVitals.bloodPressure || '--'}</p>
                                <p className="text-xs text-slate-500 mt-1">mmHg</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Pulse</p>
                                <p className="text-3xl font-black text-rose-400">{latestVitals.pulse || '--'}</p>
                                <p className="text-xs text-slate-500 mt-1">bpm</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Temperature</p>
                                <p className="text-3xl font-black text-amber-400">{latestVitals.temperature || '--'}</p>
                                <p className="text-xs text-slate-500 mt-1">°C</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Weight</p>
                                <p className="text-3xl font-black text-emerald-400">{latestVitals.weight || '--'}</p>
                                <p className="text-xs text-slate-500 mt-1">kg</p>
                            </div>
                            <div className="col-span-full pt-4 border-t border-slate-800">
                                <p className="text-xs text-slate-500">
                                    Last recorded on {latestVitals.recordedAt ? new Date(latestVitals.recordedAt).toLocaleString() : 'N/A'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="py-12 text-center text-slate-400">
                            <Activity className="w-8 h-8 mx-auto mb-3 opacity-50" />
                            <p className="text-sm font-medium">No recent vitals recorded by the clinic.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
