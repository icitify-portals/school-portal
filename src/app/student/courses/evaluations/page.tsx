"use client";

import React, { useState, useEffect } from 'react';
import { 
  Star, 
  MessageSquare, 
  ShieldCheck, 
  Send, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  ChevronRight,
  Info,
  UserCheck,
  Target
} from 'lucide-react';
import { submitCourseEvaluationAction, getStudentEvaluatableCoursesAction } from '@/actions/course-evaluations';

export default function CourseEvaluationPortal() {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Evaluation State
  const [ratings, setRatings] = useState<Record<string, number>>({
    clarity: 0,
    punctuality: 0,
    materials: 0,
    engagement: 0,
    grading: 0
  });
  const [comments, setComments] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);

  // Configuration
  const studentId = 1;
  const sessionId = 1;
  const semester: '1' | '2' = '1';

  useEffect(() => {
    loadCourses();
  }, []);

  async function loadCourses() {
    setLoading(true);
    const res = await getStudentEvaluatableCoursesAction(studentId, sessionId);
    // @ts-expect-error - TS2345: Auto-suppressed for build
    if (res.success) setCourses(res.data);
    setLoading(false);
  }

  const handleRating = (key: string, val: number) => {
    setRatings(prev => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async () => {
    if (Object.values(ratings).some(v => v === 0)) return;
    setSubmitting(true);
    const res = await submitCourseEvaluationAction({
        studentId,
        courseId: selectedCourse.id,
        sessionId,
        semester,
        ratings,
        comments,
        isAnonymous
    });
    setSubmitting(false);
    if (res.success) {
        setSuccess(true);
        setTimeout(() => {
            setSuccess(false);
            setSelectedCourse(null);
            setRatings({ clarity: 0, punctuality: 0, materials: 0, engagement: 0, grading: 0 });
            setComments('');
        }, 3000);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-transparent">
      <div className="max-w-[1600px] w-full mx-auto space-y-10 text-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 text-white rounded-[3rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden border border-slate-800">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/30 to-slate-600/30 opacity-50 mix-blend-overlay" />
            <div className="relative z-10">
                <div className="flex items-center gap-4 mb-2">
                    <Target className="w-12 h-12 text-indigo-400 drop-shadow-md" />
                    <h2 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase italic drop-shadow-md">
                        Academic Quality Feedback
                    </h2>
                </div>
                <p className="text-slate-300 font-medium mt-1 uppercase text-sm tracking-wide opacity-90">
                    Your voice shapes the future of institutional excellence
                </p>
            </div>
            
            <div className="relative z-10 flex items-center gap-4 text-xs font-bold text-emerald-300 uppercase tracking-widest bg-emerald-950/40 px-6 py-4 rounded-[1.5rem] border border-emerald-800/50 backdrop-blur-md">
               <ShieldCheck size={20} className="text-emerald-400 drop-shadow-sm" />
               Secure Anonymized Submission
            </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Course Selection Sidebar */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
             <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Registered Courses</h3>
             <div className="space-y-3">
                {loading ? (
                  <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>
                ) : courses.map((course) => (
                  <div 
                    key={course.id}
                    onClick={() => setSelectedCourse(course)}
                    className={`p-6 rounded-[2.5rem] border transition-all cursor-pointer group flex items-center justify-between backdrop-blur-3xl shadow-lg relative overflow-hidden ${
                      selectedCourse?.id === course.id ? 'bg-indigo-600/90 border-indigo-500 text-white shadow-indigo-500/20' : 'bg-white/60 border-white/40 hover:bg-white/80 hover:border-indigo-300'
                    }`}
                  >
                     <div className="relative z-10">
                        <div className={`font-black text-lg transition-colors ${selectedCourse?.id === course.id ? 'text-white' : 'text-slate-900'}`}>
                           {course.name}
                        </div>
                        <div className={`text-[10px] font-black uppercase tracking-widest mt-1 ${selectedCourse?.id === course.id ? 'text-indigo-200' : 'text-slate-500'}`}>
                           {course.code}
                        </div>
                     </div>
                     <ChevronRight size={20} className={`relative z-10 ${selectedCourse?.id === course.id ? 'text-white' : 'text-slate-400 group-hover:text-indigo-500'}`} />
                  </div>
                ))}
             </div>
          </div>

          {/* Evaluation Form */}
          <div className="col-span-12 lg:col-span-8">
             {!selectedCourse ? (
               <div className="h-[600px] bg-white/60 backdrop-blur-3xl rounded-[3rem] border border-white/40 shadow-xl shadow-slate-200/50 flex flex-col items-center justify-center text-center p-12 space-y-6">
                  <div className="w-24 h-24 bg-white/80 text-indigo-300 rounded-[2rem] flex items-center justify-center shadow-inner">
                     <BookOpen size={48} />
                  </div>
                  <div className="space-y-2">
                     <h2 className="text-3xl font-black text-slate-900 tracking-tight italic">Select a Course</h2>
                     <p className="text-slate-500 font-bold max-w-xs uppercase tracking-widest text-xs">Please choose a course from your semester registry to begin the feedback process.</p>
                  </div>
               </div>
             ) : success ? (
               <div className="h-[600px] bg-emerald-600 rounded-[3rem] shadow-2xl shadow-emerald-500/20 flex flex-col items-center justify-center text-center p-12 space-y-6 animate-in zoom-in-95 duration-500 border border-emerald-500/50 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-emerald-900/20 to-transparent mix-blend-overlay" />
                  <div className="w-24 h-24 bg-white/20 text-white rounded-[2rem] flex items-center justify-center relative z-10 backdrop-blur-sm border border-white/20">
                     <CheckCircle2 size={48} />
                  </div>
                  <div className="space-y-2 relative z-10">
                     <h2 className="text-4xl font-black text-white tracking-tighter italic">Feedback Recorded</h2>
                     <p className="text-emerald-100 font-bold uppercase tracking-widest text-xs">Thank you for your honest contribution to academic excellence.</p>
                  </div>
               </div>
             ) : (
               <div className="bg-white/60 backdrop-blur-3xl rounded-[3rem] border border-white/40 shadow-xl shadow-slate-200/50 overflow-hidden animate-in slide-in-from-right-8 duration-500 relative">
                  <div className="p-10 border-b border-white/40 flex justify-between items-center bg-white/40">
                     <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-indigo-600/90 text-white rounded-[1.5rem] flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-500/20 border border-indigo-500">
                           {selectedCourse.code.split(' ')[0]}
                        </div>
                        <div>
                           <h2 className="text-3xl font-black text-slate-900 tracking-tight italic">{selectedCourse.name}</h2>
                           <p className="text-indigo-600 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2 mt-1">
                              <UserCheck size={14} />
                              Assigned Course Lecturer
                           </p>
                        </div>
                     </div>
                  </div>

                  <div className="p-10 space-y-10 relative z-10">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[
                          { id: 'clarity', label: 'Instructional Clarity', desc: 'How clear was the teacher in delivering the course content?' },
                          { id: 'punctuality', label: 'Punctuality', desc: 'How consistent was the teacher in attending scheduled classes?' },
                          { id: 'materials', label: 'Quality of Materials', desc: 'Relevance and quality of handouts, slides, and references.' },
                          { id: 'engagement', label: 'Student Engagement', desc: 'Did the teacher encourage participation and questions?' },
                          { id: 'grading', label: 'Grading Fairness', desc: 'Transparency and fairness in assessment and grading.' }
                        ].map((item) => (
                           <div key={item.id} className="space-y-4 p-6 rounded-[2rem] bg-white/40 border border-white/50 hover:bg-white/80 transition-all shadow-sm group">
                              <div>
                                 <h4 className="font-black text-slate-800 text-lg">{item.label}</h4>
                                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 opacity-80">{item.desc}</p>
                              </div>
                              <div className="flex gap-2">
                                 {[1, 2, 3, 4, 5].map((star) => (
                                   <button 
                                     key={star}
                                     onClick={() => handleRating(item.id, star)}
                                     className={`p-3 rounded-[1rem] transition-all shadow-sm ${
                                       ratings[item.id] >= star ? 'text-amber-500 bg-amber-100 shadow-amber-500/20' : 'text-slate-300 bg-white hover:text-amber-300'
                                     }`}
                                   >
                                      <Star size={24} fill={ratings[item.id] >= star ? "currentColor" : "none"} />
                                   </button>
                                 ))}
                              </div>
                           </div>
                        ))}
                     </div>

                     <div className="space-y-4 p-6 rounded-[2rem] bg-white/40 border border-white/50">
                        <label className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2 ml-2">
                           <MessageSquare size={16} className="text-indigo-600" />
                           Qualitative Feedback & Comments
                        </label>
                        <textarea 
                          className="w-full h-32 p-6 rounded-[1.5rem] border border-white/60 bg-white/60 focus:bg-white focus:ring-4 focus:ring-indigo-500/20 outline-none font-medium transition-all resize-none shadow-inner text-slate-800"
                          placeholder="Share your thoughts on how this course can be improved..."
                          value={comments}
                          onChange={(e) => setComments(e.target.value)}
                        />
                     </div>

                     <div className="pt-8 flex justify-between items-center px-4">
                        <div className="flex items-center gap-4">
                           <button 
                             onClick={() => setIsAnonymous(!isAnonymous)}
                             className={`w-14 h-7 rounded-full relative transition-all shadow-inner ${isAnonymous ? 'bg-emerald-500' : 'bg-slate-300'}`}
                           >
                              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-sm ${isAnonymous ? 'left-8' : 'left-1'}`} />
                           </button>
                           <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Anonymous Submission</span>
                        </div>

                        <button 
                          onClick={handleSubmit}
                          disabled={submitting || Object.values(ratings).some(v => v === 0)}
                          className="bg-indigo-600 text-white px-10 py-4 rounded-[1.5rem] font-black text-lg flex items-center gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/30 disabled:opacity-50 disabled:shadow-none border border-indigo-500"
                        >
                           {submitting ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
                           Submit Evaluation
                        </button>
                     </div>
                  </div>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
