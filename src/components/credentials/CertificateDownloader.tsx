"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { jsPDF } from "jspdf";

interface CertificateDownloaderProps {
    certificate: {
        certificateCode: string;
        courseName: string;
        courseCode: string;
        issuedAt: string | Date;
        studentName: string;
        template: {
            title: string;
            signatureName?: string;
            signatureTitle?: string;
        }
    }
}

export function CertificateDownloader({ certificate }: CertificateDownloaderProps) {
    const [isGenerating, setIsGenerating] = useState(false);

    const generatePdf = async () => {
        setIsGenerating(true);
        try {
            const doc = new jsPDF({
                orientation: "landscape",
                unit: "mm",
                format: "a4"
            });

            const width = doc.internal.pageSize.getWidth();
            const height = doc.internal.pageSize.getHeight();

            // --- Background & Border ---
            doc.setFillColor(252, 252, 252);
            doc.rect(0, 0, width, height, "F");

            // Decorative border
            doc.setDrawColor(30, 41, 59); // slate-800
            doc.setLineWidth(2);
            doc.rect(10, 10, width - 20, height - 20, "S");

            doc.setDrawColor(245, 158, 11); // amber-500
            doc.setLineWidth(0.5);
            doc.rect(12, 12, width - 24, height - 24, "S");

            // --- Content ---
            doc.setTextColor(30, 41, 59);

            // Header
            doc.setFont("helvetica", "bold");
            doc.setFontSize(40);
            doc.text(certificate.template.title.toUpperCase(), width / 2, 50, { align: "center" });

            doc.setFont("helvetica", "normal");
            doc.setFontSize(16);
            doc.text("THIS IS TO CERTIFY THAT", width / 2, 70, { align: "center" });

            // Student Name
            doc.setTextColor(79, 70, 229); // indigo-600
            doc.setFont("helvetica", "bolditalic");
            doc.setFontSize(36);
            doc.text(certificate.studentName.toUpperCase(), width / 2, 90, { align: "center" });

            // Course Info
            doc.setTextColor(30, 41, 59);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(16);
            doc.text("HAS SUCCESSFULLY COMPLETED THE COURSE", width / 2, 110, { align: "center" });

            doc.setFont("helvetica", "bold");
            doc.setFontSize(24);
            doc.text(`${certificate.courseName} (${certificate.courseCode})`, width / 2, 125, { align: "center" });

            // Date
            doc.setFont("helvetica", "normal");
            doc.setFontSize(12);
            const dateStr = new Date(certificate.issuedAt).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'long', year: 'numeric'
            });
            doc.text(`Issued on ${dateStr}`, width / 2, 145, { align: "center" });

            // Signature Section
            const sigY = 175;
            doc.setDrawColor(203, 213, 225); // slate-300
            doc.setLineWidth(0.5);
            doc.line(width / 2 - 40, sigY, width / 2 + 40, sigY);

            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text(certificate.template.signatureName || "Academic Registrar", width / 2, sigY + 7, { align: "center" });
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.text(certificate.template.signatureTitle || "Office of the Vice Chancellor", width / 2, sigY + 12, { align: "center" });

            // Footer / Verification
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184); // slate-400
            doc.text(`Verification ID: ${certificate.certificateCode}`, 20, height - 15);
            doc.text("This certificate is digital and can be verified on our official portal.", width - 20, height - 15, { align: "right" });

            // Save
            doc.save(`${certificate.courseCode}_Certificate.pdf`);
        } catch (error) {
            console.error("PDF generation failed:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Button
            onClick={generatePdf}
            disabled={isGenerating}
            className="flex-1 bg-slate-900 hover:bg-slate-800 text-[10px] font-black uppercase tracking-widest gap-2 h-10 rounded-xl transition-all active:scale-95 shadow-lg shadow-slate-200"
        >
            {isGenerating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
                <Download className="w-3.5 h-3.5" />
            )}
            {isGenerating ? "Generating..." : "Download PDF"}
        </Button>
    );
}
