import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db/db";
import { timetableSlots, courseLecturers, staffProfiles, users, venues, courses } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { AttendanceSessionManager } from "@/components/AttendanceSessionManager";
import { StudentSeeder } from "@/components/StudentSeeder";
import { Calendar, Clock, MapPin, AlertCircle, Database } from "lucide-react";

export default async function StaffAttendancePage() {
    const session = await auth();
    if (!session?.user || (session.user as any).role === 'student') {
        redirect("/");
    }

    // Get staff profile
    const staffRows = await db.select().from(staffProfiles).where(eq(staffProfiles.userId, parseInt((session.user as any).id))).limit(1);
    const staff = staffRows[0];

    if (!staff) {
        return <div className="p-8 text-center bg-rose-50 text-rose-600 font-bold rounded-2xl">Staff profile not found.</div>;
    }

    // Fetch today's lectures for this staff
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[new Date().getDay()];

    const todayLecturesRaw = await db.select({
        slot: timetableSlots,
        assignment: courseLecturers,
        course: courses,
        venue: venues
    })
        .from(timetableSlots)
        .leftJoin(courseLecturers, eq(timetableSlots.courseLecturerId, courseLecturers.id))
        .leftJoin(courses, eq(courseLecturers.courseId, courses.id))
        .leftJoin(venues, eq(timetableSlots.venueId, venues.id))
        .where(eq(timetableSlots.day, today as any));

    // Assembly to match component expectations
    const todayLectures = todayLecturesRaw.map(l => ({
        ...l.slot,
        assignment: l.assignment ? { ...l.assignment, course: l.course } : null,
        venue: l.venue
    }));

    // Filter slots where assignment actually belongs to this staff
    const validLectures = todayLectures.filter(l => l.assignment && l.assignment.staffId === staff.id);

    return (
        <div className="p-8 max-w-[1600px] w-full mx-auto space-y-10">
            <header className="space-y-2">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase italic flex items-center gap-4">
                    <Calendar className="w-10 h-10 text-blue-600" /> Class Session Control
                </h1>
                <p className="text-slate-500 font-medium">Monitor and manage attendance for your scheduled lectures today.</p>
            </header>

            <div className="grid grid-cols-1 gap-10">
                {validLectures.length > 0 ? (
                    validLectures.map((lecture) => (
                        <AttendanceSessionManager key={lecture.id} slot={lecture as any} />
                    ))
                ) : (
                    <div className="py-20 flex flex-col items-center justify-center bg-white rounded-[3rem] border-4 border-dashed border-slate-100 text-center space-y-4">
                        <Clock className="w-16 h-16 text-slate-200" />
                        <div className="space-y-1">
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">No Lectures Scheduled Today</h3>
                            <p className="text-slate-400 font-bold text-sm">Take a breather, you have no sessions on your timetable for {today.toUpperCase()}.</p>
                        </div>
                    </div>
                )}
            </div>

            <StudentSeeder />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                <div className="p-8 bg-blue-50/50 rounded-[2.5rem] border border-blue-100 flex gap-6">
                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shrink-0">
                        <MapPin className="w-6 h-6" />
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest">Physical Classroom QR</h4>
                        <p className="text-xs font-bold text-slate-600 leading-relaxed">
                            For physical classes, project the QR code or print it for students to scan. The system validates student identity against their enrolled courses.
                        </p>
                    </div>
                </div>
                <div className="p-8 bg-indigo-50/50 rounded-[2.5rem] border border-indigo-100 flex gap-6">
                    <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shrink-0">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest">Online Attendance Rubric</h4>
                        <p className="text-xs font-bold text-slate-600 leading-relaxed">
                            Online sessions automatically track duration. A minimum percentage of "Time In" relative to lecture duration is required for full points.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
