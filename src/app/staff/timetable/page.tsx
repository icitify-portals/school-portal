import { db } from "@/db/db";
import { academicSessions, departments, staffProfiles, courses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import TimetableManager from "../../admin/academics/timetable/TimetableManager";
import { getCourseAssignments, getDepartmentStaff, getTimetableSubmission, getDepartmentSettings, isUserHOD } from "@/actions/timetable";

export default async function StaffTimetablePage() {
    const session = await auth();
    if (!session) redirect("/login");

    const userRole = (session.user as any)?.role;
    if (userRole !== 'staff' && userRole !== 'admin' && userRole !== 'superadmin') {
        redirect("/staff/dashboard");
    }

    const [activeSession] = await db.select().from(academicSessions).where(eq(academicSessions.isCurrent, true)).limit(1);

    if (!activeSession) {
        return <div className="p-8">No active academic session found. Please set a primary session in Portal Settings.</div>;
    }

    // Determine department
    let deptId = null;
    const staffRows = await db.select().from(staffProfiles).where(eq(staffProfiles.userId, parseInt(session.user?.id as string))).limit(1);
    const staff = staffRows[0];
    deptId = staff?.departmentId;

    const depts = await db.select().from(departments);
    const allCourses = await db.select().from(courses);
    const initialStaff = deptId ? await getDepartmentStaff(deptId) : [];
    const initialAssignments = deptId ? await getCourseAssignments(deptId, activeSession.id, activeSession.currentSemester === '1' ? '1' : '2') : [];
    const initialSubmission = deptId ? await getTimetableSubmission(deptId, activeSession.id, activeSession.currentSemester === '1' ? '1' : '2') : null;
    const deptSettings = deptId ? await getDepartmentSettings(deptId) : null;
    const isHOD = deptId ? await isUserHOD(parseInt(session.user?.id as string), deptId) : false;

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Weekly Timetable</h1>
                <p className="text-slate-500 mt-1">Manage course assignments and weekly schedules for {activeSession.name}</p>
            </div>

            <TimetableManager
                session={activeSession}
                departments={depts}
                allCourses={allCourses}
                initialDeptId={deptId}
                initialStaff={initialStaff}
                initialAssignments={initialAssignments}
                initialSubmission={initialSubmission}
                deptSettings={deptSettings}
                userRole={userRole}
                userId={parseInt(session.user?.id as string)}
                isHOD={isHOD}
            />
        </div>
    );
}
