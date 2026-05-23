"use client";

import { useEffect, useState } from "react";
import { getStudentParticipation, generateCsvString } from "@/actions/analytics";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Download, Search, AlertTriangle, UserMinus } from "lucide-react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function StudentParticipationPage() {
    const [stats, setStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getStudentParticipation().then((res: any) => {
            if (res.success) {
                setStats(res.stats);
            } else {
                setError(res.error || "Failed to load participation stats");
            }
            setLoading(false);
        });
    }, []);

    const filteredStats = stats.filter(s =>
        s.matricNumber?.toLowerCase().includes(search.toLowerCase()) ||
        s.name?.toLowerCase().includes(search.toLowerCase())
    );

    const handleExportCsv = async () => {
        const headers = ["Matric Number", "Student Name", "Total Attendance Count", "Average Score"];
        const rows = filteredStats.map(s => [
            s.matricNumber || 'Unknown',
            s.name || 'Unknown',
            s.attendanceCount,
            s.avgScore ? Number(s.avgScore).toFixed(2) : "N/A",
        ]);

        const csvString = await generateCsvString(headers, rows);
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "student_participation.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Prepare data for scatter chart: Map attendance count to X, avg score to Y
    const scatterData = stats.filter(s => s.avgScore !== null).map(s => ({
        name: s.name,
        matric: s.matricNumber,
        attendance: Number(s.attendanceCount),
        score: Number(s.avgScore)
    }));

    if (loading) return (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">Student Participation & Engagement</h1>
                    <p className="text-sm text-slate-500">Track student attendance correlation with academic performance</p>
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

            {/* Scatter Plot Correlation */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Attendance vs Grade Correlation</CardTitle>
                    <CardDescription>Does higher attendance lead to better grades? (Top 100 students)</CardDescription>
                </CardHeader>
                <CardContent>
                    {scatterData.length > 0 ? (
                        <div className="h-[400px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis type="number" dataKey="attendance" name="Attendance Count" label={{ value: 'Attendance Records', position: 'insideBottom', offset: -10 }} />
                                    <YAxis type="number" dataKey="score" name="Avg Score" unit="%" label={{ value: 'Average Grade', angle: -90, position: 'insideLeft' }} />
                                    <Tooltip
                                        cursor={{ strokeDasharray: '3 3' }}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload;
                                                return (
                                                    <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg text-sm">
                                                        <p className="font-semibold text-slate-900">{data.name}</p>
                                                        <p className="text-slate-500 font-mono text-xs mb-2">{data.matric}</p>
                                                        <p><span className="text-slate-500">Attendance:</span> <span className="font-medium">{data.attendance}</span></p>
                                                        <p><span className="text-slate-500">Avg Score:</span> <span className="font-medium text-indigo-600">{data.score.toFixed(1)}%</span></p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Scatter name="Students" data={scatterData} fill="#8b5cf6" fillOpacity={0.6} >
                                        {
                                            scatterData.map((entry, index) => {
                                                // Highlight at-risk students (low attendance + low grade)
                                                if (entry.attendance <= 2 && entry.score < 40) {
                                                    return <path key={`cell-${index}`} d="M0,0 M-5,-5 L5,5 M5,-5 L-5,5" stroke="red" strokeWidth={2} />
                                                }
                                                return <circle key={`cell-${index}`} r={6} />;
                                            })
                                        }
                                    </Scatter>
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center text-slate-500 text-sm">
                            Not enough data to map correlation.
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg w-full max-w-sm border border-slate-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                        <Search className="w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search students..."
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
                                <th className="px-6 py-4">Matric Number</th>
                                <th className="px-6 py-4">Student Name</th>
                                <th className="px-6 py-4">Attendance Loggings</th>
                                <th className="px-6 py-4">Avg Total Score</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredStats.map((stat, idx) => {
                                const isAtRisk = stat.attendanceCount <= 2 && (stat.avgScore === null || Number(stat.avgScore) < 40);

                                return (
                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-mono font-medium text-slate-900">{stat.matricNumber || 'N/A'}</td>
                                        <td className="px-6 py-4 text-slate-700">{stat.name}</td>
                                        <td className="px-6 py-4 font-semibold text-slate-900">{stat.attendanceCount}</td>
                                        <td className="px-6 py-4">
                                            {stat.avgScore !== null ? (
                                                <span className="font-medium text-slate-900">
                                                    {Number(stat.avgScore).toFixed(1)}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {isAtRisk ? (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold bg-red-50 text-red-700">
                                                    <UserMinus className="w-3.5 h-3.5" />
                                                    At Risk
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700">
                                                    Engaged
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                            {filteredStats.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                        No participation data found matching "{search}"
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
