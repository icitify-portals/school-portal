"use client";
import { Printer } from "lucide-react";

export default function PrintableGuidePage() {
  return (
    <div className="min-h-screen bg-white p-8 print:p-0">
      <div className="max-w-3xl mx-auto bg-white border border-slate-200 print:border-none print:shadow-none shadow-sm rounded-2xl p-8 print:p-0">
        <div className="text-center border-b-2 border-slate-900 pb-4 mb-6">
          <h1 className="text-xl font-black uppercase tracking-widest">Federal School of Statistics, Ibadan</h1>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">National Bureau of Statistics</p>
          <h2 className="text-lg font-black uppercase tracking-widest mt-3">CBT System — One Page User Guide</h2>
          <p className="text-xs text-slate-500 mt-1">E-Learning Manager: elearning@fssibadan.edu.ng | For Standalone & Course Exams</p>
        </div>

        <div className="space-y-6 text-sm leading-relaxed">
          <div>
            <h3 className="font-black uppercase tracking-widest text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg inline-block mb-2">For Admin: How to Create and Give an Exam</h3>
            <ol className="list-decimal pl-5 space-y-2 text-slate-700">
              <li><span className="font-bold">Prepare Questions (One Time):</span> Go to <span className="font-bold">CBT Center → Question Banks → Create Bank</span>. Name it (e.g., CSC 101). Use <span className="font-bold">Bulk Import</span> to upload many questions at once.</li>
              <li><span className="font-bold">Create Exam:</span> Go to <span className="font-bold">CBT Center → CBT Assessments → Create Exam</span>. Fill Title, Description, Duration (e.g., 60 mins), Total Marks (100). <span className="font-bold">Choose Type:</span> <span className="bg-amber-100 px-1.5 py-0.5 rounded font-bold">Standalone</span> = General exam, <span className="bg-indigo-100 px-1.5 py-0.5 rounded font-bold">Course</span> = For one course only (select Course name).</li>
              <li><span className="font-bold">Add Questions:</span> Inside your exam → <span className="font-bold">Add Question</span> → Choose Type → Type Question → Add Options → Select Correct Answer → Add. Repeat.</li>
              <li><span className="font-bold">Give to Students:</span> Small group: Search Matric No → Assign. Large group: <span className="font-bold">Bulk Assign by Filter</span> → Select ND/Level/Department → Assign Filtered Students.</li>
              <li><span className="font-bold">See Results:</span> Open exam → <span className="font-bold">Results</span> tab. See scores, who passed, tab switches. Use <span className="font-bold">Grant Extra Time</span> if needed.</li>
            </ol>
          </div>

          <div>
            <h3 className="font-black uppercase tracking-widest text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg inline-block mb-2">For Student: How to Write an Exam</h3>
            <ol className="list-decimal pl-5 space-y-2 text-slate-700">
              <li>Login → Go to <span className="font-bold">CBT</span> on your menu. You will see all exams given to you. Click <span className="font-bold">Take Exam</span>.</li>
              <li>Choose <span className="font-bold">Exam Mode</span> and click <span className="font-bold">Start</span>.</li>
              <li><span className="font-bold">Rules:</span> Do not switch tabs. Answers save automatically. Use <span className="font-bold">Question Map</span> to see answered questions. Use <span className="font-bold">Flag</span> to review later.</li>
              <li>If browser closes or network fails, login again and click <span className="font-bold">Take Exam</span> — it will continue with your remaining time.</li>
              <li>When finished, click <span className="font-bold">Submit Examination</span>. Your <span className="font-bold">Result Slip</span> will appear. You can print it.</li>
            </ol>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs">
            <p className="font-black uppercase tracking-widest mb-1">Quick Summary</p>
            <p><span className="font-bold">General test for all new students →</span> Create Exam with <span className="font-bold">Standalone</span></p>
            <p><span className="font-bold">Test for only CSC 101 that counts for CA →</span> Create Exam with <span className="font-bold">Course</span> and select CSC 101</p>
          </div>
        </div>

        <div className="flex justify-center mt-8 print:hidden">
          <button onClick={() => window.print()} className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-black text-white rounded-xl font-black uppercase tracking-widest text-xs">
            <Printer className="w-4 h-4" /> Print This Guide
          </button>
        </div>

        <p className="text-center text-[10px] text-slate-400 mt-6 print:mt-4">Federal School of Statistics, Ibadan — E-Learning Unit</p>
      </div>
    </div>
  );
}
