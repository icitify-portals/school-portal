import { getStudentHealthData } from "@/actions/health";
import { getStudentByUserId } from "@/actions/students";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { User, Heart } from "lucide-react";
import HealthRegistrationForm from "./form";

export default async function HealthRegistrationPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const studentData = await getStudentByUserId(parseInt(session.user.id));
    if (!studentData) redirect("/student");

    const healthRes = await getStudentHealthData(studentData.id);
    const health = healthRes.success ? healthRes.data : null;

    if (!health) {
        return <div className="p-8 text-center text-red-500">Failed to load health data.</div>;
    }

    return (
        <Card className="-100/50 border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Heart className="w-5 h-5 text-emerald-600" />
                    Medical Profile Registration
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <HealthRegistrationForm studentId={studentData.id} initialData={health} />
            </CardContent>
        </Card>
    );
}
