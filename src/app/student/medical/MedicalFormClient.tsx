"use client";

import { useState, useTransition } from "react";
import { submitMedicalForm } from "@/actions/medical";
import { Loader2, CheckCircle, AlertCircle, Heart, Stethoscope, UserCheck, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MedicalFormClient({ initialData, onSuccess }: { initialData: any; onSuccess?: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError("");
    setSuccess(false);

    const data: Record<string, string> = {
      kinName: String(formData.get("kinName") ?? "").trim(),
      kinPhone: String(formData.get("kinPhone") ?? "").trim(),
      kinAddress: String(formData.get("kinAddress") ?? "").trim(),
      commonIllness: String(formData.get("commonIllness") ?? "").trim(),
      illnessFrequency: String(formData.get("illnessFrequency") ?? "").trim(),
      lastOccurrence: String(formData.get("lastOccurrence") ?? "").trim(),
      illnessDescription: String(formData.get("illnessDescription") ?? "").trim(),
      weight: String(formData.get("weight") ?? "").trim(),
      height: String(formData.get("height") ?? "").trim(),
      bloodPressure: String(formData.get("bloodPressure") ?? "").trim(),
      bloodGroup: String(formData.get("bloodGroup") ?? "").trim(),
      genotype: String(formData.get("genotype") ?? "").trim(),
      allergies: String(formData.get("allergies") ?? "").trim(),
      medicalHistory: String(formData.get("medicalHistory") ?? "").trim(),
      currentMedications: String(formData.get("currentMedications") ?? "").trim(),
    };

    const requiredLabels: Record<string, string> = {
      kinName: "Next of Kin Name",
      kinPhone: "Next of Kin Phone",
      kinAddress: "Next of Kin Address",
      commonIllness: "Common Illness",
      illnessFrequency: "How Often",
      lastOccurrence: "Last Occurrence",
      illnessDescription: "Illness Description",
      allergies: "Allergies",
      medicalHistory: "Medical History",
      currentMedications: "Current Medications",
    };

    for (const [k, label] of Object.entries(requiredLabels)) {
      if (!data[k]) {
        setError(`Please fill in all compulsory fields: ${label} (enter "None" or "N/A" if not applicable).`);
        return;
      }
    }

    startTransition(async () => {
      const res = await submitMedicalForm(data);
      if (res.success) {
        setSuccess(true);
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 800);
        } else {
          setTimeout(() => {
            router.refresh();
          }, 1000);
        }
      } else {
        setError(res.message);
      }
    });
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <CheckCircle className="w-10 h-10 text-emerald-700" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Medical Form Saved Successfully</h2>
        <p className="text-slate-600 max-w-md text-sm">
          Your health record has been saved. Loading your printable official medical form...
        </p>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-8">
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-950 font-medium flex items-start gap-3">
        <Stethoscope className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-emerald-900 mb-0.5">Official Student Medical Clearance Notice</p>
          <p>
            Please provide accurate medical history and emergency contacts below. Physical measurements (height, weight, blood pressure) can be filled by you or taken/verified by the Clinic Health Officer upon examination. If a condition or medication does not apply to you, enter <strong>&quot;None&quot;</strong> or <strong>&quot;N/A&quot;</strong>.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}

      {/* SECTION 1: Next of Kin Details */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-emerald-800 text-white font-bold py-3 px-6 uppercase tracking-wider text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-300" />
            <span>Next of Kin Details</span>
          </div>
          <span className="text-[10px] text-emerald-200 font-normal uppercase">Emergency Contact</span>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name <span className="text-rose-500">*</span></label>
            <input name="kinName" required defaultValue={initialData.kinName} placeholder="Full Name of Next of Kin / Guardian" className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none transition-all shadow-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number <span className="text-rose-500">*</span></label>
            <input name="kinPhone" required defaultValue={initialData.kinPhone} placeholder="e.g. 08012345678" className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none transition-all shadow-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Residential Address <span className="text-rose-500">*</span></label>
            <input name="kinAddress" required defaultValue={initialData.kinAddress} placeholder="Residential / Contact Address" className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none transition-all shadow-sm" />
          </div>
        </div>
      </div>

      {/* SECTION 2: Health History */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-emerald-800 text-white font-bold py-3 px-6 uppercase tracking-wider text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-emerald-300" />
            <span>Health History</span>
          </div>
          <span className="text-[10px] text-emerald-200 font-normal uppercase">Medical Background</span>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Common Illness Experienced <span className="text-rose-500">*</span></label>
            <input name="commonIllness" required defaultValue={initialData.commonIllness} placeholder="e.g. Malaria, Migraine, or None" className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none transition-all shadow-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">How Often / Frequency <span className="text-rose-500">*</span></label>
            <input name="illnessFrequency" required defaultValue={initialData.illnessFrequency} placeholder="e.g. Rarely, Once a year, or N/A" className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none transition-all shadow-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Last Occurrence <span className="text-rose-500">*</span></label>
            <input name="lastOccurrence" required defaultValue={initialData.lastOccurrence} placeholder="e.g. 4 months ago, or N/A" className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none transition-all shadow-sm" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Detailed Description & Chronic Conditions <span className="text-rose-500">*</span></label>
            <input name="illnessDescription" required defaultValue={initialData.illnessDescription} placeholder="Brief clinical description or enter 'None'" className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none transition-all shadow-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Known Allergies (Food / Drug) <span className="text-rose-500">*</span></label>
            <input name="allergies" required defaultValue={initialData.allergies} placeholder="e.g. Penicillin, Peanuts, or None" className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none transition-all shadow-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Medical History (Past Surgeries / Hospitalizations) <span className="text-rose-500">*</span></label>
            <input name="medicalHistory" required defaultValue={initialData.medicalHistory} placeholder="Past surgeries, major conditions, or 'None'" className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none transition-all shadow-sm" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Current Routine Medications <span className="text-rose-500">*</span></label>
            <input name="currentMedications" required defaultValue={initialData.currentMedications} placeholder="List regular prescription medications or enter 'None'" className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none transition-all shadow-sm" />
          </div>
        </div>
      </div>

      {/* SECTION 3: General Health Information */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-emerald-800 text-white font-bold py-3 px-6 uppercase tracking-wider text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-emerald-300" />
            <span>General Health Information</span>
          </div>
          <span className="text-[10px] text-emerald-200 font-normal uppercase">Clinical Measurements</span>
        </div>
        <div className="p-6 space-y-6 bg-slate-50/50">
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 text-xs text-emerald-900 font-medium">
            <strong>Clinical Measurement Notice:</strong> Height, weight, and blood pressure may be filled by you if known, or measured and certified directly by the Health Officer at the campus clinic.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Height (e.g. 175cm / 1.75m)</label>
              <input name="height" defaultValue={initialData.height} placeholder="e.g. 175 cm" className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none transition-all shadow-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Weight (e.g. 68kg)</label>
              <input name="weight" defaultValue={initialData.weight} placeholder="e.g. 68 kg" className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none transition-all shadow-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Blood Pressure (e.g. 120/80)</label>
              <input name="bloodPressure" defaultValue={initialData.bloodPressure} placeholder="e.g. 120/80" className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none transition-all shadow-sm" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Blood Group</label>
              <select name="bloodGroup" defaultValue={initialData.bloodGroup} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none transition-all shadow-sm">
                <option value="">Select Blood Group (or leave for clinic)...</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Genotype</label>
              <select name="genotype" defaultValue={initialData.genotype} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none transition-all shadow-sm">
                <option value="">Select Genotype (or leave for clinic)...</option>
                {['AA', 'AS', 'SS', 'AC', 'SC'].map(gt => <option key={gt} value={gt}>{gt}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {isPending ? "Submitting Medical Form..." : "Save & Preview Printable Form"}
        </button>
      </div>
    </form>
  );
}
