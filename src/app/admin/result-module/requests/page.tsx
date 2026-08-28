"use client";

import React, { useEffect, useState } from "react";
import { getAdminTranscriptRequests, dispatchTranscript } from "@/actions/transcript-requests";
import { getMyTranscript } from "@/actions/result-module";
import { Loader2, Send, CheckCircle2, FileText, Search } from "lucide-react";
import Link from "next/link";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function AdminTranscriptRequestsPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dispatchingId, setDispatchingId] = useState<number | null>(null);

    useEffect(() => {
        loadRequests();
    }, []);

    async function loadRequests() {
        const res = await getAdminTranscriptRequests();
        if (res.success) setRequests(res.data || []);
        setLoading(false);
    }

    async function handleDispatch(req: any) {
        if (!confirm(`Are you sure you want to mark this transcript for ${req.applicantName} as Dispatched? An email with the student copy will be sent automatically.`)) return;

        setDispatchingId(req.id);
        
        try {
            let pdfBase64 = "";

            // Try to generate a real transcript PDF if we can find the student
            if (req.studentId) {
                try {
                    const transcriptRes = await getMyTranscript(req.studentId);
                    if (transcriptRes?.success && transcriptRes.data?.transcripts?.length > 0) {
                        // Render transcript data into a simple PDF
                        const pdf = new jsPDF();
                        let y = 20;

                        pdf.setFont("helvetica", "bold");
                        pdf.setFontSize(18);
                        pdf.text("FEDERAL SCHOOL OF STATISTICS", 105, y, { align: "center" });
                        y += 8;
                        pdf.setFontSize(12);
                        pdf.text("(National Bureau of Statistics)", 105, y, { align: "center" });
                        y += 10;

                        pdf.setFontSize(14);
                        pdf.text("ACADEMIC TRANSCRIPT", 105, y, { align: "center" });
                        y += 12;

                        pdf.setFont("helvetica", "normal");
                        pdf.setFontSize(11);
                        pdf.text(`Student: ${req.applicantName}`, 20, y); y += 7;
                        pdf.text(`Matric No: ${req.matricNumber || "N/A"}`, 20, y); y += 7;
                        pdf.text(`Destination: ${req.destinationName}`, 20, y); y += 12;

                        const txData = transcriptRes.data;
                        for (const tx of txData.transcripts || []) {
                            if (y > 260) { pdf.addPage(); y = 20; }
                            const semLabel = tx.semester === "1" ? "First Semester" : tx.semester === "2" ? "Second Semester" : `Semester ${tx.semester}`;
                            const sessionName = tx.academicSession?.name || "Unknown Session";
                            pdf.setFont("helvetica", "bold");
                            pdf.text(`${sessionName} - ${semLabel}`, 20, y); y += 7;

                            pdf.setFont("helvetica", "normal");
                            for (const r of tx.results || []) {
                                if (y > 270) { pdf.addPage(); y = 20; }
                                pdf.text(`${r.courseCode} - ${r.courseTitle} | Score: ${r.score} | Grade: ${r.grade}`, 24, y);
                                y += 6;
                            }
                            pdf.setFont("helvetica", "bold");
                            pdf.text(`GPA: ${tx.gpa}  CGPA: ${tx.cgpa}`, 24, y);
                            y += 10;
                        }

                        pdf.text(`Date Dispatched: ${new Date().toLocaleDateString()}`, 20, y);
                        pdfBase64 = pdf.output("datauristring").split(",")[1];
                    }
                } catch (e) {
                    console.error("Failed to generate real transcript PDF:", e);
                }
            }

            // Fallback: basic placeholder PDF
            if (!pdfBase64) {
                const pdf = new jsPDF();
                pdf.setFont("helvetica", "bold");
                pdf.setFontSize(18);
                pdf.text("FEDERAL SCHOOL OF STATISTICS", 105, 20, { align: "center" });
                pdf.setFont("helvetica", "normal");
                pdf.setFontSize(12);
                pdf.text("STUDENT COPY - ACADEMIC TRANSCRIPT", 105, 30, { align: "center" });
                pdf.text(`Name: ${req.applicantName}`, 20, 50);
                pdf.text(`Matriculation No: ${req.matricNumber || "N/A"}`, 20, 60);
                pdf.text(`Date Requested: ${new Date(req.requestedAt).toLocaleDateString()}`, 20, 70);
                pdf.text(`Official copy dispatched to: ${req.destinationName}`, 20, 90);
                pdfBase64 = pdf.output("datauristring").split(",")[1];
            }

            const res = await dispatchTranscript(req.id, 0, pdfBase64);
            if (res.success) {
                alert("Transcript dispatched and email sent!");
                loadRequests();
            } else {
                alert("Error: " + res.error);
            }
        } catch (e: any) {
            alert("Exception: " + e.message);
        } finally {
            setDispatchingId(null);
        }
    }

    return (
        <div className="p-6 md:p-8 bg-slate-50 min-h-screen">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Transcript Requests</h1>
                        <p className="text-sm text-slate-500">Manage and dispatch paid transcript applications</p>
                    </div>
                    <Link href="/admin/result-module" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                        &larr; Back to Result Module
                    </Link>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    {loading ? (
                        <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
                    ) : requests.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">No paid transcript requests found.</div>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                                <tr>
                                    <th className="py-4 px-6">Applicant</th>
                                    <th className="py-4 px-6">Destination</th>
                                    <th className="py-4 px-6">Payment</th>
                                    <th className="py-4 px-6">Status</th>
                                    <th className="py-4 px-6">Date</th>
                                    <th className="py-4 px-6 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {requests.map(req => (
                                    <tr key={req.id} className="hover:bg-slate-50/50">
                                        <td className="py-4 px-6">
                                            <div className="font-semibold text-slate-800">{req.applicantName}</div>
                                            <div className="text-xs text-slate-500">{req.matricNumber}</div>
                                            <div className="text-xs text-slate-500">{req.applicantEmail}</div>
                                        </td>
                                        <td className="py-4 px-6 max-w-xs">
                                            <div className="font-medium text-slate-700">{req.destinationName}</div>
                                            <div className="text-xs text-slate-500 truncate">{req.destinationAddress}</div>
                                            <div className="text-xs font-semibold text-indigo-600 mt-1 uppercase tracking-wider">{req.deliveryMethod}</div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="mb-1">
                                                {req.paymentStatus === 'paid' ? (
                                                    <span className="text-emerald-700 bg-emerald-100 px-2 py-1 rounded text-xs font-bold">ALL PAID</span>
                                                ) : (
                                                    <span className="text-amber-700 bg-amber-100 px-2 py-1 rounded text-xs font-bold uppercase">{req.paymentStatus}</span>
                                                )}
                                            </div>
                                            <div className="text-xs text-slate-500 mt-2 flex flex-col gap-1">
                                                <span>Transcript: <span className={req.alatpayStatus === 'paid' ? 'text-emerald-600 font-bold uppercase' : 'text-rose-600 font-bold uppercase'}>{req.alatpayStatus}</span></span>
                                                <span>Processing: <span className={req.paystackStatus === 'paid' ? 'text-emerald-600 font-bold uppercase' : 'text-rose-600 font-bold uppercase'}>{req.paystackStatus}</span></span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            {req.approvalStatus === 'dispatched' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                                                    <CheckCircle2 className="w-3 h-3" /> Dispatched
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                                                    Pending Dispatch
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-slate-600">
                                            {new Date(req.requestedAt).toLocaleDateString()}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            {req.approvalStatus !== 'dispatched' && (
                                                <button 
                                                    onClick={() => handleDispatch(req)}
                                                    disabled={dispatchingId === req.id}
                                                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                                >
                                                    {dispatchingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                                    Dispatch & Email
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
