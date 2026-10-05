"use client";

import React, { useState, useEffect } from 'react';
import {
  BookOpen, CheckCircle2, AlertCircle, Plus, Trash2, ChevronRight,
  FileText, Clock, ShieldCheck, Loader2, Info, Layers, Printer,
  Edit3, XCircle, Search, CreditCard, RefreshCw
} from 'lucide-react';
import { getAvailableCoursesAction, submitCourseRegistrationAction, getRegisteredCoursesAction } from '@/actions/course-registration';
import { recordPrintFeePaymentAction } from '@/actions/finance';
import { getStudentProfileStatus } from '@/actions/student-profile';
import { getCurrentSession } from '@/actions/portal';
import { resolveLevel } from '@/lib/levels';
import { AlatpayInlineCheckout } from '@/components/finance/AlatpayInlineCheckout';
import { toast } from 'sonner';

const COURSE_FORM_FEE = 500;

export default function AdvancedCourseRegistrationPortal() {
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [registeredCourses, setRegisteredCourses] = useState<any[]>([]);
  const [isPrintFeePaid, setIsPrintFeePaid] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studentCtx, setStudentCtx] = useState<{ id: number; sessionId: number; semester: '1' | '2'; email: string; firstName: string; lastName: string; phone: string; levelLabel: string } | null>(null);

  const MIN_UNITS = 15;
  const MAX_UNITS = 24;

  useEffect(() => {
    initContext();
  }, []);

  async function initContext() {
    setLoading(true);
    try {
      const profileRes = await getStudentProfileStatus();
      if (!profileRes.success || !profileRes.profile) {
        setError("Unable to load student profile.");
        setLoading(false);
        return;
      }
      const p: any = profileRes.profile;

      // The session and semester come from the portal's current session, never
      // a hardcoded id, so this keeps working when a new session is opened.
      const currentSession = await getCurrentSession();
      if (!currentSession) {
        setError("No academic session is currently set. Please contact the registrar.");
        setLoading(false);
        return;
      }

      const ctx = {
        id: p.id,
        sessionId: currentSession.id,
        semester: (currentSession.currentSemester === '2' ? '2' : '1') as '1' | '2',
        email: p.email || '',
        firstName: p.firstName || '',
        lastName: p.lastName || '',
        phone: p.phone || '',
        levelLabel: resolveLevel(p.currentLevel, p.programmeType)?.label || '',
      };
      setStudentCtx(ctx);
      await loadData(ctx);
    } catch (e: any) {
      setError(e.message || "Failed to load student data.");
    }
    setLoading(false);
  }

  async function loadData(ctx: { id: number; sessionId: number; semester: '1' | '2' }) {
    const [availRes, regRes] = await Promise.all([
      getAvailableCoursesAction(ctx.id, ctx.semester),
      getRegisteredCoursesAction(ctx.id, ctx.sessionId, ctx.semester)
    ]);

    if (availRes.success) setAvailableCourses(availRes.data || []);
    if (regRes.success) {
      setIsPrintFeePaid(regRes.isPrintFeePaid || false);
      // @ts-expect-error - TS2345: Auto-suppressed for build
      setRegisteredCourses(regRes.data);
      // @ts-expect-error - TS18048: Auto-suppressed for build
      if (regRes.data.length > 0) {
        // @ts-expect-error - TS18048: Auto-suppressed for build
        setSelectedIds(regRes.data.map((c: any) => c.id));
      }
    }
  }

  const toggleCourse = (courseId: number) => {
    if (isLocked) return;
    setSelectedIds(prev => prev.includes(courseId) ? prev.filter(id => id !== courseId) : [...prev, courseId]);
  };

  const totalUnits = availableCourses
    .filter(c => selectedIds.includes(c.id))
    .reduce((sum, c) => sum + (c.units || 0), 0);

  const advisorStatus = registeredCourses[0]?.advisorStatus || 'pending';
  const hodStatus = registeredCourses[0]?.hodStatus || 'pending';
  const isLocked = advisorStatus === 'approved' || hodStatus === 'approved';
  const hasSubmitted = registeredCourses.length > 0;
  const unitProblem = totalUnits < MIN_UNITS
    ? `Select at least ${MIN_UNITS} units (currently ${totalUnits}).`
    : totalUnits > MAX_UNITS
      ? `You have selected ${totalUnits} units. The maximum is ${MAX_UNITS}.`
      : null;

  const handleSubmit = async () => {
    if (!studentCtx) return;
    if (unitProblem) return toast.error(unitProblem);

    // The N500 course form fee is charged at submission, and only at submission.
    if (!isPrintFeePaid) {
      toast.info(`A payment of N${COURSE_FORM_FEE} is required to submit your course registration form.`);
      setShowPayment(true);
      return;
    }

    setError(null);
    setSubmitting(true);
    const res = await submitCourseRegistrationAction({
      studentId: studentCtx.id,
      sessionId: studentCtx.sessionId,
      semester: studentCtx.semester,
      courseIds: selectedIds
    });
    setSubmitting(false);
    if (res.success) {
      toast.success("Course registration submitted successfully.");
      await loadData(studentCtx);
    } else {
      setError(res.error || "Submission failed");
    }
  };

  const handlePrintClick = () => {
    // Printing never charges anything. The form is printable once it has been
    // paid for and submitted.
    if (!hasSubmitted) {
      toast.error("Submit your course registration form before printing it.");
      return;
    }
    if (!isPrintFeePaid) {
      toast.error(`The course form fee of N${COURSE_FORM_FEE} has not been paid.`);
      return;
    }
    window.print();
  };

  const handlePaymentSuccess = async (res: any) => {
    if (!studentCtx) return;
    const r = await recordPrintFeePaymentAction(
      studentCtx.id, studentCtx.sessionId, studentCtx.semester,
      COURSE_FORM_FEE, res.reference || res.transactionReference, res.gatewayTransactionId || ""
    );
    if (r.success) {
      toast.success("Payment successful! Submitting your course registration...");
      setIsPrintFeePaid(true);
      setShowPayment(false);

      setSubmitting(true);
      const subRes = await submitCourseRegistrationAction({
        studentId: studentCtx.id,
        sessionId: studentCtx.sessionId,
        semester: studentCtx.semester,
        courseIds: selectedIds
      });
      setSubmitting(false);
      if (subRes.success) {
        toast.success("Course registration submitted successfully.");
        await loadData(studentCtx);
      } else {
        setError(subRes.error || "Submission failed");
      }
    } else {
      toast.error("Failed to record payment.");
    }
  };

  if (loading || !studentCtx) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-transparent">
      <div className="max-w-[1600px] w-full mx-auto space-y-10 text-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 text-white rounded-[3rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden border border-slate-800">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/30 to-slate-600/30 opacity-50 mix-blend-overlay" />
            <div className="relative z-10">
                <div className="flex items-center gap-4 mb-2">
                    <BookOpen className="w-12 h-12 text-indigo-400 drop-shadow-md" />
                    <h2 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase italic drop-shadow-md">
                        Academic Course Registration
                    </h2>
                </div>
