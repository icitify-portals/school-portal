"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  History, 
  Plus, 
  ShieldCheck, 
  CheckCircle2, 
  Loader2,
  Clock,
  ArrowRight,
  TrendingUp,
  Receipt,
  X,
  Sparkles
} from 'lucide-react';
import { getStudentWalletStatusAction, simulateTopUpAction } from '@/actions/wallet-actions';
import { resolveOnlinePaymentAction } from '@/actions/bursary';
import { useSession } from "next-auth/react";
import { getStudentByUserId } from "@/actions/students";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { RemitaInlineCheckout } from "@/components/finance/RemitaInlineCheckout";

interface StudentProfile {
  id: number;
  firstName: string;
  lastName: string;
  matricNumber?: string;
  userId: number;
}

interface WalletHistoryItem {
  id: number;
  amount: string;
  type: 'credit' | 'debit';
  purpose: string;
  reference: string;
  createdAt: string | Date;
}

interface WalletData {
  success: boolean;
  balance: string;
  history: WalletHistoryItem[];
}

export default function StudentWalletPortal() {
  const { data: session } = useSession();
  const router = useRouter();
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toppingUp, setToppingUp] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [topUpSuccess, setTopUpSuccess] = useState(false);
  const [remitaData, setRemitaData] = useState<{ rrr: string, reference: string, amount: number } | null>(null);

  const loadWallet = useCallback(async (studentId: number) => {
    const res = await getStudentWalletStatusAction(studentId);
    if (res.success && res.history) {
      setData({
        success: true,
        balance: res.balance,
        history: res.history as WalletHistoryItem[]
      });
    }
  }, []);

  const resolveStudent = useCallback(async () => {
    const userId = (session?.user as { id?: string })?.id;
    if (!userId) return;
    try {
      const studentData = await getStudentByUserId(parseInt(userId));
      if (studentData) {
        setStudent(studentData as StudentProfile);
        await loadWallet(studentData.id);
      }
    } catch (error) {
      console.error("Failed to resolve student for wallet:", error);
    } finally {
      setLoading(false);
    }
  }, [session, loadWallet]);

  useEffect(() => {
    if (session?.user) {
      resolveStudent();
    }
  }, [session, resolveStudent]);

  const triggerTopUp = async (amount: number) => {
    if (!student || amount <= 0) return;
    setToppingUp(true);
    
    // Call the real Remita Wallet Topup Action
    const { initializeWalletTopUp } = await import('@/actions/wallet');
    const res = await initializeWalletTopUp(amount, 'remita');
    
    if (res.success && res.rrr) {
      setRemitaData({ rrr: res.rrr, reference: res.reference, amount });
      setToppingUp(false);
    } else if (res.success && res.checkoutUrl) {
      // Redirect to the Remita Checkout Gateway (if not inline)
      window.location.href = res.checkoutUrl;
    } else {
      alert(res.error || "Failed to initialize top-up");
      setToppingUp(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50/50">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Loading digital wallet...</p>
      </div>
    );
  }

  const availableBalance = parseFloat(data?.balance || "0").toLocaleString();

  return (
    <div className="p-8 max-w-[1600px] w-full mx-auto space-y-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100">
            <Wallet size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Institutional Digital Wallet</h1>
            <p className="text-slate-500 font-medium mt-1">Fund your account and make instant secure payments</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-white px-5 py-3 rounded-2xl border border-slate-100 text-xs font-black text-slate-400 uppercase tracking-widest shadow-sm">
           <ShieldCheck size={16} className="text-emerald-500" />
           Secure Financial Gateway
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Balance Card & Quick utilities */}
        <div className="col-span-12 lg:col-span-5 space-y-8">
           {/* Emerald Glow Balance Card */}
           <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white space-y-10 shadow-2xl shadow-indigo-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-700" />
              <div className="flex justify-between items-start relative z-10">
                 <div className="space-y-2">
                    <div className="text-[10px] font-black text-indigo-200 uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Available Wallet Balance
                    </div>
                    <div className="text-5xl font-black tracking-tight">₦{availableBalance}</div>
                 </div>
                 <div className="p-3.5 bg-white/10 rounded-2xl backdrop-blur-md">
                    <TrendingUp size={24} />
                 </div>
              </div>

              <div className="grid grid-cols-1 gap-4 relative z-10">
                 <button 
                   onClick={() => setIsTopUpOpen(true)}
                   className="bg-white text-indigo-600 px-6 py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-indigo-50 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl text-sm"
                 >
                    <Plus size={20} />
                    Top-up Wallet Now
                 </button>
              </div>

              <div className="pt-6 border-t border-white/10 flex justify-between items-center relative z-10">
                 <div className="text-[9px] font-bold text-indigo-200 uppercase tracking-widest">Verified Student Account</div>
                 <div className="font-mono text-[9px] opacity-60 uppercase">SGU-WLT-ID-{student?.id?.toString().padStart(4, '0') || '0000'}</div>
              </div>
           </div>

           {/* Quick Utilities */}
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 tracking-tight">
                 <Receipt size={20} className="text-indigo-600" />
                 Quick Utilities
              </h3>
              <div className="space-y-3">
                 {[
                   { label: 'Pay Tuition Fees', path: '/student/finance' },
                   { label: 'Apply for Refund', path: '/student/finance/refund' },
                   { label: 'Transaction statement', path: '/student/finance' }
                 ].map((item, i) => (
                   <div 
                     key={i} 
                     onClick={() => router.push(item.path)}
                     className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center group cursor-pointer hover:bg-slate-900 hover:text-white transition-all duration-300"
                   >
                      <span className="font-bold text-xs uppercase tracking-wider text-slate-700 group-hover:text-white">{item.label}</span>
                      <ArrowRight size={18} className="text-slate-400 group-hover:text-white transition-colors" />
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Transaction History */}
        <div className="col-span-12 lg:col-span-7 space-y-6">
           <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/50 overflow-hidden h-full flex flex-col">
              <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/20">
                 <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 tracking-tight">
                    <History size={22} className="text-indigo-600" />
                    Transaction Ledger
                 </h2>
                 <button 
                   onClick={() => router.push('/student/finance')}
                   className="text-xs font-bold text-indigo-600 hover:underline"
                 >
                    View Secure Statement
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[600px] divide-y divide-slate-50">
                 {data?.history && data.history.length > 0 ? (
                    <div className="divide-y divide-slate-50">
                       {data.history.map((tx) => (
                          <div key={tx.id} className="p-8 hover:bg-slate-50/30 transition-all flex items-center justify-between group">
                             <div className="flex items-center gap-5">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500 ${
                                  tx.type === 'credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                }`}>
                                   {tx.type === 'credit' ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
                                </div>
                                <div>
                                   <div className="text-slate-900 font-extrabold text-sm leading-tight">{tx.purpose}</div>
                                   <div className="flex items-center gap-2 mt-1.5">
                                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{tx.reference}</span>
                                      <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                         <Clock size={10} />
                                         {new Date(tx.createdAt).toLocaleDateString()}
                                      </span>
                                   </div>
                                </div>
                             </div>
                             <div className="flex flex-col items-end">
                                <div className={`text-lg font-black ${tx.type === 'credit' ? 'text-emerald-600' : 'text-slate-900'}`}>
                                   {tx.type === 'credit' ? '+' : '-'}₦{parseFloat(tx.amount).toLocaleString()}
                                </div>
                                {tx.paymentTransactionId && (
                                   <Button
                                      variant="ghost"
                                      size="sm"
                                      className="mt-1 h-6 px-2 rounded-md text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-black text-[9px] uppercase tracking-wider gap-1"
                                      onClick={() => window.open(`/finance/receipt/${tx.paymentTransactionId}`, '_blank')}
                                   >
                                      <Receipt size={10} /> Receipt
                                   </Button>
                                )}
                             </div>
                          </div>
                       ))}
                    </div>
                 ) : (
                    <div className="p-32 text-center space-y-4 opacity-40">
                       <Wallet size={64} className="mx-auto text-slate-300" />
                       <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">No wallet transactions recorded yet.</p>
                    </div>
                 )}
              </div>

              {data?.history && data.history.length > 0 && (
                <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">All transactions processed under bank-grade security protocols.</p>
                </div>
              )}
           </div>
        </div>
      </div>

      {/* Wallet Top-up Modal */}
      {isTopUpOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 relative animate-in fade-in zoom-in-95 duration-200">
            {/* Close button */}
            <button 
              onClick={() => setIsTopUpOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">Top-up Balance</h3>
                  <p className="text-xs text-slate-500 font-medium">Add secure funds instantly via payment gateway</p>
                </div>
              </div>

              {topUpSuccess ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 animate-bounce">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                  <h4 className="text-xl font-black text-slate-900">Wallet Funded!</h4>
                  <p className="text-xs text-slate-400">Payment was successful. Processing receipt...</p>
                </div>
              ) : remitaData ? (
                  <div className="space-y-6">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-500">Amount</span>
                      <span className="text-lg font-black text-slate-900">₦{remitaData.amount.toLocaleString()}</span>
                    </div>
                    <div className="w-full">
                      <RemitaInlineCheckout 
                        rrr={remitaData.rrr} 
                        amount={remitaData.amount} 
                        email={session?.user?.email || "student@fssibadan.edu.ng"} 
                        firstName={student?.firstName || ""} 
                        lastName={student?.lastName || ""} 
                        onSuccess={async () => {
                          setToppingUp(true);
                          try {
                            const verify = await resolveOnlinePaymentAction(remitaData.reference, 'completed');
                            if (verify.success) {
                              setTopUpSuccess(true);
                              setTimeout(() => {
                                setIsTopUpOpen(false);
                                setRemitaData(null);
                                setTopUpSuccess(false);
                                if (student?.id) loadWallet(student.id);
                              }, 2000);
                            } else {
                              alert("Payment verification failed. Please contact admin.");
                              setRemitaData(null);
                            }
                          } catch (err) {
                            alert("Error verifying payment.");
                            setRemitaData(null);
                          }
                          setToppingUp(false);
                        }} 
                        onError={() => {
                          alert("Remita payment failed or was cancelled.");
                          setRemitaData(null);
                        }} 
                        onClose={() => {
                          // Handle close
                        }} 
                      />
                    </div>
                    <Button variant="ghost" className="w-full mt-4 text-xs font-bold text-slate-500" onClick={() => setRemitaData(null)}>
                      Cancel Payment
                    </Button>
                  </div>
              ) : (
                <div className="space-y-6">
                  {/* Quick select amounts */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Deposit Amount</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[500, 1000, 5000, 10000, 20000, 50000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setCustomAmount(amt.toString())}
                          className="py-2.5 px-3 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl border border-slate-100 hover:border-indigo-200 text-xs font-extrabold transition-all text-slate-700"
                        >
                          ₦{amt.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom input */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enter Custom Amount (₦)</label>
                    <input
                      type="number"
                      required
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl h-12 px-4 focus:ring-2 focus:ring-indigo-500 transition-all font-black text-slate-800 text-lg"
                      placeholder="e.g. 15000"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                    />
                  </div>

                  {/* Info alert */}
                  <div className="flex gap-2.5 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                      Funds added to your wallet are locked for tuition settlements and official fees checkout. Direct withdrawals are restricted.
                    </p>
                  </div>

                  <Button
                    onClick={() => triggerTopUp(parseFloat(customAmount))}
                    disabled={toppingUp || !customAmount || parseFloat(customAmount) <= 0}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black h-12 rounded-2xl shadow-lg shadow-indigo-100 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {toppingUp ? (
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                      "Confirm & Pay Online"
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
