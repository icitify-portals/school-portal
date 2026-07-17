"use client";

import { useState, useEffect } from "react";
import { getGradingScales, createGradingScale, deleteGradingScale } from "@/actions/result-module";
import { ArrowLeft, Plus, Trash2, Loader2, Scale, Info } from "lucide-react";
import Link from "next/link";

// Default scale templates
const SCALE_TEMPLATES = [
  {
    name: "Standard 5.0 Scale (Nigeria)",
    maxCgpa: "5.00",
    description: "Commonly used in Nigerian universities",
    rules: JSON.stringify([
      { min: 70, max: 100, grade: "A", point: 5 },
      { min: 60, max: 69, grade: "B", point: 4 },
      { min: 50, max: 59, grade: "C", point: 3 },
      { min: 45, max: 49, grade: "D", point: 2 },
      { min: 40, max: 44, grade: "E", point: 1 },
      { min: 0,  max: 39, grade: "F", point: 0 },
    ], null, 2),
  },
  {
    name: "Standard 4.0 Scale (US)",
    maxCgpa: "4.00",
    description: "Common in US-aligned institutions",
    rules: JSON.stringify([
      { min: 90, max: 100, grade: "A",  point: 4.0 },
      { min: 80, max: 89,  grade: "B",  point: 3.0 },
      { min: 70, max: 79,  grade: "C",  point: 2.0 },
      { min: 60, max: 69,  grade: "D",  point: 1.0 },
      { min: 0,  max: 59,  grade: "F",  point: 0.0 },
    ], null, 2),
  },
  {
    name: "Custom 7-Point Scale",
    maxCgpa: "7.00",
    description: "Some postgraduate programmes",
    rules: JSON.stringify([
      { min: 70, max: 100, grade: "A+", point: 7 },
      { min: 65, max: 69,  grade: "A",  point: 6 },
      { min: 60, max: 64,  grade: "B+", point: 5 },
      { min: 55, max: 59,  grade: "B",  point: 4 },
      { min: 50, max: 54,  grade: "C",  point: 3 },
      { min: 45, max: 49,  grade: "D",  point: 2 },
      { min: 0,  max: 44,  grade: "F",  point: 0 },
    ], null, 2),
  },
];

export default function GradingScalesPage() {
  const [scales, setScales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    maxCgpa: "",
    rules: "",
  });
  const [rulesError, setRulesError] = useState("");

  useEffect(() => { fetchScales(); }, []);

  async function fetchScales() {
    setLoading(true);
    const res = await getGradingScales();
    setScales(res.data || []);
    setLoading(false);
  }

  function applyTemplate(t: typeof SCALE_TEMPLATES[0]) {
    setForm({ name: t.name, description: t.description, maxCgpa: t.maxCgpa, rules: t.rules });
    setRulesError("");
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setRulesError("");
    try {
      JSON.parse(form.rules);
    } catch {
      setRulesError("Invalid JSON in rules field. Please fix the format.");
      return;
    }
    setSaving(true);
    const res = await createGradingScale(form);
    setSaving(false);
    if (res.success) {
      setShowForm(false);
      setForm({ name: "", description: "", maxCgpa: "", rules: "" });
      fetchScales();
    } else {
      alert(res.error);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this grading scale? This cannot be undone.")) return;
    await deleteGradingScale(id);
    fetchScales();
  }

  function parseRules(rulesJson: string) {
    try { return JSON.parse(rulesJson); } catch { return []; }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-white/5 backdrop-blur-sm px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/result-module" className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/15 flex items-center justify-center transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Scale className="w-5 h-5 text-violet-400" /> Grading Scales
              </h1>
              <p className="text-sm text-slate-400">Configure how scores map to grades and grade points</p>
            </div>
          </div>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" /> New Scale
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Templates */}
        <div>
          <p className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wide flex items-center gap-2">
            <Info className="w-4 h-4" /> Quick Templates — Click to apply
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SCALE_TEMPLATES.map((t) => (
              <button key={t.name} onClick={() => applyTemplate(t)}
                className="text-left p-4 bg-white/5 border border-white/10 rounded-xl hover:border-violet-400/40 hover:bg-white/10 transition-all group">
                <p className="font-semibold text-white group-hover:text-violet-300 transition-colors text-sm">{t.name}</p>
                <p className="text-xs text-slate-500 mt-1">{t.description}</p>
                <p className="text-xs font-mono text-violet-400 mt-2">Max CGPA: {t.maxCgpa}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Existing Scales */}
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 text-violet-400 animate-spin" /></div>
        ) : scales.length === 0 ? (
          <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
            <Scale className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No grading scales yet. Use a template above or create one manually.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">Saved Grading Scales</h2>
            {scales.map(scale => {
              const rules = parseRules(scale.rules);
              return (
                <div key={scale.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/5">
                    <div>
                      <p className="font-semibold text-white">{scale.name}</p>
                      {scale.description && <p className="text-sm text-slate-400">{scale.description}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-xs font-mono">Max: {scale.maxCgpa}</span>
                      <button onClick={() => handleDelete(scale.id)}
                        className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-xs text-slate-500 uppercase tracking-wide">
                          <th className="px-5 py-2 text-left">Score Range</th>
                          <th className="px-5 py-2 text-center">Grade</th>
                          <th className="px-5 py-2 text-center">Grade Point</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rules.map((r: any, i: number) => (
                          <tr key={i} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                            <td className="px-5 py-3 text-sm font-mono text-slate-300">{r.min} – {r.max}</td>
                            <td className="px-5 py-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-xs font-bold ${r.grade[0] === "A" ? "bg-emerald-500/20 text-emerald-300" : r.grade[0] === "B" ? "bg-blue-500/20 text-blue-300" : r.grade[0] === "C" ? "bg-yellow-500/20 text-yellow-300" : r.grade[0] === "D" ? "bg-orange-500/20 text-orange-300" : "bg-red-500/20 text-red-300"}`}>
                                {r.grade}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-center text-sm font-semibold text-violet-300">{r.point}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1e293b] border border-white/10 rounded-2xl p-8 w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-white mb-6">Create Grading Scale</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Scale Name</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g., Standard 5.0 Scale"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-400" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Description (optional)</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Brief note about this scale"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-400" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Maximum CGPA</label>
                <input required type="number" step="0.01" min="1" max="10" value={form.maxCgpa} onChange={e => setForm(f => ({ ...f, maxCgpa: e.target.value }))}
                  placeholder="e.g., 5.00"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-400" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Grade Rules (JSON Array)</label>
                <p className="text-xs text-slate-500 mb-2">Format: [{"{"}min, max, grade, point{"}"}]</p>
                <textarea required rows={10} value={form.rules} onChange={e => { setForm(f => ({ ...f, rules: e.target.value })); setRulesError(""); }}
                  placeholder='[{"min":70,"max":100,"grade":"A","point":5},...]'
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-violet-400 resize-none" />
                {rulesError && <p className="text-xs text-red-400 mt-1">{rulesError}</p>}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-lg border border-white/20 text-slate-300 text-sm hover:bg-white/5 transition-colors">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Save Scale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
