"use client";

import React from "react";

interface CourseResult {
  courseCode: string;
  courseTitle: string;
  creditLoad: number;
  score: string | null;
  grade: string;
  gradePoint: string;
}

interface SemesterTranscript {
  id: number;
  semester: string;
  cgpa: string;
  gpa: string;
  totalCreditsEarned: number;
  totalCreditsAttempted: number;
  academicSession: { name: string } | null;
  results: CourseResult[];
}

interface Student {
  firstName: string | null;
  lastName: string | null;
  otherNames: string | null;
  admissionNumber: string | null;
  matricNumber: string | null;
  currentLevel: number | null;
  user: { name: string } | null;
  programme: { name: string } | null;
}

interface Signatures {
  registrarName: string;
  registrarSignature: string | null;
  hodName: string;
  hodSignature: string | null;
}

interface TranscriptProps {
  student: Student | null;
  transcripts: SemesterTranscript[];
  signatures: Signatures;
  institutionName?: string;
  institutionAddress?: string;
  institutionLogoUrl?: string;
  template?: "standard" | "detailed";
}

function gradeColor(grade: string) {
  if (grade.startsWith("A")) return "#059669";
  if (grade.startsWith("B")) return "#2563eb";
  if (grade.startsWith("C")) return "#d97706";
  if (grade.startsWith("D") || grade === "E") return "#ea580c";
  return "#dc2626";
}

function semesterLabel(s: string) {
  return s === "1" ? "First Semester" : s === "2" ? "Second Semester" : "Third/Summer Semester";
}

