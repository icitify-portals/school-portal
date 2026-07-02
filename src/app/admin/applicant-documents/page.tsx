"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  FileImage,
  PenTool,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Download,
  Search,
  Filter,
  RefreshCw,
  UserCheck,
  AlertTriangle,
  FileText,
  Loader2
} from "lucide-react";
import {
  getAllApplicantDocuments,
  approveDocument,
  rejectDocument
} from "@/actions/applicant-documents";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ApplicantDocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'passport_photo' | 'signature'>('all');
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const result = await getAllApplicantDocuments();
      if (result.success && result.documents) {
        setDocuments(result.documents);
      } else {
        toast.error("Failed to fetch documents");
      }
    } catch (error) {
      toast.error("Failed to fetch documents");
    }
    setLoading(false);
  };

  const handleApprove = async (documentId: number) => {
    setProcessing(true);
    try {
      const result = await approveDocument(documentId);
      if (result.success) {
        toast.success("Document approved successfully");
        await fetchDocuments();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to approve document");
    }
    setProcessing(false);
  };

  const handleReject = async () => {
    if (!selectedDocument || !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    setProcessing(true);
    try {
      const result = await rejectDocument(selectedDocument.id, rejectionReason);
      if (result.success) {
        toast.success("Document rejected");
        setShowRejectModal(false);
        setSelectedDocument(null);
        setRejectionReason("");
        await fetchDocuments();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to reject document");
    }
    setProcessing(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-rose-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-amber-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-rose-100 text-rose-700 border-rose-200">Rejected</Badge>;
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Pending Review</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'passport_photo' ?
      <FileImage className="w-5 h-5 text-blue-500" /> :
      <PenTool className="w-5 h-5 text-purple-500" />;
  };

  const getTypeBadge = (type: string) => {
    return type === 'passport_photo' ?
      <Badge className="bg-blue-100 text-blue-700 border-blue-200">Passport Photo</Badge> :
      <Badge className="bg-purple-100 text-purple-700 border-purple-200">Signature</Badge>;
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch =
      doc.userName?.toLowerCase().includes(search.toLowerCase()) ||
      doc.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
      doc.fileName?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || doc.status === statusFilter;

    const matchesType =
      typeFilter === 'all' || doc.documentType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const stats = {
    total: documents.length,
    pending: documents.filter(d => d.status === 'pending').length,
    approved: documents.filter(d => d.status === 'approved').length,
    rejected: documents.filter(d => d.status === 'rejected').length
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-transparent">
      <div className="max-w-[1600px] w-full mx-auto space-y-10 text-slate-800">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 text-white rounded-[3rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden border border-slate-800">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-650/30 to-purple-650/30 opacity-50 mix-blend-overlay" />
          <div className="relative z-10 flex-1">
            <div className="flex items-center gap-4 mb-2">
              <FileText className="w-12 h-12 text-indigo-400 drop-shadow-md" />
              <h2 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase italic drop-shadow-md">
                Applicant Documents
              </h2>
            </div>
            <p className="text-slate-300 font-medium mt-1 uppercase text-sm tracking-wide opacity-90">
              Review and approve applicant passport photos and signatures
            </p>
          </div>
          <div className="relative z-10 shrink-0">
            <Button onClick={fetchDocuments} disabled={loading} className="font-black px-6 py-6 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 active:scale-95 shadow-md">
              {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] p-6 hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-slate-100 rounded-[1.5rem] text-slate-650 shadow-inner">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Documents</p>
                <p className="text-3xl font-black text-slate-900 tracking-tighter">{stats.total}</p>
              </div>
            </div>
          </Card>
          <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] p-6 hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-amber-100 rounded-[1.5rem] text-amber-655 shadow-inner">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Pending Review</p>
                <p className="text-3xl font-black text-slate-900 tracking-tighter">{stats.pending}</p>
              </div>
            </div>
          </Card>
          <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] p-6 hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-emerald-100 rounded-[1.5rem] text-emerald-655 shadow-inner">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Approved</p>
                <p className="text-3xl font-black text-slate-900 tracking-tighter">{stats.approved}</p>
              </div>
            </div>
          </Card>
          <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] p-6 hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-rose-100 rounded-[1.5rem] text-rose-655 shadow-inner">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Rejected</p>
                <p className="text-3xl font-black text-slate-900 tracking-tighter">{stats.rejected}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[2rem] p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 bg-white font-bold text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Search by name, email, or filename..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 w-full lg:w-auto shrink-0">
              <div className="relative flex-1 sm:flex-none">
                <select
                  className="w-full px-4 py-3 pr-10 rounded-2xl border border-slate-200 bg-white font-bold text-sm text-slate-800 outline-none appearance-none focus:ring-2 focus:ring-indigo-500/20"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450 pointer-events-none" />
              </div>

              <div className="relative flex-1 sm:flex-none">
                <select
                  className="w-full px-4 py-3 pr-10 rounded-2xl border border-slate-200 bg-white font-bold text-sm text-slate-800 outline-none appearance-none focus:ring-2 focus:ring-indigo-500/20"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                >
                  <option value="all">All Types</option>
                  <option value="passport_photo">Passport Photos</option>
                  <option value="signature">Signatures</option>
                </select>
                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450 pointer-events-none" />
              </div>
            </div>
          </div>
        </Card>

        {/* Documents Table */}
        <Card className="border border-white/40 shadow-2xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl overflow-hidden rounded-[3rem]">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Applicant</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Document Type</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em]">File Info</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Uploaded</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Status</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40 bg-white/20">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center">
                      <Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-650" />
                    </td>
                  </tr>
                ) : filteredDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center text-slate-450 font-bold uppercase tracking-wider text-xs">
                      No documents found
                    </td>
                  </tr>
                ) : (
                  filteredDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-white/40 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-base font-black text-slate-800 uppercase">{doc.userName}</span>
                          <span className="text-xs text-slate-500 font-bold mt-0.5">{doc.userEmail}</span>
                          <Badge className="bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-wider w-fit mt-2">
                            {doc.userRole}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          {getTypeIcon(doc.documentType)}
                          {getTypeBadge(doc.documentType)}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-700 truncate max-w-[200px]">
                            {doc.fileName}
                          </span>
                          <span className="text-xs text-slate-400 font-mono mt-0.5">
                            {(doc.fileSize / 1024).toFixed(1)} KB
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col text-sm font-bold text-slate-600 font-mono">
                          <span>
                            {new Date(doc.uploadedAt).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-slate-400 font-normal">
                            {new Date(doc.uploadedAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(doc.status)}
                          {getStatusBadge(doc.status)}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" className="hover:bg-white/60 rounded-xl">
                            <Eye className="w-4 h-4 text-slate-600" />
                          </Button>
                          <Button size="sm" variant="ghost" className="hover:bg-white/60 rounded-xl">
                            <Download className="w-4 h-4 text-slate-600" />
                          </Button>
                          {doc.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApprove(doc.id)}
                                disabled={processing}
                                className="bg-emerald-650 hover:bg-emerald-700 text-white rounded-xl shadow-sm"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedDocument(doc);
                                  setShowRejectModal(true);
                                }}
                                disabled={processing}
                                className="border border-rose-250 text-rose-600 hover:bg-rose-50 rounded-xl"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedDocument && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md border border-white/40 shadow-2xl shadow-slate-200/50 bg-white/80 backdrop-blur-3xl rounded-[2.5rem]">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="flex items-center gap-3 text-rose-600 font-black uppercase text-lg tracking-wide">
                <XCircle className="w-6 h-6" />
                Reject Document
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <div className="p-4 bg-white/40 border border-white/60 rounded-2xl">
                <p className="text-xs text-slate-400 font-black uppercase tracking-wider mb-2">
                  Rejecting {selectedDocument.documentType === 'passport_photo' ? 'passport photo' : 'signature'} for:
                </p>
                <p className="font-black text-slate-800 text-base uppercase">{selectedDocument.userName}</p>
                <p className="text-sm text-slate-500 font-bold mt-0.5">{selectedDocument.userEmail}</p>
              </div>

              <div>
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Rejection Reason</Label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejection..."
                  className="bg-white border-slate-200 rounded-2xl font-bold"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedDocument(null);
                    setRejectionReason("");
                  }}
                  className="flex-1 font-black uppercase text-xs tracking-widest py-3 border border-slate-200 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={processing || !rejectionReason.trim()}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-xs tracking-widest py-3 rounded-xl shadow-md"
                >
                  {processing ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-2" />
                  )}
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
