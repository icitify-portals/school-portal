"use client";

import React, { useState, useRef, useEffect } from 'react';
import {
  PenTool, ShieldCheck, CheckCircle2, AlertCircle, RefreshCcw,
  Trash2, Loader2, Lock, Calendar, XCircle, Printer
} from 'lucide-react';
import { signMatriculationOathAction, checkMatriculationStatusAction } from '@/actions/matriculation-register';
import { getStudentProfileStatus } from '@/actions/student-profile';
import { getStudentMatriculationOathData } from '@/actions/dossier';
import { MatriculationOathPrintable } from '@/components/documents/MatriculationOathPrintable';
import { toast } from 'sonner';

export default function MatriculationOathPortal() {
  const [status, setStatus] = useState<any>(null);
  const [oathData, setOathData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [studentCtx, setStudentCtx] = useState<{ id: number; sessionId: number; name: string } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    setLoading(true);
    try {
      const [oathRes, profileRes] = await Promise.all([
        getStudentMatriculationOathData(),
        getStudentProfileStatus()
      ]);

      if (oathRes.success && oathRes.data) {
        setOathData(oathRes.data);
      }

      if (profileRes.success && profileRes.profile) {
        const p = profileRes.profile;
        const ctx = {
          id: p.id,
          sessionId: p.currentSessionId || 6,
          name: `${p.lastName || ''} ${p.firstName || ''} ${p.otherNames || ''}`.trim() || 'Student',
        };
        setStudentCtx(ctx);

        const statusRes = await checkMatriculationStatusAction(ctx.id, ctx.sessionId);
        if (statusRes.success) {
          setStatus(statusRes);
        } else if (oathRes.data?.matricRecord) {
          setStatus({ signed: true, record: oathRes.data.matricRecord });
        }
      }
    } catch (e) {
      console.error("Failed to load oath status:", e);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (status && !status.signed && !status.isExpired) initCanvas();
  }, [status]);

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
    if (!studentCtx) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const blank = document.createElement('canvas');
    blank.width = canvas.width;
    blank.height = canvas.height;
    if (canvas.toDataURL() === blank.toDataURL()) {
      toast.error("Please provide your signature before submitting.");
      return;
    }

    setSubmitting(true);
    const signatureBase64 = canvas.toDataURL();
    const res = await signMatriculationOathAction({
      studentId: studentCtx.id,
      sessionId: studentCtx.sessionId,
      signature: signatureBase64,
    });
    setSubmitting(false);
    if (res.success) {
      toast.success("Matriculation oath signed successfully.");
      await init();
    } else {
      toast.error(res.error || "Failed to sign oath.");
    }
  };

  if (loading) {
    return (
      <div className="p-20 flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="animate-spin text-indigo-600 mb-3" size={40} />
        <p className="text-slate-500 text-sm font-medium">Loading Matriculation Register...</p>
      </div>
    );
  }

  // If already signed, present the official printable certificate directly!
  if (status?.signed || oathData?.matricRecord) {
    return <MatriculationOathPrintable data={oathData} isStaffView={false} />;
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl w-full mx-auto space-y-8 bg-slate-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100 shrink-0">
            <PenTool size={28} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Official Matriculation Register</h1>
            <p className="text-slate-500 font-medium text-sm sm:text-base">Federal School of Statistics, Ibadan • 2026/2027</p>
          </div>
        </div>

        <div className="px-4 py-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-200 flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
          <Calendar size={16} />
          Action Required for ND 1 & HND 1 Freshers
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-10 space-y-6">
            <div className="bg-indigo-50/60 p-6 rounded-2xl border border-indigo-100 space-y-4 font-serif text-slate-800 leading-relaxed text-base">
              <h3 className="text-xs font-black uppercase tracking-widest text-indigo-900 font-sans">Institutional Matriculation Oath</h3>
              <p>
                I, <span className="font-bold text-slate-900 underline uppercase">{studentCtx?.name || 'Student'}</span>, having been admitted as a student into the Federal School of Statistics, Ibadan, do solemnly promise and declare that I will be a loyal, obedient member of the institution; that I will pay due respect to the Rector, Registrar, and other constituted officers; and that I will faithfully observe all statutes, ordinances, and lawful regulations of the institution.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <PenTool size={18} className="text-indigo-600" />
                  Draw Your Signature Here
                </h3>
                <button 
                  onClick={clearCanvas} 
                  type="button"
                  className="text-slate-400 hover:text-rose-500 transition-colors p-2 rounded-xl hover:bg-rose-50 flex items-center gap-1 text-xs font-bold"
                >
                  <Trash2 size={16} /> Clear Canvas
                </button>
              </div>
              <div className="border-2 border-dashed border-slate-300 rounded-2xl bg-white p-2">
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={200}
                  className="w-full cursor-crosshair touch-none bg-slate-50/50 rounded-xl"
                  style={{ height: '160px' }}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>
              <p className="text-xs text-slate-400 font-medium">Use your mouse, trackpad, or touchscreen finger/stylus to sign within the box.</p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full h-14 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all disabled:opacity-50 text-base uppercase tracking-wide"
            >
              {submitting ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
              {submitting ? 'Recording Official Signature...' : 'Sign Oath & Generate Certificate'}
            </button>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-4">
          <div className="bg-slate-900 text-white rounded-3xl p-6 space-y-3 shadow-lg">
            <h4 className="text-base font-black tracking-tight text-white uppercase flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" /> Statutory Requirement
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every newly admitted student (ND 1 and HND 1) must execute this oath before full matriculation status and access are granted.
            </p>
            <p className="text-xs text-slate-400 pt-2 border-t border-slate-800">
              Once signed, you will be able to print and download your official Matriculation Oath Slip at any time.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Registration Check</h4>
            <div className="flex justify-between items-center text-xs py-2 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Level</span>
              <span className="font-bold text-slate-900 uppercase">{oathData?.student?.programmeType || 'ND/HND'} {oathData?.student?.currentLevel || 1}</span>
            </div>
            <div className="flex justify-between items-center text-xs py-2 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Programme</span>
              <span className="font-bold text-slate-900">{oathData?.programme?.name || 'Assigned'}</span>
            </div>
            <div className="flex justify-between items-center text-xs py-2">
              <span className="text-slate-600 font-medium">Oath Status</span>
              <span className="text-amber-600 font-bold bg-amber-50 px-2.5 py-0.5 rounded-full">Pending Signature</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
