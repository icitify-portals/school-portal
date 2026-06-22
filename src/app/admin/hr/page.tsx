import { getStaffProfiles } from "@/actions/hr";
import { getUsers } from "@/actions/rbac";
import { getDepartments } from "@/actions/departments";
import { StaffDirectoryClient } from "./StaffDirectoryClient";
import { auth } from "@/auth";

export default async function HRStaffDirectoryPage() {
    const session = await auth();
    const userRole = (session?.user as any)?.role?.toLowerCase() || "";

    const staff = await getStaffProfiles();
    const allUsers = await getUsers();
    const departments = await getDepartments();

    // Filter users who are not already staff
    const nonStaffUsers = allUsers.filter(u => !staff.some(s => s.userId === u.id) && u.role !== 'admin');

    return (
        <div className="p-8 bg-slate-50 min-h-screen">
            <StaffDirectoryClient
                initialStaff={staff}
                nonStaffUsers={nonStaffUsers}
                departments={departments}
                userRole={userRole}
            />
        </div>
    );
}
