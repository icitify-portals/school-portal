"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  getResultBatches,
  createResultBatch,
  getGradingScales,
  getAcademicSessions,
} from "@/actions/result-module";
import {
  BookOpen, Plus, FileUp, CheckCircle2, Clock, ChevronRight,
  BarChart3, Layers, AlertCircle, Loader2, Settings2,
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
  const [form, setForm] = useState({ academicSessionId: "", semester: "1", gradingScaleId: "" });

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [b, g, s] = await Promise.all([getResultBatches(), getGradingScales(), getAcademicSessions()]);
    setBatches(b.data || []);
    setScales(g.data || []);
    setSessions(s.data || []);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    // We'd normally get adminId from session, using 1 as placeholder
    const res = await createResultBatch({
      adminId: 1,
      academicSessionId: Number(form.academicSessionId),
      semester: form.semester as "1" | "2" | "3",
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
            <Link href="/admin/result-module/scales" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 transition-colors text-sm font-medium text-slate-300">
              <Settings2 className="w-4 h-4" /> Grading Scales
            </Link>
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
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${batch.status === 'published' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                    {batch.status === 'published' ? 'Published' : 'Pending'}
                  </span>
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
              <div>
                <label className="block text-sm text-slate-400 mb-1">Academic Session</label>
                <select required value={form.academicSessionId} onChange={e => setForm(f => ({ ...f, academicSessionId: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-400">
                  <option value="">Select session...</option>
                  {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Semester</label>
                <select required value={form.semester} onChange={e => setForm(f => ({ ...f, semester: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-400">
                  <option value="1">First Semester</option>
                  <option value="2">Second Semester</option>
                  <option value="3">Third / Summer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Grading Scale</label>
                <select required value={form.gradingScaleId} onChange={e => setForm(f => ({ ...f, gradingScaleId: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-400">
                  <option value="">Select grading scale...</option>
                  {scales.map(s => <option key={s.id} value={s.id}>{s.name} (Max: {s.maxCgpa})</option>)}
                </select>
              </div>
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
