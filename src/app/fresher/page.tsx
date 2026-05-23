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
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!canUpload) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <Card className="border-none shadow-xl rounded-[2.5rem] p-8 text-center">
          <div className="max-w-md mx-auto space-y-6">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-10 h-10 text-amber-600" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">Access Restricted</h2>
              <p className="text-slate-600">{uploadReason}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl">
              <p className="text-sm text-slate-600">
                Only students who have been admitted and transitioned to "fresher" status can upload documents.
              </p>
            </div>
            <Link href="/admission/claim">
              <Button className="px-8 py-4 rounded-2xl">
                Back to Admission
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4 italic">
            <UserCheck className="w-10 h-10 text-indigo-600" />
            FRESHER PORTAL
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">
            Complete your profile by uploading required documents
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/fresher/documents">
            <Button className="font-black px-6 py-6 rounded-2xl shadow-lg transition-all flex gap-3 uppercase text-xs tracking-widest bg-indigo-600 hover:bg-indigo-700 text-white">
              <FileText className="w-5 h-5" />
              Document Center
            </Button>
          </Link>
        </div>
      </div>

      {/* Progress Overview */}
      <Card className="border-none shadow-xl rounded-[2.5rem] p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-black text-slate-900">Document Upload Progress</h3>
            <p className="text-sm text-slate-600 mt-1">Complete all required documents to finalize your admission</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-indigo-600">{getProgressPercentage()}%</p>
            <p className="text-xs text-slate-500 uppercase tracking-widest">Complete</p>
          </div>
        </div>
        <Progress value={getProgressPercentage()} className="h-3" />
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              uploadStatus?.passportPhoto.status === 'approved' ? "bg-emerald-100 text-emerald-600" :
                uploadStatus?.passportPhoto.status === 'rejected' ? "bg-rose-100 text-rose-600" :
                  uploadStatus?.passportPhoto.status === 'pending' ? "bg-amber-100 text-amber-600" :
                    "bg-slate-100 text-slate-400"
            )}>
              {getStatusIcon(uploadStatus?.passportPhoto.status || 'not_uploaded')}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Passport Photo</p>
              <p className="text-xs text-slate-500">{uploadStatus?.passportPhoto.status || 'Not uploaded'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              uploadStatus?.signature.status === 'approved' ? "bg-emerald-100 text-emerald-600" :
                uploadStatus?.signature.status === 'rejected' ? "bg-rose-100 text-rose-600" :
                  uploadStatus?.signature.status === 'pending' ? "bg-amber-100 text-amber-600" :
                    "bg-slate-100 text-slate-400"
            )}>
              {getStatusIcon(uploadStatus?.signature.status || 'not_uploaded')}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Signature</p>
              <p className="text-xs text-slate-500">{uploadStatus?.signature.status || 'Not uploaded'}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Document Upload Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Passport Photo */}
        <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <CardTitle className="flex items-center gap-3">
              <Camera className="w-5 h-5" />
              Passport Photograph
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="text-sm text-slate-600">
                <p className="font-bold mb-2">Requirements:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Recent passport-sized photograph</li>
                  <li>• White background</li>
                  <li>• Clear face visibility</li>
                  <li>• JPEG or PNG format</li>
                  <li>• Maximum file size: 2MB</li>
                </ul>
              </div>

              {uploadStatus?.passportPhoto.uploaded ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(uploadStatus.passportPhoto.status)}
                      <div>
                        <p className="text-sm font-bold text-slate-900">Passport Photo</p>
                        <p className="text-xs text-slate-500">Uploaded successfully</p>
                      </div>
                    </div>
                    {getStatusBadge(uploadStatus.passportPhoto.status)}
                  </div>

                  {uploadStatus.passportPhoto.rejectionReason && (
                    <div className="p-3 bg-rose-50 rounded-xl">
                      <p className="text-xs text-rose-700">
                        <strong>Rejection Reason:</strong> {uploadStatus.passportPhoto.rejectionReason}
                      </p>
                    </div>
                  )}

                  {uploadStatus.passportPhoto.url && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="w-4 h-4 mr-2" /> Preview
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Download className="w-4 h-4 mr-2" /> Download
                      </Button>
                    </div>
                  )}

                  {(uploadStatus.passportPhoto.status === 'rejected' || !uploadStatus.passportPhoto.uploaded) && (
                    <div>
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
                        className="w-full"
                      >
                        {uploading ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 mr-2" />
                        )}
                        {uploadStatus.passportPhoto.status === 'rejected' ? 'Re-upload Photo' : 'Upload Photo'}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div>
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
                    className="w-full"
                  >
                    {uploading ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Upload Passport Photo
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Signature */}
        <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <CardTitle className="flex items-center gap-3">
              <PenTool className="w-5 h-5" />
              Signature
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="text-sm text-slate-600">
                <p className="font-bold mb-2">Requirements:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Clear signature on white background</li>
                  <li>• Black or dark blue ink</li>
                  <li>• Proper size and clarity</li>
                  <li>• JPEG or PNG format</li>
                  <li>• Maximum file size: 2MB</li>
                </ul>
              </div>

              {uploadStatus?.signature.uploaded ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(uploadStatus.signature.status)}
                      <div>
                        <p className="text-sm font-bold text-slate-900">Signature</p>
                        <p className="text-xs text-slate-500">Uploaded successfully</p>
                      </div>
                    </div>
                    {getStatusBadge(uploadStatus.signature.status)}
                  </div>

                  {uploadStatus.signature.rejectionReason && (
                    <div className="p-3 bg-rose-50 rounded-xl">
                      <p className="text-xs text-rose-700">
                        <strong>Rejection Reason:</strong> {uploadStatus.signature.rejectionReason}
                      </p>
                    </div>
                  )}

                  {uploadStatus.signature.url && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="w-4 h-4 mr-2" /> Preview
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Download className="w-4 h-4 mr-2" /> Download
                      </Button>
                    </div>
                  )}

                  {(uploadStatus.signature.status === 'rejected' || !uploadStatus.signature.uploaded) && (
                    <div>
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
                        className="w-full"
                      >
                        {uploading ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 mr-2" />
                        )}
                        {uploadStatus.signature.status === 'rejected' ? 'Re-upload Signature' : 'Upload Signature'}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div>
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
                    className="w-full"
                  >
                    {uploading ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Upload Signature
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Summary */}
      {uploadStatus?.complete && (
        <Card className="border-none shadow-xl rounded-[2.5rem] p-8 bg-emerald-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black text-emerald-900">Documents Complete!</h3>
              <p className="text-emerald-700">Your documents have been approved. You can now proceed with registration.</p>
            </div>
          </div>
          <div className="mt-6">
            <Link href="/student/registration">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Proceed to Registration
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
