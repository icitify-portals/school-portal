import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getAdmissionTemplates } from "@/actions/admission_v2";
import { db } from "@/db/db";
import { admissionApplicationsV2 } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export default async function NewApplicationPage() {
    const session = await auth();
    if (!session || !session.user) {
        redirect("/login");
    }

    const applicantId = parseInt(session.user.id);

    // Check for existing draft application
    const existingApp = await db.query.admissionApplicationsV2.findFirst({
        where: eq(admissionApplicationsV2.applicantId, applicantId)
    });

    if (existingApp) {
        redirect(`/applicant/application/${existingApp.id}`);
    }

    // No existing app — pick first active template and create one
    const templates = await getAdmissionTemplates();
    if (templates.length === 0) {
        redirect("/admission?no_templates=1");
    }

    const [result] = await db.insert(admissionApplicationsV2).values({
        templateId: templates[0].id,
        applicantId: applicantId,
        status: 'draft',
        paymentStatus: 'pending'
    });

    redirect(`/applicant/application/${result.insertId}`);
}
