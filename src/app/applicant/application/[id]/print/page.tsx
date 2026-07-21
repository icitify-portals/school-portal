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

    const applicantSignature =
        formData["Signature"] ||
        formData["Applicant Signature"] ||
        formData["Student Signature"] ||
        null;

    const SKIP_TYPES = ["image", "olevel_result"];
    const SKIP_LABELS = ["Passport Photograph", "Photo", "Passport Photo", "Signature", "Applicant Signature", "Student Signature"];

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
        <div className="min-h-screen bg-slate-100 py-10 px-4 print:p-0 print:bg-white print:m-0 print:text-[10px]">
            <div className="max-w-[210mm] mx-auto space-y-4 print:space-y-0">
                {/* Print Controls */}
                <div className="flex justify-between items-center print:hidden mb-4">
                    <Button variant="ghost" onClick={() => window.history.back()} className="rounded-xl font-bold">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <Button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 py-6 rounded-2xl shadow-xl flex gap-3 uppercase text-xs tracking-widest transition-colors">
                        <Printer className="w-5 h-5" /> Print Application
                    </Button>
                </div>

                {/* The Print Document */}
                <div className="bg-white shadow-2xl print:shadow-none print:border-none print:rounded-none overflow-hidden print:w-[210mm] print:h-[297mm] print:overflow-hidden box-border">
                    {/* School Header */}
                    <div className="border-b-[3px] border-indigo-600 px-6 py-4 flex items-center justify-between gap-4">
                        {branding?.portalLogo ? (
                            <img src={branding.portalLogo} alt="School Logo" className="w-16 h-16 print:w-14 print:h-14 object-contain shrink-0" />
                        ) : (
                            <div className="w-16 h-16 print:w-14 print:h-14 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                                <span className="text-xl font-black text-indigo-300">LOGO</span>
                            </div>
                        )}
                        <div className="flex-1 text-center">
                            <h1 className="text-xl print:text-lg font-black text-slate-900 uppercase tracking-tight leading-tight">
                                {branding?.portalName || "Federal School of Statistics, Ibadan"}
                            </h1>
                            {branding?.schoolMotto && (
                                <p className="text-[10px] print:text-[9px] font-bold text-slate-500 italic mt-0.5">{branding.schoolMotto}</p>
                            )}
                            {branding?.schoolAddress && (
                                <p className="text-[9px] print:text-[8px] font-bold text-slate-400 mt-0.5">{branding.schoolAddress}</p>
                            )}
                            <p className="text-[11px] print:text-[10px] font-black text-indigo-600 mt-1 uppercase tracking-widest">2026/2027 APPLICATION FORM</p>
                        </div>
                        <div className="w-16 h-16 print:w-14 print:h-14 shrink-0"></div> {/* Spacer for centering */}
                    </div>

                    {/* Title */}
                    <div className="bg-slate-50 px-6 py-2 text-center border-b border-slate-200">
                        <h2 className="text-sm print:text-[11px] font-black text-slate-900 uppercase tracking-widest">Application Summary</h2>
                        <p className="text-[9px] print:text-[8px] font-bold text-slate-400">
                            {data.template?.name || "Admission Application"} &mdash; Ref: #{data.id.toString().padStart(6, "0")}
                        </p>
                    </div>

                    <div className="px-6 py-4 print:py-2">
                        {/* Passport + Signature + Core Info */}
                        <div className="flex gap-6 items-start mb-4 print:mb-2">
                            {/* Passport & Signature */}
                            <div className="w-28 print:w-24 shrink-0 space-y-2">
                                <div>
                                    <div className="w-28 h-32 print:w-24 print:h-28 bg-slate-50 border-2 border-slate-200 rounded-lg overflow-hidden relative">
                                        {applicantPhoto ? (
                                            <img src={applicantPhoto} alt="Passport" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-200">
                                                <User className="w-8 h-8" />
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[7px] font-bold text-center text-slate-400 mt-0.5 uppercase tracking-widest">Passport Photo</p>
                                </div>
                                {applicantSignature && (
                                    <div>
                                        <div className="w-28 h-12 print:w-24 print:h-10 bg-white border border-slate-200 rounded flex items-center justify-center overflow-hidden">
                                            <img src={applicantSignature} alt="Signature" className="w-full h-full object-contain p-1" />
                                        </div>
                                        <p className="text-[7px] font-bold text-center text-slate-400 mt-0.5 uppercase tracking-widest">Signature</p>
                                    </div>
                                )}
                            </div>

                            {/* Key Details */}
                            <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-2">
                                {allFields
                                    .filter((f) => !SKIP_TYPES.includes(f.type) && !SKIP_LABELS.includes(f.label))
                                    .slice(0, 20)
                                    .map((field: any) => {
                                        const val = formData[field.label];
                                        if (val === undefined || val === null || val === "") return null;

                                        let display: string;
                                        if (field.type === "checkbox") display = val ? "Yes" : "No";
                                        else if (Array.isArray(val)) display = val.join(", ");
                                        else display = String(val);

                                        return (
                                            <div key={field.id} className="space-y-0 text-left border-b border-slate-50 pb-0.5">
                                                <p className="text-[7px] print:text-[6.5px] font-black uppercase tracking-widest text-slate-400">{field.label}</p>
                                                <p className="text-[10px] print:text-[9px] font-bold text-slate-800 break-words">{display}</p>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>

                        {/* Application Status */}
                        <div className="bg-indigo-50/50 rounded-lg p-2 mb-4 print:mb-2 flex items-center justify-around text-center border border-indigo-100">
                            <div>
                                <span className="text-[7px] font-black uppercase tracking-widest text-indigo-400 block">Status</span>
                                <span className="text-[9px] font-bold text-indigo-900 uppercase">{data.status}</span>
                            </div>
                            <div className="w-px h-6 bg-indigo-200" />
                            <div>
                                <span className="text-[7px] font-black uppercase tracking-widest text-indigo-400 block">Payment</span>
                                <span className="text-[9px] font-bold text-indigo-900 uppercase">{data.paymentStatus || "Pending"}</span>
                            </div>
                            <div className="w-px h-6 bg-indigo-200" />
                            <div>
                                <span className="text-[7px] font-black uppercase tracking-widest text-indigo-400 block">Submitted</span>
                                <span className="text-[9px] font-bold text-indigo-900">{data.createdAt ? new Date(data.createdAt).toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" }) : "N/A"}</span>
                            </div>
                        </div>

                        {/* Remaining Fields (if any) */}
                        {allFields.filter((f) => !SKIP_TYPES.includes(f.type) && !SKIP_LABELS.includes(f.label)).length > 20 && (
                            <div className="mb-4 print:mb-2">
                                <h3 className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1 border-b border-slate-200 pb-0.5">Additional Information</h3>
                                <div className="grid grid-cols-3 gap-x-4 gap-y-1">
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
                                                <div key={field.id} className="space-y-0 text-left">
                                                    <p className="text-[6.5px] font-black uppercase tracking-widest text-slate-400">{field.label}</p>
                                                    <p className="text-[8px] font-bold text-slate-800 break-words line-clamp-2">{display}</p>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        )}

                        {/* O-Level Results */}
                        {olevels.length > 0 && (
                            <div className="mb-2 print:mb-1">
                                <h3 className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1 border-b border-slate-200 pb-0.5">O-Level Results</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {olevels.map((sitting, sIdx) => (
                                        <div key={sIdx} className="border border-slate-200 rounded-lg overflow-hidden break-inside-avoid">
                                            <div className="bg-slate-50 px-2 py-1 flex justify-between items-center text-[8px] font-bold text-slate-600 border-b border-slate-200">
                                                <span className="flex items-center gap-1">
                                                    <span className="bg-indigo-600 text-white w-3 h-3 rounded flex items-center justify-center text-[7px] font-black">{sIdx + 1}</span>
                                                    {sitting.examBodyName}
                                                </span>
                                                <span>{sitting.examYear} | Reg: {sitting.examNumber}</span>
                                            </div>
                                            <div className="p-1">
                                                <table className="w-full text-[8px]">
                                                    <thead>
                                                        <tr className="text-[7px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                                                            <th className="text-left py-0.5 pl-1">Subject</th>
                                                            <th className="text-center py-0.5">Grade</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {sitting.subjects.map((sub: any, subIdx: number) => (
                                                            <tr key={subIdx} className="border-b border-slate-50/50 last:border-0">
                                                                <td className="py-0.5 font-semibold text-slate-700 pl-1">{sub.subjectName}</td>
                                                                <td className="py-0.5 text-center font-black text-indigo-600">{sub.grade}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="pt-2 mt-4 border-t border-slate-200 flex justify-between items-end pb-2">
                            <div>
                                <p className="text-[7px] font-black uppercase tracking-widest text-slate-300">Generated On</p>
                                <p className="text-[8px] font-bold text-slate-500">{new Date().toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[7px] font-black uppercase tracking-widest text-slate-300">Application ID</p>
                                <p className="text-[10px] font-black text-slate-900">#{data.id.toString().padStart(6, "0")}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
}
