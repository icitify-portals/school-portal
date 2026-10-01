"use client";

import { useState, useEffect, useCallback } from "react";
import {
    FileText, Printer, Loader2, Search, Filter, ChevronDown,
    CheckCircle2, Download, Users, BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { getCourseRegistrationPrintQueue } from "@/actions/ict-manager";

const DEPARTMENTS = [
    { id: 54, name: "Computer Science", code: "COM" },
    { id: 55, name: "Artificial Intelligence", code: "ART" },
    { id: 56, name: "Networking & Cloud Computing", code: "NET" },
    { id: 57, name: "Statistics", code: "STA" },
    { id: 58, name: "Business Administration", code: "BUS" },
    { id: 59, name: "Accountancy", code: "ACC" },
];

export default function CourseRegistrationPrintPage() {
    const [registrations, setRegistrations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<number[]>([]);
    const [filterDept, setFilterDept] = useState<string>("all");
    const [filterProgramme, setFilterProgramme] = useState<string>("all");
    const [search, setSearch] = useState("");
    const [printing, setPrinting] = useState(false);

    const loadRegistrations = useCallback(async () => {
        setLoading(true);
        const res = await getCourseRegistrationPrintQueue({
            departmentId: filterDept !== "all" ? parseInt(filterDept) : undefined,
            programmeType: filterProgramme !== "all" ? filterProgramme : undefined,
            search: search || undefined,
            sessionId: 6,
            semester: '1',
        });
        if (res.success) setRegistrations(res.data);
        setLoading(false);
    }, [filterDept, filterProgramme, search]);

    useEffect(() => {
        loadRegistrations();
    }, [loadRegistrations]);

    const toggleSelect = (id: number) => {
        setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const selectAll = () => {
        setSelected(selected.length === registrations.length ? [] : registrations.map(r => r.studentId));
    };

    function printSingle(studentId: number) {
        const reg = registrations.find(r => r.studentId === studentId);
        if (!reg) return;
        generatePrintHTML([reg]);
    }

    function printSelected() {
        if (!selected.length) return toast.error("Select students first");
        const regs = registrations.filter(r => selected.includes(r.studentId));
        generatePrintHTML(regs);
    }

    function generatePrintHTML(regs: any[]) {
        const html = regs.map(reg => `
            <div style="page-break-after: always; font-family: Georgia, serif; padding: 30px; max-width: 800px; margin: 0 auto;">
                <div style="text-align: center; border-bottom: 3px solid #1e3a5f; padding-bottom: 12px; margin-bottom: 20px;">
                    <h2 style="margin: 0; color: #1e3a5f; font-size: 18px;">FEDERAL SCHOOL OF STATISTICS, IBADAN</h2>
                    <p style="margin: 4px 0 0; color: #64748b; font-size: 12px;">Course Registration Form — 2026/2027 Semester 1</p>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px; margin-bottom: 20px;">
                    <div><strong>Name:</strong> ${reg.studentName || ''}</div>
                    <div><strong>Matric No:</strong> ${reg.matricNumber || ''}</div>
                    <div><strong>Department:</strong> ${reg.deptName || ''}</div>
                    <div><strong>Programme:</strong> ${reg.programmeType || ''} Level ${reg.currentLevel || ''}</div>
                    <div><strong>Total Courses:</strong> ${reg.courseCount || 0}</div>
                    <div><strong>Total Units:</strong> ${reg.totalUnits || 0}</div>
                </div>
                <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                    <thead>
                        <tr style="background: #1e3a5f; color: white;">
                            <th style="padding: 8px; text-align: left; border: 1px solid #1e3a5f;">S/N</th>
                            <th style="padding: 8px; text-align: left; border: 1px solid #1e3a5f;">Course Code</th>
                            <th style="padding: 8px; text-align: left; border: 1px solid #1e3a5f;">Course Title</th>
                            <th style="padding: 8px; text-align: center; border: 1px solid #1e3a5f;">Units</th>
                            <th style="padding: 8px; text-align: center; border: 1px solid #1e3a5f;">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(reg.courses || []).map((c: any, i: number) => `
                            <tr style="background: ${i % 2 === 0 ? '#f8fafc' : 'white'};">
                                <td style="padding: 6px 8px; border: 1px solid #e2e8f0;">${i + 1}</td>
                                <td style="padding: 6px 8px; border: 1px solid #e2e8f0; font-weight: bold;">${c.courseCode || ''}</td>
                                <td style="padding: 6px 8px; border: 1px solid #e2e8f0;">${c.courseName || ''}</td>
                                <td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: center;">${c.creditUnits || ''}</td>
                                <td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: center;">${c.advisorStatus || 'pending'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div style="margin-top: 40px; display: flex; justify-content: space-between;">
                    <div style="text-align: center;">
                        <div style="width: 150px; border-top: 1px solid #1e3a5f; margin-bottom: 4px;"></div>
                        <p style="font-size: 11px; margin: 0;">Student's Signature</p>
                    </div>
                    <div style="text-align: center;">
                        <div style="width: 150px; border-top: 1px solid #1e3a5f; margin-bottom: 4px;"></div>
                        <p style="font-size: 11px; margin: 0;">Level Advisor</p>
                    </div>
                    <div style="text-align: center;">
                        <div style="width: 150px; border-top: 1px solid #1e3a5f; margin-bottom: 4px;"></div>
                        <p style="font-size: 11px; margin: 0;">HOD</p>
                    </div>
                </div>
            </div>
        `).join('');

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <!DOCTYPE html>
                <html><head><title>Course Registration Forms</title>
                <style>@media print { @page { size: A4 portrait; margin: 15mm; } }</style>
                </head><body>${html}</body></html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
        setPrinting(false);
    }

    const totalPaid = registrations.filter(r => r.isPrintFeePaid).length;
    const totalWithCourses = registrations.filter(r => r.courseCount > 0).length;

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Course Registration Print Queue</h1>
                            <p className="text-sm text-slate-500">View and print student course registration forms</p>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4">
                    <Card><CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-slate-900">{registrations.length}</p>
                        <p className="text-xs text-slate-500">Total Students</p>
                    </CardContent></Card>
                    <Card><CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-green-600">{totalPaid}</p>
                        <p className="text-xs text-slate-500">Print Fee Paid</p>
                    </CardContent></Card>
                    <Card><CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-blue-600">{totalWithCourses}</p>
                        <p className="text-xs text-slate-500">With Courses</p>
                    </CardContent></Card>
                    <Card><CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-indigo-600">{selected.length}</p>
                        <p className="text-xs text-slate-500">Selected</p>
                    </CardContent></Card>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex gap-4 items-end flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                        <Label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Search</Label>
                        <Input placeholder="Name or matric number..." value={search} onChange={e => setSearch(e.target.value)} className="h-10" />
                    </div>
                    <div>
                        <Label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Department</Label>
                        <Select value={filterDept} onValueChange={setFilterDept}>
                            <SelectTrigger className="w-48 h-10"><SelectValue placeholder="All" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Departments</SelectItem>
                                {DEPARTMENTS.map(d => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Programme</Label>
                        <Select value={filterProgramme} onValueChange={setFilterProgramme}>
                            <SelectTrigger className="w-32 h-10"><SelectValue placeholder="All" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="ND">ND</SelectItem>
                                <SelectItem value="HND">HND</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {selected.length > 0 && (
                        <Button onClick={printSelected} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                            <Printer className="w-4 h-4" /> Print Selected ({selected.length})
                        </Button>
                    )}
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="p-3 text-left"><input type="checkbox" checked={selected.length === registrations.length && registrations.length > 0} onChange={selectAll} /></th>
                                <th className="p-3 text-left text-xs font-bold text-slate-500 uppercase">Student</th>
                                <th className="p-3 text-left text-xs font-bold text-slate-500 uppercase">Matric</th>
                                <th className="p-3 text-left text-xs font-bold text-slate-500 uppercase">Dept</th>
                                <th className="p-3 text-center text-xs font-bold text-slate-500 uppercase">Courses</th>
                                <th className="p-3 text-center text-xs font-bold text-slate-500 uppercase">Units</th>
                                <th className="p-3 text-center text-xs font-bold text-slate-500 uppercase">Print Fee</th>
                                <th className="p-3 text-center text-xs font-bold text-slate-500 uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8} className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" /></td></tr>
                            ) : registrations.length === 0 ? (
                                <tr><td colSpan={8} className="p-12 text-center text-slate-400">No registrations found</td></tr>
                            ) : (
                                registrations.map((reg) => (
                                    <tr key={reg.studentId} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="p-3">
                                            <input type="checkbox" checked={selected.includes(reg.studentId)} onChange={() => toggleSelect(reg.studentId)} />
                                        </td>
                                        <td className="p-3 text-sm font-medium text-slate-900">{reg.studentName}</td>
                                        <td className="p-3 text-sm font-mono text-slate-700">{reg.matricNumber || '-'}</td>
                                        <td className="p-3 text-sm text-slate-600">{reg.deptName || '-'}</td>
                                        <td className="p-3 text-sm text-center font-medium">{reg.courseCount || 0}</td>
                                        <td className="p-3 text-sm text-center font-medium">{reg.totalUnits || 0}</td>
                                        <td className="p-3 text-center">
                                            {reg.isPrintFeePaid ? (
                                                <Badge className="bg-green-100 text-green-700 text-xs">Paid</Badge>
                                            ) : (
                                                <Badge className="bg-slate-100 text-slate-500 text-xs">Unpaid</Badge>
                                            )}
                                        </td>
                                        <td className="p-3 text-center">
                                            <Button size="sm" variant="outline" onClick={() => printSingle(reg.studentId)} className="gap-1">
                                                <Printer className="w-3 h-3" /> Print
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}