<p className="text-slate-300 font-medium mt-1 uppercase text-sm tracking-wide opacity-90">
                    {studentCtx.firstName} {studentCtx.lastName}
                    {studentCtx.levelLabel ? ` • ${studentCtx.levelLabel}` : ''}
                    • Semester {studentCtx.semester === '1' ? 'First' : 'Second'}
                </p>
            </div>

            <div className="relative z-10 flex gap-3">
               <button
                 onClick={handlePrintClick}
                 disabled={!hasSubmitted || !isPrintFeePaid}
                 title={!hasSubmitted
                    ? "Submit your course registration form first"
                    : !isPrintFeePaid
                      ? `The course form fee of N${COURSE_FORM_FEE} has not been paid`
                      : "Print your course registration form"}
                 className={`h-12 px-4 flex items-center gap-2 rounded-2xl font-bold text-sm transition-all shadow-lg backdrop-blur-md border disabled:opacity-40 disabled:cursor-not-allowed ${
                   isPrintFeePaid && hasSubmitted
                     ? 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                     : 'bg-white/5 border-white/10 text-slate-400'
                 }`}
               >
                   <Printer size={18} />
                   Print Form
               </button>
               <button
                 onClick={handleSubmit}
                 disabled={submitting || !!unitProblem || isLocked}
                 title={unitProblem || undefined}
                 className={`h-12 px-6 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg backdrop-blur-md border disabled:opacity-50 disabled:cursor-not-allowed ${
                   isLocked
                    ? 'bg-emerald-600/90 border-emerald-500 text-white shadow-emerald-900/50'
                    : !isPrintFeePaid
                    ? 'bg-amber-600 border-amber-500/50 text-white hover:bg-amber-700 shadow-amber-900/50'
                    : 'bg-indigo-600 border-indigo-500/50 text-white hover:bg-indigo-700 shadow-indigo-900/50'
                 }`}
               >
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : isLocked ? <ShieldCheck size={18} /> : <CheckCircle2 size={18} />}
                  {isLocked ? 'Registration Finalized' : !isPrintFeePaid ? `Pay ₦${COURSE_FORM_FEE} & Submit Form` : 'Submit Form'}
               </button>
            </div>
        </div>

        {error && (
           <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-[2rem] flex items-start gap-4 text-rose-900 animate-in fade-in duration-300 backdrop-blur-md shadow-lg shadow-rose-500/5">
              <XCircle size={24} className="text-rose-600 shrink-0 mt-0.5" />
              <div>
                 <div className="font-black text-lg uppercase tracking-tight italic text-rose-800">Registration Blocked</div>
                 <div className="text-sm font-bold mt-1 text-rose-700">{error}</div>
              </div>
           </div>
        )}

        <div className="grid grid-cols-12 gap-8">
          {/* Course Catalog */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
             <div className="bg-white/60 backdrop-blur-3xl rounded-[3rem] border border-white/40 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="p-8 lg:p-10 border-b border-white/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/40">
                   <h2 className="text-2xl font-black text-slate-900 tracking-tight italic flex items-center gap-3">
                      <Layers size={24} className="text-indigo-600" />
                      Available Courses
                   </h2>
                </div>

                <div className="divide-y divide-white/40 bg-white/20 p-4">
                   {loading ? (
                      <div className="p-20 flex justify-center">
                         <Loader2 className="animate-spin text-indigo-500" size={40} />
                      </div>
                   ) : availableCourses.length === 0 ? (
                      <div className="p-16 text-center space-y-4">
                         <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
                         <div className="font-black text-xl uppercase tracking-tight text-slate-700">
                            No Courses Available Yet
                         </div>
                         <p className="text-sm font-medium text-slate-500 max-w-md mx-auto leading-relaxed">
                            There are no courses configured for your level
                            {studentCtx.levelLabel ? ` (${studentCtx.levelLabel})` : ''} in this semester.
                            The registrar or your HOD has not published the course list yet. Please check back
                            shortly or contact the department office.
                         </p>
                      </div>
                   ) : availableCourses.map((course) => (
                      <div
                        key={course.id}
                        onClick={() => toggleCourse(course.id)}
                        className={`p-6 rounded-[2rem] flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all cursor-pointer group mb-2 last:mb-0 ${
                          selectedIds.includes(course.id) ? 'bg-indigo-600/90 shadow-lg shadow-indigo-500/20 border border-indigo-500' : 'bg-white/40 border border-white/50 hover:bg-white/80'
                        } ${isLocked ? 'pointer-events-none' : ''}`}
                      >
                         <div className="flex items-center gap-6">
                            <div className={`w-14 h-14 rounded-[1.2rem] flex items-center justify-center font-black text-xl transition-all shadow-sm ${
                              selectedIds.includes(course.id) ? 'bg-white text-indigo-600' : 'bg-slate-200 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'
                            }`}>
                               {course.code.split(' ')[0]}
                            </div>
                            <div>
                               <div className={`font-black text-xl transition-colors ${selectedIds.includes(course.id) ? 'text-white' : 'text-slate-900'}`}>{course.name}</div>
                               <div className="flex items-center gap-3 mt-1 flex-wrap">
                                  <span className={`text-[10px] font-black uppercase tracking-widest ${selectedIds.includes(course.id) ? 'text-indigo-200' : 'text-slate-500'}`}>{course.code}</span>
                                  <span className={`w-1 h-1 rounded-full ${selectedIds.includes(course.id) ? 'bg-indigo-400' : 'bg-slate-300'}`} />
<span className={`text-[10px] font-black uppercase tracking-widest ${selectedIds.includes(course.id) ? 'text-white' : 'text-indigo-600'}`}>{course.units} Units</span>
                                   {course.isCarryOver && (
                                       <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded border ${selectedIds.includes(course.id) ? 'text-white bg-white/20 border-white/30' : 'text-amber-800 bg-amber-100/80 border-amber-200'}`}>
                                          <RefreshCw size={10} />
                                          Carry-over
                                       </div>
                                   )}
                                   {course.prerequisite && (
                                      <div className="flex items-center gap-1 text-[10px] text-amber-700 font-black bg-amber-100/80 px-2 py-0.5 rounded border border-amber-200">
                                         <AlertCircle size={10} />
                                         Req: {course.prerequisite}
                                      </div>
                                  )}
                               </div>
                            </div>
                         </div>

                         <div className="flex items-center justify-between lg:justify-end gap-6 ml-[5.5rem] lg:ml-0">
                            <div className={`px-4 py-1.5 rounded-[1rem] text-[10px] font-black uppercase tracking-widest shadow-sm ${
                              course.status === 'compulsory' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' :
                              course.status === 'required' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}>
                               {course.status}
                            </div>
                            <div className={`w-8 h-8 rounded-[1rem] border-[3px] flex items-center justify-center transition-all ${
                              selectedIds.includes(course.id) ? 'bg-white border-white text-indigo-600 shadow-inner' : 'border-slate-300 text-transparent group-hover:border-indigo-300'
                            }`}>
                               <CheckCircle2 size={18} strokeWidth={3} />
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </div>

          {/* Sidebar */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
             <div className="bg-white/60 backdrop-blur-3xl p-8 rounded-[3rem] border border-white/40 shadow-xl shadow-slate-200/50 space-y-8">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight italic flex items-center gap-3">
                   <ShieldCheck size={24} className="text-indigo-600" />
                   Approval Chain
                </h3>

                <div className="space-y-8 relative">
                   <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-slate-200" />

                   <div className="relative pl-14">
                      <div className={`absolute left-0 top-0 w-10 h-10 rounded-full border-2 flex items-center justify-center z-10 transition-all ${
                        advisorStatus === 'approved' ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white border-slate-300 text-slate-400'
                      }`}>
                         {advisorStatus === 'approved' ? <CheckCircle2 size={18} /> : <FileText size={18} />}
                      </div>
                      <div>
                         <div className="text-base font-black text-slate-800">Level Advisor Review</div>
                         <div className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${advisorStatus === 'approved' ? 'text-emerald-600' : 'text-slate-400'}`}>{advisorStatus}</div>
                         <p className="text-xs text-slate-500 mt-2 leading-relaxed">Verification of course workload and prerequisite compliance.</p>
                      </div>
                   </div>

                   <div className="relative pl-14">
                      <div className={`absolute left-0 top-0 w-10 h-10 rounded-full border-2 flex items-center justify-center z-10 transition-all ${
                        hodStatus === 'approved' ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white border-slate-300 text-slate-400'
                      }`}>
                         {hodStatus === 'approved' ? <CheckCircle2 size={18} /> : <Layers size={18} />}
                      </div>
                      <div>
                         <div className="text-base font-black text-slate-800">HOD Final Approval</div>
                         <div className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${hodStatus === 'approved' ? 'text-emerald-600' : 'text-slate-400'}`}>{hodStatus}</div>
                         <p className="text-xs text-slate-500 mt-2 leading-relaxed">Departmental oversight and official record locking.</p>
                      </div>
                   </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                   <div className="flex justify-between items-center">
                      <div>
                         <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Units Selected</div>
<div className={`text-3xl font-black ${totalUnits > MAX_UNITS ? 'text-rose-600' : 'text-slate-900'}`}>{totalUnits} Units</div>
                       </div>
                       {!isLocked && (
                           <div className="p-3 bg-amber-100/80 text-amber-800 rounded-[1rem] flex items-center gap-2 border border-amber-200">
                              <Edit3 size={16} />
                              <span className="text-[10px] font-black uppercase tracking-wider">Editable</span>
                           </div>
                       )}
                    </div>
                    {!isLocked && (
                        <p className={`text-[10px] font-black uppercase tracking-widest mt-2 ${unitProblem ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {unitProblem || `Within the ${MIN_UNITS}-${MAX_UNITS} unit limit`}
                        </p>
                    )}
                </div>

                {!isLocked && (
                    <div className="bg-amber-50 border border-amber-100 rounded-[2rem] p-6 space-y-2">
                        <div className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Course Form Fee</div>
                        <div className="text-sm font-bold text-amber-900">
                            ₦{COURSE_FORM_FEE} is charged once, when you submit this form.
                        </div>
                        <div className="text-[10px] font-bold text-amber-700/70 uppercase tracking-widest">
                            {isPrintFeePaid ? "Paid — submit any time." : "Not yet paid."}
                        </div>
                    </div>
                )}
             </div>

             <div className="bg-indigo-900 text-white rounded-[3rem] p-8 space-y-4 shadow-xl border border-indigo-950 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-800 to-transparent mix-blend-overlay" />
                <h4 className="text-xl font-black italic tracking-tight flex items-center gap-2 relative z-10">
                   <AlertCircle size={22} className="text-indigo-300" />
                   Prerequisite Policy
                </h4>
                <p className="text-xs text-indigo-200 leading-relaxed font-bold relative z-10">
                  The system automatically blocks registration for courses whose prerequisites have not been successfully passed in previous academic sessions.
                </p>
             </div>
          </div>
        </div>

        {/* Payment Modal */}
        {showPayment && studentCtx && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-black text-slate-900">Course Registration Form Fee</h3>
                        <button onClick={() => setShowPayment(false)} className="text-slate-400 hover:text-slate-600">
                            <XCircle className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-2xl mb-6 border border-slate-100">
                        <p className="text-sm text-slate-600 mb-2 font-medium">To complete, submit, and print your course registration form, a processing fee is required.</p>
                        <div className="text-3xl font-black text-indigo-600">₦500.00</div>
                    </div>
                    <AlatpayInlineCheckout
                        amount={500}
                        email={studentCtx.email}
                        firstName={studentCtx.firstName}
                        lastName={studentCtx.lastName}
                        phone={studentCtx.phone}
                        reference={`PRINT_${studentCtx.id}_${Date.now()}`}
                        description="Course Registration Print Fee"
                        onSuccess={handlePaymentSuccess}
                        onClose={() => setShowPayment(false)}
                    />
                </div>
            </div>
        )}
      </div>
    </div>
  );
}