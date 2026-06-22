"use client";

import React, { useState, useEffect } from 'react';
import { 
  Timer, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  HelpCircle,
  Flag,
  Send,
  Loader2,
  ShieldCheck,
  Maximize2
} from 'lucide-react';
import { startEntranceExam, submitEntranceExam } from '@/actions/admission-cbt';

export default function CBTEntranceExam() {
  const [step, setStep] = useState<'instructions' | 'exam' | 'result'>('instructions');
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(3600); // 60 minutes
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(0);

  const startExam = async () => {
    setLoading(true);
    const res = await startEntranceExam(1, 1); // Placeholders for IDs
    if (res.success) {
      setQuestions(res.questions);
      setStep('exam');
    }
    setLoading(false);
  };

  const handleAnswer = (questionId: number, option: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    const res = await submitEntranceExam(1, 1, answers);
    if (res.success) {
      setScore(res.score);
      setStep('result');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (step === 'exam' && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && step === 'exam') {
      handleSubmit();
    }
  }, [timeLeft, step]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (step === 'instructions') return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
       <div className="max-w-2xl w-full bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-100">
          <div className="bg-slate-900 p-12 text-white text-center space-y-4">
             <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-indigo-500/20">
                <ShieldCheck size={40} />
             </div>
             <h1 className="text-3xl font-black tracking-tight">Institutional Entrance Examination</h1>
             <p className="text-slate-400 font-medium uppercase tracking-widest text-xs">Standardized CBT Environment • Session 2026/2027</p>
          </div>
          <div className="p-12 space-y-8">
             <div className="grid grid-cols-2 gap-6">
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                   <div className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Duration</div>
                   <div className="text-xl font-black text-slate-900 flex items-center gap-2">
                      <Timer size={20} className="text-indigo-600" />
                      60 Minutes
                   </div>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                   <div className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Questions</div>
                   <div className="text-xl font-black text-slate-900 flex items-center gap-2">
                      <HelpCircle size={20} className="text-indigo-600" />
                      50 Items
                   </div>
                </div>
             </div>

             <div className="space-y-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                   <AlertCircle size={18} className="text-amber-500" />
                   Candidate Instructions
                </h3>
                <ul className="space-y-3 text-slate-500 text-sm font-medium list-disc pl-5">
                   <li>Ensure your internet connection is stable throughout the session.</li>
                   <li>You cannot go back to the instructions once the exam starts.</li>
                   <li>Exiting full-screen mode may result in automatic disqualification.</li>
                   <li>The system will auto-submit when the timer reaches zero.</li>
                </ul>
             </div>

             <button 
               onClick={startExam}
               className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2"
             >
                {loading ? <Loader2 className="animate-spin" /> : "Initiate Secure Session"}
                <ChevronRight size={24} />
             </button>
          </div>
       </div>
    </div>
  );

  if (step === 'exam') return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
       {/* Exam Header */}
       <div className="bg-white border-b border-slate-100 p-6 flex justify-between items-center sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black">
                CBT
             </div>
             <div>
                <div className="text-slate-900 font-bold">Entrance Exam 2026</div>
                <div className="text-slate-400 text-xs font-bold uppercase tracking-widest">Question {currentIdx + 1} of {questions.length}</div>
             </div>
          </div>
          
          <div className="flex items-center gap-6">
             <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-xl border-2 transition-colors ${
               timeLeft < 300 ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse' : 'bg-slate-50 border-slate-100 text-slate-900'
             }`}>
                <Clock size={20} />
                {formatTime(timeLeft)}
             </div>
             <button className="p-3 bg-slate-100 rounded-xl text-slate-400 hover:bg-slate-200 transition-all"><Maximize2 size={20} /></button>
          </div>
       </div>

       <div className="flex-1 grid grid-cols-12 gap-8 p-8 max-w-[1600px] w-full mx-auto w-full">
          {/* Question Area */}
          <div className="col-span-12 lg:col-span-8 space-y-8">
             <div className="bg-white p-12 rounded-[40px] shadow-sm border border-slate-100 space-y-8 animate-in slide-in-from-right-8 duration-300">
                <div className="text-2xl font-bold text-slate-800 leading-relaxed">
                   {questions[currentIdx]?.questionText}
                </div>

                <div className="space-y-4">
                   {/* In a real app, JSON.parse(questions[currentIdx].options) */}
                   {['Option A', 'Option B', 'Option C', 'Option D'].map((opt, i) => (
                      <button 
                        key={i}
                        onClick={() => handleAnswer(questions[currentIdx].id, opt)}
                        className={`w-full p-6 rounded-2xl text-left font-bold transition-all border-2 flex items-center justify-between group ${
                          answers[questions[currentIdx].id] === opt 
                          ? 'bg-indigo-50 border-indigo-600 text-indigo-700' 
                          : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-100'
                        }`}
                      >
                         <span className="flex items-center gap-4">
                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center border-2 transition-colors ${
                               answers[questions[currentIdx].id] === opt ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 border-slate-100 text-slate-400 group-hover:border-indigo-200'
                            }`}>{String.fromCharCode(65 + i)}</span>
                            {opt}
                         </span>
                         {answers[questions[currentIdx].id] === opt && <CheckCircle2 size={20} />}
                      </button>
                   ))}
                </div>
             </div>

             <div className="flex justify-between items-center px-4">
                <button 
                  onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                  disabled={currentIdx === 0}
                  className="px-8 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-600 flex items-center gap-2 hover:bg-slate-50 transition-all disabled:opacity-30"
                >
                   <ChevronLeft size={20} />
                   Previous
                </button>
                <div className="flex gap-2">
                   <button className="p-4 bg-amber-50 text-amber-600 rounded-2xl hover:bg-amber-100 transition-all shadow-sm"><Flag size={20} /></button>
                </div>
                {currentIdx === questions.length - 1 ? (
                   <button 
                     onClick={handleSubmit}
                     className="px-12 py-4 bg-emerald-600 text-white rounded-2xl font-black flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                   >
                      Submit Final
                      <Send size={20} />
                   </button>
                ) : (
                   <button 
                     onClick={() => setCurrentIdx(prev => Math.min(questions.length - 1, prev + 1))}
                     className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                   >
                      Next Question
                      <ChevronRight size={20} />
                   </button>
                )}
             </div>
          </div>

          {/* Nav Sidebar */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
             <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 space-y-6">
                <h3 className="font-bold text-slate-900 uppercase tracking-widest text-xs flex items-center gap-2">
                   <BarChart3 size={16} className="text-indigo-600" />
                   Question Navigator
                </h3>
                <div className="grid grid-cols-5 gap-3">
                   {questions.map((q, i) => (
                      <button 
                        key={i}
                        onClick={() => setCurrentIdx(i)}
                        className={`w-full aspect-square rounded-xl text-xs font-black transition-all flex items-center justify-center ${
                          currentIdx === i ? 'bg-indigo-600 text-white shadow-lg' : 
                          answers[q.id] ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-50 text-slate-400 border border-slate-100'
                        }`}
                      >
                         {i + 1}
                      </button>
                   ))}
                </div>
                <div className="h-px bg-slate-50" />
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                   <div className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500 rounded-full" /> Answered</div>
                   <div className="flex items-center gap-1"><div className="w-2 h-2 bg-slate-200 rounded-full" /> Pending</div>
                </div>
             </div>

             <div className="bg-indigo-600 p-8 rounded-[40px] text-white space-y-4">
                <ShieldCheck size={32} />
                <h4 className="font-bold text-lg">Proctoring Active</h4>
                <p className="text-xs text-indigo-100 leading-relaxed font-medium">
                   Your activity is being monitored. Multiple browser tab changes or window resizes will be flagged for review by the admissions committee.
                </p>
             </div>
          </div>
       </div>
    </div>
  );

  if (step === 'result') return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
       <div className="max-w-xl w-full bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-100 text-center space-y-8 p-16 animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-50">
             <CheckCircle2 size={48} />
          </div>
          <div className="space-y-4">
             <h1 className="text-3xl font-black text-slate-900 tracking-tight">Examination Concluded</h1>
             <p className="text-slate-500 font-medium">Your responses have been securely transmitted to the Admissions Board for final screening.</p>
          </div>
          <div className="p-10 bg-slate-50 rounded-[40px] border border-slate-100 relative overflow-hidden group">
             <div className="absolute inset-0 bg-indigo-600 opacity-0 group-hover:opacity-10 transition-opacity" />
             <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">Unofficial Score Summary</div>
             <div className="text-7xl font-black text-slate-900 mt-2">{score}%</div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
             Official admission decisions will be communicated via your registered email and student portal dashboard within 48 hours.
          </p>
          <button onClick={() => window.location.href = '/'} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg">
             Return to Homepage
          </button>
       </div>
    </div>
  );
}
