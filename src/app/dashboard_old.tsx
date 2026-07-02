import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, GraduationCap, Calendar, Clock, Bell, Printer } from "lucide-react";

// Role-specific imports handled in component body

import { cn } from "@/lib/utils";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db/db";
import { academicSessions, students } from "@/db/schema";
import { eq } from "drizzle-orm";
import { AlertCircle, Plus, ChevronRight, MapPin, Wallet, Video } from "lucide-react";
import Link from "next/link";
import { getStudentDashboardStats } from "@/actions/dashboards";
import { getStudentTimetable } from "@/actions/timetable";
import { getActiveClassesForStudent } from "@/actions/live-class";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) redirect("/login");

  const role = (session.user as any)?.role;
  if (role === "admin") redirect("/admin/dashboard");
  if (role === "healthadmin") redirect("/healthadmin/dashboard");
  if (role === "dvc") redirect("/dvc/dashboard");

  let activeSession: any = null;
  let studentData: any = null;
  let studentStats: any = null;
  let timetableSlots: any[] = [];
  let activeClasses: any[] = [];

  try {
    const [sessionRes] = await db.select().from(academicSessions).where(eq(academicSessions.isCurrent, true)).limit(1);
    activeSession = sessionRes;

    const [studentRes] = await db.select().from(students).where(eq(students.userId, parseInt((session.user as any).id))).limit(1);
    studentData = studentRes;

    studentStats = await getStudentDashboardStats(parseInt((session.user as any).id));
    timetableSlots = await getStudentTimetable(studentData?.id || 0);
    activeClasses = await getActiveClassesForStudent(parseInt((session.user as any).id));
  } catch (error) {
    console.error("Dashboard data fetch error:", error);
  }

  return (
    <div className="p-8">
      {activeClasses.length > 0 && (
        <Card className="mb-8 -to-r from-red-600 to-rose-600 text-white overflow-hidden relative animate-in slide-in-from-top-4 border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Video className="w-24 h-24" />
          </div>
          <CardContent className="p-6 relative z-10 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-black uppercase italic tracking-tight flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                </span>
                Live Class in Progress
              </h3>
              <p className="text-red-100 font-medium mt-1">
                {activeClasses[0].title} is currently live. Join now to participate.
              </p>
            </div>
            <Link
              href={`/live/${activeClasses[0].courseId}/${activeClasses[0].id}`}
              className="bg-white text-red-600 px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-red-50 transition-colors shadow-lg"
            >
              Join Class
            </Link>
          </CardContent>
        </Card>
      )}

      {!activeSession && (
        <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-4 text-amber-700">
          <AlertCircle className="w-6 h-6 flex-shrink-0" />
          <p className="text-sm font-medium">The portal is currently in maintenance or between sessions. Some features may be limited.</p>
        </div>
      )}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back, {session.user?.name}</h2>
          <p className="text-slate-500 mt-1">{role === 'staff' ? 'Staff' : 'Student'} Portal Access</p>
        </div>
        <div className="flex gap-4">
          <button className="relative p-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
            <Bell className="w-5 h-5 text-slate-600" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          {activeSession && (
            <div className="flex items-center gap-4">
              <div className={cn(
                "px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest flex items-center gap-2",
                activeSession.isRegistrationOpen ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-rose-50 border-rose-100 text-rose-700"
              )}>
                <div className={cn("w-1.5 h-1.5 rounded-full", activeSession.isRegistrationOpen ? "bg-emerald-500" : "bg-rose-500")} />
                Registration {activeSession.isRegistrationOpen ? "Open" : "Closed"}
              </div>
              <div className={cn(
                "px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest flex items-center gap-2",
                activeSession.isAddDropOpen ? "bg-indigo-50 border-indigo-100 text-indigo-700" : "bg-slate-50 border-slate-100 text-slate-400"
              )}>
                <div className={cn("w-1.5 h-1.5 rounded-full", activeSession.isAddDropOpen ? "bg-indigo-500" : "bg-slate-300")} />
                Add/Drop {activeSession.isAddDropOpen ? "Active" : "Locked"}
              </div>
              <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-full border border-slate-200">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-slate-700">
                  {activeSession.currentSemester === '1' ? '1st' : '2nd'} Semester {activeSession.name}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {(studentStats?.isFinalYear || studentStats?.status === 'graduated') && (
        <Card className="mb-10 -to-r from-emerald-600 to-teal-600 text-white overflow-hidden relative group border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
            <GraduationCap className="w-32 h-32" />
          </div>
          <CardContent className="p-8 relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="space-y-2">
              <h3 className="text-2xl font-black italic uppercase tracking-tight">Programme Completion</h3>
              <p className="text-emerald-50 font-medium max-w-xl">
                Congratulations! You have reached the final stage of your academic programme. You can now view and print your academic record/statement of results for verification.
              </p>
            </div>
            <Link
              href={`/admin/exams-records/print/${studentStats?.studentId}`}
              target="_blank"
              className="bg-white text-emerald-600 px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-emerald-50 transition-all flex items-center gap-3 whitespace-nowrap"
            >
              Print Academic Record
              <Printer className="w-4 h-4" />
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          { name: "CGPA", value: (studentStats as any)?.cgpa || "0.00", icon: GraduationCap, bg: "bg-indigo-50", color: "text-indigo-600" },
          { name: "Total Credits", value: (studentStats as any)?.totalCredits || 0, icon: BookOpen, bg: "bg-blue-50", color: "text-blue-600" },
          { name: "Rank", value: (studentStats as any)?.rank ? `#${(studentStats as any).rank}` : "N/A", icon: Users, bg: "bg-emerald-50", color: "text-emerald-600" },
          { name: "Attendance", value: `${(studentStats as any)?.attendance || 0}%`, icon: Clock, bg: "bg-amber-50", color: "text-amber-600" },
        ].map((stat) => (
          <Card key={stat.name} className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6 p-6">
              <div className="flex items-center gap-4">
                <div className={cn("p-3 rounded-xl", stat.bg)}>
                  <stat.icon className={cn("w-6 h-6", stat.color)} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.name}</p>
                  <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {activeSession?.isAddDropOpen && (
        <Card className="mb-10 -to-r from-indigo-600 to-violet-600 text-white overflow-hidden relative group border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
            <BookOpen className="w-32 h-32" />
          </div>
          <CardContent className="p-8 relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="space-y-2">
              <h3 className="text-2xl font-black italic uppercase tracking-tight">Add/Drop Window is Open</h3>
              <p className="text-indigo-100 font-medium max-w-xl">
                The academic session's course adjustment window is currently active. You can request to add or remove courses for this semester until the window closes.
              </p>
            </div>
            <Link
              href="/student/registration/add-drop"
              className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-indigo-50 transition-all flex items-center gap-3 whitespace-nowrap"
            >
              Adjust My Courses
              <ChevronRight className="w-4 h-4" />
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <Card className="hover: transition- -100 group border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
          <Link href="/student/timetable">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">Timetable</h4>
                  <p className="text-xs text-slate-500">Class schedule</p>
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover: transition- -100 group border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
          <Link href="/student/finance">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">Finance</h4>
                  <p className="text-xs text-slate-500">Fees & Wallet</p>
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover: transition- -100 group border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
          <Link href="/results">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">Results</h4>
                  <p className="text-xs text-slate-500">Grades & CGPA</p>
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover: transition- -100 group border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
          <Link href="/student/cbt">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">CBT Exams</h4>
                  <p className="text-xs text-slate-500">Online Assessments</p>
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 overflow-hidden border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1">Learning Momentum</CardTitle>
              <CardDescription className="text-xl font-black text-slate-900 uppercase italic">Active Course Progress</CardDescription>
            </div>
            <Link
              href="/student/analytics"
              className="h-10 px-4 inline-flex items-center justify-center rounded-xl font-bold uppercase tracking-widest text-[9px] hover:bg-slate-100 text-slate-700 transition-colors"
            >
              Full Analytics <ChevronRight className="ml-1 w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {(studentStats as any)?.courseProgress?.length > 0 ? (
                (studentStats as any).courseProgress.slice(0, 3).map((course: any) => (
                  <div key={course.id} className="space-y-2 group">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{course.code}</p>
                        <h4 className="text-sm font-black text-slate-800 uppercase italic tracking-tight group-hover:text-indigo-600 transition-colors line-clamp-1">{course.name}</h4>
                      </div>
                      <span className="text-xs font-black text-slate-900 italic uppercase">{course.percentage.toFixed(0)}%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner relative">
                      <div
                        className="h-full bg-indigo-500 transition-all duration-1000 group-hover:bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.2)]"
                        style={{ width: `${course.percentage}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center">
                  <BookOpen className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No active progress recorded.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1">Upcoming</CardTitle>
            <CardDescription className="text-xl font-black text-slate-900 uppercase italic">Schedule Summary</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {timetableSlots.length > 0 ? (
                timetableSlots.slice(0, 3).map((slot: any, idx) => (
                  <div key={idx} className="flex flex-col gap-1 p-3 rounded-2xl bg-slate-50 hover:bg-indigo-50 transition-colors group">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">{slot.day}</span>
                      <span className="text-[9px] font-bold text-slate-400">{slot.startTime}</span>
                    </div>
                    <p className="text-xs font-black text-slate-800 uppercase italic truncate">{slot.assignment?.course?.code}</p>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 italic">Clear Schedule</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
      </div>
    </div>
  );
}

// Inline helper for dashboard page
