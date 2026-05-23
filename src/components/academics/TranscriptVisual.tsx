"use client";

import React from "react";
import { TranscriptData } from "@/services/TranscriptService";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldCheck, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TranscriptVisualProps {
    data: TranscriptData;
    onEditResult?: (result: any) => void;
}

export function TranscriptVisual({ data, onEditResult }: TranscriptVisualProps) {
    const { student, results, totals } = data;

    return (
        <div id="transcript-printable" className="bg-white p-12 w-[210mm] min-h-[297mm] mx-auto text-slate-900 font-serif leading-tight border shadow-sm">
            {/* Header Section */}
            <div className="text-center space-y-2 mb-8 border-b-2 border-slate-900 pb-6">
                <div className="flex justify-center mb-4">
                    <ShieldCheck className="w-16 h-16 text-slate-800" />
                </div>
                <h1 className="text-2xl font-black uppercase tracking-tight">{student.institution}</h1>
                <h2 className="text-xl font-bold uppercase">{student.faculty}</h2>
                <h3 className="text-lg font-bold uppercase">{student.department}</h3>
                <div className="mt-4 inline-block border-2 border-slate-900 px-6 py-1 font-black uppercase tracking-widest text-sm">
                    Students Personal Transcript
                </div>
            </div>

            {/* Student Info Grid */}
            <div className="grid grid-cols-2 gap-x-12 gap-y-3 mb-8 text-sm">
                <div className="space-y-1">
                    <InfoRow label="Matric. No" value={student.matricNumber} />
                    <InfoRow label="Course of Study" value={student.programme} />
                    <InfoRow label="Date of Birth" value={student.dob || 'N/A'} />
                    <InfoRow label="Year of Admission" value={student.admissionYear?.toString() || 'N/A'} />
                    <InfoRow label="Class of Degree" value={student.classOfDegree || '---'} />
                    <InfoRow label="Mode of Entry" value={student.modeOfEntry || 'UTME'} />
                </div>
                <div className="space-y-1">
                    <InfoRow label="Name" value={student.name} />
                    <InfoRow label="Faculty" value={student.faculty} />
                    <InfoRow label="Sex" value={student.gender?.toUpperCase() || 'N/A'} />
                    <InfoRow label="Nationality" value={student.nationality || 'Nigerian'} />
                    <InfoRow label="Year of Graduation" value={student.graduatedAt?.getFullYear()?.toString() || '---'} />
                </div>
            </div>

            {/* Courses Table */}
            <h4 className="text-center font-black uppercase underline mb-4 text-sm tracking-widest">Courses Taken and Marks Obtained</h4>
            <div className="border border-slate-900 text-xs">
                <Table className="border-collapse">
                    <TableHeader className="bg-slate-50">
                        <TableRow className="border-b border-slate-900 hover:bg-transparent">
                            <TableHead className="border-r border-slate-900 text-slate-900 font-bold uppercase py-2 px-1 text-[10px]">Course</TableHead>
                            <TableHead className="border-r border-slate-900 text-slate-900 font-bold uppercase py-2 px-1 text-[10px]">Session</TableHead>
                            <TableHead className="border-r border-slate-900 text-slate-900 font-bold uppercase py-2 px-1 text-[10px] w-1/3">Course Description</TableHead>
                            <TableHead className="border-r border-slate-900 text-slate-900 font-bold uppercase py-2 px-1 text-[10px] text-center">Units</TableHead>
                            <TableHead className="border-r border-slate-900 text-slate-900 font-bold uppercase py-2 px-1 text-[10px] text-center">Status</TableHead>
                            <TableHead className="border-r border-slate-900 text-slate-900 font-bold uppercase py-2 px-1 text-[10px] text-center">Marks%</TableHead>
                            <TableHead className="border-r border-slate-900 text-slate-900 font-bold uppercase py-2 px-1 text-[10px] text-center">GP</TableHead>
                            <TableHead className="border-r border-slate-900 text-slate-900 font-bold uppercase py-2 px-1 text-[10px] text-center">WGP</TableHead>
                            <TableHead className="text-slate-900 font-bold uppercase py-2 px-1 text-[10px]">Remarks</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {results.map((period, pIdx) => (
                            <React.Fragment key={pIdx}>
                                {period.courses.map((c, cIdx) => (
                                    <TableRow key={`${pIdx}-${cIdx}`} className="border-b border-slate-900 hover:bg-transparent">
                                        <TableCell className="border-r border-slate-900 py-1.5 px-1 font-bold">{c.code}</TableCell>
                                        <TableCell className="border-r border-slate-900 py-1.5 px-1">{period.sessionName}</TableCell>
                                        <TableCell className="border-r border-slate-900 py-1.5 px-1 uppercase">{c.title}</TableCell>
                                        <TableCell className="border-r border-slate-900 py-1.5 px-1 text-center">{c.units}</TableCell>
                                        <TableCell className="border-r border-slate-900 py-1.5 px-1 text-center">{c.status}</TableCell>
                                        <TableCell className="border-r border-slate-900 py-1.5 px-1 text-center font-bold">
                                            <div className="flex items-center justify-center gap-1 group/score">
                                                {c.score}
                                                {onEditResult && c.resultId && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 opacity-0 group-hover/score:opacity-100 transition-opacity no-print text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                                        onClick={() => onEditResult({
                                                            id: c.resultId,
                                                            code: c.code,
                                                            title: c.title,
                                                            caScore: c.caScore,
                                                            examScore: c.examScore,
                                                            totalScore: c.score.toString()
                                                        })}
                                                    >
                                                        <Edit2 className="w-3 h-3" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="border-r border-slate-900 py-1.5 px-1 text-center">{c.gp}</TableCell>
                                        <TableCell className="border-r border-slate-900 py-1.5 px-1 text-center">{c.wgp}</TableCell>
                                        <TableCell className="py-1.5 px-1">{c.remarks}</TableCell>
                                    </TableRow>
                                ))}
                            </React.Fragment>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Cumulative Summary Footer */}
            <div className="mt-12 space-y-3 text-sm font-bold flex flex-col items-end border-t-2 border-slate-700 pt-8">
                <div className="flex justify-between w-[350px]">
                    <span>Cumulative Units Registered:</span>
                    <span className="w-16 text-right">{totals.tcr}</span>
                </div>
                <div className="flex justify-between w-[350px]">
                    <span>Cumulative Units Passed:</span>
                    <span className="w-16 text-right">{totals.tce}</span>
                </div>
                <div className="flex justify-between w-[350px]">
                    <span>Total Weighed Grade Points:</span>
                    <span className="w-16 text-right">{totals.twgp}</span>
                </div>
                <div className="flex justify-between w-[350px] border-t border-slate-400 pt-2 mt-2">
                    <span>Cumulative Grade Point Average:</span>
                    <span className="w-16 text-right text-lg">{totals.cgpa}</span>
                </div>
            </div>

            {/* Signature Section */}
            <div className="mt-20 flex justify-end">
                <div className="text-center w-64">
                    <div className="border-t border-slate-900 pt-2 font-black uppercase text-xs">
                        Head of Department
                    </div>
                </div>
            </div>
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-baseline">
            <span className="w-32 font-bold">{label}:</span>
            <span className="uppercase">{value}</span>
        </div>
    );
}
