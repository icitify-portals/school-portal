import re
import sys

try:
    content = open('src/app/admin/result-module/print/page.tsx', 'r', encoding='utf-8').read()

    # 1. Update TranscriptCard to TranscriptCardDetailed and increase fonts & signatures
    content = content.replace('function TranscriptCard(', 'function TranscriptCardDetailed(')
    content = content.replace('fontSize: 7.5', 'fontSize: 9')
    content = content.replace('fontSize: 7,', 'fontSize: 8,') # TH font size

    # Update Signatures in Detailed template
    sig_block_old = """        {/* ── SIGNATURES ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 32, paddingLeft: 24, paddingRight: 24 }}>
          {/* HoD */}
          <div style={{ textAlign: "center", width: 160 }}>
            <div style={{ borderBottom: "1px solid #000", height: 36, marginBottom: 4 }} />
            <div style={{ fontWeight: 700, fontSize: 9, textTransform: "uppercase" }}>Head of Department</div>
            <div style={{ fontSize: 8 }}>{transcriptData.signatures?.hodName || "________________"}</div>
          </div>

          {/* Stamp + QR */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", border: "2px solid #b91c1c", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.6 }}>
              <span style={{ fontSize: 6, color: "#b91c1c", fontWeight: 700, textAlign: "center", lineHeight: 1.2 }}>REGISTRAR<br/>STAMP</span>
            </div>
            {qrDataUrl && <img src={qrDataUrl} alt="Verify QR" style={{ width: 52, height: 52 }} />}
            <div style={{ fontSize: 6.5, color: "#6b7280" }}>Scan to Verify</div>
          </div>

          {/* Registrar */}
          <div style={{ textAlign: "center", width: 160 }}>
            <div style={{ borderBottom: "1px solid #000", height: 36, marginBottom: 4 }} />
            <div style={{ fontWeight: 700, fontSize: 9, textTransform: "uppercase" }}>Registrar</div>
            <div style={{ fontSize: 8 }}>{transcriptData.signatures?.registrarName || "________________"}</div>
          </div>
        </div>"""

    sig_block_new = """        {/* ── SIGNATURES ── */}
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
            <div style={{ width: 60, height: 60, borderRadius: "50%", border: "2px solid #b91c1c", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.6 }}>
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
        </div>"""
    content = content.replace(sig_block_old, sig_block_new)

    # Add Original Template component and new styles before GradingKeySheet
    original_template = """
const thNoBorder: React.CSSProperties = { padding: "2px 2px", fontWeight: 900, fontSize: 9, lineHeight: 1.1, verticalAlign: "bottom" };
const tdNoBorder: React.CSSProperties = { padding: "2px 2px", fontSize: 9.5, verticalAlign: "top" };

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
          <div style={{ fontWeight: 900, fontSize: 13, textTransform: "uppercase", letterSpacing: 1 }}>FEDERAL SCHOOL OF STATISTICS</div>
          <div style={{ fontWeight: 700, fontSize: 10, marginBottom: 4 }}>(National Bureau of Statistics)</div>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ textAlign: "left", fontSize: 9, lineHeight: 1.4 }}>
              <div>P. O. Box 29751, U. I. IBADAN</div>
              <div>Telegram: STATIBADAN</div>
              <div>Telephone: 08023108427</div>
              <div>Email: <span style={{textDecoration: 'underline'}}>info@fssibadan.edu.ng</span></div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <img src="/fss_logo.png" alt="FSS Logo" style={{ width: 60, height: 60, objectFit: "contain" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            </div>
            <div style={{ textAlign: "left", fontSize: 9, lineHeight: 1.4 }}>
              <div>Ref. No: <strong>{matric}</strong></div>
              <div>Date: <span style={{textDecoration: 'underline'}}>{formatDate()}</span></div>
            </div>
          </div>

          <div style={{ marginTop: 8 }}>
            <div style={{ fontWeight: 900, fontSize: 12, textTransform: "uppercase", textDecoration: "underline", letterSpacing: 0.5 }}>EXAMINATION TRANSCRIPT</div>
            <div style={{ fontWeight: 900, fontSize: 11, textTransform: "uppercase", textDecoration: "underline", marginTop: 4 }}>{programmeName}</div>
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
            <div style={{ width: 60, height: 60, borderRadius: "50%", border: "2px solid #b91c1c", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.5 }}>
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
"""
    content = content.replace('/* ─── Grading Key Sheet (2nd page) ────────────────────────────── */', original_template + '\n/* ─── Grading Key Sheet (2nd page) ────────────────────────────── */')

    # Add style state
    content = content.replace('const [studentQuery, setStudentQuery] = useState("");', 'const [studentQuery, setStudentQuery] = useState("");\n  const [templateStyle, setTemplateStyle] = useState<"detailed" | "original">("original");')

    # Add selector in toolbar
    selector_html = """              <select
                  value={selectedProgramme}
                  onChange={e => setSelectedProgramme(e.target.value)}
                  style={{ width: 240, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none" }}
                >"""
    new_selector_html = """              <select
                  value={templateStyle}
                  onChange={e => setTemplateStyle(e.target.value as any)}
                  style={{ width: 140, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", marginRight: 16 }}
                >
                  <option value="original">FSS Template</option>
                  <option value="detailed">Detailed Template</option>
                </select>

              <select
                  value={selectedProgramme}
                  onChange={e => setSelectedProgramme(e.target.value)}
                  style={{ width: 240, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none" }}
                >"""
    content = content.replace(selector_html, new_selector_html)

    # Update Rendering to map Transcript + GradingKey for EACH student
    render_old = """        {transcriptsToRender.length > 0 && (
          <div ref={printRef} style={{ padding: "32px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 32, background: "#f1f5f9" }}>
            {transcriptsToRender.map((transcriptData, idx) => (
              <TranscriptCard
                key={idx}
                transcriptData={transcriptData}
                qrDataUrl={qrCodes[transcriptData?.student?.id]}
              />
            ))}
            {/* Grading Key is always appended as last page */}
            <GradingKeySheet />
          </div>
        )}"""

    render_new = """        {transcriptsToRender.length > 0 && (
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
        )}"""
    content = content.replace(render_old, render_new)

    # Increase grading sheet font size
    content = content.replace('fontSize: 9.5', 'fontSize: 10.5')
    content = content.replace('fontSize: 11', 'fontSize: 12')

    open('src/app/admin/result-module/print/page.tsx', 'w', encoding='utf-8').write(content)
    print("SUCCESS")
except Exception as e:
    print("ERROR:", e)
