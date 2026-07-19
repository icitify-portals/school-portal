"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getApplicantApplication, getApplicantOLevelData } from "@/actions/admission_v2";
import { getBrandingSettings } from "@/actions/settings";
import { Loader2, Printer, ArrowLeft, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

export default function ApplicationPrintPage() {
    const params = useParams();
    const { data: session } = useSession();
    const id = parseInt(params.id as string);
    const [data, setData] = useState<any>(null);
    const [branding, setBranding] = useState<any>(null);
    const [olevels, setOlevels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (session?.user?.id) {
            fetchData();
        }
    }, [id, session]);

    const fetchData = async () => {
        setLoading(true);
        const [appData, brandingData] = await Promise.all([
            getApplicantApplication(id, parseInt(session!.user!.id)),
            getBrandingSettings(),
        ]);
        setBranding(brandingData);

        if (appData) {
            setData(appData);
            const olevelData = await getApplicantOLevelData(id, parseInt(session!.user!.id));
            setOlevels(olevelData);
        }
        setLoading(false);
    };

    const handlePrint = () => window.print();

    if (loading)
        return (
            <div className="min-h-screen flex justify-center items-center">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            </div>
        );
    if (!data)
        return (
            <div className="min-h-screen flex justify-center items-center font-black text-2xl italic uppercase text-slate-300">
                Application Not Found
            </div>
        );

    const formData = JSON.parse(data.data || "{}");
    
    const applicantPhoto =
        data.applicantPhoto ||
        formData["Passport Photograph"] ||
        formData["Passport Photo"] ||
        formData["Passport"] ||
        formData["Photo"] ||
        null;

    const SKIP_TYPES = ["image", "olevel_result"];
    const SKIP_LABELS = ["Passport Photograph", "Photo", "Passport Photo"];

    const allFields: any[] = [];
    if (data.template?.sections) {
        for (const section of data.template.sections) {
            for (const field of section.fields) {
                allFields.push({ ...field, sectionTitle: section.title });
            }
        }
    }

    return (
        <>
        <style dangerouslySetInnerHTML={{__html: `
            @media print {
                * {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
            }
        `}} />
        <div className="min-h-screen bg-slate-100 py-10 px-4 print:p-0 print:bg-white">
            <div className="max-w-[210mm] mx-auto space-y-6">
                {/* Print Controls */}
                <div className="flex justify-between items-center print:hidden">
                    <Button variant="ghost" onClick={() => window.history.back()} className="rounded-xl font-bold">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <Button onClick={handlePrint} className="bg-indigo-600 text-white font-black px-8 py-6 rounded-2xl shadow-xl flex gap-3 uppercase text-xs tracking-widest">
                        <Printer className="w-5 h-5" /> Print Application Summary
                    </Button>
                </div>

                {/* The Print Document */}
                <div className="bg-white shadow-2xl print:shadow-none print:border-none print:rounded-none overflow-hidden">
                    {/* School Header */}
                    <div className="border-b-4 border-indigo-600 px-10 py-8 flex items-center gap-8">
                        {branding?.portalLogo ? (
                            <img src={branding.portalLogo} alt="School Logo" className="w-24 h-24 object-contain" />
                        ) : (
                            <div className="w-24 h-24 bg-indigo-50 rounded-2xl flex items-center justify-center">
                                <span className="text-3xl font-black text-indigo-300">LOGO</span>
                            </div>
                        )}
                        <div className="flex-1 text-center">
                            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                                {branding?.portalName || "Federal School of Statistics, Ibadan"}
                            </h1>
                            {branding?.schoolMotto && (
                                <p className="text-xs font-bold text-slate-500 italic mt-1">{branding.schoolMotto}</p>
                            )}
                            {branding?.schoolAddress && (
                                <p className="text-[10px] font-bold text-slate-400 mt-2">{branding.schoolAddress}</p>
                            )}
                            <p className="text-xs font-bold text-indigo-600 mt-2">2026/2027 APPLICATION FORM</p>
                        </div>
                    </div>

                    {/* Title */}
                    <div className="bg-slate-50 px-10 py-5 text-center border-b border-slate-200">
                        <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest">Application Summary</h2>
                        <p className="text-[10px] font-bold text-slate-400 mt-1">
                            {data.template?.name || "Admission Application"} &mdash; Ref: #{data.id.toString().padStart(6, "0")}
                        </p>
                    </div>

                    <div className="px-10 py-8">
                        {/* Passport + Core Info */}
                        <div className="flex gap-8 items-start mb-8">
                            {/* Passport Photo */}
                            <div className="w-36 shrink-0">
                                <div className="w-36 h-44 bg-slate-50 border-2 border-slate-200 rounded-xl overflow-hidden">
                                    {applicantPhoto ? (
                                        <img src={applicantPhoto} alt="Passport" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-200">
                                            <User className="w-12 h-12" />
                                        </div>
                                    )}
                                </div>
                                <p className="text-[8px] font-bold text-center text-slate-400 mt-1 uppercase tracking-widest">Passport Photo</p>
                            </div>

                            {/* Key Details */}
                            <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-4">
                                {allFields
                                    .filter((f) => !SKIP_TYPES.includes(f.type) && !SKIP_LABELS.includes(f.label))
                                    .slice(0, 20)
                                    .map((field: any) => {
                                        const val = formData[field.label];
                                        if (val === undefined || val === null || val === "") return null;

                                        let display: string;
                                        if (field.type === "checkbox") {
                                            display = val ? "Yes" : "No";
                                        } else if (Array.isArray(val)) {
                                            display = val.join(", ");
                                        } else {
                                            display = String(val);
                                        }

                                        return (
                                            <div key={field.id} className="space-y-0.5">
                                                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">{field.label}</p>
                                                <p className="text-xs font-bold text-slate-800">{display}</p>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>

                        {/* Application Status */}
                        <div className="bg-indigo-50 rounded-xl p-4 mb-8 flex items-center gap-6 text-xs font-bold">
                            <div>
                                <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400 block">Status</span>
                                <span className="text-indigo-900 uppercase">{data.status}</span>
                            </div>
                            <div className="w-px h-8 bg-indigo-200" />
                            <div>
                                <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400 block">Payment</span>
                                <span className="text-indigo-900 uppercase">{data.paymentStatus || "Pending"}</span>
                            </div>
                            <div className="w-px h-8 bg-indigo-200" />
                            <div>
                                <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400 block">Submitted</span>
                                <span className="text-indigo-900">{data.createdAt ? new Date(data.createdAt).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" }) : "N/A"}</span>
                            </div>
                        </div>

                        {/* Remaining Fields (if any) */}
                        {allFields.filter((f) => !SKIP_TYPES.includes(f.type) && !SKIP_LABELS.includes(f.label)).length > 20 && (
                            <div className="mb-8">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Additional Information</h3>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                                    {allFields
                                        .filter((f) => !SKIP_TYPES.includes(f.type) && !SKIP_LABELS.includes(f.label))
                                        .slice(20)
                                        .map((field: any) => {
                                            const val = formData[field.label];
                                            if (val === undefined || val === null || val === "") return null;
                                            let display: string;
                                            if (field.type === "checkbox") display = val ? "Yes" : "No";
                                            else if (Array.isArray(val)) display = val.join(", ");
                                            else display = String(val);
                                            return (
                                                <div key={field.id} className="space-y-0.5">
                                                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">{field.label}</p>
                                                    <p className="text-xs font-bold text-slate-800">{display}</p>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        )}

                        {/* O-Level Results */}
                        {olevels.length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">O-Level Results</h3>
                                {olevels.map((sitting, sIdx) => (
                                    <div key={sIdx} className="mb-4 border border-slate-200 rounded-xl overflow-hidden">
                                        <div className="bg-slate-50 px-4 py-2 flex items-center gap-4 text-[10px] font-bold text-slate-600 border-b border-slate-200">
                                            <span className="bg-indigo-600 text-white w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black">{sIdx + 1}</span>
                                            <span>{sitting.examBodyName}</span>
                                            <span className="text-slate-300">|</span>
                                            <span>{sitting.examYear}</span>
                                            <span className="text-slate-300">|</span>
                                            <span>Reg: {sitting.examNumber}</span>
                                        </div>
                                        <div className="p-4">
                                            <table className="w-full text-[11px]">
                                                <thead>
                                                    <tr className="text-[8px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                                                        <th className="text-left py-1.5">S/N</th>
                                                        <th className="text-left py-1.5">Subject</th>
                                                        <th className="text-center py-1.5">Grade</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {sitting.subjects.map((sub: any, subIdx: number) => (
                                                        <tr key={subIdx} className="border-b border-slate-50">
                                                            <td className="py-1.5 font-bold text-slate-400">{subIdx + 1}</td>
                                                            <td className="py-1.5 font-semibold text-slate-700">{sub.subjectName}</td>
                                                            <td className="py-1.5 text-center font-black text-indigo-600">{sub.grade}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Footer */}
                        <div className="pt-6 border-t border-slate-200 flex justify-between items-end">
                            <div>
                                <p className="text-[8px] font-black uppercase tracking-widest text-slate-300">Generated On</p>
                                <p className="text-[10px] font-bold text-slate-500">{new Date().toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[8px] font-black uppercase tracking-widest text-slate-300">Application ID</p>
                                <p className="text-sm font-black text-slate-900">#{data.id.toString().padStart(6, "0")}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
}
