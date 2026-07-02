// @ts-nocheck
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  PenTool, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCcw, 
  Trash2, 
  ChevronRight, 
  Loader2,
  Lock,
  Flag,
  Stamp,
  Scale,
  Calendar,
  XCircle
} from 'lucide-react';
import { signMatriculationOathAction, checkMatriculationStatusAction } from '@/actions/matriculation-register';

export default function MatriculationOathPortal() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Configuration
  const studentId = 1;
  const sessionId = 1;
  const institutionName = "State Global University";

  useEffect(() => {
    loadStatus();
  }, []);

  useEffect(() => {
    if (status && !status.signed && !status.isExpired) initCanvas();
  }, [status]);

  async function loadStatus() {
    setLoading(true);
    const res = await checkMatriculationStatusAction(studentId, sessionId);
    if (res.success) setStatus(res);
    setLoading(false);
  }

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.beginPath();
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleSubmit = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const blank = document.createElement('canvas');
    blank.width = canvas.width;
    blank.height = canvas.height;
    if (canvas.toDataURL() === blank.toDataURL()) {
        alert("Please provide your signature before submitting.");
        return;
    }

    setSubmitting(true);
    const signatureBase64 = canvas.toDataURL();
    const res = await signMatriculationOathAction({
        studentId,
        sessionId,
        signature: signatureBase64
    });
    setSubmitting(false);
    if (res.success) loadStatus();
  };

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>;

  return (
    <div className="p-8 max-w-[1600px] w-full mx-auto space-y-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100">
            <PenTool size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Official Matriculation Register</h1>
            <p className="text-slate-500 font-medium text-lg">Academic Session 2026/2027 • Final Onboarding</p>
          </div>
        </div>
        {status?.signed ? (
           <div className="px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 flex items-center gap-2 font-black text-sm uppercase tracking-widest">
              <ShieldCheck size={18} />
              Officially Matriculated
           </div>
        ) : status?.isExpired ? (
           <div className="px-6 py-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 flex items-center gap-2 font-black text-sm uppercase tracking-widest">
              <XCircle size={18} />
              Signing Window Closed
           </div>
        ) : (
           <div className="px-6 py-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100 flex items-center gap-2 font-black text-sm uppercase tracking-widest">
              <Calendar size={18} />
              Deadline: {new Date(status?.deadline).toLocaleDateString()}
           </div>
        )}
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* The Oath Canvas */}
        <div className="col-span-12 lg:col-span-8">
           {status?.signed ? (
             <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl p-16 text-center space-y-8">
                <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-[32px] flex items-center justify-center mx-auto">
                   <CheckCircle2 size={48} />
                </div>
                <div className="space-y-2">
                   <h2 className="text-3xl font-black text-slate-900 tracking-tight">Oath Record Locked</h2>
                   <p className="text-slate-500 font-medium max-w-md mx-auto">You have successfully signed the institutional register. Your official status as a student of {institutionName} is now legally recorded.</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 inline-block">
                   <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Digital Receipt</div>
                   <div className="font-mono text-sm text-indigo-600">SGU-REG-MAT-{studentId}-SESSION-1</div>
                </div>
             </div>
           ) : status?.isExpired ? (
             <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl p-16 text-center space-y-8">
                <div className="w-24 h-24 bg-rose-50 text-rose-600 rounded-[32px] flex items-center justify-center mx-auto">
                   <Lock size={48} />
                </div>
                <div className="space-y-4">
                   <h2 className="text-3xl font-black text-slate-900 tracking-tight">Portal Locked</h2>
                   <p className="text-slate-500 font-medium max-w-md mx-auto">The deadline for signing the matriculation register has passed. Please contact the Registrar's Office for further guidance or to request a special extension.</p>
                   <div className="pt-4">
                      <button className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all">
                         Contact Support
                      </button>
                   </div>
                </div>
             </div>
           ) : (
             <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 duration-700">
                <div className="p-10 bg-slate-50 border-b border-slate-100 space-y-6">
                   <div className="flex items-center gap-2 text-indigo-600">
                      <Scale size={20} />
                      <h3 className="font-black uppercase tracking-tighter text-sm">The Matriculation Oath</h3>
                   </div>
                   <p className="text-xl font-medium text-slate-700 leading-relaxed italic">
                    "I, Olanrewaju Ibrahim, do solemnly promise and declare that I will be a loyal member of {institutionName}; that I will pay due respect to the Vice Chancellor and other officers of the University, and that I will observe all statutes, ordinances, and regulations of the University."
                   </p>
                </div>

                <div className="p-10 space-y-6">
                   <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                         <PenTool size={14} className="text-indigo-600" />
                         Append Official Signature Below
                      </label>
                      <button 
                        onClick={clearCanvas}
                        className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-2 transition-colors"
                      >
                         <RefreshCcw size={14} />
                         Clear & Redo
                      </button>
                   </div>
                   
                   <div className="relative group">
                      <canvas 
                        ref={canvasRef}
                        width={600}
                        height={200}
                        onMouseDown={startDrawing}
                        onMouseUp={stopDrawing}
                        onMouseOut={stopDrawing}
                        onMouseMove={draw}
                        onTouchStart={startDrawing}
                        onTouchEnd={stopDrawing}
                        onTouchMove={draw}
                        className="w-full h-[200px] border-2 border-dashed border-slate-100 rounded-[32px] bg-slate-50/50 cursor-crosshair group-hover:border-indigo-200 transition-all shadow-inner"
                      />
                   </div>

                   <button 
                     onClick={handleSubmit}
                     disabled={submitting}
                     className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-xl flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
                   >
                      {submitting ? <Loader2 size={24} className="animate-spin" /> : <Lock size={24} />}
                      Sign Register & Finalize Enrollment
                   </button>
                </div>
             </div>
           )}
        </div>

        {/* Info & Policy */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
           <div className="bg-slate-900 rounded-[40px] p-8 text-white space-y-8 shadow-xl">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-indigo-400">
                 <Stamp size={28} />
              </div>
              <div className="space-y-4">
                 <h3 className="text-2xl font-bold">Institutional Registry</h3>
                 <p className="text-sm text-slate-400 leading-relaxed font-medium">
                    This register is an official legal record. Signing must be completed within the 4-week window following the matriculation ceremony.
                 </p>
              </div>
              {!status?.signed && !status?.isExpired && (
                <div className="p-5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl space-y-3">
                   <div className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Time Remaining</div>
                   <div className="text-lg font-bold text-white flex items-center gap-2">
                      <Clock size={18} className="text-indigo-400" />
                      Dynamic Countdown Active
                   </div>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
