import { getAdmittedRegister } from "@/actions/admission_v2";
import AdmissionRegisterClient from "@/components/admission/register/RegisterClient";
import { FileText, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdmissionRegisterPage() {
  const data = await getAdmittedRegister();

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Header */}
      <div className="bg-slate-900 rounded-b-3xl">
        <div className="max-w-[1600px] mx-auto px-6 py-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-black text-white uppercase tracking-tight italic">
                Admission Register
              </h1>
              <p className="text-slate-400 text-sm font-medium mt-1">
                Manage admitted and pending candidates — offer admission or record rejection reason
              </p>
            </div>
          </div>

          {/* Summary counts */}
          <div className="grid grid-cols-3 gap-4 mt-8 max-w-lg">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
              <p className="text-3xl font-black text-emerald-400">{data.totalAdmitted}</p>
              <p className="text-[10px] font-black uppercase text-emerald-400/70 tracking-widest">Admitted</p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-center">
              <p className="text-3xl font-black text-amber-400">{data.totalPending}</p>
              <p className="text-[10px] font-black uppercase text-amber-400/70 tracking-widest">Pending</p>
            </div>
            <div className="bg-slate-500/10 border border-slate-500/20 rounded-2xl p-4 text-center">
              <p className="text-3xl font-black text-slate-400">{data.totalAdmitted + data.totalPending}</p>
              <p className="text-[10px] font-black uppercase text-slate-400/70 tracking-widest">Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Client component with filters + table */}
      <AdmissionRegisterClient initialData={data} />
    </div>
  );
}
