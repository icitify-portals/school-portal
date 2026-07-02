"use client";

import { useEffect, useState } from "react";
import { getCourseUsageStats, generateCsvString } from "@/actions/analytics";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Download, Search, AlertTriangle } from "lucide-react";

export default function CourseUsageReportPage() {
    const [stats, setStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getCourseUsageStats().then((res: any) => {
            if (res.success) {
                setStats(res.stats);
            } else {
                setError(res.error || "Failed to load usage stats");
            }
            setLoading(false);
        });
    }, []);

    const filteredStats = stats.filter(s =>
        s.code.toLowerCase().includes(search.toLowerCase()) ||
        s.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleExportCsv = async () => {
        const headers = ["Course Code", "Course Name", "Total Enrollments", "Average Score", "Pass Rate (%)"];
        const rows = filteredStats.map(s => [
            s.code,
            s.name,
            s.enrollments,
            s.avgTotalScore ? Number(s.avgTotalScore).toFixed(2) : "N/A",
            s.enrollments > 0 ? ((s.passedCount / s.enrollments) * 100).toFixed(1) : "0"
        ]);

        const csvString = await generateCsvString(headers, rows);
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "course_usage_report.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
    );

    return (
        <div className="p-6 max-w-[1600px] w-full mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">Course Usage & Performance</h1>
                    <p className="text-sm text-slate-500">Analyze enrollment numbers and student performance per course</p>
                </div>
                <button
                    onClick={handleExportCsv}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium"
                >
                    <Download className="w-4 h-4" />
                    Export CSV
                </button>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 border border-red-200">
                    <AlertTriangle className="w-5 h-5" />
                    {error}
                </div>
            )}

            <Card className=" border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                <CardHeader className="pb-4 bg-slate-50/50 border-b border-slate-100 p-6">
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg w-full max-w-sm border border-slate-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                        <Search className="w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search courses..."
                            className="bg-transparent border-none outline-none text-sm w-full"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 font-medium">
                            <tr>
                                <th className="px-6 py-4">Course Code</th>
                                <th className="px-6 py-4">Course Name</th>
                                <th className="px-6 py-4">Enrollments</th>
                                <th className="px-6 py-4">Avg Total Score</th>
                                <th className="px-6 py-4">Est. Pass Rate</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredStats.map((stat, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-mono font-medium text-slate-900">{stat.code}</td>
                                    <td className="px-6 py-4 text-slate-700">{stat.name}</td>
                                    <td className="px-6 py-4 font-semibold text-slate-900">{stat.enrollments}</td>
                                    <td className="px-6 py-4">
                                        {stat.avgTotalScore ? (
                                            <span className={`inline-flex px-2 py-1 rounded-md font-medium text-xs ${Number(stat.avgTotalScore) >= 50 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                                {Number(stat.avgTotalScore).toFixed(1)}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {stat.enrollments > 0 ? (
                                            <span className="text-slate-700">
                                                {((stat.passedCount / stat.enrollments) * 100).toFixed(1)}%
                                            </span>
                                        ) : (
                                            <span className="text-slate-400">0%</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredStats.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                        No courses found matching "{search}"
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
