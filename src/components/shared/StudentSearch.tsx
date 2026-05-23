"use client";

import { useState } from "react";
import { Search, Loader2, User, Check } from "lucide-react";
import { getStudents } from "@/actions/students";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StudentSearchProps {
    onSelect: (student: any) => void;
    placeholder?: string;
    className?: string;
}

export default function StudentSearch({ onSelect, placeholder, className }: StudentSearchProps) {
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!search.trim()) return;

        setLoading(true);
        const res = await getStudents({ search });
        if (res.success) {
            setResults(res.data);
        }
        setLoading(false);
    };

    return (
        <div className={cn("space-y-4", className)}>
            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder={placeholder || "Search by name or matric number..."}
                        className="pl-9 h-11 rounded-xl"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Button type="submit" disabled={loading} className="h-11 rounded-xl px-6">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
                </Button>
            </form>

            {results.length > 0 && (
                <Card className="border shadow-sm divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
                    {results.map((student) => (
                        <div
                            key={student.id}
                            onClick={() => {
                                setSelectedId(student.id);
                                onSelect(student);
                            }}
                            className={cn(
                                "p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors",
                                selectedId === student.id && "bg-indigo-50/50"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                                    <User className="w-4 h-4 text-slate-400" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-slate-900">{student.user?.name}</span>
                                    <span className="text-xs text-slate-500 font-medium">
                                        {student.matricNumber || "No Matric"} • {student.programme?.name || "No Programme"}
                                    </span>
                                </div>
                            </div>
                            {selectedId === student.id && (
                                <Check className="w-4 h-4 text-indigo-600" />
                            )}
                        </div>
                    ))}
                </Card>
            )}

            {!loading && search && results.length === 0 && (
                <p className="text-center py-4 text-sm text-slate-400 italic">No students found matching "{search}"</p>
            )}
        </div>
    );
}
