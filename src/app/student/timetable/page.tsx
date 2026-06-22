import { auth } from "@/auth";
import { db } from "@/db/db";
import { students } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getStudentTimetable, getDepartmentSettings } from "@/actions/timetable";
import StudentTimetableGrid from "./StudentTimetableGrid";

export default async function StudentTimetablePage() {
    const session = await auth();
    if (!session) redirect("/login");

    const [student] = await db.select().from(students).where(eq(students.userId, parseInt(session.user?.id as string))).limit(1);

    if (!student) return <div className="p-8 text-center mt-20 font-bold text-slate-500">Student record not found.</div>;

    const timetable = await getStudentTimetable(student.id);
    const deptSettings = await getDepartmentSettings(student.deptId!);

    return (
        <div className="p-8 pb-20 max-w-[1600px] w-full mx-auto">
            <div className="mb-10">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase">My Timetable</h1>
                <p className="text-slate-500 mt-2 font-medium">Your personalized weekly schedule based on enrolled courses</p>
            </div>

            <StudentTimetableGrid initialData={timetable} deptSettings={deptSettings} />
        </div>
    );
}
