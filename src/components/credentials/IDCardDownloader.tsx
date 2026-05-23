"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { jsPDF } from "jspdf";
import { generateQRAction } from "@/actions/id-cards";

interface IDCardDownloaderProps {
    card: {
        name: string;
        image?: string;
        identifier: string;
        designation: string;
        department: string;
        issueDate: string;
        expiryDate: string;
        verificationCode: string;
    }
    userType: 'student' | 'staff';
}

export function IDCardDownloader({ card, userType }: IDCardDownloaderProps) {
    const [isGenerating, setIsGenerating] = useState(false);

    const generatePdf = async () => {
        setIsGenerating(true);
        try {
            // Standard ID Card size: 85.6mm x 54mm
            const doc = new jsPDF({
                orientation: "landscape",
                unit: "mm",
                format: [85.6, 54]
            });

            const width = 85.6;
            const height = 54;
            const isStudent = userType === 'student';

            // --- Front Side ---

            // Header Background
            doc.setFillColor(isStudent ? 79 : 15, isStudent ? 70 : 23, isStudent ? 229 : 42); // indigo-600 or slate-900
            doc.rect(0, 0, width, 18, "F");

            // Header Text
            doc.setTextColor(255, 255, 255);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            doc.text("ACADEMIC PORTAL", 5, 8);

            doc.setFontSize(10);
            doc.setFont("helvetica", "bolditalic");
            doc.text(isStudent ? "STUDENT ID" : "STAFF ID", width - 5, 8, { align: "right" });

            // Photo Placeholder / Image
            if (card.image) {
                try {
                    doc.addImage(card.image, "JPEG", 5, 22, 18, 18);
                    doc.setDrawColor(255, 255, 255);
                    doc.setLineWidth(0.5);
                    doc.rect(5, 22, 18, 18, "S");
                } catch (e) {
                    doc.setFillColor(241, 245, 249);
                    doc.rect(5, 22, 18, 18, "F");
                }
            } else {
                doc.setFillColor(241, 245, 249);
                doc.rect(5, 22, 18, 18, "F");
            }

            // Name & Title
            doc.setTextColor(15, 23, 42);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            doc.text(card.name.toUpperCase(), 28, 26);

            doc.setTextColor(isStudent ? 79 : 100, isStudent ? 70 : 116, isStudent ? 229 : 139);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(6);
            doc.text(card.designation.toUpperCase(), 28, 30);

            // Details
            doc.setTextColor(148, 163, 184); // slate-400
            doc.setFontSize(5);
            doc.text("IDENTIFIER", 28, 35);
            doc.text("DEPARTMENT", 28, 41);

            doc.setTextColor(30, 41, 59); // slate-800
            doc.setFontSize(6);
            doc.text(card.identifier, 28, 38);
            doc.text(card.department, 28, 44);

            // QR Code
            const qrDataUrl = await generateQRAction(card.verificationCode);
            if (qrDataUrl) {
                doc.addImage(qrDataUrl, "PNG", width - 20, 32, 15, 15);
            }

            // Footer Secutiry Strip
            doc.setFillColor(isStudent ? 79 : 15, isStudent ? 70 : 23, isStudent ? 229 : 42);
            doc.rect(0, height - 1.5, width, 1.5, "F");

            // --- Save ---
            doc.save(`${card.identifier}_ID_Card.pdf`);
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
            className="w-full bg-slate-900 hover:bg-slate-800 text-[10px] font-black uppercase tracking-widest gap-2 h-12 rounded-2xl transition-all active:scale-95 shadow-xl shadow-slate-200"
        >
            {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <Download className="w-4 h-4" />
            )}
            {isGenerating ? "Processing..." : "Download Official ID"}
        </Button>
    );
}
