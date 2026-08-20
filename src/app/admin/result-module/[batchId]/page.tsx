"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Papa from "papaparse";
import {
  getBatchDetails,
  addSingleStudentResult,
  addBulkResultsViaIdentifier,
  addMultiCourseBulkResults,
  approveAndPublishBatch,
  searchStudents,
  getCoursesList,
  createCourseOnTheFly,
  createStudent,
  getProgrammesList,
  getDepartmentsList,
  bulkImportStudents,
  updateStudentResult,
  deleteStudentResult,
  clearBatchResults,
  deleteResultBatch,
} from "@/actions/result-module";
import {
  ArrowLeft, Upload, UserPlus, CheckCircle2, Loader2, Search,
  Plus, FileUp, Trash2, AlertTriangle, BookOpen, X, Eye, ChevronDown, Edit3,
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
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploadingBulk, setUploadingBulk] = useState(false);
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);
  const [skippedRows, setSkippedRows] = useState<string[]>([]);
  const [autoCreateCourses, setAutoCreateCourses] = useState(true);

  // Add student modal
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudent, setNewStudent] = useState({ firstName: "", lastName: "", email: "", matricNumber: "", programmeId: "", deptId: "" });
  const [savingStudent, setSavingStudent] = useState(false);
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  // Student CSV import
  const [showStudentImport, setShowStudentImport] = useState(false);
  const [studentCsvData, setStudentCsvData] = useState<any[]>([]);
  const [studentCsvFile, setStudentCsvFile] = useState<File | null>(null);
  const [importingStudents, setImportingStudents] = useState(false);
  const [studentImportResult, setStudentImportResult] = useState<any>(null);

  // Edit Result record state
  const [editingResult, setEditingResult] = useState<{ id: number; studentName: string; courseCode: string; courseName: string; score: string; creditLoad: string } | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Clear / Delete Batch action states
  const [clearingBatch, setClearingBatch] = useState(false);
  const [deletingBatch, setDeletingBatch] = useState(false);

  async function handleUpdateResultSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingResult) return;
    setSavingEdit(true);
    const res = await updateStudentResult(editingResult.id, {
      score: Number(editingResult.score),
      creditLoad: Number(editingResult.creditLoad),
    });
    setSavingEdit(false);
    if (res.success) {
      setEditingResult(null);
      fetchBatch();
    } else {
      alert("Error: " + res.error);
    }
  }

  async function handleDeleteSingleResult(resultId: number, courseCode: string, studentName: string) {
    if (!confirm(`Are you sure you want to delete result record for ${courseCode} (${studentName})?`)) return;
    const res = await deleteStudentResult(resultId);
    if (res.success) {
      fetchBatch();
    } else {
      alert("Error: " + res.error);
    }
  }

  async function handleClearAllResults() {
    if (!confirm(`Are you sure you want to delete ALL sample / uploaded result records in this batch (${resultsInBatch.length} entries)? This action cannot be undone.`)) return;
    setClearingBatch(true);
    const res = await clearBatchResults(batchId);
    setClearingBatch(false);
    if (res.success) {
      fetchBatch();
      alert("✓ All result entries cleared successfully!");
    } else {
      alert("Error: " + res.error);
    }
  }

  async function handleDeleteBatch() {
    if (!confirm("Are you sure you want to delete this ENTIRE batch and all its result records? This action cannot be undone.")) return;
    setDeletingBatch(true);
    const res = await deleteResultBatch(batchId);
    setDeletingBatch(false);
    if (res.success) {
      router.push("/admin/result-module");
    } else {
      alert("Error: " + res.error);
    }
  }

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

  // Track the column headers that are course codes
  const [csvCourseColumns, setCsvCourseColumns] = useState<string[]>([]);

  function handleCsvUpload(file: File) {
    setCsvFile(file);
    setBulkErrors([]);
    setSkippedRows([]);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const meta = res.meta as any;
        const headers = (meta.fields || []) as string[];
        const errors: string[] = [];
        const rows = res.data as any[];

        // First header must be matric_number
        if (!headers.length || headers[0] !== "matric_number") {
          errors.push("First column must be 'matric_number'");
          setCsvCourseColumns([]);
          setCsvData([]);
          setBulkErrors(errors);
          return;
        }

        const courseColumns = headers.slice(1).filter(Boolean);
        if (courseColumns.length === 0) {
          errors.push("No course code columns found (add columns after 'matric_number')");
        }

        // Validate each row
        rows.forEach((r, i) => {
          if (!r.matric_number) {
            errors.push(`Row ${i + 2}: missing matric_number`);
          } else {
            for (const cc of courseColumns) {
              const val = r[cc];
              if (val !== undefined && val !== null && val !== "" && isNaN(Number(val))) {
                errors.push(`Row ${i + 2}: '${cc}' has non-numeric value '${val}'`);
              }
            }
          }
        });

        setCsvCourseColumns(courseColumns);
        setCsvData(rows);
        setBulkErrors(errors);
      },
    });
  }

  async function handleBulkUpload() {
    if (bulkErrors.length > 0) return alert("Fix CSV format errors before uploading.");
    if (!csvData.length) return alert("No data to upload.");

    setUploadingBulk(true);
    setSkippedRows([]);

    // Transform pivot format into row-per-result
    const rows: { identifier: string; courseCode: string; score: number }[] = [];
    csvData.forEach(r => {
      for (const cc of csvCourseColumns) {
        const val = r[cc];
        if (val !== undefined && val !== null && val !== "") {
          rows.push({
            identifier: r.matric_number,
            courseCode: cc,
            score: Number(val),
          });
        }
      }
    });

    if (!rows.length) {
      setUploadingBulk(false);
      return alert("No valid score data found in the CSV.");
    }

    const res = await addMultiCourseBulkResults(
      batchId,
      rows,
      batch?.gradingScale?.rules || "[]",
      autoCreateCourses
    );

    setUploadingBulk(false);

    if (res.success) {
      setCsvData([]);
      setCsvCourseColumns([]);
      setCsvFile(null);
      fetchBatch();
      let msg = `✓ Uploaded ${res.count} results successfully (${csvData.length} students, ${csvCourseColumns.length} courses)`;
      if (res.createdCourses?.length) {
        msg += `\nCreated ${res.createdCourses.length} new course(s): ${res.createdCourses.map((c: any) => c.code).join(", ")}`;
      }
      if (res.errors && res.errors.length > 0) {
        setSkippedRows(res.errors);
        alert(msg + `\n\n${res.errors.length} row(s) were skipped.`);
      } else {
        alert(msg);
      }
    } else {
      alert("Error: " + res.error);
    }
  }

  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault();
    setSavingStudent(true);
    const res = await createStudent({
      firstName: newStudent.firstName,
      lastName: newStudent.lastName,
      email: newStudent.email,
      matricNumber: newStudent.matricNumber,
      programmeId: Number(newStudent.programmeId),
      deptId: Number(newStudent.deptId),
    });
    setSavingStudent(false);
    if (res.success) {
      setShowAddStudent(false);
      setNewStudent({ firstName: "", lastName: "", email: "", matricNumber: "", programmeId: "", deptId: "" });
      alert(`✓ Student created successfully`);
      fetchBatch();
    } else {
      alert(res.error);
    }
  }

  function handleStudentCsvUpload(file: File) {
    setStudentCsvFile(file);
    setStudentImportResult(null);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        setStudentCsvData(res.data as any[]);
      },
    });
  }

  async function handleImportStudents() {
    if (!studentCsvData.length) return;
    setImportingStudents(true);
    const rows = studentCsvData.map(r => ({
      firstName: r.first_name || "",
      lastName: r.last_name || r.surname || "",
      email: r.email || "",
      matricNumber: r.matric_number || "",
      programmeId: Number(r.programme_id) || 0,
      deptId: Number(r.dept_id) || 0,
    }));
    const res = await bulkImportStudents(rows);
    setImportingStudents(false);
    setStudentImportResult(res);
    if (res.success) {
      setStudentCsvData([]);
      setStudentCsvFile(null);
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

  async function loadProgrammesAndDepts() {
    const [pRes, dRes] = await Promise.all([getProgrammesList(), getDepartmentsList()]);
    if (pRes.success) setProgrammes(pRes.data || []);
    if (dRes.success) setDepartments(dRes.data || []);
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
            {resultsInBatch.length > 0 && (
              <button onClick={handleClearAllResults} disabled={clearingBatch}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 font-semibold text-sm transition-all disabled:opacity-60">
                {clearingBatch ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Clear All Results
              </button>
            )}
            <button onClick={handleDeleteBatch} disabled={deletingBatch}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 font-semibold text-sm transition-all disabled:opacity-60">
              {deletingBatch ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete Batch
            </button>
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
                          <CourseSearchableSelect
                            courses={courses}
                            value={entry.courseId}
                            onChange={(courseId, creditLoad) => {
                              setEntries(en => en.map((en2, i) => i === idx ? { ...en2, courseId, creditLoad } : en2));
                            }}
                          />
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
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowNewCourse(true)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-violet-600/20 border border-violet-500/30 text-violet-300 text-xs font-semibold hover:bg-violet-600/30 transition-colors">
                      <Plus className="w-3 h-3" /> New Course
                    </button>
                    <button type="button" onClick={() => { setShowAddStudent(true); loadProgrammesAndDepts(); }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold hover:bg-emerald-600/30 transition-colors">
                      <UserPlus className="w-3 h-3" /> Add Student
                    </button>
                    <button type="button" onClick={() => { setShowStudentImport(true); loadProgrammesAndDepts(); }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs font-semibold hover:bg-blue-600/30 transition-colors">
                      <FileUp className="w-3 h-3" /> Import Students
                    </button>
                  </div>

                  {/* CSV Template Download */}
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                    <p className="text-xs text-blue-300 font-semibold mb-1">CSV Format (Pivot)</p>
                    <p className="text-xs text-slate-400 font-mono">matric_number, COURSE_CODE_1, COURSE_CODE_2, ...</p>
                    <p className="text-xs text-slate-500 mt-1">First column = matric number, subsequent columns = course codes with scores as cell values</p>
                    <a
                      href="data:text/csv;charset=utf-8,matric_number,CSC101,MTH101,GST101%0A180404022,75,82,68%0A180404023,60,71,74%0A180404024,88,,70"
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

                  {/* Preview Table */}
                  {csvData.length > 0 && bulkErrors.length === 0 && (
                    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                      <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wide">
                          Preview ({csvData.length} students, {csvCourseColumns.length} courses)
                        </span>
                      </div>
                      <div className="max-h-52 overflow-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-slate-500 border-b border-white/5">
                              <th className="px-3 py-1.5 text-left sticky top-0 bg-[#0f172a] z-10">Matric</th>
                              {csvCourseColumns.map(cc => (
                                <th key={cc} className="px-3 py-1.5 text-center font-mono sticky top-0 bg-[#0f172a] z-10">{cc}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {csvData.slice(0, 15).map((r, i) => (
                              <tr key={i} className="border-b border-white/5 last:border-0">
                                <td className="px-3 py-1.5 text-white font-medium whitespace-nowrap">{r.matric_number}</td>
                                {csvCourseColumns.map(cc => {
                                  const val = r[cc];
                                  const hasVal = val !== undefined && val !== null && val !== "";
                                  return (
                                    <td key={cc} className={`px-3 py-1.5 text-center ${hasVal ? "text-white" : "text-slate-600"}`}>
                                      {hasVal ? val : "—"}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {csvData.length > 15 && (
                          <div className="px-3 py-1.5 text-center text-xs text-slate-500 border-t border-white/5">
                            ... and {csvData.length - 15} more student(s)
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Auto-create toggle */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={autoCreateCourses} onChange={e => setAutoCreateCourses(e.target.checked)}
                      className="rounded bg-white/10 border-white/20 accent-violet-500" />
                    <span className="text-xs text-slate-300">Auto-create missing courses (default: 3 credit units)</span>
                  </label>

                  {bulkErrors.length > 0 && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 space-y-1">
                      <p className="text-xs font-semibold text-red-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> CSV Errors</p>
                      {bulkErrors.slice(0, 5).map((e, i) => <p key={i} className="text-xs text-red-300">{e}</p>)}
                    </div>
                  )}

                  {skippedRows.length > 0 && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 space-y-1">
                      <p className="text-xs font-semibold text-yellow-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Skipped Rows</p>
                      <div className="max-h-24 overflow-y-auto">
                        {skippedRows.map((e, i) => <p key={i} className="text-xs text-yellow-300">{e}</p>)}
                      </div>
                    </div>
                  )}

                  <button onClick={handleBulkUpload} disabled={uploadingBulk || !csvData.length || bulkErrors.length > 0}
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
                        <th className="px-5 py-2 text-center">Actions</th>
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
                          <td className="px-5 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingResult({
                                  id: r.id,
                                  studentName: student.user?.name || "Student",
                                  courseCode: r.course?.code || "COURSE",
                                  courseName: r.course?.name || "",
                                  score: String(r.score),
                                  creditLoad: String(r.creditLoad)
                                })}
                                className="p-1.5 rounded-lg bg-violet-500/20 hover:bg-violet-500/40 text-violet-300 transition-colors"
                                title="Edit Record"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSingleResult(r.id, r.course?.code || "Course", student.user?.name || "Student")}
                                className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-300 transition-colors"
                                title="Delete Record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
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

      {/* Add Student Modal */}
      {showAddStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1e293b] border border-white/10 rounded-2xl p-8 w-full max-w-lg shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-5">Add New Student</h2>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">First Name</label>
                  <input required value={newStudent.firstName} onChange={e => setNewStudent(s => ({ ...s, firstName: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-400" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Last Name</label>
                  <input required value={newStudent.lastName} onChange={e => setNewStudent(s => ({ ...s, lastName: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Email (optional)</label>
                <input type="email" value={newStudent.email} onChange={e => setNewStudent(s => ({ ...s, email: e.target.value }))}
                  placeholder="auto-generated if empty"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-400" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Matric Number</label>
                <input required value={newStudent.matricNumber} onChange={e => setNewStudent(s => ({ ...s, matricNumber: e.target.value.toUpperCase() }))}
                  placeholder="e.g., 180404022"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Programme</label>
                  <select required value={newStudent.programmeId} onChange={e => setNewStudent(s => ({ ...s, programmeId: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-400">
                    <option value="" className="bg-slate-800">Select...</option>
                    {programmes.map(p => (
                      <option key={p.id} value={p.id} className="bg-slate-800">{p.name} ({p.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Department</label>
                  <select required value={newStudent.deptId} onChange={e => setNewStudent(s => ({ ...s, deptId: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-400">
                    <option value="" className="bg-slate-800">Select...</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id} className="bg-slate-800">{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddStudent(false)}
                  className="flex-1 py-2.5 rounded-lg border border-white/20 text-slate-300 text-sm hover:bg-white/5 transition-colors">Cancel</button>
                <button type="submit" disabled={savingStudent}
                  className="flex-1 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2">
                  {savingStudent ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Add Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Students Modal */}
      {showStudentImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1e293b] border border-white/10 rounded-2xl p-8 w-full max-w-lg shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-1">Import Students (CSV)</h2>
            <p className="text-sm text-slate-400 mb-4">CSV format: <span className="font-mono text-xs">first_name, last_name, matric_number, email, programme_id, dept_id</span></p>

            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-white/20 rounded-xl p-4 cursor-pointer hover:border-violet-400/50 transition-colors mb-4">
              <FileUp className="w-6 h-6 text-slate-500" />
              <p className="text-sm text-slate-300">{studentCsvFile ? studentCsvFile.name : "Upload Student CSV"}</p>
              <input type="file" accept=".csv" className="hidden" onChange={e => e.target.files?.[0] && handleStudentCsvUpload(e.target.files[0])} />
            </label>

            {studentImportResult && (
              <div className={`rounded-xl p-3 text-xs space-y-1 mb-3 ${studentImportResult.success ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-red-500/10 border border-red-500/20"}`}>
                <p className={`font-semibold ${studentImportResult.success ? "text-emerald-300" : "text-red-300"}`}>
                  Created {studentImportResult.created} student(s)
                </p>
                {studentImportResult.errors?.length > 0 && (
                  <div className="max-h-24 overflow-y-auto">
                    {studentImportResult.errors.slice(0, 5).map((err: any, i: number) => (
                      <p key={i} className="text-yellow-300">Row {err.row}: {err.error}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button type="button" onClick={() => { setShowStudentImport(false); setStudentImportResult(null); setStudentCsvData([]); setStudentCsvFile(null); }}
                className="flex-1 py-2.5 rounded-lg border border-white/20 text-slate-300 text-sm hover:bg-white/5 transition-colors">Close</button>
              <button onClick={handleImportStudents} disabled={importingStudents || !studentCsvData.length}
                className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
                {importingStudents ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Import
              </button>
            </div>
          </div>
        </div>
      )}

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
      {/* Edit Result Record Modal */}
      {editingResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1e293b] border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-white">Modify Result Record</h2>
                <p className="text-xs text-slate-400 mt-0.5">{editingResult.studentName} &bull; <span className="font-mono text-violet-300">{editingResult.courseCode}</span></p>
              </div>
              <button type="button" onClick={() => setEditingResult(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateResultSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Score (0 - 100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  required
                  value={editingResult.score}
                  onChange={e => setEditingResult(prev => prev ? { ...prev, score: e.target.value } : null)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Credit Load / Units</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  required
                  value={editingResult.creditLoad}
                  onChange={e => setEditingResult(prev => prev ? { ...prev, creditLoad: e.target.value } : null)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-400"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingResult(null)}
                  className="flex-1 py-2.5 rounded-lg border border-white/20 text-slate-300 text-sm hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function DarkSelect({ value, onChange, options, placeholder }: {
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
  );
}

function CourseSearchableSelect({ courses, value, onChange }: {
  courses: { id: number; code: string; name: string; creditUnits?: number | null }[];
  value: string;
  onChange: (courseId: string, creditLoad: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const selected = courses.find(c => c.id === Number(value));
  const filtered = courses.filter(c =>
    !search.trim() || c.code?.toLowerCase().includes(search.toLowerCase()) ||
    c.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="col-span-6 relative">
      <div className="flex items-center bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 text-xs focus-within:border-violet-400 transition-colors">
        <Search className="w-3 h-3 text-slate-400 shrink-0 mr-1" />
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={selected ? `${selected.code} — ${selected.name}` : "Search course..."}
          className="bg-transparent border-none outline-none text-white w-full text-xs placeholder:text-slate-500"
        />
        {value && (
          <button type="button" onClick={() => { onChange("", ""); setSearch(""); }} className="text-slate-400 hover:text-white ml-1">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
      {open && search.trim() && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-slate-800 border border-white/20 rounded-lg max-h-40 overflow-y-auto shadow-xl">
            {filtered.length === 0 ? (
              <div className="p-3 text-xs text-slate-400 text-center">No courses found</div>
            ) : (
              filtered.map(c => (
                <button key={c.id} type="button" onClick={() => {
                  onChange(String(c.id), c.creditUnits?.toString() || "");
                  setSearch(c.code);
                  setOpen(false);
                }}
                  className="w-full text-left px-3 py-2 text-xs text-white hover:bg-white/10 transition-colors border-b border-white/5 last:border-0">
                  <span className="font-mono text-violet-300 mr-2">{c.code}</span>
                  {c.name}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
