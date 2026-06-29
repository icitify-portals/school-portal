import { db } from "@/db/db";
import { students, users, graduationClearances, departments } from "@/db/schema";
import { eq, desc, inArray, or } from "drizzle-orm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, GraduationCap } from "lucide-react";
import { AlumniTransitionTable } from "@/components/registrar/AlumniTransitionTable";

export const dynamic = "force-dynamic";

export default async function AlumniPage() {
    const studentData = await db.select({
        id: students.id,
        status: students.status,
        isProfileLocked: students.isProfileLocked,
        // @ts-expect-error - TS2339: Auto-suppressed for build
        studentMatricNo: users.matricNo,
        studentName: users.name,
        departmentName: departments.name,
        clearanceStatus: graduationClearances.status,
    })
    .from(students)
    .innerJoin(users, eq(students.userId, users.id))
    .leftJoin(departments, eq(students.deptId, departments.id))
    .leftJoin(graduationClearances, eq(students.id, graduationClearances.studentId))
    .where(
        or(
            eq(graduationClearances.status, 'cleared'),
            eq(students.status, 'graduated')
        )
    )
    .orderBy(desc(students.id));

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                    <Users className="h-8 w-8 text-blue-600" />
                    Alumni Registry Transition
                </h1>
                <p className="text-slate-500 mt-1">
                    Transition cleared students to Alumni status, locking their academic and financial profiles.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Cleared Students & Alumni</CardTitle>
                </CardHeader>
                <CardContent>
                    <AlumniTransitionTable students={studentData} />
                </CardContent>
            </Card>
        </div>
    );
}
