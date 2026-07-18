"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, PlusCircle, ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const GRADES = ["A1", "B2", "B3", "C4", "C5", "C6", "D7", "E8", "F9"];

const GRADE_LABELS: Record<string, string> = {
    A1: "Excellent",
    B2: "Very Good",
    B3: "Good",
    C4: "Credit",
    C5: "Credit",
    C6: "Credit",
    D7: "Pass",
    E8: "Pass",
    F9: "Fail",
};

const OLEVEL_SUBJECTS = [
    "Mathematics",
    "English Language",
    "Physics",
    "Chemistry",
    "Biology",
    "Agricultural Science",
    "Economics",
    "Geography",
    "Government",
    "Civic Education",
    "Commerce",
    "Accounting",
    "Further Mathematics",
    "Literature in English",
    "Christian Religious Studies",
    "Islamic Religious Studies",
    "History",
    "Computer Studies",
    "Data Processing",
    "Technical Drawing",
    "Fine Art",
    "French",
    "Igbo",
    "Hausa",
    "Yoruba",
    "Food and Nutrition",
    "Home Management",
    "Physical and Health Education",
    "Automobile Mechanics",
    "Woodwork",
    "Electrical Installation",
    "Plumbing and Pipe Fitting",
    "Building Construction",
    "Painting and Decorating",
    "Printing Craft",
    "Photography",
    "Book Keeping",
    "Marketing",
    "Stenography",
    "Typewriting",
    "English Language (Alternative)",
    "Applied Electricity",
    "Electronics",
    "Machine Woodwork",
    "General Mathematics",
].sort();

const MAX_SUBJECTS = 9;

interface SittingData {
    examBodyId: string;
    examYear: string;
    examNumber: string;
    subjects: { subjectName: string; grade: string }[];
}

interface SittingFormProps {
    sittingNumber: number;
    sittingData: SittingData;
    examBodies: any[];
    selectedSubjectsInOtherSittings: string[];
    onFieldChange: (field: string, value: string) => void;
    onSubjectChange: (subIdx: number, field: string, value: string) => void;
    onAddSubject: () => void;
    onRemoveSubject: (subIdx: number) => void;
}

