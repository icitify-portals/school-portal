"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  CheckCircle2, XCircle, Loader2, Search, Filter, Download,
  Printer, ChevronDown, User, Phone, Mail, Eye, ArrowUpDown,
  ShieldCheck, AlertTriangle, Clock, FileText, Users
} from "lucide-react";
import { toast } from "sonner";
import {
  getAdmittedRegister,
  admitFromRegister,
  rejectFromRegister,
  updatePendingReason
} from "@/actions/admission_v2";
import { cn } from "@/lib/utils";

interface RegisterCandidate {
  id: number;
  formNumber: string;
  applicationNumber: string;
  fullName: string;
  surname: string;
  firstName: string;
  middleName: string;
  email: string;
  phone: string;
  faculty: string;
  department: string;
  programme: string;
  programmeType: string;
  applicationMode: string;
  level: string;
  status: string;
  pendingReason: string;
  acceptancePaymentStatus: string;
  processingFeeStatus: string;
  examAttendanceStatus: string;
  templateName: string;
  templateId: number;
  programmeId: number;
  appliedAt: string;
  updatedAt: string;
}

interface RegisterFilters {
  templateId?: number;
  programmeId?: number;
  level?: string;
  applicationMode?: string;
  search?: string;
}

export default function AdmissionRegisterClient({
  initialData,
}: {
  initialData: {
    admitted: RegisterCandidate[];
    pending: RegisterCandidate[];
    totalAdmitted: number;
    totalPending: number;
    programmes: any[];
    templates: any[];
  };
}) {
  const { data: session } = useSession();
  const [admitted, setAdmitted] = useState<RegisterCandidate[]>(initialData.admitted);
  const [pending, setPending] = useState<RegisterCandidate[]>(initialData.pending);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"admitted" | "pending">("admitted");
  const [filters, setFilters] = useState<RegisterFilters>({});
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [selectedMode, setSelectedMode] = useState("all");
  const [selectedTemplate, setSelectedTemplate] = useState<number | "">("");
  const [selectedProgramme, setSelectedProgramme] = useState<number | "">("");
  const [totalAdmitted, setTotalAdmitted] = useState(initialData.totalAdmitted);
  const [totalPending, setTotalPending] = useState(initialData.totalPending);
  const [templates] = useState(initialData.templates);
  const [programmes] = useState(initialData.programmes);
  const [admitting, setAdmitting] = useState<number | null>(null);
  const [rejecting, setRejecting] = useState<number | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: number; reason: string } | null>(null);
  const [detailModal, setDetailModal] = useState<RegisterCandidate | null>(null);
  const [expandedApp, setExpandedApp] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const f: RegisterFilters = {
      search: search || undefined,
      level: selectedLevel !== "all" ? selectedLevel : undefined,
      applicationMode: selectedMode !== "all" ? selectedMode : undefined,
      templateId: selectedTemplate as any,
      programmeId: selectedProgramme as any,
    };
    const res = await getAdmittedRegister(f);
    if (res.success) {
      setAdmitted(res.admitted);
      setPending(res.pending);
      setTotalAdmitted(res.totalAdmitted);
      setTotalPending(res.totalPending);
    }
    setLoading(false);
  }, [search, selectedLevel, selectedMode, selectedTemplate, selectedProgramme]);

  useEffect(() => {
    const t = setTimeout(fetchData, 300);
    return () => clearTimeout(t);
  }, [fetchData]);

  const handleAdmit = async (id: number) => {
    if (!confirm("Offer admission to this candidate?")) return;
    setAdmitting(id);
    const res = await admitFromRegister(id);
    setAdmitting(null);
    if (res.success) {
      toast.success("Admission offered successfully");
      fetchData();
    } else {
      toast.error(res.error || "Failed");
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setRejecting(rejectModal.id);
    const res = await rejectFromRegister(rejectModal.id, rejectModal.reason);
    setRejecting(null);
    setRejectModal(null);
    if (res.success) {
      toast.success("Candidate rejected");
      fetchData();
    } else {
      toast.error(res.error || "Failed");
    }
  };

  const handleUpdateReason = async (id: number, reason: string) => {
    const res = await updatePendingReason(id, reason);
    if (res.success) {
      toast.success("Reason updated");
      fetchData();
    } else {
      toast.error(res.error || "Failed");
    }
  };

  const filteredList = activeTab === "admitted" ? admitted : pending;
  const levelOptions = ["all", "ND", "HND"];
  const modeOptions = [
    { value: "all", label: "All Modes" },
    { value: "full_time", label: "Full-Time" },
    { value: "part_time", label: "Part-Time" },
  ];

  const statusBadge = (status: string, pendingReason?: string) => {
    const map: Record<string, { label: string; cls: string; dot: string }> = {
      admitted: { label: "ADMITTED", cls: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
      paid: { label: "PAID", cls: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-500" },
      submitted: { label: "SUBMITTED", cls: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-500" },
      screened: { label: "SCREENED", cls: "bg-teal-100 text-teal-700 border-teal-200", dot: "bg-teal-500" },
      rejected: { label: "REJECTED", cls: "bg-rose-100 text-rose-700 border-rose-200", dot: "bg-rose-500" },
      draft: { label: "DRAFT", cls: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" },
    };
    const s = map[status] || { label: status.toUpperCase(), cls: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" };
    return (
      <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border", s.cls)}>
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", s.dot)} />
        {s.label}
      </span>
    );
  };

  const Row = ({ c }: { c: RegisterCandidate }) => {
    const isExpanded = expandedApp === c.id;
    const isAdmitting = admitting === c.id;
    const isRejecting = rejecting === c.id;

    return (
      <>
        <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
          <td className="px-4 py-3.5">
            <button onClick={() => setExpandedApp(isExpanded ? null : c.id)} className="text-slate-400 hover:text-slate-600">
              {isExpanded ? "▾" : "▸"}
            </button>
          </td>
          <td className="px-4 py-3.5">
            <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
              {c.formNumber}
            </span>
          </td>
          <td className="px-4 py-3.5">
            <span className={cn(
              "font-mono text-xs font-bold px-2 py-1 rounded-lg",
              c.applicationNumber && c.applicationNumber !== "—" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
            )}>
              {c.applicationNumber}
            </span>
          </td>
          <td className="px-4 py-3.5">
            <div>
              <p className="text-sm font-black text-slate-900">{c.fullName}</p>
              <p className="text-[10px] text-slate-400 font-medium">{c.email}</p>
            </div>
          </td>
          <td className="px-4 py-3.5">
            <div>
              <p className="text-xs font-bold text-slate-700">{c.department}</p>
              <p className="text-[10px] text-slate-400">{c.faculty}</p>
            </div>
          </td>
          <td className="px-4 py-3.5">
            <p className="text-xs font-bold text-indigo-600">{c.programme}</p>
            <p className="text-[10px] text-slate-400">{c.programmeType}</p>
          </td>
          <td className="px-4 py-3.5">
            <span className="text-xs font-bold text-slate-600">{c.applicationMode}</span>
          </td>
          <td className="px-4 py-3.5">
            <span className="text-xs font-bold text-slate-600">{c.level}</span>
          </td>
          <td className="px-4 py-3.5">
            {statusBadge(c.status, c.pendingReason)}
          </td>
          <td className="px-4 py-3.5">
            <div className="flex items-center gap-2">
              {activeTab === "pending" && (
                <>
                  <button
                    onClick={() => handleAdmit(c.id)}
                    disabled={isAdmitting}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-50"
                  >
                    {isAdmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                    Offer Admission
                  </button>
                  <button
                    onClick={() => setRejectModal({ id: c.id, reason: c.pendingReason || "" })}
                    disabled={isRejecting}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-50"
                  >
                    {isRejecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                    Reject
                  </button>
                </>
              )}
              <button
                onClick={() => setDetailModal(c)}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
                title="View details"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            </div>
          </td>
        </tr>
        {isExpanded && (
          <tr className="bg-slate-50 border-b border-slate-100">
            <td colSpan={11} className="px-8 py-4">
              <div className="grid grid-cols-4 gap-4 text-xs">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Phone</p>
                  <p className="font-bold text-slate-700">{c.phone}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Applied</p>
                  <p className="font-bold text-slate-700">{c.appliedAt ? new Date(c.appliedAt).toLocaleDateString() : "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Acceptance Fee</p>
                  <p className="font-bold text-slate-700 capitalize">{c.acceptancePaymentStatus?.replace("_", " ") || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Processing Fee</p>
                  <p className="font-bold text-slate-700 capitalize">{c.processingFeeStatus?.replace("_", " ") || "—"}</p>
                </div>
                {activeTab === "pending" && (
                  <div className="col-span-4">
                    <p className="text-[10px] font-black uppercase text-amber-500 tracking-wider mb-1">Pending Reason</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        defaultValue={c.pendingReason}
                        placeholder="Set or update pending reason..."
                        className="flex-1 px-3 py-2 rounded-xl border border-amber-200 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
                        onBlur={(e) => {
                          if (e.target.value !== c.pendingReason) {
                            handleUpdateReason(c.id, e.target.value);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.currentTarget.blur();
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </td>
          </tr>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">Reject Candidate</h3>
            <p className="text-sm text-slate-500 mb-4">Optionally state the reason. The candidate will be notified by email.</p>
            <textarea
              autoFocus
              value={rejectModal.reason}
              onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
              placeholder="e.g. Below cut-off mark, Failed UTME requirements..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none h-28"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setRejectModal(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-black uppercase tracking-widest transition-colors"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailModal && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setDetailModal(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{detailModal.fullName}</h3>
                <p className="text-sm text-slate-500 mt-0.5">{detailModal.email}</p>
              </div>
              <button onClick={() => setDetailModal(null)} className="text-slate-400 hover:text-slate-600 text-2xl">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ["Form Number", detailModal.formNumber],
                ["Admission Number", detailModal.applicationNumber !== "—" ? detailModal.applicationNumber : "—"],
                ["Programme", detailModal.programme],
                ["Department", detailModal.department],
                ["Faculty", detailModal.faculty],
                ["Mode", detailModal.applicationMode],
                ["Level", detailModal.level],
                ["Phone", detailModal.phone],
                ["Acceptance Fee", detailModal.acceptancePaymentStatus?.replace("_", " ")],
                ["Processing Fee", detailModal.processingFeeStatus?.replace("_", " ")],
                ["Exam Attendance", detailModal.examAttendanceStatus?.replace("_", " ")],
                ["Status", detailModal.status.toUpperCase()],
                ["Template", detailModal.templateName],
                ["Applied", detailModal.appliedAt ? new Date(detailModal.appliedAt).toLocaleDateString() : "—"],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-0.5">{label}</p>
                  <p className="font-bold text-slate-800">{value || "—"}</p>
                </div>
              ))}
              {detailModal.pendingReason && (
                <div className="col-span-2">
                  <p className="text-[10px] font-black uppercase text-amber-500 tracking-widest mb-0.5">Pending Reason</p>
                  <p className="font-bold text-amber-600">{detailModal.pendingReason}</p>
                </div>
              )}
            </div>
            {activeTab === "pending" && (
              <div className="flex gap-3 mt-6 pt-6 border-t border-slate-100">
                <button
                  onClick={() => { setDetailModal(null); handleAdmit(detailModal.id); }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black uppercase tracking-widest transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" /> Offer Admission
                </button>
                <button
                  onClick={() => { setDetailModal(null); setRejectModal({ id: detailModal.id, reason: "" }); }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-black uppercase tracking-widest transition-colors"
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filters bar */}
      <div className="bg-white/70 backdrop-blur-3xl border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, form number, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>

            {/* Template */}
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value ? Number(e.target.value) : "")}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Exercises</option>
              {templates.map((t: any) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>

            {/* Programme */}
            <select
              value={selectedProgramme}
              onChange={(e) => setSelectedProgramme(e.target.value ? Number(e.target.value) : "")}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Programmes</option>
              {programmes.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            {/* Level */}
            <div className="flex rounded-xl border border-slate-200 overflow-hidden">
              {levelOptions.map((l) => (
                <button
                  key={l}
                  onClick={() => setSelectedLevel(l)}
                  className={cn(
                    "px-3 py-2.5 text-xs font-black uppercase tracking-widest transition-colors",
                    selectedLevel === l ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {l}
                </button>
              ))}
            </div>

            {/* Mode */}
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {modeOptions.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>

            <button onClick={fetchData} disabled={loading} className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors">
              <Loader2 className={cn("w-4 h-4", loading && "animate-spin")} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-[1600px] mx-auto px-6 pt-6">
        <div className="flex items-center gap-1 border-b border-slate-200 mb-0">
          <button
            onClick={() => setActiveTab("admitted")}
            className={cn(
              "flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-colors -mb-px",
              activeTab === "admitted"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-400 hover:text-slate-600"
            )}
          >
            <CheckCircle2 className="w-4 h-4" />
            Admitted ({totalAdmitted})
          </button>
          <button
            onClick={() => setActiveTab("pending")}
            className={cn(
              "flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-colors -mb-px",
              activeTab === "pending"
                ? "border-amber-600 text-amber-700"
                : "border-transparent text-slate-400 hover:text-slate-600"
            )}
          >
            <Clock className="w-4 h-4" />
            Pending Decision ({totalPending})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="max-w-[1600px] mx-auto px-6 pb-8">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm mt-4 overflow-hidden">
          {loading && filteredList.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : filteredList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              {activeTab === "admitted"
                ? <CheckCircle2 className="w-12 h-12 text-emerald-300 mb-3" />
                : <Clock className="w-12 h-12 text-amber-300 mb-3" />
              }
              <p className="text-sm font-bold text-slate-500">
                {activeTab === "admitted" ? "No admitted candidates yet" : "No pending candidates"}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {activeTab === "pending" ? "All candidates have been processed" : "Run the admission process to admit candidates"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3.5 w-8"></th>
                    <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Form No</th>
                    <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Admission No</th>
                    <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Applicant</th>
                    <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Department</th>
                    <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Programme</th>
                    <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Mode</th>
                    <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Level</th>
                    <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                    <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredList.map((c) => (
                    <Row key={c.id} c={c} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
