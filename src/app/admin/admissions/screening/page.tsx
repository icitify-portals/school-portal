import { redirect } from "next/navigation";

// Legacy mockup dashboard retired — admission decisions live on the unified
// Post-UTME Screening console.
export default function LegacyAdmissionsScreeningPage() {
    redirect("/admin/admission/screening");
}
