"use client";

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Trash2, 
  ChevronRight, 
  FileText, 
  Clock, 
  ShieldCheck,
  Loader2,
  Info,
  Layers,
  Printer,
  Edit3,
  XCircle,
  Search
} from 'lucide-react';
import { getAvailableCoursesAction, submitCourseRegistrationAction, getRegisteredCoursesAction } from '@/actions/course-registration';

export default function AdvancedCourseRegistrationPortal() {
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [registeredCourses, setRegisteredCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Configuration (Placeholders)
  const studentId = 1;
  const sessionId = 1;
  const semester: '1' | '2' = '1';
  const MIN_UNITS = 15;
  const MAX_UNITS = 24;

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [availRes, regRes] = await Promise.all([
      getAvailableCoursesAction(studentId, semester),
      getRegisteredCoursesAction(studentId, sessionId, semester)
    ]);
    
    if (availRes.success) setAvailableCourses(availRes.data);
    if (regRes.success) {
        setRegisteredCourses(regRes.data);
        if (regRes.data.length > 0) {
            setSelectedIds(regRes.data.map((c: any) => c.id));
        }
    }
    setLoading(false);
  }

  const toggleCourse = (courseId: number) => {
    if (isLocked) return;
    setSelectedIds(prev => prev.includes(courseId) ? prev.filter(id => id !== courseId) : [...prev, courseId]);
  };

  const totalUnits = availableCourses
    .filter(c => selectedIds.includes(c.id))
    .reduce((sum, c) => sum + (c.units || 0), 0);

  // Logic: Locked if Advisor has approved
  const advisorStatus = registeredCourses[0]?.advisorStatus || 'pending';
  const hodStatus = registeredCourses[0]?.hodStatus || 'pending';
  const isLocked = advisorStatus === 'approved' || hodStatus === 'approved';

  const handleSubmit = async () => {
    if (totalUnits < MIN_UNITS || totalUnits > MAX_UNITS) return;
    setError(null);
    setSubmitting(true);
    const res = await submitCourseRegistrationAction({
      studentId,
      sessionId,
      semester,
      courseIds: selectedIds
    });
    setSubmitting(false);
    if (res.success) {
      loadData();
    } else {
      setError(res.error || "Submission failed");
    }
  };

  const handlePrint = () => {
     window.print();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100">
            <BookOpen size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Academic Course Registration</h1>
            <p className="text-slate-500 font-medium text-lg">Tertiary Level • Faculty of Science • Semester {semester}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           <button 
             onClick={handlePrint}
             className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-indigo-600 transition-all shadow-sm"
           >
              <Printer size={20} />
           </button>
           <button 
             onClick={handleSubmit}
             disabled={submitting || totalUnits < MIN_UNITS || totalUnits > MAX_UNITS || isLocked}
             className={`px-10 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed ${
               isLocked ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'
             }`}
           >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : isLocked ? <ShieldCheck size={18} /> : <CheckCircle2 size={18} />}
              {isLocked ? 'Registration Finalized' : 'Submit for Verification'}
           </button>
        </div>
      </div>

      {error && (
         <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-rose-600 animate-in fade-in duration-300">
            <XCircle size={20} className="mt-0.5" />
            <div>
               <div className="font-bold">Registration Blocked</div>
               <div className="text-sm font-medium">{error}</div>
            </div>
         </div>
      )}

      <div className="grid grid-cols-12 gap-8">
        {/* Course Catalog */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
           <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                 <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Layers size={20} className="text-indigo-600" />
                    Available Courses
                 </h2>
                 <div className="flex gap-4">
                    <div className="relative">
                       <input type="text" placeholder="Search courses..." className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium w-48 focus:ring-2 focus:ring-indigo-500 outline-none" />
                       <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                 </div>
              </div>

              <div className="divide-y divide-slate-50">
                 {loading ? (
                    <div className="p-20 flex justify-center">
                       <Loader2 className="animate-spin text-indigo-500" size={32} />
                    </div>
                 ) : availableCourses.map((course) => (
                    <div 
                      key={course.id} 
                      onClick={() => toggleCourse(course.id)}
                      className={`p-6 flex items-center justify-between hover:bg-slate-50 transition-all cursor-pointer group ${
                        selectedIds.includes(course.id) ? 'bg-indigo-50/30 border-l-4 border-indigo-600' : 'bg-white'
                      } ${isLocked ? 'pointer-events-none' : ''}`}
                    >
                       <div className="flex items-center gap-6">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black transition-all ${
                            selectedIds.includes(course.id) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600'
                          }`}>
                             {course.code.split(' ')[0]}
                          </div>
                          <div>
                             <div className="text-slate-900 font-bold text-lg">{course.name}</div>
                             <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{course.code}</span>
                                <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                <span className="text-xs font-bold text-indigo-600">{course.units} Units</span>
                                {course.prerequisite && (
                                    <div className="flex items-center gap-1 text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                                       <AlertCircle size={10} />
                                       Req: {course.prerequisite}
                                    </div>
                                )}
                             </div>
                          </div>
                       </div>

                       <div className="flex items-center gap-4">
                          <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                            course.status === 'compulsory' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 
                            course.status === 'required' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400 border border-slate-100'
                          }`}>
                             {course.status}
                          </div>
                          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                            selectedIds.includes(course.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-100 text-transparent'
                          }`}>
                             <CheckCircle2 size={14} />
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Multi-Level Approval Hub */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
           <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl space-y-8">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                 <ShieldCheck size={20} className="text-indigo-600" />
                 Institutional Approval Chain
              </h3>
              
              <div className="space-y-8 relative">
                 <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-100" />
                 
                 {/* Phase 1: Level Advisor */}
                 <div className="relative pl-12">
                    <div className={`absolute left-0 top-0 w-8 h-8 rounded-full border-2 flex items-center justify-center z-10 transition-colors ${
                      advisorStatus === 'approved' ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200 text-slate-300'
                    }`}>
                       {advisorStatus === 'approved' ? <CheckCircle2 size={16} /> : <User size={16} />}
                    </div>
                    <div>
                       <div className="text-sm font-bold text-slate-900">Level Advisor Review</div>
                       <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">{advisorStatus}</div>
                       <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">Verification of course workload and prerequisite compliance.</p>
                    </div>
                 </div>

                 {/* Phase 2: HOD */}
                 <div className="relative pl-12">
                    <div className={`absolute left-0 top-0 w-8 h-8 rounded-full border-2 flex items-center justify-center z-10 transition-colors ${
                      hodStatus === 'approved' ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200 text-slate-300'
                    }`}>
                       {hodStatus === 'approved' ? <CheckCircle2 size={16} /> : <Layers size={16} />}
                    </div>
                    <div>
                       <div className="text-sm font-bold text-slate-900">HOD Final Approval</div>
                       <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">{hodStatus}</div>
                       <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">Departmental oversight and official record locking.</p>
                    </div>
                 </div>
              </div>

              <div className="pt-6 border-t border-slate-50">
                 <div className="flex justify-between items-center">
                    <div className="text-right">
                       <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Units Selected</div>
                       <div className={`text-2xl font-black ${totalUnits > MAX_UNITS ? 'text-rose-600' : 'text-slate-900'}`}>{totalUnits} Units</div>
                    </div>
                    {!isLocked && (
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl flex items-center gap-2">
                           <Edit3 size={16} />
                           <span className="text-[10px] font-bold uppercase">Editable</span>
                        </div>
                    )}
                 </div>
              </div>
           </div>

           <div className="bg-indigo-600 rounded-3xl p-8 text-white space-y-4">
              <h4 className="text-lg font-bold flex items-center gap-2">
                 <AlertCircle size={20} />
                 Prerequisite Policy
              </h4>
              <p className="text-xs text-indigo-100 leading-relaxed font-medium">
                The system automatically blocks registration for courses whose prerequisites have not been successfully passed in previous academic sessions.
              </p>
              <div className="h-px bg-white/10" />
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-white/60">
                 <span>Minimum Grade: D</span>
                 <span>Passed Only</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
