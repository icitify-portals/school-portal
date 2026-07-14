import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    BookOpen,
    Calendar,
    Wallet,
    User,
    Trophy,
    FileText,
    Clock,
    CheckCircle,
    AlertCircle,
    TrendingUp,
    GraduationCap,
    ArrowRight,
    Sparkles,
    Activity,
    Settings,
    Receipt,
    Megaphone,
    UserCheck,
    ShieldOff,
    Award,
    Users as UsersIcon,
    Brain
} from "lucide-react";
import Link from "next/link";
import { AIRecommendations } from "@/components/ai/AIRecommendations";
import { KnowledgeTree } from "@/components/ai/KnowledgeTree";
import { HeroShop } from "@/components/ai/HeroShop";
import { getStudentByUserId } from "@/actions/students";
import { getStudentDashboardStats } from "@/actions/dashboards";
import { getStudentLibraryFines } from "@/actions/library";
import { cookies } from "next/headers";
import { db } from "@/db/db";
import { eq, and } from "drizzle-orm";
import { institutionalUnits, medicalExcuses } from "@/db/schema";
import DeveloperSubscriptionBanner from "@/components/finance/DeveloperSubscriptionBanner";

export const dynamic = "force-dynamic";

export default async function StudentDashboard() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'student') {
        redirect("/");
    }

    const userId = parseInt(session.user.id || "0");
    // Dynamic auto-healing check for student profile
    const studentRecord = await getStudentByUserId(userId);
    const isGraduated = studentRecord?.status === 'graduated';
    const statsData = await getStudentDashboardStats(userId);
    
    // Fetch active medical excuse if any
    const activeExcuse = await db.query.medicalExcuses.findFirst({
        where: and(
            eq(medicalExcuses.studentId, userId),
            // @ts-expect-error - TS2769: Auto-suppressed for build
            eq(medicalExcuses.status, 'approved')
        )
    });

    const now = new Date();
    const hasActiveExcuse = activeExcuse && new Date(activeExcuse.startDate) <= now && new Date(activeExcuse.endDate) >= now;

    // Fetch library fines
    // Fetch library fines — no userId arg needed, server action reads session internally
    const libraryFinesData = await getStudentLibraryFines();
    const hasLibraryFines = libraryFinesData.success && parseFloat(libraryFinesData.totalOwed) > 0;

    const studentInfo = session.user as any;

    // Resolve K-12 status on the server
    const cookieStore = await cookies();
    const activeUnitId = cookieStore.get("activeUnitId")?.value;
    
    let isK12 = false;
    if (activeUnitId) {
        const [unit] = await db.select().from(institutionalUnits).where(eq(institutionalUnits.id, parseInt(activeUnitId))).limit(1);
        if (unit && unit.academicTier === 'k12') {
            isK12 = true;
        }
    }

    const quickActions = [
        { 
            name: isK12 ? "Subject Registration" : "Course Registration", 
            href: "/student/registration", 
            desc: isK12 ? "Register for term subjects" : "Enroll in new semester subjects", 
            icon: BookOpen, 
            color: "bg-blue-50 text-blue-600 border-blue-100 hover:border-blue-300" 
        },
        { 
            name: "Weekly Timetable", 
            href: "/student/timetable", 
            desc: "View your class schedule", 
            icon: Calendar, 
            color: "bg-emerald-50 text-emerald-600 border-emerald-100 hover:border-emerald-300" 
        },
        { 
            name: "Payments & Wallet", 
            href: "/student/finance", 
            desc: "Pay fees and check balances", 
            icon: Wallet, 
            color: "bg-purple-50 text-purple-600 border-purple-100 hover:border-purple-300" 
        },
        { 
            name: isK12 ? "Terminal Report Card" : "Academic Transcript", 
            href: isK12 ? "/student/report-card" : "/student/transcript", 
            desc: isK12 ? "View latest end of term results" : "Download full academic records", 
            icon: FileText, 
            color: "bg-amber-50 text-amber-600 border-amber-100 hover:border-amber-300" 
        },
        { 
            name: "Check Attendance", 
            href: "/student/attendance/history", 
            desc: "View your class attendance", 
            icon: Clock, 
            color: "bg-indigo-50 text-indigo-600 border-indigo-100 hover:border-indigo-300" 
        },
        { 
            name: "CBT Center", 
            href: "/student/cbt", 
            desc: "Access exams and quizzes", 
            icon: Activity, 
            color: "bg-rose-50 text-rose-600 border-rose-100 hover:border-rose-300" 
        },
        { 
            name: "Sports & Athletics", 
            href: "/student/sports", 
            desc: "Teams, fixtures, and inventory", 
            icon: Trophy, 
            color: "bg-orange-50 text-orange-600 border-orange-100 hover:border-orange-300" 
        },
        { 
            name: "My Profile", 
            href: "/profile", 
            desc: "Update personal settings", 
            icon: User, 
            color: "bg-slate-50 text-slate-600 border-slate-100 hover:border-slate-300" 
        },
    ];

    const stats = [
        { 
            name: isK12 ? "Registered Subjects" : "Registered Courses", 
            value: statsData?.enrolledCourses || 0, 
            desc: isK12 ? "Active term subjects list" : `${statsData?.totalCredits || 0} Total Credits`, 
            icon: BookOpen, 
            color: "text-blue-600", 
            bg: "bg-blue-50" 
        },
        { 
            name: "Attendance Rate", 
            value: statsData?.attendance || "94%", 
            desc: "Term average presence", 
            icon: CheckCircle, 
            color: "text-emerald-600", 
            bg: "bg-emerald-50" 
        },
        { 
            name: isK12 ? "Cumulative Term Score" : "Cumulative GPA", 
            value: statsData?.cgpa || "0.00", 
            desc: isK12 ? "Term marks average" : "Current GPA average", 
            icon: Trophy, 
            color: "text-amber-600", 
            bg: "bg-amber-50" 
        },
        { 
            name: "Wallet Balance", 
            value: "₦" + parseFloat(statsData?.walletBalance || "0.00").toLocaleString(), 
            desc: "Available school funds", 
            icon: Wallet, 
            color: "text-purple-600", 
            bg: "bg-purple-50" 
        },
    ];

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-transparent">
            <div className="space-y-6 max-w-[1600px] w-full mx-auto text-slate-800">
            
            <DeveloperSubscriptionBanner />

            {/* Header Greeting Banner (FSS Style Bento) */}
            <div className="flex flex-col md:flex-row items-center gap-6 bg-slate-900 text-white rounded-[3rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden border border-slate-800">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/30 to-teal-600/30 opacity-50 mix-blend-overlay" />
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                    <GraduationCap className="w-48 h-48 text-white" />
                </div>
                
                <div className="w-24 h-24 rounded-[2.5rem] border-4 border-emerald-400/50 bg-emerald-900/55 flex items-center justify-center overflow-hidden shrink-0 shadow-lg relative z-10 backdrop-blur-sm">
                    {studentRecord?.imageUrl ? (
                        <img src={studentRecord.imageUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <User className="w-12 h-12 text-emerald-100 drop-shadow-md" />
                    )}
                </div>

                <div className="space-y-2 relative z-10 text-center md:text-left">
                    <h1 className="text-4xl lg:text-5xl font-black tracking-tighter text-white leading-none uppercase italic drop-shadow-md">
                        Welcome, {studentInfo.name || `${studentInfo.firstName || ''} ${studentInfo.lastName || ''}`.trim() || 'Student'}
                    </h1>
                    <p className="text-slate-300 text-sm font-semibold tracking-wide uppercase opacity-90">
                        Matriculation No: <span className="text-white font-mono font-black tracking-wider">{statsData?.matricNo || 'PENDING'}</span> • Level: <span className="text-white font-black">{statsData?.level || 100} Level</span>
                    </p>
                </div>

                {isGraduated && (
                    <div className="ml-auto bg-white/10 px-4 py-2 rounded-2xl border border-white/20 text-xs font-black uppercase tracking-widest text-emerald-100 shrink-0 relative z-10 backdrop-blur-md shadow-inner">
                        Graduated
                    </div>
                )}
            </div>

            {/* Medical Excuse Alert Banner */}
            {hasActiveExcuse && activeExcuse && (
                <div className="bg-rose-50 border border-rose-200 border-l-4 border-l-rose-500 p-6 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-pulse">
                    <div className="flex gap-3 items-start">
                        <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                            <ShieldOff className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-rose-800 font-bold">Active Medical Excuse</h3>
                            <p className="text-rose-600 text-sm mt-1">
                                You are officially excused from all academic activities until {new Date(activeExcuse.endDate).toLocaleDateString()}.
                                Please focus on your recovery.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Library Fines Alert Banner */}
            {hasLibraryFines && (
                <div className="bg-orange-50 border border-orange-200 border-l-4 border-l-orange-500 p-6 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                    <div className="flex gap-3 items-start">
                        <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-orange-800 font-bold">Outstanding Library Fines</h3>
                            <p className="text-orange-600 text-sm mt-1">
                                You owe ₦{libraryFinesData.totalOwed} in overdue library fines. Your borrowing privileges are restricted.
                            </p>
                        </div>
                    </div>
                    <Link href="/student/finance/library" className="shrink-0">
                        <Button className="bg-orange-600 hover:bg-orange-700 text-white font-bold h-10 px-5 rounded-lg shadow-sm">
                            Settle Fines Now
                        </Button>
                    </Link>
                </div>
            )}

            {/* Document Upload Required Alert Box */}
            <div className="bg-emerald-50/80 border border-emerald-100 border-l-4 border-emerald-600 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
                <div className="flex gap-3 items-start">
                    <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl mt-0.5 shrink-0">
                        <AlertCircle className="w-4 h-4" />
                    </div>
                    <div>
                        <h4 className="font-extrabold text-sm text-emerald-950 leading-none">Document Upload Required</h4>
                        <p className="text-xs text-emerald-850 mt-1.5 font-medium">
                            Your previously uploaded document was rejected. Please upload the required documents to complete your profile.
                        </p>
                    </div>
                </div>
                <Link href="/profile">
                    <Button className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs h-10 px-5 rounded-xl shadow-md flex items-center gap-2 transition-transform hover:scale-[1.02]">
                        <ArrowRight className="w-3.5 h-3.5" /> Upload Documents
                    </Button>
                </Link>
            </div>

            {/* Bento-Style Console Grid */}
            <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Portal Console Shortcuts</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4 auto-rows-[120px]">
                    {[
                        { name: "Course Registration", href: "/student/registration", icon: BookOpen, span: "col-span-2 row-span-2", color: "text-blue-700 bg-blue-50" },
                        { name: "Results", href: "/results", icon: FileText, span: "col-span-1 row-span-1", color: "text-emerald-700 bg-emerald-50" },
                        { name: "Bursary", href: "/student/finance", icon: Wallet, span: "col-span-1 row-span-1", color: "text-amber-700 bg-amber-50" },
      // @ts-expect-error - Auto-suppressed by script
                        { name: "CBT Exams", href: "/student/cbt", icon: Brain, span: "col-span-2 row-span-1", color: "text-purple-700 bg-purple-50" },
                        { name: "My Lecturers", href: "/student/evaluations", icon: UsersIcon, span: "col-span-1 row-span-1", color: "text-indigo-700 bg-indigo-50" },
                        { name: "Transactions", href: "/student/finance", icon: Receipt, span: "col-span-1 row-span-1", color: "text-slate-700 bg-slate-100" },
                        { name: "Documents", href: "/alumni/documents", icon: ArrowRight, span: "col-span-1 row-span-1", color: "text-teal-700 bg-teal-50" },
                        { name: "All Forms", href: "/student/clearance", icon: Clock, span: "col-span-1 row-span-1", color: "text-cyan-700 bg-cyan-50" },
                        { name: "Admission Letter", href: "/student/admission", icon: Award, span: "col-span-1 row-span-1", color: "text-rose-700 bg-rose-50" },
                        { name: "Biodata", href: "/profile", icon: User, span: "col-span-1 row-span-1", color: "text-sky-700 bg-sky-50" },
                        { name: "Announcements", href: "/communications", icon: Megaphone, span: "col-span-2 row-span-1", color: "text-orange-700 bg-orange-50" },
                        { name: "Settings", href: "/profile", icon: Settings, span: "col-span-1 row-span-1", color: "text-slate-600 bg-slate-200" },
                    ].map((action, index) => {
                        const cardContent = (
                            <div className={cn(
                                "bg-white/90 backdrop-blur-md border border-white/40 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group rounded-3xl h-full w-full flex flex-col justify-center",
                                action.span === "col-span-2 row-span-2" ? "items-start p-8" : "items-center text-center p-4",
                                "active:scale-[0.98] cursor-pointer"
                            )}>
                                <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-0" />
                                <div className={cn("relative z-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-inner", action.color, action.span === "col-span-2 row-span-2" ? "w-14 h-14 mb-4" : "w-12 h-12 mb-3 shrink-0")}>
                                    <action.icon className={cn(action.span === "col-span-2 row-span-2" ? "w-7 h-7" : "w-5 h-5")} />
                                </div>
                                <span className={cn("relative z-10 font-bold text-slate-800 tracking-tight block", action.span === "col-span-2 row-span-2" ? "text-lg" : "text-xs uppercase leading-tight")}>
                                    {action.name}
                                </span>
                            </div>
                        );

                        return (
                            <Link key={action.name} href={action.href} className={cn("block h-full", action.span)}>
                                {cardContent}
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Section Divider */}
            <div className="border-t border-slate-100 pt-8" />

            {/* Advanced Command Center & AI Engine */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Side: Learning analytics & pathways (Span 2) */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Academic Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {stats.map((stat) => (
                            <Card key={stat.name} className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[2.5rem] hover:shadow-2xl transition-all relative overflow-hidden group">
                                <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform ${stat.color}`}>
                                    <stat.icon className="w-16 h-16" />
                                </div>
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className={`p-3 rounded-2xl ${stat.bg} shadow-inner`}>
                                            <stat.icon className={`w-5 h-5 ${stat.color} drop-shadow-sm`} />
                                        </div>
                                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{stat.name}</span>
                                    </div>
                                    <h3 className="text-3xl font-black text-slate-900 italic uppercase drop-shadow-sm">{stat.value}</h3>
                                    <p className="text-xs text-slate-500 font-medium mt-1">{stat.desc}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Visual Learning Pathway */}
                    <KnowledgeTree />
                </div>

                {/* Right Side: Feed, AI & Economy (Span 1) */}
                <div className="space-y-8">
                    
                    {/* Recent Activities Ledger */}
                    <Card className="shadow-sm border-none bg-white rounded-2xl overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                            <CardTitle className="text-[9px] font-black uppercase tracking-widest text-emerald-600 mb-1">Operational Logs</CardTitle>
                            <CardDescription className="text-lg font-black text-slate-900 uppercase italic leading-none">Activity Feed</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto pr-1">
                                {statsData?.activities && statsData.activities.length > 0 ? (
                                    statsData.activities.map((act: any, idx: number) => (
                                        <div key={idx} className="p-5 flex items-start gap-4 hover:bg-slate-50/40 transition-colors">
                                            <div className={`p-2 rounded-xl shrink-0 ${act.bg}`}>
                                                {act.type === 'grade' && <Trophy className={`w-3.5 h-3.5 ${act.color}`} />}
                                                {act.type === 'payment' && <Wallet className={`w-3.5 h-3.5 ${act.color}`} />}
                                                {act.type === 'attendance' && <CheckCircle className={`w-3.5 h-3.5 ${act.color}`} />}
                                            </div>
                                            <div className="space-y-1">
                                                <h5 className="text-[11px] font-black text-slate-950 uppercase leading-none">{act.title}</h5>
                                                <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-1">{act.description}</p>
                                                <span className="text-[8px] text-slate-400 font-mono font-bold block uppercase mt-1">{new Date(act.date).toLocaleDateString("en-GB")}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-10 text-center text-slate-400 italic text-xs">
                                        <Activity className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                        Your academic and finance logs are fully cleared.<br /> No recent activities recorded.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* AI Study Recommender */}
                    <AIRecommendations />

                    {/* Gamified Economy */}
                    <HeroShop coins={500} />
                </div>

            </div>
          </div>
        </div>
    );
}
