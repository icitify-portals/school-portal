
import { db } from "@/db/db";
import { academicSessions, departments, faculties, staffProfiles, courses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import CourseAssignmentManager from "./CourseAssignmentManager";
import { getCourseAssignments, getDepartmentStaff, isUserHOD, getAllStaff, getAllCourseAssignmentsForSession, getDepartmentCourses } from "@/actions/timetable";

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
        return <div className="p-8 text-center text-slate-500">No active academic session found. Please set a primary session in Portal Settings.</div>;
    }

    const userRole = (session.user as any)?.role;
    let deptId: number | null = null;

    if (userRole === 'staff' || userRole === 'hod') {
        const staffResult = await db
            .select({ departmentId: staffProfiles.departmentId })
            .from(staffProfiles)
            .where(eq(staffProfiles.userId, parseInt(session.user?.id as string)))
            .limit(1);
        deptId = staffResult[0]?.departmentId || null;
    }

    const semester = activeSession.currentSemester === '1' ? '1' : '2' as '1' | '2';

    const [depts, allFaculties, allStaff, allAssignments, initialDeptCourses] = await Promise.all([
        db.select().from(departments),
        db.select().from(faculties),
        (userRole === 'admin' || userRole === 'superadmin') ? getAllStaff() : (deptId ? getDepartmentStaff(deptId) : []),
        (userRole === 'admin' || userRole === 'superadmin')
            ? getAllCourseAssignmentsForSession(activeSession.id, semester)
            : (deptId ? getCourseAssignments(deptId, activeSession.id, semester) : []),
        deptId ? getDepartmentCourses(deptId) : []
    ]);

    const isHOD = deptId ? await isUserHOD(parseInt(session.user?.id as string), deptId) : false;

    return (
        <CourseAssignmentManager
            session={activeSession}
            departments={depts}
            faculties={allFaculties}
            allStaff={allStaff}
            initialDeptId={deptId}
            initialAssignments={allAssignments}
            initialDeptCourses={initialDeptCourses}
            userRole={userRole}
            isHOD={isHOD}
        />
    );
}
