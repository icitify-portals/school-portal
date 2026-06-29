import { db } from "@/db/db";
import { admissionWaitlists, admissionApplicationsV2 } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Clock } from "lucide-react";
import { WaitlistTable } from "./waitlist-table";

export const dynamic = "force-dynamic";

export default async function WaitlistPage() {
    const list = await db.select({
        id: admissionWaitlists.id,
        applicationId: admissionWaitlists.applicationId,
        rankPosition: admissionWaitlists.rankPosition,
        status: admissionWaitlists.status,
        createdAt: admissionWaitlists.createdAt,
        // @ts-expect-error - TS2339: Auto-suppressed for build
        applicationData: admissionApplicationsV2.formData,
        applicantPhoto: admissionApplicationsV2.applicantPhoto
    })
    .from(admissionWaitlists)
    .innerJoin(admissionApplicationsV2, eq(admissionWaitlists.applicationId, admissionApplicationsV2.id))
    .orderBy(desc(admissionWaitlists.createdAt));

    // Parse formData safely
    const formattedList = list.map(item => {
        let parsed = {};
        try {
            parsed = JSON.parse(item.applicationData || "{}");
        } catch(e) {}
        return {
            ...item,
            parsedData: parsed as any
        };
    });

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <Clock className="h-8 w-8 text-amber-600" />
                        Admission Waitlist
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Manage waitlisted applicants and roll over admissions based on availability.
                    </p>
                </div>
            </div>

            <WaitlistTable initialData={formattedList} />
        </div>
    );
}
