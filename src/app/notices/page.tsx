"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar, GraduationCap, Info, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";

export default function NoticesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="overflow-hidden border-0 shadow-xl rounded-3xl">
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-8 text-white text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4">
              <Calendar className="w-4 h-4" /> Official Notice
            </div>
            <h1 className="text-2xl md:text-3xl font-black uppercase italic leading-tight">
              Notice of Resumption for<br />2026/2027 Academic Session
            </h1>
            <p className="mt-3 text-indigo-100 font-medium">
              Monday, 28th September, 2026 — All Staff & Students
            </p>
          </div>

          <CardContent className="p-8 space-y-8">
            <div className="prose prose-slate max-w-none">
              <p className="text-slate-700 leading-relaxed">
                This is to inform all Staff and Students that the resumption date for the <strong>2026/2027 Academic Session</strong> is on <strong>Monday, 28th September, 2026</strong>.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-indigo-600" /> Key Dates
              </h3>
              <div className="grid gap-3">
                <div className="flex gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                  <GraduationCap className="w-5 h-5 text-indigo-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-black text-slate-900">New Intakes — ND1 & HND1 Registration</p>
                    <p className="text-xs font-bold text-slate-600">28th September to 13th October, 2026</p>
                  </div>
                </div>
                <div className="flex gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-black text-slate-900">HND2 Returning Students — Resumption</p>
                    <p className="text-xs font-bold text-slate-600">13th October, 2026</p>
                  </div>
                </div>
                <div className="flex gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                  <Info className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-black text-slate-900">Lectures Commence</p>
                    <p className="text-xs font-bold text-slate-600">13th October, 2026</p>
                  </div>
                </div>
                <div className="flex gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <Calendar className="w-5 h-5 text-slate-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-black text-slate-900">ND2 Resumption</p>
                    <p className="text-xs font-bold text-slate-600">6th November, 2026</p>
                  </div>
                </div>
              </div>
              <p className="text-xs font-bold text-slate-500 mt-3">All students should complete their registration process within the stated dates.</p>
            </div>

            <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-widest text-amber-300">Note</h4>
              <ul className="space-y-2 text-sm leading-relaxed text-slate-200">
                <li>• New students/intake are required to check the portal or email for their admission notification and are required to commence the process of making payment of all fees as soon as notification of admission notice is received.</li>
                <li>• Applicants yet to receive admission should check their portal for updates or visit the school for further instruction.</li>
              </ul>
            </div>

            <div className="text-center pt-2">
              <p className="text-sm font-black uppercase tracking-widest text-slate-700">Signed.</p>
              <p className="text-sm font-bold text-slate-600">The Management</p>
              <p className="text-xs text-slate-400 mt-1">Federal School of Statistics, Ibadan</p>
            </div>

            <div className="flex gap-3 justify-center pt-2">
              <Link href="/login" className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest">
                Go to Portal Login
              </Link>
              <Link href="/" className="px-6 py-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-black text-xs uppercase tracking-widest">
                Back to Home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
