"use client";

import { useState, useEffect } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { getAcademicSessions, getCurrentSession } from "@/actions/portal";
import { Calendar } from "lucide-react";

interface SessionSelectorProps {
    onSessionChange: (sessionName: string) => void;
    defaultValue?: string;
    className?: string;
}

export function SessionSelector({ onSessionChange, defaultValue, className }: SessionSelectorProps) {
    const [sessions, setSessions] = useState<any[]>([]);
    const [selected, setSelected] = useState<string>(defaultValue || "");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const [all, current] = await Promise.all([
                getAcademicSessions(),
                getCurrentSession()
            ]);
            setSessions(all);

            if (!defaultValue && current) {
                setSelected(current.name);
                onSessionChange(current.name);
            }
            setLoading(false);
        }
        load();
    }, [defaultValue, onSessionChange]);

    const handleChange = (val: string) => {
        setSelected(val);
        onSessionChange(val);
    };

    if (loading) return <div className="h-10 w-40 bg-slate-100 animate-pulse rounded-xl"></div>;

    return (
        <div className={className}>
            <Select value={selected} onValueChange={handleChange}>
                <SelectTrigger className="h-11 w-48 rounded-xl bg-white border-slate-200 font-bold text-xs text-slate-600 shadow-sm">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                        <SelectValue placeholder="Select Session" />
                    </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                    {sessions.map((s) => (
                        <SelectItem key={s.id} value={s.name} className="font-bold">
                            {s.name} Academic Session {s.isCurrent && " (Active)"}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
