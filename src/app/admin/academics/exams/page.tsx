import { db } from "@/db/db";
import { academicSessions, departments, staffProfiles, courses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ExamManager from "./ExamManager";
import { getDepartmentStaff, isUserHOD } from "@/actions/timetable";
import { getExamTimetableSubmissions } from "@/actions/timetable-exams";

export default async function ExamsTimetablePage() {
    const session = await auth();
    if (!session) redirect("/login");

    const [activeSession] = await db.select().from(academicSessions).where(eq(academicSessions.isCurrent, true)).limit(1);

    if (!activeSession) {
        return <div className="p-8">No active academic session found. Please set a primary session in Portal Settings.</div>;
    }

    const userRole = (session.user as any)?.role;
    let deptId = null;

    if (userRole === 'staff') {
        const staffRows = await db.select().from(staffProfiles).where(eq(staffProfiles.userId, parseInt(session.user?.id as string))).limit(1);
        const staff = staffRows[0];
        deptId = staff?.departmentId;
    }

    const depts = await db.select().from(departments);
    const allCourses = await db.select().from(courses);
    const initialStaff = deptId ? await getDepartmentStaff(deptId) : [];
    
    // Initial fetch for the exam submission
    let initialSubmission = null;
    if (deptId) {
        const res = await getExamTimetableSubmissions(deptId, activeSession.id, activeSession.currentSemester === '1' ? '1' : '2');
        if (res.success && res.data) {
            initialSubmission = res.data;
        }
    }

    const isHOD = deptId ? await isUserHOD(parseInt(session.user?.id as string), deptId) : false;

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Exam Timetable</h1>
                <p className="text-slate-500 mt-1">Manage exam dates and invigilator assignments for {activeSession.name}</p>
            </div>

            <ExamManager
                session={activeSession}
                departments={depts}
                allCourses={allCourses}
                initialDeptId={deptId}
                initialStaff={initialStaff}
                initialSubmission={initialSubmission}
                userRole={userRole}
                userId={parseInt(session.user?.id as string)}
                isHOD={isHOD}
            />
        </div>
    );
}
