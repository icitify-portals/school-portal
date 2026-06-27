"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Menu,
    X,
    ChevronDown,
    ShieldCheck,
    Search,
    User,
    Globe,
    Book,
    Library,
    GraduationCap,
    School,
    FileText,
    BookOpen,
    Calendar,
    HelpCircle,
    Phone,
    Info,
    Award,
    Shield,
    Users,
    Zap,
    ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getMenusBySlot } from "@/actions/cms";
import { useSession } from "next-auth/react";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const IconMap: Record<string, any> = {
    Library,
    Book,
    BookOpen,
    GraduationCap,
    School,
    FileText,
    Calendar,
    Award,
    Info,
    HelpCircle,
    Phone,
    Shield,
    Users,
    Zap,
};

// ────────────────────────────────────────────────────────
// Individual menu-style renderers (desktop)
// ────────────────────────────────────────────────────────

/** Mega Menu: full-width panel with icon grid + featured card */
function MegaMenuItem({ item }: { item: any }) {
    return (
        <div className="group relative">
            <button className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 hover:text-indigo-600 outline-none transition-colors uppercase tracking-widest py-3">
                {item.label}
                <ChevronDown className="w-3.5 h-3.5 opacity-50 group-hover:rotate-180 transition-transform duration-300" />
            </button>

            {/* Panel */}
            <div className="absolute top-[100%] left-0 right-0 w-[860px] -translate-x-1/4 bg-white/95 backdrop-blur-xl border border-slate-100 shadow-2xl rounded-3xl p-8 grid grid-cols-4 gap-8 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-50">
                {/* Children grid */}
                <div className="col-span-3 grid grid-cols-3 gap-3">
                    {item.children?.map((child: any) => {
                        const Icon = (child.icon && IconMap[child.icon]) || Globe;
                        return (
                            <Link
                                key={child.id}
                                href={child.href}
                                className="group/item flex gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all duration-200"
                            >
                                <div className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover/item:bg-white group-hover/item:text-indigo-600 group-hover/item:shadow-md transition-all shrink-0">
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-sm font-bold text-slate-900 group-hover/item:text-indigo-600 transition-colors">{child.label}</span>
                                    {child.description && (
                                        <span className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2">{child.description}</span>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* Featured card */}
                <div className="col-span-1 bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-3xl p-6 text-white flex flex-col justify-between relative overflow-hidden shadow-xl shadow-indigo-600/10 min-h-[220px]">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-[8rem] z-0" />
                    <div className="relative z-10 space-y-4">
                        <div className="p-3 bg-white/10 rounded-2xl w-fit">
                            <GraduationCap className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h4 className="text-lg font-black uppercase tracking-tight italic">Portal Admission</h4>
                            <p className="text-xs text-indigo-100 font-medium leading-relaxed mt-1">
                                Applications are currently open for the 2026/2027 academic session. Apply online.
                            </p>
                        </div>
                    </div>
                    <Button asChild className="w-full bg-white text-indigo-900 hover:bg-slate-50 rounded-xl font-bold uppercase tracking-wider text-xs h-11 relative z-10 shadow-lg mt-6 border-none">
                        <Link href="/register">Apply Online</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}

/** Dropdown: classic hover dropdown */
function DropdownMenuItem2({ item }: { item: any }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-indigo-600 outline-none transition-colors uppercase tracking-widest">
                {item.label}
                <ChevronDown className="w-3 h-3 opacity-50 group-data-[state=open]:rotate-180 transition-transform" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72 rounded-2xl p-2 shadow-2xl border-slate-100 bg-white/95 backdrop-blur-xl">
                {item.children?.map((child: any) => {
                    const Icon = (child.icon && IconMap[child.icon]) || Globe;
                    return (
                        <DropdownMenuItem key={child.id} asChild className="rounded-xl p-3 focus:bg-indigo-50 group/item">
                            <Link href={child.href} className="flex gap-3 w-full">
                                <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-focus:bg-white group-focus:text-indigo-600 transition-colors">
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{child.label}</span>
                                    {child.description && (
                                        <span className="text-[10px] text-slate-400 line-clamp-1">{child.description}</span>
                                    )}
                                </div>
                            </Link>
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

/** Accordion: click-to-expand inline (desktop rarely uses this but we support it) */
function AccordionMenuItem({ item }: { item: any }) {
    const [open, setOpen] = useState(false);
    if (!item.children?.length) {
        return (
            <Link href={item.href} className="text-[11px] font-bold text-slate-600 hover:text-indigo-600 transition-colors uppercase tracking-widest">
                {item.label}
            </Link>
        );
    }
    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 hover:text-indigo-600 outline-none transition-colors uppercase tracking-widest py-3"
            >
                {item.label}
                <ChevronDown className={cn("w-3.5 h-3.5 opacity-50 transition-transform duration-300", open && "rotate-180")} />
            </button>
            {open && (
                <div className="absolute top-full left-0 bg-white/95 backdrop-blur-xl border border-slate-100 shadow-2xl rounded-2xl p-3 w-64 z-50 space-y-1 animate-in slide-in-from-top-2">
                    {item.children.map((child: any) => (
                        <Link
                            key={child.id}
                            href={child.href}
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-2 p-3 rounded-xl hover:bg-slate-50 text-sm font-medium text-slate-700 hover:text-indigo-600 transition-all"
                        >
                            <ChevronRight className="w-4 h-4 text-slate-300" />
                            {child.label}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

/** Simple Links: flat links, no sub-panels */
function SimpleMenuItem({ item }: { item: any }) {
    return (
        <div className="relative group">
            <Link
                href={item.href}
                className="text-[11px] font-bold text-slate-600 hover:text-indigo-600 transition-colors uppercase tracking-widest relative"
            >
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-600 transition-all group-hover:w-full" />
            </Link>
        </div>
    );
}

/** Route any item to the correct renderer based on menu_style */
function DesktopNavItem({ item }: { item: any }) {
    const style = item.menu_style || 'dropdown';
    const hasChildren = item.children && item.children.length > 0;

    if (!hasChildren) return <SimpleMenuItem item={item} />;

    switch (style) {
        case 'mega':      return <MegaMenuItem item={item} />;
        case 'accordion': return <AccordionMenuItem item={item} />;
        case 'simple':    return <SimpleMenuItem item={item} />;
        default:          return <DropdownMenuItem2 item={item} />;
    }
}

// ────────────────────────────────────────────────────────
// Main Navbar
// ────────────────────────────────────────────────────────

export function PublicNavbar() {
    const [primaryMenus, setPrimaryMenus] = useState<any[]>([]);
    const [secondaryMenus, setSecondaryMenus] = useState<any[]>([]);
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [mobileExpanded, setMobileExpanded] = useState<number | null>(null);
    const { data: session } = useSession();
    const pathname = usePathname();

    useEffect(() => {
        // Load primary slot
        getMenusBySlot('primary').then(res => {
            if (res.success && res.data) setPrimaryMenus(res.data);
        });
        // Load secondary slot (shown as utility strip)
        getMenusBySlot('secondary').then(res => {
            if (res.success && res.data) setSecondaryMenus(res.data);
        });

        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <>
            {/* Secondary utility bar */}
            {secondaryMenus.length > 0 && (
                <div className="hidden md:flex items-center justify-end gap-6 px-8 py-1.5 bg-slate-900 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-800">
                    {secondaryMenus.map(item => (
                        <Link
                            key={item.id}
                            href={item.href}
                            className="hover:text-white transition-colors"
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>
            )}

            {/* Primary nav */}
            <nav className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
                secondaryMenus.length > 0 ? "mt-[30px]" : "",
                isScrolled
                    ? "bg-white/80 backdrop-blur-md border-slate-200 py-3"
                    : "bg-transparent border-transparent py-5"
            )}>
                <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="flex justify-between items-center">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/20 group-hover:scale-110 transition-transform">
                                <ShieldCheck className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-black tracking-tighter uppercase italic text-slate-900">
                                School<span className="text-indigo-600">Portal</span>
                            </span>
                        </Link>

                        {/* Desktop Menu */}
                        <div className="hidden md:flex items-center gap-8">
                            {primaryMenus.map(item => (
                                <DesktopNavItem key={item.id} item={item} />
                            ))}
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="icon" className="text-slate-500 rounded-full hover:bg-slate-100">
                                <Search className="w-5 h-5" />
                            </Button>
                            <LanguageSwitcher />
                            <Button asChild className="hidden sm:flex bg-indigo-600 hover:bg-indigo-700 rounded-full px-6 h-10 font-bold shadow-lg shadow-indigo-600/20">
                                <Link href={session ? "/dashboard" : "/login"}>
                                    <User className="w-4 h-4 mr-2" />
                                    {session ? "My Dashboard" : "Portal Login"}
                                </Link>
                            </Button>
                            <button
                                className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                                onClick={() => setMobileOpen(!mobileOpen)}
                            >
                                {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileOpen && (
                    <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-100 shadow-xl p-4 space-y-2 animate-in slide-in-from-top-4">
                        {primaryMenus.map(item => (
                            <div key={item.id}>
                                <div className="flex items-center justify-between">
                                    <Link
                                        href={item.href}
                                        className="block text-lg font-bold text-slate-800 py-2"
                                        onClick={() => setMobileOpen(false)}
                                    >
                                        {item.label}
                                    </Link>
                                    {item.children?.length > 0 && (
                                        <button
                                            onClick={() => setMobileExpanded(mobileExpanded === item.id ? null : item.id)}
                                            className="p-1 text-slate-400"
                                        >
                                            <ChevronDown className={cn("w-4 h-4 transition-transform", mobileExpanded === item.id && "rotate-180")} />
                                        </button>
                                    )}
                                </div>
                                {item.children?.length > 0 && mobileExpanded === item.id && (
                                    <div className="ml-4 space-y-1 border-l-2 border-slate-100 pl-4 pb-2 animate-in slide-in-from-top-2">
                                        {item.children.map((child: any) => (
                                            <Link
                                                key={child.id}
                                                href={child.href}
                                                className="flex items-center gap-2 py-1.5 text-slate-500 font-medium text-sm hover:text-indigo-600 transition-colors"
                                                onClick={() => setMobileOpen(false)}
                                            >
                                                <ChevronRight className="w-3 h-3 text-slate-300" />
                                                {child.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Secondary links in mobile */}
                        {secondaryMenus.length > 0 && (
                            <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-3">
                                {secondaryMenus.map(item => (
                                    <Link
                                        key={item.id}
                                        href={item.href}
                                        className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors"
                                        onClick={() => setMobileOpen(false)}
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                        )}

                        <div className="pt-4 border-t border-slate-100">
                            <Button asChild className="w-full bg-indigo-600 rounded-xl h-12 font-bold">
                                <Link href={session ? "/dashboard" : "/login"}>
                                    <User className="w-4 h-4 mr-2" />
                                    {session ? "Dashboard" : "Portal Login"}
                                </Link>
                            </Button>
                        </div>
                    </div>
                )}
            </nav>
        </>
    );
}
