import { auth } from "@/auth";
import { redirect } from "next/navigation";

/**
 * Universal /dashboard redirector
 * Ensures any link to /dashboard goes to the role-specific dashboard.
 */
export default async function DashboardRedirectPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    const role = (session.user as any).role;

    switch (role) {
        case 'superadmin':
        case 'icitify_dev':
            redirect("/super-admin/dashboard");
        case 'admin':
            redirect("/admin/dashboard");
        case 'staff':
            redirect("/staff/dashboard");
        case 'student':
            redirect("/student");
        case 'parent':
            redirect("/parent/dashboard");
        case 'dvc':
            redirect("/dvc/dashboard");
        case 'bursar':
            redirect("/admin/bursary"); // Task-bounded Bursar Finance Dashboard
        case 'registrar':
        case 'admission_officer':
            redirect("/admin/admission"); // Task-bounded Registrar & Admission Dashboard
        case 'librarian':
            redirect("/admin/library"); // Task-bounded Librarian & Journal Dashboard
        case 'healthadmin':
            redirect("/healthadmin/dashboard"); // Task-bounded Health Admin Dashboard
        case 'fresher':
            redirect("/fresher"); // Task-bounded Admitted Fresher Portal
        case 'applicant':
            redirect("/admission"); // Intake Portal for Applicants
        case 'hod':
            redirect("/admin/hod"); // Dedicated Standalone HOD Workspace
        case 'dean':
            redirect("/admin/dean"); // Dedicated Standalone Dean Workspace
        default:
            redirect("/");
    }
}
