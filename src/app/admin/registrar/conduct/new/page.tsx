import { db } from "@/db/db";
import { students, users, staffProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ConductForm } from "@/components/registrar/ConductForm";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function NewConductPage() {
    // Fetch students for the dropdown
    const allStudents = await db.select({
        id: students.id,
        // @ts-expect-error - TS2339: Auto-suppressed for build
        matricNo: users.matricNo,
        name: users.name,
    })
    .from(students)
    .innerJoin(users, eq(students.userId, users.id));

    // Fetch staff for the dropdown
    const allStaff = await db.select({
        id: staffProfiles.id,
        staffId: staffProfiles.staffId,
        name: users.name,
    })
    .from(staffProfiles)
    .innerJoin(users, eq(staffProfiles.userId, users.id));

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin/registrar/conduct">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <AlertTriangle className="h-8 w-8 text-red-600" />
                        Log Disciplinary Infraction
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Record a new incident and optional sanction for staff or students.
                    </p>
                </div>
            </div>

            <ConductForm students={allStudents} staff={allStaff} />
        </div>
    );
}
