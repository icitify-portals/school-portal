"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Upload, Download, FileSpreadsheet, CheckCircle2, XCircle,
    AlertTriangle, Loader2, ChevronDown, ChevronUp, Eye, Trash2
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { bulkUploadSubjectScoresV2, type BulkScoreRowV2, type BulkUploadResultV2 } from "@/actions/admin-admission";
import { useRouter } from "next/navigation";

interface PreviewRow {
    rowNumber: number;
    formNumber: string;
    mathScore: number;
    englishScore: number;
    total: number;
    isValid: boolean;
    errors: string[];
}

/**
 * Strict cell extraction: a blank/absent cell is an ERROR, never a silent 0.
 */
function readNumber(raw: Record<string, unknown>, keys: string[]): { value?: number; error?: string } {
    for (const key of keys) {
        const v = raw[key];
        if (v !== undefined && v !== null && String(v).trim() !== "") {
            const n = Number(v);
            return isNaN(n) ? { error: `"${key}" is not a number (got "${v}")` } : { value: n };
        }
    }
    return { error: `Missing value (need one of: ${keys.join(" / ")})` };
}

/**
 * Form Number may be a readable string (e.g. FSS/2026/00123) or a numeric
 * application ID. Either is accepted as long as the cell is not blank.
 */
function readFormNumber(raw: Record<string, unknown>, keys: string[]): { value?: string; error?: string } {
    for (const key of keys) {
        const v = raw[key];
        if (v !== undefined && v !== null && String(v).trim() !== "") {
            return { value: String(v).trim() };
        }
    }
    return { error: `Missing Form Number (need one of: ${keys.join(" / ")})` };
}

function validateRow(rowNumber: number, raw: Record<string, unknown>): PreviewRow {
    const errors: string[] = [];
    const formNumberRes = readFormNumber(raw, ["Form Number", "form_number", "FormNumber", "Form No.", "ID", "id"]);
    const mathRes = readNumber(raw, ["Mathematics", "Maths", "Math", "math_score", "MathScore"]);
    const englishRes = readNumber(raw, ["English Language", "English", "english_score", "EnglishScore"]);

    if (formNumberRes.error) {
        errors.push(formNumberRes.error);
    }
    if (mathRes.error || (mathRes.value !== undefined && (mathRes.value < 0 || mathRes.value > 100))) {
        errors.push(mathRes.error || `Math score must be 0–100 (got ${mathRes.value})`);
    }
    if (englishRes.error || (englishRes.value !== undefined && (englishRes.value < 0 || englishRes.value > 100))) {
        errors.push(englishRes.error || `English score must be 0–100 (got ${englishRes.value})`);
    }

    return {
        rowNumber,
        formNumber: formNumberRes.value || "",
        mathScore: mathRes.value ?? 0,
        englishScore: englishRes.value ?? 0,
        total: (mathRes.value ?? 0) + (englishRes.value ?? 0),
        isValid: errors.length === 0,
        errors,
    };
}

interface BulkScoreUploadProps {
    applicants?: { id: number; formNumber: string | null; name: string; email?: string }[];
}

