"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getPublicFormTemplate } from "@/actions/admission_v2";
import {
  GraduationCap, Clock, CreditCard, BookOpen, AlertTriangle,
  CheckCircle2, ArrowRight, Hash, Loader2, X, ShieldCheck,
  FileText, Users, Sparkles, ChevronRight
} from "lucide-react";

type Mode = "full-time" | "part-time" | null;

export default function AdmissionInstructionsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const appId = searchParams.get("appId");

  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>(null);
  const [showJambModal, setShowJambModal] = useState(false);
  const [jambNumber, setJambNumber] = useState("");
  const [jambError, setJambError] = useState("");
  const [savingJamb, setSavingJamb] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [navError, setNavError] = useState("");
  const [proceeding, setProceeding] = useState(false);

  useEffect(() => {
    fetchTemplate();
  }, [slug]);

  async function fetchTemplate() {
    setLoading(true);
    try {
      const data = await getPublicFormTemplate(slug);
      if (data) setTemplate(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  function handleModeSelect(selected: Mode) {
    setNavError("");
    setMode(selected);
    if (selected === "full-time") {
      setShowJambModal(true);
    } else {
      // Part-time: no JAMB required, persist mode and proceed straight to payment/application
      persistModeAndProceed("part-time", null);
    }
  }

  async function handleJambSubmit(e: React.FormEvent) {
    e.preventDefault();
    setJambError("");
    const trimmed = jambNumber.trim().toUpperCase();

    // Basic JAMB reg number validation (e.g. 12345678AB or similar patterns)
    if (trimmed.length < 8) {
      setJambError("Please enter a valid JAMB Registration Number.");
      return;
    }

    setSavingJamb(true);
    const ok = await persistModeAndProceed("full-time", trimmed);
    setSavingJamb(false);
    if (ok) {
      setShowJambModal(false);
    } else {
      setJambError("Failed to save your JAMB number. Please try again.");
    }
  }

  async function persistModeAndProceed(selectedMode: Mode, jamb: string | null): Promise<boolean> {
    if (!appId) {
      // No valid application in progress — send them back to register first
      setNavError("Your application session could not be found. Please register again.");
      router.push(`/admission/${slug}`);
      return false;
    }

    setProceeding(true);
    try {
      const res = await fetch("/api/admission/update-jamb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: Number(appId), jambNumber: jamb, mode: selectedMode }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setNavError(data.error || "Failed to save your application mode. Please try again.");
        setProceeding(false);
        return false;
      }
    } catch (err) {
      setNavError("Network error — could not save your application mode. Please try again.");
      setProceeding(false);
      return false;
    }

    router.push(`/applicant/application/${appId}`);
    return true;
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
    </div>
  );

  const fee = template?.applicationFee ? parseFloat(template.applicationFee) : 0;
  const deadline = template?.endDate ? new Date(template.endDate).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }) : "N/A";

  const instructions = [
    {
      step: "01",
      title: "Choose Application Mode",
      desc: "Select Full-Time or Part-Time. Full-Time applicants must provide a valid JAMB Registration Number.",
      icon: <Users className="w-5 h-5" />,
      color: "text-emerald-400",
    },
    {
      step: "02",
      title: "Pay Application Fee",
      desc: `An application fee of ₦${fee.toLocaleString()} is required to proceed. Payment is processed securely via the portal.`,
      icon: <CreditCard className="w-5 h-5" />,
      color: "text-blue-400",
    },
    {
      step: "03",
      title: "Fill the Application Form",
      desc: "After payment, you'll be redirected to the full application form. All sections must be completed accurately.",
      icon: <FileText className="w-5 h-5" />,
      color: "text-violet-400",
    },
    {
      step: "04",
      title: "Upload Required Documents",
      desc: "Prepare passport photograph, O'Level results, birth certificate, and any other required documents in advance.",
      icon: <BookOpen className="w-5 h-5" />,
      color: "text-amber-400",
    },
    {
      step: "05",
      title: "Await Screening & Decision",
      desc: "After submission, you'll receive status updates. Keep your login credentials safe to track your application.",
      icon: <ShieldCheck className="w-5 h-5" />,
      color: "text-rose-400",
    },
  ];

  const notices = [
    "All information provided must be accurate. Falsification leads to automatic disqualification.",
    "Application fees are non-refundable once payment is confirmed.",
    "Full-Time applicants without a valid JAMB number cannot apply in Full-Time mode.",
    "Ensure your email address is active — all communications will be sent there.",
    "The institution reserves the right to verify all submitted documents.",
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      {/* Hero Header */}
      <div className="relative pt-20 pb-32 px-6 border-b border-slate-900 overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-emerald-600/10 rounded-full blur-[120px] -translate-y-1/2" />
          <div className="absolute bottom-0 right-1/3 w-[300px] h-[300px] bg-indigo-600/10 rounded-full blur-[120px]" />
        </div>
        <div className="max-w-4xl mx-auto relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-full">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
              {template?.name || "Admission"} — Instructions & Guidelines
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none">
            Before You <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-indigo-400">Apply</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs max-w-xl mx-auto leading-relaxed">
            Read the following instructions carefully. You must agree to the terms before proceeding with your application.
          </p>

          {/* Key Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mt-8">
            {[
              { label: "Application Fee", value: `₦${fee.toLocaleString()}`, icon: <CreditCard className="w-4 h-4" /> },
              { label: "Deadline", value: deadline, icon: <Clock className="w-4 h-4" /> },
              { label: "Intake Level", value: "Tertiary", icon: <GraduationCap className="w-4 h-4" /> },
            ].map(stat => (
              <div key={stat.label} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 text-emerald-400 mb-2">{stat.icon}</div>
                <p className="text-sm font-black text-white">{stat.value}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-10 pb-24 space-y-10">

        {/* Step-by-Step Instructions */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-[2rem] overflow-hidden backdrop-blur-sm">
          <div className="px-8 py-6 border-b border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-emerald-400" />
            </div>
            <h2 className="text-lg font-black italic uppercase tracking-tight">Application Process Overview</h2>
          </div>
          <div className="divide-y divide-slate-800/60">
            {instructions.map((item, i) => (
              <div key={i} className="flex gap-6 p-6 group hover:bg-slate-800/30 transition-colors">
                <div className={`w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 ${item.color} group-hover:scale-110 transition-transform`}>
                  {item.icon}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Step {item.step}</span>
                  </div>
                  <h3 className="font-black text-white text-sm mb-1">{item.title}</h3>
                  <p className="text-slate-400 text-xs font-bold leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Important Notices */}
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-[2rem] overflow-hidden">
          <div className="px-8 py-6 border-b border-amber-500/20 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-black italic uppercase tracking-tight text-amber-300">Important Notices</h2>
          </div>
          <div className="p-8 space-y-4">
            {notices.map((notice, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[9px] font-black text-amber-400">{i + 1}</span>
                </div>
                <p className="text-amber-200/80 text-xs font-bold leading-relaxed">{notice}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Agreement Checkbox */}
        <label className="flex items-start gap-4 cursor-pointer group">
          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${agreed ? "bg-emerald-500 border-emerald-500" : "border-slate-600 group-hover:border-emerald-500/50"}`}
            onClick={() => setAgreed(!agreed)}>
            {agreed && <CheckCircle2 className="w-4 h-4 text-white" />}
          </div>
          <p className="text-slate-400 text-sm font-bold leading-relaxed select-none">
            I have read and understood all the instructions above. I agree that all information I provide will be accurate and truthful, and that I meet the eligibility requirements for this admission programme.
          </p>
        </label>

        {/* Mode Selection */}
        {agreed && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <p className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Select Your Application Mode to Continue
            </p>
            {navError && (
              <div className="max-w-xl mx-auto p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl text-xs font-bold flex items-center gap-2 justify-center">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {navError}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full-Time */}
              <button
                onClick={() => handleModeSelect("full-time")}
                disabled={proceeding}
                className={`group relative text-left p-8 rounded-[2rem] border-2 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0
                  ${mode === "full-time" ? "border-emerald-500 bg-emerald-500/10" : "border-slate-800 bg-slate-900/60 hover:border-emerald-500/50"}`}
              >
                <div className="absolute top-6 right-6">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                    <GraduationCap className="w-4 h-4 text-emerald-400" />
                  </div>
                </div>
                <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[9px] font-black uppercase tracking-widest text-emerald-400 mb-4 inline-block">
                  Full-Time
                </span>
                <h3 className="text-2xl font-black italic uppercase tracking-tight text-white mb-3">Full-Time Programme</h3>
                <p className="text-slate-400 text-xs font-bold leading-relaxed mb-4">
                  Standard full-time academic programme. Requires a valid JAMB Registration Number for eligibility verification.
                </p>
                <div className="flex items-center gap-2 text-xs font-black text-emerald-400 uppercase tracking-wider">
                  <Hash className="w-3.5 h-3.5" /> JAMB Registration Number Required
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Click to proceed</span>
                  <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                </div>
              </button>

              {/* Part-Time */}
              <button
                onClick={() => handleModeSelect("part-time")}
                disabled={proceeding}
                className={`group relative text-left p-8 rounded-[2rem] border-2 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0
                  ${mode === "part-time" ? "border-indigo-500 bg-indigo-500/10" : "border-slate-800 bg-slate-900/60 hover:border-indigo-500/50"}`}
              >
                <div className="absolute top-6 right-6">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                    <Clock className="w-4 h-4 text-indigo-400" />
                  </div>
                </div>
                <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-4 inline-block">
                  Part-Time
                </span>
                <h3 className="text-2xl font-black italic uppercase tracking-tight text-white mb-3">Part-Time Programme</h3>
                <p className="text-slate-400 text-xs font-bold leading-relaxed mb-4">
                  Flexible part-time academic programme. No JAMB Registration Number required — proceed directly to payment and form filling.
                </p>
                <div className="flex items-center gap-2 text-xs font-black text-indigo-400 uppercase tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5" /> No JAMB Number Required
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Click to proceed</span>
                  {proceeding && mode === "part-time"
                    ? <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                    : <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />}
                </div>
              </button>
            </div>
          </div>
        )}

        {!agreed && (
          <div className="text-center py-6">
            <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">
              ↑ Please read and agree to the instructions above to continue
            </p>
          </div>
        )}
      </div>

      {/* JAMB Number Modal */}
      {showJambModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Full-Time Mode</span>
                <h2 className="text-2xl font-black italic uppercase tracking-tight text-white mt-1">JAMB Verification</h2>
              </div>
              <button onClick={() => { setShowJambModal(false); setMode(null); }}
                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 mb-6">
              <div className="flex gap-3">
                <Hash className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-black text-emerald-300 mb-1">Why is this required?</p>
                  <p className="text-xs text-slate-400 font-bold leading-relaxed">
                    Full-Time applicants must have sat for the UTME. Your JAMB Registration Number is used to verify your eligibility and match your exam record to this application.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleJambSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  JAMB Registration Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={jambNumber}
                  onChange={e => { setJambNumber(e.target.value.toUpperCase()); setJambError(""); }}
                  placeholder="e.g. 51234567AB"
                  maxLength={20}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 font-black text-lg text-white tracking-[0.1em] placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
                {jambError && (
                  <p className="text-rose-400 text-xs font-bold mt-2 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> {jambError}
                  </p>
                )}
                <p className="text-slate-600 text-[10px] font-bold mt-2 uppercase tracking-wide">
                  As printed on your JAMB examination slip
                </p>
              </div>

              <button
                type="submit"
                disabled={savingJamb || jambNumber.trim().length < 8}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-5 rounded-2xl uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {savingJamb
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : <><CheckCircle2 className="w-5 h-5" /> Verify &amp; Continue to Payment</>
                }
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => { setShowJambModal(false); setMode(null); }}
                className="text-[10px] font-black text-slate-500 hover:text-slate-300 uppercase tracking-widest transition-colors"
              >
                ← Go back and choose a different mode
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
