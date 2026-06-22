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
  FileText
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
    <div className="p-8 max-w-[1600px] w-full mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4 italic">
            <FileText className="w-10 h-10 text-indigo-600" />
            APPLICANT DOCUMENTS
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">
            Review and approve applicant passport photos and signatures
          </p>
        </div>
        <Button onClick={fetchDocuments} disabled={loading}>
          {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm bg-slate-50/50 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-100 rounded-2xl text-slate-600">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Documents</p>
              <p className="text-2xl font-black text-slate-900">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="border-none shadow-sm bg-amber-50/50 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-100 rounded-2xl text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Review</p>
              <p className="text-2xl font-black text-slate-900">{stats.pending}</p>
            </div>
          </div>
        </Card>
        <Card className="border-none shadow-sm bg-emerald-50/50 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Approved</p>
              <p className="text-2xl font-black text-slate-900">{stats.approved}</p>
            </div>
          </div>
        </Card>
        <Card className="border-none shadow-sm bg-rose-50/50 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-100 rounded-2xl text-rose-600">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rejected</p>
              <p className="text-2xl font-black text-slate-900">{stats.rejected}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-none shadow-xl rounded-[2.5rem] p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="flex-1 w-full lg:w-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 bg-white font-bold text-sm"
                placeholder="Search by name, email, or filename..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <select
              className="px-4 py-3 rounded-2xl border border-slate-200 bg-white font-bold text-sm appearance-none pr-10"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              className="px-4 py-3 rounded-2xl border border-slate-200 bg-white font-bold text-sm appearance-none pr-10"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
            >
              <option value="all">All Types</option>
              <option value="passport_photo">Passport Photos</option>
              <option value="signature">Signatures</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Documents Table */}
      <Card className="border-none shadow-xl overflow-hidden rounded-[2.5rem]">
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
            <tbody className="divide-y divide-slate-50 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                  </td>
                </tr>
              ) : filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-slate-400">
                    No documents found
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900">{doc.userName}</span>
                        <span className="text-xs text-slate-500">{doc.userEmail}</span>
                        <Badge variant="outline" className="w-fit mt-1 text-xs">
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
                        <span className="text-sm font-medium text-slate-900 truncate max-w-[200px]">
                          {doc.fileName}
                        </span>
                        <span className="text-xs text-slate-500">
                          {(doc.fileSize / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm text-slate-600">
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-slate-500">
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
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="w-4 h-4" />
                        </Button>
                        {doc.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(doc.id)}
                              disabled={processing}
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedDocument(doc);
                                setShowRejectModal(true);
                              }}
                              disabled={processing}
                              className="border-rose-200 text-rose-600 hover:bg-rose-50"
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

      {/* Reject Modal */}
      {showRejectModal && selectedDocument && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md border-none shadow-2xl rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-rose-600">
                <XCircle className="w-5 h-5" />
                Reject Document
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-slate-600 mb-2">
                  Rejecting {selectedDocument.documentType === 'passport_photo' ? 'passport photo' : 'signature'} for:
                </p>
                <p className="font-bold text-slate-900">{selectedDocument.userName}</p>
                <p className="text-sm text-slate-500">{selectedDocument.userEmail}</p>
              </div>

              <div>
                <Label className="text-sm font-bold text-slate-700">Rejection Reason</Label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejection..."
                  className="mt-2"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedDocument(null);
                    setRejectionReason("");
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={processing || !rejectionReason.trim()}
                  className="flex-1 bg-rose-600 hover:bg-rose-700"
                >
                  {processing ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-2" />
                  )}
                  Reject Document
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
