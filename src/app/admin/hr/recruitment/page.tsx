"use client";

import { useState, useEffect } from "react";
import {
    Briefcase,
    Users,
    FileText,
    Plus,
    Search,
    Filter,
    ChevronRight,
    Loader2,
    CheckCircle,
    XCircle,
    Clock,
    UserCheck,
    Mail,
    Sparkles,
    Bot,
    Target,
    BarChart3
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    getJobVacancies,
    postJobVacancy,
    getApplicants,
    updateApplicantStatus
} from "@/actions/hr_recruitment";
import { getDepartments } from "@/actions/departments";
import { generateJobDescription, analyzeCandidate } from "@/actions/ai";
import { cn } from "@/lib/utils";

export default function AdminRecruitmentPage() {
    const [vacancies, setVacancies] = useState<any[]>([]);
    const [applicants, setApplicants] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // UI State
    const [showPostForm, setShowPostForm] = useState(false);
    const [selectedVacancy, setSelectedVacancy] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedApplicantAnalysis, setSelectedApplicantAnalysis] = useState<any>(null); // For analysis modal

    // AI Generator State
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiProvider, setAiProvider] = useState<string>("gemini");
    const [jobTitle, setJobTitle] = useState("");
    const [jobDescription, setJobDescription] = useState("");

    // AI Analysis State
    const [analyzingIds, setAnalyzingIds] = useState<number[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const [vData, dData, aData] = await Promise.all([
            getJobVacancies(),
            getDepartments(),
            getApplicants()
        ]);
        setVacancies(vData);
        setDepartments(dData);
        setApplicants(aData);
        setLoading(false);
    };

    // --- AI JOB GENERATOR ---
    const handleGenerateDescription = async () => {
        if (!jobTitle) {
            alert("Please enter a job title first.");
            return;
        }
        setIsGenerating(true);
        const departmentEl = document.querySelector('select[name="departmentId"]') as HTMLSelectElement;
        const department = departmentEl?.options[departmentEl.selectedIndex]?.text || "Institution-wide";
        const keySkillsEl = document.querySelector('textarea[name="requirements"]') as HTMLTextAreaElement;
        const keySkills = keySkillsEl?.value.split(',').filter(s => s.trim()) || ["General Academic Skills"];

        const res = await generateJobDescription(jobTitle, department, keySkills, aiProvider);

        if (res.success && res.description) {
            setJobDescription(res.description);
        } else {
            alert(res.error || "Failed to generate description");
        }
        setIsGenerating(false);
    };

    const handlePostVacancy = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        const res = await postJobVacancy({
            title: formData.get("title") as string,
            departmentId: parseInt(formData.get("departmentId") as string) || null,
            description: formData.get("description") as string,
            requirements: formData.get("requirements") as string,
        });

        if (res.success) {
            setShowPostForm(false);
            setJobTitle("");
            setJobDescription("");
            fetchData();
        } else {
            alert(res.error);
        }
        setIsSubmitting(false);
    };

    // --- AI CANDIDATE ANALYSIS ---
    const handleAnalyzeCandidate = async (applicantId: number) => {
        setAnalyzingIds(prev => [...prev, applicantId]);
        const res = await analyzeCandidate(applicantId); // Assuming provider is handled inside or we pass context
        if (res.success) {
            fetchData(); // Refresh to show score
        } else {
            alert(res.error || "Analysis failed");
        }
        setAnalyzingIds(prev => prev.filter(id => id !== applicantId));
    };

    const viewAnalysis = (applicant: any) => {
        try {
            const analysis = applicant.aiAnalysis ? JSON.parse(applicant.aiAnalysis) : null;
            setSelectedApplicantAnalysis({
                name: applicant.name,
                ...analysis
            });
        } catch (e) {
            alert("Could not parse analysis data");
        }
    };

    const handleStatusUpdate = async (applicantId: number, status: any) => {
        const res = await updateApplicantStatus(applicantId, status);
        if (res.success) fetchData();
    };

    const filteredApplicants = selectedVacancy
        ? applicants.filter(a => a.applicant.vacancyId === selectedVacancy)
        : applicants;

    return (
        <div className="p-8 max-w-[1600px] w-full mx-auto space-y-8 bg-slate-50/50 min-h-screen">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <UserCheck className="w-8 h-8 text-indigo-600" />
                        Recruitment Center
                    </h1>
                    <p className="text-slate-500 font-medium italic">Manage institutional growth and faculty talent pipeline</p>
                </div>
                <Button
                    onClick={() => setShowPostForm(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 h-11 px-6 rounded-xl shadow-lg shadow-indigo-200 font-black uppercase text-xs tracking-widest gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Post New Vacancy
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Vacancy List Side Rail */}
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-2">Active Vacancies</h3>
                    <div
                        onClick={() => setSelectedVacancy(null)}
                        className={cn(
                            "p-4 rounded-xl cursor-pointer transition-all border border-transparent",
                            selectedVacancy === null ? "bg-white shadow-md border-indigo-100" : "hover:bg-white/50"
                        )}
                    >
                        <p className="font-bold text-sm text-slate-900">All Candidates</p>
                        <p className="text-xs text-slate-500">{applicants.length} Total Applicants</p>
                    </div>
                    {vacancies.map((v) => (
                        <div
                            key={v.vacancy.id}
                            onClick={() => setSelectedVacancy(v.vacancy.id)}
                            className={cn(
                                "p-4 rounded-xl cursor-pointer transition-all border border-transparent",
                                selectedVacancy === v.vacancy.id ? "bg-white shadow-md border-indigo-100" : "hover:bg-white/50"
                            )}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <p className="font-bold text-sm text-slate-900 leading-tight">{v.vacancy.title}</p>
                                <span className={cn(
                                    "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter",
                                    v.vacancy.status === 'open' ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"
                                )}>
                                    {v.vacancy.status}
                                </span>
                            </div>
                            <p className="text-[10px] text-indigo-600 font-black uppercase tracking-tighter">{v.department?.name || 'Academic'}</p>
                        </div>
                    ))}
                </div>

                {/* Applicant Pipeline */}
                <div className="lg:col-span-3">
                    <Card className="border-none shadow-sm overflow-hidden min-h-[500px]">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50">
                                <tr className="text-[10px] uppercase font-black text-slate-400 tracking-widest border-b border-slate-100">
                                    <th className="px-6 py-4">Applicant</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">AI Match</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr><td colSpan={4} className="p-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-200" /></td></tr>
                                ) : filteredApplicants.map((a) => (
                                    <tr key={a.applicant.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-black text-xs">
                                                    {a.applicant.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 leading-tight">{a.applicant.name}</p>
                                                    <p className="text-[10px] text-slate-400">{a.vacancy.title}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter italic",
                                                a.applicant.status === 'applied' ? "bg-blue-100 text-blue-600" :
                                                    a.applicant.status === 'interview' ? "bg-amber-100 text-amber-600" :
                                                        a.applicant.status === 'hired' ? "bg-emerald-100 text-emerald-600" :
                                                            a.applicant.status === 'rejected' ? "bg-rose-100 text-rose-600" : "bg-indigo-100 text-indigo-600"
                                            )}>
                                                {a.applicant.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {a.applicant.aiScore ? (
                                                <button
                                                    onClick={() => viewAnalysis(a.applicant)}
                                                    className="flex items-center gap-2 px-2 py-1 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors group/score"
                                                >
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2",
                                                        a.applicant.aiScore >= 80 ? "border-emerald-500 text-emerald-700 bg-emerald-50" :
                                                            a.applicant.aiScore >= 50 ? "border-amber-500 text-amber-700 bg-amber-50" :
                                                                "border-rose-500 text-rose-700 bg-rose-50"
                                                    )}>
                                                        {a.applicant.aiScore}%
                                                    </div>
                                                    <span className="text-[10px] font-bold text-violet-600 group-hover/score:underline">View Analysis</span>
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleAnalyzeCandidate(a.applicant.id)}
                                                    disabled={analyzingIds.includes(a.applicant.id)}
                                                    className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                                                >
                                                    {analyzingIds.includes(a.applicant.id) ? (
                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                    ) : (
                                                        <Bot className="w-3 h-3" />
                                                    )}
                                                    Analyze Fit
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleStatusUpdate(a.applicant.id, 'screening')} className="p-2 hover:bg-indigo-50 rounded-lg text-indigo-600"><Search className="w-4 h-4" /></button>
                                                <button onClick={() => handleStatusUpdate(a.applicant.id, 'interview')} className="p-2 hover:bg-amber-50 rounded-lg text-amber-600"><Clock className="w-4 h-4" /></button>
                                                <button onClick={() => handleStatusUpdate(a.applicant.id, 'hired')} className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600"><CheckCircle className="w-4 h-4" /></button>
                                                <button onClick={() => handleStatusUpdate(a.applicant.id, 'rejected')} className="p-2 hover:bg-rose-50 rounded-lg text-rose-600"><XCircle className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>
                </div>
            </div>

            {/* Post Vacancy Form Overlay */}
            {showPostForm && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-2xl border-none shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
                        <CardHeader className="flex flex-row justify-between items-center bg-slate-900 text-white rounded-t-2xl sticky top-0 z-10">
                            <CardTitle className="text-lg font-black uppercase tracking-widest italic flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-400" />
                                Institutional Vacancy Posting
                            </CardTitle>
                            <button onClick={() => setShowPostForm(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </CardHeader>
                        <CardContent className="pt-8">
                            <form onSubmit={handlePostVacancy} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Job Title</label>
                                        <input
                                            name="title"
                                            required
                                            placeholder="e.g. Senior Lecturer, Computer Science"
                                            className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                            value={jobTitle}
                                            onChange={(e) => setJobTitle(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Department</label>
                                        <select name="departmentId" className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                                            <option value="">Institution-wide</option>
                                            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Job Description</label>
                                        <div className="flex items-center gap-2">
                                            <select
                                                value={aiProvider}
                                                onChange={(e) => setAiProvider(e.target.value)}
                                                className="text-[10px] font-bold bg-slate-100 border-none rounded-lg py-1 px-2 text-slate-600 focus:ring-0 cursor-pointer"
                                            >
                                                <option value="gemini">Gemini</option>
                                                <option value="openai">OpenAI</option>
                                                <option value="openrouter">OpenRouter</option>
                                                <option value="deepseek">DeepSeek</option>
                                                <option value="grok">Grok</option>
                                            </select>
                                            <button
                                                type="button"
                                                onClick={handleGenerateDescription}
                                                disabled={isGenerating}
                                                className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                                            >
                                                {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bot className="w-3 h-3" />}
                                                Auto-Generate
                                            </button>
                                        </div>
                                    </div>
                                    <textarea
                                        name="description"
                                        required
                                        rows={6}
                                        placeholder="Describe the role and institutional impact..."
                                        className="w-full p-3 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                        value={jobDescription}
                                        onChange={(e) => setJobDescription(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Requirements (Comma Separated for AI)</label>
                                    <textarea name="requirements" rows={3} placeholder="Ph.D., 5+ years experience, research publications..." className="w-full p-3 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 bg-white" />
                                </div>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-slate-900 hover:bg-black py-7 rounded-2xl font-black uppercase text-sm tracking-[0.2em] shadow-xl shadow-slate-200"
                                >
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Authorize & Publish Vacancy"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Analysis Result Modal */}
            {selectedApplicantAnalysis && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-lg border-none shadow-2xl animate-in zoom-in-95 duration-200">
                        <CardHeader className="flex flex-row justify-between items-center bg-indigo-900 text-white rounded-t-2xl">
                            <div>
                                <CardTitle className="text-lg font-black uppercase tracking-widest italic flex items-center gap-2">
                                    <Target className="w-4 h-4 text-indigo-300" />
                                    AI Candidate Audit
                                </CardTitle>
                                <p className="text-xs text-indigo-200 mt-1">Analysis for {selectedApplicantAnalysis.name}</p>
                            </div>
                            <button onClick={() => setSelectedApplicantAnalysis(null)} className="p-2 hover:bg-indigo-800 rounded-full transition-colors text-indigo-300">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="flex items-center justify-center py-4">
                                <div className="text-center">
                                    <div className={cn(
                                        "w-24 h-24 rounded-full flex items-center justify-center text-4xl font-black border-4 mx-auto mb-2",
                                        selectedApplicantAnalysis.match_score >= 80 ? "border-emerald-500 text-emerald-700 bg-emerald-50" :
                                            selectedApplicantAnalysis.match_score >= 50 ? "border-amber-500 text-amber-700 bg-amber-50" :
                                                "border-rose-500 text-rose-700 bg-rose-50"
                                    )}>
                                        {selectedApplicantAnalysis.match_score}%
                                    </div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Match Probability</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-600 italic border border-slate-100">
                                "{selectedApplicantAnalysis.summary || "No summary available."}"
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <h4 className="text-[10px] font-black uppercase text-emerald-600 tracking-widest flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" /> Strengths
                                    </h4>
                                    <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
                                        {selectedApplicantAnalysis.strengths?.map((s: string, i: number) => <li key={i}>{s}</li>) || <li>No specific strengths identified</li>}
                                    </ul>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-[10px] font-black uppercase text-rose-600 tracking-widest flex items-center gap-1">
                                        <XCircle className="w-3 h-3" /> Weaknesses
                                    </h4>
                                    <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
                                        {selectedApplicantAnalysis.weaknesses?.map((s: string, i: number) => <li key={i}>{s}</li>) || <li>No specific weaknesses identified</li>}
                                    </ul>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button onClick={() => setSelectedApplicantAnalysis(null)} variant="outline" className="border-slate-200">
                                    Close Analysis
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