function SittingForm({
    sittingNumber,
    sittingData,
    examBodies,
    selectedSubjectsInOtherSittings,
    onFieldChange,
    onSubjectChange,
    onAddSubject,
    onRemoveSubject,
}: SittingFormProps) {
    const getAvailableSubjects = (currentSubjectName: string) => {
        const subjectsInThisSitting = sittingData.subjects.map((s) => s.subjectName).filter(Boolean);
        return OLEVEL_SUBJECTS.filter((s) => {
            if (s === currentSubjectName) return true;
            if (subjectsInThisSitting.includes(s)) return false;
            return true;
        });
    };

    const years = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: 15 }, (_, i) => currentYear - i);
    }, []);

    return (
        <div className="bg-white border-2 border-slate-100 rounded-3xl p-6 space-y-5 shadow-sm">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-sm font-black">
                    {sittingNumber}
                </div>
                <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                        Sitting {sittingNumber}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Examination details and results
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                        Exam Body *
                    </label>
                    <Select
                        value={sittingData.examBodyId || ""}
                        onValueChange={(val) => onFieldChange("examBodyId", val)}
                    >
                        <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold text-sm">
                            <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            {examBodies.map((b: any) => (
                                <SelectItem key={b.id} value={b.id.toString()} className="font-bold text-sm">
                                    {b.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                        Exam Year *
                    </label>
                    <Select
                        value={sittingData.examYear || ""}
                        onValueChange={(val) => onFieldChange("examYear", val)}
                    >
                        <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold text-sm">
                            <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            {years.map((year) => (
                                <SelectItem key={year} value={year.toString()} className="font-bold text-sm">
                                    {year}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                        Exam Number *
                    </label>
                    <input
                        className="w-full h-12 bg-slate-50 border-none rounded-xl px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        value={sittingData.examNumber || ""}
                        onChange={(e) => onFieldChange("examNumber", e.target.value)}
                        placeholder="e.g. 4251234567"
                    />
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                        Subjects & Grades
                    </label>
                    <span className="text-[10px] font-bold text-slate-400">
                        {sittingData.subjects.length}/{MAX_SUBJECTS}
                    </span>
                </div>

                {sittingData.subjects.map((sub: any, subIdx: number) => (
                    <div key={subIdx} className="flex gap-3 items-center group">
                        <div className="w-8 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 shrink-0">
                            {subIdx + 1}
                        </div>
                        <div className="flex-1">
                            <Select
                                value={sub.subjectName || ""}
                                onValueChange={(val) => onSubjectChange(subIdx, "subjectName", val)}
                            >
                                <SelectTrigger className="rounded-xl h-10 bg-slate-50 border-none font-bold text-sm">
                                    <SelectValue placeholder="Select subject..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl max-h-64">
                                    {getAvailableSubjects(sub.subjectName).map((s) => (
                                        <SelectItem key={s} value={s} className="font-bold text-sm">
                                            {s}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-40">
                            <Select
                                value={sub.grade || ""}
                                onValueChange={(val) => onSubjectChange(subIdx, "grade", val)}
                            >
                                <SelectTrigger className="rounded-xl h-10 bg-slate-50 border-none font-bold text-sm">
                                    <SelectValue placeholder="Grade" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {GRADES.map((g) => (
                                        <SelectItem key={g} value={g} className="font-bold text-sm">
                                            <span className="flex items-center gap-2">
                                                <span className="font-black">{g}</span>
                                                <span className="text-slate-400 text-[10px]">{GRADE_LABELS[g]}</span>
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => onRemoveSubject(subIdx)}
                            disabled={sittingData.subjects.length <= 1}
                            className="shrink-0 h-10 w-10 rounded-xl opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                        >
                            <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                    </div>
                ))}

                {sittingData.subjects.length < MAX_SUBJECTS && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onAddSubject}
                        className="mt-2 rounded-xl border-dashed border-2 border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 font-bold text-[10px] uppercase tracking-widest px-6 py-5"
                    >
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Subject
                    </Button>
                )}
            </div>
        </div>
    );
}

export default function OLevelSubmission({
    value,
    onChange,
    examBodies,
}: {
    value: any[];
    onChange: (val: any) => void;
    examBodies: any[];
}) {
    const [numSittings, setNumSittings] = useState<"1" | "2">(
        value && value.length === 2 ? "2" : "1"
    );

    useEffect(() => {
        if (!value || value.length === 0) {
            onChange([
                { examBodyId: "", examYear: "", examNumber: "", subjects: [{ subjectName: "", grade: "" }] },
            ]);
        }
    }, []);

    const handleNumSittingsChange = (val: "1" | "2") => {
        setNumSittings(val);
        if (val === "2" && value.length === 1) {
            onChange([
                value[0],
                { examBodyId: "", examYear: "", examNumber: "", subjects: [{ subjectName: "", grade: "" }] },
            ]);
        } else if (val === "1" && value.length > 1) {
            onChange([value[0]]);
        }
    };

    const updateField = (idx: number, field: string, val: string) => {
        const newVal = JSON.parse(JSON.stringify(value));
        newVal[idx][field] = val;
        onChange(newVal);
    };

    const updateSubject = (idx: number, subIdx: number, field: string, val: string) => {
        const newVal = JSON.parse(JSON.stringify(value));
        newVal[idx].subjects[subIdx][field] = val;
        onChange(newVal);
    };

    const addSubject = (idx: number) => {
        const newVal = JSON.parse(JSON.stringify(value));
        newVal[idx].subjects.push({ subjectName: "", grade: "" });
        onChange(newVal);
    };

    const removeSubject = (idx: number, subIdx: number) => {
        const newVal = JSON.parse(JSON.stringify(value));
        newVal[idx].subjects.splice(subIdx, 1);
        onChange(newVal);
    };

    const getSubjectsInOtherSittings = (currentIdx: number): string[] => {
        return value
            .filter((_, i) => i !== currentIdx)
            .flatMap((s) => (s.subjects || []).map((sub: any) => sub.subjectName).filter(Boolean));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                        O-Level Results
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        Enter your examination results below
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => handleNumSittingsChange("1")}
                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                            numSittings === "1"
                                ? "bg-indigo-600 text-white border-indigo-600"
                                : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                        }`}
                    >
                        1 Sitting
                    </button>
                    <button
                        type="button"
                        onClick={() => handleNumSittingsChange("2")}
                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                            numSittings === "2"
                                ? "bg-indigo-600 text-white border-indigo-600"
                                : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                        }`}
                    >
                        2 Sittings
                    </button>
                </div>
            </div>

            {value?.map((sittingData: SittingData, idx: number) => (
                <SittingForm
                    key={idx}
                    sittingNumber={idx + 1}
                    sittingData={sittingData}
                    examBodies={examBodies}
                    selectedSubjectsInOtherSittings={getSubjectsInOtherSittings(idx)}
                    onFieldChange={(field, val) => updateField(idx, field, val)}
                    onSubjectChange={(subIdx, field, val) => updateSubject(idx, subIdx, field, val)}
                    onAddSubject={() => addSubject(idx)}
                    onRemoveSubject={(subIdx) => removeSubject(idx, subIdx)}
                />
            ))}
        </div>
    );
}
