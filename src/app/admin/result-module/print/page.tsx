"use client";

import { useState, useRef, useEffect, useCallback, Component } from "react";

/* ─── Error Boundary ───────────────────────────────────────────── */
class ErrorBoundary extends Component<
  { children: any; fallback?: any; onError?: (e: Error) => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  componentDidCatch(error: Error, info: any) {
    console.error("ErrorBoundary caught:", error, info);
    this.props.onError?.(error);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9", padding: 16 }}>
          <div style={{ background: "#fff", padding: 32, borderRadius: 12, boxShadow: "0 4px 24px rgba(0,0,0,.15)", maxWidth: 440, textAlign: "center" }}>
            <h2 style={{ color: "#dc2626", fontWeight: 700, marginBottom: 8 }}>Rendering Error</h2>
            <p style={{ color: "#64748b", fontSize: 14, marginBottom: 16 }}>{this.state.error?.message || "An unexpected error occurred"}</p>
            <button onClick={() => window.location.reload()} style={{ padding: "8px 20px", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

import { searchStudents, getMyTranscript, getBulkTranscripts, sendStudentTranscriptEmail } from "@/actions/result-module";
import { getProgrammes } from "@/actions/programmes";
import { getFaculties } from "@/actions/faculties";
import { getDepartments } from "@/actions/departments";
import { ArrowLeft, Search, Loader2, Printer, Image as ImageIcon, FileText, Mail, CheckCircle2, Users } from "lucide-react";
import Link from "next/link";
import QRCode from "qrcode";

/* ─── FSS Grading Scale (matches the image exactly) ──────────── */
const FSS_GRADE_TABLE = [
  { range: "75 and above", grade: "AA", point: "4.00" },
  { range: "70 – 74",      grade: "A",  point: "3.50" },
  { range: "65 – 69",      grade: "AB", point: "3.25" },
  { range: "60 – 64",      grade: "B",  point: "3.00" },
  { range: "55 – 59",      grade: "BC", point: "2.75" },
  { range: "50 – 54",      grade: "C",  point: "2.50" },
  { range: "45 – 49",      grade: "CD", point: "2.25" },
  { range: "40 – 44",      grade: "D",  point: "2.00" },
  { range: "Below 40",     grade: "F",  point: "0.00" },
];

const FSS_CLASS_TABLE = [
  { cls: "Distinction",    range: "3.50 and above" },
  { cls: "Upper Credit",   range: "3.00 to 3.49" },
  { cls: "Lower Credit",   range: "2.50 to 2.99" },
  { cls: "Pass",           range: "2.00 to 2.49" },
];

function getDegreeClass(cgpa: number): string {
  if (cgpa >= 3.50) return "DISTINCTION";
  if (cgpa >= 3.00) return "UPPER CREDIT";
  if (cgpa >= 2.50) return "LOWER CREDIT";
  if (cgpa >= 2.00) return "PASS";
  return "FAIL";
}

function formatDate(): string {
  const d = new Date();
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const day = d.getDate();
  const suffix = (day >= 11 && day <= 13) ? "th" : ["th","st","nd","rd","th"][Math.min(day % 10, 4)];
  return `${day}${suffix} ${months[d.getMonth()]}, ${d.getFullYear()}`;
}

function calcSemTotals(results: any[]): { totalCU: number; totalQP: number; gpa: number } {
  let totalCU = 0, totalQP = 0;
  for (const r of results) {
    totalCU += r.creditLoad || 0;
    totalQP += (r.creditLoad || 0) * Number(r.gradePoint || 0);
  }
  return { totalCU, totalQP, gpa: totalCU > 0 ? totalQP / totalCU : 0 };
}

/* ─── Self-contained print CSS (no external chunks needed) ───── */
const PRINT_CSS = `
  @media print {
    body { margin: 0 !important; background: #fff !important; padding: 0 !important; }
    header, footer, nav, aside, .sidebar { display: none !important; }
    main { padding: 0 !important; margin: 0 !important; width: 100% !important; max-width: 100% !important; }
    .no-print { display: none !important; }
    .transcript-sheet { 
        box-shadow: none !important; 
        page-break-after: always; 
        break-after: page; 
        width: 100% !important; 
        margin: 0 !important;
        border: none !important;
    }
    .transcript-sheet:last-child { page-break-after: avoid; break-after: avoid; }
    
    /* Remove background from the container during print */
    div[style*="background: #f1f5f9"] {
        background: transparent !important;
        padding: 0 !important;
    }
  }
  @page { margin: 0; size: A4 portrait; }
`;

/* ─── Single Transcript Card ──────────────────────────────────── */
function TranscriptCardDetailed({ transcriptData, qrDataUrl }: { transcriptData: any; qrDataUrl?: string }) {
  try {
    const student = transcriptData?.student;
    if (!student) {
      return (
        <div className="transcript-sheet" style={sheetStyle}>
          <p style={{ color: "#94a3b8", textAlign: "center", marginTop: 80 }}>Student data not available</p>
        </div>
      );
    }

    // Group transcript rows by session name, then by semester
    const bySession = new Map<string, Map<string, any>>();
    const txList: any[] = transcriptData.transcripts || [];
    for (const t of txList) {
      const sName = t.academicSession?.name || "Unknown Session";
      const sem = t.semester || "1";
      if (!bySession.has(sName)) bySession.set(sName, new Map());
      bySession.get(sName)!.set(sem, t);
    }

    // Cumulative CGPA = last transcript's cgpa
    const lastTx = txList[txList.length - 1];
    const cumulCgpaNum = lastTx ? Number(lastTx.cgpa) : 0;
    const cumulCgpa = cumulCgpaNum.toFixed(2);

    const matric = student.matricNumber || student.admissionNumber || "N/A";
    const studentName = student.user?.name || "Student";
    const programmeName = student.programme?.name || "Programme";

    return (
      <div className="transcript-sheet" style={sheetStyle}>
        {/* ── HEADER ── */}
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div style={{ textAlign: "left", fontSize: 8, lineHeight: 1.6 }}>
              <div>P.O. Box 29751, U.I. IBADAN</div>
              <div>Telegram: STATIBADAN</div>
              <div>Telephone: 08023108427</div>
              <div>Email: info@fssibadan.edu.ng</div>
            </div>
            {/* Logo */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <img src="/fss_logo.png" alt="FSS Logo" style={{ width: 80, height: 80, objectFit: "contain" }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            </div>
            <div style={{ textAlign: "right", fontSize: 8, lineHeight: 1.6 }}>
              <div>Ref. No: <strong>{matric}</strong></div>
              <div>Date: {formatDate()}</div>
            </div>
          </div>

          <div style={{ fontWeight: 900, fontSize: 18, textTransform: "uppercase", textDecoration: "underline", letterSpacing: 1 }}>
            FEDERAL SCHOOL OF STATISTICS
          </div>
          <div style={{ fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>
            (National Bureau of Statistics)
          </div>
          <div style={{ marginTop: 8 }}>
            <div style={{ fontWeight: 900, fontSize: 14, textTransform: "uppercase", textDecoration: "underline", letterSpacing: 0.5 }}>
              EXAMINATION TRANSCRIPT
            </div>
            <div style={{ fontWeight: 700, fontSize: 11, textTransform: "uppercase", marginTop: 2 }}>
              {programmeName}
            </div>
          </div>
          <p style={{ marginTop: 8, paddingLeft: 40, paddingRight: 40, textAlign: "justify", fontSize: 10.5, lineHeight: 1.5 }}>
            Below is the result of <strong style={{ textTransform: "uppercase" }}>{studentName}</strong> in the{" "}
            <strong>{programmeName}</strong>.
          </p>
        </div>

        {/* ── PER-SESSION RESULTS ── */}
        {Array.from(bySession.entries()).map(([sessionName, semMap]) => {
          // Sort semesters
          const semKeys = Array.from(semMap.keys()).sort();
          return (
            <div key={sessionName} style={{ marginBottom: 14 }}>
              {/* Session heading */}
              <div style={{ fontWeight: 900, textTransform: "uppercase", textDecoration: "underline", textAlign: "center", fontSize: 10.5, letterSpacing: 0.4, marginBottom: 6 }}>
                {programmeName} &mdash; {sessionName} SESSION
              </div>

              {/* Side-by-side semesters */}
              <div style={{ display: "flex", gap: 8 }}>
                {semKeys.map((semKey) => {
                  const sem = semMap.get(semKey)!;
                  const semLabel = semKey === "1" ? "FIRST SEMESTER" : semKey === "2" ? "SECOND SEMESTER" : `SEMESTER ${semKey}`;
                  const totals = calcSemTotals(sem.results || []);
                  return (
                    <div key={semKey} style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, textTransform: "uppercase", textDecoration: "underline", fontSize: 8.5, marginBottom: 3 }}>
                        {semLabel}
                      </div>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9 }}>
                        <thead>
                          <tr style={{ borderTop: "1.5px solid #000", borderBottom: "1px solid #000" }}>
                            <th style={th}>COURSE<br/>CODE</th>
                            <th style={{ ...th, textAlign: "left" }}>SUBJECT TITLE</th>
                            <th style={th}>CREDIT<br/>LOAD</th>
                            <th style={th}>SCORE</th>
                            <th style={th}>GRADE</th>
                            <th style={th}>GRADE<br/>POINT</th>
                            <th style={th}>QUALITY<br/>POINT</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(sem.results || []).map((r: any, i: number) => {
                            const qp = (r.creditLoad || 0) * Number(r.gradePoint || 0);
                            return (
                              <tr key={i} style={{ borderBottom: "0.5px solid #ccc" }}>
                                <td style={{ ...td, fontWeight: 600 }}>{r.courseCode}</td>
                                <td style={{ ...td, textAlign: "left", maxWidth: 90, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }} title={r.courseTitle}>{r.courseTitle}</td>
                                <td style={td}>{r.creditLoad}</td>
                                <td style={td}>{r.score}</td>
                                <td style={{ ...td, fontWeight: 700 }}>{r.grade}</td>
                                <td style={td}>{Number(r.gradePoint).toFixed(2)}</td>
                                <td style={td}>{qp.toFixed(2)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      {/* Semester totals */}
                      <div style={{ borderTop: "1.5px solid #000", marginTop: 1, paddingTop: 2, fontSize: 9, fontWeight: 700, textAlign: "right" }}>
                        TOTAL CREDIT REGISTERED (TCR): {totals.totalCU} &nbsp;|&nbsp;
                        TOTAL QUALITY POINT (TQP): {totals.totalQP.toFixed(2)} &nbsp;|&nbsp;
                        GPA: {totals.gpa.toFixed(3)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* ── CUMULATIVE GPA ── */}
        <div style={{ borderTop: "2px solid #000", marginTop: 10, paddingTop: 8, textAlign: "center" }}>
          <div style={{ display: "inline-block", border: "2px solid #000", padding: "6px 24px" }}>
            <span style={{ fontWeight: 900, fontSize: 12, textTransform: "uppercase" }}>
              GRADUATING GPA: {cumulCgpa} &mdash; {getDegreeClass(cumulCgpaNum)}
            </span>
          </div>
        </div>

        {/* ── SIGNATURES ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 32, paddingLeft: 24, paddingRight: 24 }}>
          {/* HoD */}
          <div style={{ textAlign: "center", width: 160 }}>
            {transcriptData.signatures?.hod ? (
              <img src={transcriptData.signatures.hod} style={{ height: 40, objectFit: 'contain', marginBottom: 4 }} alt="HOD Signature" />
            ) : (
              <div style={{ borderBottom: "1px dotted #000", height: 40, marginBottom: 4 }} />
            )}
            <div style={{ fontWeight: 700, fontSize: 9, textTransform: "uppercase" }}>Head of Department</div>
            <div style={{ fontSize: 8 }}>{transcriptData.signatures?.hodName || ""}</div>
          </div>

          {/* Stamp + QR */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", border: "2px solid #b91c1c", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.6 }}>
              <span style={{ fontSize: 6, color: "#b91c1c", fontWeight: 700, textAlign: "center", lineHeight: 1.2 }}>REGISTRAR<br/>STAMP</span>
            </div>
            {qrDataUrl && <img src={qrDataUrl} alt="Verify QR" style={{ width: 52, height: 52 }} />}
            <div style={{ fontSize: 6.5, color: "#6b7280" }}>Scan to Verify</div>
          </div>

          {/* Registrar */}
          <div style={{ textAlign: "center", width: 160 }}>
            {transcriptData.signatures?.registrar ? (
              <img src={transcriptData.signatures.registrar} style={{ height: 40, objectFit: 'contain', marginBottom: 4 }} alt="Registrar Signature" />
            ) : (
              <div style={{ borderBottom: "1px dotted #000", height: 40, marginBottom: 4 }} />
            )}
            <div style={{ fontWeight: 700, fontSize: 9, textTransform: "uppercase" }}>Registrar</div>
            <div style={{ fontSize: 8 }}>{transcriptData.signatures?.registrarName || ""}</div>
          </div>
        </div>
      </div>
    );
  } catch (e: any) {
    console.error("TranscriptCard render error:", e);
    return (
      <div className="transcript-sheet" style={sheetStyle}>
        <div style={{ textAlign: "center", marginTop: 80 }}>
          <p style={{ color: "#dc2626", fontWeight: 700 }}>Rendering Error</p>
          <p style={{ color: "#94a3b8", fontSize: 12 }}>{e?.message || "Unknown error"}</p>
        </div>
      </div>
    );
  }
}


const thNoBorder: React.CSSProperties = { padding: "2px 2px", fontWeight: 900, fontSize: 9, lineHeight: 1.1, verticalAlign: "bottom" };
const tdNoBorder: React.CSSProperties = { padding: "2px 2px", fontSize: 10.5, verticalAlign: "top" };

function TranscriptCardOriginal({ transcriptData, qrDataUrl }: { transcriptData: any; qrDataUrl?: string }) {
  try {
    const student = transcriptData?.student;
    if (!student) return <div className="transcript-sheet" style={sheetStyle}><p style={{ color: "#94a3b8", textAlign: "center", marginTop: 80 }}>Student data not available</p></div>;

    const bySession = new Map<string, Map<string, any>>();
    const txList: any[] = transcriptData.transcripts || [];
    for (const t of txList) {
      const sName = t.academicSession?.name || "Unknown Session";
      const sem = t.semester || "1";
      if (!bySession.has(sName)) bySession.set(sName, new Map());
      bySession.get(sName)!.set(sem, t);
    }

    const lastTx = txList[txList.length - 1];
    const cumulCgpaNum = lastTx ? Number(lastTx.cgpa) : 0;
    const cumulCgpa = cumulCgpaNum.toFixed(2);

    const matric = student.matricNumber || student.admissionNumber || "N/A";
    const studentName = student.user?.name || "Student";
    const programmeName = student.programme?.name || "Programme";
    
    const sessionNames = Array.from(bySession.keys());
    const firstSession = sessionNames[0] || "";
    const lastSession = sessionNames[sessionNames.length - 1] || "";
    const sessionRange = firstSession === lastSession ? firstSession : `${firstSession} to ${lastSession}`;

    return (
      <div className="transcript-sheet" style={sheetStyle}>
        {/* ── HEADER ── */}
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <div style={{ fontWeight: 900, fontSize: 18, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>FEDERAL SCHOOL OF STATISTICS</div>
          <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 8 }}>(National Bureau of Statistics)</div>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ textAlign: "left", fontSize: 11, lineHeight: 1.5 }}>
              <div>P. O. Box 29751, U. I. IBADAN</div>
              <div>Telegram: STATIBADAN</div>
              <div>Telephone: 08023108427</div>
              <div>Email: <span style={{textDecoration: 'underline'}}>info@fssibadan.edu.ng</span></div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <img src="/fss_logo.png" alt="FSS Logo" style={{ width: 80, height: 80, objectFit: "contain" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            </div>
            <div style={{ textAlign: "left", fontSize: 11, lineHeight: 1.5 }}>
              <div>Ref. No: <strong>{matric}</strong></div>
              <div>Date: <span style={{textDecoration: 'underline'}}>{formatDate()}</span></div>
            </div>
          </div>

          <div style={{ marginTop: 8 }}>
            <div style={{ fontWeight: 900, fontSize: 14, textTransform: "uppercase", textDecoration: "underline", letterSpacing: 0.5 }}>EXAMINATION TRANSCRIPT</div>
            <div style={{ fontWeight: 900, fontSize: 12, textTransform: "uppercase", textDecoration: "underline", marginTop: 4 }}>{programmeName}</div>
          </div>
          <p style={{ marginTop: 6, textAlign: "center", fontSize: 10, lineHeight: 1.5 }}>
            Below is the result of <strong>{studentName.toUpperCase()}</strong> in the {programmeName} Programme <strong>{sessionRange}</strong> session.
          </p>
        </div>

        {/* ── PER-SESSION RESULTS ── */}
        {Array.from(bySession.entries()).map(([sessionName, semMap], sIdx) => {
          const semKeys = Array.from(semMap.keys()).sort();
          const levelStr = sIdx === 0 ? "(ND I)" : sIdx === 1 ? "(ND II)" : sIdx === 2 ? "(HND I)" : sIdx === 3 ? "(HND II)" : "";
          
          return (
            <div key={sessionName} style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 900, textTransform: "uppercase", textDecoration: "underline", textAlign: "center", fontSize: 10, letterSpacing: 0.4, marginBottom: 4 }}>
                {programmeName} {levelStr} {sessionName} SESSION
              </div>

              <div style={{ display: "flex", gap: 16 }}>
                {semKeys.map((semKey) => {
                  const sem = semMap.get(semKey)!;
                  const semLabel = semKey === "1" ? "FIRST SEMESTER" : semKey === "2" ? "SECOND SEMESTER" : `SEMESTER ${semKey}`;
                  const totals = calcSemTotals(sem.results || []);
                  return (
                    <div key={semKey} style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 900, textTransform: "uppercase", textDecoration: "underline", fontSize: 9, marginBottom: 2 }}>{semLabel}</div>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 8.5 }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid #000" }}>
                            <th style={{...thNoBorder, textAlign: 'left', width: '15%'}}>CODE</th>
                            <th style={{...thNoBorder, textAlign: 'left', width: '55%'}}>SUBJECT TITLE</th>
                            <th style={{...thNoBorder, textAlign: 'center', width: '15%'}}>CREDIT<br/>UNITS</th>
                            <th style={{...thNoBorder, textAlign: 'center', width: '15%'}}>SCORE/100</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(sem.results || []).map((r: any, i: number) => (
                            <tr key={i}>
                              <td style={{ ...tdNoBorder, textAlign: 'left', fontWeight: 600 }}>{r.courseCode}</td>
                              <td style={{ ...tdNoBorder, textAlign: 'left', maxWidth: 110, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.courseTitle}>{r.courseTitle}</td>
                              <td style={{ ...tdNoBorder, textAlign: 'center' }}>{r.creditLoad}</td>
                              <td style={{ ...tdNoBorder, textAlign: 'center' }}>{r.score}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div style={{ marginTop: 6, fontSize: 9, fontWeight: 900, textAlign: "center" }}>
                        GRADE POINT AVERAGE (GPA): <span style={{textDecoration: "underline"}}>{totals.gpa.toFixed(3)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* ── CUMULATIVE GPA ── */}
        <div style={{ marginTop: 16, textAlign: "center" }}>
          <span style={{ fontWeight: 900, fontSize: 10, textTransform: "uppercase" }}>
            GRADUATING GRADE POINT AVERAGE (CGPA): {cumulCgpa} ({getDegreeClass(cumulCgpaNum)})
          </span>
        </div>

        {/* ── SIGNATURES ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 40, paddingLeft: 24, paddingRight: 24 }}>
          {/* HoD */}
          <div style={{ textAlign: "center", width: 160 }}>
            {transcriptData.signatures?.hod ? (
              <img src={transcriptData.signatures.hod} style={{ height: 40, objectFit: 'contain', marginBottom: 4 }} alt="HOD Signature" />
            ) : (
              <div style={{ borderBottom: "1px dotted #000", height: 40, marginBottom: 4 }} />
            )}
            <div style={{ fontWeight: 700, fontSize: 9, textTransform: "uppercase" }}>Head of Department</div>
            <div style={{ fontSize: 8 }}>{transcriptData.signatures?.hodName || ""}</div>
          </div>

          {/* Stamp + QR */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", border: "2px solid #b91c1c", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.5 }}>
              <span style={{ fontSize: 7, color: "#b91c1c", fontWeight: 900, textAlign: "center", lineHeight: 1.2 }}>REGISTRAR<br/>STAMP</span>
            </div>
            {qrDataUrl && <img src={qrDataUrl} alt="Verify QR" style={{ width: 52, height: 52 }} />}
          </div>

          {/* Registrar */}
          <div style={{ textAlign: "center", width: 160 }}>
            {transcriptData.signatures?.registrar ? (
              <img src={transcriptData.signatures.registrar} style={{ height: 40, objectFit: 'contain', marginBottom: 4 }} alt="Registrar Signature" />
            ) : (
              <div style={{ borderBottom: "1px dotted #000", height: 40, marginBottom: 4 }} />
            )}
            <div style={{ fontWeight: 700, fontSize: 9, textTransform: "uppercase" }}>Registrar</div>
            <div style={{ fontSize: 8 }}>{transcriptData.signatures?.registrarName || "Yours Faithfully"}</div>
          </div>
        </div>
      </div>
    );
  } catch (e: any) {
    return <div className="transcript-sheet" style={sheetStyle}><div style={{ textAlign: "center", marginTop: 80, color: "#dc2626" }}>Rendering Error</div></div>;
  }
}

/* ─── Grading Key Sheet (attached directly, no page break) ──────── */
function GradingKeySheet() {
  return (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", width: "210mm", padding: "10mm 16mm", margin: "0 auto", background: "#fff", color: "#000", fontFamily: "'Times New Roman', Times, serif" }}>
      <div style={{ width: "80%", maxWidth: 420 }}>
        <div style={{ fontWeight: 900, textTransform: "uppercase", textDecoration: "underline", textAlign: "center", fontSize: 12, marginBottom: 16, letterSpacing: 0.5 }}>
          GRADE POINT FOR EACH SUBJECT
        </div>
        <div style={{ display: "flex", gap: 40, justifyContent: "center" }}>
          {/* Grade table */}
          <table style={{ borderCollapse: "collapse", fontSize: 10.5 }}>
            <tbody>
              {FSS_GRADE_TABLE.map((row) => (
                <tr key={row.grade}>
                  <td style={{ paddingRight: 16, paddingBottom: 4 }}>{row.range}</td>
                  <td style={{ paddingRight: 12, fontWeight: 700, paddingBottom: 4 }}>{row.grade}</td>
                  <td style={{ paddingBottom: 4 }}>{row.point}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Class table */}
          <div>
            <div style={{ fontWeight: 700, textDecoration: "underline", marginBottom: 6, fontSize: 10.5 }}>CLASS</div>
            <table style={{ borderCollapse: "collapse", fontSize: 10.5 }}>
              <tbody>
                {FSS_CLASS_TABLE.map((row) => (
                  <tr key={row.cls}>
                    <td style={{ paddingRight: 12, paddingBottom: 4 }}>{row.cls}</td>
                    <td style={{ paddingBottom: 4 }}>&mdash; {row.range}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Shared inline styles ────────────────────────────────────── */
const sheetStyle: React.CSSProperties = {
  width: "210mm",
  minHeight: "297mm",
  background: "#fff",
  padding: "24mm 16mm 20mm",
  fontFamily: "'Times New Roman', Times, serif",
  fontSize: 10,
  lineHeight: 1.3,
  color: "#000",
  boxSizing: "border-box",
  boxShadow: "0 2px 16px rgba(0,0,0,0.15)",
  position: "relative",
};
const th: React.CSSProperties = {
  padding: "2px 3px",
  textAlign: "center",
  fontWeight: 700,
  borderBottom: "1px solid #000",
  whiteSpace: "nowrap",
  fontSize: 8,
  lineHeight: 1.1,
};
const td: React.CSSProperties = {
  padding: "1.5px 3px",
  textAlign: "center",
  fontSize: 9,
};

/* ─── Main Page ───────────────────────────────────────────────── */
export default function PrintTranscriptPage() {
  const [studentQuery, setStudentQuery] = useState("");
  const [templateStyle, setTemplateStyle] = useState<"detailed" | "original">("original");
  const [studentResults, setStudentResults] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  
  const [bulkMode, setBulkMode] = useState<"programme" | "department" | "faculty" | "all">("programme");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [selectedProgramme, setSelectedProgramme] = useState("");
  
  const [faculties, setFaculties] = useState<any[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState("");
  
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [transcriptsToRender, setTranscriptsToRender] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getProgrammes().then(res => { if (Array.isArray(res)) setProgrammes(res); });
    getFaculties().then(res => { if (Array.isArray(res)) setFaculties(res); });
    getDepartments().then(res => { if (Array.isArray(res)) setDepartments(res); });
  }, []);

  const searchStudentsFn = useCallback(async (q: string) => {
    if (!q.trim()) { setStudentResults([]); return; }
    const res = await searchStudents(q);
    setStudentResults(res.data || []);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchStudentsFn(studentQuery), 400);
    return () => clearTimeout(t);
  }, [studentQuery, searchStudentsFn]);

  // Generate QR codes for each transcript student
  useEffect(() => {
    async function generateQrCodes() {
      const codes: Record<string, string> = {};
      for (const td of transcriptsToRender) {
        const student = td?.student;
        if (student?.id) {
          const url = `https://portal.fssibadan.edu.ng/verify-transcript?m=${student.matricNumber || student.admissionNumber || student.id}`;
          try { codes[student.id] = await QRCode.toDataURL(url, { width: 80, margin: 1 }); } catch { /* ignore */ }
        }
      }
      setQrCodes(codes);
    }
    if (transcriptsToRender.length > 0) generateQrCodes();
  }, [transcriptsToRender]);

  async function loadTranscript(student: any) {
    setSelectedStudent(student);
    setStudentResults([]);
    setStudentQuery("");
    setLoading(true);
    try {
      const res = await getMyTranscript(student?.id);
      if (res?.success) {
        setTranscriptsToRender([res.data]);
      } else {
        alert(res?.error || "Failed to load transcript");
      }
    } catch (e: any) {
      alert("Error: " + (e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function loadBulkTranscripts() {
    let filters: any = {};
    if (bulkMode === "programme") {
      if (!selectedProgramme) return alert("Please select a programme");
      filters.programmeId = Number(selectedProgramme);
    } else if (bulkMode === "department") {
      if (!selectedDepartment) return alert("Please select a department");
      filters.departmentId = Number(selectedDepartment);
    } else if (bulkMode === "faculty") {
      if (!selectedFaculty) return alert("Please select a faculty");
      filters.facultyId = Number(selectedFaculty);
    } else if (bulkMode === "all") {
      filters.all = true;
    }
    if (selectedLevel && selectedLevel !== "all") {
      filters.level = selectedLevel;
    }
    
    setLoading(true);
    setSelectedStudent(null);
    const res = await getBulkTranscripts(filters);
    if (res.success) {
      setTranscriptsToRender(res.data || []);
    } else {
      alert(res.error);
    }
    setLoading(false);
  }

  function handlePrint() {
    window.print();
  }

  async function handleExportPDF() {
    if (!printRef.current) return;
    setExporting(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;
      const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true, backgroundColor: "#fff" });
      const imgData = canvas.toDataURL("image/jpeg", 0.98);
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const w = pdf.internal.pageSize.getWidth();
      const h = (canvas.height / canvas.width) * w;
      pdf.addImage(imgData, "JPEG", 0, 0, w, h);
      const name = selectedStudent ? selectedStudent.matricNumber || selectedStudent.admissionNumber : "Bulk_Transcripts";
      pdf.save(`Transcript_${name}.pdf`);
    } catch (e) {
      alert("Error exporting PDF. Please try the Print button instead.");
    }
    setExporting(false);
  }

  async function handleExportImage() {
    if (!printRef.current) return;
    setExporting(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true, backgroundColor: "#fff" });
      const link = document.createElement("a");
      const name = selectedStudent ? selectedStudent.matricNumber || selectedStudent.admissionNumber : "Bulk_Transcripts";
      link.download = `Transcript_${name}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (e) {
      alert("Error exporting image");
    }
    setExporting(false);
  }

  async function handleEmailStudent() {
    if (transcriptsToRender.length > 1) return alert("Bulk emailing not yet supported via this button");
    const transcriptData = transcriptsToRender[0];
    if (!transcriptData?.student?.user?.email) return alert("Student email not found");
    if (!confirm(`Send transcript to ${transcriptData.student.user.email}?`)) return;
    setEmailing(true);
    try {
      if (!printRef.current) throw new Error("Transcript container not found");
      const html2pdf = (await import("html2pdf.js")).default;
      const name = selectedStudent ? selectedStudent.matricNumber || selectedStudent.admissionNumber : "Bulk_Transcripts";
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `Transcript_${name}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 1.5, useCORS: true, logging: false },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };
      const pdfBase64 = await html2pdf().set(opt).from(printRef.current).outputPdf("datauristring");
      const studentName = transcriptData.student.user?.name || name;
      const res = await sendStudentTranscriptEmail(transcriptData.student.user.email, pdfBase64, studentName);
      if (res.success) {
        setEmailSuccess(true);
        setTimeout(() => setEmailSuccess(false), 3000);
      } else {
        alert("Failed to send email: " + (res.error?.message || res.error || "Unknown error"));
      }
    } catch (e) {
      console.error(e);
      alert("Failed to send email");
    }
    setEmailing(false);
  }

  return (
    <ErrorBoundary>
      {/* Self-contained print CSS — avoids Next.js CSS chunk preload warnings */}
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />

      <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "Inter, system-ui, sans-serif" }}>

        {/* ── Action Bar ── */}
        <div className="no-print" style={{
          background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "12px 24px",
          position: "sticky", top: 0, zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          boxShadow: "0 1px 4px rgba(0,0,0,.08)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <Link href="/admin/result-module" style={{ padding: 8, borderRadius: 8, display: "flex", alignItems: "center", color: "#475569", textDecoration: "none" }}>
              <ArrowLeft size={20} />
            </Link>

            <div style={{ display: "flex", alignItems: "center", gap: 16, borderLeft: "1px solid #e2e8f0", paddingLeft: 24 }}>
              {/* Student search */}
              <div style={{ position: "relative", width: 288 }}>
                <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                <input
                  value={studentQuery}
                  onChange={e => setStudentQuery(e.target.value)}
                  placeholder="Search by name or matric number…"
                  style={{ width: "100%", paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
                {studentResults.length > 0 && (
                  <div style={{
                    position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4,
                    background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8,
                    boxShadow: "0 8px 24px rgba(0,0,0,.12)", maxHeight: 220, overflowY: "auto", zIndex: 100
                  }}>
                    {studentResults.map(s => (
                      <button key={s.id} onClick={() => loadTranscript(s)} style={{ width: "100%", textAlign: "left", padding: "10px 14px", background: "none", border: "none", borderBottom: "1px solid #f1f5f9", cursor: "pointer" }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{s.user?.name}</div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>{s.matricNumber || s.admissionNumber} &bull; {s.programme?.name}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <span style={{ color: "#cbd5e1", fontWeight: 500 }}>OR</span>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <select
                  value={templateStyle}
                  onChange={e => setTemplateStyle(e.target.value as any)}
                  style={{ width: 140, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", marginRight: 16 }}
                >
                  <option value="original">FSS Template</option>
                  <option value="detailed">Detailed Template</option>
                </select>

              <select
                  value={bulkMode}
                  onChange={e => setBulkMode(e.target.value as any)}
                  style={{ width: 140, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none" }}
                >
                  <option value="programme">By Programme</option>
                  <option value="department">By Department</option>
                  <option value="faculty">By Faculty</option>
                  <option value="all">Entire School</option>
                </select>

                <select
                  value={selectedLevel}
                  onChange={e => setSelectedLevel(e.target.value)}
                  style={{ width: 130, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none" }}
                >
                  <option value="all">All Levels</option>
                  <option value="ND1">ND 1</option>
                  <option value="ND2">ND 2</option>
                  <option value="HND1">HND 1</option>
                  <option value="HND2">HND 2</option>
                </select>

                {bulkMode === "programme" && (
                  <select value={selectedProgramme} onChange={e => setSelectedProgramme(e.target.value)} style={{ width: 200, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none" }}>
                    <option value="">Select Programme...</option>
                    {programmes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                )}
                {bulkMode === "department" && (
                  <select value={selectedDepartment} onChange={e => setSelectedDepartment(e.target.value)} style={{ width: 200, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none" }}>
                    <option value="">Select Department...</option>
                    {departments.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                )}
                {bulkMode === "faculty" && (
                  <select value={selectedFaculty} onChange={e => setSelectedFaculty(e.target.value)} style={{ width: 200, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none" }}>
                    <option value="">Select Faculty...</option>
                    {faculties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                )}

                <button
                  onClick={loadBulkTranscripts}
                  disabled={loading || (bulkMode === 'programme' && !selectedProgramme) || (bulkMode === 'department' && !selectedDepartment) || (bulkMode === 'faculty' && !selectedFaculty)}
                  style={{ padding: "8px 14px", background: "#1e293b", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, opacity: loading || (bulkMode === 'programme' && !selectedProgramme) || (bulkMode === 'department' && !selectedDepartment) || (bulkMode === 'faculty' && !selectedFaculty) ? 0.5 : 1 }}
                >
                  <Users size={14} /> Load Bulk
                </button>
              </div>
            </div>
          </div>

          {transcriptsToRender.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={handleExportImage} disabled={exporting} style={actionBtn}>
                {exporting ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />} PNG
              </button>
              <button onClick={handleExportPDF} disabled={exporting} style={actionBtn}>
                {exporting ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />} PDF
              </button>
              <button onClick={handlePrint} style={{ ...actionBtn, background: "#1e293b", color: "#fff" }}>
                <Printer size={14} /> Print
              </button>
              {transcriptsToRender.length === 1 && (
                <button onClick={handleEmailStudent} disabled={emailing} style={{ ...actionBtn, background: "#7c3aed", color: "#fff" }}>
                  {emailing ? <Loader2 size={14} className="animate-spin" /> : emailSuccess ? <CheckCircle2 size={14} /> : <Mail size={14} />}
                  {emailSuccess ? "Sent!" : "Email Student"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div className="no-print" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 80 }}>
            <Loader2 size={36} style={{ color: "#7c3aed", animation: "spin 1s linear infinite", marginBottom: 12 }} />
            <p style={{ color: "#64748b", fontWeight: 500 }}>Loading transcripts…</p>
          </div>
        )}

        {/* ── Empty State ── */}
        {!loading && transcriptsToRender.length === 0 && (
          <div className="no-print" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 80, color: "#94a3b8" }}>
            <Printer size={52} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p style={{ fontWeight: 600, fontSize: 16 }}>No transcript loaded yet</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Search for a student or select a programme above</p>
          </div>
        )}

        {/* ── Transcript Preview Area ── */}
        {transcriptsToRender.length > 0 && (
          <div ref={printRef} style={{ padding: "32px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 32, background: "#f1f5f9" }}>
            {transcriptsToRender.map((transcriptData, idx) => (
              <div key={idx} style={{ display: 'contents' }}>
                {templateStyle === 'detailed' ? (
                  <TranscriptCardDetailed
                    transcriptData={transcriptData}
                    qrDataUrl={qrCodes[transcriptData?.student?.id]}
                  />
                ) : (
                  <TranscriptCardOriginal
                    transcriptData={transcriptData}
                    qrDataUrl={qrCodes[transcriptData?.student?.id]}
                  />
                )}
                {/* Grading Key printed for EVERY student so it can be back page */}
                <GradingKeySheet />
              </div>
            ))}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

const actionBtn: React.CSSProperties = {
  padding: "7px 14px",
  background: "#f1f5f9",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 6,
  color: "#374151",
};
