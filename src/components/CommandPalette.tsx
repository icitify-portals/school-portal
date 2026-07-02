"use client";

import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Search } from "lucide-react";

export function CommandPalette({ userRole }: { userRole: string }) {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const runCommand = (command: () => void) => {
        setOpen(false);
        command();
    };

    const items = [
        { title: "Dashboard", href: `/${userRole}` },
        { title: "Profile", href: `/${userRole}/profile` },
        { title: "Settings", href: `/${userRole}/settings` },
    ];

    if (userRole === "admin") {
        items.push({ title: "Students Directory", href: "/admin/students" });
        items.push({ title: "Staff Directory", href: "/admin/hr" });
        items.push({ title: "Finance Overview", href: "/admin/finance" });
        items.push({ title: "CBT Question Banks", href: "/admin/cbt/banks" });
    }
    
    if (userRole === "student") {
        items.push({ title: "Pay Fees", href: "/student/finance" });
        items.push({ title: "My Results", href: "/student/results" });
        items.push({ title: "CBT Exams", href: "/student/cbt" });
        items.push({ title: "Hostel Allocation", href: "/student/finance/hostel" });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="p-0 overflow-hidden shadow-2xl bg-white border-0 sm:max-w-[500px]">
                <Command className="w-full flex flex-col">
                    <div className="flex items-center border-b px-3">
                        <Search className="mr-2 h-5 w-5 shrink-0 opacity-50 text-slate-500" />
                        <Command.Input 
                            placeholder="Type a command or search... (Cmd+K)" 
                            className="flex h-14 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-400 focus:ring-0 border-0" 
                        />
                    </div>
                    <Command.List className="max-h-[350px] overflow-y-auto overflow-x-hidden p-2 text-slate-700">
                        <Command.Empty className="py-6 text-center text-sm text-slate-500">No results found.</Command.Empty>
                        <Command.Group heading="Navigation" className="px-2 py-1.5 text-xs font-medium text-slate-500">
                            {items.map((item) => (
                                <Command.Item
                                    key={item.href}
                                    onSelect={() => runCommand(() => router.push(item.href))}
                                    className="relative flex cursor-pointer select-none items-center rounded-lg px-3 py-3 text-sm outline-none aria-selected:bg-emerald-50 aria-selected:text-emerald-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                                >
                                    {item.title}
                                </Command.Item>
                            ))}
                        </Command.Group>
                    </Command.List>
                </Command>
            </DialogContent>
        </Dialog>
    );
}
