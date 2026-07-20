"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Papa from "papaparse";
import {
  getBatchDetails,
  addSingleStudentResult,
  addBulkResultsViaIdentifier,
  approveAndPublishBatch,
  searchStudents,
  getCoursesList,
  createCourseOnTheFly,
} from "@/actions/result-module";
import {
  ArrowLeft, Upload, UserPlus, CheckCircle2, Loader2, Search,
  Plus, FileUp, Trash2, AlertTriangle, BookOpen, X, Eye,
} from "lucide-react";
import Link from "next/link";

type Tab = "single" | "bulk";

export default function BatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const batchId = Number(params.batchId);

  const [batch, setBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("single");
  const [publishing, setPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  // Single student entry state
  const [studentQuery, setStudentQuery] = useState("");
  const [studentResults, setStudentResults] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [entries, setEntries] = useState<{ courseId: string; score: string; creditLoad: string }[]>([
    { courseId: "", score: "", creditLoad: "" }
  ]);
  const [savingSingle, setSavingSingle] = useState(false);
  const [singleSuccess, setSingleSuccess] = useState(false);

  // New course modal
  const [showNewCourse, setShowNewCourse] = useState(false);
  const [newCourse, setNewCourse] = useState({ name: "", code: "", creditUnits: "" });
  const [savingCourse, setSavingCourse] = useState(false);

  // Bulk upload state
  const [bulkCourseId, setBulkCourseId] = useState("");
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploadingBulk, setUploadingBulk] = useState(false);
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);
  const [skippedRows, setSkippedRows] = useState<string[]>([]);

  useEffect(() => { fetchBatch(); }, [batchId]);

  async function fetchBatch() {
    setLoading(true);
    const [bRes, cRes] = await Promise.all([getBatchDetails(batchId), getCoursesList()]);
    setBatch(bRes.data);
    setCourses(cRes.data || []);
    setLoading(false);
  }

  const searchStudentsFn = useCallback(async (q: string) => {
    if (!q.trim()) return;
    const res = await searchStudents(q);
    setStudentResults(res.data || []);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchStudentsFn(studentQuery), 400);
    return () => clearTimeout(t);
  }, [studentQuery, searchStudentsFn]);

  async function handleSingleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStudent) return alert("Please select a student");
    setSavingSingle(true);
    for (const entry of entries) {
      if (!entry.courseId || !entry.score || !entry.creditLoad) continue;
      await addSingleStudentResult({
        batchId,
        studentId: selectedStudent.id,
        courseId: Number(entry.courseId),
        score: Number(entry.score),
        creditLoad: Number(entry.creditLoad),
        gradingScaleRules: batch?.gradingScale?.rules || "[]",
      });
    }
    setSavingSingle(false);
    setSingleSuccess(true);
    setTimeout(() => setSingleSuccess(false), 3000);
    setEntries([{ courseId: "", score: "", creditLoad: "" }]);
    setSelectedStudent(null);
    setStudentQuery("");
    fetchBatch();
  }

  function handleCsvUpload(file: File) {
    setCsvFile(file);
    setBulkErrors([]);
    setSkippedRows([]);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const errors: string[] = [];
        const rows = res.data as any[];
        rows.forEach((r, i) => {
          if (!r.student_identifier) errors.push(`Row ${i + 2}: missing student_identifier`);
          if (!r.score) errors.push(`Row ${i + 2}: missing score`);
        });
        setBulkErrors(errors);
        setCsvData(rows);
      },
    });
  }

  async function handleBulkUpload() {
    if (!bulkCourseId) return alert("Please select a course for this upload.");
    if (bulkErrors.length > 0) return alert("Fix CSV format errors before uploading.");
    if (!csvData.length) return alert("No data to upload.");
    
    setUploadingBulk(true);
    setSkippedRows([]);
    const rows = csvData.map(r => ({
      identifier: r.student_identifier,
      score: Number(r.score),
    }));
    
    const res = await addBulkResultsViaIdentifier(
      batchId, 
      Number(bulkCourseId), 
      rows, 
      batch?.gradingScale?.rules || "[]"
    );
    
    setUploadingBulk(false);
    
    if (res.success) {
      setCsvData([]);
      setCsvFile(null);
      fetchBatch();
      if (res.errors && res.errors.length > 0) {
        setSkippedRows(res.errors);
        alert(`Uploaded ${res.count} results successfully, but some identifiers were skipped.`);
      } else {
        alert(`✓ Uploaded ${res.count} results successfully`);
      }
    } else {
      alert("Error: " + res.error);
    }
  }

  async function handlePublish() {
    if (!confirm("Are you sure you want to publish this batch? Students will see their results.")) return;
    setPublishing(true);
    const res = await approveAndPublishBatch(batchId);
    setPublishing(false);
    if (res.success) {
      setPublishSuccess(true);
      fetchBatch();
    } else {
      alert("Error: " + res.error);
    }
  }

  async function handleCreateCourse(e: React.FormEvent) {
    e.preventDefault();
    setSavingCourse(true);
    const res = await createCourseOnTheFly({
      name: newCourse.name,
      code: newCourse.code,
      creditUnits: Number(newCourse.creditUnits),
    });
    setSavingCourse(false);
    if (res.success) {
      setShowNewCourse(false);
      const cRes = await getCoursesList();
      setCourses(cRes.data || []);
      setNewCourse({ name: "", code: "", creditUnits: "" });
    } else {
      alert(res.error);
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-violet-400 animate-spin" />
    </div>
  );

  const resultsInBatch = batch?.studentResults || [];
  const isPublished = batch?.status === "published";

  // Group results by student
  const studentMap = new Map<number, { student: any; results: any[] }>();
  resultsInBatch.forEach((r: any) => {
    if (!studentMap.has(r.studentId)) {
      studentMap.set(r.studentId, { student: r.student, results: [] });
    }
    studentMap.get(r.studentId)!.results.push(r);
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-white/5 backdrop-blur-sm px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/result-module" className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/15 flex items-center justify-center transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">
                {batch?.academicSession?.name} — Semester {batch?.semester}
              </h1>
              <p className="text-sm text-slate-400">
                Scale: {batch?.gradingScale?.name} &bull; {resultsInBatch.length} result entries
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!isPublished && resultsInBatch.length > 0 && (
              <button onClick={handlePublish} disabled={publishing}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold text-sm shadow-lg disabled:opacity-60 transition-all">
                {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Approve & Publish
              </button>
            )}
            {isPublished && (
              <span className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4" /> Published
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left: Upload Panel */}
        {!isPublished && (
          <div className="xl:col-span-1 space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="flex border-b border-white/10">
                {(["single", "bulk"] as Tab[]).map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`flex-1 py-3 text-sm font-semibold transition-colors ${tab === t ? "bg-violet-600/30 text-violet-300 border-b-2 border-violet-400" : "text-slate-400 hover:text-white"}`}>
                    {t === "single" ? "Single Student" : "Bulk Upload (CSV)"}
                  </button>
                ))}
              </div>

              {tab === "single" && (
                <div className="p-5">
                  <form onSubmit={handleSingleSubmit} className="space-y-4">
                    {/* Student Search */}
                    <div>
                      <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wide">Search Student</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input value={studentQuery} onChange={e => setStudentQuery(e.target.value)} placeholder="Name, matric, admission no..."
                          className="w-full bg-white/10 border border-white/20 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-400" />
                      </div>
                      {studentResults.length > 0 && !selectedStudent && (
                        <div className="mt-1 bg-[#0f172a] border border-white/20 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                          {studentResults.map(s => (
                            <button key={s.id} type="button" onClick={() => { setSelectedStudent(s); setStudentResults([]); }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-white/10 transition-colors border-b border-white/5 last:border-0">
                              <p className="font-medium text-white">{s.user?.name}</p>
                              <p className="text-xs text-slate-400">{s.matricNumber || s.admissionNumber}</p>
                            </button>
                          ))}
                        </div>
                      )}
                      {selectedStudent && (
                        <div className="mt-2 flex items-center justify-between px-3 py-2 bg-violet-500/20 rounded-lg border border-violet-500/30">
                          <div>
                            <p className="text-sm font-semibold text-violet-200">{selectedStudent.user?.name}</p>
                            <p className="text-xs text-slate-400">{selectedStudent.matricNumber || selectedStudent.admissionNumber}</p>
                          </div>
                          <button type="button" onClick={() => { setSelectedStudent(null); setStudentQuery(""); }}>
                            <X className="w-4 h-4 text-slate-400 hover:text-white" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Course Entries */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs text-slate-400 uppercase tracking-wide">Courses & Scores</label>
                        <button type="button" onClick={() => setShowNewCourse(true)} className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
                          <Plus className="w-3 h-3" /> New Course
                        </button>
                      </div>
                      {entries.map((entry, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-2 mb-2">
                          <select value={entry.courseId} onChange={e => {
                            const c = courses.find(c => c.id === Number(e.target.value));
                            setEntries(en => en.map((en2, i) => i === idx ? { ...en2, courseId: e.target.value, creditLoad: c?.creditUnits?.toString() || "" } : en2));
                          }} className="col-span-6 bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-violet-400">
                            <option value="">Select course...</option>
                            {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
                          </select>
                          <input type="number" min={0} max={100} placeholder="Score" value={entry.score}
                            onChange={e => setEntries(en => en.map((en2, i) => i === idx ? { ...en2, score: e.target.value } : en2))}
                            className="col-span-3 bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-violet-400" />
                          <input type="number" min={1} placeholder="Cr." value={entry.creditLoad}
                            onChange={e => setEntries(en => en.map((en2, i) => i === idx ? { ...en2, creditLoad: e.target.value } : en2))}
                            className="col-span-2 bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-violet-400" />
                          <button type="button" onClick={() => setEntries(en => en.filter((_, i) => i !== idx))} disabled={entries.length === 1}
                            className="col-span-1 flex items-center justify-center text-red-400 hover:text-red-300 disabled:opacity-30">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <button type="button" onClick={() => setEntries(en => [...en, { courseId: "", score: "", creditLoad: "" }])}
                        className="text-xs text-slate-400 hover:text-white flex items-center gap-1 mt-1">
                        <Plus className="w-3 h-3" /> Add course
                      </button>
                    </div>

                    <button type="submit" disabled={savingSingle || !selectedStudent}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                      {savingSingle ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      {singleSuccess ? "Saved!" : "Save Results"}
                    </button>
                  </form>
                </div>
              )}

              {tab === "bulk" && (
                <div className="p-5 space-y-4">
                  {/* Course Selection */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wide">Target Course</label>
                    <select value={bulkCourseId} onChange={e => setBulkCourseId(e.target.value)} 
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-400">
                      <option value="">Select course for this upload...</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
                    </select>
                  </div>

                  {/* CSV Template Download */}
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                    <p className="text-xs text-blue-300 font-semibold mb-1">CSV Template Format</p>
                    <p className="text-xs text-slate-400 font-mono">student_identifier, score</p>
                    <a
                      href="data:text/csv;charset=utf-8,student_identifier,score%0A180404022,75%0A180404023,60"
                      download="results_template.csv"
                      className="inline-block mt-2 text-xs text-blue-400 hover:text-blue-300 underline">
                      Download Template
                    </a>
                  </div>

                  {/* File Upload */}
                  <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-white/20 rounded-xl p-6 cursor-pointer hover:border-violet-400/50 transition-colors">
                    <FileUp className="w-8 h-8 text-slate-500" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-300">{csvFile ? csvFile.name : "Upload CSV File"}</p>
                      <p className="text-xs text-slate-500 mt-1">Click to browse or drag & drop</p>
                    </div>
                    <input type="file" accept=".csv" className="hidden" onChange={e => e.target.files?.[0] && handleCsvUpload(e.target.files[0])} />
                  </label>

                  {bulkErrors.length > 0 && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 space-y-1">
                      <p className="text-xs font-semibold text-red-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> CSV Errors</p>
                      {bulkErrors.slice(0, 5).map((e, i) => <p key={i} className="text-xs text-red-300">{e}</p>)}
                    </div>
                  )}

                  {skippedRows.length > 0 && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 space-y-1">
                      <p className="text-xs font-semibold text-yellow-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Skipped Rows (Identifier Not Found)</p>
                      <div className="max-h-24 overflow-y-auto">
                        {skippedRows.map((e, i) => <p key={i} className="text-xs text-yellow-300">{e}</p>)}
                      </div>
                    </div>
                  )}

                  {csvData.length > 0 && bulkErrors.length === 0 && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                      <p className="text-xs text-emerald-300">{csvData.length} rows ready for upload</p>
                    </div>
                  )}

                  <button onClick={handleBulkUpload} disabled={uploadingBulk || !csvData.length || bulkErrors.length > 0 || !bulkCourseId}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                    {uploadingBulk ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    Upload CSV Results
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right: Results Preview */}
        <div className={`${!isPublished ? "xl:col-span-2" : "xl:col-span-3"} space-y-4`}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-white">Results in this Batch</h2>
            {resultsInBatch.length > 0 && (
              <span className="px-3 py-1 rounded-full bg-white/10 text-xs text-slate-300 font-medium">
                {studentMap.size} students · {resultsInBatch.length} entries
              </span>
            )}
          </div>

          {resultsInBatch.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-16 text-center">
              <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No results added to this batch yet</p>
              <p className="text-sm text-slate-500 mt-1">Use the {isPublished ? "" : "panel on the left"} to add results</p>
            </div>
          ) : (
            Array.from(studentMap.values()).map(({ student, results }) => {
              const credits = results.reduce((a, r) => a + r.creditLoad, 0);
              const points = results.reduce((a, r) => a + Number(r.gradePoint) * r.creditLoad, 0);
              const gpa = credits > 0 ? (points / credits).toFixed(2) : "N/A";
              return (
                <div key={student.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-violet-500/20 transition-colors">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/5">
                    <div>
                      <p className="font-semibold text-white">{student.user?.name}</p>
                      <p className="text-sm text-slate-400">{student.matricNumber || student.admissionNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-violet-300">{gpa}</p>
                      <p className="text-xs text-slate-400">Semester GPA</p>
                    </div>
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr className="text-xs text-slate-500 uppercase tracking-wide">
                        <th className="px-5 py-2 text-left">Course</th>
                        <th className="px-5 py-2 text-center">Score</th>
                        <th className="px-5 py-2 text-center">Grade</th>
                        <th className="px-5 py-2 text-center">GP</th>
                        <th className="px-5 py-2 text-center">CU</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r: any) => (
                        <tr key={r.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-5 py-3 text-sm">
                            <span className="font-mono text-violet-300 mr-2">{r.course?.code}</span>
                            <span className="text-slate-300">{r.course?.name}</span>
                          </td>
                          <td className="px-5 py-3 text-center text-sm text-white">{r.score}</td>
                          <td className="px-5 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${r.grade === "A" ? "bg-emerald-500/20 text-emerald-300" : r.grade === "B" ? "bg-blue-500/20 text-blue-300" : r.grade === "C" ? "bg-yellow-500/20 text-yellow-300" : r.grade === "D" ? "bg-orange-500/20 text-orange-300" : "bg-red-500/20 text-red-300"}`}>
                              {r.grade}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-center text-sm text-slate-300">{Number(r.gradePoint).toFixed(1)}</td>
                          <td className="px-5 py-3 text-center text-sm text-slate-300">{r.creditLoad}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* New Course Modal */}
      {showNewCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1e293b] border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-5">Add New Course</h2>
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Course Name</label>
                <input required value={newCourse.name} onChange={e => setNewCourse(c => ({ ...c, name: e.target.value }))}
                  placeholder="e.g., Introduction to Programming"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-400" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Course Code</label>
                <input required value={newCourse.code} onChange={e => setNewCourse(c => ({ ...c, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g., CSC101"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-400" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Credit Units</label>
                <input required type="number" min={1} value={newCourse.creditUnits} onChange={e => setNewCourse(c => ({ ...c, creditUnits: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-400" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowNewCourse(false)}
                  className="flex-1 py-2.5 rounded-lg border border-white/20 text-slate-300 text-sm hover:bg-white/5 transition-colors">Cancel</button>
                <button type="submit" disabled={savingCourse}
                  className="flex-1 py-2.5 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2">
                  {savingCourse ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
