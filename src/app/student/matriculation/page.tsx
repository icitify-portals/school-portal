"use client";

import React, { useState, useRef, useEffect } from 'react';
import {
  PenTool, ShieldCheck, CheckCircle2, AlertCircle, RefreshCcw,
  Trash2, Loader2, Lock, Calendar, XCircle
} from 'lucide-react';
import { signMatriculationOathAction, checkMatriculationStatusAction } from '@/actions/matriculation-register';
import { getStudentProfileStatus } from '@/actions/student-profile';
import { toast } from 'sonner';

export default function MatriculationOathPortal() {
  const [status, setStatus] = useState<any>(null);
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
      const profileRes = await getStudentProfileStatus();
      if (!profileRes.success || !profileRes.profile) {
        setLoading(false);
        return;
      }
      const p = profileRes.profile;
      const ctx = {
        id: p.id,
        sessionId: p.currentSessionId || 6,
        name: `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Student',
      };
      setStudentCtx(ctx);

      const statusRes = await checkMatriculationStatusAction(ctx.id, ctx.sessionId);
      if (statusRes.success) setStatus(statusRes);
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
      init();
    } else {
      toast.error(res.error || "Failed to sign oath.");
    }
  };

  if (loading || !studentCtx) {
    return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>;
  }

  return (
    <div className="p-8 max-w-[1600px] w-full mx-auto space-y-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100">
            <PenTool size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Official Matriculation Register</h1>
            <p className="text-slate-500 font-medium text-lg">Federal School of Statistics, Ibadan • 2026/2027</p>
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
            Deadline: {status?.deadline ? new Date(status.deadline).toLocaleDateString('en-GB') : '26/10/2026'}
          </div>
        )}
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-8">
          {status?.signed ? (
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl p-16 text-center space-y-8">
              <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-[32px] flex items-center justify-center mx-auto">
                <CheckCircle2 size={48} />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Oath Record Locked</h2>
                <p className="text-slate-500 font-medium max-w-md mx-auto">
                  You have successfully signed the institutional register. Your official status as a student of Federal School of Statistics, Ibadan is now legally recorded.
                </p>
              </div>
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 inline-block">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Digital Receipt</div>
                <div className="font-mono text-sm text-indigo-600">FSS-REG-MAT-{studentCtx.id}-SESSION-{studentCtx.sessionId}</div>
              </div>
            </div>
          ) : status?.isExpired ? (
            <div className="bg-white rounded-[40px] border border-rose-100 shadow-xl p-16 text-center space-y-6">
              <Lock size={48} className="text-rose-400 mx-auto" />
              <h2 className="text-2xl font-black text-rose-700">Oath Signing Period Has Ended</h2>
              <p className="text-slate-500">Contact the Registrar's office if you have not yet signed.</p>
            </div>
          ) : (
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl p-10 space-y-8">
              <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 space-y-6 font-serif text-slate-700 leading-relaxed text-lg">
                <p>
                  I, <span className="font-bold text-slate-900">{studentCtx.name}</span>, do solemnly promise and declare that I will be a loyal member of the Federal School of Statistics, Ibadan; that I will pay due respect to the Rector and other officers of the institution, and that I will observe all statutes, ordinances, and regulations of the institution.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <PenTool size={20} className="text-indigo-600" />
                    Your Official Signature
                  </h3>
                  <button onClick={clearCanvas} className="text-slate-400 hover:text-rose-500 transition-colors p-2 rounded-xl hover:bg-rose-50">
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="border-2 border-dashed border-slate-300 rounded-2xl bg-white p-2">
                  <canvas
                    ref={canvasRef}
                    width={800}
                    height={200}
                    className="w-full cursor-crosshair touch-none"
                    style={{ height: '150px' }}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                </div>
                <p className="text-xs text-slate-400 font-medium">Sign using your mouse or touchscreen</p>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full h-16 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-200 flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all disabled:opacity-50 text-lg uppercase tracking-wide"
              >
                {submitting ? <Loader2 className="animate-spin" size={22} /> : <ShieldCheck size={22} />}
                {submitting ? 'Recording...' : 'Sign & Submit Officially'}
              </button>
            </div>
          )}
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-4">
          <div className="bg-indigo-900 text-white rounded-[2rem] p-8 space-y-4 shadow-xl">
            <h4 className="text-xl font-black italic">Legal Declaration</h4>
            <p className="text-xs text-indigo-200 leading-relaxed">
              By signing this register, you legally acknowledge your affiliation with the institution and agree to abide by its rules.
            </p>
          </div>
          <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-md space-y-3">
            <h4 className="text-lg font-black text-slate-800">Onboarding Status</h4>
            <div className="flex justify-between text-sm"><span>Profile</span><span className="text-emerald-600 font-bold">✓</span></div>
            <div className="flex justify-between text-sm"><span>Matriculation Oath</span>
              <span className={status?.signed ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
                {status?.signed ? '✓ Signed' : '○ Pending'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}