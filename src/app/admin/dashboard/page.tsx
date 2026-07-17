import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
    Users,
    Home,
    BookOpen,
    GraduationCap,
    TrendingUp,
    AlertCircle,
    UserCheck,
    Shield,
    Brain,
    Wallet,
    Landmark,
    Award,
    Calendar,
    Settings2,
    ClipboardList,
    Briefcase,
    ShieldAlert,
    BookMarked,
    ScrollText,
    Zap,
    Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { db } from "@/db/db";
import { users, departments, programmes, courses, students, jambCandidates, admissionSessions, academicSessions, faculties, institutionalUnits } from "@/db/schema";
import { count, eq, and, desc, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import ActiveStudentsModal from "./_components/ActiveStudentsModal";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
    const cookieStore = await cookies();
    const activeUnitIdStr = cookieStore.get("activeUnitId")?.value;
    let isK12 = false;
    if (activeUnitIdStr) {
        const unitId = Number(activeUnitIdStr);
        try {
            const unitData = await db.select().from(institutionalUnits).where(eq(institutionalUnits.id, unitId)).limit(1);
            if (unitData[0]?.academicTier === "k12") {
                isK12 = true;
            }
        } catch (err) {
            console.error("Dashboard failed to fetch branch academicTier:", err);
        }
    }

    let statsData: any[] = [[], [], [], [], [], [], [], [], []];
    let activeStudentsBreakdown: any[] = [];
    try {
        statsData = await Promise.all([
            db.select({ value: count() }).from(students),
            db.select({ value: count() }).from(departments),
            db.select({ value: count() }).from(programmes),
            db.select({ value: count() }).from(courses),
            db.select({ value: count() }).from(jambCandidates),
            db.select({ value: count() }).from(users).where(eq(users.role, 'staff')),
            db.select({ value: count() }).from(admissionSessions).where(eq(admissionSessions.isActive, true)),
            db.select().from(academicSessions).where(eq(academicSessions.isCurrent, true)).limit(1),
            db.select({ value: count() }).from(faculties),
            db.select({ value: count() }).from(students).where(eq(students.status, 'active')),
            db.select({ value: count() }).from(students).where(eq(students.status, 'graduated')),
        ]);

        const breakdownResult = await db.execute(sql`
            SELECT p.name AS programme, COUNT(s.id) AS student_count 
            FROM students s 
            JOIN programmes p ON s.programme_id = p.id 
            WHERE s.status = 'active' 
            GROUP BY p.name 
            ORDER BY student_count DESC
        `);
        activeStudentsBreakdown = breakdownResult[0] as any[];
    } catch (error) {
        console.error("Admin dashboard stats fetch error:", error);
    }

    const activeAcademicSession = statsData[7]?.[0];
    const facultyCount = statsData[8]?.[0]?.value.toString() || "0";
    const programmeCount = statsData[2]?.[0]?.value.toString() || "0";
    const totalStudentCount = statsData[0]?.[0]?.value.toString() || "0";
    const activeStudentCount = statsData[9]?.[0]?.value.toString() || "0";
    const graduatedStudentCount = statsData[10]?.[0]?.value.toString() || "0";

    const adminStats = [
        { name: "Total Enrolled", value: totalStudentCount, icon: Users, color: "text-slate-600", bg: "bg-gradient-to-br from-slate-500 to-slate-600", href: "/admin/students", colSpan: "md:col-span-1 xl:col-span-1" },
        { name: "Active Students", value: activeStudentCount, icon: UserCheck, color: "text-emerald-600", bg: "bg-gradient-to-br from-emerald-500 to-emerald-600", href: "/admin/students?filter=active", colSpan: "md:col-span-1 xl:col-span-1" },
        { name: "Graduated", value: graduatedStudentCount, icon: GraduationCap, color: "text-indigo-600", bg: "bg-gradient-to-br from-indigo-500 to-indigo-600", href: "/admin/students?filter=graduated", colSpan: "md:col-span-1 xl:col-span-1" },
        { name: "Total Staff", value: statsData[5]?.[0]?.value.toString() || "0", icon: Users, color: "text-emerald-600", bg: "bg-gradient-to-br from-emerald-500 to-emerald-600", href: "/admin/hr", colSpan: "md:col-span-1 xl:col-span-1" },
        { name: "Faculties", value: facultyCount, icon: Award, color: "text-rose-600", bg: "bg-gradient-to-br from-rose-500 to-rose-600", href: "/admin/faculties", colSpan: "md:col-span-1 xl:col-span-1" },
        { name: "Programmes", value: programmeCount, icon: BookOpen, color: "text-amber-600", bg: "bg-gradient-to-br from-amber-500 to-amber-600", href: "/admin/programmes", colSpan: "md:col-span-1 xl:col-span-1" },
        { name: "Depts & Units", value: statsData[1]?.[0]?.value.toString() || "0", icon: Home, color: "text-emerald-600", bg: "bg-gradient-to-br from-emerald-500 to-emerald-600", href: "/admin/departments", colSpan: "md:col-span-1 xl:col-span-1" },
        { name: "Active Admissions", value: statsData[6]?.[0]?.value.toString() || "0", icon: UserCheck, color: "text-purple-600", bg: "bg-gradient-to-br from-purple-500 to-purple-600", href: "/admin/admission", colSpan: "md:col-span-2 xl:col-span-2" },
    ];
    return (
        <div className="p-4 md:p-6 max-w-[1600px] w-full mx-auto space-y-6">
            {!activeAcademicSession && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-3xl flex items-center gap-4 text-rose-700 animate-pulse shadow-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <div>
                        <p className="font-black uppercase text-xs tracking-widest">System Warning: Primary Session Missing</p>
                        <p className="text-sm font-medium">No academic session is currently set as "Primary". This may prevent students from registering or viewing portal data. <Link href="/admin/settings/portal" className="underline font-black">Fix now</Link></p>
                    </div>
                </div>
            )}
            
            {/* Bento Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 p-8 rounded-[2rem] shadow-xl text-white">
                <div>
                    <h2 className="text-4xl font-black tracking-tighter">Admin Command Center</h2>
                    <p className="text-slate-400 font-medium text-sm mt-1 max-w-lg leading-relaxed">System-wide monitoring, academic configurations, and administrative oversight.</p>
                </div>
                <div className="flex flex-col gap-3">
                    {activeAcademicSession && (
                        <div className="px-4 py-2 bg-indigo-500/20 text-indigo-300 rounded-2xl border border-indigo-500/30 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span className="text-xs font-black uppercase tracking-widest">Active Session: {activeAcademicSession.name}</span>
                        </div>
                    )}
                    <div className="px-4 py-2 bg-white/10 backdrop-blur-md text-emerald-400 rounded-2xl border border-white/10 flex items-center gap-2">
                        <Activity className="w-4 h-4 animate-pulse" />
                        <span className="text-xs font-black uppercase tracking-widest">System Stable</span>
                    </div>
                </div>
            </div>

            {/* Bento Grid: Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[140px]">
                {adminStats.map((stat, idx) => {
                    const CardElement = (
                        <Card className="border-none shadow-sm hover:shadow-xl transition-all duration-300 h-full w-full overflow-hidden relative group rounded-3xl bg-white">
                            <div className={cn("absolute inset-0 opacity-[0.03] group-hover:opacity-10 transition-opacity z-0", stat.bg)} />
                            <CardContent className="p-6 h-full flex flex-col justify-center relative z-10">
                                <div className="flex items-center gap-5">
                                    <div className={cn("p-4 rounded-[1.25rem] shadow-sm text-white", stat.bg)}>
                                        <stat.icon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-400 tracking-widest uppercase mb-1">{stat.name}</p>
                                        <h3 className={cn("font-black text-slate-900 tracking-tighter", stat.colSpan.includes("2") ? "text-5xl" : "text-3xl")}>{stat.value}</h3>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );

                    return stat.name === "Active Students" ? (
                        <div key={stat.name} className={stat.colSpan}>
                            <ActiveStudentsModal breakdown={activeStudentsBreakdown}>
                                {CardElement}
                            </ActiveStudentsModal>
                        </div>
                    ) : stat.href ? (
                        <Link key={stat.name} href={stat.href} className={cn("block group active:scale-95 transition-transform", stat.colSpan)}>
                            {CardElement}
                        </Link>
                    ) : (
                        <div key={stat.name} className={stat.colSpan}>{CardElement}</div>
                    );
                })}
            </div>

            {/* Bento Grid: Management Hub & System Health */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
                <div className="xl:col-span-3 space-y-4">
                    <div className="flex items-center gap-3 px-2">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Management Tools</h3>
                        <div className="h-px bg-slate-200 flex-1"></div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {[
                            { title: "User Management", desc: "Manage all users & bulk import", href: "/admin/users", icon: Users, color: "bg-blue-600" },
                            { title: "Admission Desk", desc: "Screening & applications", href: "/admin/admission", icon: UserCheck, color: "bg-emerald-600" },
                            { title: "CBT Assessments", desc: "Advanced Quiz & Exam Engine", href: "/admin/cbt", icon: Brain, color: "bg-purple-600" },
                            { title: "Human Resources", desc: "Staff, Payroll & Performance", href: "/admin/hr", icon: Users, color: "bg-indigo-600" },
                            { title: "Bursary & Finance", desc: "Fees, Allocations & Inflows", href: "/admin/bursary", icon: Wallet, color: "bg-amber-600" },
                            { title: "Accounting Center", desc: "Ledgers, CoAs & Reports", href: "/admin/accounting", icon: Landmark, color: "bg-slate-700" },
                            { title: "Academic Engine", desc: "Background Tasks & Caching", href: "/admin/academics/engine", icon: Zap, color: "bg-indigo-900" },
                            { title: "Academic Timetable", desc: "Lecture & Exam Schedules", href: "/admin/academics/timetable", icon: Calendar, color: "bg-indigo-500" },
                            { title: isK12 ? "Subject Manager" : "Course Manager", desc: "Curriculum & Enrollments", href: "/admin/courses", icon: BookMarked, color: "bg-cyan-600" },
                            { title: "Academic Calendar", desc: "Sessions & Event Deadlines", href: "/admin/calendar", icon: ScrollText, color: "bg-orange-500" },
                            { title: "Registration Controls", desc: "Level-based Access Rules", href: "/admin/registration/controls", icon: Settings2, color: "bg-rose-500" },
                            { title: "Grading Systems", desc: "GPA & Honours Scales", href: "/admin/settings/grading", icon: Award, color: "bg-blue-700" },
                            { title: "Attendance", desc: "Scan & Track Presence", href: "/admin/attendance", icon: ClipboardList, color: "bg-teal-600" },
                            { title: "AI Grading", desc: "Automated Essay & Quiz Marking", href: "/admin/settings/ai", icon: Brain, color: "bg-fuchsia-600" },
                            { title: "Public Job Board", desc: "Recruitment & ATS Portal", href: "/jobs", icon: Briefcase, color: "bg-slate-600" },
                            { title: "Concessions Queue", desc: "Special Registration Overrides", href: "/admin/registration/concessions", icon: ShieldAlert, color: "bg-red-600" },
                            { title: "System Units", desc: "Faculties & Departments", href: "/admin/settings/units", icon: Home, color: "bg-slate-400" },
                            { title: "RBAC Settings", desc: "Permissions & Role Access", href: "/admin/rbac", icon: Shield, color: "bg-slate-900" },
                            { title: "Portal Management", desc: "Branding & Site Config", href: "/admin/settings/portal", icon: Settings2, color: "bg-slate-500" },
                        ].map((tool) => (
                            <Link key={tool.title} href={tool.href} className="active:scale-95 transition-transform">
                                <Card className="border-none shadow-sm hover:shadow-xl transition-all group overflow-hidden bg-white h-full rounded-[1.5rem]">
                                    <CardContent className="p-4 flex flex-col justify-between h-full gap-3">
                                        <div className={cn("w-10 h-10 rounded-xl text-white shadow-md flex items-center justify-center group-hover:rotate-6 transition-transform", tool.color)}>
                                            <tool.icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-[12px] font-black text-slate-900 tracking-tight leading-tight mb-0.5">{tool.title}</h4>
                                            <p className="text-[10px] font-medium text-slate-500 leading-snug">{tool.desc}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="xl:col-span-1 space-y-4">
                    <Card className="border-none shadow-sm bg-slate-900 text-white rounded-[2rem] overflow-hidden">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Database Health</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 rounded-2xl bg-white/10 flex justify-between items-center backdrop-blur-sm">
                                <span className="text-xs font-bold">MySQL Connection</span>
                                <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-pulse"></div>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/10 flex justify-between items-center backdrop-blur-sm">
                                <span className="text-xs font-bold">Storage Usage</span>
                                <span className="text-xs font-black text-blue-400">12% used</span>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/10 flex justify-between items-center backdrop-blur-sm">
                                <span className="text-xs font-bold">Backup Status</span>
                                <span className="text-xs font-black text-emerald-400">Success</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-indigo-50 text-indigo-900 rounded-[2rem] h-[340px] flex flex-col">
                        <CardHeader>
                            <CardTitle className="text-sm font-black uppercase tracking-widest">Recent Activity</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto pr-2 space-y-4">
                            <div className="flex gap-3">
                                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl h-fit shadow-sm">
                                    <Users className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold">New Student Registered</p>
                                    <p className="text-[10px] text-indigo-700/70 mt-0.5">Jane Smith (2025/SMS/4021)</p>
                                    <p className="text-[9px] font-black uppercase tracking-widest mt-1 opacity-50">10 mins ago</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl h-fit shadow-sm">
                                    <AlertCircle className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold">Module Update</p>
                                    <p className="text-[10px] text-indigo-700/70 mt-0.5">Results uploaded for CSC401.</p>
                                    <p className="text-[9px] font-black uppercase tracking-widest mt-1 opacity-50">1 hour ago</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
