"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Award, ShieldCheck } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "sonner";

interface Props {
    studentName: string;
    courseName: string;
    quizTitle: string;
    score: number;
    date: string;
}

export function CertificateGenerator({ studentName, courseName, quizTitle, score, date }: Props) {
    const certificateRef = useRef<HTMLDivElement>(null);

    const downloadPDF = async () => {
        if (!certificateRef.current) return;

        const toastId = toast.loading("Generating your secure certificate...");

        try {
            const canvas = await html2canvas(certificateRef.current, {
                scale: 3, // High quality
                useCORS: true,
                backgroundColor: "#ffffff"
            });

            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF({
                orientation: "landscape",
                unit: "px",
                format: [canvas.width, canvas.height]
            });

            pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
            pdf.save(`Certificate_${studentName.replace(' ', '_')}_${quizTitle.replace(' ', '_')}.pdf`);

            toast.success("Certificate downloaded successfully!", { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate certificate.", { id: toastId });
        }
    };

    return (
        <div className="space-y-6">
            <Button
                onClick={downloadPDF}
                className="w-full py-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-100"
            >
                <Download className="w-4 h-4 mr-2" /> Download Digital Certificate
            </Button>

            {/* Hidden Certificate Template for PDF generation */}
            <div className="fixed -left-[9999px] top-0">
                <div
                    ref={certificateRef}
                    className="w-[1123px] h-[794px] bg-white p-12 relative overflow-hidden border-[16px] border-double border-indigo-600 flex flex-col items-center text-center font-sans shadow-2xl"
                >
                    {/* Background Decorative Elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-bl-full opacity-50 -mr-20 -mt-20" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-50 rounded-tr-full opacity-50 -ml-20 -mb-20" />

                    {/* Logo/Header */}
                    <div className="mb-8 flex flex-col items-center">
                        <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4 transform rotate-12">
                            <Award className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-xl font-black uppercase tracking-[0.3em] text-slate-400">Certificate of Achievement</h2>
                    </div>

                    {/* Body */}
                    <div className="flex-1 flex flex-col justify-center gap-6">
                        <p className="text-2xl font-medium text-slate-600 italic">This is to certify that</p>
                        <h1 className="text-7xl font-black text-slate-900 tracking-tight border-b-4 border-indigo-600 pb-4 inline-block mx-auto min-w-[600px]">
                            {studentName}
                        </h1>
                        <p className="text-2xl font-medium text-slate-600 max-w-2xl mx-auto leading-relaxed">
                            has successfully completed the assessment for <br />
                            <span className="text-indigo-600 font-black uppercase tracking-wide">{courseName}</span>
                        </p>
                        <p className="text-xl font-bold text-slate-800 bg-slate-100 px-6 py-2 rounded-full inline-block mx-auto">
                            {quizTitle}
                        </p>
                    </div>

                    {/* Footer / Footer Info */}
                    <div className="w-full flex justify-between items-end mt-12 border-t border-slate-100 pt-8">
                        <div className="text-left">
                            <p className="text-xs font-black uppercase text-slate-400 mb-1">Date Issued</p>
                            <p className="text-lg font-bold text-slate-900">{date}</p>
                        </div>

                        <div className="flex flex-col items-center">
                            <div className="w-24 h-24 mb-2 flex items-center justify-center border-2 border-dashed border-indigo-200 rounded-full opacity-30">
                                <ShieldCheck className="w-12 h-12 text-indigo-300" />
                            </div>
                            <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Digital Verification Secured</p>
                        </div>

                        <div className="text-right">
                            <p className="text-xs font-black uppercase text-slate-400 mb-1">Final Score</p>
                            <p className="text-3xl font-black text-indigo-600">{score}%</p>
                        </div>
                    </div>

                    {/* Digital Seal */}
                    <div className="absolute top-12 left-12 w-32 h-32 rounded-full border-4 border-indigo-100 flex items-center justify-center opacity-20">
                        <p className="text-[10px] font-black uppercase rotate-45 text-slate-400">Authentic Original</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
