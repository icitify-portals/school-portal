"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const Sidebar = dynamic(() => import("@/components/Sidebar").then((mod) => mod.Sidebar), { 
    ssr: false,
    loading: () => (
        <aside className="hidden md:block shrink-0" aria-label="Sidebar navigation">
            <div 
                className="flex flex-col h-screen w-64 text-white border-r border-white/10" 
                style={{ backgroundColor: 'var(--brand-secondary, #0f172a)' }}
            />
        </aside>
    )
});
import BursaryBot from "@/components/BursaryBot";
import { Toaster } from "sonner";
import { useSession } from "next-auth/react";
import { AIVoiceCoach } from "@/components/ai/AIVoiceCoach";
import { AlertTriangle, Lock, GraduationCap, ShieldOff, Ban, EyeOff, Menu, ShieldCheck } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { IntelligentTutoringSystem } from "@/components/ai/IntelligentTutoringSystem";
import { NotificationBell } from "@/components/notifications/NotificationBell";

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: any; message: string }> = {
    graduated: {
        label: "Graduated",
        color: "text-blue-800",
        bgColor: "bg-blue-50 border-blue-200",
        icon: <GraduationCap className="w-5 h-5 text-blue-600" />,
        message: "Your account is in view-only mode. You can view your records and transcript but cannot make changes.",
    },
    withdrawn: {
        label: "Withdrawn",
        color: "text-red-800",
        bgColor: "bg-red-50 border-red-200",
        icon: <Ban className="w-5 h-5 text-red-600" />,
        message: "Your account has been withdrawn. Contact the registrar for more information.",
    },
    suspended: {
        label: "Suspended",
        color: "text-amber-800",
        bgColor: "bg-amber-50 border-amber-200",
        icon: <ShieldOff className="w-5 h-5 text-amber-600" />,
        message: "Your account is suspended. Contact the registrar to resolve this.",
    },
    rusticated: {
        label: "Rusticated",
        color: "text-purple-800",
        bgColor: "bg-purple-50 border-purple-200",
        icon: <EyeOff className="w-5 h-5 text-purple-600" />,
        message: "Your account is rusticated. Contact the registrar for more information.",
    },
};

// Pages that restricted students can still access (view-only)
const allowedPaths = [
    "/", "/login", "/register", "/profile",
    "/student/transcript", "/student/id-card",
    "/student/analytics", "/student/achievements",
    "/student/leaderboard", "/student/attendance/history",
    "/results", "/communications",
];

function isPathAllowed(pathname: string): boolean {
    return allowedPaths.some(p => pathname === p || pathname.startsWith(p + "/"));
}

export function AppContent({ children, enabledModules }: { children: React.ReactNode; enabledModules?: Record<string, boolean> }) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isAuthPage = pathname === "/login" || pathname === "/register";

    if (!pathname) return null;

    const isPublic = pathname === "/" || 
                     pathname === "/about" || 
                     pathname === "/contact" || 
                     pathname === "/login" || 
                     pathname === "/register" || 
                     (pathname.startsWith("/p/") && !pathname.startsWith("/profile")) ||
                     pathname.startsWith("/blog") ||
                     pathname.startsWith("/jobs") ||
                     pathname.startsWith("/journal") ||
                     pathname.startsWith("/api/articles") ||
                     pathname.startsWith("/api/journal");
    
    if (isPublic) {
        if (isAuthPage) return <>{children}</>;
        return (
            <div className="flex flex-col min-h-screen bg-white">
                <PublicNavbar />
                <main className="flex-1">{children}</main>
                <PublicFooter />
            </div>
        );
    }

    const isAdminArea = pathname.startsWith("/admin");
    const isStaffArea = pathname.startsWith("/staff");

    // Check if user has a restricted status
    const userStatus = (session?.user as any)?.status;
    const userRole = (session?.user as any)?.role;
    const isRestricted = userRole === 'student' && userStatus && userStatus !== 'active' && statusConfig[userStatus];
    const statusInfo = isRestricted ? statusConfig[userStatus] : null;
    const isBlocked = isRestricted && !isPathAllowed(pathname) && !isAdminArea && !isStaffArea;

    return (
        <div className="flex bg-slate-50 min-h-screen text-slate-900">
            <Sidebar
                enabledModules={enabledModules}
                mobileOpen={mobileOpen}
                onClose={() => setMobileOpen(false)}
            />
            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile header bar */}
                <header className="md:hidden sticky top-0 z-40 bg-slate-900 text-white px-4 py-3 flex items-center gap-3 shadow-lg">
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-all"
                        aria-label="Open navigation menu"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-600 rounded-lg">
                            <ShieldCheck className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-black text-sm truncate">SchoolPortal</span>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <NotificationBell />
                        <LanguageSwitcher />
                    </div>
                </header>

                {/* Desktop top bar */}
                <div className="hidden md:flex items-center justify-end px-6 py-3 bg-white border-b border-slate-100 shadow-sm sticky top-0 z-30 gap-4">
                    <LanguageSwitcher />
                    <NotificationBell />
                </div>

                <main className="flex-1 overflow-y-auto relative" role="main">

                    {statusInfo && (
                        <div className={`px-4 py-3 border-b flex items-center gap-3 ${statusInfo.bgColor}`}>
                            {statusInfo.icon}
                            <div>
                                <span className={`font-black text-xs uppercase tracking-widest ${statusInfo.color}`}>
                                    {statusInfo.label}
                                </span>
                                <p className={`text-xs font-medium ${statusInfo.color} opacity-80`}>
                                    {statusInfo.message}
                                </p>
                            </div>
                            <Lock className={`w-4 h-4 ml-auto ${statusInfo.color} opacity-50`} />
                        </div>
                    )}
                    {isBlocked ? (
                        <div className="flex items-center justify-center min-h-[60vh]">
                            <div className="text-center space-y-4 max-w-md">
                                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
                                    <Lock className="w-8 h-8 text-slate-400" />
                                </div>
                                <h2 className="text-xl font-black text-slate-900 uppercase">Access Restricted</h2>
                                <p className="text-sm text-slate-500 font-medium">
                                    This page is not available for your current account status ({statusInfo?.label}).
                                    You can still view your dashboard, transcript, and profile.
                                </p>
                            </div>
                        </div>
                    ) : (
                        children
                    )}
                    {isAdminArea && <BursaryBot />}
                    {!isAdminArea && !isStaffArea && !isPublic && userRole === 'student' && <IntelligentTutoringSystem />}
                    {!isAdminArea && !isStaffArea && !isPublic && userRole === 'student' && <AIVoiceCoach />}
                </main>
            </div>
        </div>
    );
}
