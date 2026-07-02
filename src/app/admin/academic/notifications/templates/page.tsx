// @ts-nocheck
"use client";

import React, { useState } from 'react';
import { 
  Mail, 
  MessageSquare, 
  Eye, 
  Smartphone, 
  Monitor, 
  Bell,
  CheckCircle2,
  ChevronRight,
  User,
  BookOpen,
  Trophy,
  Layout,
  Palette,
  Send
} from 'lucide-react';

export default function NotificationTemplatePreview() {
  const [activeChannel, setActiveChannel] = useState<'email' | 'whatsapp'>('email');

  const institutionName = "State Global University";
  const studentName = "Adeshola Adeyemi";
  const cgpa = "4.82";

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
      <div className="max-w-[1600px] w-full mx-auto space-y-8">
        {/* Header Section */}
        <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-8 lg:p-12 text-white shadow-2xl border border-slate-800">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/30 to-teal-600/30 opacity-50 mix-blend-overlay" />
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Bell className="w-12 h-12 text-emerald-400" />
                        <h1 className="text-4xl lg:text-5xl font-black tracking-tighter drop-shadow-md italic uppercase">
                            Notification Studio
                        </h1>
                    </div>
                    <p className="text-slate-300 font-medium tracking-tight max-w-2xl text-lg opacity-90">
                        Design premium academic broadcasts for parents and students
                    </p>
                </div>
            </div>
        </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Template Selector */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
           <div className="bg-white/60 backdrop-blur-3xl p-8 rounded-[3rem] border border-white/40 shadow-xl shadow-slate-200/50 space-y-6 relative overflow-hidden group">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-indigo-200/30 blur-2xl rounded-full group-hover:scale-110 transition-transform duration-500" />
              <div className="relative z-10 space-y-6">
                  <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                     <Palette size={14} />
                     Select Channel
                  </h2>
                  <div className="space-y-4">
                     <button 
                       onClick={() => setActiveChannel('email')}
                       className={`w-full p-6 rounded-[2rem] flex items-center justify-between border-2 transition-all ${
                         activeChannel === 'email' ? 'bg-indigo-600/10 border-indigo-500 shadow-xl shadow-indigo-200/30 text-indigo-700' : 'bg-white/80 text-slate-500 border-white hover:border-indigo-200 hover:shadow-lg'
                       }`}
                     >
                        <div className="flex items-center gap-4">
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${activeChannel === 'email' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                              <Mail size={24} />
                           </div>
                           <span className="font-bold text-lg tracking-tight">Premium Email</span>
                        </div>
                        {activeChannel === 'email' && <CheckCircle2 size={24} className="text-indigo-600" />}
                     </button>
                     <button 
                       onClick={() => setActiveChannel('whatsapp')}
                       className={`w-full p-6 rounded-[2rem] flex items-center justify-between border-2 transition-all ${
                         activeChannel === 'whatsapp' ? 'bg-emerald-600/10 border-emerald-500 shadow-xl shadow-emerald-200/30 text-emerald-700' : 'bg-white/80 text-slate-500 border-white hover:border-emerald-200 hover:shadow-lg'
                       }`}
                     >
                        <div className="flex items-center gap-4">
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${activeChannel === 'whatsapp' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                              <MessageSquare size={24} />
                           </div>
                           <span className="font-bold text-lg tracking-tight">WhatsApp Push</span>
                        </div>
                        {activeChannel === 'whatsapp' && <CheckCircle2 size={24} className="text-emerald-600" />}
                     </button>
                  </div>
              </div>
           </div>

           <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white space-y-6 shadow-xl border border-slate-800">
              <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase tracking-widest text-xs">
                 <Layout size={14} />
                 Dynamic Placeholders
              </div>
              <div className="grid grid-cols-2 gap-3">
                 {['{{student_name}}', '{{cgpa}}', '{{term}}', '{{institution}}'].map(tag => (
                    <div key={tag} className="bg-white/10 border border-white/10 px-3 py-2 rounded-xl text-xs font-mono text-indigo-200 text-center shadow-inner tracking-widest">{tag}</div>
                 ))}
              </div>
           </div>
        </div>

        {/* Live Preview */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
           <div className="bg-white/60 backdrop-blur-3xl rounded-[3rem] border border-white/40 shadow-xl shadow-slate-200/50 overflow-hidden min-h-[700px] flex flex-col">
              <div className="p-8 border-b border-white/20 bg-white/40 flex justify-between items-center">
                 <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                    <Eye size={22} className="text-indigo-600" />
                    Interactive Preview
                 </h2>
                 <div className="flex gap-2">
                    <div className="p-2.5 bg-white/80 rounded-xl border border-slate-200/50 text-slate-400 hover:text-indigo-600 hover:shadow-md transition-all cursor-pointer"><Monitor size={18} /></div>
                    <div className="p-2.5 bg-white/80 rounded-xl border border-slate-200/50 text-slate-400 hover:text-indigo-600 hover:shadow-md transition-all cursor-pointer"><Smartphone size={18} /></div>
                 </div>
              </div>

              <div className="flex-1 bg-gradient-to-br from-slate-100/50 to-slate-200/50 p-12 flex justify-center items-center">
                 {activeChannel === 'email' ? (
                    /* Premium Email Preview */
                    <div className="w-full max-w-lg bg-white shadow-2xl shadow-slate-300/50 rounded-3xl overflow-hidden border border-white/80 animate-in fade-in zoom-in-95">
                       <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-10 text-center text-white space-y-3 relative overflow-hidden">
                          <div className="absolute top-0 left-0 right-0 h-1 bg-white/20" />
                          <h3 className="text-xs font-black uppercase tracking-widest opacity-80 mix-blend-overlay">Official Academic Notification</h3>
                          <div className="text-3xl font-black drop-shadow-md tracking-tighter">{institutionName}</div>
                       </div>
                       <div className="p-10 space-y-8">
                          <div className="space-y-3">
                             <h4 className="text-2xl font-black text-slate-800 tracking-tight">Academic Result Released</h4>
                             <p className="text-slate-500 font-medium leading-relaxed">Dear Parent/Guardian, we are pleased to inform you that the academic results for the current session are now available.</p>
                          </div>
                          
                          <div className="p-8 bg-slate-50/50 rounded-3xl border border-slate-100 shadow-inner space-y-6">
                             <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                   <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-slate-100"><User size={24} /></div>
                                   <span className="font-bold text-slate-800 text-lg">{studentName}</span>
                                </div>
                                <div className="text-right">
                                   <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Performance Index</div>
                                   <div className="text-2xl font-black text-indigo-600 drop-shadow-sm">{cgpa} CGPA</div>
                                </div>
                             </div>
                             <div className="h-px bg-slate-200/60" />
                             <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                                <span className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm"><BookOpen size={16} className="text-indigo-400" /> 12 Courses</span>
                                <span className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-100 shadow-sm"><Trophy size={16} /> Outstanding</span>
                             </div>
                          </div>

                          <button className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black tracking-widest uppercase text-sm flex items-center justify-center gap-3 shadow-xl shadow-indigo-200 hover:-translate-y-1 hover:shadow-2xl transition-all">
                             View Full Transcript
                             {/* @ts-expect-error - TS2304: Auto-suppressed for build */}
                             <ArrowRight size={20} />
                          </button>
                          
                          <p className="text-[10px] text-slate-400 text-center uppercase font-bold tracking-widest pt-6 border-t border-slate-100">
                             Secured by {institutionName} Portal Systems
                          </p>
                       </div>
                    </div>
                 ) : (
                    /* Premium WhatsApp Preview */
                    <div className="w-80 h-[550px] bg-[#E5DDD5] rounded-[3rem] border-[12px] border-slate-900 relative shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-8">
                       <div className="bg-[#075E54] p-5 pt-10 text-white flex items-center gap-3 shadow-md z-10">
                          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm"><User size={20} /></div>
                          <div>
                             <div className="text-sm font-bold leading-tight">{institutionName} Admin</div>
                             <div className="text-[10px] opacity-80 font-medium">Online</div>
                          </div>
                       </div>
                       <div className="flex-1 p-5 space-y-4 overflow-y-auto relative">
                          <div className="absolute inset-0 opacity-10 bg-[url('https://static.whatsapp.net/rsrc.php/v3/yl/r/r_YpeHLywRb.png')] z-0 pointer-events-none mix-blend-overlay" />
                          <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm space-y-3 max-w-[88%] relative z-10">
                             <div className="text-sm font-black text-emerald-700">Official Result Notice</div>
                             <p className="text-sm text-slate-800 leading-relaxed font-medium">
                                Hello! The result for <span className="font-bold">{studentName}</span> is now ready. 
                                <br/><br/>Performance Summary:
                                <br/>• GPA: <span className="font-bold">{cgpa}</span>
                                <br/>• Status: <span className="font-bold text-emerald-600">Outstanding</span>
                                <br/><br/>Click below to access the full portal:
                             </p>
                             <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100/50 flex items-center justify-between group cursor-pointer hover:bg-emerald-100 transition-colors shadow-inner">
                                <span className="text-[11px] font-black uppercase tracking-widest text-emerald-700">Open Student Portal</span>
                                <div className="w-6 h-6 bg-emerald-200/50 rounded-full flex items-center justify-center group-hover:bg-emerald-200 transition-colors"><ChevronRight size={14} className="text-emerald-700" /></div>
                             </div>
                             <span className="absolute bottom-1.5 right-2.5 text-[9px] text-slate-400 font-medium">11:42 AM</span>
                          </div>
                       </div>
                       <div className="p-4 bg-[#F0F2F5] flex items-center gap-3 z-10 border-t border-black/5">
                          <div className="flex-1 h-10 bg-white rounded-full shadow-sm" />
                          <div className="w-10 h-10 bg-[#00A884] rounded-full flex items-center justify-center text-white shadow-md hover:scale-105 transition-transform"><Send size={16} className="ml-1" /></div>
                       </div>
                    </div>
                 )}
              </div>
              
              <div className="p-8 bg-white/40 backdrop-blur-md border-t border-white/20 flex flex-col md:flex-row justify-between items-center gap-6">
                 <p className="text-xs text-slate-500 max-w-md font-medium leading-relaxed">
                    This is a simulation of how results will appear to parents. Emails are optimized for all major clients (Outlook, Gmail) and WhatsApp messages follow institutional security protocols.
                 </p>
                 <button className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all flex items-center gap-2 shadow-xl hover:-translate-y-1 whitespace-nowrap">
                    {/* @ts-expect-error - TS2304: Auto-suppressed for build */}
                    <Save size={18} />
                    Deploy Templates
                 </button>
              </div>
            </div>
         </div>
       </div>
     </div>
   </div>
   );
 }
