"use client";

import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  ShieldCheck, 
  Printer, 
  Loader2, 
  CheckCircle2, 
  ExternalLink,
  Lock
} from 'lucide-react';
import { generateOfficialResultPdfAction } from '@/actions/academic-documents';

export default function ResultDownloadCenter({ studentId, sessionId, semester }: { studentId: number, sessionId: number, semester?: '1' | '2' }) {
  const [downloading, setDownloading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    setSuccess(false);
    
    // 1. Trigger server logging and generation
    const res = await generateOfficialResultPdfAction({ studentId, sessionId, semester });
    
    // Simulate generation time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setDownloading(false);
    if (res.success) {
        setSuccess(true);
        // In a real app, window.open('/api/pdf-generator?id=' + res.pdfId)
        setTimeout(() => setSuccess(false), 5000);
    }
  }

  return (
    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-xl space-y-6 relative overflow-hidden group">
      <div className="absolute -right-8 -top-8 w-32 h-32 bg-indigo-50 rounded-full group-hover:scale-110 transition-transform duration-500" />
      
      <div className="relative z-10 space-y-6">
        <div className="flex justify-between items-start">
          <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100">
            <FileText size={28} />
          </div>
          <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
            <ShieldCheck size={12} />
            Verified Document
          </div>
        </div>

        <div>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Official Result PDF</h3>
          <p className="text-slate-500 font-medium text-sm mt-1">Download your secure, digitally signed result slip for this semester.</p>
        </div>

        <div className="space-y-3">
          <button 
            onClick={handleDownload}
            disabled={downloading}
            className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg ${
              success ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'
            } ${downloading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {downloading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Generating Secure PDF...
              </>
            ) : success ? (
              <>
                <CheckCircle2 size={20} />
                Download Ready
              </>
            ) : (
              <>
                <Download size={20} />
                Download Official Copy
              </>
            )}
          </button>
          
          <button className="w-full py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all">
            <Printer size={18} />
            Print Preview
          </button>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
           <Lock size={16} className="text-slate-400 mt-0.5" />
           <p className="text-[10px] text-slate-400 leading-relaxed font-medium uppercase tracking-tight">
             This document contains a unique QR code for verification by third parties. Each download is logged in the institutional audit trail.
           </p>
        </div>
      </div>
    </div>
  );
}
