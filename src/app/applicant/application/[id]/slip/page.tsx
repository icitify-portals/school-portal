"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import QRCode from "qrcode";
import { getApplicantApplication, getApplicantOLevelData } from "@/actions/admission_v2";
import { getBrandingSettings } from "@/actions/settings";
import { generateVerificationUrl } from "@/lib/verification-url";
import { Loader2, Printer, ArrowLeft, User, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ApplicationSlip() {
    const params = useParams();
    const router = useRouter();
    const { data: session, status } = useSession();
    const applicationId = parseInt(params.id as string);

    const [application, setApplication] = useState<any>(null);
    const [formData, setFormData] = useState<any>({});
    const [branding, setBranding] = useState<any>(null);
    const [olevels, setOlevels] = useState<any[]>([]);
    const [qrDataUrl, setQrDataUrl] = useState<string>("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === "authenticated" && session?.user?.id) {
            fetchApplication();
        } else if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, session]);

    const fetchApplication = async () => {
        setLoading(true);
        const [data, brandingData] = await Promise.all([
            getApplicantApplication(applicationId, parseInt(session!.user!.id)),
            getBrandingSettings(),
        ]);
        setBranding(brandingData);

        if (data) {
            setApplication(data);
            let parsed: any = {};
            if (data.data) {
                try {
                    parsed = typeof data.data === "string" ? JSON.parse(data.data) : data.data;
                } catch {
                    parsed = data.data || {};
                }
            }
            setFormData(parsed);

            const olevelData = await getApplicantOLevelData(applicationId, parseInt(session!.user!.id));
            setOlevels(olevelData);

            if (data.formNumber) {
                const verificationUrl = generateVerificationUrl(data.formNumber);
                const qrPayload = JSON.stringify({
                    fn: data.formNumber,
                    hash: data.formHash,
                    url: verificationUrl,
                    name: `${parsed.firstName || ""} ${parsed.lastName || ""}`.trim(),
                    status: data.status,
                });
                try {
                    const url = await QRCode.toDataURL(qrPayload, {
                        width: 200,
                        margin: 2,
                        color: { dark: "#1e1b4b", light: "#ffffff" },
                    });
                    setQrDataUrl(url);
                } catch {}
            }
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!application) {
        return (
            <div className="text-center py-20 text-slate-500 font-bold uppercase tracking-widest text-sm">
                Application Not Found
            </div>
        );
    }

    const applicantPhoto =
        application.applicantPhoto ||
        formData["Passport"] ||
        formData["Photo"] ||
        formData["Passport Photograph"] ||
        null;

    const SKIP_TYPES = ["image", "olevel_result"];

    return (
        <div className="min-h-screen bg-slate-100 py-10 px-4 print:p-0 print:bg-white">
            <div className="max-w-[210mm] mx-auto space-y-6">
                {/* Print Controls */}
                <div className="flex justify-between items-center print:hidden">
                    <Button onClick={() => router.back()} variant="ghost" className="rounded-xl font-bold uppercase tracking-widest text-xs text-slate-600 hover:text-slate-900">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <Button onClick={() => window.print()} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase tracking-widest text-xs shadow-lg shadow-indigo-100 px-6">
                        <Printer className="w-4 h-4 mr-2" /> Print Application Summary
                    </Button>
                </div>

                {/* The Print Document */}
                <div className="bg-white shadow-2xl print:shadow-none print:border-none print:rounded-none overflow-hidden relative">
                    {/* Security Watermark Background */}
                    <div
                        className="absolute inset-0 pointer-events-none opacity-[0.02] print:opacity-[0.03]"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='100' y='100' text-anchor='middle' dominant-baseline='middle' font-size='14' font-weight='900' fill='%231e1b4b' transform='rotate(-30 100 100)' font-family='system-ui'%3EFSS ADMISSION%3C/text%3E%3C/svg%3E")`,
                            backgroundSize: "200px 200px",
                        }}
                    />

                    {/* Security Pattern Border */}
                    <div className="absolute inset-0 pointer-events-none border-[6px] border-transparent print:border-[4px]"
                        style={{
                            borderImage: `repeating-linear-gradient(45deg, #4f46e5 0, #4f46e5 2px, transparent 2px, transparent 8px) 6`,
                        }}
                    />

                    <div className="relative z-10">
                        {/* School Header */}
                        <div className="border-b-4 border-indigo-600 px-10 py-8 flex items-center gap-8 print:border-b-4 print:border-black">
                            {branding?.portalLogo ? (
                                <img src={branding.portalLogo} alt="School Logo" className="w-24 h-24 object-contain" />
                            ) : (
                                <div className="w-24 h-24 bg-indigo-50 rounded-2xl flex items-center justify-center print:bg-gray-100">
                                    <User className="w-10 h-10 text-indigo-300 print:text-gray-400" />
                                </div>
                            )}
                            <div className="flex-1 text-center">
                                <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight print:text-black">
                                    {branding?.portalName || "Federal School of Statistics, Ibadan"}
                                </h1>
                                {branding?.schoolMotto && (
                                    <p className="text-xs font-bold text-slate-500 italic mt-1 print:text-gray-600">{branding.schoolMotto}</p>
                                )}
                                {branding?.schoolAddress && (
                                    <p className="text-[10px] font-bold text-slate-400 mt-2 print:text-gray-500">{branding.schoolAddress}</p>
                                )}
                            </div>
                        </div>

                        {/* Title Bar */}
                        <div className="bg-slate-50 px-10 py-5 text-center border-b border-slate-200 print:bg-white print:border-b print:border-gray-300">
                            <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest print:text-black">Application Summary</h2>
                            <p className="text-[10px] font-bold text-slate-400 mt-1 print:text-gray-500">
                                {application.template?.name || "Admission Application"}
                            </p>
                        </div>

                        <div className="px-10 py-8">
                            {/* Passport + Key Details + QR Code */}
                            <div className="flex gap-8 items-start mb-8">
                                {/* Passport Photo */}
                                <div className="w-36 shrink-0">
                                    <div className="w-36 h-44 bg-slate-50 border-2 border-slate-200 rounded-xl overflow-hidden print:border print:border-gray-300">
                                        {applicantPhoto ? (
                                            <img src={applicantPhoto} alt="Passport" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-200 print:text-gray-300">
                                                <User className="w-12 h-12" />
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[8px] font-bold text-center text-slate-400 mt-1 uppercase tracking-widest print:text-gray-500">
                                        Passport Photo
                                    </p>
                                </div>

                                {/* Key Details */}
                                <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-4">
                                    {application.template?.sections
                                        ?.flatMap((s: any) => s.fields)
                                        .filter((f: any) => !SKIP_TYPES.includes(f.type) && f.type !== "file")
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
                                                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 print:text-gray-500">
                                                        {field.label}
                                                    </p>
                                                    <p className="text-xs font-bold text-slate-800 print:text-black">{display}</p>
                                                </div>
                                            );
                                        })}
                                </div>

                                {/* QR Code + Form Number */}
                                <div className="shrink-0 text-center space-y-2">
                                    {qrDataUrl && (
                                        <img src={qrDataUrl} alt="QR Code" className="w-36 h-36 print:w-32 print:h-32" />
                                    )}
                                    {application.formNumber && (
                                        <div>
                                            <p className="text-[7px] font-black uppercase tracking-widest text-slate-400 print:text-gray-500">
                                                Form Number
                                            </p>
                                            <p className="text-[11px] font-black text-indigo-700 font-mono print:text-black">
                                                {application.formNumber}
                                            </p>
                                        </div>
                                    )}
                                    {application.formHash && (
                                        <div>
                                            <p className="text-[7px] font-black uppercase tracking-widest text-slate-400 print:text-gray-500">
                                                Security Code
                                            </p>
                                            <p className="text-[9px] font-mono font-bold text-slate-600 print:text-black">
                                                {application.formHash}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Application Status Bar */}
                            <div className="bg-indigo-50 rounded-xl p-4 mb-8 flex items-center gap-6 text-xs font-bold print:bg-gray-50 print:border print:border-gray-200">
                                <div>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400 block print:text-gray-500">Status</span>
                                    <span className="text-indigo-900 uppercase print:text-black">{application.status}</span>
                                </div>
                                <div className="w-px h-8 bg-indigo-200 print:bg-gray-300" />
                                <div>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400 block print:text-gray-500">Payment</span>
                                    <span className="text-indigo-900 uppercase print:text-black">{application.paymentStatus || "Pending"}</span>
                                </div>
                                <div className="w-px h-8 bg-indigo-200 print:bg-gray-300" />
                                <div>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400 block print:text-gray-500">Submitted</span>
                                    <span className="text-indigo-900 print:text-black">
                                        {application.appliedAt
                                            ? new Date(application.appliedAt).toLocaleDateString("en-NG", {
                                                  year: "numeric",
                                                  month: "long",
                                                  day: "numeric",
                                              })
                                            : "N/A"}
                                    </span>
                                </div>
                                <div className="w-px h-8 bg-indigo-200 print:bg-gray-300" />
                                <div>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400 block print:text-gray-500">Verify Online</span>
                                    <span className="text-indigo-900 font-mono text-[10px] print:text-black">
                                        {application.formNumber ? `portal/verify/${application.formNumber}` : "N/A"}
                                    </span>
                                </div>
                            </div>

                            {/* O-Level Results */}
                            {olevels.length > 0 && (
                                <div className="mb-8">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 print:text-gray-500">
                                        O-Level Results
                                    </h3>
                                    {olevels.map((sitting, sIdx) => (
                                        <div key={sIdx} className="mb-4 border border-slate-200 rounded-xl overflow-hidden print:border print:border-gray-300 print:rounded-none">
                                            <div className="bg-slate-50 px-4 py-2 flex items-center gap-4 text-[10px] font-bold text-slate-600 border-b border-slate-200 print:bg-gray-50 print:border-b print:border-gray-300">
                                                <span className="bg-indigo-600 text-white w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black print:bg-gray-800">
                                                    {sIdx + 1}
                                                </span>
                                                <span className="print:text-black">{sitting.examBodyName}</span>
                                                <span className="text-slate-300 print:text-gray-400">|</span>
                                                <span className="print:text-black">{sitting.examYear}</span>
                                                <span className="text-slate-300 print:text-gray-400">|</span>
                                                <span className="print:text-black">Reg: {sitting.examNumber}</span>
                                            </div>
                                            <div className="p-4 print:p-2">
                                                <table className="w-full text-[11px]">
                                                    <thead>
                                                        <tr className="text-[8px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 print:border-b print:border-gray-300 print:text-gray-500">
                                                            <th className="text-left py-1.5">S/N</th>
                                                            <th className="text-left py-1.5">Subject</th>
                                                            <th className="text-center py-1.5">Grade</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {sitting.subjects.map((sub: any, subIdx: number) => (
                                                            <tr key={subIdx} className="border-b border-slate-50 print:border-b print:border-gray-200">
                                                                <td className="py-1.5 font-bold text-slate-400 print:text-gray-500">{subIdx + 1}</td>
                                                                <td className="py-1.5 font-semibold text-slate-700 print:text-black">{sub.subjectName}</td>
                                                                <td className="py-1.5 text-center font-black text-indigo-600 print:text-black">{sub.grade}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Microprint Line */}
                            <div className="print:block hidden text-center mb-4">
                                <p className="text-[3px] tracking-[0.5px] text-slate-300 leading-none">
                                    {"FSS ADMISSION FORM 2026 • ".repeat(40)}
                                </p>
                            </div>

                            {/* Verification Instructions */}
                            <div className="bg-emerald-50 rounded-xl p-4 mb-8 flex items-start gap-4 print:bg-gray-50 print:border print:border-gray-200">
                                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5 print:text-gray-600" />
                                <div className="text-[10px] font-bold text-emerald-700 leading-relaxed print:text-gray-700">
                                    <span className="font-black uppercase tracking-widest">How to verify this form:</span>{" "}
                                    Scan the QR code above with any smartphone camera, or visit the verification portal and enter form number{" "}
                                    <span className="font-mono font-black">{application.formNumber || "N/A"}</span>. The security hash{" "}
                                    <span className="font-mono">{application.formHash || "N/A"}</span> confirms this document was generated by the official portal system.
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="pt-6 border-t border-slate-200 flex justify-between items-end print:border-t print:border-gray-300">
                                <div>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-300 print:text-gray-400">Generated On</p>
                                    <p className="text-[10px] font-bold text-slate-500 print:text-gray-600">
                                        {new Date().toLocaleDateString("en-NG", {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-300 print:text-gray-400">Form Number</p>
                                    <p className="text-sm font-black text-slate-900 font-mono print:text-black">
                                        {application.formNumber || "N/A"}
                                    </p>
                                </div>
                            </div>

                            {/* Bottom microprint */}
                            <div className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-8 print:mt-6 print:text-gray-500">
                                Generated by Portal System &bull; Tamper-proof document &bull; Verify at portal
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
