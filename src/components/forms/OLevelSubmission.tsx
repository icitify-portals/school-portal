"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, PlusCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const GRADES = ["A1", "B2", "B3", "C4", "C5", "C6", "D7", "E8", "F9"];
const OLEVEL_SUBJECTS = [
    "Mathematics", "English Language", "Physics", "Chemistry", "Biology", 
    "Agricultural Science", "Economics", "Geography", "Government", 
    "Civic Education", "Commerce", "Accounting", "Further Mathematics", 
    "Literature in English", "Christian Religious Studies", "Islamic Religious Studies",
    "History", "Computer Studies", "Data Processing", "Technical Drawing", 
    "Fine Art", "French", "Igbo", "Hausa", "Yoruba"
].sort();

interface SittingProps {
    index: number;
    sittingData: any;
    examBodies: any[];
    updateSitting: (idx: number, field: string, value: any) => void;
    updateSubject: (idx: number, subIdx: number, field: string, value: any) => void;
    addSubject: (idx: number) => void;
    removeSubject: (idx: number, subIdx: number) => void;
}

const SittingForm = ({ index, sittingData, examBodies, updateSitting, updateSubject, addSubject, removeSubject }: SittingProps) => {
    
    const getAvailableSubjects = (currentSubjectName: string) => {
        const selectedSubjects = sittingData.subjects.map((s: any) => s.subjectName).filter(Boolean);
        return OLEVEL_SUBJECTS.filter(s => s === currentSubjectName || !selectedSubjects.includes(s));
    };

    return (
        <Card className="mb-6">
            <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Sitting {index + 1}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                        <Label>Exam Body</Label>
                        <Select value={sittingData.examBodyId || ""} onValueChange={(val) => updateSitting(index, 'examBodyId', val)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Exam Body" />
                            </SelectTrigger>
                            <SelectContent>
                                {examBodies.map((b: any) => (
                                    <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>Exam Year</Label>
                        <Select value={sittingData.examYear || ""} onValueChange={(val) => updateSitting(index, 'examYear', val)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Year" />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>Exam Number</Label>
                        <Input 
                            value={sittingData.examNumber || ""} 
                            onChange={(e) => updateSitting(index, 'examNumber', e.target.value)} 
                            placeholder="e.g. 4251234567" 
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <Label>Subjects and Grades</Label>
                    {sittingData.subjects.map((sub: any, subIdx: number) => (
                        <div key={subIdx} className="flex gap-4 items-center">
                            <div className="flex-1">
                                <Select value={sub.subjectName || ""} onValueChange={(val) => updateSubject(index, subIdx, 'subjectName', val)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Subject" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {getAvailableSubjects(sub.subjectName).map(s => (
                                            <SelectItem key={s} value={s}>{s}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="w-32">
                                <Select value={sub.grade || ""} onValueChange={(val) => updateSubject(index, subIdx, 'grade', val)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Grade" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {GRADES.map(g => (
                                            <SelectItem key={g} value={g}>{g}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => removeSubject(index, subIdx)} disabled={sittingData.subjects.length === 1}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                        </div>
                    ))}
                    
                    {sittingData.subjects.length < 9 && (
                        <Button type="button" variant="outline" size="sm" onClick={() => addSubject(index)} className="mt-2">
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Subject
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default function OLevelSubmission({ value, onChange, examBodies }: { value: any[], onChange: (val: any) => void, examBodies: any[] }) {
    
    const [numSittings, setNumSittings] = useState<"1" | "2">(value && value.length === 2 ? "2" : "1");

    // Initialize with default sitting if empty
    useEffect(() => {
        if (!value || value.length === 0) {
            onChange([{ examBodyId: "", examYear: "", examNumber: "", subjects: [{ subjectName: "", grade: "" }] }]);
        }
    }, []);

    const handleNumSittingsChange = (val: "1" | "2") => {
        setNumSittings(val);
        if (val === "2" && value.length === 1) {
            onChange([...value, { examBodyId: "", examYear: "", examNumber: "", subjects: [{ subjectName: "", grade: "" }] }]);
        } else if (val === "1" && value.length > 1) {
            onChange([value[0]]);
        }
    };

    const updateSitting = (idx: number, field: string, val: any) => {
        const newVal = [...value];
        newVal[idx][field] = val;
        onChange(newVal);
    };

    const updateSubject = (idx: number, subIdx: number, field: string, val: any) => {
        const newVal = [...value];
        newVal[idx].subjects[subIdx][field] = val;
        onChange(newVal);
    };

    const addSubject = (idx: number) => {
        const newVal = [...value];
        newVal[idx].subjects.push({ subjectName: "", grade: "" });
        onChange(newVal);
    };

    const removeSubject = (idx: number, subIdx: number) => {
        const newVal = [...value];
        newVal[idx].subjects.splice(subIdx, 1);
        onChange(newVal);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
                <Label className="text-base font-semibold">Number of Sittings</Label>
                <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                            type="radio" 
                            name="sittings" 
                            value="1" 
                            checked={numSittings === "1"} 
                            onChange={() => handleNumSittingsChange("1")} 
                            className="form-radio"
                        />
                        1 Sitting
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                            type="radio" 
                            name="sittings" 
                            value="2" 
                            checked={numSittings === "2"} 
                            onChange={() => handleNumSittingsChange("2")}
                            className="form-radio"
                        />
                        2 Sittings
                    </label>
                </div>
            </div>

            {value?.map((sittingData, idx) => (
                <SittingForm 
                    key={idx}
                    index={idx}
                    sittingData={sittingData}
                    examBodies={examBodies}
                    updateSitting={updateSitting}
                    updateSubject={updateSubject}
                    addSubject={addSubject}
                    removeSubject={removeSubject}
                />
            ))}
        </div>
    );
}
