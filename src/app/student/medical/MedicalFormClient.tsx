"use client";

import { useState, useTransition } from "react";
import { submitMedicalForm } from "@/actions/medical";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MedicalFormClient({ initialData }: { initialData: any }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError("");
    setSuccess(false);

    const data = {
      kinName: formData.get("kinName"),
      kinPhone: formData.get("kinPhone"),
      kinAddress: formData.get("kinAddress"),
      bloodGroup: formData.get("bloodGroup"),
      genotype: formData.get("genotype"),
      commonIllness: formData.get("commonIllness"),
      illnessFrequency: formData.get("illnessFrequency"),
      lastOccurrence: formData.get("lastOccurrence"),
      illnessDescription: formData.get("illnessDescription"),
      weight: formData.get("weight"),
      height: formData.get("height"),
      bloodPressure: formData.get("bloodPressure"),
      allergies: formData.get("allergies"),
      medicalHistory: formData.get("medicalHistory"),
      currentMedications: formData.get("currentMedications"),
    };

    startTransition(async () => {
      const res = await submitMedicalForm(data);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/student/dashboard"); // Redirect to dashboard or next step
        }, 2000);
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
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Medical Form Submitted</h2>
        <p className="text-slate-500 max-w-md">
          Your health records have been updated successfully. You are being redirected to your dashboard...
        </p>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-12">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* SECTION: Next of Kin */}
      <div>
        <h3 className="bg-green-700 text-white font-bold py-2 px-4 rounded-t-md uppercase tracking-wide text-sm mb-4">
          Next of Kin Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-b-md border border-t-0 border-slate-200 shadow-sm">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Name</label>
            <input name="kinName" required defaultValue={initialData.kinName} className="w-full border-b-2 border-slate-200 focus:border-green-600 outline-none py-2 text-slate-800 transition-colors bg-transparent" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Phone</label>
            <input name="kinPhone" required defaultValue={initialData.kinPhone} className="w-full border-b-2 border-slate-200 focus:border-green-600 outline-none py-2 text-slate-800 transition-colors bg-transparent" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Address</label>
            <input name="kinAddress" required defaultValue={initialData.kinAddress} className="w-full border-b-2 border-slate-200 focus:border-green-600 outline-none py-2 text-slate-800 transition-colors bg-transparent" />
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
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Common Illness</label>
            <input name="commonIllness" defaultValue={initialData.commonIllness} className="w-full border-b-2 border-slate-200 focus:border-green-600 outline-none py-2 text-slate-800 transition-colors bg-transparent" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">How Often</label>
            <input name="illnessFrequency" defaultValue={initialData.illnessFrequency} className="w-full border-b-2 border-slate-200 focus:border-green-600 outline-none py-2 text-slate-800 transition-colors bg-transparent" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Last Occurrence</label>
            <input name="lastOccurrence" defaultValue={initialData.lastOccurrence} className="w-full border-b-2 border-slate-200 focus:border-green-600 outline-none py-2 text-slate-800 transition-colors bg-transparent" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Description</label>
            <input name="illnessDescription" defaultValue={initialData.illnessDescription} className="w-full border-b-2 border-slate-200 focus:border-green-600 outline-none py-2 text-slate-800 transition-colors bg-transparent" />
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
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Weight</label>
            <input name="weight" defaultValue={initialData.weight} placeholder="e.g. 65kg" className="w-full border-b-2 border-slate-200 focus:border-green-600 outline-none py-2 text-slate-800 transition-colors bg-transparent" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Height</label>
            <input name="height" defaultValue={initialData.height} placeholder="e.g. 1.75m" className="w-full border-b-2 border-slate-200 focus:border-green-600 outline-none py-2 text-slate-800 transition-colors bg-transparent" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Blood Pressure</label>
            <input name="bloodPressure" defaultValue={initialData.bloodPressure} placeholder="e.g. 120/80" className="w-full border-b-2 border-slate-200 focus:border-green-600 outline-none py-2 text-slate-800 transition-colors bg-transparent" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Blood Group</label>
            <select name="bloodGroup" defaultValue={initialData.bloodGroup} className="w-full border-b-2 border-slate-200 focus:border-green-600 outline-none py-2 text-slate-800 transition-colors bg-transparent">
              <option value="">Select...</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Genotype</label>
            <select name="genotype" defaultValue={initialData.genotype} className="w-full border-b-2 border-slate-200 focus:border-green-600 outline-none py-2 text-slate-800 transition-colors bg-transparent">
              <option value="">Select...</option>
              {['AA', 'AS', 'SS', 'AC', 'SC'].map(gt => <option key={gt} value={gt}>{gt}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Allergies</label>
            <input name="allergies" defaultValue={initialData.allergies} placeholder="None if not applicable" className="w-full border-b-2 border-slate-200 focus:border-green-600 outline-none py-2 text-slate-800 transition-colors bg-transparent" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Medical History</label>
            <input name="medicalHistory" defaultValue={initialData.medicalHistory} placeholder="Past surgeries, chronic conditions..." className="w-full border-b-2 border-slate-200 focus:border-green-600 outline-none py-2 text-slate-800 transition-colors bg-transparent" />
          </div>
          <div className="md:col-span-2 mt-4 pt-4 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Current Medications</label>
            <input name="currentMedications" defaultValue={initialData.currentMedications} placeholder="List any medications you are currently taking" className="w-full border-b-2 border-slate-200 focus:border-green-600 outline-none py-2 text-slate-800 transition-colors bg-transparent" />
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
          {isPending ? "Submitting..." : "Submit Medical Form"}
        </button>
      </div>
    </form>
  );
}
