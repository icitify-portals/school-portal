"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { verifyApplicationByFormNumber } from "@/actions/admission_v2";
import { getBrandingSettings } from "@/actions/settings";
import { Loader2, ShieldCheck, ShieldX, User, Search, Printer } from "lucide-react";

export default function VerifyPage() {
    const params = useParams();
    const formNumberParam = decodeURIComponent(params.formNumber as string);

    const [data, setData] = useState<any>(null);
    const [branding, setBranding] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [searchInput, setSearchInput] = useState(formNumberParam || "");
    const [searched, setSearched] = useState(false);

    useState(() => {
        if (formNumberParam) {
            doVerify(formNumberParam);
        } else {
            setLoading(false);
        }
    });

    const doVerify = async (fn: string) => {
        setLoading(true);
        setNotFound(false);
        setSearched(true);
        const [result, brandData] = await Promise.all([
            verifyApplicationByFormNumber(fn),
            getBrandingSettings(),
        ]);
        setBranding(brandData);
        setData(result);
        setNotFound(!result);
        setLoading(false);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchInput.trim()) {
            doVerify(searchInput.trim());
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-3xl mx-auto px-6 py-6 flex items-center gap-4">
                    {branding?.portalLogo ? (
                        <img src={branding.portalLogo} alt="Logo" className="w-12 h-12 object-contain" />
                    ) : (
                        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                            <ShieldCheck className="w-6 h-6 text-indigo-600" />
                        </div>
                    )}
                    <div>
                        <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                            {branding?.portalName || "Admission Verification"}
                        </h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Verify the authenticity of an admission application
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
                {/* Search Bar */}
                <form onSubmit={handleSearch} className="flex gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            className="w-full h-14 bg-white border-2 border-slate-200 rounded-2xl pl-12 pr-6 font-bold text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                            placeholder="Enter form number (e.g. FSS/2026/UG/00001)"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        className="h-14 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-xs tracking-widest rounded-2xl transition-colors shadow-lg shadow-indigo-200"
                    >
                        Verify
                    </button>
                </form>

                {/* Results */}
                {loading && (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    </div>
                )}

                {!loading && searched && notFound && (
                    <div className="bg-white rounded-3xl p-12 text-center space-y-4 shadow-sm border border-red-100">
                        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                            <ShieldX className="w-10 h-10 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-black text-red-600 uppercase">Not Found</h2>
                        <p className="text-sm font-bold text-slate-500">
                            No application matches form number <span className="font-black text-slate-900">{searchInput}</span>.
                            Please check and try again.
                        </p>
                    </div>
                )}

                {!loading && data && (
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                        {/* Verified Banner */}
                        <div className="bg-emerald-600 px-8 py-4 flex items-center gap-3">
                            <ShieldCheck className="w-6 h-6 text-white" />
                            <span className="text-sm font-black text-white uppercase tracking-widest">
                                Verified Application
                            </span>
                        </div>

                        <div className="p-8 space-y-8">
                            {/* Photo + Core Info */}
                            <div className="flex gap-8 items-start">
                                <div className="w-32 h-40 bg-slate-50 border-2 border-slate-200 rounded-xl overflow-hidden shrink-0">
                                    {data.applicantPhoto ? (
                                        <img src={data.applicantPhoto} alt="Passport" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-200">
                                            <User className="w-10 h-10" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 grid grid-cols-2 gap-4">
                                    <InfoRow label="Form Number" value={data.formNumber} highlight />
                                    <InfoRow label="Security Hash" value={data.formHash} mono />
                                    <InfoRow label="Applicant Name" value={data.applicantName} />
                                    <InfoRow label="Date of Birth" value={data.dateOfBirth} />
                                    <InfoRow label="Gender" value={data.gender} />
                                    <InfoRow label="Phone" value={data.applicantPhone} />
                                    <InfoRow label="Email" value={data.applicantEmail} />
                                    <InfoRow label="State of Origin" value={data.stateOfOrigin} />
                                </div>
                            </div>

                            {/* Status Bar */}
                            <div className="bg-slate-50 rounded-2xl p-6 grid grid-cols-4 gap-4">
                                <div>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">Status</span>
                                    <span className={`text-sm font-black uppercase ${data.status === "admitted" ? "text-emerald-600" : data.status === "rejected" ? "text-red-600" : "text-indigo-600"}`}>
                                        {data.status}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">Payment</span>
                                    <span className="text-sm font-black text-slate-900 uppercase">{data.paymentStatus}</span>
                                </div>
                                <div>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">Programme</span>
                                    <span className="text-sm font-bold text-slate-900">{data.programmeChoice}</span>
                                </div>
                                <div>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">Submitted</span>
                                    <span className="text-sm font-bold text-slate-900">
                                        {data.submittedAt ? new Date(data.submittedAt).toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" }) : "N/A"}
                                    </span>
                                </div>
                            </div>

                            {/* Template Info */}
                            <div className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {data.templateName} &mdash; This verification was performed on{" "}
                                {new Date().toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </div>
                        </div>
                    </div>
                )}

                {/* How to Verify */}
                {!loading && !searched && (
                    <div className="bg-white rounded-3xl p-12 text-center space-y-4 shadow-sm border border-slate-100">
                        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto">
                            <Search className="w-10 h-10 text-indigo-300" />
                        </div>
                        <h2 className="text-xl font-black text-slate-900 uppercase">Enter a Form Number</h2>
                        <p className="text-sm font-bold text-slate-500 max-w-md mx-auto">
                            Type the form number printed on the admission slip to verify its authenticity. The form number follows the format:{" "}
                            <span className="font-black text-slate-700">FSS/YYYY/XX/00001</span>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

function InfoRow({ label, value, highlight, mono }: { label: string; value: string; highlight?: boolean; mono?: boolean }) {
    return (
        <div className="space-y-0.5">
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">{label}</span>
            <span className={`text-sm block ${highlight ? "font-black text-indigo-600 text-base" : mono ? "font-mono font-bold text-slate-700 text-xs" : "font-bold text-slate-800"}`}>
                {value || "N/A"}
            </span>
        </div>
    );
}
