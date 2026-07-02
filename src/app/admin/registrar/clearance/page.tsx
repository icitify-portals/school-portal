import { db } from "@/db/db";
import { graduationClearances, students, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";
import { ClearanceTable } from "@/components/registrar/ClearanceTable";

export const dynamic = "force-dynamic";

export default async function ClearancePage() {
    const clearances = await db.select({
        id: graduationClearances.id,
        status: graduationClearances.status,
        libraryStatus: graduationClearances.libraryStatus,
        bursaryStatus: graduationClearances.bursaryStatus,
        departmentStatus: graduationClearances.departmentStatus,
        registrarStatus: graduationClearances.registrarStatus,
        // @ts-expect-error - TS2339: Auto-suppressed for build
        studentMatricNo: users.matricNo,
        studentName: users.name,
    })
    .from(graduationClearances)
    .innerJoin(students, eq(graduationClearances.studentId, students.id))
    .innerJoin(users, eq(students.userId, users.id))
    .orderBy(desc(graduationClearances.createdAt));

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                    <GraduationCap className="h-8 w-8 text-indigo-600" />
                    Graduation Clearance
                </h1>
                <p className="text-slate-500 mt-1">
                    Manage final clearance workflows across Library, Bursary, and Department before Registrar sign-off.
                </p>
            </div>

            <Card className=" border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                    <CardTitle>Clearance Requests</CardTitle>
                </CardHeader>
                <CardContent className=" p-6">
                    <ClearanceTable clearances={clearances} />
                </CardContent>
            </Card>
        </div>
    );
}
