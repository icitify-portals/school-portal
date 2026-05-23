"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Filter,
    Download,
    Printer,
    Loader2,
    AlertCircle,
    Calendar,
    Users,
    Building2,
    Layers,
    FileText
} from "lucide-react";
import { getFinancialReports, getFeeItems } from "@/actions/bursary";
import { getDepartments } from "@/actions/departments";
import { getProgrammes } from "@/actions/programmes";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    Legend
} from "recharts";
import { cn } from "@/lib/utils";
import Papa from "papaparse";

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function BursaryReportsPage() {
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState<any>(null);
    const [feeItems, setFeeItems] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [programmes, setProgrammes] = useState<any[]>([]);

    // Filters
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [level, setLevel] = useState("");
    const [deptId, setDeptId] = useState("");
    const [programmeId, setProgrammeId] = useState("");
    const [feeItemId, setFeeItemId] = useState("");

    useEffect(() => {
        fetchMetadata();
        fetchData();
    }, []);

    const fetchMetadata = async () => {
        const [fees, depts, progs] = await Promise.all([
            getFeeItems(),
            getDepartments(),
            getProgrammes()
        ]);
        setFeeItems(fees);
        setDepartments(depts);
        setProgrammes(progs);
    };

    const fetchData = async () => {
        setLoading(true);
        const res = await getFinancialReports({
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            level: level ? parseInt(level) : undefined,
            deptId: deptId ? parseInt(deptId) : undefined,
            programmeId: programmeId ? parseInt(programmeId) : undefined,
            feeItemId: feeItemId ? parseInt(feeItemId) : undefined
        });
        setReportData(res);
        setLoading(false);
    };

    const handleExportCSV = () => {
        if (!reportData?.transactions) return;

        const csvData = reportData.transactions.map((d: any) => ({
            Date: new Date(d.transaction.createdAt).toLocaleDateString(),
            Student: `${d.student?.firstName} ${d.student?.lastName}`,
            Matric: d.student?.matricNumber || 'N/A',
            Department: d.department?.name || 'N/A',
            Level: `${d.student?.currentLevel}L`,
            Purpose: d.transaction.purpose,
            Amount: d.transaction.amount,
            Type: d.transaction.type,
            Gateway: d.transaction.gateway,
            Reference: d.transaction.gatewayReference || 'N/A'
        }));

        const csv = Papa.unparse(csvData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Financial_Report_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Financial Intelligence</h2>
                    <p className="text-slate-500 mt-1">Advanced reporting and revenue analytics</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => window.print()} className="gap-2">
                        <Printer className="w-4 h-4" />
                        Print Summary
                    </Button>
                    <Button onClick={handleExportCSV} className="bg-slate-900 hover:bg-slate-800 gap-2 shadow-lg shadow-slate-200">
                        <Download className="w-4 h-4" />
                        Export CSV
                    </Button>
                </div>
            </div>

            {/* Filters Bar */}
            <Card className="border-none shadow-sm ring-1 ring-slate-200">
                <CardContent className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Start Date</label>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full h-9 border rounded-md px-2 text-xs" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">End Date</label>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full h-9 border rounded-md px-2 text-xs" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Level</label>
                            <select value={level} onChange={e => setLevel(e.target.value)} className="w-full h-9 border rounded-md px-2 text-xs outline-none">
                                <option value="">All Levels</option>
                                {[100, 200, 300, 400, 500, 600, 700].map(l => <option key={l} value={l}>{l}L</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Department</label>
                            <select value={deptId} onChange={e => setDeptId(e.target.value)} className="w-full h-9 border rounded-md px-2 text-xs outline-none">
                                <option value="">All Departments</option>
                                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Programme</label>
                            <select value={programmeId} onChange={e => setProgrammeId(e.target.value)} className="w-full h-9 border rounded-md px-2 text-xs outline-none">
                                <option value="">All Programmes</option>
                                {programmes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Fee Item</label>
                            <select value={feeItemId} onChange={e => setFeeItemId(e.target.value)} className="w-full h-9 border rounded-md px-2 text-xs outline-none">
                                <option value="">All Items</option>
                                {feeItems.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                        </div>
                        <div className="flex items-end">
                            <Button onClick={fetchData} className="w-full h-9 bg-indigo-600 hover:bg-indigo-700 gap-2">
                                <Filter className="w-3.5 h-3.5" />
                                Filter
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {loading ? (
                <div className="flex flex-col items-center justify-center h-[500px] text-slate-400 gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                    <p className="font-medium animate-pulse">Analyzing financial data...</p>
                </div>
            ) : (
                <>
                    {/* KPI Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <Card className="border-none shadow-sm ring-1 ring-slate-200 overflow-hidden">
                            <div className="h-1 bg-indigo-500" />
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase">Net Revenue</p>
                                        <h3 className="text-2xl font-bold text-slate-900 mt-1">₦{reportData.stats.totalRevenue.toLocaleString()}</h3>
                                    </div>
                                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                                        <DollarSign className="w-5 h-5" />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center text-xs text-green-600 font-medium">
                                    <TrendingUp className="w-3 h-3 mr-1" />
                                    Total Profit Margin
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm ring-1 ring-slate-200 overflow-hidden">
                            <div className="h-1 bg-emerald-500" />
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase">Gross Collections</p>
                                        <h3 className="text-2xl font-bold text-slate-900 mt-1">₦{reportData.stats.totalCollections.toLocaleString()}</h3>
                                    </div>
                                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                                        <TrendingUp className="w-5 h-5" />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center text-xs text-slate-500">
                                    Across all gateways & manual
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm ring-1 ring-slate-200 overflow-hidden">
                            <div className="h-1 bg-amber-500" />
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase">Total Refunds</p>
                                        <h3 className="text-2xl font-bold text-slate-900 mt-1">₦{reportData.stats.totalRefunds.toLocaleString()}</h3>
                                    </div>
                                    <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
                                        <TrendingDown className="w-5 h-5" />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center text-xs text-slate-500">
                                    Processed through refund module
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm ring-1 ring-slate-200 overflow-hidden">
                            <div className="h-1 bg-slate-800" />
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase">Tx Count</p>
                                        <h3 className="text-2xl font-bold text-slate-900 mt-1">{reportData.stats.count}</h3>
                                    </div>
                                    <div className="w-10 h-10 bg-slate-50 text-slate-600 rounded-lg flex items-center justify-center">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center text-xs text-slate-500">
                                    Total verified transactions
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Daily Trend Chart */}
                        <Card className="border-none shadow-sm ring-1 ring-slate-200">
                            <CardHeader>
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-indigo-500" />
                                    Daily Revenue Trend
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={reportData.charts.dailyTrend}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="date"
                                            stroke="#94a3b8"
                                            fontSize={10}
                                            tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        />
                                        <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(val) => `₦${val / 1000}k`} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            formatter={(val: any) => [`₦${val.toLocaleString()}`, "Revenue"]}
                                        />
                                        <Line type="monotone" dataKey="amount" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Revenue by Level */}
                        <Card className="border-none shadow-sm ring-1 ring-slate-200">
                            <CardHeader>
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-emerald-500" />
                                    Revenue by Academic Level
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={reportData.charts.revenueByLevel}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="level" stroke="#94a3b8" fontSize={10} />
                                        <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(val) => `₦${val / 1000}k`} />
                                        <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px' }} />
                                        <Bar dataKey="amount" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Revenue by Category */}
                        <Card className="border-none shadow-sm ring-1 ring-slate-200">
                            <CardHeader>
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-amber-500" />
                                    Revenue Allocation by Category
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={reportData.charts.revenueByCategory}
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {reportData.charts.revenueByCategory.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Recent Audit Log Summary */}
                        <Card className="border-none shadow-sm ring-1 ring-slate-200 overflow-hidden">
                            <CardHeader className="bg-slate-50/50">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-slate-500" />
                                    Operational Audit Log (Last 10)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-slate-100">
                                    {reportData.transactions.slice(0, 10).map((t: any) => (
                                        <div key={t.transaction.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                                                    t.transaction.type === 'credit' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                                )}>
                                                    {t.transaction.type === 'credit' ? '+' : '-'}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-800">{t.transaction.purpose}</p>
                                                    <p className="text-[10px] text-slate-400 capitalize">{t.student?.firstName} {t.student?.lastName} • {t.transaction.gateway}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-slate-900">₦{parseFloat(t.transaction.amount).toLocaleString()}</p>
                                                <p className="text-[10px] text-slate-400">{new Date(t.transaction.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-4 bg-slate-50 text-center border-t border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">End of summary log</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
}
