"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle2, AlertCircle, RefreshCw, X, Table } from "lucide-react";
import { cn } from "@/lib/utils";

interface UniversalImporterProps {
    title: string;
    description: string;
    onImport: (data: any[]) => Promise<{ success: boolean; message?: string; error?: string }>;
    templateColumns?: string[];
    onComplete?: () => void;
}

export function UniversalImporter({ title, description, onImport, templateColumns = [], onComplete }: UniversalImporterProps) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const [step, setStep] = useState<1 | 2>(1); // 1: Upload, 2: Preview & Confirm
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setFileName(file.name);
        const reader = new FileReader();

        if (file.name.endsWith(".csv")) {
            reader.onload = (e) => {
                const text = e.target?.result as string;
                Papa.parse(text, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        setData(results.data);
                        setStep(2);
                    }
                });
            };
            reader.readAsText(file);
        } else {
            reader.onload = (e) => {
                const bstr = e.target?.result;
                const workbook = XLSX.read(bstr, { type: 'binary' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);
                setData(json);
                setStep(2);
            };
            reader.readAsBinaryString(file);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls'],
            'text/csv': ['.csv']
        }
    });

    const handleImport = async () => {
        setLoading(true);
        setStatus(null);
        try {
            const result = await onImport(data);
            if (result.success) {
                setStatus({ type: 'success', message: result.message || "Data imported successfully!" });
                setTimeout(() => {
                    reset();
                    if (onComplete) onComplete();
                }, 3000);
            } else {
                setStatus({ type: 'error', message: result.error || "Import failed. Please check your data." });
            }
        } catch (error) {
            setStatus({ type: 'error', message: "An unexpected error occurred during import." });
        }
        setLoading(false);
    };

    const reset = () => {
        setData([]);
        setFileName(null);
        setStep(1);
        setStatus(null);
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase italic">{title}</h3>
                    <p className="text-xs text-slate-500 font-medium">{description}</p>
                </div>
                {step === 2 && (
                    <Button variant="ghost" size="icon" onClick={reset} className="rounded-full">
                        <X className="w-5 h-5 text-slate-400" />
                    </Button>
                )}
            </div>

            <div className="p-8">
                {step === 1 ? (
                    <div
                        {...getRootProps()}
                        className={cn(
                            "border-2 border-dashed rounded-[2.5rem] p-12 flex flex-col items-center justify-center transition-all cursor-pointer",
                            isDragActive ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-blue-400 hover:bg-slate-50"
                        )}
                    >
                        <input {...getInputProps()} />
                        <div className="w-16 h-16 bg-blue-100 rounded-3xl flex items-center justify-center mb-4 text-blue-600">
                            <Upload className="w-8 h-8" />
                        </div>
                        <p className="text-sm font-bold text-slate-900">Drop your file here or click to browse</p>
                        <p className="text-xs text-slate-400 mt-2">Supports .xlsx, .xls and .csv</p>

                        <div className="mt-8 flex flex-wrap justify-center gap-2">
                            {templateColumns.map(col => (
                                <span key={col} className="px-2 py-1 bg-slate-100 text-slate-500 rounded-md text-[9px] font-black uppercase tracking-tighter">
                                    {col}
                                </span>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900">{fileName}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{data.length} Records Found</p>
                                </div>
                            </div>
                            <Button variant="outline" onClick={reset} className="rounded-xl font-bold text-xs uppercase tracking-widest h-9 border-slate-200">Change File</Button>
                        </div>

                        {status && (
                            <div className={cn(
                                "p-4 rounded-2xl flex items-start gap-4",
                                status.type === 'success' ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                            )}>
                                {status.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                                <p className="text-xs font-bold leading-relaxed">{status.message}</p>
                            </div>
                        )}

                        <div className="border border-slate-100 rounded-2xl overflow-hidden">
                            <div className="max-h-[300px] overflow-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50 sticky top-0">
                                        <tr>
                                            {Object.keys(data[0] || {}).map(header => (
                                                <th key={header} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 whitespace-nowrap">
                                                    {header}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {data.slice(0, 10).map((row, i) => (
                                            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                {Object.values(row || {}).map((val: any, j) => (
                                                    <td key={j} className="px-4 py-3 text-xs text-slate-600 font-medium whitespace-nowrap">
                                                        {val?.toString() || ""}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {data.length > 10 && (
                                <div className="p-3 bg-slate-50 text-center text-[9px] font-black text-slate-300 uppercase tracking-widest">
                                    And {data.length - 10} more records...
                                </div>
                            )}
                        </div>

                        <Button
                            onClick={handleImport}
                            disabled={loading || data.length === 0}
                            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] gap-2 shadow-lg disabled:opacity-50"
                        >
                            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Table className="w-4 h-4" />}
                            {loading ? "Processing Data..." : "Confirm & Import Records"}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
