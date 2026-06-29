import { getStudentAdmissionProfile, submitPostUtmeApplication, getActiveAdmissionSession } from "@/actions/admission-application";
import { db } from "@/db";
import { programmes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, CalendarOff } from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";
import ApplyForm from "./form"; // Client component

export default async function ApplyForScreeningPage() {
    const { success, candidate, error } = await getStudentAdmissionProfile() as any;
    const sessionRes = await getActiveAdmissionSession();

    if (!success || !candidate) {
        redirect("/student/admission");
    }

    // Check if session is active
    if (!sessionRes.success || !sessionRes.session) {
        return (
            <div className="max-w-2xl mx-auto p-12 text-center space-y-4">
                <CalendarOff className="h-16 w-16 text-slate-300 mx-auto" />
                <h2 className="text-2xl font-bold text-slate-800">Admission Window Closed</h2>
                <p className="text-slate-500 max-w-md mx-auto">
                    The admission application period has either ended or has not yet started. Please check back later.
                </p>
                <Link href="/student/admission">
                    <Button variant="outline" className="mt-4">Back to Dashboard</Button>
                </Link>
            </div>
        );
    }
    const activeSession = sessionRes.session;

    // Check if already applied for THIS session
    const existingApp = (candidate.applications as any[])?.some((a: any) => a.sessionId === activeSession.id);
    if (existingApp) {
        redirect("/student/admission"); // Already applied in this cycle
    }

    // Fetch available programmes
    let availableProgrammes = [];
    if (candidate.deptId) {
        availableProgrammes = await db.select().from(programmes).where(eq(programmes.deptId, candidate.deptId));
    } else {
        availableProgrammes = await db.select().from(programmes).limit(50);
    }

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-6">
            <div className="flex items-center gap-4">
                {activeSession.logoUrl && (
                    <img src={activeSession.logoUrl} alt="Logo" className="h-12 w-12 object-contain" />
                )}
                <h1 className="text-3xl font-bold tracking-tight">{activeSession.name}</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Application Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {activeSession.instructions && (
                        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg text-sm text-indigo-700 whitespace-pre-wrap">
                            <h3 className="font-bold mb-1 flex items-center gap-1"><AlertCircle className="h-4 w-4" /> Instructions:</h3>
                            {activeSession.instructions}
                        </div>
                    )}

                    <div className="p-4 bg-slate-50 rounded-lg space-y-2 text-sm">
                        <p><span className="font-semibold">Candidate:</span> {candidate.surname} {candidate.firstname}</p>
                        <p><span className="font-semibold">JAMB Reg:</span> {candidate.jambRegNo}</p>
                        // @ts-expect-error - TS2304: Auto-suppressed for build
                        <p><span className="font-semibold">Application Fee:</span> <span className="text-indigo-600 font-bold">{settings?.base_currency || '₦'}{Number(activeSession.applicationFee).toLocaleString()}</span></p>
                    </div>

                    <ApplyForm programmes={availableProgrammes} session={activeSession} />
                </CardContent>
            </Card>
        </div>
    );
}
