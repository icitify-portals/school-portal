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
            redirect("/super-admin/dashboard");
        case 'admin':
            redirect("/admin/dashboard");
        case 'staff':
            redirect("/staff/dashboard");
        case 'student':
            redirect("/student/dashboard");
        case 'parent':
            redirect("/parent/dashboard");
        case 'dvc':
            redirect("/admin/dashboard"); // DVCs use admin dashboard in this system
        default:
            redirect("/");
    }
}
