import { getStudentHealthData } from "@/actions/health";
import { getStudentByUserId } from "@/actions/students";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { HeartPulse, Activity } from "lucide-react";

export default async function VitalsHistoryPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const studentData = await getStudentByUserId(parseInt(session.user.id));
    if (!studentData) redirect("/student");

    const healthRes = await getStudentHealthData(studentData.id);
    const health = healthRes.success ? healthRes.data : null;

    if (!health) {
        return <div className="p-8 text-center text-red-500">Failed to load health data.</div>;
    }

    const vitals = health.vitals || [];

    return (
        <Card className="border-none shadow-sm border border-slate-100/50 max-w-4xl mx-auto">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="text-lg flex items-center gap-2">
                    <HeartPulse className="w-5 h-5 text-emerald-600" />
                    Vitals History
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-[10px] font-extrabold uppercase tracking-widest border-b border-slate-100">
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">BP (mmHg)</th>
                                <th className="px-6 py-4">Pulse (bpm)</th>
                                <th className="px-6 py-4">Temp (°C)</th>
                                <th className="px-6 py-4">Weight (kg)</th>
                                <th className="px-6 py-4">Restpiration</th>
                                <th className="px-6 py-4">SpO2 (%)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {vitals.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center text-slate-400">
                                        <Activity className="w-8 h-8 mx-auto mb-3 opacity-20" />
                                        <p className="text-sm">No vital signs have been recorded yet.</p>
                                    </td>
                                </tr>
                            ) : (
                                vitals.map((vital: any) => (
                                    <tr key={vital.id} className="hover:bg-slate-50/50">
                                        <td className="px-6 py-4 text-sm font-medium text-slate-900">
                                            {new Date(vital.recordedAt).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-700">{vital.bloodPressure || '-'}</td>
                                        <td className="px-6 py-4 text-rose-600 font-bold">{vital.pulse || '-'}</td>
                                        <td className="px-6 py-4 text-amber-600 font-bold">{vital.temperature || '-'}</td>
                                        <td className="px-6 py-4 text-emerald-600 font-bold">{vital.weight || '-'}</td>
                                        <td className="px-6 py-4 text-indigo-600 font-bold">{vital.respiratoryRate || '-'}</td>
                                        <td className="px-6 py-4 font-bold">{vital.oxygenSaturation || '-'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
