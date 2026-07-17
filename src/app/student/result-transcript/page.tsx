"use client";

import { useState, useEffect, useRef } from "react";
import { getMyTranscript } from "@/actions/result-module";
import { StandardTranscript } from "@/components/results/Transcript";
import { useSession } from "next-auth/react";
import {
  BookOpen, Printer, Loader2, AlertCircle, Layout,
} from "lucide-react";

export default function StudentTranscriptPage() {
  const { data: session } = useSession();
  const [transcriptData, setTranscriptData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [template, setTemplate] = useState<"standard" | "detailed">("detailed");

  useEffect(() => {
    fetchTranscript();
  }, [session]);

  async function fetchTranscript() {
    if (!session?.user) return;
    setLoading(true);

    // Get the student ID from the session - typical pattern in this portal
    const studentId = (session.user as any).studentId;
    if (!studentId) {
      setError("Student profile not found.");
      setLoading(false);
      return;
    }

    const res = await getMyTranscript(studentId);
    if (res.success) {
      setTranscriptData(res.data);
    } else {
      setError(res.error || "Failed to load transcript");
    }
    setLoading(false);
  }

  function handlePrint() {
    const printArea = document.getElementById("transcript-print-area");
    if (!printArea) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
      <html>
        <head>
          <title>Academic Transcript</title>
          <style>
            * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            body { margin: 0; padding: 0; }
            @page { margin: 1cm; size: A4 portrait; }
          </style>
        </head>
        <body>${printArea.outerHTML}</body>
      </html>
    `);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 500);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-violet-400 animate-spin mx-auto mb-3" />
          <p className="text-slate-400">Loading your transcript...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] flex items-center justify-center">
        <div className="text-center bg-white/5 rounded-2xl p-12 border border-white/10 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-300 text-lg font-semibold">{error}</p>
          <p className="text-slate-500 mt-2">Please contact the Registrar's office if you believe this is an error.</p>
        </div>
      </div>
    );
  }

  const hasTranscripts = transcriptData?.transcripts?.length > 0;
  const finalCGPA = hasTranscripts
    ? transcriptData.transcripts[transcriptData.transcripts.length - 1].cgpa
    : "N/A";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-white/5 backdrop-blur-sm px-6 py-5 no-print">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">My Academic Transcript</h1>
              <p className="text-sm text-slate-400">
                Cumulative CGPA: <span className="text-emerald-400 font-bold text-base">{finalCGPA}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Template Switcher */}
            <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
              {(["standard", "detailed"] as const).map(t => (
                <button key={t} onClick={() => setTemplate(t)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${template === t ? "bg-violet-600 text-white shadow-md" : "text-slate-400 hover:text-white"}`}>
                  <Layout className="w-3.5 h-3.5" />
                  {t === "standard" ? "Standard" : "Detailed"}
                </button>
              ))}
            </div>

            <button onClick={handlePrint} disabled={!hasTranscripts}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white font-semibold text-sm shadow-lg disabled:opacity-60 transition-all">
              <Printer className="w-4 h-4" /> Print Transcript
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {hasTranscripts && (
        <div className="max-w-6xl mx-auto px-6 py-6 no-print">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Semesters", value: transcriptData.transcripts.length, color: "from-blue-500 to-cyan-500" },
              { label: "Total Credits", value: transcriptData.transcripts.reduce((a: number, t: any) => a + t.totalCreditsEarned, 0), color: "from-violet-500 to-indigo-500" },
              { label: "Final CGPA", value: finalCGPA, color: "from-emerald-500 to-teal-500" },
              { label: "Status", value: "Verified", color: "from-amber-500 to-orange-500" },
            ].map(s => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                <p className={`text-2xl font-black bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>{s.value}</p>
                <p className="text-xs text-slate-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transcript Content */}
      <div className="max-w-6xl mx-auto px-6 pb-12">
        {!hasTranscripts ? (
          <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
            <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-xl font-semibold text-slate-400">No Published Results Yet</p>
            <p className="text-slate-500 mt-2">Your transcript will appear here once the administration publishes your results.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
            <StandardTranscript
              student={transcriptData.student}
              transcripts={transcriptData.transcripts}
              signatures={transcriptData.signatures}
              template={template}
            />
          </div>
        )}
      </div>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
}
