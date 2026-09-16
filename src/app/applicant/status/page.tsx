import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db/db";
import { admissionApplicationsV2 } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function ApplicantStatusRedirect() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login");
    }

    const userId = parseInt(session.user.id);

    // Find the latest application for this user
    const [app] = await db.select()
        .from(admissionApplicationsV2)
        .where(eq(admissionApplicationsV2.applicantId, userId))
        .orderBy(desc(admissionApplicationsV2.appliedAt))
        .limit(1);

    if (app) {
        redirect(`/admission/status/${app.id}`);
    } else {
        // If no application exists, just go to dashboard
        redirect("/applicant");
    }
}
