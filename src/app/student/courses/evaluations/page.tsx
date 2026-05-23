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
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100">
            <Target size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Academic Quality Feedback</h1>
            <p className="text-slate-500 font-medium text-lg">Your voice shapes the future of institutional excellence</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest bg-white px-6 py-3 rounded-2xl border border-slate-100">
           <ShieldCheck size={16} className="text-emerald-500" />
           Secure Anonymized Submission
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Course Selection Sidebar */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
           <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Registered Courses</h3>
           <div className="space-y-3">
              {loading ? (
                <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>
              ) : courses.map((course) => (
                <div 
                  key={course.id}
                  onClick={() => setSelectedCourse(course)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer group flex items-center justify-between ${
                    selectedCourse?.id === course.id ? 'bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-100' : 'bg-white border-slate-100 hover:border-indigo-300'
                  }`}
                >
                   <div>
                      <div className={`font-bold transition-colors ${selectedCourse?.id === course.id ? 'text-white' : 'text-slate-900'}`}>
                         {course.name}
                      </div>
                      <div className={`text-[10px] font-bold uppercase tracking-widest ${selectedCourse?.id === course.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                         {course.code}
                      </div>
                   </div>
                   <ChevronRight size={18} className={selectedCourse?.id === course.id ? 'text-white' : 'text-slate-300 group-hover:text-indigo-400'} />
                </div>
              ))}
           </div>
        </div>

        {/* Evaluation Form */}
        <div className="col-span-12 lg:col-span-8">
           {!selectedCourse ? (
             <div className="h-[600px] bg-white rounded-[40px] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center p-12 space-y-6">
                <div className="w-24 h-24 bg-slate-50 text-slate-200 rounded-[32px] flex items-center justify-center">
                   <BookOpen size={48} />
                </div>
                <div className="space-y-2">
                   <h2 className="text-2xl font-bold text-slate-900">Select a Course</h2>
                   <p className="text-slate-500 font-medium max-w-xs">Please choose a course from your semester registry to begin the feedback process.</p>
                </div>
             </div>
           ) : success ? (
             <div className="h-[600px] bg-emerald-600 rounded-[40px] shadow-2xl shadow-emerald-100 flex flex-col items-center justify-center text-center p-12 space-y-6 animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-white/20 text-white rounded-[32px] flex items-center justify-center">
                   <CheckCircle2 size={48} />
                </div>
                <div className="space-y-2">
                   <h2 className="text-3xl font-black text-white tracking-tight">Feedback Recorded</h2>
                   <p className="text-emerald-50 font-medium">Thank you for your honest contribution to academic excellence.</p>
                </div>
             </div>
           ) : (
             <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden animate-in slide-in-from-right-8 duration-500">
                <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                   <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-100">
                         {selectedCourse.code.split(' ')[0]}
                      </div>
                      <div>
                         <h2 className="text-2xl font-bold text-slate-900">{selectedCourse.name}</h2>
                         <p className="text-slate-500 font-medium flex items-center gap-2">
                            <UserCheck size={14} className="text-indigo-600" />
                            Assigned Course Lecturer
                         </p>
                      </div>
                   </div>
                </div>

                <div className="p-10 space-y-10">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      {[
                        { id: 'clarity', label: 'Instructional Clarity', desc: 'How clear was the teacher in delivering the course content?' },
                        { id: 'punctuality', label: 'Punctuality', desc: 'How consistent was the teacher in attending scheduled classes?' },
                        { id: 'materials', label: 'Quality of Materials', desc: 'Relevance and quality of handouts, slides, and references.' },
                        { id: 'engagement', label: 'Student Engagement', desc: 'Did the teacher encourage participation and questions?' },
                        { id: 'grading', label: 'Grading Fairness', desc: 'Transparency and fairness in assessment and grading.' }
                      ].map((item) => (
                         <div key={item.id} className="space-y-4 p-6 rounded-3xl hover:bg-slate-50 transition-colors group">
                            <div>
                               <h4 className="font-bold text-slate-900">{item.label}</h4>
                               <p className="text-[11px] text-slate-500 font-medium">{item.desc}</p>
                            </div>
                            <div className="flex gap-2">
                               {[1, 2, 3, 4, 5].map((star) => (
                                 <button 
                                   key={star}
                                   onClick={() => handleRating(item.id, star)}
                                   className={`p-2 rounded-xl transition-all ${
                                     ratings[item.id] >= star ? 'text-amber-500 bg-amber-50' : 'text-slate-200 bg-slate-50 hover:text-amber-300'
                                   }`}
                                 >
                                    <Star size={24} fill={ratings[item.id] >= star ? "currentColor" : "none"} />
                                 </button>
                               ))}
                            </div>
                         </div>
                      ))}
                   </div>

                   <div className="space-y-4">
                      <label className="text-sm font-bold text-slate-900 flex items-center gap-2 ml-2">
                         <MessageSquare size={18} className="text-indigo-600" />
                         Qualitative Feedback & Comments
                      </label>
                      <textarea 
                        className="w-full h-32 p-6 rounded-3xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none font-medium transition-all"
                        placeholder="Share your thoughts on how this course can be improved..."
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                      />
                   </div>

                   <div className="pt-8 border-t border-slate-50 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                         <button 
                           onClick={() => setIsAnonymous(!isAnonymous)}
                           className={`w-12 h-6 rounded-full relative transition-all ${isAnonymous ? 'bg-emerald-500' : 'bg-slate-200'}`}
                         >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isAnonymous ? 'left-7' : 'left-1'}`} />
                         </button>
                         <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Anonymous Submission</span>
                      </div>

                      <button 
                        onClick={handleSubmit}
                        disabled={submitting || Object.values(ratings).some(v => v === 0)}
                        className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-lg flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
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
  );
}
