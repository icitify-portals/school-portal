"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
    Plus, Trash2, FileText, Upload, 
    CheckCircle2, AlertCircle, ArrowRight, ArrowLeft, Loader2, Award
} from "lucide-react";
import { getJournalBySlug, submitArticle } from "@/actions/journal";
import { uploadFile } from "@/actions/upload";

interface Author {
    name: string;
    email: string;
    affiliation: string;
    orcid: string;
    role: "student" | "staff" | "external";
    isCorresponding: boolean;
}

interface Journal {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    issn: string | null;
    logoUrl: string | null;
    contactEmail: string | null;
    managerId: number | null;
    apcAmount: string | null;
    apcCurrency: string | null;
    license: string | null;
    isActive: boolean | null;
    createdAt: Date | null;
}

export default function JournalSubmitPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.journalSlug as string;

    const [journal, setJournal] = useState<Journal | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentStep, setCurrentStep] = useState(1);
    
    // Form States
    const [section, setSection] = useState("Research Article");
    const [license, setLicense] = useState("CC BY 4.0");
    const [funding, setFunding] = useState("");
    const [conflictOfInterest, setConflictOfInterest] = useState("");
    
    const [authors, setAuthors] = useState<Author[]>([
        { name: "", email: "", affiliation: "", orcid: "", role: "student", isCorresponding: true }
    ]);
    
    const [title, setTitle] = useState("");
    const [abstract, setAbstract] = useState("");
    const [keywords, setKeywords] = useState("");
    
    const [fileUrl, setFileUrl] = useState("");
    const [fileName, setFileName] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Validation Errors
    const [errors, setErrors] = useState<string[]>([]);
    const [warnings, setWarnings] = useState<string[]>([]);

    useEffect(() => {
        const fetchJournal = async () => {
            const jData = await getJournalBySlug(slug);
            if (jData) {
                setJournal(jData as unknown as Journal);
            }
            setIsLoading(false);
        };
        fetchJournal();
    }, [slug]);

    // Helpers
    const getAbstractWordCount = () => {
        if (!abstract.trim()) return 0;
        return abstract.trim().split(/\s+/).length;
    };

    const getKeywordsCount = () => {
        if (!keywords.trim()) return 0;
        return keywords.split(",").map(k => k.trim()).filter(Boolean).length;
    };

    const isTitleSentenceCase = () => {
        if (!title) return true;
        // Check if entire title is uppercase
        if (title === title.toUpperCase() && title.length > 10) return false;
        return true;
    };

    // Form Navigation & Validation
    const validateStep = (step: number) => {
        const stepErrors: string[] = [];
        const stepWarnings: string[] = [];

        if (step === 1) {
            if (!section) stepErrors.push("Please select a journal section.");
            if (!license) stepErrors.push("Please choose a Creative Commons license type.");
        }

        if (step === 2) {
            authors.forEach((auth, idx) => {
                if (!auth.name.trim()) stepErrors.push(`Author ${idx + 1} Name is required.`);
                if (!auth.email.trim()) {
                    stepErrors.push(`Author ${idx + 1} Email is required.`);
                } else if (!/\S+@\S+\.\S+/.test(auth.email)) {
                    stepErrors.push(`Author ${idx + 1} Email has an invalid format.`);
                }
                if (!auth.affiliation.trim()) stepErrors.push(`Author ${idx + 1} Affiliation/Institution is required.`);
                if (auth.orcid.trim() && !/^\d{4}-\d{4}-\d{4}-\d{3}[0-9X]$/.test(auth.orcid.trim())) {
                    stepWarnings.push(`Author ${idx + 1} ORCID ID might be invalid (format should be XXXX-XXXX-XXXX-XXXX).`);
                }
            });

            const correspondingCount = authors.filter(a => a.isCorresponding).length;
            if (correspondingCount === 0) {
                stepErrors.push("Please mark at least one author as the corresponding author.");
            }
        }

        if (step === 3) {
            if (!title.trim()) {
                stepErrors.push("Article Title is required.");
            } else if (!isTitleSentenceCase()) {
                stepWarnings.push("Article Title is in ALL CAPS. Titles should typically be in Sentence Case.");
            }

            const wordCount = getAbstractWordCount();
            if (wordCount < 150 || wordCount > 500) {
                stepErrors.push(`Abstract must be between 150 and 500 words. Current count: ${wordCount} words.`);
            }

            const kwCount = getKeywordsCount();
            if (kwCount < 5 || kwCount > 10) {
                stepErrors.push(`Keywords count must be between 5 and 10. Current count: ${kwCount}.`);
            }
        }

        if (step === 4) {
            if (!fileUrl) {
                stepErrors.push("Please upload your manuscript file (PDF format required).");
            }
        }

        setErrors(stepErrors);
        setWarnings(stepWarnings);
        return stepErrors.length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => prev + 1);
            setErrors([]);
            setWarnings([]);
        }
    };

    const handleBack = () => {
        setCurrentStep(prev => prev - 1);
        setErrors([]);
        setWarnings([]);
    };

    // File Upload Handler
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        if (selectedFile.type !== "application/pdf") {
            setErrors(["Only PDF files are accepted for manuscript review."]);
            return;
        }

        setIsUploading(true);
        setErrors([]);

        const formData = new FormData();
        formData.append("file", selectedFile);

        const uploadRes = await uploadFile(formData, "journals");
        setIsUploading(false);

        if (uploadRes.success && uploadRes.url) {
            setFileUrl(uploadRes.url);
            setFileName(selectedFile.name);
        } else {
            setErrors([uploadRes.error || "File upload failed. Please try again."]);
        }
    };

    // Author Dynamic Handlers
    const addAuthor = () => {
        setAuthors(prev => [
            ...prev,
            { name: "", email: "", affiliation: "", orcid: "", role: "student", isCorresponding: false }
        ]);
    };

    const removeAuthor = (index: number) => {
        setAuthors(prev => prev.filter((_, i) => i !== index));
    };

    const updateAuthorField = (index: number, field: keyof Author, value: string | boolean) => {
        setAuthors(prev => prev.map((auth, i) => {
            if (i !== index) return auth;
            
            // If setting corresponding, unset all others
            if (field === "isCorresponding" && value === true) {
                return { ...auth, [field]: value as unknown as never };
            }
            return { ...auth, [field]: value as unknown as never };
        }));
        
        if (field === "isCorresponding" && value === true) {
            setAuthors(prev => prev.map((auth, i) => i === index ? auth : { ...auth, isCorresponding: false }));
        }
    };

    // Submit Action
    const handleSubmit = async () => {
        if (!validateStep(currentStep)) return;
        if (!journal) return;

        setIsSubmitting(true);
        
        const payload = {
            journalId: journal.id,
            title,
            abstract,
            keywords,
            funding: funding || undefined,
            conflictOfInterest: conflictOfInterest || undefined,
            section,
            authors: authors.map(a => ({
                name: a.name,
                email: a.email,
                affiliation: a.affiliation,
                orcid: a.orcid || undefined,
                isCorresponding: a.isCorresponding
            })),
            files: [
                {
                    fileUrl,
                    fileName,
                    fileType: "manuscript" as const
                }
            ]
        };

        const res = await submitArticle(payload);
        setIsSubmitting(false);

        if (res.success) {
            setCurrentStep(6); // Success screen
        } else {
            setErrors([res.error || "Manuscript submission failed. Please try again."]);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
            </div>
        );
    }

    if (!journal) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold">Journal not found</h2>
                <Button variant="link" onClick={() => router.push("/journal")}>
                    Back to journals
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-12 px-4 space-y-8 min-h-screen">
            {/* Header */}
            <div className="space-y-4 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3">
                    <Award className="h-8 w-8 text-indigo-600 animate-bounce" />
                    <span className="text-xs font-black tracking-widest uppercase text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 rounded-full">
                        Manuscript Submission Portal
                    </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none text-slate-900 dark:text-slate-100">
                    Submit to <span className="text-indigo-600">{journal.name}</span>
                </h1>
                <p className="text-slate-500 font-medium italic text-lg">
                    Index-compliant indexing workflow supporting Google Scholar, Crossref, and Scopus metadata schemas.
                </p>
            </div>

            {/* Stepper progress */}
            <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t-2 border-slate-150 dark:border-slate-800"></div>
                </div>
                <div className="relative flex justify-between">
                    {[1, 2, 3, 4, 5].map((step) => (
                        <div key={step} className="flex flex-col items-center">
                            <span className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${
                                currentStep === step 
                                ? "bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-600/30 scale-110" 
                                : currentStep > step 
                                ? "bg-emerald-500 border-emerald-500 text-white" 
                                : "bg-white dark:bg-slate-900 border-slate-200 text-slate-400"
                            }`}>
                                {currentStep > step ? <CheckCircle2 className="h-5 w-5" /> : step}
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-2 hidden sm:inline">
                                {step === 1 && "Scope"}
                                {step === 2 && "Authors"}
                                {step === 3 && "Metadata"}
                                {step === 4 && "Manuscript"}
                                {step === 5 && "Review"}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Step Content */}
            <Card className="border-none shadow-2xl shadow-indigo-500/5 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-[32px]">
                <CardContent className="p-8 space-y-6">
                    {/* Error and Warning displays */}
                    {errors.length > 0 && (
                        <Alert variant="destructive" className="rounded-2xl border-red-200 bg-red-50/50">
                            <AlertCircle className="h-5 w-5" />
                            <AlertTitle className="font-bold">Errors found in validation</AlertTitle>
                            <AlertDescription>
                                <ul className="list-disc pl-4 mt-2 space-y-1">
                                    {errors.map((err, i) => <li key={i} className="text-sm font-medium">{err}</li>)}
                                </ul>
                            </AlertDescription>
                        </Alert>
                    )}

                    {warnings.length > 0 && (
                        <Alert className="rounded-2xl border-amber-200 bg-amber-50/50 text-amber-800 dark:text-amber-300">
                            <AlertCircle className="h-5 w-5 text-amber-600" />
                            <AlertTitle className="font-bold">Submission warnings</AlertTitle>
                            <AlertDescription>
                                <ul className="list-disc pl-4 mt-2 space-y-1">
                                    {warnings.map((warn, i) => <li key={i} className="text-sm font-medium">{warn}</li>)}
                                </ul>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* STEP 1: SCOPE */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-black border-l-4 border-indigo-600 pl-4 uppercase tracking-tighter">Step 1: Section, License & Compliance</h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Journal Section / Category</label>
                                    <select 
                                        className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white dark:bg-slate-800 font-medium"
                                        value={section} 
                                        onChange={(e) => setSection(e.target.value)}
                                    >
                                        <option value="Research Article">Research Article</option>
                                        <option value="Review Article">Review Article</option>
                                        <option value="Short Communication">Short Communication</option>
                                        <option value="Case Study">Case Study</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Open Access License Type</label>
                                    <select 
                                        className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white dark:bg-slate-800 font-medium"
                                        value={license} 
                                        onChange={(e) => setLicense(e.target.value)}
                                    >
                                        <option value="CC BY 4.0">Creative Commons Attribution (CC BY 4.0)</option>
                                        <option value="CC BY-NC 4.0">Creative Commons Attribution-NonCommercial (CC BY-NC 4.0)</option>
                                        <option value="CC BY-ND 4.0">Creative Commons Attribution-NoDerivs (CC BY-ND 4.0)</option>
                                        <option value="CC BY-SA 4.0">Creative Commons Attribution-ShareAlike (CC BY-SA 4.0)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Funding Information (Optional but recommended for Crossref)</label>
                                <Textarea 
                                    placeholder="Include agency name, grant numbers, e.g., 'Supported by TETFund Research Grant #FSS-2026-09'."
                                    value={funding}
                                    onChange={(e) => setFunding(e.target.value)}
                                    className="rounded-xl border-slate-200 p-4"
                                    rows={3}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Conflict of Interest Statement</label>
                                <Textarea 
                                    placeholder="Declare any potential conflicts, or state: 'The authors declare no conflict of interest.'"
                                    value={conflictOfInterest}
                                    onChange={(e) => setConflictOfInterest(e.target.value)}
                                    className="rounded-xl border-slate-200 p-4"
                                    rows={3}
                                />
                            </div>
                        </div>
                    )}

                    {/* STEP 2: AUTHORS */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-black border-l-4 border-indigo-600 pl-4 uppercase tracking-tighter">Step 2: Authors & Affiliations</h2>
                                <Button 
                                    onClick={addAuthor}
                                    variant="outline" 
                                    className="rounded-xl border-indigo-200 text-indigo-600 font-bold hover:bg-indigo-50"
                                >
                                    <Plus className="mr-1.5 h-4 w-4" /> Add Author
                                </Button>
                            </div>

                            <div className="space-y-6">
                                {authors.map((auth, idx) => (
                                    <Card key={idx} className="border border-slate-100 rounded-2xl relative shadow-none">
                                        <CardHeader className="p-4 bg-slate-50 dark:bg-slate-900 border-b flex flex-row justify-between items-center rounded-t-2xl">
                                            <span className="text-sm font-black text-slate-500 uppercase tracking-widest">
                                                Author #{idx + 1} {auth.isCorresponding && <Badge className="ml-2 bg-emerald-600 text-white font-bold">Corresponding Author</Badge>}
                                            </span>
                                            {authors.length > 1 && (
                                                <Button 
                                                    onClick={() => removeAuthor(idx)}
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </CardHeader>
                                        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
                                                <Input 
                                                    placeholder="Dr. John Doe"
                                                    value={auth.name}
                                                    onChange={(e) => updateAuthorField(idx, "name", e.target.value)}
                                                    className="rounded-lg"
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-slate-500 uppercase">Email Address</label>
                                                <Input 
                                                    placeholder="john.doe@institution.edu"
                                                    type="email"
                                                    value={auth.email}
                                                    onChange={(e) => updateAuthorField(idx, "email", e.target.value)}
                                                    className="rounded-lg"
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-slate-500 uppercase">Affiliation / Institution</label>
                                                <Input 
                                                    placeholder="Department of Statistics, University of Lagos, Nigeria"
                                                    value={auth.affiliation}
                                                    onChange={(e) => updateAuthorField(idx, "affiliation", e.target.value)}
                                                    className="rounded-lg"
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-slate-500 uppercase">ORCID iD (Optional)</label>
                                                <Input 
                                                    placeholder="0000-0002-1825-0097"
                                                    value={auth.orcid}
                                                    onChange={(e) => updateAuthorField(idx, "orcid", e.target.value)}
                                                    className="rounded-lg"
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-slate-500 uppercase">Affiliation Status</label>
                                                <select 
                                                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white dark:bg-slate-800 font-medium text-sm"
                                                    value={auth.role} 
                                                    onChange={(e) => updateAuthorField(idx, "role", e.target.value)}
                                                >
                                                    <option value="student">Student (Inside Academia)</option>
                                                    <option value="staff">Academic Staff (Inside Academia)</option>
                                                    <option value="external">External Researcher (Outside Academia)</option>
                                                </select>
                                            </div>

                                            <div className="flex items-center space-x-2 pt-4">
                                                <input 
                                                    type="checkbox"
                                                    id={`corr-${idx}`}
                                                    checked={auth.isCorresponding}
                                                    onChange={(e) => updateAuthorField(idx, "isCorresponding", e.target.checked)}
                                                    className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                                                />
                                                <label htmlFor={`corr-${idx}`} className="text-xs font-bold text-slate-600 cursor-pointer">
                                                    Mark as Corresponding Author
                                                </label>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STEP 3: METADATA */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-black border-l-4 border-indigo-600 pl-4 uppercase tracking-tighter">Step 3: Manuscript Title & Abstract</h2>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Article Title (Sentence Case is required, not ALL CAPS)</label>
                                <Input 
                                    placeholder="An empirical analysis of agricultural production using time series models"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="rounded-xl h-12 text-md"
                                />
                                <span className="text-[10px] font-bold text-slate-400 italic">
                                    {"Avoid using excessive capitalization. For example, use 'Time series' instead of 'TIME SERIES'."}
                                </span>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Abstract (150 to 500 words limit)</label>
                                    <span className={`text-xs font-black ${
                                        getAbstractWordCount() >= 150 && getAbstractWordCount() <= 500 
                                        ? "text-emerald-600" 
                                        : "text-red-500"
                                    }`}>
                                        {getAbstractWordCount()} / 500 words (Min 150)
                                    </span>
                                </div>
                                <Textarea 
                                    placeholder="Type or paste your abstract here. A standard scientific abstract should clearly communicate the study objectives, methodology, research findings, and conclusions."
                                    value={abstract}
                                    onChange={(e) => setAbstract(e.target.value)}
                                    className="rounded-xl border-slate-200 p-4 font-serif text-md"
                                    rows={10}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Keywords (5 to 10 keywords, comma-separated)</label>
                                    <span className={`text-xs font-black ${
                                        getKeywordsCount() >= 5 && getKeywordsCount() <= 10 
                                        ? "text-emerald-600" 
                                        : "text-red-500"
                                    }`}>
                                        {getKeywordsCount()} / 10 keywords (Min 5)
                                    </span>
                                </div>
                                <Input 
                                    placeholder="time series, forecasting, agricultural yield, ARIMA models, macroeconomic indicators"
                                    value={keywords}
                                    onChange={(e) => setKeywords(e.target.value)}
                                    className="rounded-xl"
                                />
                            </div>
                        </div>
                    )}

                    {/* STEP 4: MANUSCRIPT UPLOAD */}
                    {currentStep === 4 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-black border-l-4 border-indigo-600 pl-4 uppercase tracking-tighter">Step 4: Upload Manuscript File</h2>

                            <div className="border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[32px] p-12 text-center hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all flex flex-col items-center justify-center gap-4 relative group">
                                <input 
                                    type="file" 
                                    accept=".pdf" 
                                    onChange={handleFileUpload} 
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    disabled={isUploading}
                                />
                                {isUploading ? (
                                    <>
                                        <Loader2 className="h-16 w-16 text-indigo-600 animate-spin" />
                                        <p className="text-lg font-bold">Uploading file to secure portal storage...</p>
                                    </>
                                ) : fileUrl ? (
                                    <>
                                        <div className="h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center">
                                            <FileText className="h-10 w-10 text-emerald-600" />
                                        </div>
                                        <div>
                                            <p className="text-xl font-black text-slate-800 dark:text-slate-100">{fileName}</p>
                                            <p className="text-sm font-medium text-emerald-600">File uploaded and verified successfully.</p>
                                        </div>
                                        <Button variant="outline" className="rounded-xl border-red-200 text-red-500 hover:bg-red-50 font-bold relative z-10" onClick={() => { setFileUrl(""); setFileName(""); }}>
                                            Replace File
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <div className="h-24 w-24 bg-indigo-50 dark:bg-indigo-950/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Upload className="h-12 w-12 text-indigo-600" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xl font-black">Drag and drop your manuscript PDF here</p>
                                            <p className="text-slate-400 font-bold text-sm">or click to browse local files</p>
                                        </div>
                                        <Badge variant="outline" className="border-slate-300 font-black text-[10px] tracking-widest uppercase">
                                            Only PDF documents (.pdf) accepted
                                        </Badge>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* STEP 5: REVIEW & TERMS */}
                    {currentStep === 5 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-black border-l-4 border-indigo-600 pl-4 uppercase tracking-tighter">Step 5: Review & Submit</h2>

                            <Card className="border border-slate-100 rounded-2xl p-6 bg-slate-50/50 shadow-none">
                                <div className="space-y-4">
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Title</span>
                                        <h3 className="text-xl font-black text-slate-900 leading-tight">{title}</h3>
                                    </div>

                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Authors</span>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {authors.map((a, i) => (
                                                <Badge key={i} variant="secondary" className="px-3 py-1 font-bold">
                                                    {a.name} ({a.role}) {a.isCorresponding && "✉"}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Section</span>
                                            <p className="font-bold">{section}</p>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">License</span>
                                            <p className="font-bold">{license}</p>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Manuscript file</span>
                                            <p className="font-bold text-indigo-600 truncate">{fileName}</p>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <div className="border border-indigo-100 rounded-2xl p-6 bg-indigo-50/20 space-y-4">
                                <h3 className="font-black text-indigo-900">Submission Declaration & Terms</h3>
                                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                    By clicking Submit, I declare that the manuscript has not been published previously and is not under consideration for publication elsewhere. I certify that all co-authors have approved the content and submission of the manuscript. I grant the journal the right of first publication under the selected license.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* SUCCESS SCREEN */}
                    {currentStep === 6 && (
                        <div className="py-12 text-center space-y-6 flex flex-col items-center justify-center">
                            <div className="h-24 w-24 bg-emerald-100 dark:bg-emerald-950/20 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/10">
                                <CheckCircle2 className="h-14 w-14 text-emerald-600" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-3xl font-black text-slate-900">Manuscript Submitted Successfully!</h2>
                                <p className="text-slate-500 max-w-lg mx-auto font-medium leading-relaxed italic">
                                    Your manuscript has been logged into the peer-review database. The editorial desk has been notified and double-blind review workflow processes are active.
                                </p>
                            </div>
                            <div className="pt-4 flex gap-4">
                                <Button className="bg-indigo-600 hover:bg-indigo-700 rounded-xl px-8 h-12 font-black" onClick={() => router.push(`/journal/${slug}`)}>
                                    Back to Journal Landing Page
                                </Button>
                                <Button variant="outline" className="rounded-xl border-slate-200 h-12 font-bold" onClick={() => router.push("/journal")}>
                                    View Other Journals
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Controls */}
                    {currentStep <= 5 && (
                        <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-6">
                            {currentStep > 1 ? (
                                <Button variant="ghost" onClick={handleBack} className="rounded-xl px-6 font-bold" disabled={isSubmitting}>
                                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                                </Button>
                            ) : (
                                <div></div>
                            )}

                            {currentStep < 5 ? (
                                <Button onClick={handleNext} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl px-8 font-black shadow-lg shadow-indigo-500/10">
                                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            ) : (
                                <Button 
                                    onClick={handleSubmit} 
                                    className="bg-indigo-600 hover:bg-indigo-700 rounded-xl px-8 h-12 font-black shadow-xl shadow-indigo-500/20"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                                        </>
                                    ) : (
                                        "Submit Manuscript"
                                    )}
                                </Button>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
