"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Upload,
  Loader2,
  ChevronDown,
  ChevronUp,
  Search,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PreviewRow {
  rowIndex: number;
  identifier: string;
  matchedStudent: { id: number; name: string; matricNumber: string } | null;
  matchConfidence: number;
  matchStrategy: string;
  courseCode: string;
  score: number;
  grade: string;
  gradePoint: number;
  isValid: boolean;
  warning: string | null;
  status: 'ready' | 'review' | 'error';
}

interface PreviewData {
  preview: PreviewRow[];
  errors: string[];
  warnings: string[];
  anomalies: string[];
  summary: {
    totalRows: number;
    autoImport: number;
    needsReview: number;
    willFail: number;
    duplicateCount: number;
  };
}

interface ImportPreviewModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (mode: 'all' | 'valid_only' | 'skip_duplicates') => void;
  previewData: PreviewData | null;
  loading: boolean;
}

export function ImportPreviewModal({ open, onClose, onConfirm, previewData, loading }: ImportPreviewModalProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'preview' | 'errors' | 'anomalies'>('summary');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  if (!open) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
        <Card className="w-full max-w-md rounded-[2rem] p-12 text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Validating CSV Data</h3>
          <p className="text-sm text-slate-500 mt-2">Running smart student matching and anomaly detection...</p>
        </Card>
      </div>
    );
  }

  if (!previewData) return null;

  const { preview, errors, warnings, anomalies, summary } = previewData;
  const statusColors = {
    ready: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    review: 'bg-amber-50 text-amber-700 border-amber-200',
    error: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-5xl max-h-[90vh] rounded-[2rem] overflow-hidden flex flex-col">
        <CardHeader className="border-b border-slate-100 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
                <Eye className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">Import Preview</CardTitle>
                <p className="text-sm text-slate-500">Review before importing to avoid errors</p>
              </div>
            </div>
            <Button variant="ghost" onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-5 gap-3 mt-6">
            <div className="p-3 rounded-xl bg-slate-50 text-center">
              <p className="text-2xl font-black text-slate-900">{summary.totalRows}</p>
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Total Rows</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 text-center">
              <p className="text-2xl font-black text-emerald-600">{summary.autoImport}</p>
              <p className="text-[10px] font-bold uppercase text-emerald-400 tracking-wider">Auto Import</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 text-center">
              <p className="text-2xl font-black text-amber-600">{summary.needsReview}</p>
              <p className="text-[10px] font-bold uppercase text-amber-400 tracking-wider">Needs Review</p>
            </div>
            <div className="p-3 rounded-xl bg-red-50 text-center">
              <p className="text-2xl font-black text-red-600">{summary.willFail}</p>
              <p className="text-[10px] font-bold uppercase text-red-400 tracking-wider">Will Fail</p>
            </div>
            <div className="p-3 rounded-xl bg-orange-50 text-center">
              <p className="text-2xl font-black text-orange-600">{summary.duplicateCount}</p>
              <p className="text-[10px] font-bold uppercase text-orange-400 tracking-wider">Duplicates</p>
            </div>
          </div>
        </CardHeader>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-8">
          {[
            { id: 'summary', label: 'Overview', count: errors.length + warnings.length },
            { id: 'preview', label: 'Student Matches', count: preview.length },
            { id: 'errors', label: 'Errors', count: errors.length },
            { id: 'anomalies', label: 'Anomalies', count: anomalies.length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-4 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-colors",
                activeTab === tab.id ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"
              )}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 px-1.5 py-0.5 rounded-full bg-slate-100 text-[9px]">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'summary' && (
            <div className="space-y-6">
              {errors.length > 0 && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100">
                  <h4 className="text-sm font-black text-red-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <XCircle className="w-4 h-4" /> Errors ({errors.length})
                  </h4>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {errors.slice(0, 20).map((e, i) => (
                      <p key={i} className="text-xs text-red-600 font-medium">{e}</p>
                    ))}
                    {errors.length > 20 && <p className="text-xs text-red-400">...and {errors.length - 20} more</p>}
                  </div>
                </div>
              )}
              {warnings.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                  <h4 className="text-sm font-black text-amber-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Warnings ({warnings.length})
                  </h4>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {warnings.slice(0, 20).map((w, i) => (
                      <p key={i} className="text-xs text-amber-600 font-medium">{w}</p>
                    ))}
                    {warnings.length > 20 && <p className="text-xs text-amber-400">...and {warnings.length - 20} more</p>}
                  </div>
                </div>
              )}
              {anomalies.length > 0 && (
                <div className="p-4 rounded-xl bg-orange-50 border border-orange-100">
                  <h4 className="text-sm font-black text-orange-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Copy className="w-4 h-4" /> Anomalies ({anomalies.length})
                  </h4>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {anomalies.slice(0, 10).map((a, i) => (
                      <p key={i} className="text-xs text-orange-600 font-medium">{a}</p>
                    ))}
                  </div>
                </div>
              )}
              {errors.length === 0 && warnings.length === 0 && anomalies.length === 0 && (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                  <h3 className="text-xl font-black text-slate-900">All Clear!</h3>
                  <p className="text-sm text-slate-500 mt-2">No errors, warnings, or anomalies detected. Safe to import.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="space-y-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1" />
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  {preview.filter(r => r.status === 'ready').length} ready • {preview.filter(r => r.status === 'review').length} review • {preview.filter(r => r.status === 'error').length} errors
                </span>
              </div>
              <div className="space-y-1 max-h-[50vh] overflow-y-auto">
                {preview.slice(0, 100).map((row, i) => (
                  <div key={i} className={cn("p-3 rounded-xl border text-sm flex items-center gap-4 cursor-pointer hover:shadow-sm transition-all", statusColors[row.status])}>
                    <div className="w-8 text-center">
                      <span className="text-[10px] font-bold text-slate-400">#{row.rowIndex}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs">{row.identifier}</span>
                        {row.matchedStudent && (
                          <>
                            <span className="text-slate-300">→</span>
                            <span className="font-bold truncate">{row.matchedStudent.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold">{row.score}</span>
                      <span className="ml-1 text-[10px] opacity-60">{row.grade}</span>
                    </div>
                    <div className="w-20 text-right">
                      {row.status === 'ready' && <Badge className="bg-emerald-100 text-emerald-700 border-none text-[9px]">Ready</Badge>}
                      {row.status === 'review' && <Badge className="bg-amber-100 text-amber-700 border-none text-[9px]">{Math.round(row.matchConfidence * 100)}%</Badge>}
                      {row.status === 'error' && <Badge className="bg-red-100 text-red-700 border-none text-[9px]">Not Found</Badge>}
                    </div>
                  </div>
                ))}
                {preview.length > 100 && (
                  <p className="text-center text-xs text-slate-400 py-4">Showing 100 of {preview.length} rows</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'errors' && (
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {errors.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-600">No errors found</p>
                </div>
              ) : (
                errors.map((e, i) => (
                  <div key={i} className="p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-700 font-medium">
                    {e}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'anomalies' && (
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {anomalies.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-600">No anomalies detected</p>
                </div>
              ) : (
                anomalies.map((a, i) => (
                  <div key={i} className="p-3 rounded-xl bg-orange-50 border border-orange-100 text-xs text-orange-700 font-medium">
                    {a}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-100 px-8 py-4 flex items-center justify-between bg-slate-50">
          <Button variant="ghost" onClick={onClose} className="text-slate-500 font-bold text-xs uppercase tracking-widest">
            Cancel
          </Button>
          <div className="flex gap-3">
            {summary.duplicateCount > 0 && (
              <Button
                variant="outline"
                onClick={() => onConfirm('skip_duplicates')}
                className="rounded-xl font-bold text-xs uppercase tracking-widest border-orange-200 text-orange-700 hover:bg-orange-50"
              >
                Skip Duplicates ({summary.autoImport - summary.duplicateCount})
              </Button>
            )}
            {summary.willFail > 0 && (
              <Button
                variant="outline"
                onClick={() => onConfirm('valid_only')}
                className="rounded-xl font-bold text-xs uppercase tracking-widest border-amber-200 text-amber-700 hover:bg-amber-50"
              >
                Valid Only ({summary.autoImport})
              </Button>
            )}
            <Button
              onClick={() => onConfirm('all')}
              className="rounded-xl font-bold text-xs uppercase tracking-widest bg-slate-900 hover:bg-black shadow-lg px-6"
            >
              <Upload className="w-4 h-4 mr-2" /> Import All ({summary.totalRows})
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
