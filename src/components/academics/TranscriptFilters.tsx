"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter, X } from "lucide-react";

interface TranscriptFiltersProps {
    sessions: any[];
}

export function TranscriptFilters({ sessions }: TranscriptFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const currentSession = searchParams.get("sessionId") || "all";
    const currentSemester = searchParams.get("semester") || "all";

    const updateFilter = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === "all") {
            params.delete(key);
        } else {
            params.set(key, value);
        }
        router.push(`?${params.toString()}`);
    };

    const clearFilters = () => {
        router.push("/student/transcript");
    };

    const hasFilters = currentSession !== "all" || currentSemester !== "all";

    return (
        <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 no-print">
            <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-black uppercase text-slate-500 tracking-widest">Period Filters</span>
            </div>

            <div className="flex gap-2">
                <Select value={currentSession} onValueChange={(v) => updateFilter("sessionId", v)}>
                    <SelectTrigger className="w-[180px] h-9 text-xs font-bold rounded-lg bg-slate-50 border-slate-200">
                        <SelectValue placeholder="Academic Session" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Sessions</SelectItem>
                        {sessions.map(s => (
                            <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={currentSemester} onValueChange={(v) => updateFilter("semester", v)}>
                    <SelectTrigger className="w-[150px] h-9 text-xs font-bold rounded-lg bg-slate-50 border-slate-200">
                        <SelectValue placeholder="Semester" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Full Transcript</SelectItem>
                        <SelectItem value="1">1st Semester</SelectItem>
                        <SelectItem value="2">2nd Semester</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {hasFilters && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-9 px-3 text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                    <X className="mr-2 w-3 h-3" />
                    Reset
                </Button>
            )}
        </div>
    );
}
