"use client";

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  Download,
  Calendar,
  Building2,
  ChevronRight,
  Loader2,
  RefreshCcw,
  Target
} from 'lucide-react';
import { getRevenueAnalytics } from '@/actions/revenue-analytics';

export default function RevenueAnalysisDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const res = await getRevenueAnalytics();
    if (res.success) setData(res);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
        <p className="text-slate-500 font-bold animate-pulse">Aggregating Institutional Revenue Data...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-100">
            <BarChart3 size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Revenue Intelligence</h1>
            <p className="text-slate-500 font-medium text-lg">Institutional income analysis and allocation tracking</p>
          </div>
        </div>
        <div className="flex gap-3">
           <button onClick={loadData} className="p-3 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-indigo-600 transition-colors">
              <RefreshCcw size={20} />
           </button>
           <button className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg">
            <Download size={18} />
            Export Financial Report
          </button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-2">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <DollarSign size={20} />
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <ArrowUpRight size={12} />
              +12.5%
            </span>
          </div>
          <div>
            <h3 className="text-slate-400 text-sm font-bold uppercase tracking-widest">Total Revenue</h3>
            <p className="text-3xl font-black text-slate-900">₦{data.totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-2">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <TrendingUp size={20} />
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <ArrowUpRight size={12} />
              +5.2%
            </span>
          </div>
          <div>
            <h3 className="text-slate-400 text-sm font-bold uppercase tracking-widest">Avg. Per Student</h3>
            <p className="text-3xl font-black text-slate-900">₦{(data.totalRevenue / 1250).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-2">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Target size={20} />
            </div>
          </div>
          <div>
            <h3 className="text-slate-400 text-sm font-bold uppercase tracking-widest">Top Account</h3>
            <p className="text-2xl font-black text-slate-900 truncate">{data.revenueByAccount[0]?.accountName}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-2">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <Building2 size={20} />
            </div>
          </div>
          <div>
            <h3 className="text-slate-400 text-sm font-bold uppercase tracking-widest">Growth Engine</h3>
            <p className="text-2xl font-black text-slate-900 truncate">Engineering</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Account Breakdown */}
        <div className="col-span-12 lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
               <div>
                 <h2 className="text-xl font-bold text-slate-900">Revenue by Account</h2>
                 <p className="text-slate-500 text-sm">Distribution across the General Ledger</p>
               </div>
               <Filter className="text-slate-300" size={20} />
            </div>
            <div className="p-8 space-y-6">
               {data.revenueByAccount.map((acc: any, index: number) => (
                 <div key={index} className="space-y-2">
                   <div className="flex justify-between items-end">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded">{acc.accountCode}</span>
                        <span className="text-sm font-bold text-slate-700">{acc.accountName}</span>
                      </div>
                      <span className="text-sm font-black text-slate-900">₦{Number(acc.total).toLocaleString()}</span>
                   </div>
                   <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${(Number(acc.total) / data.totalRevenue) * 100}%` }}
                      />
                   </div>
                 </div>
               ))}
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
             <TrendingUp className="absolute -right-10 -bottom-10 w-64 h-64 opacity-10" />
             <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-widest text-xs">
                  <ArrowUpRight size={16} />
                  Institutional Momentum
                </div>
                <h3 className="text-3xl font-bold leading-tight max-w-md">Revenue has grown by 15% compared to the previous session.</h3>
                <div className="flex gap-10">
                   <div>
                      <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Retention Rate</div>
                      <div className="text-2xl font-black">94.2%</div>
                   </div>
                   <div>
                      <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Fee Compliance</div>
                      <div className="text-2xl font-black">88.5%</div>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Faculty Distribution & Trends */}
        <div className="col-span-12 lg:col-span-5 space-y-8">
           <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <PieChart size={20} className="text-indigo-500" />
                Faculty Performance
              </h2>
              <div className="space-y-4">
                 {data.facultyPerformance.map((faculty: any, i: number) => (
                   <div key={i} className="flex items-center justify-between group cursor-pointer">
                      <div className="flex items-center gap-3">
                         <div className={`w-3 h-3 rounded-full ${
                           i === 0 ? 'bg-indigo-500' : i === 1 ? 'bg-emerald-500' : i === 2 ? 'bg-amber-500' : 'bg-rose-500'
                         }`} />
                         <span className="text-sm font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">{faculty.name}</span>
                      </div>
                      <span className="text-sm font-black text-slate-900">₦{faculty.total.toLocaleString()}</span>
                   </div>
                 ))}
              </div>
              <div className="pt-6 border-t border-slate-50">
                 <button className="w-full text-indigo-600 font-bold text-sm flex items-center justify-center gap-2 group">
                    View Detailed Academic Units
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                 </button>
              </div>
           </div>

           <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Calendar size={20} className="text-indigo-500" />
                Revenue Trend (6M)
              </h2>
              <div className="space-y-6">
                 {data.monthlyTrend.map((month: any, i: number) => (
                   <div key={i} className="space-y-1">
                      <div className="flex justify-between items-end">
                        <span className="text-xs font-bold text-slate-400">{month.month}</span>
                        <span className="text-xs font-black text-slate-900">₦{Number(month.total).toLocaleString()}</span>
                      </div>
                      <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 rounded-full" 
                          style={{ width: `${(Number(month.total) / data.totalRevenue) * 100}%` }}
                        />
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
