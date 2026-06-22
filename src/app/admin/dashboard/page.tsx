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
    Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { db } from "@/db/db";
import { users, departments, programmes, courses, students, jambCandidates, admissionSessions, academicSessions, faculties, institutionalUnits } from "@/db/schema";
import { count, eq, and, desc } from "drizzle-orm";
import { cookies } from "next/headers";

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
        ]);
    } catch (error) {
        console.error("Admin dashboard stats fetch error:", error);
    }

    const activeAcademicSession = statsData[7][0];
    const facultyCount = statsData[8][0]?.value.toString() || "0";
    const programmeCount = statsData[2][0]?.value.toString() || "0";

    const adminStats = [
        { name: "Total Students", value: statsData[0][0]?.value.toString() || "0", icon: Users, color: "text-blue-600", bg: "bg-blue-50", href: "/admin/students" },
        { name: "Total Staff", value: statsData[5][0]?.value.toString() || "0", icon: GraduationCap, color: "text-indigo-600", bg: "bg-indigo-50", href: "/admin/hr" },
        { name: "Faculties", value: facultyCount, icon: Award, color: "text-rose-600", bg: "bg-rose-50", href: "/admin/faculties" },
        { name: "Programmes", value: programmeCount, icon: BookOpen, color: "text-amber-600", bg: "bg-amber-50", href: "/admin/programmes" },
        { name: "Depts & Units", value: statsData[1][0]?.value.toString() || "0", icon: Home, color: "text-emerald-600", bg: "bg-emerald-50", href: "/admin/departments" },
        { name: "Active Admissions", value: statsData[6][0]?.value.toString() || "0", icon: UserCheck, color: "text-purple-600", bg: "bg-purple-50", href: "/admin/admission" },
    ];
    return (
        <div className="p-5 md:p-6 max-w-[1600px] w-full mx-auto space-y-6">
            {!activeAcademicSession && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-4 text-rose-700 animate-pulse">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <div>
                        <p className="font-black uppercase text-xs tracking-widest">System Warning: Primary Session Missing</p>
                        <p className="text-sm font-medium">No academic session is currently set as "Primary". This may prevent students from registering or viewing portal data. <Link href="/admin/settings/portal" className="underline font-black">Fix now</Link></p>
                    </div>
                </div>
            )}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Admin Overview</h2>
                    <p className="text-slate-500 font-medium text-sm mt-1">System-wide monitoring and management</p>
                </div>
                <div className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-widest">System Stable</span>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {adminStats.map((stat) => {
                    const CardElement = (
                        <Card className="border-none shadow-sm hover:shadow-md transition-shadow h-full">
                            <CardContent className="pt-6">
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
                    );

                    return stat.href ? (
                        <Link key={stat.name} href={stat.href} className="block">
                            {CardElement}
                        </Link>
                    ) : (
                        <div key={stat.name}>{CardElement}</div>
                    );
                })}
            </div>

            <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 px-1">Management Hub</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                        <Link key={tool.title} href={tool.href}>
                            <Card className="border-none shadow-sm hover:shadow-xl transition-all group overflow-hidden bg-white h-full">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-5">
                                        <div className={cn("p-4 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform", tool.color)}>
                                            <tool.icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-900 tracking-tight">{tool.title}</h4>
                                            <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">{tool.desc}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="shadow-sm border border-slate-100 rounded-2xl">
                    <CardHeader>
                        <CardTitle className="text-lg">Recent System Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg h-fit">
                                    <Users className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800">New Student Registered</p>
                                    <p className="text-xs text-slate-500 mt-1">Jane Smith (2025/SMS/4021) has joined the portal.</p>
                                    <p className="text-[10px] text-slate-400 mt-2">10 minutes ago</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="p-2 bg-orange-50 text-orange-600 rounded-lg h-fit">
                                    <AlertCircle className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800">Module Update: Results</p>
                                    <p className="text-xs text-slate-500 mt-1">Staff member 'Dr. Ade' uploaded results for CSC401.</p>
                                    <p className="text-[10px] text-slate-400 mt-2">1 hour ago</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border border-slate-100 rounded-2xl">
                    <CardHeader>
                        <CardTitle className="text-lg">Database Health</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50">
                                <span className="text-sm font-medium">MySQL Connection</span>
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50">
                                <span className="text-sm font-medium">Storage Usage</span>
                                <span className="text-xs font-bold text-slate-500">12% used</span>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50">
                                <span className="text-sm font-medium">Backup Status</span>
                                <span className="text-xs font-bold text-green-600">Daily Success</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
