import { getChildDetailedData } from "@/actions/parent";
import { 
    GraduationCap, 
    ArrowLeft, 
    Calendar, 
    Wallet, 
    ClipboardList, 
    FileText, 
    Clock, 
    TrendingUp,
    MapPin,
    BookOpen,
    MessageSquare,
    BrainCircuit
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { redirect } from "next/navigation";

export default async function ChildDetailsPage({ params }: { params: { id: string } }) {
    const studentId = parseInt(params.id);
    const { student, stats, error } = await getChildDetailedData(studentId) as any;

    if (error) {
        return (
            <div className="p-8 text-center">
                <div className="bg-red-50 text-red-600 p-6 rounded-3xl border border-red-100 max-w-xl mx-auto">
                    <h2 className="text-xl font-black mb-2">Access Denied</h2>
                    <p className="font-medium mb-4">{error}</p>
                    <Link href="/parent/dashboard" className="text-indigo-600 font-black flex items-center justify-center gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    const quickActions = [
        { name: "Report Card", icon: FileText, color: "text-indigo-600", bg: "bg-indigo-50", desc: "Download terminal performance reports" },
        { name: "ITS Insights", icon: BrainCircuit, color: "text-indigo-600", bg: "bg-indigo-50", desc: "View AI Tutoring engagement and mastery" },
        { name: "Attendance Records", icon: Clock, color: "text-green-600", bg: "bg-green-50", desc: "Track daily and lecture attendance" },
        { name: "Financial Status", icon: Wallet, color: "text-purple-600", bg: "bg-purple-50", desc: "Outstanding fees and payment history" },
        { name: "Weekly Timetable", icon: Calendar, color: "text-amber-600", bg: "bg-amber-50", desc: "Class schedule and lecture venues" },
        { name: "Course Enrollment", icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50", desc: "Currently registered courses and units" },
        { name: "Communications", icon: MessageSquare, color: "text-rose-600", bg: "bg-rose-50", desc: "Message teachers and administration" },
    ];

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header / Breadcrumb */}
            <div className="flex items-center gap-4">
                <Link 
                    href="/parent/dashboard"
                    className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm hover:bg-slate-50 transition-colors group"
                >
                    <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:-translate-x-1 transition-transform" />
                </Link>
                <div>
                    <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">
                        <Link href="/parent/dashboard" className="hover:text-indigo-600 transition-colors">Dashboard</Link>
                        <span>/</span>
                        <span className="text-slate-900">{student.firstName}</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                        Child <span className="text-indigo-600">Overview</span>
                    </h1>
                </div>
            </div>

            {/* Child Profile Card */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-indigo-500/5 p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                    <GraduationCap className="w-64 h-64" />
                </div>
                
                <div className="flex flex-col md:flex-row md:items-center gap-8 relative z-10">
                    <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-500/20">
                        <span className="text-4xl font-black">{student.firstName[0]}{student.lastName[0]}</span>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <h2 className="text-4xl font-black text-slate-900 leading-tight">
                                {student.firstName} {student.lastName}
                            </h2>
                            <p className="text-slate-400 font-bold tracking-tight text-lg">{student.matricNumber}</p>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl text-slate-600 font-bold text-sm">
                                <MapPin className="w-4 h-4 text-indigo-500" />
                                {student.unitName}
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl text-slate-600 font-bold text-sm">
                                <GraduationCap className="w-4 h-4 text-indigo-500" />
                                {student.programmeName}
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl text-slate-600 font-bold text-sm">
                                <TrendingUp className="w-4 h-4 text-indigo-500" />
                                {student.currentLevel} Level
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat: any) => (
                    <Card key={stat.name} className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden group hover:scale-[1.02] transition-all">
                        <CardContent className="p-8">
                            <div className="flex items-center gap-5">
                                <div className={`p-4 rounded-2xl ${stat.bg}`}>
                                    <ClipboardList className={`w-6 h-6 ${stat.color}`} />
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">{stat.name}</p>
                                    <h3 className="text-3xl font-black text-slate-900">{stat.value}</h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Module Navigation */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <span className="w-2 h-8 bg-indigo-600 rounded-full" />
                        Student Modules
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {quickActions.map((action) => (
                            <Link key={action.name} href={`/parent/child/${student.id}/${action.name.toLowerCase().replace(" ", "-")}`}>
                                <div className="group bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all h-full flex flex-col justify-between">
                                    <div className="space-y-4">
                                        <div className={`p-4 rounded-2xl w-fit ${action.bg} group-hover:scale-110 transition-transform duration-500`}>
                                            <action.icon className={`w-6 h-6 ${action.color}`} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">{action.name}</h3>
                                            <p className="text-slate-500 font-medium text-sm leading-relaxed">{action.desc}</p>
                                        </div>
                                    </div>
                                    <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">View Details</span>
                                        <div className="p-2 bg-indigo-50 rounded-lg group-hover:translate-x-2 transition-transform">
                                            <ArrowLeft className="w-4 h-4 text-indigo-600 rotate-180" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Activity Timeline */}
                <div className="lg:col-span-1 space-y-6">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <span className="w-2 h-8 bg-indigo-600 rounded-full" />
                        Activity Timeline
                    </h2>
                    <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/40 relative overflow-hidden">
                        <div className="space-y-8 relative z-10">
                            {[
                                { title: "New Result Uploaded", time: "2h ago", type: "academic", desc: "Mathematics (1st Term)" },
                                { title: "Daily Attendance", time: "5h ago", type: "attendance", desc: "Clocked in at 07:45 AM" },
                                { title: "Payment Confirmed", time: "1d ago", type: "finance", desc: "Fee: ₦50,000.00" },
                                { title: "Assignment Due", time: "Tomorrow", type: "academic", desc: "Physics Sessional Project" },
                            ].map((event, idx) => (
                                <div key={idx} className="flex gap-4 relative group">
                                    {idx !== 3 && <div className="absolute left-[19px] top-10 bottom-[-32px] w-0.5 bg-slate-100" />}
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm border-4 border-white z-10 ${
                                        event.type === 'academic' ? 'bg-indigo-100 text-indigo-600' :
                                        event.type === 'finance' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                                    }`}>
                                        <div className="w-2 h-2 rounded-full bg-current" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{event.title}</h4>
                                            <span className="text-[10px] font-bold text-slate-400">{event.time}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium mt-1">{event.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
