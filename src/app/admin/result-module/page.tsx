"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getResultBatches,
  createResultBatch,
  getGradingScales,
  getAcademicSessions,
  toggleBatchPublication,
} from "@/actions/result-module";
import { seedResultDemo } from "@/actions/seed-result-demo";
import {
  BookOpen, Plus, FileUp, CheckCircle2, Clock, ChevronRight,
  BarChart3, Layers, AlertCircle, Loader2, Settings2, Printer, ChevronDown, X, Eye, EyeOff, Shield
} from "lucide-react";
import Link from "next/link";

export default function ResultModuleDashboard() {
  const router = useRouter();
  const [batches, setBatches] = useState<any[]>([]);
  const [scales, setScales] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [form, setForm] = useState({ academicSessionId: "", semester: "1" as "1" | "2", gradingScaleId: "" });

  const [togglingBatchId, setTogglingBatchId] = useState<number | null>(null);

  async function handleToggleBatch(e: React.MouseEvent, batchId: number, currentPublished: boolean) {
    e.preventDefault();
    e.stopPropagation();
    const confirmMsg = !currentPublished
      ? "Finalize and display results to student dashboard? Students will be able to view their grades."
      : "Hide results from student dashboard? Results will be switched off and hidden from student view.";
    if (!confirm(confirmMsg)) return;

    setTogglingBatchId(batchId);
    const res = await toggleBatchPublication(batchId, !currentPublished);
    setTogglingBatchId(null);
    if (res.success) {
      fetchAll();
    } else {
      alert("Error: " + res.error);
    }
  }

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [b, g, s] = await Promise.all([getResultBatches(), getGradingScales(), getAcademicSessions()]);
    setBatches(b.data || []);
    setScales(g.data || []);
    setSessions(s.data || []);
    setLoading(false);
  }

  async function handleSeedDemo() {
    if (!confirm("This will create demo students, courses, batches and published results. Continue?")) return;
    setSeeding(true);
    const res = await seedResultDemo();
    setSeeding(false);
    if (res.success) {
      alert(`✓ Demo data created!\n\nStudents: ${res.students}\nSemester 1 Batch: #${res.batch1Id} (published)\nSemester 2 Batch: #${res.batch2Id} (published)\n\nGo to Print Transcripts to view.`);
      fetchAll();
    } else {
      alert("Error: " + res.error);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.academicSessionId) return alert("Please select an academic session.");
    if (!form.gradingScaleId) return alert("Please select a grading scale. Grades will not reflect without a grading scale.");
    setSubmitting(true);
    const res = await createResultBatch({
      adminId: 1,
      academicSessionId: Number(form.academicSessionId),
      semester: form.semester as "1" | "2",
      gradingScaleId: Number(form.gradingScaleId),
    });
    setSubmitting(false);
    if (res.success) {
      setShowNew(false);
      fetchAll();
      router.push(`/admin/result-module/${res.batchId}`);
    } else {
      alert(res.error);
    }
  }

  const pending = batches.filter(b => b.status === "pending");
  const published = batches.filter(b => b.status === "published");

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-white/5 backdrop-blur-sm px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Result Processing Module</h1>
              <p className="text-sm text-slate-400">Upload, manage & publish student results</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/result-module/print" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors text-sm font-medium text-emerald-400">
              <Printer className="w-4 h-4" /> Print Transcripts
            </Link>
            <Link href="/admin/result-module/scales" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 transition-colors text-sm font-medium text-slate-300">
              <Settings2 className="w-4 h-4" /> Grading Scales
            </Link>
            <Link href="/admin/result-module/audit" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 transition-colors text-sm font-medium text-amber-400">
              <Shield className="w-4 h-4" /> Audit Trail
            </Link>
            <button onClick={handleSeedDemo} disabled={seeding}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 transition-colors text-sm font-medium text-amber-400 disabled:opacity-50">
              {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
              {seeding ? "Seeding..." : "Seed Demo"}
            </button>
            <button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 transition-all text-sm font-semibold shadow-lg">
              <Plus className="w-4 h-4" /> New Result Batch
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Batches", value: batches.length, icon: Layers, color: "from-blue-500 to-cyan-500" },
            { label: "Pending Approval", value: pending.length, icon: Clock, color: "from-amber-500 to-orange-500" },
            { label: "Published", value: published.length, icon: CheckCircle2, color: "from-emerald-500 to-teal-500" },
          ].map(stat => (
            <div key={stat.label} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-4 hover:bg-white/8 transition-colors">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-slate-400">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Batch List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
          </div>
        ) : batches.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
            <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-xl font-semibold text-slate-400">No result batches yet</p>
            <p className="text-slate-500 mt-2 mb-6">Create your first batch to start uploading student results</p>
            <button onClick={() => setShowNew(true)} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-semibold hover:opacity-90 transition-opacity">
              <Plus className="w-4 h-4" /> Create First Batch
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-300 mb-4">Result Batches</h2>
            {batches.map(batch => (
              <Link key={batch.id} href={`/admin/result-module/${batch.id}`}
                className="flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-violet-500/30 transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${batch.status === 'published' ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
                    {batch.status === 'published'
                      ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      : <Clock className="w-5 h-5 text-amber-400" />}
                  </div>
                  <div>
                    <p className="font-semibold text-white">
                      {batch.academicSession?.name} — Semester {batch.semester}
                    </p>
                    <p className="text-sm text-slate-400">
                      Scale: {batch.gradingScale?.name} &bull; Uploaded by {batch.admin?.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {/* Switch Toggle Button */}
                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <span className={`text-xs font-medium ${batch.status === 'published' ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                      {batch.status === 'published' ? 'Display ON' : 'Display OFF'}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleToggleBatch(e, batch.id, batch.status === 'published')}
                      disabled={togglingBatchId === batch.id}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                        batch.status === 'published' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-slate-700 border border-white/20'
                      }`}
                      title={batch.status === 'published' ? 'Switch off to hide from student dashboard' : 'Switch on to display to student dashboard'}
                    >
                      <span className="sr-only">Toggle display to student portal</span>
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                          batch.status === 'published' ? 'translate-x-5 text-emerald-600' : 'translate-x-0 text-slate-500'
                        }`}
                      >
                        {togglingBatchId === batch.id ? (
                          <Loader2 className="w-3 h-3 animate-spin text-slate-600" />
                        ) : batch.status === 'published' ? (
                          <Eye className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <EyeOff className="w-3 h-3 text-slate-500" />
                        )}
                      </span>
                    </button>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-violet-400 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* New Batch Modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1e293b] border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6">Create New Result Batch</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <DarkSelect
                label="Academic Session"
                value={form.academicSessionId}
                onChange={v => setForm(f => ({ ...f, academicSessionId: v }))}
                placeholder="Select session..."
                options={sessions.map(s => ({ value: String(s.id), label: s.name }))}
              />
              <DarkSelect
                label="Semester"
                value={form.semester}
                onChange={v => setForm(f => ({ ...f, semester: v }))}
                options={[
                  { value: "1", label: "First Semester" },
                  { value: "2", label: "Second Semester" },
                ]}
              />
              <DarkSelect
                label="Grading Scale"
                value={form.gradingScaleId}
                onChange={v => setForm(f => ({ ...f, gradingScaleId: v }))}
                placeholder="Select grading scale..."
                options={scales.map(s => ({ value: String(s.id), label: `${s.name} (Max: ${s.maxCgpa})` }))}
              />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowNew(false)}
                  className="flex-1 py-2.5 rounded-lg border border-white/20 text-slate-300 text-sm font-medium hover:bg-white/5 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function DarkSelect({ label, value, onChange, options, placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div>
      <label className="block text-sm text-slate-400 mb-1">{label}</label>
      <div ref={ref} className="relative">
        <button type="button" onClick={() => setOpen(!open)}
          className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-left flex items-center justify-between focus:outline-none focus:border-violet-400 transition-colors">
          <span className={selected ? "text-white" : "text-slate-500"}>{selected ? selected.label : (placeholder || "Select...")}</span>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-slate-800 border border-white/20 rounded-lg max-h-48 overflow-y-auto shadow-xl">
            {placeholder && (
              <button type="button" onClick={() => { onChange(""); setOpen(false); }}
                className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:bg-white/10 transition-colors border-b border-white/5">
                {placeholder}
              </button>
            )}
            {options.map(o => (
              <button key={o.value} type="button" onClick={() => { onChange(o.value); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-xs transition-colors border-b border-white/5 last:border-0 ${o.value === value ? "bg-violet-600/30 text-violet-300" : "text-white hover:bg-white/10"}`}>
                {o.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
