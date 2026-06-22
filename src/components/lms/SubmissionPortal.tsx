"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
    FileText, 
    Mic, 
    Link as LinkIcon, 
    Cloud, 
    MessageSquare, 
    Upload, 
    CheckCircle, 
    AlertCircle,
    Plus,
    X,
    ExternalLink,
    Loader2
} from "lucide-react";
import FileUploadZone from "./FileUploadZone";
import AudioRecorder from "./AudioRecorder";
import { submitAssignment } from "@/actions/lms";
import { toast } from "sonner";

interface SubmissionPortalProps {
    assignment: any;
    studentId: number;
    submission?: any;
    onSuccess: () => void;
}

export default function SubmissionPortal({ assignment, studentId, submission, onSuccess }: SubmissionPortalProps) {
    const [activeTab, setActiveTab] = useState("upload");
    const [onlineText, setOnlineText] = useState(submission?.onlineText || "");
    const [links, setLinks] = useState<{title: string, url: string}[]>(JSON.parse(submission?.externalLinks || '[]'));
    const [submitting, setSubmitting] = useState(false);
    
    // Cloud Shell State
    const [cloudFile, setCloudFile] = useState<{url: string, type: string} | null>(submission?.cloudFileUrl ? { url: submission.cloudFileUrl, type: submission.cloudFileType } : null);

    const allowedTypes = JSON.parse(assignment.submissionTypes || '["file"]');
    const isClosed = assignment.cutOffDate && new Date() > new Date(assignment.cutOffDate);

    const handleFinalSubmit = async (data: any) => {
        if (isClosed) return;
        setSubmitting(true);
        try {
            const res = await submitAssignment(assignment.id, studentId, {
                ...data,
                // Ensure we don't wipe out other fields if they exist
                onlineText: data.onlineText ?? onlineText,
                externalLinks: data.externalLinks ?? JSON.stringify(links),
                cloudFileUrl: data.cloudFileUrl ?? cloudFile?.url,
                cloudFileType: data.cloudFileType ?? cloudFile?.type,
            });

            if (res.success) {
                toast.success("Assignment submitted successfully!");
                onSuccess();
            } else {
                toast.error((res as any).error || "Failed to submit assignment.");
            }
        } catch (error) {
            toast.error("An error occurred during submission.");
        }
        setSubmitting(false);
    };

    const addLink = () => setLinks([...links, { title: "", url: "" }]);
    const removeLink = (index: number) => setLinks(links.filter((_, i) => i !== index));
    const updateLink = (index: number, patch: any) => {
        const next = [...links];
        next[index] = { ...next[index], ...patch };
        setLinks(next);
    };

    if (isClosed && !submission) {
        return (
            <div className="p-12 bg-rose-50 rounded-2xl border border-rose-100 text-center flex flex-col items-center">
                <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
                <h3 className="text-xl font-bold text-rose-800">Submission Closed</h3>
                <p className="text-rose-600/80 max-w-xs mt-2">The deadline for this assignment has passed and no more submissions are accepted.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-2 bg-slate-50 border-b border-slate-100">
                    <TabsList className="bg-transparent border-none flex flex-wrap justify-start h-auto gap-1">
                        {allowedTypes.includes('file') && (
                            <TabsTrigger value="upload" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                <Upload className="w-4 h-4 mr-2" /> File
                            </TabsTrigger>
                        )}
                        {allowedTypes.includes('text') && (
                            <TabsTrigger value="text" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                <MessageSquare className="w-4 h-4 mr-2" /> Text
                            </TabsTrigger>
                        )}
                        {allowedTypes.includes('audio') && (
                            <TabsTrigger value="audio" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                <Mic className="w-4 h-4 mr-2" /> Audio
                            </TabsTrigger>
                        )}
                        {allowedTypes.includes('link') && (
                            <TabsTrigger value="links" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                <LinkIcon className="w-4 h-4 mr-2" /> Links
                            </TabsTrigger>
                        )}
                        {allowedTypes.includes('cloud') && (
                            <TabsTrigger value="cloud" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                <Cloud className="w-4 h-4 mr-2" /> Cloud
                            </TabsTrigger>
                        )}
                    </TabsList>
                </div>

                <div className="p-8">
                    {/* 1. File Upload */}
                    <TabsContent value="upload" className="m-0 space-y-4">
                        <FileUploadZone 
                            onUpload={async (file) => {
                                // Handled via final submit but we need to track local file or direct upload?
                                // Let's keep existing logic of direct upload on drop for convenience
                                const formData = new FormData();
                                formData.append("file", file);
                                import("@/actions/upload").then(m => m.uploadFile(formData)).then(res => {
                                    if (res.success) handleFinalSubmit({ fileUrl: (res as any).url });
                                    else toast.error("File upload failed");
                                });
                            }}
                            currentUrl={submission?.fileUrl}
                            label="Drag & Drop your assignment file"
                        />
                    </TabsContent>

                    {/* 2. Online Text */}
                    <TabsContent value="text" className="m-0 space-y-4 text-left">
                        <Label className="font-bold text-slate-700">Detailed Text Response</Label>
                        <textarea 
                            className="w-full min-h-[300px] p-6 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm leading-relaxed"
                            placeholder="Type your response here..."
                            value={onlineText}
                            onChange={(e) => setOnlineText(e.target.value)}
                        />
                        <Button 
                            className="w-full h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold"
                            onClick={() => handleFinalSubmit({ onlineText })}
                            disabled={submitting}
                        >
                            {submitting ? <Loader2 className="animate-spin w-4 h-4" /> : "Submit Text Response"}
                        </Button>
                    </TabsContent>

                    {/* 3. Audio Recording */}
                    <TabsContent value="audio" className="m-0">
                        <AudioRecorder onRecordingComplete={(url) => handleFinalSubmit({ audioUrl: url })} />
                    </TabsContent>

                    {/* 4. External Links */}
                    <TabsContent value="links" className="m-0 space-y-4 text-left">
                        <div className="flex items-center justify-between">
                            <Label className="font-bold text-slate-700">Project Links (GitHub, Portfolio, etc.)</Label>
                            <Button variant="outline" size="sm" onClick={addLink} className="h-8 rounded-lg text-indigo-600">
                                <Plus className="w-3.5 h-3.5 mr-1" /> Add Link
                            </Button>
                        </div>
                        <div className="space-y-3">
                            {links.map((link, i) => (
                                <div key={i} className="flex gap-2 items-start animate-in fade-in slide-in-from-top-1 duration-300">
                                    <div className="flex-1 space-y-2">
                                        <Input placeholder="Title (e.g. Repository)" value={link.title} onChange={(e) => updateLink(i, { title: e.target.value })} className="h-9 rounded-xl" />
                                        <Input placeholder="URL (https://...)" value={link.url} onChange={(e) => updateLink(i, { url: e.target.value })} className="h-9 rounded-xl" />
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => removeLink(i)} className="text-slate-400 hover:text-rose-500 mt-1">
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                            {links.length === 0 && (
                                <div className="py-12 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 flex flex-col items-center">
                                    <LinkIcon className="w-8 h-8 opacity-20 mb-2" />
                                    <p className="text-xs font-medium italic">No links added yet.</p>
                                </div>
                            )}
                        </div>
                        <Button 
                            className="w-full h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold mt-4"
                            onClick={() => handleFinalSubmit({ externalLinks: JSON.stringify(links) })}
                            disabled={submitting || links.length === 0}
                        >
                            {submitting ? <Loader2 className="animate-spin w-4 h-4" /> : "Save Project Links"}
                        </Button>
                    </TabsContent>

                    {/* 5. Cloud Pickers (SHELL) */}
                    <TabsContent value="cloud" className="m-0 space-y-6 text-center">
                        <div className="py-8 space-y-4">
                            <p className="text-sm font-medium text-slate-500 mb-6">Import from your preferred cloud storage provider.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-sm mx-auto">
                                <Button 
                                    variant="outline" 
                                    className="h-20 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 hover:border-blue-500 hover:bg-blue-50 group transition-all"
                                    onClick={() => alert("Cloud Picker Shell: Google Drive implementation requires API Key.")}
                                >
                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <Cloud className="w-4 h-4" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase">Google Drive</span>
                                </Button>
                                <Button 
                                    variant="outline" 
                                    className="h-20 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 hover:border-indigo-500 hover:bg-indigo-50 group transition-all"
                                    onClick={() => alert("Cloud Picker Shell: OneDrive implementation requires CLIENT_ID.")}
                                >
                                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                        <Cloud className="w-4 h-4" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase">OneDrive</span>
                                </Button>
                            </div>
                        </div>

                        {cloudFile && (
                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-between text-left">
                                <div className="flex items-center gap-3">
                                    <Cloud className="w-5 h-5 text-blue-500" />
                                    <div>
                                        <p className="text-xs font-bold text-blue-800">Linked Cloud Resource</p>
                                        <p className="text-[10px] text-blue-600 truncate max-w-[180px]">{cloudFile.url}</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setCloudFile(null)} className="text-blue-400">
                                    <X className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        )}
                        
                        <p className="text-[10px] text-slate-400 font-medium italic underline">Note: Cloud pickers are currently in development mode.</p>
                    </TabsContent>
                </div>
            </Tabs>
            
            {submission && (
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                            <CheckCircle className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-emerald-800 uppercase tracking-tighter">Already Submitted</p>
                            <p className="text-[10px] text-emerald-600 font-medium italic">You can update your submission until the deadline.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
