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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getMenus } from "@/actions/cms";
import { useSession } from "next-auth/react";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function PublicNavbar() {
    const [menus, setMenus] = useState<any[]>([]);
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const { data: session } = useSession();
    const pathname = usePathname();

    useEffect(() => {
        getMenus().then(res => {
            if (res.success && res.data) setMenus(res.data);
        });

        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <nav className={cn(
            "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
            isScrolled
                ? "bg-white/80 backdrop-blur-md border-slate-200 py-3"
                : "bg-transparent border-transparent py-5"
        )}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/20 group-hover:scale-110 transition-transform">
                            <ShieldCheck className="w-6 h-6 text-white" />
                        </div>
                        <span className={cn(
                            "text-xl font-black tracking-tighter uppercase italic",
                            isScrolled ? "text-slate-900" : "text-slate-900" // Always dark for now for visibility
                        )}>
                            School<span className="text-indigo-600">Portal</span>
                        </span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-8">
                        {menus.map((item) => (
                            <div key={item.id} className="relative group">
                                {item.children && item.children.length > 0 ? (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-bold text-slate-600 hover:text-indigo-600 outline-none transition-colors uppercase tracking-widest text-[11px]">
                                            {item.label}
                                            <ChevronDown className="w-3 h-3 opacity-50 group-data-[state=open]:rotate-180 transition-transform" />
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start" className="w-72 rounded-2xl p-2 shadow-2xl border-slate-100 bg-white/95 backdrop-blur-xl">
                                            {item.children.map((child: any) => {
                                                const Icon = (child.icon && ( {
                                                    'Library': Library,
                                                    'Book': Book,
                                                    'GraduationCap': GraduationCap,
                                                    'School': School,
                                                    'FileText': FileText,
                                                } as any)[child.icon]) || Globe;

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
                                ) : (
                                    <Link
                                        href={item.href}
                                        className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors uppercase tracking-widest text-[11px] relative"
                                    >
                                        {item.label}
                                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-600 transition-all group-hover:w-full" />
                                    </Link>
                                )}
                            </div>
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
                <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-100 shadow-xl p-4 space-y-4 animate-in slide-in-from-top-4">
                    {menus.map((item) => (
                        <div key={item.id} className="space-y-2">
                            <Link
                                href={item.href}
                                className="block text-lg font-bold text-slate-800"
                                onClick={() => setMobileOpen(false)}
                            >
                                {item.label}
                            </Link>
                            {item.children && item.children.length > 0 && (
                                <div className="ml-4 space-y-2 border-l-2 border-slate-100 pl-4">
                                    {item.children.map((child: any) => (
                                        <Link
                                            key={child.id}
                                            href={child.href}
                                            className="block text-slate-500 font-medium"
                                            onClick={() => setMobileOpen(false)}
                                        >
                                            {child.label}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                    <div className="pt-4 border-t border-slate-100">
                        <Button asChild className="w-full bg-indigo-600 rounded-xl h-12 font-bold">
                            <Link href="/login">Contact Support</Link>
                        </Button>
                    </div>
                </div>
            )}
        </nav>
    );
}
