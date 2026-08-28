"use client";

import { useState, useEffect } from "react";
import { getTranscriptAuditLogs } from "@/actions/result-module";
import {
  Shield, Search, Filter, ChevronLeft, ChevronRight, Loader2,
  Printer, FileText, Mail, Eye, ArrowUpDown, Clock, User,
} from "lucide-react";
import Link from "next/link";

const ACTION_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  view: { label: "Viewed", color: "text-blue-400 bg-blue-500/10", icon: Eye },
  bulk_view: { label: "Bulk View", color: "text-cyan-400 bg-cyan-500/10", icon: Eye },
  print: { label: "Printed", color: "text-emerald-400 bg-emerald-500/10", icon: Printer },
  export_pdf: { label: "PDF Export", color: "text-amber-400 bg-amber-500/10", icon: FileText },
  export_image: { label: "Image Export", color: "text-purple-400 bg-purple-500/10", icon: FileText },
  email: { label: "Emailed", color: "text-pink-400 bg-pink-500/10", icon: Mail },
  publish: { label: "Published", color: "text-emerald-400 bg-emerald-500/10", icon: Eye },
  unpublish: { label: "Unpublished", color: "text-red-400 bg-red-500/10", icon: Eye },
  toggle_student_view_on: { label: "Student View ON", color: "text-blue-400 bg-blue-500/10", icon: Eye },
  toggle_student_view_off: { label: "Student View OFF", color: "text-orange-400 bg-orange-500/10", icon: Eye },
  student_view: { label: "Student Viewed", color: "text-teal-400 bg-teal-500/10", icon: Eye },
};

const TARGET_LABELS: Record<string, string> = {
  transcript: "Transcript",
  batch: "Result Batch",
  student: "Student",
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
  const [actionFilter, setActionFilter] = useState("");
  const [targetFilter, setTargetFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, targetFilter]);

  async function fetchLogs() {
    setLoading(true);
    const res = await getTranscriptAuditLogs({
      action: actionFilter || undefined,
      targetType: targetFilter || undefined,
      page,
      limit: 30,
    });
    if (res.success) {
      setLogs(res.data || []);
      setPagination(res.pagination || { total: 0, totalPages: 0 });
    }
    setLoading(false);
  }

  const filteredLogs = searchQuery
    ? logs.filter(
        (l) =>
          l.actorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.targetLabel?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.action?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : logs;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-white/5 backdrop-blur-sm px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Audit Trail</h1>
              <p className="text-sm text-slate-400">Track all transcript activities, prints, and exports</p>
            </div>
          </div>
          <Link
            href="/admin/result-module"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 transition-colors text-sm font-medium text-slate-300"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Result Module
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, target, or action..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-400 transition-colors"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white focus:outline-none focus:border-violet-400"
          >
            <option value="">All Actions</option>
            {Object.entries(ACTION_LABELS).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <select
            value={targetFilter}
            onChange={(e) => { setTargetFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white focus:outline-none focus:border-violet-400"
          >
            <option value="">All Targets</option>
            <option value="transcript">Transcripts</option>
            <option value="batch">Batches</option>
            <option value="student">Students</option>
          </select>

          <div className="ml-auto text-sm text-slate-400">
            {pagination.total} total entries
          </div>
        </div>

        {/* Log Table */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
            <Shield className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-xl font-semibold text-slate-400">No audit entries found</p>
            <p className="text-slate-500 mt-2">Activities will appear here as they occur</p>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Time</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Actor</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Action</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Target</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  const actionInfo = ACTION_LABELS[log.action] || { label: log.action, color: "text-slate-400 bg-slate-500/10", icon: ArrowUpDown };
                  const Icon = actionInfo.icon;
                  const ts = log.createdAt ? new Date(log.createdAt) : null;
                  const details = log.details ? JSON.parse(log.details) : null;

                  return (
                    <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{ts ? ts.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "-"}</span>
                          <span className="text-slate-500">{ts ? ts.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" }) : ""}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium">{log.actorName}</p>
                            <p className="text-xs text-slate-500">{log.actorRole}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${actionInfo.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                          {actionInfo.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div>
                          <p className="text-white">{log.targetLabel || "-"}</p>
                          <p className="text-xs text-slate-500">{TARGET_LABELS[log.targetType] || log.targetType}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {details ? (
                          <div className="text-xs text-slate-400 space-y-0.5">
                            {details.count !== undefined && <p>Count: {details.count}</p>}
                            {details.email && <p>Email: {details.email}</p>}
                            {details.filename && <p>File: {details.filename}</p>}
                            {details.semester && <p>Sem: {details.semester}, Session: {details.sessionId}</p>}
                            {details.mode && <p>Mode: {details.mode}</p>}
                          </div>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/15 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-slate-400">
              Page {page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/15 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
