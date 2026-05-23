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
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100">
            <Bell size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Notification Studio</h1>
            <p className="text-slate-500 font-medium text-lg">Design premium academic broadcasts for parents and students</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Template Selector */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
           <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <Palette size={14} />
                 Select Channel
              </h2>
              <div className="space-y-2">
                 <button 
                   onClick={() => setActiveChannel('email')}
                   className={`w-full p-4 rounded-2xl flex items-center justify-between border transition-all ${
                     activeChannel === 'email' ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' : 'bg-white text-slate-600 border-slate-50 hover:border-indigo-100'
                   }`}
                 >
                    <div className="flex items-center gap-3">
                       <Mail size={20} />
                       <span className="font-bold">Premium Email</span>
                    </div>
                    {activeChannel === 'email' && <CheckCircle2 size={18} />}
                 </button>
                 <button 
                   onClick={() => setActiveChannel('whatsapp')}
                   className={`w-full p-4 rounded-2xl flex items-center justify-between border transition-all ${
                     activeChannel === 'whatsapp' ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100' : 'bg-white text-slate-600 border-slate-50 hover:border-emerald-100'
                   }`}
                 >
                    <div className="flex items-center gap-3">
                       <MessageSquare size={20} />
                       <span className="font-bold">WhatsApp Push</span>
                    </div>
                    {activeChannel === 'whatsapp' && <CheckCircle2 size={18} />}
                 </button>
              </div>
           </div>

           <div className="bg-slate-900 p-8 rounded-3xl text-white space-y-4">
              <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase tracking-widest text-xs">
                 <Layout size={14} />
                 Dynamic Placeholders
              </div>
              <div className="grid grid-cols-2 gap-2">
                 {['{{student_name}}', '{{cgpa}}', '{{term}}', '{{institution}}'].map(tag => (
                    <div key={tag} className="bg-white/10 px-2 py-1 rounded text-[10px] font-mono text-indigo-200">{tag}</div>
                 ))}
              </div>
           </div>
        </div>

        {/* Live Preview */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
           <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden min-h-[600px] flex flex-col">
              <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                 <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Eye size={20} className="text-indigo-600" />
                    Interactive Preview
                 </h2>
                 <div className="flex gap-2">
                    <div className="p-1.5 bg-white rounded border border-slate-200 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"><Monitor size={16} /></div>
                    <div className="p-1.5 bg-white rounded border border-slate-200 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"><Smartphone size={16} /></div>
                 </div>
              </div>

              <div className="flex-1 bg-slate-100/50 p-12 flex justify-center items-center">
                 {activeChannel === 'email' ? (
                    /* Premium Email Preview */
                    <div className="w-full max-w-lg bg-white shadow-2xl rounded-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
                       <div className="bg-indigo-600 p-8 text-center text-white space-y-2">
                          <h3 className="text-xs font-bold uppercase tracking-widest opacity-80">Official Academic Notification</h3>
                          <div className="text-2xl font-black">{institutionName}</div>
                       </div>
                       <div className="p-8 space-y-6">
                          <div className="space-y-2">
                             <h4 className="text-2xl font-bold text-slate-900">Academic Result Released</h4>
                             <p className="text-slate-500 font-medium">Dear Parent/Guardian, we are pleased to inform you that the academic results for the current session are now available.</p>
                          </div>
                          
                          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                             <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-indigo-600 shadow-sm"><User size={20} /></div>
                                   <span className="font-bold text-slate-700">{studentName}</span>
                                </div>
                                <div className="text-right">
                                   <div className="text-[10px] font-bold text-slate-400 uppercase">Performance Index</div>
                                   <div className="text-lg font-black text-indigo-600">{cgpa} CGPA</div>
                                </div>
                             </div>
                             <div className="h-px bg-slate-200" />
                             <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                                <span className="flex items-center gap-1"><BookOpen size={14} /> 12 Courses Registered</span>
                                <span className="flex items-center gap-1 text-emerald-600"><Trophy size={14} /> Outstanding Standing</span>
                             </div>
                          </div>

                          <button className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-100">
                             View Full Transcript
                             <ArrowRight size={18} />
                          </button>
                          
                          <p className="text-[10px] text-slate-400 text-center uppercase font-bold tracking-widest pt-4 border-t border-slate-50">
                             Secured by {institutionName} Portal Systems
                          </p>
                       </div>
                    </div>
                 ) : (
                    /* Premium WhatsApp Preview */
                    <div className="w-80 h-[500px] bg-[#E5DDD5] rounded-[40px] border-[8px] border-slate-900 relative shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-8">
                       <div className="bg-[#075E54] p-4 pt-8 text-white flex items-center gap-2">
                          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"><User size={16} /></div>
                          <div>
                             <div className="text-xs font-bold leading-none">{institutionName} Admin</div>
                             <div className="text-[8px] opacity-60">Online</div>
                          </div>
                       </div>
                       <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                          <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm space-y-2 max-w-[85%] relative">
                             <div className="text-sm font-bold text-emerald-700">Official Result Notice</div>
                             <p className="text-xs text-slate-800 leading-relaxed">
                                Hello! The result for **{studentName}** is now ready. 
                                \n\nPerformance Summary:
                                \n*GPA: {cgpa}*
                                \n*Status: Outstanding*
                                \n\nClick below to access the full portal:
                             </p>
                             <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100 flex items-center justify-between group cursor-pointer hover:bg-emerald-100 transition-colors">
                                <span className="text-[10px] font-bold text-emerald-700">Open Student Portal</span>
                                <ChevronRight size={12} className="text-emerald-400" />
                             </div>
                             <span className="absolute bottom-1 right-2 text-[8px] text-slate-400 italic">11:42 AM</span>
                          </div>
                       </div>
                       <div className="p-3 bg-white flex items-center gap-2">
                          <div className="flex-1 h-8 bg-slate-100 rounded-full" />
                          <div className="w-8 h-8 bg-[#075E54] rounded-full flex items-center justify-center text-white"><Send size={14} /></div>
                       </div>
                    </div>
                 )}
              </div>
              
              <div className="p-6 bg-white border-t border-slate-50 flex justify-between items-center">
                 <p className="text-xs text-slate-500 max-w-md font-medium">
                    This is a simulation of how results will appear to parents. Emails are optimized for all major clients (Outlook, Gmail) and WhatsApp messages follow institutional security protocols.
                 </p>
                 <button className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center gap-2">
                    <Save size={18} />
                    Deploy Templates
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
