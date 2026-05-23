"use client";

import React, { useState } from 'react';
import { 
  FileText, 
  Send, 
  Download, 
  User, 
  CheckCircle2, 
  Loader2, 
  ShieldCheck, 
  Printer,
  ChevronRight,
  Mail,
  Smartphone,
  Eye,
  Layout,
  Type
} from 'lucide-react';
import { generateAdmissionLetterAction } from '@/actions/result-management';

export default function AdmissionLetterPreview({ applicationId }: { applicationId: number }) {
  const [loading, setLoading] = useState(false);
  const [letterData, setLetterData] = useState<any>(null);
  const [dispatching, setDispatching] = useState(false);
  const [dispatched, setDispatched] = useState(false);

  const handlePreview = async () => {
    setLoading(true);
    const res = await generateAdmissionLetterAction(applicationId);
    if (res.success) setLetterData(res.data);
    setLoading(false);
  };

  const handleDispatch = async () => {
    setDispatching(true);
    // Simulate multi-channel dispatch
    await new Promise(resolve => setTimeout(resolve, 2000));
    setDispatching(false);
    setDispatched(true);
  };

  return (
    <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl overflow-hidden flex flex-col h-[800px]">
       {/* Toolbar */}
       <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
                <FileText size={24} />
             </div>
             <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Admission Letter Generator</h2>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Candidate Onboarding Engine</p>
             </div>
          </div>
          <div className="flex gap-3">
             {!letterData ? (
                <button 
                  onClick={handlePreview}
                  disabled={loading}
                  className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                   {loading ? <Loader2 size={20} className="animate-spin" /> : <Eye size={20} />}
                   Generate Preview
                </button>
             ) : (
                <>
                   <button className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm">
                      <Download size={20} />
                   </button>
                   <button className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm">
                      <Printer size={20} />
                   </button>
                   <button 
                      onClick={handleDispatch}
                      disabled={dispatching || dispatched}
                      className={`px-8 py-3 rounded-2xl font-black flex items-center gap-2 transition-all shadow-lg ${
                        dispatched ? 'bg-emerald-600 text-white shadow-emerald-100' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200'
                      }`}
                   >
                      {dispatching ? <Loader2 size={20} className="animate-spin" /> : dispatched ? <CheckCircle2 size={20} /> : <Send size={20} />}
                      {dispatched ? 'Dispatched' : 'Dispatch to Candidate'}
                   </button>
                </>
             )}
          </div>
       </div>

       {/* Letter Canvas */}
       <div className="flex-1 bg-slate-200/50 p-12 overflow-y-auto flex justify-center custom-scrollbar">
          {!letterData ? (
             <div className="text-center space-y-6 max-w-md my-auto opacity-40">
                <div className="w-24 h-24 bg-white rounded-[32px] flex items-center justify-center mx-auto text-slate-300">
                   <Layout size={48} />
                </div>
                <div className="space-y-2">
                   <h3 className="text-2xl font-bold text-slate-900">Ready for Synthesis</h3>
                   <p className="text-sm font-medium text-slate-500">Click generate to merge candidate credentials with the official institutional admission template.</p>
                </div>
             </div>
          ) : (
             <div className="w-full max-w-[800px] bg-white shadow-2xl p-16 animate-in slide-in-from-bottom-8 duration-700 relative">
                {/* Official Stamp Overlay Placeholder */}
                <div className="absolute right-20 bottom-40 w-32 h-32 border-4 border-emerald-500/20 rounded-full flex items-center justify-center rotate-12">
                   <div className="text-[10px] font-black text-emerald-500/20 text-center uppercase tracking-tighter">
                      Digitally Verified<br/>Academic Records
                   </div>
                </div>

                <style dangerouslySetInnerHTML={{ __html: letterData.css }} />
                <div dangerouslySetInnerHTML={{ __html: letterData.html }} />
                
                <div className="mt-20 pt-10 border-t border-slate-100 flex justify-between items-end">
                   <div className="space-y-4">
                      <div className="w-32 h-12 bg-slate-100 rounded flex items-center justify-center text-[10px] font-mono text-slate-400 italic">
                         Digital Signature
                      </div>
                      <div>
                         <div className="font-bold text-slate-900 text-sm">Registrar, State Global University</div>
                         <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Office of Admissions</div>
                      </div>
                   </div>
                   <div className="text-right space-y-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Document Integrity</div>
                      <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-black border border-indigo-100">
                         VERIFIED-SGU-{applicationId}
                      </div>
                   </div>
                </div>
             </div>
          )}
       </div>

       {/* Notification Bar */}
       {letterData && (
          <div className="p-6 bg-white border-t border-slate-50 flex items-center justify-between">
             <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                   <Mail size={16} className="text-indigo-600" />
                   Email: {dispatched ? 'Sent' : 'Ready'}
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                   <Smartphone size={16} className="text-emerald-600" />
                   WhatsApp: {dispatched ? 'Sent' : 'Ready'}
                </div>
             </div>
             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-500" />
                End-to-End Encrypted Delivery
             </div>
          </div>
       )}
    </div>
  );
}
