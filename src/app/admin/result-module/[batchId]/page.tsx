"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Papa from "papaparse";
import {
  getBatchDetails,
  addSingleStudentResult,
  addBulkResultsViaIdentifier,
  addMultiCourseBulkResults,
  previewBulkImport,
  approveAndPublishBatch,
  searchStudents,
  getCoursesList,
  createCourseOnTheFly,
  createStudent,
  getProgrammesList,
  getDepartmentsList,
  getFacultiesList,
  getResultTemplateStudents,
  bulkImportStudents,
  updateStudentResult,
  deleteStudentResult,
  clearBatchResults,
  clearBatchResultsByCourse,
  deleteResultBatch,
  toggleBatchPublication,
  toggleStudentView,
} from "@/actions/result-module";
import {
  ArrowLeft, Upload, UserPlus, CheckCircle2, Loader2, Search,
  Plus, FileUp, Trash2, AlertTriangle, BookOpen, X, Eye, EyeOff, Lock, ChevronDown, Edit3, Printer,
} from "lucide-react";
import Link from "next/link";
import { ImportPreviewModal } from "@/components/result-module/ImportPreviewModal";

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

  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [score, setScore] = useState("");
  const [isSubmittingSingle, setIsSubmittingSingle] = useState(false);
  const [deletingBatch, setDeletingBatch] = useState(false);
  const [clearingBatch, setClearingBatch] = useState(false);
  const [clearingByCourse, setClearingByCourse] = useState(false);

  async function fetchBatch() {
    try {
      const res = await getBatchDetails(batchId);
      if (res?.success) setBatch(res.data);
      else router.push("/admin/result-module");
    } catch {
      router.push("/admin/result-module");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchBatch(); }, [batchId]);

  useEffect(() => {
    async function loadCourses() {
      const res = await getCoursesList();
      if (res?.success) setAvailableCourses(res.data || []);
    }
    loadCourses();
  }, []);

  const searchStudentsFn = useCallback(async (q: string) => {
    if (!q.trim()) {
      setStudentResults([]);
      return;
    }
    const res = await searchStudents(q);
    setStudentResults(res.data || []);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchStudentsFn(studentQuery), 400);
    return () => clearTimeout(t);
  }, [studentQuery, searchStudentsFn]);

  async function handleSingleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStudent || !selectedCourseId || !score) return;

    setIsSubmittingSingle(true);
    const res = await addSingleStudentResult(batchId, selectedStudent.id, Number(selectedCourseId), score);
    setIsSubmittingSingle(false);

    if (res.success) {
      alert("✓ Result added successfully!");
      setScore("");
      setSelectedCourseId("");
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

  async function handleClearResultsByCourse() {
    if (resultsInBatch.length === 0) return;
    const coursesInBatch = Array.from(new Set(resultsInBatch.map((r: any) => JSON.stringify({ id: r.courseId, code: r.course?.code }))));
    if (coursesInBatch.length === 0) return;
    
    const parsedCourses = coursesInBatch.map((c: any) => JSON.parse(c));
    const courseCodeStr = parsedCourses.map((c: any) => `${c.code} (ID: ${c.id})`).join("\n");
    const input = prompt(`Enter the Course ID you want to delete for ALL students in this batch.\n\nAvailable courses in batch:\n${courseCodeStr}`);
    
    if (!input || isNaN(Number(input))) return;
    
    const courseIdToClear = Number(input);
    if (!confirm(`Are you sure you want to delete ALL results for Course ID: ${courseIdToClear} in this batch? This action cannot be undone.`)) return;
    
    setClearingByCourse(true);
    const res = await clearBatchResultsByCourse(batchId, courseIdToClear);
    setClearingByCourse(false);
    if (res.success) {
      fetchBatch();
      alert(`✓ All results for Course ID: ${courseIdToClear} cleared successfully!`);
    } else {
      alert("Error: " + res.error);
    }
  }

  const [togglingPublication, setTogglingPublication] = useState(false);
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

  // Result template download modal
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateScope, setTemplateScope] = useState<"all" | "faculty" | "department" | "programme">("all");
  const [templateFacultyId, setTemplateFacultyId] = useState("");
  const [templateDeptId, setTemplateDeptId] = useState("");
  const [templateProgrammeId, setTemplateProgrammeId] = useState("");
  const [templateFaculties, setTemplateFaculties] = useState<any[]>([]);
  const [templateDepartments, setTemplateDepartments] = useState<any[]>([]);
  const [templateProgrammes, setTemplateProgrammes] = useState<any[]>([]);
  const [templateCount, setTemplateCount] = useState<number | null>(null);
  const [templateTruncated, setTemplateTruncated] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateDownloading, setTemplateDownloading] = useState(false);
  const [templateIncludeName, setTemplateIncludeName] = useState(true);
  const [templateCourseCodes, setTemplateCourseCodes] = useState<string[]>([]);
  const [templateCoursePick, setTemplateCoursePick] = useState("");
  const [templateCourseSearch, setTemplateCourseSearch] = useState("");
  const [templateCourseOpen, setTemplateCourseOpen] = useState(false);
  const [templateLevel, setTemplateLevel] = useState<string>("");

  // Edit Result record state
  const [editingResult, setEditingResult] = useState<{ id: number; studentName: string; courseCode: string; courseName: string; score: string; creditLoad: string } | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Clear / Delete Batch action states
  const [clearingBatch, setClearingBatch] = useState(false);
  const [deletingBatch, setDeletingBatch] = useState(false);

  // Smart import preview state
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewRows, setPreviewRows] = useState<{ identifier: string; courseCode: string; score: number }[]>([]);

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

  const [togglingPublication, setTogglingPublication] = useState(false);
  const [togglingStudentView, setTogglingStudentView] = useState(false);

  async function handleTogglePublication(targetState: boolean) {
    if (targetState && resultsInBatch.length === 0) {
      return alert("Cannot display empty batch to students. Please add student results first.");
    }
    const confirmMsg = targetState
      ? "Finalize and display results to student dashboard? Students will be able to see their GP/CGPA and grades."
      : "Hide results from student dashboard? Results will be switched off and hidden from student view.";
    if (!confirm(confirmMsg)) return;

    setTogglingPublication(true);
    const res = await toggleBatchPublication(batchId, targetState);
    setTogglingPublication(false);

    if (res.success) {
      fetchBatch();
    } else {
      alert("Error: " + res.error);
    }
  }

  async function handleToggleStudentView(targetState: boolean) {
    if (targetState && !isPublished) {
      return alert("Please publish the batch first before enabling student view.");
    }
    const confirmMsg = targetState
      ? "Allow students to view these results on their dashboard?"
      : "Hide these results from student dashboard?";
    if (!confirm(confirmMsg)) return;

    setTogglingStudentView(true);
    const res = await toggleStudentView(batchId, targetState);
    setTogglingStudentView(false);

    if (res.success) {
      fetchBatch();
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
      // Strip BOM, surrounding quotes, and extra whitespace Google Sheets may add
      transformHeader: (h) => (h ?? "").replace(/^\uFEFF/, "").replace(/^["']|["']$/g, "").trim(),
      complete: (res) => {
        const meta = res.meta as any;
        const headers = (meta.fields || []) as string[];
        const errors: string[] = [];
        const rawRows = res.data as any[];

        // Locate the student identifier column by alias (BOM/whitespace/quotes already stripped)
        const ID_ALIASES = new Set([
          "matric_number", "matric no", "matric_no", "matricnumber", "matric no.",
          "matric", "mat number", "mat_number", "admission_number", "admission no",
          "admissionno", "student_number", "student no", "matric number",
          "matriculation number", "matriculation no", "matric.no", "mat.no",
          "reg number", "reg_number", "regno", "reg no",
        ]);
        const idHeader = headers.find(h => ID_ALIASES.has(h.toLowerCase()));

        if (!idHeader) {
          errors.push("Could not find a student ID column. Expected the first column to be named 'matric_number'.");
          setCsvCourseColumns([]);
          setCsvData([]);
          setBulkErrors(errors);
          return;
        }

        // Normalize rows so the identifier is always exposed as 'matric_number'
        const rows = rawRows.map(r => {
          const cleaned: any = {};
          for (const h of headers) {
            if (h === idHeader) cleaned["matric_number"] = r[idHeader];
            else if (h) cleaned[h] = r[h];
          }
          return cleaned;
        });

        const NON_COURSE_COLUMNS = new Set([
          "name", "student_name", "student name", "full_name", "full name",
          "surname", "last name", "first name", "programme", "programme name",
          "program", "s/n", "sn", "serial", "serial no", "no",
        ]);
        const courseColumns = headers.filter(h => h && h !== idHeader && !NON_COURSE_COLUMNS.has(h.toLowerCase()));
        if (courseColumns.length === 0) {
          errors.push("No course code columns found (add course columns after 'matric_number')");
        }

        // Validate each row
        rows.forEach((r, i) => {
          if (!r.matric_number || String(r.matric_number).trim() === "") {
            errors.push(`Row ${i + 2}: missing matric_number`);
          } else {
            for (const cc of courseColumns) {
              const val = r[cc];
              if (val !== undefined && val !== null && String(val).trim() !== "" && isNaN(Number(val))) {
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

  const templateFilters = useCallback(() => {
    const f: any = {};
    if (templateScope === "faculty" && templateFacultyId) f.facultyId = Number(templateFacultyId);
    else if (templateScope === "department" && templateDeptId) f.departmentId = Number(templateDeptId);
    else if (templateScope === "programme" && templateProgrammeId) f.programmeId = Number(templateProgrammeId);
    if (templateLevel) f.level = templateLevel;
    return f;
  }, [templateScope, templateFacultyId, templateDeptId, templateProgrammeId, templateLevel]);

  useEffect(() => {
    if (!showTemplateModal) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      setTemplateLoading(true);
      const res = await getResultTemplateStudents(templateFilters());
      if (cancelled) return;
      setTemplateCount(res.total ?? null);
      setTemplateTruncated(res.truncated ?? false);
      setTemplateLoading(false);
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [showTemplateModal, templateFilters]);

  function openTemplateModal() {
    setShowTemplateModal(true);
    setTemplateCount(null);
    setTemplateTruncated(false);
    Promise.all([getFacultiesList(), getDepartmentsList(), getProgrammesList()]).then(([f, d, p]) => {
      setTemplateFaculties(f.data || []);
      setTemplateDepartments(d.data || []);
      setTemplateProgrammes(p.data || []);
    });
  }

  function closeTemplateModal() {
    setShowTemplateModal(false);
    setTemplateCourseCodes([]);
    setTemplateCoursePick("");
    setTemplateCourseSearch("");
    setTemplateCourseOpen(false);
    setTemplateScope("all");
    setTemplateFacultyId("");
    setTemplateDeptId("");
    setTemplateProgrammeId("");
    setTemplateLevel("");
    setTemplateCount(null);
  }

  async function handleDownloadTemplate() {
    setTemplateDownloading(true);
    const res = await getResultTemplateStudents(templateFilters());
    setTemplateDownloading(false);
    if (!res.success) return alert("Error: " + res.error);
    const studentRows = (res.data || []) as any[];
    if (!studentRows.length) return alert("No students found for the selected scope.");

    const headers = ["matric_number"];
    if (templateIncludeName) headers.push("name");
    if (templateCourseCodes.length > 0) headers.push(...templateCourseCodes);

    const csv = Papa.unparse({
      fields: headers,
      data: studentRows.map(s => {
        const r: any = { matric_number: s.matricNumber };
        if (templateIncludeName) r.name = s.name;
        for (const cc of templateCourseCodes) r[cc] = "";
        return r;
      }),
    });

    // Prepend BOM so Excel / Google Sheets opens the file with correct UTF-8 encoding
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "results_template.csv";
    a.click();
    URL.revokeObjectURL(url);
    setShowTemplateModal(false);
  }

  async function handleBulkUpload(mode: 'all' | 'valid_only' | 'skip_duplicates' = 'all') {
    if (bulkErrors.length > 0) return alert("Fix CSV format errors before uploading.");
    if (!csvData.length) return alert("No data to upload.");

    setUploadingBulk(true);
    setSkippedRows([]);
    setShowPreview(false);

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

    // Filter rows based on mode
    let filteredRows = rows;
    if (mode === 'valid_only' && previewData?.preview) {
      const validIds = new Set(
        previewData.preview
          .filter((r: any) => r.status === 'ready')
          .map((r: any) => `${r.rowIndex}:${r.courseCode}`)
      );
      filteredRows = rows.filter((r, i) => validIds.has(`${i + 2}:${r.courseCode}`));
    } else if (mode === 'skip_duplicates' && previewData?.anomalies) {
      // For now, just import all (duplicate filtering happens server-side)
      filteredRows = rows;
    }

    if (!filteredRows.length) {
      setUploadingBulk(false);
      return alert("No valid score data found in the CSV.");
    }

    const res = await addMultiCourseBulkResults(
      batchId,
      filteredRows,
      batch?.gradingScale?.rules || "[]",
      autoCreateCourses
    );

    setUploadingBulk(false);

    if (res.success) {
      setCsvData([]);
      setCsvCourseColumns([]);
      setCsvFile(null);
      fetchBatch();
      let msg = `✓ Uploaded ${res.count} results successfully (${filteredRows.length} scores)`;
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

  async function handlePreviewImport() {
    if (!csvData.length || !csvCourseColumns.length) return;

    setPreviewLoading(true);
    setShowPreview(true);

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

    setPreviewRows(rows);

    const res = await previewBulkImport(batchId, rows);
    setPreviewData(res);
    setPreviewLoading(false);
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
      transformHeader: (h) => (h ?? "").replace(/^\uFEFF/, "").trim(),
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
  const isStudentViewable = batch?.isStudentViewable || false;

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
              <>
                <button onClick={handleClearResultsByCourse} disabled={clearingByCourse}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-300 font-semibold text-xs transition-all disabled:opacity-60">
                  {clearingByCourse ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Clear by Course
                </button>
                <button onClick={handleClearAllResults} disabled={clearingBatch}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 font-semibold text-xs transition-all disabled:opacity-60">
                  {clearingBatch ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Clear All Results
                </button>
              </>
            )}
            <button onClick={handleDeleteBatch} disabled={deletingBatch}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 font-semibold text-xs transition-all disabled:opacity-60">
              {deletingBatch ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Delete Batch
            </button>

            {/* Display to Student Portal Toggle Switch */}
            <div className="flex items-center gap-3 pl-3 border-l border-white/10">
              <Link href={`/admin/result-module/print?batchId=${batchId}`}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-xs transition-all">
                <Printer className="w-3.5 h-3.5" /> Print Transcripts
              </Link>

              {/* Publish Toggle (Admin Print) */}
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-white">Publish (Admin Print)</p>
                <p className={`text-[11px] font-mono ${isPublished ? "text-emerald-400 font-bold" : "text-amber-400"}`}>
                  {isPublished ? "ON" : "OFF"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleTogglePublication(!isPublished)}
                disabled={togglingPublication}
                className={`relative inline-flex h-8 w-16 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none disabled:opacity-50 ${
                  isPublished ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]" : "bg-slate-700 border border-white/20"
                }`}
                title={isPublished ? "Turn off to unpublish" : "Turn on to publish for admin print"}
              >
                <span className="sr-only">Publish for admin print</span>
                <span
                  className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-300 ease-in-out flex items-center justify-center ${
                    isPublished ? "translate-x-8 text-emerald-600" : "translate-x-0 text-slate-500"
                  }`}
                >
                  {togglingPublication ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                  ) : isPublished ? (
                    <Eye className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-slate-500" />
                  )}
                </span>
              </button>

              {/* Student View Toggle */}
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-white">Student Dashboard</p>
                <p className={`text-[11px] font-mono ${isStudentViewable ? "text-blue-400 font-bold" : "text-amber-400"}`}>
                  {isStudentViewable ? "ON (VISIBLE)" : "OFF (HIDDEN)"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleStudentView(!isStudentViewable)}
                disabled={togglingStudentView || !isPublished}
                className={`relative inline-flex h-8 w-16 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none disabled:opacity-50 ${
                  isStudentViewable ? "bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.5)]" : "bg-slate-700 border border-white/20"
                }`}
                title={!isPublished ? "Publish batch first" : isStudentViewable ? "Turn off to hide from students" : "Turn on to show students their results"}
              >
                <span className="sr-only">Display results to student dashboard</span>
                <span
                  className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-300 ease-in-out flex items-center justify-center ${
                    isStudentViewable ? "translate-x-8 text-blue-600" : "translate-x-0 text-slate-500"
                  }`}
                >
                  {togglingStudentView ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                  ) : isStudentViewable ? (
                    <Eye className="w-4 h-4 text-blue-600" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-slate-500" />
                  )}
                </span>
              </button>
            </div>
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
                    <button type="button" onClick={openTemplateModal}
                      className="inline-block mt-2 text-xs text-blue-400 hover:text-blue-300 underline">
                      Download Template
                    </button>
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

                  <button onClick={handlePreviewImport} disabled={uploadingBulk || !csvData.length || bulkErrors.length > 0}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                    {uploadingBulk ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                    Preview & Import CSV Results
                  </button>

                  <ImportPreviewModal
                    open={showPreview}
                    onClose={() => setShowPreview(false)}
                    onConfirm={(mode) => handleBulkUpload(mode)}
                    previewData={previewData}
                    loading={previewLoading}
                  />

                  {/* Template Download Modal */}
                  {showTemplateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={closeTemplateModal}>
                      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                          <div>
                            <h3 className="text-white font-bold flex items-center gap-2"><FileUp className="w-4 h-4 text-blue-400" /> Download Result Template</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Pre-filled with registered students for this scope</p>
                          </div>
                          <button type="button" onClick={closeTemplateModal} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>

                        <div className="p-5 space-y-4">
                          <div className="grid grid-cols-2 gap-2">
                            {(["all", "faculty", "department", "programme"] as const).map(scope => (
                              <button key={scope} type="button"
                                onClick={() => setTemplateScope(scope)}
                                className={`py-2 rounded-lg text-xs font-semibold border transition-colors ${templateScope === scope ? "bg-blue-600/30 border-blue-500/40 text-blue-300" : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20"}`}>
                                {scope === "all" ? "All Students" : scope[0].toUpperCase() + scope.slice(1)}
                              </button>
                            ))}
                          </div>

                          <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Level Filter</label>
                            <select value={templateLevel} onChange={e => setTemplateLevel(e.target.value)}
                              className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-400">
                              <option value="">All Levels</option>
                              <option value="ND1">ND 1</option>
                              <option value="ND2">ND 2</option>
                              <option value="HND1">HND 1</option>
                              <option value="HND2">HND 2</option>
                            </select>
                          </div>

                          {templateScope === "faculty" && (
                            <div>
                              <label className="text-xs font-bold text-slate-500 uppercase">Faculty</label>
                              <select value={templateFacultyId} onChange={e => setTemplateFacultyId(e.target.value)}
                                className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-400">
                                <option value="">Select faculty...</option>
                                {templateFaculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                              </select>
                            </div>
                          )}

                          {templateScope === "department" && (
                            <div>
                              <label className="text-xs font-bold text-slate-500 uppercase">Department</label>
                              <select value={templateDeptId} onChange={e => setTemplateDeptId(e.target.value)}
                                className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-400">
                                <option value="">Select department...</option>
                                {templateDepartments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                              </select>
                            </div>
                          )}

                          {templateScope === "programme" && (
                            <div>
                              <label className="text-xs font-bold text-slate-500 uppercase">Programme</label>
                              <select value={templateProgrammeId} onChange={e => setTemplateProgrammeId(e.target.value)}
                                className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-400">
                                <option value="">Select programme...</option>
                                {templateProgrammes.map(p => <option key={p.id} value={p.id}>{p.name}{p.department?.name ? ` (${p.department.name})` : ""}</option>)}
                              </select>
                            </div>
                          )}

                          <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 flex items-center justify-between">
                            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Students in template</span>
                            <span className="text-sm font-bold text-white">
                              {templateLoading ? <Loader2 className="w-4 h-4 animate-spin text-blue-400" /> : templateCount === null ? "—" : templateCount.toLocaleString()}
                            </span>
                          </div>
                          {templateTruncated && (
                            <p className="text-xs text-amber-400/90 border border-amber-500/20 bg-amber-500/10 rounded-lg px-3 py-2">
                              Large selection — capped at 5,000 rows. Narrow the scope to include everyone.
                            </p>
                          )}

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={templateIncludeName} onChange={e => setTemplateIncludeName(e.target.checked)} className="rounded bg-white/10 border-white/20 accent-blue-500" />
                            <span className="text-xs text-slate-300">Include student name column (ignored on upload)</span>
                          </label>

                          <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Course columns (optional)</label>
                            <div className="relative">
                              <div className="flex items-center bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus-within:border-blue-400 transition-colors">
                                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-2" />
                                <input
                                  type="text"
                                  value={templateCourseSearch}
                                  onChange={e => { setTemplateCourseSearch(e.target.value); setTemplateCourseOpen(true); }}
                                  onFocus={() => setTemplateCourseOpen(true)}
                                  placeholder="Search course code or name..."
                                  className="bg-transparent border-none outline-none text-white w-full text-sm placeholder:text-slate-500"
                                />
                              </div>
                              {templateCourseOpen && templateCourseSearch.trim() && (
                                <>
                                  <div className="fixed inset-0 z-40" onClick={() => setTemplateCourseOpen(false)} />
                                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-slate-800 border border-white/20 rounded-lg max-h-48 overflow-y-auto shadow-xl">
                                    {courses.filter((c: any) => !templateCourseCodes.includes(c.code)).filter((c: any) =>
                                      c.code?.toLowerCase().includes(templateCourseSearch.toLowerCase()) ||
                                      c.name?.toLowerCase().includes(templateCourseSearch.toLowerCase())
                                    ).length === 0 ? (
                                      <div className="p-3 text-xs text-slate-400 text-center">No courses found</div>
                                    ) : (
                                      courses.filter((c: any) => !templateCourseCodes.includes(c.code)).filter((c: any) =>
                                        c.code?.toLowerCase().includes(templateCourseSearch.toLowerCase()) ||
                                        c.name?.toLowerCase().includes(templateCourseSearch.toLowerCase())
                                      ).map((c: any) => (
                                        <button key={c.id} type="button" onClick={() => {
                                          setTemplateCourseCodes([...templateCourseCodes, c.code]);
                                          setTemplateCourseSearch("");
                                          setTemplateCourseOpen(false);
                                        }}
                                          className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors border-b border-white/5 last:border-0">
                                          <span className="font-mono text-blue-300 mr-2">{c.code}</span>
                                          {c.name}
                                        </button>
                                      ))
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                            {templateCourseCodes.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {templateCourseCodes.map(cc => (
                                  <span key={cc} className="inline-flex items-center gap-1 bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs font-mono rounded-full px-2.5 py-1">
                                    {cc}
                                    <button type="button" onClick={() => setTemplateCourseCodes(templateCourseCodes.filter(x => x !== cc))} className="hover:text-white"><X className="w-3 h-3" /></button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <button type="button" onClick={handleDownloadTemplate} disabled={templateLoading || (templateCount !== null && templateCount === 0)}
                            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                            {templateDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
                            Download Template ({templateCount === null ? "…" : templateCount.toLocaleString()} students)
                          </button>
                          <p className="text-[11px] text-slate-500 text-center">Fill course score columns, remove the name column if unused, then upload the CSV above.</p>
                        </div>
                      </div>
                    </div>
                  )}
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
      )}

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