export default function BulkScoreUpload({ applicants = [] }: BulkScoreUploadProps) {
    const [expanded, setExpanded] = useState(false);
    const [preview, setPreview] = useState<PreviewRow[]>([]);
    const [fileName, setFileName] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [results, setResults] = useState<BulkUploadResultV2[] | null>(null);
    const [summary, setSummary] = useState<{ processed: number; failed: number; offeredCount: number } | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const validRows = preview.filter(r => r.isValid);
    const invalidRows = preview.filter(r => !r.isValid);

    // ── Download template ──────────────────────────────────────────────
    const downloadTemplate = () => {
        const headers = ["Form Number", "Applicant Name", "Mathematics", "English Language"];
        let rows: any[] = [];
        
        if (applicants && applicants.length > 0) {
            rows = applicants.map(a => [a.formNumber || String(a.id), a.name || a.email || '', '', '']);
        } else {
            rows = [
                [101, "Jane Doe", 75, 68],
                [102, "John Smith", 82, 55],
                [103, "Alice Johnson", 90, 78],
            ];
        }

        const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
        ws["!cols"] = [{ wch: 16 }, { wch: 30 }, { wch: 14 }, { wch: 18 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Screening Results");
        XLSX.writeFile(wb, "FSS_Screening_Results_Template.xlsx");
    };

    // ── Parse uploaded file ────────────────────────────────────────────
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFileName(file.name);
        setResults(null);
        setSummary(null);

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = evt.target?.result;
                const wb = XLSX.read(data, { type: "binary" });
                const sheet = wb.Sheets[wb.SheetNames[0]];
                const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet);
                if (rows.length === 0) {
                    setPreview([]);
                    toast.error("No data rows found in the spreadsheet.");
                    return;
                }
                const parsed = rows.map((r, i) => validateRow(i + 2, r)); // +2 = Excel header offset
                setPreview(parsed);
                toast.success(`Parsed ${parsed.length} row${parsed.length !== 1 ? 's' : ''} — ${parsed.filter(r => r.isValid).length} valid`);
            } catch {
                toast.error("Could not read the file. Ensure it is a valid .xlsx/.xls spreadsheet.");
            }
        };
        reader.readAsBinaryString(file);
    };

    // ── Submit valid rows ──────────────────────────────────────────────
    const handleUpload = async () => {
        if (validRows.length === 0) {
            toast.error("No valid rows to upload");
            return;
        }
        setUploading(true);
        const payload: BulkScoreRowV2[] = validRows.map(r => ({
            formNumber: r.formNumber,
            mathScore: r.mathScore,
            englishScore: r.englishScore,
        }));

        const res = await bulkUploadSubjectScoresV2(payload);
        setUploading(false);

        if (res.success) {
            setResults(res.results);
            setSummary({ processed: res.processed, failed: res.failed, offeredCount: res.offeredCount });
            if (res.failed === 0) {
                toast.success(`All ${res.processed} records uploaded — ${res.offeredCount} admission offer${res.offeredCount !== 1 ? 's' : ''} issued`);
            } else {
                toast.warning(`${res.processed} uploaded (${res.offeredCount} offered), ${res.failed} failed`);
            }
            router.refresh();
        } else {
            toast.error(res.error || "Upload failed");
        }
    };

    const reset = () => {
        setPreview([]);
        setFileName(null);
        setResults(null);
        setSummary(null);
        if (fileRef.current) fileRef.current.value = "";
    };

    return (
        <Card className="border border-teal-200/60 shadow-xl bg-white rounded-[2rem] overflow-hidden">
            {/* Header / Toggle */}
            <CardHeader
                className="bg-gradient-to-r from-teal-600 to-cyan-600 p-6 cursor-pointer"
                onClick={() => setExpanded(e => !e)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <FileSpreadsheet className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-white font-black text-lg tracking-tight">Bulk Score Upload</CardTitle>
                            <p className="text-teal-100 text-xs font-bold uppercase tracking-widest mt-0.5">
                                Upload entrance exam results via Excel spreadsheet
                            </p>
                        </div>
                    </div>
                    <div className="text-white opacity-80">
                        {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                </div>
            </CardHeader>

            {expanded && (
                <CardContent className="p-8 space-y-8">

                    {/* Step 1: Download Template */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-xs font-black flex items-center justify-center">1</span>
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">Download Template</h3>
                        </div>
                        <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                            <div className="flex-1 space-y-1">
                                <p className="text-sm font-bold text-slate-700">Prepare your Excel file using the official template</p>
                                <p className="text-xs text-slate-500">
                                    The template has 4 columns: <strong>Form Number</strong>, <strong>Applicant Name</strong>, <strong>Mathematics</strong>, <strong>English Language</strong>.
                                    Each score must be between <strong>0 – 100</strong>; leave no cells blank.
                                    Readable form numbers (and applicant names) are pre-filled for your current active filter —
                                    don&apos;t edit the <strong>Form Number</strong> column. Applicants without a form number use their application ID.
                                    Applicants at or above their exercise&apos;s cut-off are <strong>automatically offered admission</strong> on upload.
                                </p>
                            </div>
                            <Button
                                onClick={downloadTemplate}
                                variant="outline"
                                className="shrink-0 h-10 border-teal-300 text-teal-700 hover:bg-teal-50 font-bold rounded-xl text-xs uppercase tracking-widest"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Template
                            </Button>
                        </div>
                    </div>

                    {/* Step 2: Upload File */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-xs font-black flex items-center justify-center">2</span>
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">Upload Completed Sheet</h3>
                        </div>

                        <label
                            htmlFor="bulk-file"
                            className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-teal-300 rounded-2xl bg-teal-50/40 hover:bg-teal-50 cursor-pointer transition-colors group"
                        >
                            <Upload className="w-8 h-8 text-teal-400 group-hover:text-teal-600 transition-colors mb-2" />
                            <p className="text-sm font-bold text-slate-600">
                                {fileName ? (
                                    <span className="text-teal-700">{fileName}</span>
                                ) : (
                                    <>Click to select your Excel file</>
                                )}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">.xlsx or .xls only</p>
                            <input
                                id="bulk-file"
                                ref={fileRef}
                                type="file"
                                accept=".xlsx,.xls"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </label>
                    </div>

                    {/* Step 3: Preview & Validate */}
                    {preview.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-xs font-black flex items-center justify-center">3</span>
                                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">Review & Upload</h3>
                                </div>
                                <button onClick={reset} className="text-xs text-slate-400 hover:text-rose-500 font-bold flex items-center gap-1 transition-colors">
                                    <Trash2 className="w-3 h-3" /> Clear
                                </button>
                            </div>

                            {/* Summary pills */}
                            <div className="flex gap-3 flex-wrap">
                                <span className="bg-slate-100 text-slate-700 font-bold px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5">
                                    <Eye className="w-3 h-3" /> {preview.length} total rows
                                </span>
                                <span className="bg-emerald-100 text-emerald-700 font-bold px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3 h-3" /> {validRows.length} valid
                                </span>
                                {invalidRows.length > 0 && (
                                    <span className="bg-rose-100 text-rose-700 font-bold px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5">
                                        <XCircle className="w-3 h-3" /> {invalidRows.length} errors
                                    </span>
                                )}
                            </div>

                            {/* Preview table */}
                            <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-80 overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 sticky top-0">
                                        <tr>
                                            <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-500 px-4 py-3">Excel Row</th>
                                            <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-500 px-4 py-3">Form No.</th>
                                            <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-500 px-4 py-3">Maths</th>
                                            <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-500 px-4 py-3">English</th>
                                            <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-500 px-4 py-3">Total</th>
                                            <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-500 px-4 py-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {preview.map((row) => (
                                            <tr key={row.rowNumber} className={row.isValid ? "bg-white" : "bg-rose-50"}>
                                                <td className="px-4 py-2.5 text-slate-400 text-xs">{row.rowNumber}</td>
                                                <td className="px-4 py-2.5 font-black text-slate-800">{row.formNumber || "—"}</td>
                                                <td className="px-4 py-2.5 font-bold text-slate-700">{isValidScore(row.mathScore) ? row.mathScore : "—"}</td>
                                                <td className="px-4 py-2.5 font-bold text-slate-700">{isValidScore(row.englishScore) ? row.englishScore : "—"}</td>
                                                <td className="px-4 py-2.5 font-black text-teal-700">{row.isValid ? row.total : "—"}</td>
                                                <td className="px-4 py-2.5">
                                                    {row.isValid ? (
                                                        <Badge className="bg-emerald-100 text-emerald-700 text-[9px] font-black">Valid</Badge>
                                                    ) : (
                                                        <span className="text-[9px] text-rose-600 font-bold">{row.errors.join("; ")}</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {invalidRows.length > 0 && (
                                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                    <p className="text-xs text-amber-700 font-medium">
                                        {invalidRows.length} row{invalidRows.length !== 1 ? 's' : ''} with errors will be skipped. Only {validRows.length} valid row{validRows.length !== 1 ? 's' : ''} will be uploaded.
                                    </p>
                                </div>
                            )}

                            <Button
                                onClick={handleUpload}
                                disabled={uploading || validRows.length === 0}
                                className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-xl uppercase tracking-widest text-xs"
                            >
                                {uploading
                                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading {validRows.length} records...</>
                                    : <><Upload className="w-4 h-4 mr-2" /> Upload {validRows.length} Valid Record{validRows.length !== 1 ? 's' : ''}</>
                                }
                            </Button>
                        </div>
                    )}

                    {/* Step 4: Upload Results */}
                    {results && summary && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-xs font-black flex items-center justify-center">4</span>
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">Upload Report</h3>
                            </div>

                            {/* Summary */}
                            <div className={`p-4 rounded-2xl border flex items-center gap-4 ${summary.failed === 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                                {summary.failed === 0
                                    ? <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                                    : <AlertTriangle className="w-8 h-8 text-amber-600 shrink-0" />
                                }
                                <div>
                                    <p className="font-black text-slate-800">
                                        {summary.processed} record{summary.processed !== 1 ? 's' : ''} saved
                                        {summary.offeredCount > 0 && ` · ${summary.offeredCount} admission offer${summary.offeredCount !== 1 ? 's' : ''} issued`}
                                        {summary.failed > 0 && `, ${summary.failed} failed`}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5">The applicants table has been refreshed with the new scores.</p>
                                </div>
                            </div>

                            {/* Failed rows detail */}
                            {summary.failed > 0 && (
                                <div className="border border-rose-200 rounded-2xl overflow-hidden">
                                    <div className="bg-rose-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-rose-600">Failed Records</div>
                                    {results.filter(r => !r.success).map((r, i) => (
                                        <div key={i} className="flex items-center justify-between px-4 py-2.5 border-t border-rose-100 bg-white">
                                            <span className="font-black text-slate-800 text-sm">Form #{r.formNumber}</span>
                                            <span className="text-xs text-rose-600 font-bold">{r.error}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Absent notes */}
                            {results.some(r => r.note) && (
                                <div className="border border-amber-200 rounded-2xl overflow-hidden">
                                    <div className="bg-amber-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-amber-600">Absent Applicants (scored, not offered)</div>
                                    {results.filter(r => r.note).map((r, i) => (
                                        <div key={i} className="flex items-center justify-between px-4 py-2.5 border-t border-amber-100 bg-white">
                                            <span className="font-black text-slate-800 text-sm">Form #{r.formNumber}</span>
                                            <span className="text-xs text-amber-600 font-bold">{r.note}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <Button onClick={reset} variant="outline" className="w-full rounded-xl font-bold text-xs uppercase tracking-widest">
                                Upload Another File
                            </Button>
                        </div>
                    )}
                </CardContent>
            )}
        </Card>
    );
}

function isValidScore(n: number): boolean {
    return Number.isFinite(n) && n >= 0 && n <= 100;
}
