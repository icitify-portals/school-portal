
import { db } from "@/db/db";
import { academicSessions, departments, staffProfiles, courses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import CourseAssignmentManager from "./CourseAssignmentManager";
import { getCourseAssignments, getDepartmentStaff, isUserHOD } from "@/actions/timetable";

export default async function CourseAssignmentsPage() {
    const session = await auth();
    if (!session) redirect("/login");

    const activeSessionResult = await db
        .select()
        .from(academicSessions)
        .where(eq(academicSessions.isCurrent, true))
        .limit(1);
    const activeSession = activeSessionResult[0];

    if (!activeSession) {
        return <div className="p-8">No active academic session found. Please set a primary session in Portal Settings.</div>;
    }

    // Determine department (if staff, limit to their dept)
    const userRole = (session.user as any)?.role;
    let deptId = null;

    if (userRole === 'staff') {
        const staffResult = await db
            .select({ departmentId: staffProfiles.departmentId })
            .from(staffProfiles)
            .where(eq(staffProfiles.userId, parseInt(session.user?.id as string)))
            .limit(1);
        deptId = staffResult[0]?.departmentId;
    }

    const depts = await db.select().from(departments);
    const allCourses = await db.select().from(courses);
    const initialStaff = deptId ? await getDepartmentStaff(deptId) : [];
    const initialAssignments = deptId ? await getCourseAssignments(deptId, activeSession.id, activeSession.currentSemester === '1' ? '1' : '2') : [];
    const isHOD = deptId ? await isUserHOD(parseInt(session.user?.id as string), deptId) : false;

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Course Assignments</h1>
                <p className="text-slate-500 mt-1">Manage lecturer allocations for {activeSession.name}</p>
            </div>

            <CourseAssignmentManager
                session={activeSession}
                departments={depts}
                allCourses={allCourses}
                initialDeptId={deptId}
                initialStaff={initialStaff}
                initialAssignments={initialAssignments}
                userRole={userRole}
                isHOD={isHOD}
            />
        </div>
    );
}
