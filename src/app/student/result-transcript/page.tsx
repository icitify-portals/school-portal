"use client";

import { useState, useEffect, useRef } from "react";
import { getMyTranscript, logTranscriptActivity } from "@/actions/result-module";
import { StandardTranscript } from "@/components/results/Transcript";
import { useSession } from "next-auth/react";
import {
  BookOpen, Printer, Loader2, AlertCircle, Layout,
} from "lucide-react";

function FSS2016DetailedResult({ student, transcripts, signatures }: any) {
  const valid = (transcripts || []).filter((t: any) => t.results && t.results.length > 0);
  const last = valid[valid.length - 1];
  const cgpa = last ? Number(last.cgpa).toFixed(2) : "N/A";
  const getClass = (v: number) => v >= 3.5 ? "DISTINCTION" : v >= 3.0 ? "UPPER CREDIT" : v >= 2.5 ? "LOWER CREDIT" : v >= 2.0 ? "PASS" : "FAIL";
  return (
    <div id="transcript-print-area" style={{ fontFamily: "'Times New Roman', Times, serif", background: "#fff", color: "#000", padding: "24px 32px" }}>
      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <div style={{ fontWeight: 900, fontSize: 18, letterSpacing: 0.5 }}>FEDERAL SCHOOL OF STATISTICS</div>
        <div style={{ fontSize: 10, fontStyle: "italic" }}>(National Bureau of Statistics)</div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, marginTop: 8 }}>
          <div style={{ textAlign: "left" }}>P.O. Box 20753, U.I. IBADAN<br />Telegram: STAT/IBADAN<br />Telephone 08023538477</div>
          <div style={{ textAlign: "right" }}>Ref. No: {student?.matricNumber || "-"}<br />Date: {new Date().toLocaleDateString()}</div>
        </div>
        <div style={{ fontWeight: 900, textDecoration: "underline", fontSize: 13, marginTop: 8 }}>EXAMINATION TRANSCRIPT</div>
        <div style={{ fontWeight: 700, textDecoration: "underline", fontSize: 11 }}>{(student?.programme?.name || "Programme").toUpperCase()}</div>
        <div style={{ fontSize: 9, marginTop: 6 }}>Below is the result of <strong style={{ textDecoration: "underline" }}>{(student?.user?.name || `${student?.firstName || ""} ${student?.lastName || ""}`.trim() || "STUDENT").toUpperCase()}</strong> in the {(student?.programme?.name || "")} {valid.map((t: any) => t.academicSession?.name).join(" to ")} session.</div>
      </div>
      {valid.map((tr: any) => (
        <div key={tr.id} style={{ marginBottom: 12, border: "1px solid #000", padding: 8 }}>
          <div style={{ fontWeight: 900, textAlign: "center", textDecoration: "underline", fontSize: 9, marginBottom: 6 }}>{tr.academicSession?.name} — {tr.semester === "1" ? "FIRST" : "SECOND"} SEMESTER (GPA {tr.gpa} | CGPA {tr.cgpa})</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9 }}>
            <thead><tr style={{ borderBottom: "1px solid #000" }}><th style={{ textAlign: "left", padding: 2 }}>CODE</th><th style={{ textAlign: "left", padding: 2 }}>TITLE</th><th style={{ textAlign: "center", padding: 2 }}>CREDIT</th><th style={{ textAlign: "center", padding: 2 }}>SCORE</th><th style={{ textAlign: "center", padding: 2 }}>GRADE</th></tr></thead>
            <tbody>{tr.results.map((r: any, i: number) => (<tr key={i} style={{ borderBottom: "0.5px solid #ccc" }}><td style={{ padding: 2, fontWeight: 600 }}>{r.courseCode}</td><td style={{ padding: 2 }}>{r.courseTitle}</td><td style={{ padding: 2, textAlign: "center" }}>{r.creditLoad}</td><td style={{ padding: 2, textAlign: "center" }}>{r.score}</td><td style={{ padding: 2, textAlign: "center", fontWeight: 700 }}>{r.grade}</td></tr>))}</tbody>
          </table>
        </div>
      ))}
      <div style={{ textAlign: "center", marginTop: 12, fontWeight: 900, borderTop: "2px solid #000", paddingTop: 8 }}>GRADUATING CGPA: {cgpa} — {getClass(parseFloat(cgpa) || 0)}</div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24, fontSize: 9 }}>
        <div style={{ textAlign: "center" }}><div style={{ borderBottom: "1px solid #000", width: 120, marginBottom: 4 }}>{signatures?.hodName || "HOD"}</div>Head of Department</div>
        <div style={{ textAlign: "center" }}><div style={{ borderBottom: "1px solid #000", width: 120, marginBottom: 4 }}>{signatures?.registrarName || "Registrar"}</div>Registrar</div>
      </div>
    </div>
  );
}

export default function StudentTranscriptPage() {
  const { data: session } = useSession();
  const [transcriptData, setTranscriptData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [template, setTemplate] = useState<"standard" | "detailed" | "fss_2016">("detailed");

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

    const res = await getMyTranscript(studentId, { viewForStudent: true });
    if (res.success) {
      setTranscriptData(res.data);
      logTranscriptActivity({
        action: "student_view",
        targetType: "transcript",
        targetId: studentId,
        targetLabel: res.data?.student?.matricNumber || `Student #${studentId}`,
      });
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
              {(["standard", "detailed", "fss_2016"] as const).map(t => (
                <button key={t} onClick={() => setTemplate(t as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${template === t ? "bg-violet-600 text-white shadow-md" : "text-slate-400 hover:text-white"}`}>
                  <Layout className="w-3.5 h-3.5" />
                  {t === "standard" ? "Standard" : t === "detailed" ? "Detailed" : "Detailed Result"}
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
            {template === "fss_2016" ? (
              <FSS2016DetailedResult student={transcriptData.student} transcripts={transcriptData.transcripts} signatures={transcriptData.signatures} />
            ) : (
              <StandardTranscript
                student={transcriptData.student}
                transcripts={transcriptData.transcripts}
                signatures={transcriptData.signatures}
                template={template as any}
              />
            )}
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