export function StandardTranscript({
  student,
  transcripts,
  signatures,
  institutionName = "Federal Polytechnic",
  institutionAddress = "Nigeria",
  institutionLogoUrl,
  template = "standard",
}: TranscriptProps) {
  const finalCGPA = transcripts.length > 0 ? transcripts[transcripts.length - 1].cgpa : "N/A";
  const fullName = student
    ? `${student.lastName || ""} ${student.firstName || ""} ${student.otherNames || ""}`.trim()
    : "N/A";

  if (template === "standard") {
    return (
      <div
        id="transcript-print-area"
        style={{
          fontFamily: "'Times New Roman', Times, serif",
          background: "#fff",
          color: "#111",
          maxWidth: 900,
          margin: "0 auto",
          padding: "40px 50px",
          position: "relative",
          border: "1px solid #ddd",
          boxShadow: "0 4px 32px rgba(0,0,0,0.08)",
        }}
      >
        {/* Watermark */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          pointerEvents: "none", zIndex: 0, opacity: 0.04,
          fontSize: 100, fontWeight: 900, color: "#000",
          transform: "rotate(-30deg)", userSelect: "none",
        }}>
          OFFICIAL
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Header */}
          <div style={{ textAlign: "center", borderBottom: "3px double #1a1a1a", paddingBottom: 16, marginBottom: 20 }}>
            {institutionLogoUrl && (
              <img src={institutionLogoUrl} alt="Logo" style={{ height: 70, marginBottom: 8 }} />
            )}
            <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0, letterSpacing: 1 }}>{institutionName.toUpperCase()}</h1>
            <p style={{ fontSize: 11, margin: "4px 0 0", color: "#555" }}>{institutionAddress}</p>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: "10px 0 0", letterSpacing: 2, color: "#1a1a1a" }}>
              OFFICIAL ACADEMIC TRANSCRIPT
            </h2>
          </div>

          {/* Student Info */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 24px", fontSize: 12, marginBottom: 20, background: "#f9f9f9", border: "1px solid #eee", borderRadius: 4, padding: "12px 16px" }}>
            {[
              ["Student Name", fullName],
              ["Matric Number", student?.matricNumber || student?.admissionNumber || "N/A"],
              ["Programme", student?.programme?.name || "N/A"],
              ["Level", student?.currentLevel ? `${student.currentLevel} Level` : "N/A"],
              ["Date Issued", new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })],
              ["Cumulative CGPA", finalCGPA],
            ].map(([label, value]) => (
              <div key={label} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "3px 0" }}>
                <span style={{ fontWeight: 700, minWidth: 130, color: "#444" }}>{label}:</span>
                <span style={{ fontWeight: label === "Cumulative CGPA" ? 900 : 400, color: label === "Cumulative CGPA" ? "#059669" : "#111" }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Semester Tables */}
          {transcripts.map((tr) => (
            <div key={tr.id} style={{ marginBottom: 24 }}>
              <div style={{
                background: "#1a1a1a", color: "#fff", padding: "6px 12px",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                borderRadius: "4px 4px 0 0", fontSize: 12,
              }}>
                <span style={{ fontWeight: 700 }}>{tr.academicSession?.name} — {semesterLabel(tr.semester)}</span>
                <span>GPA: {tr.gpa} | CGPA: {tr.cgpa}</span>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={{ background: "#f0f0f0" }}>
                    {["Course Code", "Course Title", "Score", "Grade", "Grade Point", "Credit Units"].map(h => (
                      <th key={h} style={{ border: "1px solid #ccc", padding: "5px 8px", textAlign: "left", fontWeight: 700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tr.results.map((r, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td style={{ border: "1px solid #ddd", padding: "4px 8px", fontWeight: 700 }}>{r.courseCode}</td>
                      <td style={{ border: "1px solid #ddd", padding: "4px 8px" }}>{r.courseTitle}</td>
                      <td style={{ border: "1px solid #ddd", padding: "4px 8px", textAlign: "center" }}>{r.score || "—"}</td>
                      <td style={{ border: "1px solid #ddd", padding: "4px 8px", textAlign: "center", fontWeight: 900, color: gradeColor(r.grade) }}>{r.grade}</td>
                      <td style={{ border: "1px solid #ddd", padding: "4px 8px", textAlign: "center" }}>{Number(r.gradePoint).toFixed(2)}</td>
                      <td style={{ border: "1px solid #ddd", padding: "4px 8px", textAlign: "center" }}>{r.creditLoad}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: "#e8f5e9", fontWeight: 700 }}>
                    <td colSpan={4} style={{ border: "1px solid #ccc", padding: "4px 8px", textAlign: "right" }}>
                      Total Credits: {tr.totalCreditsAttempted} | Semester GPA: {tr.gpa}
                    </td>
                    <td colSpan={2} style={{ border: "1px solid #ccc", padding: "4px 8px", textAlign: "center" }}>
                      CGPA: <strong>{tr.cgpa}</strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ))}

          {/* Grading Key */}
          <div style={{ border: "1px solid #ddd", borderRadius: 4, padding: "10px 14px", marginBottom: 24, fontSize: 10 }}>
            <p style={{ fontWeight: 700, marginBottom: 4 }}>GRADING KEY:</p>
            <div style={{ display: "flex", gap: 24 }}>
              {[["A", "70–100", "Excellent"], ["B", "60–69", "Good"], ["C", "50–59", "Average"], ["D/E", "40–49", "Pass"], ["F", "0–39", "Fail"]].map(([g, r, l]) => (
                <span key={g}><strong style={{ color: gradeColor(g) }}>{g}</strong>: {r} ({l})</span>
              ))}
            </div>
          </div>

          {/* Signatures */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginTop: 32 }}>
            {[
              { label: "Head of Department", name: signatures.hodName, url: signatures.hodSignature },
              { label: "Registrar", name: signatures.registrarName, url: signatures.registrarSignature },
            ].map(sig => (
              <div key={sig.label} style={{ borderTop: "1px solid #aaa", paddingTop: 8, textAlign: "center" }}>
                {sig.url ? (
                  <img src={sig.url} alt={sig.label} style={{ height: 55, objectFit: "contain", marginBottom: 4 }} />
                ) : (
                  <div style={{ height: 55, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                    <span style={{ color: "#aaa", fontSize: 10, fontStyle: "italic" }}>Signature</span>
                  </div>
                )}
                <p style={{ margin: 0, fontWeight: 700, fontSize: 11 }}>{sig.name}</p>
                <p style={{ margin: "2px 0 0", fontSize: 10, color: "#555" }}>{sig.label}</p>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ marginTop: 24, textAlign: "center", fontSize: 9, color: "#888", borderTop: "1px solid #eee", paddingTop: 10 }}>
            <p>This transcript is only valid with the official seal of {institutionName}. Issued on {new Date().toLocaleDateString("en-GB")}.</p>
            <p>For verification, contact the Registrar's Office | Unauthorized reproduction or alteration is a criminal offence.</p>
          </div>
        </div>
      </div>
    );
  }

  // Detailed template
  return (
    <div
      id="transcript-print-area"
      style={{
        fontFamily: "'Georgia', Times, serif",
        background: "#fff",
        color: "#111",
        maxWidth: 900,
        margin: "0 auto",
        padding: "0",
        position: "relative",
        border: "1px solid #bbb",
        boxShadow: "0 4px 32px rgba(0,0,0,0.12)",
      }}
    >
      {/* Top color bar */}
      <div style={{ height: 8, background: "linear-gradient(90deg, #1e3a5f, #0ea5e9, #1e3a5f)" }} />

      {/* Watermark */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        pointerEvents: "none", zIndex: 0, opacity: 0.03,
        fontSize: 120, fontWeight: 900, color: "#000",
        transform: "rotate(-40deg)", userSelect: "none",
      }}>
        OFFICIAL
      </div>

      <div style={{ position: "relative", zIndex: 1, padding: "36px 50px 40px" }}>
        {/* Institution Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, borderBottom: "2px solid #1e3a5f", paddingBottom: 16, marginBottom: 24 }}>
          {institutionLogoUrl ? (
            <img src={institutionLogoUrl} alt="Logo" style={{ height: 80 }} />
          ) : (
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#1e3a5f", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 24 }}>
              {institutionName[0]}
            </div>
          )}
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0, color: "#1e3a5f", letterSpacing: 1 }}>{institutionName.toUpperCase()}</h1>
            <p style={{ margin: "4px 0", fontSize: 11, color: "#555" }}>{institutionAddress}</p>
            <h2 style={{ fontSize: 14, fontWeight: 700, margin: "6px 0 0", color: "#0ea5e9", letterSpacing: 2 }}>
              ★ OFFICIAL ACADEMIC TRANSCRIPT ★
            </h2>
          </div>
        </div>

        {/* Student Info Box */}
        <div style={{
          background: "linear-gradient(135deg, #f0f4ff 0%, #e8f4fd 100%)",
          border: "1px solid #b0c8e8", borderRadius: 6, padding: "14px 18px", marginBottom: 24,
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 32px", fontSize: 12,
        }}>
          {[
            ["Full Name", fullName],
            ["Matric Number", student?.matricNumber || student?.admissionNumber || "N/A"],
            ["Programme", student?.programme?.name || "N/A"],
            ["Level", student?.currentLevel ? `${student.currentLevel} Level` : "N/A"],
            ["Date of Issue", new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })],
            ["Cumulative CGPA", finalCGPA],
          ].map(([label, value]) => (
            <div key={label} style={{ display: "flex", gap: 8 }}>
              <span style={{ fontWeight: 700, minWidth: 130, color: "#1e3a5f" }}>{label}:</span>
              <span style={{
                fontWeight: label === "Cumulative CGPA" ? 900 : 500,
                color: label === "Cumulative CGPA" ? "#059669" : "#222",
                fontSize: label === "Cumulative CGPA" ? 14 : 12,
              }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Semester Tables */}
        {transcripts.map((tr) => (
          <div key={tr.id} style={{ marginBottom: 28 }}>
            <div style={{
              background: "linear-gradient(90deg, #1e3a5f, #2563eb)",
              color: "#fff", padding: "7px 14px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              borderRadius: "4px 4px 0 0", fontSize: 12,
            }}>
              <span style={{ fontWeight: 700 }}>{tr.academicSession?.name} — {semesterLabel(tr.semester)}</span>
              <span style={{ fontSize: 11 }}>Semester GPA: <strong>{tr.gpa}</strong> | Cumulative CGPA: <strong>{tr.cgpa}</strong></span>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr style={{ background: "#dbeafe" }}>
                  {["Course Code", "Course Title", "Score", "Grade", "Grade Point", "Credit Units"].map(h => (
                    <th key={h} style={{ border: "1px solid #93c5fd", padding: "5px 8px", textAlign: "left", fontWeight: 700, color: "#1e3a5f" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tr.results.map((r, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f8faff" }}>
                    <td style={{ border: "1px solid #e0e7f0", padding: "4px 8px", fontWeight: 700, color: "#1e3a5f" }}>{r.courseCode}</td>
                    <td style={{ border: "1px solid #e0e7f0", padding: "4px 8px" }}>{r.courseTitle}</td>
                    <td style={{ border: "1px solid #e0e7f0", padding: "4px 8px", textAlign: "center" }}>{r.score || "—"}</td>
                    <td style={{ border: "1px solid #e0e7f0", padding: "4px 8px", textAlign: "center", fontWeight: 900, color: gradeColor(r.grade) }}>{r.grade}</td>
                    <td style={{ border: "1px solid #e0e7f0", padding: "4px 8px", textAlign: "center" }}>{Number(r.gradePoint).toFixed(2)}</td>
                    <td style={{ border: "1px solid #e0e7f0", padding: "4px 8px", textAlign: "center" }}>{r.creditLoad}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: "#dbeafe", fontWeight: 700 }}>
                  <td colSpan={4} style={{ border: "1px solid #93c5fd", padding: "5px 8px", textAlign: "right", color: "#1e3a5f" }}>
                    Total Credits Attempted: {tr.totalCreditsAttempted}
                  </td>
                  <td colSpan={2} style={{ border: "1px solid #93c5fd", padding: "5px 8px", textAlign: "center", color: "#1e3a5f" }}>
                    CGPA: <strong style={{ fontSize: 13 }}>{tr.cgpa}</strong>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ))}

        {/* Grading Key */}
        <div style={{ border: "1px solid #b0c8e8", borderRadius: 4, padding: "10px 14px", marginBottom: 28, fontSize: 10, background: "#f0f7ff" }}>
          <p style={{ fontWeight: 700, marginBottom: 4, color: "#1e3a5f" }}>GRADING KEY:</p>
          <div style={{ display: "flex", gap: 24 }}>
            {[["A", "70–100", "Excellent"], ["B", "60–69", "Good"], ["C", "50–59", "Average"], ["D/E", "40–49", "Pass"], ["F", "0–39", "Fail"]].map(([g, r, l]) => (
              <span key={g}><strong style={{ color: gradeColor(g) }}>{g}</strong>: {r} ({l})</span>
            ))}
          </div>
        </div>

        {/* Signatures */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, marginTop: 36 }}>
          {[
            { label: "Head of Department", name: signatures.hodName, url: signatures.hodSignature },
            { label: "Registrar", name: signatures.registrarName, url: signatures.registrarSignature },
          ].map(sig => (
            <div key={sig.label} style={{ textAlign: "center" }}>
              {sig.url ? (
                <img src={sig.url} alt={sig.label} style={{ height: 60, objectFit: "contain", marginBottom: 6, display: "block", margin: "0 auto 6px" }} />
              ) : (
                <div style={{ height: 60, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                  <span style={{ color: "#aaa", fontSize: 10, fontStyle: "italic" }}>Authorized Signature</span>
                </div>
              )}
              <div style={{ borderTop: "2px solid #1e3a5f", paddingTop: 6 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 12, color: "#1e3a5f" }}>{sig.name}</p>
                <p style={{ margin: "2px 0 0", fontSize: 10, color: "#555", letterSpacing: 1 }}>{sig.label.toUpperCase()}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 24, textAlign: "center", fontSize: 9, color: "#888", borderTop: "1px solid #ddd", paddingTop: 10 }}>
          <p>This is an official document issued by {institutionName}. Issued: {new Date().toLocaleDateString("en-GB")}.</p>
          <p>This transcript is valid only with the official institutional seal. Tampering with this document is a criminal offence.</p>
        </div>
      </div>

      {/* Bottom color bar */}
      <div style={{ height: 8, background: "linear-gradient(90deg, #1e3a5f, #0ea5e9, #1e3a5f)" }} />
    </div>
  );
}
