"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Shield, Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface AssignmentFormProps {
    course: any;
    staff: any[];
    deptId: string;
    session: any;
    onAssign: (courseId: number, staffId: string, role: 'main' | 'co_lecturer') => Promise<void>;
}

export function AssignmentForm({ course, staff, deptId, session, onAssign }: AssignmentFormProps) {
    const [open, setOpen] = useState(false);
    const [selectedStaffId, setSelectedStaffId] = useState<string>("");
    const [role, setRole] = useState<'main' | 'co_lecturer'>('main');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!selectedStaffId) return;
        setIsSubmitting(true);
        try {
            await onAssign(course.id, selectedStaffId, role);
            setSelectedStaffId("");
            setRole('main');
            setOpen(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedStaff = staff.find(s => s.id.toString() === selectedStaffId);

    return (
        <div className="space-y-4 pt-4">
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Lecturer</label>
                <Popover open={open} onOpenChange={setOpen} modal={true}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-full h-11 justify-between rounded-xl bg-slate-50 border-slate-200 hover:bg-slate-100"
                        >
                            {selectedStaff ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                        {selectedStaff.user.name.charAt(0)}
                                    </div>
                                    <span className="font-medium text-slate-700">{selectedStaff.user.name}</span>
                                </div>
                            ) : (
                                <span className="text-slate-500 font-normal">Select Staff Member...</span>
                            )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl z-[999]" align="start">
                        <Command>
                            <CommandInput placeholder="Search staff..." />
                            <CommandList>
                                <CommandEmpty>No staff found.</CommandEmpty>
                                <CommandGroup>
                                    {staff.map((s) => (
                                        <CommandItem
                                            key={s.id}
                                            value={s.user.name}
                                            onSelect={() => {
                                                setSelectedStaffId(s.id.toString());
                                                setOpen(false);
                                            }}
                                            className="gap-2 cursor-pointer py-3"
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4 text-indigo-600",
                                                    selectedStaffId === s.id.toString() ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">{s.user.name}</span>
                                                <span className="text-[10px] text-slate-500">
                                                    {s.jobTitle} {s.staffId ? `• ${s.staffId}` : ''}
                                                </span>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Role</label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => setRole('main')}
                        className={cn(
                            "h-12 rounded-xl border flex items-center justify-center gap-2 transition-all",
                            role === 'main'
                                ? "bg-indigo-50 border-indigo-200 text-indigo-700 ring-2 ring-indigo-500/20"
                                : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                        )}
                    >
                        <Shield className="w-4 h-4" />
                        <span className="text-xs font-bold">Main Lecturer</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setRole('co_lecturer')}
                        className={cn(
                            "h-12 rounded-xl border flex items-center justify-center gap-2 transition-all",
                            role === 'co_lecturer'
                                ? "bg-slate-900 border-slate-900 text-white ring-2 ring-slate-900/20"
                                : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                        )}
                    >
                        <User className="w-4 h-4" />
                        <span className="text-xs font-bold">Co-Lecturer</span>
                    </button>
                </div>
            </div>

            <Button
                onClick={handleSubmit}
                disabled={!selectedStaffId || isSubmitting}
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-100 mt-4"
            >
                {isSubmitting ? "Assigning..." : "Assign Lecturer"}
            </Button>
        </div>
    );
}
