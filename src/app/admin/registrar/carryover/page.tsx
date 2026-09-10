"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCarryoverDashboard, registerCarryoverCourse, updateCarryoverStatus } from "@/actions/carryover";
import { getDepartments } from "@/actions/departments";
import { toast } from "sonner";
import { BookOpen, AlertTriangle, CheckCircle2, Clock, Wallet, Search, Filter, RefreshCw, GraduationCap } from "lucide-react";

export default function CarryoverDashboardPage() {
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [departments, setDepartments] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    const res: any = await getCarryoverDashboard({ status: statusFilter, level: levelFilter });
    if (res.success) {
      setData(res.data || []);
      setStats(res.stats);
      setTotal(res.total);
    } else {
      toast.error(res.error || "Failed to load carryover");
    }
    setLoading(false);
  };

  useEffect(() => {
    getDepartments().then((res: any) => setDepartments(res || []));
    fetchData();
  }, [statusFilter, levelFilter]);

  const filtered = data.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (r.studentName || "").toLowerCase().includes(q) || (r.matricNumber || "").toLowerCase().includes(q) || (r.courseCode || "").toLowerCase().includes(q) || (r.courseName || "").toLowerCase().includes(q);
  });

  const handleRegister = async (r: any) => {
    if (!confirm(`Register ${r.courseCode} for ${r.studentName} retake?`)) return;
    const res: any = await registerCarryoverCourse(r.studentId, r.courseId, r.sessionId, r.semester);
    if (res.success) { toast.success("Registered for retake"); fetchData(); } else toast.error(res.error);
  };

  const handleStatus = async (id: number, status: string) => {
    const res: any = await updateCarryoverStatus(id, status as any);
    if (res.success) { toast.success(`Marked ${status}`); fetchData(); } else toast.error(res.error);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-slate-50 space-y-6">
      <div className="bg-slate-900 text-white rounded-[2rem] p-8 flex flex-col md:flex-row justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center"><BookOpen className="w-7 h-7 text-amber-400" /></div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight italic">Carryover Dashboard</h1>
            <p className="text-slate-400 text-sm">All carryover courses, students, course status & payment — linked to Registrar</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchData} variant="outline" className="rounded-xl bg-white/10 border-white/20 text-white hover:bg-white/20"><RefreshCw className="w-4 h-4 mr-2" /> Refresh</Button>
          <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-black uppercase">{total} Total</span>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card className="rounded-2xl border-amber-200 bg-amber-50"><CardContent className="p-4 text-center"><p className="text-2xl font-black text-amber-600">{stats.pending}</p><p className="text-[10px] font-black uppercase text-amber-700/60">Pending</p></CardContent></Card>
          <Card className="rounded-2xl border-emerald-200 bg-emerald-50"><CardContent className="p-4 text-center"><p className="text-2xl font-black text-emerald-600">{stats.registered}</p><p className="text-[10px] font-black uppercase text-emerald-700/60">Registered</p></CardContent></Card>
          <Card className="rounded-2xl border-slate-200 bg-white"><CardContent className="p-4 text-center"><p className="text-2xl font-black text-slate-700">{stats.passed}</p><p className="text-[10px] font-black uppercase">Passed</p></CardContent></Card>
          <Card className="rounded-2xl border-rose-200 bg-rose-50"><CardContent className="p-4 text-center"><p className="text-2xl font-black text-rose-600">{stats.failed}</p><p className="text-[10px] font-black uppercase">Failed</p></CardContent></Card>
          <Card className="rounded-2xl border-indigo-200 bg-indigo-50"><CardContent className="p-4 text-center"><p className="text-2xl font-black text-indigo-600">{stats.unpaid}</p><p className="text-[10px] font-black uppercase">Unpaid</p></CardContent></Card>
          <Card className="rounded-2xl border-slate-200 bg-white"><CardContent className="p-4 text-center"><p className="text-2xl font-black text-slate-700">{stats.total}</p><p className="text-[10px] font-black uppercase">Total Carryovers</p></CardContent></Card>
        </div>
      )}

      <Card className="rounded-2xl border-slate-200">
        <CardContent className="p-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search student, matric, course..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 rounded-xl" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold bg-white">
            <option value="all">All Status</option><option value="pending">Pending</option><option value="registered">Registered</option><option value="passed">Passed</option><option value="failed">Failed</option>
          </select>
          <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold bg-white">
            <option value="all">All Levels</option><option value="ND1">ND1</option><option value="ND2">ND2</option><option value="HND1">HND1</option><option value="HND2">HND2</option>
          </select>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-slate-200 overflow-hidden">
        <CardHeader className="bg-slate-50 border-b flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2"><GraduationCap className="w-4 h-4" /> Carryover Courses & Students</CardTitle>
          <span className="text-xs font-bold text-slate-500">{filtered.length} shown</span>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-bold">No carryover records</p>
              <p className="text-xs">All courses passed or no F grades found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead><tr className="bg-slate-50 border-b text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <th className="px-3 py-3">Student</th><th className="px-3 py-3">Matric</th><th className="px-3 py-3">Dept/Level</th><th className="px-3 py-3">Course</th><th className="px-3 py-3">Session/Sem</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Payment</th><th className="px-3 py-3">Action</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.slice(0, 100).map((r: any) => (
                    <tr key={`${r.studentId}-${r.courseId}-${r.id}`} className="hover:bg-slate-50">
                      <td className="px-3 py-3 font-bold text-slate-800">{r.studentName}</td>
                      <td className="px-3 py-3 font-mono text-[11px]">{r.matricNumber || "—"}</td>
                      <td className="px-3 py-3"><span className="font-bold text-indigo-600">{r.deptCode || "—"}</span> <span className="text-slate-400">{r.programmeType}{r.currentLevel}</span></td>
                      <td className="px-3 py-3"><span className="font-bold">{r.courseCode}</span> <span className="text-slate-500">{r.courseName}</span> <span className="text-[10px] text-slate-400">({r.courseUnits}U)</span></td>
                      <td className="px-3 py-3">{r.sessionName || "—"} / Sem {r.semester}</td>
                      <td className="px-3 py-3">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase border ${r.status==='pending'?'bg-amber-50 border-amber-200 text-amber-700':r.status==='registered'?'bg-emerald-50 border-emerald-200 text-emerald-700':r.status==='passed'?'bg-slate-100 border-slate-200 text-slate-600':'bg-rose-50 border-rose-200 text-rose-700'}`}>{r.status}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black uppercase border ${r.paymentStatus==='paid'?'bg-emerald-50 border-emerald-200 text-emerald-700':r.paymentStatus==='partial'?'bg-amber-50 border-amber-200 text-amber-700':'bg-rose-50 border-rose-200 text-rose-700'}`}>
                          <Wallet className="w-3 h-3" />{r.paymentStatus}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex gap-1">
                          {r.status==='pending' && <Button size="sm" onClick={() => handleRegister(r)} className="h-7 text-[10px] font-black bg-indigo-600 hover:bg-indigo-700">Register</Button>}
                          {r.id > 0 && (
                            <select onChange={(e) => e.target.value && handleStatus(r.id, e.target.value)} defaultValue="" className="h-7 px-2 rounded-lg border border-slate-200 text-[10px] font-bold bg-white">
                              <option value="">Set Status</option><option value="registered">Registered</option><option value="passed">Passed</option><option value="failed">Failed</option>
                            </select>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {filtered.length > 100 && <div className="p-3 text-center text-xs text-slate-400 bg-slate-50 border-t">Showing 100 of {filtered.length} — use search to narrow</div>}
        </CardContent>
      </Card>

      <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-start gap-3">
        <Wallet className="w-5 h-5 text-indigo-600 mt-0.5" />
        <div className="text-xs text-indigo-800">
          <p className="font-black uppercase tracking-wider">Payment for Carryover</p>
          <p className="mt-1 leading-relaxed">Students pay for carryover via <strong>Bursary → Bills → Generate Bill</strong> (select course + session) or <strong>Admin → Bursary → Create Bill</strong>. Payment status above reflects <code>student_bills.status</code> (<code>paid/partially_paid/pending</code>). Registrar can mark <code>Registered</code> after payment confirmed.</p>
        </div>
      </div>
    </div>
  );
}
