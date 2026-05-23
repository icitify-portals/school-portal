"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
    LayoutDashboard,
    BookOpen,
    Wallet,
    Home,
    GraduationCap,
    FileText,
    RefreshCw,
    Settings,
    LogOut,
    User,
    Shield,
    Landmark,
    ChevronDown,
    ChevronRight,
    PieChart,
    Trophy,
    ClipboardList,
    Receipt,
    Calculator,
    Database,
    ShieldCheck,
    ShieldAlert,
    Calendar,
    Activity,
    Award,
    Briefcase,
    UserCheck,
    Plus,
    MessageSquare,
    Megaphone,
    Users as UsersIcon,
    ArrowUpCircle,
    Globe,
    BrainCircuit,
    ClipboardCheck,
    Package,
    TrendingUp,
    ScrollText,
    Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { getBrandingSettings } from "@/actions/settings";
import { useBranch } from "@/providers/BranchProvider";
import { useAlias } from "@/hooks/useAlias";

interface MenuItem {
    name: string;
    icon: any;
    href?: string;
    subItems?: { name: string; href: string; module?: string }[];
    module?: string; // key for enabling/disabling
    role?: string;
}

const studentMenuItems: MenuItem[] = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/" },
    { name: "Admission Status", icon: GraduationCap, href: "/student/admission", module: "admission" },
    { name: "Course Registration", icon: BookOpen, href: "/student/registration", module: "results" }, // grouped with results/academics
    { name: "Add/Drop Module", icon: Plus, href: "/student/registration/add-drop", module: "results" },
    {
        name: "Payments & Wallet",
        icon: Wallet,
        module: "finance",
        subItems: [
            { name: "Finance Dashboard", href: "/student/finance" },
            { name: "Apply for Refund", href: "/student/finance/refund" },
        ]
    },
    {
        name: "Attendance",
        icon: ClipboardList,
        subItems: [
            { name: "Scan QR", href: "/student/attendance" },
            { name: "Attendance History", href: "/student/attendance/history" },
            { name: "My Excuses", href: "/student/attendance/excuses" },
        ]
    },
    { name: "Hostel Management", icon: Home, href: "/hostel", module: "hostels" },
    { name: "Academic Transcript", icon: FileText, href: "/student/transcript", module: "results" },
    { name: "Learning Analytics", icon: PieChart, href: "/student/analytics", module: "results" },
    { name: "Weekly Timetable", icon: Calendar, href: "/student/timetable" },
    { name: "Exam Clearance", icon: ShieldCheck, href: "/student/clearance", module: "exams_records" },
    { name: "Status Changes", icon: RefreshCw, href: "/status" },
    { name: "My Registrations", icon: FileText, href: "/student/registration" },
    { name: "Terminal Report Card", icon: PieChart, href: "/student/report-card" },
    { name: "CBT Center", icon: LayoutDashboard, href: "/student/cbt" },
    { name: "SmartBooks", icon: BookOpen, href: "/student/smartbooks", module: "its" },
    { name: "Hero Series", icon: Trophy, href: "/student/hero-series", module: "gamification" },
    { name: "My Achievements", icon: Award, href: "/student/achievements", module: "gamification" },
    { name: "SIWES Portal", icon: Briefcase, href: "/student/siwes" },
    { name: "Leaderboard", icon: Trophy, href: "/student/leaderboard", module: "gamification" },
    { name: "Digital ID Card", icon: ShieldCheck, href: "/student/id-card" },
    { name: "Class Recordings", icon: Database, href: "/student/recordings" },
    { name: "Communications", icon: MessageSquare, href: "/communications" },
    { name: "Sports & Athletics", icon: Trophy, href: "/student/sports", module: "sports" },
    { name: "Tutor Feedback", icon: UserCheck, href: "/student/evaluations" },
    { name: "Profile", icon: User, href: "/profile" },
];

