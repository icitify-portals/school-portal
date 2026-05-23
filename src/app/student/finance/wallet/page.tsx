"use client";

import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  History, 
  Plus, 
  CreditCard, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  RefreshCcw,
  Clock,
  ArrowRight,
  TrendingUp,
  Receipt
} from 'lucide-react';
import { getStudentWalletStatusAction, simulateTopUpAction } from '@/actions/wallet-actions';

export default function StudentWalletPortal() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toppingUp, setToppingUp] = useState(false);

  // Configuration
  const studentId = 1;

  useEffect(() => {
    loadWallet();
  }, []);

  async function loadWallet() {
    setLoading(true);
    const res = await getStudentWalletStatusAction(studentId);
    if (res.success) setData(res);
    setLoading(false);
  }

  const handleTopUp = async () => {
    const amount = 5000; // Simulated amount
    setToppingUp(true);
    const res = await simulateTopUpAction(studentId, amount);
    if (res.success) await loadWallet();
    setToppingUp(false);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100">
            <Wallet size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Institutional Digital Wallet</h1>
            <p className="text-slate-500 font-medium text-lg">Manage your academic finances and online payments</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl border border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-widest">
           <ShieldCheck size={16} className="text-emerald-500" />
           Secure Financial Gateway
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Balance Card */}
        <div className="col-span-12 lg:col-span-5">
           <div className="bg-indigo-600 rounded-[40px] p-10 text-white space-y-10 shadow-2xl shadow-indigo-200 relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
              <div className="flex justify-between items-start relative z-10">
                 <div className="space-y-1">
                    <div className="text-xs font-bold text-indigo-200 uppercase tracking-widest">Available Balance</div>
                    <div className="text-5xl font-black">₦{parseFloat(data?.balance || "0").toLocaleString()}</div>
                 </div>
                 <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                    <TrendingUp size={24} />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4 relative z-10">
                 <button 
                   onClick={handleTopUp}
                   disabled={toppingUp}
                   className="bg-white text-indigo-600 px-6 py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-indigo-50 transition-all shadow-xl"
                 >
                    {toppingUp ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
                    Top-up Wallet
                 </button>
                 <button className="bg-white/10 text-white border border-white/20 px-6 py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-white/20 transition-all">
                    <CreditCard size={20} />
                    View Cards
                 </button>
              </div>

              <div className="pt-6 border-t border-white/10 flex justify-between items-center relative z-10">
                 <div className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Verified Student Account</div>
                 <div className="font-mono text-[10px] opacity-60">SGU-WLT-ID-8829-192</div>
              </div>
           </div>

           <div className="mt-8 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                 <Receipt size={20} className="text-indigo-600" />
                 Quick Utilities
              </h3>
              <div className="space-y-3">
                 {[
                   { label: 'Pay Tuition Fees', icon: ArrowRight },
                   { label: 'Request Transcript', icon: ArrowRight },
                   { label: 'Buy Meal Voucher', icon: ArrowRight }
                 ].map((item, i) => (
                   <div key={i} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center group cursor-pointer hover:bg-indigo-600 hover:text-white transition-all duration-300">
                      <span className="font-bold text-sm">{item.label}</span>
                      <item.icon size={18} className="text-slate-300 group-hover:text-white transition-colors" />
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Transaction History */}
        <div className="col-span-12 lg:col-span-7 space-y-6">
           <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden h-full flex flex-col">
              <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                 <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <History size={22} className="text-indigo-600" />
                    Transaction Ledger
                 </h2>
                 <button className="text-xs font-bold text-indigo-600 hover:underline">View All Records</button>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[600px] custom-scrollbar">
                 {loading ? (
                    <div className="p-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={40} /></div>
                 ) : data?.history?.length > 0 ? (
                    <div className="divide-y divide-slate-50">
                       {data.history.map((tx: any) => (
                          <div key={tx.id} className="p-8 hover:bg-slate-50/50 transition-all flex items-center justify-between group">
                             <div className="flex items-center gap-5">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500 ${
                                  tx.type === 'credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                }`}>
                                   {tx.type === 'credit' ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
                                </div>
                                <div>
                                   <div className="text-slate-900 font-bold text-lg leading-tight">{tx.purpose}</div>
                                   <div className="flex items-center gap-2 mt-1">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{tx.reference}</span>
                                      <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                         <Clock size={10} />
                                         {new Date(tx.createdAt).toLocaleDateString()}
                                      </span>
                                   </div>
                                </div>
                             </div>
                             <div className={`text-xl font-black ${tx.type === 'credit' ? 'text-emerald-600' : 'text-slate-900'}`}>
                                {tx.type === 'credit' ? '+' : '-'}₦{parseFloat(tx.amount).toLocaleString()}
                             </div>
                          </div>
                       ))}
                    </div>
                 ) : (
                    <div className="p-32 text-center space-y-4 opacity-30">
                       <Wallet size={64} className="mx-auto text-slate-300" />
                       <p className="text-xl font-bold text-slate-900">No transactions recorded yet.</p>
                    </div>
                 )}
              </div>

              {data?.history?.length > 0 && (
                <div className="p-8 bg-slate-50 border-t border-slate-100 text-center">
                   <p className="text-xs text-slate-400 font-medium italic">All transactions are processed through institutional bank-grade security protocols.</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
