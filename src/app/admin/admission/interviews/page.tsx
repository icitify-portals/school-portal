import { db } from "@/db/db";
import { admissionInterviews, admissionApplicationsV2, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Calendar } from "lucide-react";
import { InterviewTable } from "./interview-table";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function InterviewsPage() {
    const list = await db.select({
        id: admissionInterviews.id,
        applicationId: admissionInterviews.applicationId,
        interviewDate: admissionInterviews.interviewDate,
        mode: admissionInterviews.mode,
        locationOrLink: admissionInterviews.locationOrLink,
        status: admissionInterviews.status,
        score: admissionInterviews.score,
        notes: admissionInterviews.notes,
        interviewerName: users.name,
        applicationData: admissionApplicationsV2.formData,
        applicantPhoto: admissionApplicationsV2.applicantPhoto
    })
    .from(admissionInterviews)
    .innerJoin(admissionApplicationsV2, eq(admissionInterviews.applicationId, admissionApplicationsV2.id))
    .leftJoin(users, eq(admissionInterviews.interviewerId, users.id))
    .orderBy(desc(admissionInterviews.interviewDate));

    const formattedList = list.map(item => {
        let parsed = {};
        try { parsed = JSON.parse(item.applicationData || "{}"); } catch(e) {}
        return { ...item, parsedData: parsed as any };
    });

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <Calendar className="h-8 w-8 text-purple-600" />
                        Admission Interviews
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Schedule and score physical or virtual interviews for applicants.
                    </p>
                </div>
                {/* Note: A dialog to schedule an interview would typically go here */}
                <Button>Schedule Interview</Button>
            </div>

            <InterviewTable initialData={formattedList} />
        </div>
    );
}
