"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  FileImage,
  PenTool,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  UserCheck,
  Camera,
  FileText,
  RefreshCw,
  Eye,
  Download
} from "lucide-react";
import Link from "next/link";
import {
  getApplicantDocuments,
  getDocumentUploadStatus,
  canUploadDocuments
} from "@/actions/applicant-documents";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function FresherDashboard() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploadStatus, setUploadStatus] = useState<any>(null);
  const [canUpload, setCanUpload] = useState(false);
  const [uploadReason, setUploadReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [docsRes, statusRes, permissionRes] = await Promise.all([
        getApplicantDocuments(),
        getDocumentUploadStatus(),
        canUploadDocuments()
      ]);

      if (docsRes.success && docsRes.documents) setDocuments(docsRes.documents);
      if (statusRes.success) setUploadStatus(statusRes);
      if (permissionRes.success) {
        setCanUpload(permissionRes.canUpload);
        setUploadReason(permissionRes.reason);
      }
    } catch (error) {
      toast.error("Failed to load data");
    }
    setLoading(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, documentType: 'passport_photo' | 'signature') => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload-document', {
        method: 'POST',
        body: formData,
        headers: {
          'X-Document-Type': documentType
        }
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        await fetchData();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Upload failed");
    }
    setUploading(false);

    // Reset file input
    event.target.value = '';
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
        return <AlertCircle className="w-5 h-5 text-slate-400" />;
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
        return <Badge variant="outline">Not Uploaded</Badge>;
    }
  };

  const getProgressPercentage = () => {
    if (!uploadStatus) return 0;
    let completed = 0;
    if (uploadStatus.passportPhoto.status === 'approved') completed++;
    if (uploadStatus.signature.status === 'approved') completed++;
    return (completed / 2) * 100;
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!canUpload) {
    return (
      <div className="p-8 max-w-4xl mx-auto min-h-[70vh] flex items-center justify-center">
        <Card className="border-none shadow-2xl rounded-[2.5rem] p-12 text-center w-full bg-slate-900 text-white">
          <div className="max-w-md mx-auto space-y-6">
            <div className="w-24 h-24 bg-amber-500/20 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
              <AlertCircle className="w-12 h-12 text-amber-500" />
            </div>
            <div>
              <h2 className="text-3xl font-black mb-2 tracking-tight">Access Restricted</h2>
              <p className="text-slate-400">{uploadReason}</p>
            </div>
            <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-sm text-slate-300 leading-relaxed">
                Only students who have been admitted and transitioned to "fresher" status can upload documents here.
              </p>
            </div>
            <Link href="/admission/claim" className="block mt-4">
              <Button className="px-8 py-6 rounded-2xl w-full bg-indigo-600 hover:bg-indigo-500 font-black text-sm uppercase tracking-widest shadow-lg">
                Back to Admission Hub
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
      {/* Bento Header */}
      <div className="bg-indigo-600 rounded-[2rem] p-8 md:p-10 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-hidden relative">
        <div className="absolute -right-20 -top-20 opacity-10 blur-2xl">
            <UserCheck className="w-96 h-96" />
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-black flex items-center gap-4 italic tracking-tighter">
            FRESHER PORTAL
          </h1>
          <p className="text-indigo-200 font-bold uppercase tracking-widest text-xs mt-3 bg-white/10 w-fit px-4 py-1.5 rounded-full backdrop-blur-md">
            Complete your onboarding documents
          </p>
        </div>
        <div className="relative z-10 flex gap-3">
          <Link href="/fresher/documents">
            <Button className="font-black px-6 py-6 rounded-2xl shadow-lg transition-all flex gap-2 uppercase text-xs tracking-widest bg-white text-indigo-600 hover:bg-slate-50">
              <FileText className="w-4 h-4" />
              Document Center
            </Button>
          </Link>
        </div>
      </div>

      {/* Bento Grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-min">
        
        {/* Progress Overview - Spans all columns */}
        <Card className="border-none shadow-sm rounded-[2rem] p-8 md:col-span-3 bg-white hover:shadow-md transition-shadow">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1 w-full">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Onboarding Progress</h3>
              <p className="text-sm text-slate-500 mt-1">Both documents must be approved to finalize admission.</p>
              <div className="mt-6">
                <Progress value={getProgressPercentage()} className="h-4 rounded-full bg-slate-100" />
              </div>
            </div>
            <div className="text-center bg-slate-50 p-6 rounded-3xl min-w-[200px]">
              <p className="text-5xl font-black text-indigo-600 tracking-tighter">{getProgressPercentage()}%</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Completion Rate</p>
            </div>
          </div>
        </Card>

        {/* Passport Photo Bento */}
        <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden md:col-span-2 group">
          <CardHeader className="bg-slate-900 text-white p-6 relative overflow-hidden">
            <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
                <Camera className="w-40 h-40" />
            </div>
            <CardTitle className="flex items-center gap-3 text-2xl font-black z-10 relative">
              <Camera className="w-6 h-6 text-blue-400" />
              Passport Photograph
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1 space-y-6">
                <div className="text-sm text-slate-600 bg-slate-50 p-5 rounded-2xl">
                  <p className="font-black text-slate-900 mb-3 text-xs uppercase tracking-widest">Requirements:</p>
                  <ul className="space-y-2 text-xs font-medium">
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div> Recent portrait photo</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div> Solid white background</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div> JPEG or PNG (Max 2MB)</li>
                  </ul>
                </div>

                {uploadStatus?.passportPhoto.uploaded ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-5 bg-white border border-slate-100 shadow-sm rounded-2xl">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-slate-50 rounded-xl">
                            {getStatusIcon(uploadStatus.passportPhoto.status)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">Photo Uploaded</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Awaiting Review</p>
                        </div>
                      </div>
                      {getStatusBadge(uploadStatus.passportPhoto.status)}
                    </div>

                    {uploadStatus.passportPhoto.rejectionReason && (
                      <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl">
                        <p className="text-xs text-rose-700 flex gap-2">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          <span className="font-medium"><strong>Rejected:</strong> {uploadStatus.passportPhoto.rejectionReason}</span>
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col justify-center">
                    <input
                      type="file"
                      id="passport-upload"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={(e) => handleFileUpload(e, 'passport_photo')}
                      className="hidden"
                      disabled={uploading}
                    />
                    <Button
                      onClick={() => document.getElementById('passport-upload')?.click()}
                      disabled={uploading}
                      className="w-full h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-md font-black shadow-lg shadow-indigo-200"
                    >
                      {uploading ? (
                        <RefreshCw className="w-5 h-5 mr-3 animate-spin" />
                      ) : (
                        <Upload className="w-5 h-5 mr-3" />
                      )}
                      Upload Passport Photo
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Signature Bento (1 Column) */}
        <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden md:col-span-1 bg-slate-50">
          <CardHeader className="bg-slate-200/50 p-6">
            <CardTitle className="flex items-center gap-3 text-lg font-black text-slate-800">
              <PenTool className="w-5 h-5 text-indigo-600" />
              Digital Signature
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="text-xs text-slate-500 font-medium leading-relaxed">
                Provide a clear scan or photograph of your signature on a plain white paper using black or blue ink.
              </div>

              {uploadStatus?.signature.uploaded ? (
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 p-4 bg-white shadow-sm rounded-2xl">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(uploadStatus.signature.status)}
                      <p className="text-sm font-black text-slate-900">Signature Saved</p>
                    </div>
                    {getStatusBadge(uploadStatus.signature.status)}
                  </div>

                  {uploadStatus.signature.rejectionReason && (
                    <div className="p-3 bg-rose-50 rounded-xl text-xs text-rose-700 font-medium">
                      Rejected: {uploadStatus.signature.rejectionReason}
                    </div>
                  )}

                  {(uploadStatus.signature.status === 'rejected' || !uploadStatus.signature.uploaded) && (
                    <Button
                      onClick={() => document.getElementById('signature-upload')?.click()}
                      disabled={uploading}
                      variant="outline"
                      className="w-full h-12 rounded-xl font-bold"
                    >
                      {uploading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                      Re-upload
                    </Button>
                  )}
                </div>
              ) : (
                <div className="mt-8">
                  <input
                    type="file"
                    id="signature-upload"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={(e) => handleFileUpload(e, 'signature')}
                    className="hidden"
                    disabled={uploading}
                  />
                  <Button
                    onClick={() => document.getElementById('signature-upload')?.click()}
                    disabled={uploading}
                    className="w-full h-14 rounded-xl bg-slate-900 hover:bg-slate-800 font-black shadow-lg"
                  >
                    {uploading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                    Upload Signature
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status Summary Banner */}
        {uploadStatus?.complete && (
          <Card className="border-none shadow-md rounded-[2rem] p-8 md:col-span-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-white/20 rounded-[1.5rem] flex items-center justify-center backdrop-blur-md">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight">Onboarding Complete!</h3>
                  <p className="text-emerald-50 font-medium mt-1">Your documents are approved. Ready for matriculation.</p>
                </div>
              </div>
              <Link href="/student/registration">
                <Button className="bg-white text-emerald-700 hover:bg-slate-50 font-black px-8 py-6 rounded-2xl shadow-lg uppercase tracking-widest text-xs">
                  Proceed to Registration
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
