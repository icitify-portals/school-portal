import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
    TrendingUp
} from "lucide-react";
import Link from "next/link";
import { AIRecommendations } from "@/components/ai/AIRecommendations";
import { HeroHeader } from "@/components/ai/HeroHeader";
import { KnowledgeTree } from "@/components/ai/KnowledgeTree";
import { HeroShop } from "@/components/ai/HeroShop";

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

    const studentInfo = session.user as any;

    const quickActions = [
        { name: "Course Registration", href: "/student/registration", icon: BookOpen, color: "bg-blue-50 text-blue-600 border-blue-200" },
        { name: "View Timetable", href: "/student/timetable", icon: Calendar, color: "bg-green-50 text-green-600 border-green-200" },
        { name: "Make Payment", href: "/student/finance", icon: Wallet, color: "bg-purple-50 text-purple-600 border-purple-200" },
        { name: "View Transcript", href: "/student/transcript", icon: FileText, color: "bg-amber-50 text-amber-600 border-amber-200" },
        { name: "Check Attendance", href: "/student/attendance", icon: Clock, color: "bg-indigo-50 text-indigo-600 border-indigo-200" },
        { name: "My Profile", href: "/profile", icon: User, color: "bg-slate-50 text-slate-600 border-slate-200" },
    ];

    const stats = [
        { name: "Registered Courses", value: "0", icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50" },
        { name: "Attendance Rate", value: "0%", icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
        { name: "Pending Payments", value: "0", icon: Wallet, color: "text-red-600", bg: "bg-red-50" },
        { name: "GPA", value: "0.00", icon: Trophy, color: "text-amber-600", bg: "bg-amber-50" },
    ];

    return (
        <div className="p-6 space-y-6">
            {/* Hero Header (Gamified Welcome) */}
            <HeroHeader studentName={studentInfo.firstName || studentInfo.name || 'Student'} />

            {/* AI Personalized Learning Path */}
            <AIRecommendations />

            {/* Knowledge Tree (Visual Mastery) */}
            <KnowledgeTree />

            {/* Hero Shop (Virtual Economy) */}
            <HeroShop coins={500} />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <Card key={stat.name} className="border-none shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${stat.bg}`}>
                                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
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

            {/* Quick Actions */}
            <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {quickActions.map((action) => (
                        <Link key={action.name} href={action.href}>
                            <Card className={`border-2 ${action.color} hover:shadow-md transition-all cursor-pointer h-full`}>
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4">
                                        <action.icon className="w-8 h-8" />
                                        <div>
                                            <h3 className="font-semibold text-slate-900">{action.name}</h3>
                                            <p className="text-sm text-slate-600 mt-1">
                                                {action.name === "Course Registration" && "Register for courses"}
                                                {action.name === "View Timetable" && "Check your class schedule"}
                                                {action.name === "Make Payment" && "Pay fees and view wallet"}
                                                {action.name === "View Transcript" && "Download academic records"}
                                                {action.name === "Check Attendance" && "View attendance history"}
                                                {action.name === "My Profile" && "Update personal information"}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Recent Activity Placeholder */}
            <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Recent Activity</h2>
                <Card>
                    <CardContent className="p-8 text-center">
                        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">No recent activity</h3>
                        <p className="text-slate-500">
                            Your recent academic activities will appear here once you start using the portal.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