const parentMenuItems: MenuItem[] = [
    { name: "My Dashboard", icon: LayoutDashboard, href: "/parent/dashboard" },
    { name: "Communication Center", icon: MessageSquare, href: "/parent/messages" },
    { name: "Financial Overview", icon: Wallet, href: "/parent/finance" },
    { name: "Profile", icon: User, href: "/profile" },
];

const adminMenuItems: MenuItem[] = [
    { name: "Admin Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
    { name: "Master Overwatch", icon: Globe, href: "/super-admin/dashboard", role: "superadmin" },
    {
        name: "Portal Settings",
        icon: Settings,
        subItems: [
            { name: "System Settings", href: "/admin/settings" },
            { name: "Environment & API Keys", href: "/admin/settings/env" },
            { name: "Module Governance", href: "/admin/settings/modules" },
            { name: "Theme Customization", href: "/admin/settings/theme" },
            { name: "Integrations", href: "/admin/settings/integrations" },
            { name: "Payment Gateways", href: "/admin/settings/payment-gateways" },
            { name: "Developer APIs", href: "/admin/settings/developer" },
        ]
    },
    { name: "Institutional Units", icon: Award, href: "/admin/settings/units" },
    {
        name: "Academics",
        icon: GraduationCap,
        module: "results",
        subItems: [
            { name: "Create Course", href: "/admin/courses" },
            { name: "Faculties", href: "/admin/faculties" },
            { name: "Departments", href: "/admin/departments" },
            { name: "Programmes", href: "/admin/programmes" },
            { name: "Curriculum Mapping", href: "/admin/curriculum" },
            { name: "Course Assignments", href: "/admin/academics/assignments" },
            { name: "Timetable", href: "/admin/academics/timetable" },
            { name: "Academic Calendar", href: "/admin/calendar" },
            { name: "AI Data Capture", href: "/admin/data-capture", module: "its" },
            { name: "Grading Systems", href: "/admin/settings/grading" },
            { name: "Registration Controls", href: "/admin/registration/controls" },
            { name: "Academic Transcripts", href: "/admin/academics/transcripts" },
            { name: "Result Views", href: "/admin/exams-records/results" },
            { name: "Quality Assurance", href: "/admin/quality-assurance" },
        ]
    },
    {
        name: "LMS & E-Learning",
        icon: BookOpen,
        module: "lms", // Assuming LMS is part of this or separate
        subItems: [
            { name: "Add/Drop Approvals", href: "/admin/students/add-drop" },
            { name: "Registration Approvals", href: "/admin/courses/approvals" },
            { name: "CBT Assessments", href: "/admin/cbt" },
            { name: "ITS Classroom Mode", href: "/admin/its/classroom", module: "its" },
            { name: "ITS Offline Sync", href: "/admin/its/sync", module: "its" },
            { name: "AI Grading Settings", href: "/admin/settings/ai", module: "its" },
            { name: "Leaderboard Metrics", href: "/admin/settings/leaderboard", module: "gamification" },
        ]
    },
    {
        name: "Finance & Accounting",
        icon: Landmark,
        module: "finance",
        subItems: [
            { name: "Accounting Dashboard", href: "/admin/accounting" },
            { name: "Chart of Accounts", href: "/admin/accounting/coa" },
            { name: "General Ledger", href: "/admin/accounting/ledger" },
            { name: "Trial Balance", href: "/admin/accounting/trial-balance" },
            { name: "Income Statement", href: "/admin/accounting/income" },
            { name: "Balance Sheet", href: "/admin/accounting/balance-sheet" },
            { name: "Audit & Fraud Alerts", href: "/admin/accounting/fraud" },
        ]
    },
    {
        name: "Bursary & Fees",
        icon: Wallet,
        subItems: [
            { name: "Fee Structures", href: "/admin/bursary/fees" },
            { name: "Fee Allocations", href: "/admin/bursary/allocations" },
            { name: "Discounts", href: "/admin/bursary/discounts" },
            { name: "Expenditure Requests", href: "/admin/bursary/expenditure" },
            { name: "External Inflows", href: "/admin/bursary/inflows" },
            { name: "Exam Clearance", href: "/admin/bursary/clearance" },
            { name: "Scholarships & Trusts", href: "/admin/bursary/scholarships" },
            { name: "Bank Reconciliation", href: "/admin/bursary/reconciliation" },
            { name: "Transaction History", href: "/admin/bursary/history" },
            { name: "School Bills", href: "/admin/bursary/bills" },
            { name: "Refund Management", href: "/admin/bursary/refunds" },
            { name: "Financial Reports", href: "/admin/bursary/reports" },
            { name: "Bursary Settings", href: "/admin/bursary/settings" },
        ]
    },
    {
        name: "Accounting & Reports",
        icon: Landmark,
        subItems: [
            { name: "Accounting Dashboard", href: "/admin/accounting" },
            { name: "Chart of Accounts", href: "/admin/accounting/coa" },
            { name: "General Ledger", href: "/admin/accounting/ledger" },
            { name: "Profit & Loss", href: "/admin/accounting/reports/pnl" },
            { name: "Balance Sheet", href: "/admin/accounting/reports/balance-sheet" },
            { name: "Fixed Assets", href: "/admin/accounting/assets" },
            { name: "Forecasting", href: "/admin/accounting/forecasting" },
            { name: "Fraud Sentinel", href: "/admin/accounting/fraud" },
            { name: "System Seeder", href: "/admin/accounting/seed" },
        ]
    },
    {
        name: "Analytics & Reports",
        icon: Activity,
        subItems: [
            { name: "Analytics Dashboard", href: "/admin/analytics" },
            { name: "Course Usage", href: "/admin/analytics/course-usage" },
            { name: "Student Participation", href: "/admin/analytics/participation" },
            { name: "Activity & Audit Logs", href: "/admin/security/audit" },
            { name: "Data Hub (Import/Export)", href: "/admin/data" },
        ]
    },
    {
        name: "Human Resources",
        icon: User,
        module: "hr",
        subItems: [
            { name: "Staff Directory", href: "/admin/hr" },
            { name: "Leave Management", href: "/admin/hr/leave" },
            { name: "Payroll Processing", href: "/admin/hr/payroll" },
            { name: "Recruitment (ATS)", href: "/admin/hr/recruitment" },
            { name: "Performance (KPI)", href: "/admin/hr/performance" },
            { name: "Salary Structures", href: "/admin/hr/salary-structures" },
            { name: "ID Card Registry", href: "/admin/hr/id-cards" },
            { name: "ID Card Governance", href: "/admin/hr/id-card-settings" },
            { name: "Relations & Learning", href: "/admin/hr/relations" },
            { name: "HR Settings", href: "/admin/hr/settings" },
        ]
    },
    {
        name: "Admission Management",
        icon: UserCheck,
        module: "admission",
        subItems: [
            { name: "Admission Dashboard", href: "/admin/admission" },
            { name: "Screening & Scoring", href: "/admin/admission/screening" },
            { name: "Admission Sessions", href: "/admin/admission/sessions" },
            { name: "Admission Settings", href: "/admin/admission/settings" },
        ]
    },
    {
        name: "Marketing & CRM",
        icon: TrendingUp,
        subItems: [
            { name: "Leads Dashboard", href: "/admin/crm" },
            { name: "Campaign Tracking", href: "/admin/crm/campaigns" },
            { name: "Marketing Analytics", href: "/admin/crm/analytics" },
        ]
    },
    {
        name: "Student Management",
        icon: User,
        subItems: [
            { name: "All Students", href: "/admin/students" },
            { name: "Records Mobility", href: "/admin/students/transfer" },
        ]
    },
    {
        name: "Identity & Access",
        icon: Shield,
        subItems: [
            { name: "User Manager", href: "/admin/users" },
            { name: "Cohort Groups", href: "/admin/cohorts" },
            { name: "Identity Center", href: "/admin/identity" },
            { name: "RBAC Settings", href: "/admin/rbac" },
            { name: "Portal Management", href: "/admin/settings/portal" },
        ]
    },
    { name: "Public Job Board", icon: Briefcase, href: "/jobs" },
    { name: "Academic Calendar", icon: Calendar, href: "/admin/calendar" },
    { name: "Performance Analytics", icon: PieChart, href: "/admin/analytics" },
    {
        name: "Attendance",
        icon: ClipboardList,
        subItems: [
            { name: "Scanner", href: "/admin/attendance" },
            { name: "Reports & Analysis", href: "/admin/attendance/reports" },
            { name: "Attendance Settings", href: "/admin/attendance/settings" },
        ]
    },
    {
        name: "Student Promotion",
        icon: ArrowUpCircle,
        subItems: [
            { name: "Promotion", href: "/admin/promotion" },
            { name: "Criteria Setup", href: "/admin/promotion/criteria" },
            { name: "HOD Reports", href: "/admin/promotion/reports" },
        ]
    },
    {
        name: "Communication",
        icon: Megaphone,
        subItems: [
            { name: "Broadcast Center", href: "/admin/announcements" },
            { name: "Global Forums", href: "/forums" },
            { name: "Direct Messages", href: "/communications" },
        ]
    },
    { name: "Registration Concessions", icon: ShieldAlert, href: "/admin/registration/concessions" },
    {
        name: "Security",
        icon: Shield,
        module: "security",
        subItems: [
            { name: "Security Dashboard", href: "/admin/security" },
            { name: "Audit Logs", href: "/admin/security/audit" },
            { name: "Exam Security", href: "/admin/security/exams" },
            { name: "GDPR Tools", href: "/admin/security/gdpr" },
        ]
    },
    { name: "SIWES Management", icon: Briefcase, href: "/admin/siwes" },
    {
        name: "CMS & Website",
        icon: Globe,
        subItems: [
            { name: "Pages Manager", href: "/admin/cms" },
            { name: "Menu Builder", href: "/admin/cms/menus" },
            { name: "Homepage Builder", href: "/admin/cms/homepage" },
        ]
    },
    {
        name: "Sports & Athletics",
        icon: Trophy,
        module: "sports",
        subItems: [
            { name: "Sports Dashboard", href: "/admin/sports" },
            { name: "Team Manager", href: "/admin/sports/teams" },
            { name: "Fixtures & Results", href: "/admin/sports/fixtures" },
            { name: "Sports Inventory", href: "/admin/sports/inventory" },
            { name: "Sports CMS & News", href: "/admin/cms/sports" },
        ]
    },
    {
        name: "Inventory & Stock",
        icon: Package,
        subItems: [
            { name: "Inventory Dashboard", href: "/admin/inventory" },
            { name: "Stock Movement", href: "/admin/inventory/transactions" },
            { name: "Suppliers & Vendors", href: "/admin/inventory/suppliers" },
        ]
    },
];

const dvcMenuItems: MenuItem[] = [
    { name: "DVC Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
    { name: "Registration Concessions", icon: ShieldAlert, href: "/admin/registration/concessions" },
    { name: "Profile", icon: User, href: "/profile" },
];

const staffMenuItems: MenuItem[] = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/staff/dashboard" },
    { name: "Result Grading", icon: GraduationCap, href: "/staff/results" },
    { name: "Assignments", icon: FileText, href: "/staff/assignments" },
    { name: "CBT Quizzes", icon: BrainCircuit, href: "/staff/quizzes" },
    { name: "Lesson Notes", icon: BookOpen, href: "/staff/courses" },
    {
        name: "Attendance",
        icon: ClipboardCheck,
        subItems: [
            { name: "Session Manager", href: "/staff/attendance" },
            { name: "Course Attendance", href: "/staff/attendance/course" },
            { name: "Excuse Review", href: "/staff/attendance/excuses" },
        ]
    },
    { name: "Class Recordings", icon: Database, href: "/staff/recordings" },
    { name: "Weekly Timetable", icon: Calendar, href: "/staff/timetable" },
    { name: "My Payslips", icon: Wallet, href: "/staff/payslips" },
    { name: "Expenditure Requests", icon: Wallet, href: "/staff/expenditure" },
    { name: "Staff ID Card", icon: ShieldCheck, href: "/staff/id-card" },
    { name: "Growth & Certifications", icon: Award, href: "/staff/growth" },
    { name: "Communications", icon: MessageSquare, href: "/communications" },
    { name: "Sports Coaching", icon: Trophy, href: "/staff/sports", module: "sports" },
    { name: "Student Evaluations", icon: UserCheck, href: "/staff/feedback" },
    { name: "Profile", icon: User, href: "/profile" },
];

export function Sidebar({ enabledModules = {}, mobileOpen = false, onClose }: {
    enabledModules?: Record<string, boolean>;
    mobileOpen?: boolean;
    onClose?: () => void;
}) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const { activeUnit, availableUnits, switchUnit, isK12 } = useBranch();
    const { alias } = useAlias();
    const [openMenus, setOpenMenus] = useState<string[]>([]);
    const [branding, setBranding] = useState<any>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        getBrandingSettings().then(setBranding);
    }, []);

    const role = (session?.user as any)?.role || 'student';

    // Close mobile sidebar on navigation
    useEffect(() => {
        if (mobileOpen && onClose) onClose();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

    const filterItems = (items: MenuItem[]) => {
        return items
            .filter(item => {
                if (item.module && enabledModules[item.module] === false) {
                    return false;
                }
                return true;
            })
            .map(item => {
                if (item.subItems) {
                    return {
                        ...item,
                        subItems: item.subItems.filter(sub => {
                            if (sub.module && enabledModules[sub.module] === false) {
                                return false;
                            }
                            if (isK12) {
                                const hiddenInK12 = [
                                    "/admin/faculties",
                                    "/admin/departments",
                                    "/admin/programmes",
                                    "/admin/registration/controls"
                                ];
                                if (hiddenInK12.includes(sub.href)) {
                                    return false;
                                }
                            }
                            return true;
                        })
                    };
                }
                return item;
            });
    };

    const rawMenuItems = (role === 'admin' || role === 'superadmin') ? adminMenuItems :
        role === 'dvc' ? dvcMenuItems :
            role === 'staff' ? staffMenuItems :
                role === 'parent' ? parentMenuItems :
                    studentMenuItems;

    const menuItems = filterItems(rawMenuItems);

    const toggleMenu = (name: string) => {
        setOpenMenus(prev =>
            prev.includes(name)
                ? prev.filter(m => m !== name)
                : [...prev, name]
        );
    };

    const sidebarContent = (
        <div 
            className="flex flex-col h-screen w-64 text-white border-r border-white/10"
            style={{ backgroundColor: 'var(--brand-secondary, #0f172a)' }}
        >
            <div className="p-6">
                <div className="flex items-center gap-3">
                    {branding?.INST_LOGO ? (
                        <img src={branding.INST_LOGO} alt="Logo" className="w-8 h-8 rounded-lg object-contain" />
                    ) : (
                        <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/20">
                            <ShieldCheck className="w-5 h-5 text-white" />
                        </div>
                    )}
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent truncate w-40">
                            {branding?.INST_NAME || "SchoolPortal"}
                        </h1>
                        {branding?.INST_MOTTO && (
                            <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest truncate w-40">
                                {branding.INST_MOTTO}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Branch Switcher */}
            {availableUnits.length > 1 && (
                <div className="px-6 mb-4">
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Active Branch</label>
                        <select 
                            value={activeUnit?.id} 
                            onChange={(e) => switchUnit(Number(e.target.value))}
                            className="w-full bg-slate-800 text-white text-xs font-bold rounded-lg p-2 border border-white/10 focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            {availableUnits.map((u) => (
                                <option key={u.unit.id} value={u.unit.id}>
                                    {u.unit.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar" role="navigation" aria-label="Main navigation">
                {menuItems.map((item) => {
                    const hasSubItems = item.subItems && item.subItems.length > 0;
                    const isOpen = openMenus.includes(item.name);
                    const isSubItemActive = hasSubItems && item.subItems?.some(sub => pathname === sub.href);
                    const isActive = pathname === item.href || isSubItemActive;

                    return (
                        <div key={item.name} className="space-y-1">
                            {hasSubItems ? (
                                <button
                                    onClick={() => toggleMenu(item.name)}
                                    aria-expanded={isOpen}
                                    className={cn(
                                        "flex items-center justify-between w-full px-3 py-2 rounded-xl transition-all hover:bg-white/10 group mb-0.5",
                                        isActive ? "text-white bg-indigo-600 shadow-xl shadow-indigo-600/20" : "text-white/90 hover:text-white"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-300")} />
                                        <span className="font-black text-[14px]">{item.name}</span>
                                    </div>
                                    {isOpen ? <ChevronDown className="w-4 h-4 text-white/50 group-hover:text-white" /> : <ChevronRight className="w-4 h-4 text-white/50 group-hover:text-white" />}
                                </button>
                            ) : item.href ? (
                                <Link
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2 rounded-xl transition-all hover:bg-white/10 group mb-0.5",
                                        pathname === item.href ? "text-white shadow-xl bg-indigo-600 shadow-indigo-600/20" : "text-white/90 hover:text-white"
                                    )}
                                >
                                    <item.icon className={cn("w-5 h-5", pathname === item.href ? "text-white" : "text-slate-400 group-hover:text-indigo-300")} />
                                    <span className="font-black text-[14px]">
                                        {item.name.replace("Student", alias("student" as any)).replace("Course", alias("course" as any)).replace("Semester", alias("term" as any))}
                                    </span>
                                </Link>
                            ) : null}

                            {hasSubItems && isOpen && (
                                <div className="ml-9 space-y-0.5 border-l border-slate-700/50 pl-2 mb-1">
                                    {item.subItems?.map((sub) => (
                                        <Link
                                            key={sub.name}
                                            href={sub.href}
                                            className={cn(
                                                "block px-3 py-1.5 text-[11px] font-black rounded-lg transition-all",
                                                pathname === sub.href
                                                    ? "bg-white/20 text-white"
                                                    : "text-white/70 hover:text-white hover:bg-white/5"
                                            )}
                                        >
                                            {sub.name.replace("Course", isK12 ? "Subject" : "Course").replace("course", isK12 ? "subject" : "course")}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-800 space-y-1">
                <Link
                    href="/"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition-all font-medium text-sm"
                >
                    <Globe className="w-5 h-5 text-slate-400" />
                    <span>Public Homepage</span>
                </Link>
                <Link
                    href="/profile"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition-all font-medium text-sm"
                >
                    <Settings className="w-5 h-5 text-slate-400" />
                    <span>Settings</span>
                </Link>
                <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-all font-medium text-sm"
                >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop sidebar */}
            <aside className="hidden md:block shrink-0" aria-label="Sidebar navigation">
                {sidebarContent}
            </aside>

            {/* Mobile sidebar drawer */}
            {mobileOpen && (
                <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                        onClick={onClose}
                        aria-hidden="true"
                    />
                    {/* Drawer */}
                    <div className="fixed inset-y-0 left-0 w-64 shadow-2xl shadow-black/50 animate-in slide-in-from-left duration-300">
                        {sidebarContent}
                    </div>
                </div>
            )}
        </>
    );
}

