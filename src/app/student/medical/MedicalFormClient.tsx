"use client";

import { useState, useTransition } from "react";
import { submitMedicalForm } from "@/actions/medical";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
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
      bloodGroup: String(formData.get("bloodGroup") ?? "").trim(),
      genotype: String(formData.get("genotype") ?? "").trim(),
      commonIllness: String(formData.get("commonIllness") ?? "").trim(),
      illnessFrequency: String(formData.get("illnessFrequency") ?? "").trim(),
      lastOccurrence: String(formData.get("lastOccurrence") ?? "").trim(),
      illnessDescription: String(formData.get("illnessDescription") ?? "").trim(),
      weight: String(formData.get("weight") ?? "").trim(),
      height: String(formData.get("height") ?? "").trim(),
      bloodPressure: String(formData.get("bloodPressure") ?? "").trim(),
      allergies: String(formData.get("allergies") ?? "").trim(),
      medicalHistory: String(formData.get("medicalHistory") ?? "").trim(),
      currentMedications: String(formData.get("currentMedications") ?? "").trim(),
    };

    const labels: Record<string, string> = {
      kinName: "Next of Kin Name",
      kinPhone: "Next of Kin Phone",
      kinAddress: "Next of Kin Address",
      commonIllness: "Common Illness",
      illnessFrequency: "How Often",
      lastOccurrence: "Last Occurrence",
      illnessDescription: "Illness Description",
      weight: "Weight",
      height: "Height",
      bloodPressure: "Blood Pressure",
      bloodGroup: "Blood Group",
      genotype: "Genotype",
      allergies: "Allergies",
      medicalHistory: "Medical History",
      currentMedications: "Current Medications",
    };

    for (const [k, label] of Object.entries(labels)) {
      if (!data[k]) {
        setError(`Please fill in all fields before submitting. Missing: ${label} (enter "None" or "N/A" if not applicable).`);
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
          }, 900);
        } else {
          setTimeout(() => {
            router.refresh();
          }, 1200);
        }
      } else {
        setError(res.message);
      }
    });
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Medical Form Saved Successfully</h2>
        <p className="text-slate-500 max-w-md">
          Your health records have been saved. Preparing your printable medical form...
        </p>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-10">
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 font-medium">
        All fields Marked with <span className="text-rose-600 font-bold">*</span> are compulsory. If a medical condition, allergy, or medication does not apply to you, please enter <strong>&quot;None&quot;</strong> or <strong>&quot;N/A&quot;</strong>.
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}

      {/* SECTION: Next of Kin */}
      <div>
        <h3 className="bg-green-700 text-white font-bold py-2 px-4 rounded-t-md uppercase tracking-wide text-sm mb-4">
          Next of Kin Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-b-md border border-t-0 border-slate-200 shadow-sm">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Full Name <span className="text-rose-500">*</span></label>
            <input name="kinName" required defaultValue={initialData.kinName} placeholder="Full Name of Next of Kin" className="w-full border-b-2 border-slate-200 focus:border-green-600 outline-none py-2 text-slate-800 transition-colors bg-transparent" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Phone Number <span className="text-rose-500">*</span></label>
            <input name="kinPhone" required defaultValue={initialData.kinPhone} placeholder="e.g. 08012345678" className="w-full border-b-2 border-slate-200 focus:border-green-600 outline-none py-2 text-slate-800 transition-colors bg-transparent" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Residential Address <span className="text-rose-500">*</span></label>
            <input name="kinAddress" required defaultValue={initialData.kinAddress} placeholder="Full Residential Address" className="w-full border-b-2 border-slate-200 focus:border-green-600 outline-none py-2 text-slate-800 transition-colors bg-transparent" />
          </div>
        </div>
      </div>

      {/* SECTION A: Health History */}
      <div>
        <h3 className="bg-green-700 text-white font-bold py-2 px-4 rounded-t-md uppercase tracking-wide text-sm mb-4">
          Health History (Section A)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-b-md border border-t-0 border-slate-200 shadow-sm">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Common Illness <span className="text-rose-500">*</span></label>
            <input name="commonIllness" required defaultValue={initialData.commonIllness} placeholder="e.g. Malaria, Headache, or None" className="w-full border-b-2 border-slate-200 focus:border-green-600 outline-none py-2 text-slate-800 transition-colors bg-transparent" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">How Often <span className="text-rose-500">*</span></label>
            <input name="illnessFrequency" required defaultValue={initialData.illnessFrequency} placeholder="e.g. Rarely, Occasionally, or N/A" className="w-full border-b-2 border-slate-200 focus:border-green-600 outline-none py-2 text-slate-800 transition-colors bg-transparent" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Last Occurrence <span className="text-rose-500">*</span></label>
            <input name="lastOccurrence" required defaultValue={initialData.lastOccurrence} placeholder="e.g. 6 months ago, or N/A" className="w-full border-b-2 border-slate-200 focus:border-green-600 outline-none py-2 text-slate-800 transition-colors bg-transparent" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Description <span className="text-rose-500">*</span></label>
            <input name="illnessDescription" required defaultValue={initialData.illnessDescription} placeholder="Brief description or None" className="w-full border-b-2 border-slate-200 focus:border-green-600 outline-none py-2 text-slate-800 transition-colors bg-transparent" />
          </div>
        </div>
      </div>

      {/* SECTION B: General Health Information */}
      <div>
        <h3 className="bg-green-700 text-white font-bold py-2 px-4 rounded-t-md uppercase tracking-wide text-sm mb-4">
          General Health Information (Section B)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-b-md border border-t-0 border-slate-200 shadow-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Weight <span className="text-rose-500">*</span></label>
            <input name="weight" required defaultValue={initialData.weight} placeholder="e.g. 65kg" className="w-full border-b-2 border-slate-200 focus:border-green-600 outline-none py-2 text-slate-800 transition-colors bg-transparent" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Height <span className="text-rose-500">*</span></label>
            <input name="height" required defaultValue={initialData.height} placeholder="e.g. 1.75m" className="w-full border-b-2 border-slate-200 focus:border-green-600 outline-none py-2 text-slate-800 transition-colors bg-transparent" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Blood Pressure <span className="text-rose-500">*</span></label>
            <input name="bloodPressure" required defaultValue={initialData.bloodPressure} placeholder="e.g. 120/80" className="w-full border-b-2 border-slate-200 focus:border-green-600 outline-none py-2 text-slate-800 transition-colors bg-transparent" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Blood Group <span className="text-rose-500">*</span></label>
            <select name="bloodGroup" required defaultValue={initialData.bloodGroup} className="w-full border-b-2 border-slate-200 focus:border-green-600 outline-none py-2 text-slate-800 transition-colors bg-transparent">
              <option value="">Select Blood Group...</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Genotype <span className="text-rose-500">*</span></label>
            <select name="genotype" required defaultValue={initialData.genotype} className="w-full border-b-2 border-slate-200 focus:border-green-600 outline-none py-2 text-slate-800 transition-colors bg-transparent">
              <option value="">Select Genotype...</option>
              {['AA', 'AS', 'SS', 'AC', 'SC'].map(gt => <option key={gt} value={gt}>{gt}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Allergies <span className="text-rose-500">*</span></label>
            <input name="allergies" required defaultValue={initialData.allergies} placeholder="Enter 'None' if not applicable" className="w-full border-b-2 border-slate-200 focus:border-green-600 outline-none py-2 text-slate-800 transition-colors bg-transparent" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Medical History <span className="text-rose-500">*</span></label>
            <input name="medicalHistory" required defaultValue={initialData.medicalHistory} placeholder="Past surgeries, chronic conditions, or 'None'" className="w-full border-b-2 border-slate-200 focus:border-green-600 outline-none py-2 text-slate-800 transition-colors bg-transparent" />
          </div>
          <div className="md:col-span-2 mt-4 pt-4 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Current Medications <span className="text-rose-500">*</span></label>
            <input name="currentMedications" required defaultValue={initialData.currentMedications} placeholder="List current medications or enter 'None'" className="w-full border-b-2 border-slate-200 focus:border-green-600 outline-none py-2 text-slate-800 transition-colors bg-transparent" />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="bg-green-700 hover:bg-green-800 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isPending && <Loader2 className="w-5 h-5 animate-spin" />}
          {isPending ? "Saving..." : "Save & View Printable Medical Form"}
        </button>
      </div>
    </form>
  );
}
