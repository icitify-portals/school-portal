import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
    Users,
    Home,
    BookOpen,
    GraduationCap,
    TrendingUp,
    UserCheck,
    Shield,
    Brain,
    Wallet,
    Award,
    Calendar,
    Settings2,
    BookMarked,
    Zap,
    Activity,
    Building2,
    Globe,
    Trash2,
    Database,
    UserCog,
    ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { db } from "@/db/db";
import { users, departments, programmes, courses, students, admissionSessions, faculties, institutionalUnits, organizations, movementLogs } from "@/db/schema";
import { count, eq, sql } from "drizzle-orm";
import OnboardSection from "./_components/OnboardSection";
import ActiveStudentsModal from "./_components/ActiveStudentsModal";

export const dynamic = "force-dynamic";

export default async function SuperAdminDashboardPage() {
    let statsData: any[] = [[], [], [], [], [], [], [], [], [], [], [], []];
    let activeStudentsByUnit: any[] = [];
    let recentMovements: any[] = [];

    try {
        statsData = await Promise.all([
            db.select({ value: count() }).from(institutionalUnits),
            db.select({ value: count() }).from(students),
            db.select({ value: count() }).from(users).where(eq(users.role, 'staff')),
            db.select({ value: count() }).from(organizations),
            db.select({ value: count() }).from(faculties),
            db.select({ value: count() }).from(departments),
            db.select({ value: count() }).from(programmes),
            db.select({ value: count() }).from(courses),
            db.select({ value: count() }).from(admissionSessions).where(eq(admissionSessions.isActive, true)),
            db.select({ value: count() }).from(students).where(eq(students.status, 'active')),
            db.select({ value: count() }).from(students).where(eq(students.status, 'graduated')),
        ]);

        const unitBreakdown = await db.execute(sql`
            SELECT u.name AS unit, COUNT(s.id) AS student_count
            FROM students s
            JOIN institutional_units u ON s.unit_id = u.id
            WHERE s.status = 'active'
            GROUP BY u.name
            ORDER BY student_count DESC
        `);
        activeStudentsByUnit = unitBreakdown[0] as any[];

        recentMovements = await db.select({
            id: movementLogs.id,
            entityType: movementLogs.entityType,
            reason: movementLogs.reason,
            createdAt: movementLogs.createdAt,
            fromUnit: institutionalUnits.name,
            toUnit: sql<string>`(SELECT name FROM institutional_units WHERE id = ${movementLogs.toUnitId})`,
            movedBy: users.name,
        })
        .from(movementLogs)
        .leftJoin(institutionalUnits, eq(movementLogs.fromUnitId, institutionalUnits.id))
        .leftJoin(users, eq(movementLogs.movedBy, users.id))
        .orderBy(movementLogs.createdAt)
        .limit(5);
    } catch (error) {
        console.error("Super-Admin dashboard stats fetch error:", error);
    }

    const totalStudentCount = statsData[1]?.[0]?.value?.toString() || "0";
    const activeStudentCount = statsData[9]?.[0]?.value?.toString() || "0";
    const graduatedStudentCount = statsData[10]?.[0]?.value?.toString() || "0";

    const superStats = [
        { name: "Total Enrolled", value: totalStudentCount, icon: Users, color: "text-slate-600", bg: "bg-gradient-to-br from-slate-500 to-slate-600", href: "/admin/students", colSpan: "md:col-span-1 xl:col-span-1" },
        { name: "Active Students", value: activeStudentCount, icon: UserCheck, color: "text-emerald-600", bg: "bg-gradient-to-br from-emerald-500 to-emerald-600", href: "#", colSpan: "md:col-span-1 xl:col-span-1", modal: true },
        { name: "Graduated", value: graduatedStudentCount, icon: GraduationCap, color: "text-indigo-600", bg: "bg-gradient-to-br from-indigo-500 to-indigo-600", href: "/admin/students?filter=graduated", colSpan: "md:col-span-1 xl:col-span-1" },
        { name: "Total Staff", value: statsData[2]?.[0]?.value?.toString() || "0", icon: Users, color: "text-emerald-600", bg: "bg-gradient-to-br from-emerald-500 to-emerald-600", href: "/admin/hr", colSpan: "md:col-span-1 xl:col-span-1" },
        { name: "Units", value: statsData[0]?.[0]?.value?.toString() || "0", icon: Building2, color: "text-blue-600", bg: "bg-gradient-to-br from-blue-500 to-blue-600", href: "/admin/settings/units", colSpan: "md:col-span-1 xl:col-span-1" },
        { name: "Organizations", value: statsData[3]?.[0]?.value?.toString() || "0", icon: Globe, color: "text-rose-600", bg: "bg-gradient-to-br from-rose-500 to-rose-600", href: "#", colSpan: "md:col-span-1 xl:col-span-1" },
        { name: "Faculties", value: statsData[4]?.[0]?.value?.toString() || "0", icon: Award, color: "text-fuchsia-600", bg: "bg-gradient-to-br from-fuchsia-500 to-fuchsia-600", href: "/admin/faculties", colSpan: "md:col-span-1 xl:col-span-1" },
        { name: "Programmes", value: statsData[6]?.[0]?.value?.toString() || "0", icon: BookOpen, color: "text-amber-600", bg: "bg-gradient-to-br from-amber-500 to-amber-600", href: "/admin/programmes", colSpan: "md:col-span-1 xl:col-span-1" },
        { name: "Depts & Units", value: statsData[5]?.[0]?.value?.toString() || "0", icon: Home, color: "text-emerald-600", bg: "bg-gradient-to-br from-emerald-500 to-emerald-600", href: "/admin/departments", colSpan: "md:col-span-1 xl:col-span-1" },
        { name: "Courses", value: statsData[7]?.[0]?.value?.toString() || "0", icon: BookMarked, color: "text-cyan-600", bg: "bg-gradient-to-br from-cyan-500 to-cyan-600", href: "/admin/courses", colSpan: "md:col-span-2 xl:col-span-2" },
        { name: "Admissions Open", value: statsData[8]?.[0]?.value?.toString() || "0", icon: UserCheck, color: "text-purple-600", bg: "bg-gradient-to-br from-purple-500 to-purple-600", href: "/admin/admission", colSpan: "md:col-span-2 xl:col-span-2" },
    ];

    return (
        <div className="p-4 md:p-6 max-w-[1600px] w-full mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 p-8 rounded-[2rem] shadow-xl text-white">
                <div>
                    <h2 className="text-4xl font-black tracking-tighter flex items-center gap-4">
                        <Globe className="w-10 h-10 text-indigo-400" />
                        MASTER OVERWATCH
                    </h2>
                    <p className="text-slate-400 font-medium text-sm mt-1 max-w-lg leading-relaxed">Super-Admin Dashboard &bull; Aggregate analytics across all branches.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-white/10 backdrop-blur-md text-emerald-400 rounded-2xl border border-white/10 flex items-center gap-2">
                        <Activity className="w-4 h-4 animate-pulse" />
                        <span className="text-xs font-black uppercase tracking-widest">System Stable</span>
                    </div>
                    <OnboardSection />
                </div>
            </div>

            {/* Bento Grid: Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[140px]">
                {superStats.map((stat, idx) => {
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

                    return stat.modal ? (
                        <div key={stat.name} className={stat.colSpan}>
                            <ActiveStudentsModal breakdown={activeStudentsByUnit}>
                                {CardElement}
                            </ActiveStudentsModal>
                        </div>
                    ) : stat.href && stat.href !== "#" ? (
                        <Link key={stat.name} href={stat.href} className={cn("block group active:scale-95 transition-transform", stat.colSpan)}>
                            {CardElement}
                        </Link>
                    ) : (
                        <div key={stat.name} className={stat.colSpan}>{CardElement}</div>
                    );
                })}
            </div>

            {/* Bento Grid: Movement Logs & Management Tools */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
                <div className="xl:col-span-3 space-y-4">
                    {/* Management Tools */}
                    <div className="flex items-center gap-3 px-2">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Governance Tools</h3>
                        <div className="h-px bg-slate-200 flex-1"></div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {[
                            { title: "Role Management", desc: "RBAC & super-admin roles", href: "/super-admin/users/roles", icon: UserCog, color: "bg-slate-900" },
                            { title: "Recycle Bin", desc: "Restore or purge deleted records", href: "/super-admin/recycle-bin", icon: Trash2, color: "bg-rose-600" },
                            { title: "User Management", desc: "Manage all users across branches", href: "/admin/users", icon: Users, color: "bg-blue-600" },
                            { title: "System Backups", desc: "Database & file backups", href: "/admin/system/backup", icon: Database, color: "bg-indigo-600" },
                            { title: "System Maintenance", desc: "Cache, logs & health checks", href: "/admin/system/maintenance", icon: Settings2, color: "bg-slate-700" },
                            { title: "Audit Trail", desc: "Action logs & security events", href: "/admin/audit", icon: Shield, color: "bg-amber-600" },
                            { title: "Module Settings", desc: "Enable/disable portal modules", href: "/admin/settings/modules", icon: Settings2, color: "bg-purple-600" },
                            { title: "Analytics Hub", desc: "Cross-branch analytics", href: "/admin/analytics", icon: TrendingUp, color: "bg-emerald-600" },
                            { title: "Developer Console", desc: "API keys, env & integrations", href: "/admin/settings/developer", icon: Zap, color: "bg-cyan-600" },
                            { title: "Admission Desk", desc: "All branches admission oversight", href: "/admin/admission", icon: UserCheck, color: "bg-emerald-600" },
                            { title: "Bursary Overview", desc: "Cross-branch financials", href: "/admin/bursary", icon: Wallet, color: "bg-amber-600" },
                            { title: "CBT Assessments", desc: "Quiz engine across branches", href: "/admin/cbt", icon: Brain, color: "bg-purple-600" },
                            { title: "Academic Sessions", desc: "Session & term management", href: "/admin/settings/portal", icon: Calendar, color: "bg-orange-500" },
                            { title: "Health Dashboard", desc: "System resource monitoring", href: "/admin/health", icon: Activity, color: "bg-teal-600" },
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

                    {/* Movement Tracking */}
                    <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden">
                        <CardHeader className="p-6 bg-slate-900 text-white">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-sm font-black italic uppercase tracking-tight flex items-center gap-3">
                                    <Activity className="w-5 h-5 text-indigo-400" />
                                    Movement Tracking System
                                </CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {recentMovements.length > 0 ? (
                                <div className="divide-y divide-slate-100">
                                    {recentMovements.map((log: any) => (
                                        <div key={log.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-slate-100 rounded-xl">
                                                    {log.entityType === 'student' ? <GraduationCap className="w-5 h-5 text-indigo-600" /> : <Users className="w-5 h-5 text-emerald-600" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900 italic capitalize">{log.entityType} Transfer</p>
                                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                                                        {log.fromUnit || 'Onboarded'} &rarr; <span className="text-indigo-600">{log.toUnit}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-slate-400 uppercase">By {log.movedBy}</p>
                                                <p className="text-[10px] text-slate-400 font-medium">{log.createdAt ? new Date(log.createdAt).toLocaleDateString() : ''}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-12 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">
                                    No recent movements recorded.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Side Panel: Quick Actions & Database Health */}
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
                                <span className="text-xs font-bold">Total Branches</span>
                                <span className="text-xs font-black text-blue-400">{statsData[0]?.[0]?.value || 0}</span>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/10 flex justify-between items-center backdrop-blur-sm">
                                <span className="text-xs font-bold">Backup Status</span>
                                <span className="text-xs font-black text-emerald-400">Active</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-indigo-50 text-indigo-900 rounded-[2rem] overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-sm font-black uppercase tracking-widest">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Link href="/super-admin/users/roles" className="flex items-center justify-between p-4 rounded-2xl bg-white/80 hover:bg-white group transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-100 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                        <UserCog className="w-4 h-4 text-indigo-600 group-hover:text-white" />
                                    </div>
                                    <span className="text-xs font-black text-slate-700">Manage Roles</span>
                                </div>
                                <ExternalLink className="w-4 h-4 text-slate-300" />
                            </Link>
                            <Link href="/super-admin/recycle-bin" className="flex items-center justify-between p-4 rounded-2xl bg-white/80 hover:bg-white group transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-100 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                        <Trash2 className="w-4 h-4 text-indigo-600 group-hover:text-white" />
                                    </div>
                                    <span className="text-xs font-black text-slate-700">Recycle Bin</span>
                                </div>
                                <ExternalLink className="w-4 h-4 text-slate-300" />
                            </Link>
                            <Link href="/admin/system/backup" className="flex items-center justify-between p-4 rounded-2xl bg-white/80 hover:bg-white group transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-100 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                        <Database className="w-4 h-4 text-indigo-600 group-hover:text-white" />
                                    </div>
                                    <span className="text-xs font-black text-slate-700">Run Backup</span>
                                </div>
                                <ExternalLink className="w-4 h-4 text-slate-300" />
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
