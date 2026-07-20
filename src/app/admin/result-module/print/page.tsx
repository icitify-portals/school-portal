"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { searchStudents, getMyTranscript, getBulkTranscripts, sendStudentTranscriptEmail } from "@/actions/result-module";
import { getProgrammes } from "@/actions/programmes";
import { ArrowLeft, Search, Loader2, Printer, Image as ImageIcon, FileText, Mail, CheckCircle2, Users } from "lucide-react";
import Link from "next/link";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function PrintTranscriptPage() {
  const [studentQuery, setStudentQuery] = useState("");
  const [studentResults, setStudentResults] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [selectedProgramme, setSelectedProgramme] = useState("");
  
  // Array of transcripts to render (supports single and bulk)
  const [transcriptsToRender, setTranscriptsToRender] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  const [emailing, setEmailing] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getProgrammes().then(res => {
      if (res.success) setProgrammes(res.data || []);
    });
  }, []);

  const searchStudentsFn = useCallback(async (q: string) => {
    if (!q.trim()) return;
    const res = await searchStudents(q);
    setStudentResults(res.data || []);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchStudentsFn(studentQuery), 400);
    return () => clearTimeout(t);
  }, [studentQuery, searchStudentsFn]);

  async function loadTranscript(student: any) {
    setSelectedStudent(student);
    setStudentResults([]);
    setStudentQuery("");
    setLoading(true);
    const res = await getMyTranscript(student.id);
    if (res.success) {
      setTranscriptsToRender([res.data]);
    } else {
      alert(res.error);
    }
    setLoading(false);
  }

  async function loadBulkTranscripts() {
    if (!selectedProgramme) return alert("Please select a programme");
    setLoading(true);
    setSelectedStudent(null);
    const res = await getBulkTranscripts(Number(selectedProgramme));
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

  async function handleExportImage() {
    if (!printRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2 });
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

  async function handleExportPDF() {
    if (!printRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width, canvas.height]
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      const name = selectedStudent ? selectedStudent.matricNumber || selectedStudent.admissionNumber : "Bulk_Transcripts";
      pdf.save(`Transcript_${name}.pdf`);
    } catch (e) {
      alert("Error exporting PDF");
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
      if (!containerRef.current) throw new Error("Transcript container not found");
      const html2pdf = (await import("html2pdf.js")).default;
      const name = selectedStudent ? selectedStudent.matricNumber || selectedStudent.admissionNumber : "Bulk_Transcripts";
      
      const opt = {
        margin: [10, 10, 10, 10], // Slightly larger margins
        filename: `Transcript_${name}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 1.5, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // Output as base64 string
      const pdfBase64 = await html2pdf().set(opt).from(containerRef.current).outputPdf('datauristring');
      
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

  // Formatting helpers
  const getDegreeClass = (cgpa: number) => {
    if (cgpa >= 3.50) return "DISTINCTION";
    if (cgpa >= 3.00) return "UPPER CREDIT";
    if (cgpa >= 2.50) return "LOWER CREDIT";
    if (cgpa >= 2.00) return "PASS";
    return "FAIL";
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans pb-20">
      {/* Action Bar (Hidden when printing) */}
      <div className="print:hidden bg-white border-b px-6 py-4 sticky top-0 z-50 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/admin/result-module" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          
          <div className="flex items-center gap-4 border-l border-slate-200 pl-6">
            {/* Single Student Search */}
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                value={studentQuery} 
                onChange={e => setStudentQuery(e.target.value)} 
                placeholder="Search specific student matric..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-500" 
              />
              {studentResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 shadow-xl rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                  {studentResults.map(s => (
                    <button key={s.id} onClick={() => loadTranscript(s)}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0">
                      <p className="font-semibold text-sm">{s.user?.name}</p>
                      <p className="text-xs text-slate-500">{s.matricNumber || s.admissionNumber}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <span className="text-slate-300 font-medium">OR</span>

            {/* Bulk Programme Selection */}
            <div className="flex items-center gap-2">
              <select 
                value={selectedProgramme} 
                onChange={e => setSelectedProgramme(e.target.value)}
                className="w-64 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500">
                <option value="">Select Programme for Bulk Print</option>
                {programmes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <button onClick={loadBulkTranscripts} disabled={loading || !selectedProgramme} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-700 disabled:opacity-50 flex items-center gap-2">
                <Users className="w-4 h-4" /> Load Bulk
              </button>
            </div>
          </div>
        </div>

        {transcriptsToRender.length > 0 && (
          <div className="flex items-center gap-2">
            <button onClick={handleExportImage} disabled={exporting} className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-2">
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />} PNG
            </button>
            <button onClick={handleExportPDF} disabled={exporting} className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-2">
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />} PDF
            </button>
            <button onClick={handlePrint} className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-2">
              <Printer className="w-4 h-4" /> Print
            </button>
            {transcriptsToRender.length === 1 && (
              <button onClick={handleEmailStudent} disabled={emailing} className="ml-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg flex items-center gap-2 shadow-sm transition-colors">
                {emailing ? <Loader2 className="w-4 h-4 animate-spin" /> : emailSuccess ? <CheckCircle2 className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                {emailSuccess ? "Sent!" : "Email to Student"}
              </button>
            )}
          </div>
        )}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-violet-600 animate-spin mb-4" />
          <p className="text-slate-500 font-medium">Loading transcripts...</p>
        </div>
      )}

      {/* Transcripts Container */}
      {transcriptsToRender.length > 0 && (
        <div className="py-8 print:py-0 print:bg-white flex flex-col items-center gap-8 print:gap-0" ref={printRef}>
          {transcriptsToRender.map((transcriptData, index) => {
            
            // Group transcripts by session for this specific student
            const groupedBySession = new Map<string, any[]>();
            if (transcriptData.transcripts) {
              transcriptData.transcripts.forEach((t: any) => {
                const sName = t.academicSession?.name || "Unknown Session";
                if (!groupedBySession.has(sName)) groupedBySession.set(sName, []);
                groupedBySession.get(sName)!.push(t);
              });
            }

            // Get graduation stats for this specific student
            let graduatingCgpa = "0.00";
            if (transcriptData.transcripts && transcriptData.transcripts.length > 0) {
              const last = transcriptData.transcripts[transcriptData.transcripts.length - 1];
              graduatingCgpa = Number(last.cgpa).toFixed(2);
            }

            const currentStudent = transcriptData.student;

            return (
              <div key={currentStudent.id} className="w-[210mm] min-h-[297mm] bg-white print:shadow-none shadow-2xl p-10 font-serif text-[11px] leading-tight text-black relative print:break-after-page">
                
                {/* Header */}
                <div className="text-center mb-6">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-left text-[9px]">
                      <p>P.O. Box 29751, U.I. IBADAN</p>
                      <p>Telegram: STATIBADAN</p>
                      <p>Telephone: 08023108427</p>
                      <p>Email: info@fssibadan.edu.ng</p>
                    </div>
                    {/* Simulated Logo Space */}
                    <div className="w-16 h-16 bg-slate-100 border border-slate-300 mx-4 flex items-center justify-center flex-shrink-0">
                      <span className="text-[8px] text-slate-400">LOGO</span>
                    </div>
                    <div className="text-right text-[9px]">
                      <p>Ref. No: {currentStudent.matricNumber || currentStudent.admissionNumber}</p>
                      <p>Date: {new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <h1 className="text-lg font-bold uppercase underline mb-1">FEDERAL SCHOOL OF STATISTICS</h1>
                  <h2 className="text-xs font-bold uppercase">(National Bureau of Statistics)</h2>
                  <div className="my-3">
                    <h3 className="font-bold underline uppercase text-sm">EXAMINATION TRANSCRIPT</h3>
                    <h4 className="font-bold uppercase text-xs mt-1">{currentStudent.programme?.name}</h4>
                  </div>
                  
                  <p className="mt-2 px-10 text-justify text-[10px]">
                    Below is the result of <strong className="uppercase">{currentStudent.user?.name}</strong> in the {currentStudent.programme?.name} Programme.
                  </p>
                </div>

                {/* Results Grouped by Session */}
                {Array.from(groupedBySession.entries()).map(([sessionName, semesters]) => (
                  <div key={sessionName} className="mb-6">
                    <h5 className="font-bold uppercase underline text-center mb-2">
                      {currentStudent.programme?.name} - {sessionName} SESSION
                    </h5>
                    
                    {/* Flex container for Semester 1 & 2 side-by-side */}
                    <div className="flex gap-4">
                      {semesters.map((sem: any) => (
                        <div key={sem.id} className="flex-1">
                          <h6 className="font-bold uppercase text-[10px] underline mb-1">
                            {sem.semester === "1" ? "FIRST SEMESTER" : sem.semester === "2" ? "SECOND SEMESTER" : `SEMESTER ${sem.semester}`}
                          </h6>
                          <table className="w-full text-left border-collapse mb-1">
                            <thead>
                              <tr className="border-b border-t border-black text-[9px]">
                                <th className="py-1">CODE</th>
                                <th className="py-1">SUBJECT TITLE</th>
                                <th className="py-1 text-center">CREDIT<br/>UNITS</th>
                                <th className="py-1 text-center">SCORE/100</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sem.results?.map((r: any, idx: number) => (
                                <tr key={idx}>
                                  <td className="py-0.5 whitespace-nowrap">{r.courseCode || r.courseTitle?.substring(0,6).toUpperCase()}</td>
                                  <td className="py-0.5 truncate max-w-[120px]">{r.courseTitle}</td>
                                  <td className="py-0.5 text-center">{r.creditLoad}</td>
                                  <td className="py-0.5 text-center">{r.score}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="text-right font-bold text-[10px] mt-1 pr-4">
                            GRADE POINT AVERAGE (GPA): {Number(sem.gpa).toFixed(3)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Final Graduation Info */}
                <div className="mt-8 pt-4 border-t-2 border-black flex flex-col items-center">
                  <h3 className="font-bold text-sm uppercase">
                    GRADUATING GRADE POINT AVERAGE: {graduatingCgpa} - {getDegreeClass(Number(graduatingCgpa))}
                  </h3>
                </div>

                {/* Signature Area */}
                <div className="mt-12 flex justify-between px-10">
                  <div className="text-center w-40">
                    <div className="border-b border-black mb-1 h-8"></div>
                    <p className="font-bold text-[10px]">Head of Department</p>
                    <p className="text-[9px]">{transcriptData.signatures?.hodName}</p>
                  </div>
                  <div className="text-center w-40">
                    <div className="border-b border-black mb-1 h-8"></div>
                    <p className="font-bold text-[10px]">Registrar</p>
                    <p className="text-[9px]">{transcriptData.signatures?.registrarName}</p>
                  </div>
                </div>

                {/* Grading Scale Legend */}
                <div className="mt-16 text-[8px] break-inside-avoid">
                  <h4 className="font-bold underline mb-2 text-center uppercase">GRADE POINT FOR EACH SUBJECT</h4>
                  <div className="flex justify-center gap-10">
                    <table className="border-collapse">
                      <tbody>
                        <tr><td className="pr-4">75 and above</td><td className="pr-4">AA</td><td>4.00</td></tr>
                        <tr><td>70 - 74</td><td>A</td><td>3.50</td></tr>
                        <tr><td>65 - 69</td><td>AB</td><td>3.25</td></tr>
                        <tr><td>60 - 64</td><td>B</td><td>3.00</td></tr>
                        <tr><td>55 - 59</td><td>BC</td><td>2.75</td></tr>
                        <tr><td>50 - 54</td><td>C</td><td>2.50</td></tr>
                        <tr><td>45 - 49</td><td>CD</td><td>2.25</td></tr>
                        <tr><td>40 - 44</td><td>D</td><td>2.00</td></tr>
                        <tr><td>Below 40</td><td>F</td><td>0.00</td></tr>
                      </tbody>
                    </table>
                    <div>
                      <h5 className="font-bold underline mb-1">CLASS</h5>
                      <table className="border-collapse">
                        <tbody>
                          <tr><td className="pr-4">Distinction</td><td>- 3.50 Points and above</td></tr>
                          <tr><td className="pr-4">Upper Credit</td><td>- 3.00 to 3.49 Points</td></tr>
                          <tr><td className="pr-4">Lower Credit</td><td>- 2.50 to 2.99 Points</td></tr>
                          <tr><td className="pr-4">Pass</td><td>- 2.00 to 2.49 Points</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
