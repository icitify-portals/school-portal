"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    FileText,
    Printer,
    Loader2,
    BookOpen,
} from "lucide-react";
import {
    generateHodReport,
    getAcademicSessionsList,
    getDepartmentsList,
} from "@/actions/promotion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const remarksColors: Record<string, string> = {
    PASSED: "text-emerald-700 bg-emerald-50",
    REPEAT: "text-amber-700 bg-amber-50",
    WITHDRAWN: "text-red-700 bg-red-50",
};

export default function HodReportsPage() {
    const [departments, setDepartments] = useState<any[]>([]);
    const [sessions, setSessions] = useState<any[]>([]);
    const [selectedDept, setSelectedDept] = useState("");
    const [selectedSession, setSelectedSession] = useState("");
    const [reportType, setReportType] = useState<"non_final_year" | "final_year">("non_final_year");
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [report, setReport] = useState<any>(null);
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        Promise.all([getDepartmentsList(), getAcademicSessionsList()]).then(([dRes, sRes]) => {
            if (dRes.success && dRes.departments) setDepartments(dRes.departments);
            if (sRes.success && sRes.sessions) {
                setSessions(sRes.sessions);
                const current = sRes.sessions.find((s: any) => s.isCurrent);
                if (current) setSelectedSession(current.id.toString());
            }
            setLoading(false);
        });
    }, []);

    const handleGenerate = async () => {
        if (!selectedDept || !selectedSession) { toast.error("Select department and session."); return; }
        setGenerating(true);
        const res = await generateHodReport(parseInt(selectedDept), parseInt(selectedSession), reportType);
        if (res.success && res.report) {
            setReport(res.report);
        } else {
            toast.error(res.error || "Failed to generate report.");
        }
        setGenerating(false);
    };

    const handlePrint = () => {
        if (!printRef.current) return;
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        const isFinal = report.type === 'final_year';
        let summaryHtml = '';

        if (isFinal) {
            // Calculate Honours Summary
            const honours = {
                '1st Class': 0,
                '2nd Class Upper': 0,
                '2nd Class Lower': 0,
                '3rd Class': 0,
                'Pass': 0,
                'Fail/Withdraw': 0
            };

            report.levelGroups?.forEach((g: any) => {
                g.students.forEach((s: any) => {
                    if (s.remarks === 'PASSED' && s.classOfDegree && s.classOfDegree !== '---') {
                        if (honours[s.classOfDegree as keyof typeof honours] !== undefined) {
                            honours[s.classOfDegree as keyof typeof honours]++;
                        }
                    } else if (s.remarks === 'WITHDRAWN') {
                        honours['Fail/Withdraw']++;
                    }
                });
            });

            summaryHtml = `
            <div class="honours-summary">
                <p><strong>Summary on Classes of Honour</strong></p>
                <div style="display: flex; gap: 50px;">
                    <div>Class</div>
                    <div>Number of Students</div>
                </div>
                <div style="display: flex; gap: 50px; margin-top: 5px;">
                    <div style="width: 120px;">First Class</div>
                    <div>${honours['1st Class']}</div>
                </div>
                <div style="display: flex; gap: 50px; margin-top: 5px;">
                    <div style="width: 120px;">Second Class Upper</div>
                    <div>${honours['2nd Class Upper']}</div>
                </div>
                <div style="display: flex; gap: 50px; margin-top: 5px;">
                    <div style="width: 120px;">Second Class Lower</div>
                    <div>${honours['2nd Class Lower']}</div>
                </div>
                <div style="display: flex; gap: 50px; margin-top: 5px;">
                    <div style="width: 120px;">Third Class</div>
                    <div>${honours['3rd Class']}</div>
                </div>
                <div style="display: flex; gap: 50px; margin-top: 5px;">
                    <div style="width: 120px;">Pass</div>
                    <div>${honours['Pass']}</div>
                </div>
                <div style="display: flex; gap: 50px; margin-top: 5px;">
                    <div style="width: 120px;">Fail/Withdrawn</div>
                    <div>${honours['Fail/Withdraw']}</div>
                </div>
            </div>`;
        }

        printWindow.document.write(`
            <html><head><title>HOD Report — ${report?.department?.name || 'Department'}</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Times New Roman', serif; padding: 30px 40px; color: #000; font-size: 11px; }
                .report-header { text-align: center; margin-bottom: 20px; text-transform: uppercase; }
                .report-header h1 { font-size: 14px; font-weight: bold; margin-bottom: 2px; }
                .report-header h2 { font-size: 13px; font-weight: bold; margin-bottom: 2px; }
                .report-header h3 { font-size: 13px; font-weight: bold; margin-bottom: 2px; }
                .report-header h4 { font-size: 12px; font-weight: bold; margin-bottom: 2px; }
                .report-header h5 { font-size: 12px; font-weight: bold; margin-bottom: 15px; }
                .dept-details { display: flex; justify-content: space-between; font-weight: bold; font-size: 11px; }
                table { border-collapse: collapse; margin: 10px 0 25px; font-size: 10px; table-layout: fixed; width: ${isFinal ? '120%' : '100%'}; transform-origin: top left; transform: ${isFinal ? 'scale(0.83)' : 'scale(1)'}; }
                th, td { border: 1px solid #000; padding: 4px 2px; text-align: center; vertical-align: middle; word-wrap: break-word; }
                th { background: transparent; font-weight: bold; font-size: 9px; text-transform: uppercase; }
                td { font-size: 10px; }
                .name-col { text-align: left; }
                .level-title { font-size: 13px; font-weight: bold; text-transform: uppercase; text-align: center; margin: 15px 0 8px; }
                .signature-block { margin-top: 50px; display: flex; justify-content: space-around; width: 100%; font-weight: bold; font-size: 10px; }
                .signature-line { width: 180px; text-align: center; }
                .signature-line hr { border: none; border-top: 2px solid #000; margin-bottom: 5px; }
                .honours-summary { margin-top: 40px; font-size: 10px; }
                @media print { body { padding: 15px 25px; } }
                @page { size: landscape; margin: 1cm; }
            </style>
            </head><body>${printRef.current.innerHTML}${summaryHtml}</body></html>
        `);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 500);
    };

    const reportTitle = reportType === 'final_year' ? 'FINAL YEAR RESULTS' : 'NON-FINAL YEAR RESULTS';

    return (
        <div className="p-6 md:p-10 max-w-[1600px] w-full mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl shadow-lg shadow-teal-200">
                        <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                            HOD Council Reports
                        </h1>
                        <p className="text-sm text-slate-500 font-medium">
                            Generate official session reports for Senate presentation
                        </p>
                    </div>
                </div>
                {report && (
                    <Button
                        onClick={handlePrint}
                        className="h-12 px-6 rounded-2xl bg-teal-600 hover:bg-teal-700 font-black uppercase tracking-widest text-[10px] gap-2 shadow-lg"
                    >
                        <Printer className="w-4 h-4" /> Print Report
                    </Button>
                )}
            </div>

            {/* Controls */}
            <Card className="border-none shadow-xl rounded-2xl bg-white overflow-hidden">
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Department</label>
                            <select
                                value={selectedDept}
                                onChange={e => setSelectedDept(e.target.value)}
                                className="w-full h-11 rounded-xl border-2 border-slate-200 px-4 font-bold text-sm focus:border-teal-500 focus:outline-none"
                            >
                                <option value="">Select department...</option>
                                {departments.map((d: any) => (
                                    <option key={d.id} value={d.id}>{d.code} — {d.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Session</label>
                            <select
                                value={selectedSession}
                                onChange={e => setSelectedSession(e.target.value)}
                                className="w-full h-11 rounded-xl border-2 border-slate-200 px-4 font-bold text-sm focus:border-teal-500 focus:outline-none"
                            >
                                <option value="">Select session...</option>
                                {sessions.map((s: any) => (
                                    <option key={s.id} value={s.id}>{s.name} {s.isCurrent ? "(Current)" : ""}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Report Type</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setReportType("non_final_year")}
                                    className={cn(
                                        "flex-1 h-11 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all border-2",
                                        reportType === "non_final_year"
                                            ? "bg-teal-600 text-white border-teal-600 shadow-md"
                                            : "bg-white text-slate-500 border-slate-200 hover:border-teal-300"
                                    )}
                                >
                                    Non-Final Year
                                </button>
                                <button
                                    onClick={() => setReportType("final_year")}
                                    className={cn(
                                        "flex-1 h-11 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all border-2",
                                        reportType === "final_year"
                                            ? "bg-teal-600 text-white border-teal-600 shadow-md"
                                            : "bg-white text-slate-500 border-slate-200 hover:border-teal-300"
                                    )}
                                >
                                    Final Year
                                </button>
                            </div>
                        </div>
                    </div>
                    <Button
                        onClick={handleGenerate}
                        disabled={generating || !selectedDept || !selectedSession}
                        className="mt-5 h-12 px-8 rounded-2xl bg-teal-600 hover:bg-teal-700 font-black uppercase tracking-widest text-[10px] gap-2 shadow-lg shadow-teal-100"
                    >
                        {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                        Generate Report
                    </Button>
                </CardContent>
            </Card>

            {/* On-screen Report Preview */}
            {report && (
                <div className="space-y-4">
                    <Card className="border-none shadow-xl rounded-2xl bg-white overflow-hidden">
                        <CardContent className="p-6 space-y-6">
                            {/* Report Header (on-screen) */}
                            <div className="text-center space-y-1">
                                <p className="text-xs font-bold text-slate-400 italic">{report.facultyName || 'Faculty'}</p>
                                <h2 className="text-lg font-black text-slate-900 italic">
                                    Department of {report.department?.name}
                                </h2>
                                <p className="text-sm font-black text-slate-700 uppercase">
                                    {report.session?.name} SESSION REPORT
                                </p>
                                <p className="text-sm font-black text-slate-600 uppercase">{reportTitle}</p>
                            </div>

                            {/* Summary */}
                            <div className="flex gap-3 justify-center">
                                <Badge className="bg-slate-100 text-slate-600 border-none font-bold text-[9px]">
                                    {report.levelGroups?.reduce((t: number, g: any) => t + g.students.length, 0) || 0} students
                                </Badge>
                                <Badge className="bg-slate-100 text-slate-600 border-none font-bold text-[9px]">
                                    {report.levelGroups?.length || 0} level(s)
                                </Badge>
                            </div>

                            {/* Level-by-Level Tables */}
                            {report.levelGroups?.length > 0 ? (
                                report.levelGroups.map((group: any, gi: number) => (
                                    <div key={gi}>
                                        <h3 className="text-center font-black text-sm uppercase tracking-widest text-slate-700 mb-3 py-2 bg-slate-50 rounded-xl">
                                            {group.level} LEVEL
                                        </h3>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-[10px] border-collapse">
                                                <thead>
                                                    <tr className="bg-slate-50">
                                                        <th className="border border-slate-200 p-2 font-black text-slate-500 w-8" rowSpan={2}>S/N</th>
                                                        <th className="border border-slate-200 p-2 font-black text-slate-500" rowSpan={2}>Matric No.</th>
                                                        <th className="border border-slate-200 p-2 font-black text-slate-500" rowSpan={2}>Year of Entry</th>
                                                        <th className="border border-slate-200 p-2 font-black text-slate-500" rowSpan={2}>Mode of Entry</th>

                                                        {reportType === 'final_year' ? (
                                                            <>
                                                                <th className="border border-slate-200 p-2 font-black text-slate-500" rowSpan={2}>Total Units Registered to Date</th>
                                                                <th className="border border-slate-200 p-2 font-black text-slate-500" rowSpan={2}>Total Units Passed to Date</th>
                                                                <th className="border border-slate-200 p-2 font-black text-slate-500" rowSpan={2}>Units not in</th>
                                                                <th className="border border-slate-200 p-2 font-black text-slate-500 text-center" colSpan={2}>Requirements</th>
                                                                <th className="border border-slate-200 p-2 font-black text-slate-500" rowSpan={2}>Total WGP</th>
                                                                <th className="border border-slate-200 p-2 font-black text-slate-500" rowSpan={2}>CGPA</th>
                                                                <th className="border border-slate-200 p-2 font-black text-slate-500" rowSpan={2}>Class of Degree</th>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <th className="border border-slate-200 p-2 font-black text-slate-500" rowSpan={2}>Cumulative Units Registered to Date</th>
                                                                <th className="border border-slate-200 p-2 font-black text-slate-500" rowSpan={2}>Cumulative Units Passed to Date</th>
                                                                <th className="border border-slate-200 p-2 font-black text-slate-500" rowSpan={2}>Units Not in</th>
                                                                <th className="border border-slate-200 p-2 font-black text-slate-500" rowSpan={2}>Total WGP</th>
                                                                <th className="border border-slate-200 p-2 font-black text-slate-500" rowSpan={2}>CGPA</th>
                                                            </>
                                                        )}

                                                        <th className="border border-slate-200 p-2 font-black text-slate-500" rowSpan={2}>Remarks</th>
                                                    </tr>
                                                    {reportType === 'final_year' && (
                                                        <tr className="bg-slate-50">
                                                            <th className="border border-slate-200 p-2 font-black text-slate-500 text-[9px]">Faculty</th>
                                                            <th className="border border-slate-200 p-2 font-black text-slate-500 text-[9px]">Dept</th>
                                                        </tr>
                                                    )}
                                                </thead>
                                                <tbody>
                                                    {group.students.map((s: any, si: number) => (
                                                        <tr key={si} className="hover:bg-slate-50 transition-colors">
                                                            <td className="border border-slate-200 p-2 text-center font-bold">{si + 1}</td>
                                                            <td className="border border-slate-200 p-2 text-center font-bold">{s.matricNumber}</td>
                                                            <td className="border border-slate-200 p-2 text-center">{s.yearOfEntry}</td>
                                                            <td className="border border-slate-200 p-2 text-center">{s.modeOfEntry}</td>

                                                            {reportType === 'final_year' ? (
                                                                <>
                                                                    <td className="border border-slate-200 p-2 text-center font-bold">{s.cumulativeUnitsRegistered}</td>
                                                                    <td className="border border-slate-200 p-2 text-center font-bold">{s.cumulativeUnitsPassed}</td>
                                                                    <td className="border border-slate-200 p-2 text-center">{s.unitsNotIn}</td>
                                                                    <td className="border border-slate-200 p-2 text-center">{s.facultyReq}</td>
                                                                    <td className="border border-slate-200 p-2 text-center">{s.deptReq}</td>
                                                                    <td className="border border-slate-200 p-2 text-center font-bold">{s.totalWgp}</td>
                                                                    <td className="border border-slate-200 p-2 text-center font-bold">{s.cgpa.toFixed(2)}</td>
                                                                    <td className="border border-slate-200 p-2 text-center font-bold text-xs">{s.classOfDegree}</td>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <td className="border border-slate-200 p-2 text-center font-bold">{s.cumulativeUnitsRegistered}</td>
                                                                    <td className="border border-slate-200 p-2 text-center font-bold">{s.cumulativeUnitsPassed}</td>
                                                                    <td className="border border-slate-200 p-2 text-center">{s.unitsNotIn}</td>
                                                                    <td className="border border-slate-200 p-2 text-center font-bold">{s.totalWgp}</td>
                                                                    <td className="border border-slate-200 p-2 text-center font-bold">{s.cgpa.toFixed(2)}</td>
                                                                </>
                                                            )}

                                                            <td className="border border-slate-200 p-2 text-center">
                                                                <span className={cn("px-2 py-0.5 rounded font-black text-[8px] uppercase", remarksColors[s.remarks] || "")}>
                                                                    {s.remarks}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-10 text-center text-slate-400 text-sm font-medium">
                                    No students found for this report type.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Hidden Printable Version */}
                    <div className="hidden">
                        <div ref={printRef}>
                            {report.levelGroups?.map((group: any, gi: number) => (
                                <div key={gi} style={{ pageBreakBefore: gi > 0 ? 'always' : 'auto' }}>
                                    <div className="report-header">
                                        <h1>University of Ibadan</h1>
                                        <h2>{report.session?.name} DEGREE EXAMINATIONS</h2>
                                        <h3>SUMMARY OF RESULTS</h3>
                                        <h4>{reportTitle}</h4>
                                    </div>
                                    <div className="dept-details">
                                        <span>FACULTY: ${report.facultyName || 'Faculty'}</span>
                                        <span>DEPARTMENT: ${report.department?.name}</span>
                                        ${reportType === 'non_final_year' ? `<span>LEVEL: ${group.level}</span>` : ''}
                                    </div>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th style={{ width: '3%' }} rowSpan={2}>S/N</th>
                                                <th style={{ width: '10%' }} rowSpan={2}>Matric No.</th>
                                                <th style={{ width: '7%' }} rowSpan={2}>Year of Entry</th>
                                                <th style={{ width: '6%' }} rowSpan={2}>Mode of Entry</th>
                                                <th className="name-col" style={{ width: '22%' }} rowSpan={2}>Student&apos;s Name in Alphabetical Order with Surname First</th>

                                                {reportType === 'final_year' ? (
                                                    <>
                                                        <th style={{ width: '8%' }} rowSpan={2}>Total Units<br />Registered<br />to Date</th>
                                                        <th style={{ width: '8%' }} rowSpan={2}>Total Units<br />Passed to<br />Date</th>
                                                        <th style={{ width: '6%' }} rowSpan={2}>Units not in</th>
                                                        <th style={{ width: '8%' }} colSpan={2}>Requirements</th>
                                                        <th style={{ width: '6%' }} rowSpan={2}>Total WGP</th>
                                                        <th style={{ width: '5%' }} rowSpan={2}>CGPA</th>
                                                        <th style={{ width: '8%' }} rowSpan={2}>Class of Degree</th>
                                                        <th style={{ width: '25%' }} rowSpan={2}>Remarks</th>
                                                    </>
                                                ) : (
                                                    <>
                                                        <th style={{ width: '9%' }} rowSpan={2}>Cumulative Units Registered to Date</th>
                                                        <th style={{ width: '9%' }} rowSpan={2}>Cumulative Units Passed to Date</th>
                                                        <th style={{ width: '9%' }} rowSpan={2}>Units Not in</th>
                                                        <th style={{ width: '6%' }} rowSpan={2}>Total WGP</th>
                                                        <th style={{ width: '5%' }} rowSpan={2}>CGPA</th>
                                                        <th style={{ width: '30%' }} rowSpan={2}>Remarks</th>
                                                    </>
                                                )}
                                            </tr>
                                            {reportType === 'final_year' && (
                                                <tr>
                                                    <th style={{ width: '4%' }}>Faculty</th>
                                                    <th style={{ width: '4%' }}>Dept</th>
                                                </tr>
                                            )}
                                        </thead>
                                        <tbody>
                                            {group.students.map((s: any, si: number) => (
                                                <tr key={si}>
                                                    <td>{si + 1}</td>
                                                    <td>{s.matricNumber}</td>
                                                    <td>{s.yearOfEntry}</td>
                                                    <td>{s.modeOfEntry}</td>
                                                    <td className="name-col" style={{ fontSize: '9px' }}>{s.studentName}</td>

                                                    {reportType === 'final_year' ? (
                                                        <>
                                                            <td>{s.cumulativeUnitsRegistered}</td>
                                                            <td>{s.cumulativeUnitsPassed}</td>
                                                            <td>{s.unitsNotIn}</td>
                                                            <td>{s.facultyReq}</td>
                                                            <td>{s.deptReq}</td>
                                                            <td>{s.totalWgp}</td>
                                                            <td>{s.cgpa.toFixed(2)}</td>
                                                            <td style={{ fontSize: '9px' }}>{s.classOfDegree}</td>
                                                            <td style={{ fontSize: '8px' }}>{s.remarks}</td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <td>{s.cumulativeUnitsRegistered}</td>
                                                            <td>{s.cumulativeUnitsPassed}</td>
                                                            <td>{s.unitsNotIn}</td>
                                                            <td>{s.totalWgp}</td>
                                                            <td>{s.cgpa.toFixed(2)}</td>
                                                            <td style={{ fontSize: '9px' }}>{s.remarks}</td>
                                                        </>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ))}

                            <div className="signature-block">
                                <div className="signature-line">
                                    <hr />
                                    <p>Head of Department</p>
                                </div>
                                <div className="signature-line">
                                    <hr />
                                    <p>Dean</p>
                                </div>
                                {reportType === 'final_year' && (
                                    <div className="signature-line">
                                        <hr />
                                        <p>External Examiner</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
