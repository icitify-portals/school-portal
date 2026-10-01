"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
    Camera, Upload, Loader2, Search, CheckCircle2, XCircle,
    User, FileText, RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export default function PhotoCapturePage() {
    const [search, setSearch] = useState("");
    const [students, setStudents] = useState<any[]>([]);
    const [selected, setSelected] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const photoInputRef = useRef<HTMLInputElement>(null);
    const sigInputRef = useRef<HTMLInputElement>(null);

    async function searchStudents() {
        if (!search.trim()) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/ict/student-search?q=${encodeURIComponent(search)}`);
            const data = await res.json();
            setStudents(data.data || []);
        } catch (e) {
            toast.error("Search failed");
        }
        setLoading(false);
    }

    async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!selected || !e.target.files?.[0]) return;
        const file = e.target.files[0];
        setUploading(true);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("studentId", selected.id.toString());
        formData.append("type", "photo");

        try {
            const res = await fetch("/api/admin/ict/upload-photo", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Photo uploaded successfully");
                setSelected({ ...selected, imageUrl: data.url });
            } else {
                toast.error(data.error || "Upload failed");
            }
        } catch (e) {
            toast.error("Upload failed");
        }
        setUploading(false);
    }

    async function handleSignatureUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!selected || !e.target.files?.[0]) return;
        const file = e.target.files[0];
        setUploading(true);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("studentId", selected.id.toString());
        formData.append("type", "signature");

        try {
            const res = await fetch("/api/admin/ict/upload-photo", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Signature uploaded successfully");
                setSelected({ ...selected, signatureUrl: data.url });
            } else {
                toast.error(data.error || "Upload failed");
            }
        } catch (e) {
            toast.error("Upload failed");
        }
        setUploading(false);
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg">
                        <Camera size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Photo & Signature Capture</h1>
                        <p className="text-sm text-slate-500">Upload or recapture student photos and signatures for ID cards</p>
                    </div>
                </div>

                {/* Search */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex gap-4 items-end">
                    <div className="flex-1">
                        <Label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Search Student</Label>
                        <Input
                            placeholder="Name, matric number, or email..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && searchStudents()}
                            className="h-10"
                        />
                    </div>
                    <Button onClick={searchStudents} disabled={loading} className="gap-2">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        Search
                    </Button>
                </div>

                {/* Search Results */}
                {students.length > 0 && !selected && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="p-3 text-left text-xs font-bold text-slate-500 uppercase">Student</th>
                                    <th className="p-3 text-left text-xs font-bold text-slate-500 uppercase">Matric</th>
                                    <th className="p-3 text-left text-xs font-bold text-slate-500 uppercase">Dept</th>
                                    <th className="p-3 text-center text-xs font-bold text-slate-500 uppercase">Photo</th>
                                    <th className="p-3 text-center text-xs font-bold text-slate-500 uppercase">Signature</th>
                                    <th className="p-3 text-center text-xs font-bold text-slate-500 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((s) => (
                                    <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="p-3 text-sm font-medium">{s.name}</td>
                                        <td className="p-3 text-sm font-mono">{s.matricNumber || '-'}</td>
                                        <td className="p-3 text-sm">{s.deptName || '-'}</td>
                                        <td className="p-3 text-center">
                                            {s.imageUrl ? <Badge className="bg-green-100 text-green-700 text-xs">Yes</Badge> : <Badge className="bg-slate-100 text-slate-500 text-xs">No</Badge>}
                                        </td>
                                        <td className="p-3 text-center">
                                            {s.signatureUrl ? <Badge className="bg-green-100 text-green-700 text-xs">Yes</Badge> : <Badge className="bg-slate-100 text-slate-500 text-xs">No</Badge>}
                                        </td>
                                        <td className="p-3 text-center">
                                            <Button size="sm" onClick={() => setSelected(s)} className="gap-1">
                                                <Camera className="w-3 h-3" /> Capture
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Capture Panel */}
                {selected && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">{selected.name}</h2>
                                <p className="text-sm text-slate-500">{selected.matricNumber} • {selected.deptName}</p>
                            </div>
                            <Button variant="outline" onClick={() => setSelected(null)} className="gap-2">
                                <RotateCcw className="w-4 h-4" /> Back to Search
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            {/* Photo */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <User className="w-5 h-5" /> Passport Photo
                                </h3>
                                <div className="w-48 h-64 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center bg-slate-50 overflow-hidden">
                                    {selected.imageUrl ? (
                                        <img src={selected.imageUrl} alt="Student" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center text-slate-400">
                                            <Camera className="w-8 h-8 mx-auto mb-2" />
                                            <p className="text-xs">No photo</p>
                                        </div>
                                    )}
                                </div>
                                <input
                                    ref={photoInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png"
                                    onChange={handlePhotoUpload}
                                    className="hidden"
                                />
                                <Button
                                    onClick={() => photoInputRef.current?.click()}
                                    disabled={uploading}
                                    className="gap-2 w-full"
                                >
                                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                    {selected.imageUrl ? 'Replace Photo' : 'Upload Photo'}
                                </Button>
                            </div>

                            {/* Signature */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <FileText className="w-5 h-5" /> Signature
                                </h3>
                                <div className="w-64 h-32 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center bg-slate-50 overflow-hidden">
                                    {selected.signatureUrl ? (
                                        <img src={selected.signatureUrl} alt="Signature" className="w-full h-full object-contain" />
                                    ) : (
                                        <div className="text-center text-slate-400">
                                            <FileText className="w-8 h-8 mx-auto mb-2" />
                                            <p className="text-xs">No signature</p>
                                        </div>
                                    )}
                                </div>
                                <input
                                    ref={sigInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png"
                                    onChange={handleSignatureUpload}
                                    className="hidden"
                                />
                                <Button
                                    onClick={() => sigInputRef.current?.click()}
                                    disabled={uploading}
                                    variant="outline"
                                    className="gap-2 w-full"
                                >
                                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                    {selected.signatureUrl ? 'Replace Signature' : 'Upload Signature'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}