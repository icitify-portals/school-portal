"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { uploadHealthReport } from "@/actions/health";
import { Loader2, UploadCloud } from "lucide-react";

export default function HealthReportUploadForm({ studentId }: { studentId: number }) {
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState("");
    const [type, setType] = useState<'xray' | 'blood_test' | 'eye_test' | 'other'>('other');
    const [description, setDescription] = useState("");
    const [fileUrl, setFileUrl] = useState("");
    const [isUploadingFile, setIsUploadingFile] = useState(false);

    // Mock file upload to generate a URL since actual uploadthing isn't verified in this environment
    const handleMockUpload = () => {
        setIsUploadingFile(true);
        setTimeout(() => {
            setFileUrl(`https://example.com/mock-upload/health-report-${Date.now()}.pdf`);
            setIsUploadingFile(false);
        }, 1500);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fileUrl) return;
        setLoading(true);
        const res = await uploadHealthReport({
            studentId,
            title,
            type,
            fileUrl,
            description
        });
        if (res.success) {
            setTitle("");
            setDescription("");
            setFileUrl("");
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Report Title</label>
                <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Chest X-Ray Results" className="w-full border border-slate-200 rounded-lg h-10 px-3 bg-slate-50 text-sm" />
            </div>

            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Report Type</label>
                <select value={type} onChange={e => setType(e.target.value as any)} className="w-full border border-slate-200 rounded-lg h-10 px-3 bg-slate-50 text-sm">
                    <option value="xray">X-Ray</option>
                    <option value="blood_test">Blood Test</option>
                    <option value="eye_test">Eye Test</option>
                    <option value="other">Other Medical Report</option>
                </select>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Description (Optional)</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief summary of the report..." className="w-full border border-slate-200 rounded-lg p-3 bg-slate-50 text-sm h-20" />
            </div>

            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Document File</label>
                {!fileUrl ? (
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer" onClick={handleMockUpload}>
                        {isUploadingFile ? <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-500" /> : <UploadCloud className="w-6 h-6 mx-auto text-slate-400" />}
                        <p className="mt-2 text-xs font-medium text-slate-500">{isUploadingFile ? "Uploading..." : "Click to mock upload file"}</p>
                    </div>
                ) : (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex justify-between items-center">
                        <span className="text-xs text-emerald-700 font-medium truncate max-w-[200px]">{fileUrl.split('/').pop()}</span>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setFileUrl("")} className="text-emerald-700 h-6">Clear</Button>
                    </div>
                )}
            </div>

            <Button type="submit" disabled={loading || !fileUrl} className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold h-11">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Submit Report"}
            </Button>
        </form>
    );
}
