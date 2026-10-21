"use client";

import { useState } from "react";
import { searchPublicStudents, resetPasswordToDefaultAction } from "@/actions/student-lookup";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Search,
    GraduationCap,
    Loader2,
    CheckCircle2,
    AlertCircle,
    ArrowLeft,
    KeyRound,
    Copy,
    Check,
    Building2,
    BookOpen,
    Mail,
    UserCheck,
    AlertTriangle,
    LogIn
} from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export default function StudentLookupPage() {
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Reset password modal & execution state
    const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
    const [resetting, setResetting] = useState(false);
    const [resetSuccess, setResetSuccess] = useState<{
        studentName: string;
        loginId?: string;
        message: string;
    } | null>(null);

    const [copiedMatric, setCopiedMatric] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setResetSuccess(null);

        const clean = query.trim();
        if (clean.length < 3) {
            setError("Please enter at least 3 characters to search (e.g. your surname, matric number, or email).");
            return;
        }

        setLoading(true);
        try {
            const res = await searchPublicStudents(clean);
            if (res.success) {
                setResults(res.data);
                if (res.data.length === 0) {
                    setError("No matching student records found. Please check your spelling or try searching with your Matric Number or Surname.");
                }
            } else {
                setError(res.error || "Failed to search student directory.");
                setResults(null);
            }
        } catch (err: any) {
            setError(err?.message || "An unexpected error occurred while searching.");
            setResults(null);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmReset = async () => {
        if (!selectedStudent) return;
        setResetting(true);
        try {
            const res = await resetPasswordToDefaultAction(selectedStudent.studentId);
            if (res.success) {
                setResetSuccess({
                    studentName: res.studentName || selectedStudent.fullName,
                    loginId: res.loginId || selectedStudent.matricNumber || selectedStudent.email,
                    message: res.message
                });
                setSelectedStudent(null);
            } else {
                alert(res.error || "Failed to reset password.");
            }
        } catch (err: any) {
            alert(err?.message || "An unexpected error occurred.");
        } finally {
            setResetting(false);
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedMatric(text);
        setTimeout(() => setCopiedMatric(null), 2000);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-indigo-50/20 to-slate-100 p-4 md:p-8 flex flex-col items-center">
            <div className="max-w-4xl w-full space-y-6">
                {/* Navigation Links */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-indigo-600 transition-colors bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" /> Portal Home
                        </Link>
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-indigo-600 transition-colors bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm"
                        >
                            <LogIn className="w-3.5 h-3.5" /> Back to Login
                        </Link>
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden sm:inline">
                        Student Account Lookup & Self-Activation
                    </span>
                </div>

                {/* Hero Header */}
                <div className="text-center space-y-3 bg-white p-6 md:p-8 rounded-[2rem] shadow-xl border border-slate-100">
                    <div className="flex justify-center mb-1">
                        <img
                            src="/fss_logo.png"
                            alt="School Logo"
                            className="h-16 w-16 object-contain"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                        Student Directory & Account Lookup
                    </h1>
                    <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
                        Search with your <strong>Matriculation Number</strong>, <strong>Full Name</strong>, or <strong>Registered Email</strong> to confirm your department and reset your portal password to <strong>welcome123</strong>.
                    </p>

                    {/* Search Form */}
                    <form onSubmit={handleSearch} className="max-w-2xl mx-auto pt-3">
                        <div className="relative flex flex-col sm:flex-row gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    required
                                    className="w-full pl-12 pr-4 py-3.5 h-12 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-white shadow-sm text-sm"
                                    placeholder="e.g. Ojugbele, 3841, or your email..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 shrink-0 gap-2"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                {loading ? "Searching..." : "Search Account"}
                            </Button>
                        </div>
                        <p className="text-[11px] text-slate-400 text-left mt-2 pl-1">
                            Tip: You can enter any 4 digits of your matric number, your surname, or your personal email address.
                        </p>
                    </form>
                </div>

                {/* Reset Success Banner */}
                {resetSuccess && (
                    <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-[2rem] shadow-lg text-emerald-900 space-y-3 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-black text-lg">Password Reset to Default Successfully!</h3>
                                <p className="text-sm text-emerald-800">
                                    The password for <strong>{resetSuccess.studentName}</strong> has been set to:{" "}
                                    <span className="font-mono font-black text-emerald-950 bg-emerald-200 px-2 py-0.5 rounded text-base">
                                        welcome123
                                    </span>
                                </p>
                            </div>
                        </div>
                        <p className="text-xs text-emerald-700 leading-relaxed bg-white/70 p-3 rounded-xl border border-emerald-100">
                            You can now log in using your Matric Number:{" "}
                            <strong className="font-mono text-emerald-900">{resetSuccess.loginId}</strong> and password{" "}
                            <strong className="font-mono">welcome123</strong>. The portal will prompt you to choose your new secure personal password upon your first sign in.
                        </p>
                        <div className="pt-1 flex flex-wrap gap-2">
                            <Link
                                href={`/login?loginId=${encodeURIComponent(resetSuccess.loginId || '')}`}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-600/20"
                            >
                                <LogIn className="w-4 h-4" /> Proceed to Login Now
                            </Link>
                        </div>
                    </div>
                )}

                {/* Error Banner */}
                {error && (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm flex gap-3 items-center">
                        <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Search Results List */}
                {results && results.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">
                                Matching Records ({results.length})
                            </h2>
                            <span className="text-[11px] text-slate-400">
                                Click &apos;Set Password to welcome123&apos; to activate your account
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {results.map((student) => {
                                const isGraduant = ['nd_graduant', 'nd_graduated', 'hnd_graduant', 'hnd_graduated'].includes(student.status);
                                return (
                                    <Card
                                        key={student.studentId}
                                        className="border border-slate-200/80 shadow-md hover:shadow-lg transition-all rounded-2xl bg-white overflow-hidden flex flex-col justify-between"
                                    >
                                        <CardHeader className="p-5 pb-3 border-b border-slate-100 bg-slate-50/50">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <CardTitle className="text-base font-bold text-slate-900 leading-snug">
                                                        {student.fullName}
                                                    </CardTitle>
                                                    <CardDescription className="text-xs text-slate-500 mt-0.5">
                                                        Student ID: {student.studentId}
                                                    </CardDescription>
                                                </div>
                                                <span
                                                    className={`text-[10px] uppercase font-black px-2.5 py-1 rounded-full shrink-0 ${
                                                        student.status === 'active'
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : isGraduant
                                                            ? 'bg-indigo-100 text-indigo-800'
                                                            : 'bg-amber-100 text-amber-800'
                                                    }`}
                                                >
                                                    {student.status.replace(/_/g, ' ')}
                                                </span>
                                            </div>
                                        </CardHeader>

                                        <CardContent className="p-5 space-y-3.5 text-xs">
                                            {/* Department & Programme */}
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-slate-700">
                                                    <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                                    <span className="font-semibold">{student.department}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-600 pl-5 text-[11px]">
                                                    <BookOpen className="w-3 h-3 text-slate-400 shrink-0" />
                                                    <span>{student.programme} &bull; <strong className="text-slate-800">{student.levelLabel || `${student.programmeType} ${student.level}`}</strong></span>
                                                </div>
                                            </div>

                                            {/* Matric & Admission Numbers */}
                                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-slate-500 font-medium">Matric Number:</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                                                            {student.matricNumber}
                                                        </span>
                                                        {student.matricNumber && student.matricNumber !== 'Pending / Not Assigned' && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleCopy(student.matricNumber)}
                                                                className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                                                                title="Copy Matric Number"
                                                            >
                                                                {copiedMatric === student.matricNumber ? (
                                                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                                ) : (
                                                                    <Copy className="w-3.5 h-3.5" />
                                                                )}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                {student.admissionNumber && (
                                                    <div className="flex items-center justify-between text-[11px]">
                                                        <span className="text-slate-400">Admission No:</span>
                                                        <span className="font-mono text-slate-600">{student.admissionNumber}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Registered Email */}
                                            <div className="flex items-start gap-2 pt-0.5">
                                                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-1">
                                                        <span className="text-slate-500">Registered Email:</span>
                                                        <span className="font-mono text-slate-700 truncate" title={student.email}>
                                                            {student.isInstitutionalEmail ? student.email : student.email || student.maskedEmail}
                                                        </span>
                                                    </div>
                                                    {student.isInstitutionalEmail && (
                                                        <p className="text-[10px] text-amber-700 bg-amber-50 p-1.5 rounded-lg border border-amber-200 mt-1">
                                                            Institutional placeholder. Reset password below to sign in with your Matric Number.
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action Button */}
                                            <div className="pt-2 border-t border-slate-100">
                                                <Button
                                                    type="button"
                                                    onClick={() => setSelectedStudent(student)}
                                                    className="w-full bg-slate-900 hover:bg-indigo-600 text-white rounded-xl h-10 font-bold text-xs uppercase tracking-wider transition-all gap-2 shadow-sm"
                                                >
                                                    <KeyRound className="w-3.5 h-3.5" />
                                                    Set Password to welcome123
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Confirmation Modal */}
            <Dialog open={!!selectedStudent} onOpenChange={(open) => !open && setSelectedStudent(null)}>
                <DialogContent className="max-w-md bg-white rounded-2xl p-6">
                    <DialogHeader>
                        <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-2">
                            <KeyRound className="w-6 h-6" />
                        </div>
                        <DialogTitle className="text-xl font-bold text-slate-900">
                            Reset Password to welcome123?
                        </DialogTitle>
                        <DialogDescription className="text-sm text-slate-500">
                            This will activate the student portal account with the standard default password.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedStudent && (
                        <div className="space-y-3 my-2 text-xs">
                            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                                <div className="flex justify-between">
                                    <span className="text-slate-500 font-medium">Student Name:</span>
                                    <span className="font-bold text-slate-800">{selectedStudent.fullName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500 font-medium">Matric Number:</span>
                                    <span className="font-mono font-bold text-slate-800">{selectedStudent.matricNumber}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500 font-medium">Department:</span>
                                    <span className="font-medium text-slate-700">{selectedStudent.department}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500 font-medium">New Password:</span>
                                    <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                                        welcome123
                                    </span>
                                </div>
                            </div>
                            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 flex gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                <p className="text-[11px] leading-relaxed">
                                    Upon logging in with <strong>welcome123</strong>, the student will be prompted to create their own secure password before accessing courses or results.
                                </p>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0 pt-2">
                        <Button
                            variant="outline"
                            onClick={() => setSelectedStudent(null)}
                            disabled={resetting}
                            className="rounded-xl font-bold"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirmReset}
                            disabled={resetting}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold gap-2"
                        >
                            {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                            {resetting ? "Resetting..." : "Confirm & Set welcome123"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
