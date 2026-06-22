"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, FileText, Download, CheckCircle2, AlertCircle, MessageSquare, Star } from "lucide-react";
import { getArticleById } from "@/actions/journal";
import { toast } from "sonner";

export default function ReviewerWorkspace() {
    const params = useParams();
    const articleId = params.articleId as string;
    
    const [article, setArticle] = useState<any>(null);
    const [recommendation, setRecommendation] = useState<string>("");
    const [commentsAuthor, setCommentsAuthor] = useState("");
    const [commentsEditor, setCommentsEditor] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchArticle = async () => {
            const data = await getArticleById(parseInt(articleId));
            setArticle(data);
        };
        fetchArticle();
    }, [articleId]);

    const handleSubmit = async () => {
        if (!recommendation) return toast.error("Please select a recommendation");
        setIsSubmitting(true);
        // await submitReview(...) - To be implemented
        toast.success("Review submitted successfully!");
        setIsSubmitting(false);
    };

    if (!article) return <div className="p-20 text-center font-black italic text-indigo-600 animate-pulse">Initializing Workspace...</div>;

    return (
        <div className="max-w-[1600px] w-full mx-auto py-10 px-4">
            <div className="flex flex-col md:flex-row gap-10 items-start">
                {/* Left Side: Article Preview */}
                <div className="flex-1 space-y-8">
                    <div className="space-y-4">
                         <Badge className="bg-indigo-600 px-4 py-1 rounded-full font-black uppercase text-[10px]">Review Assignment</Badge>
                         <h1 className="text-4xl font-black tracking-tight text-slate-900 leading-tight">{article.title}</h1>
                         <p className="text-slate-500 italic font-medium leading-relaxed">{article.abstract}</p>
                    </div>

                    <Card className="border-none shadow-2xl shadow-indigo-100 bg-white rounded-[40px] overflow-hidden">
                        <CardHeader className="bg-slate-900 text-white p-8">
                            <CardTitle className="text-xl font-black flex items-center">
                                <FileText className="mr-3 h-5 w-5 text-indigo-400" /> Manuscript Files
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            {article.files?.map((file: any) => (
                                <div key={file.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl group hover:bg-indigo-50 transition-colors">
                                    <div className="flex items-center">
                                        <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center mr-4 shadow-sm">
                                            <FileText className="text-indigo-600 h-6 w-6" />
                                        </div>
                                        <div>
                                            <div className="font-black text-slate-900">{file.fileName || "Main Manuscript"}</div>
                                            <div className="text-xs font-bold text-slate-400 uppercase">{file.fileType}</div>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                        <Download className="h-5 w-5" />
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Side: Review Form */}
                <div className="w-full md:w-[450px] sticky top-10">
                    <Card className="border-none shadow-2xl shadow-slate-200 bg-slate-50 rounded-[40px] p-8 space-y-8">
                        <div className="space-y-2">
                             <h2 className="text-2xl font-black text-slate-900">Your Evaluation</h2>
                             <p className="text-sm font-bold text-slate-400 italic">Please provide your scholarly feedback below.</p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <Label className="text-xs font-black uppercase tracking-widest text-indigo-600">Reviewer Recommendation</Label>
                                <Select onValueChange={setRecommendation}>
                                    <SelectTrigger className="h-14 rounded-2xl border-none shadow-sm bg-white font-bold text-slate-700">
                                        <SelectValue placeholder="Select outcome..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                                        <SelectItem value="accept" className="font-bold py-3">Accept Submission</SelectItem>
                                        <SelectItem value="minor_revisions" className="font-bold py-3 text-amber-600">Minor Revisions</SelectItem>
                                        <SelectItem value="major_revisions" className="font-bold py-3 text-orange-600">Major Revisions</SelectItem>
                                        <SelectItem value="resubmit" className="font-bold py-3 text-blue-600">Resubmit for Review</SelectItem>
                                        <SelectItem value="decline" className="font-bold py-3 text-rose-600">Decline Submission</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-xs font-black uppercase tracking-widest text-indigo-600">Comments for Authors</Label>
                                <Textarea 
                                    className="min-h-[150px] rounded-2xl border-none shadow-sm bg-white p-6 font-medium italic"
                                    placeholder="Constructive feedback for the researchers..."
                                    value={commentsAuthor}
                                    onChange={(e) => setCommentsAuthor(e.target.value)}
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="text-xs font-black uppercase tracking-widest text-indigo-600">Confidential Comments for Editor</Label>
                                <Textarea 
                                    className="min-h-[100px] rounded-2xl border-none shadow-sm bg-white p-6 font-medium italic"
                                    placeholder="Internal notes not visible to authors..."
                                    value={commentsEditor}
                                    onChange={(e) => setCommentsEditor(e.target.value)}
                                />
                            </div>

                            <Button 
                                className="w-full h-16 bg-slate-900 hover:bg-black rounded-2xl text-lg font-black shadow-xl shrink-0"
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                            >
                                <CheckCircle2 className="mr-2 h-5 w-5 text-indigo-400" /> {isSubmitting ? "Submitting..." : "Complete Review"}
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
