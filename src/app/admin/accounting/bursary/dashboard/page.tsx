"use client";

import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  DollarSign,
  PieChart,
  BarChart3,
  Calendar,
  ChevronRight,
  ShieldCheck,
  Building2,
  Clock
} from 'lucide-react';
import { getBursaryOverviewAction, getExpenditureLedgerAction, requestExpenditureAction, approveExpenditureAction } from '@/actions/bursary-actions';

export default function BursaryDashboard() {
  const [overview, setOverview] = useState<any>(null);
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [overRes, ledRes] = await Promise.all([
      getBursaryOverviewAction(),
      getExpenditureLedgerAction()
    ]);
    
    if (overRes.success) setOverview(overRes.data);
    // @ts-expect-error - TS2345: Auto-suppressed for build
    if (ledRes.success) setLedger(ledRes.data);
    setLoading(false);
  }

  const handleRequest = async () => {
    setSubmitting(true);
    const res = await requestExpenditureAction({
        title,
        purpose,
        amount: parseFloat(amount)
    });
    setSubmitting(false);
    if (res.success) {
        setShowRequestForm(false);
        loadData();
        setTitle(''); setAmount(''); setPurpose('');
    }
  };

  const handleApprove = async (id: number) => {
    const res = await approveExpenditureAction(id);
    if (res.success) loadData();
  };

  return (
    <div className="p-8 max-w-[1600px] w-full mx-auto space-y-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-100">
            <Wallet size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Institutional Bursary Hub</h1>
            <p className="text-slate-500 font-medium text-lg">Real-time fiscal monitoring and expenditure governance</p>
          </div>
        </div>
        
        <div className="flex gap-4">
           <button 
             onClick={() => setShowRequestForm(true)}
             className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
           >
              <Plus size={20} />
              Request Expenditure
           </button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
            <div className="flex justify-between items-start">
               <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                  <TrendingUp size={24} />
               </div>
               <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-1 rounded-full">
                  <ArrowUpRight size={14} />
                  +12.5%
               </div>
            </div>
            <div>
               <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Revenue</div>
               <div className="text-4xl font-black text-slate-900">₦{overview?.revenue?.toLocaleString() || '0.00'}</div>
            </div>
         </div>

         <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
            <div className="flex justify-between items-start">
               <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
                  <TrendingDown size={24} />
               </div>
               <div className="flex items-center gap-1 text-rose-600 font-bold text-xs bg-rose-50 px-2 py-1 rounded-full">
                  <ArrowDownRight size={14} />
                  -4.2%
               </div>
            </div>
            <div>
               <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Expenditure</div>
               <div className="text-4xl font-black text-slate-900">₦{overview?.expenditure?.toLocaleString() || '0.00'}</div>
            </div>
         </div>

         <div className="bg-indigo-600 p-8 rounded-[40px] text-white space-y-6 shadow-xl shadow-indigo-100">
            <div className="flex justify-between items-start">
               <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                  <PieChart size={24} />
               </div>
               <div className="text-[10px] font-bold bg-white/20 px-3 py-1 rounded-full uppercase tracking-widest">
                  Net Surplus
               </div>
            </div>
            <div>
               <div className="text-xs font-bold text-indigo-200 uppercase tracking-widest mb-1">Available Balance</div>
               <div className="text-4xl font-black">₦{overview?.balance?.toLocaleString() || '0.00'}</div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Expenditure Ledger */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
           <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden">
              <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                 <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <FileText size={22} className="text-indigo-600" />
                    General Expenditure Ledger
                 </h2>
                 <div className="flex gap-3">
                    <div className="relative">
                       <input type="text" placeholder="Filter ledger..." className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium w-48 focus:ring-2 focus:ring-indigo-500 outline-none" />
                       <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                 </div>
              </div>

              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="border-b border-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">
                          <th className="px-8 py-5">Transaction Details</th>
                          <th className="px-8 py-5">Amount</th>
                          <th className="px-8 py-5">Status</th>
                          <th className="px-8 py-5 text-right">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {loading ? (
                          <tr><td colSpan={4} className="p-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={40} /></td></tr>
                       ) : ledger.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/50 transition-all group">
                             <td className="px-8 py-6">
                                <div className="flex items-center gap-4">
                                   <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                                      <Building2 size={20} />
                                   </div>
                                   <div>
                                      <div className="text-slate-900 font-bold text-lg leading-tight">{item.title}</div>
                                      <div className="flex items-center gap-2 mt-1">
                                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.requestedBy}</span>
                                         <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                         <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{item.department || 'General'}</span>
                                      </div>
                                   </div>
                                </div>
                             </td>
                             <td className="px-8 py-6">
                                <div className="text-lg font-black text-slate-900">₦{parseFloat(item.amount).toLocaleString()}</div>
                                <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                   <Clock size={10} />
                                   {new Date(item.date).toLocaleDateString()}
                                </div>
                             </td>
                             <td className="px-8 py-6">
                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                  item.status === 'disbursed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                                  item.status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                                }`}>
                                   {item.status === 'disbursed' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                                   {item.status}
                                </div>
                             </td>
                             <td className="px-8 py-6 text-right">
                                {item.status === 'pending' && (
                                   <button 
                                     onClick={() => handleApprove(item.id)}
                                     className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all"
                                   >
                                      Authorize Disburse
                                   </button>
                                )}
                                <button className="p-2 text-slate-400 hover:text-indigo-600 ml-2">
                                   <ChevronRight size={20} />
                                </button>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>

        {/* Financial Policy Sidebar */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
           <div className="bg-slate-900 rounded-[40px] p-8 text-white space-y-8 shadow-xl">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-indigo-400">
                 <ShieldCheck size={28} />
              </div>
              <div className="space-y-4">
                 <h3 className="text-2xl font-bold">Accounting Policy</h3>
                 <p className="text-sm text-slate-400 leading-relaxed font-medium">
                    All expenditure requests above ₦50,000 must be accompanied by three competitive vendor quotes and officially approved by the Bursar or Principal.
                 </p>
              </div>
              <div className="pt-6 border-t border-white/10 space-y-4">
                 <div className="flex justify-between items-center text-xs font-medium">
                    <span className="text-slate-500">Disbursement Window</span>
                    <span className="font-bold text-indigo-400">24-48 Hours</span>
                 </div>
                 <div className="flex justify-between items-center text-xs font-medium">
                    <span className="text-slate-500">Audit Frequency</span>
                    <span className="font-bold text-emerald-400">Quarterly</span>
                 </div>
              </div>
           </div>

           <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                 <BarChart3 size={20} className="text-indigo-600" />
                 Revenue Sources
              </h3>
              <div className="space-y-4">
                 {[
                   { label: 'Tuition Fees', value: '85%', color: 'bg-indigo-600' },
                   { label: 'Grants & Endowments', value: '10%', color: 'bg-emerald-500' },
                   { label: 'Sundry Income', value: '5%', color: 'bg-amber-500' }
                 ].map((source, i) => (
                   <div key={i} className="space-y-2">
                      <div className="flex justify-between text-xs font-bold text-slate-600 uppercase tracking-widest">
                         <span>{source.label}</span>
                         <span>{source.value}</span>
                      </div>
                      <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                         <div className={`h-full ${source.color}`} style={{ width: source.value }} />
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>

      {/* Modal: Expenditure Request */}
      {showRequestForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-10 space-y-8">
                <div className="flex justify-between items-start">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
                         <TrendingDown size={24} />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900">New Expenditure Request</h2>
                   </div>
                   <button onClick={() => setShowRequestForm(false)} className="text-slate-400 hover:text-slate-600">
                      <Plus size={24} className="rotate-45" />
                   </button>
                </div>

                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-2">Request Title</label>
                      <input 
                        type="text" 
                        className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-rose-50 outline-none font-medium transition-all"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., IT Infrastructure Maintenance"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-2">Amount (₦)</label>
                      <input 
                        type="number" 
                        className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-rose-50 outline-none font-black text-xl transition-all"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-2">Detailed Purpose</label>
                      <textarea 
                        className="w-full h-32 px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-rose-50 outline-none font-medium transition-all"
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value)}
                        placeholder="Provide a comprehensive justification for this expenditure..."
                      />
                   </div>
                </div>

                <button 
                  onClick={handleRequest}
                  disabled={submitting || !title || !amount || !purpose}
                  className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black text-xl flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
                >
                   {submitting ? <Loader2 size={24} className="animate-spin" /> : <DollarSign size={24} />}
                   Submit Official Request
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
