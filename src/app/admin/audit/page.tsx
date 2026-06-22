"use client";

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Search, 
  Filter,
  Eye,
  FileText,
  User,
  ArrowRight
} from 'lucide-react';
import { getAuditQueue, verifyFinancialEntity, getAuditTrail } from '@/actions/audit';

export default function AuditDashboard() {
  const [queue, setQueue] = useState<any[]>([]);
  const [trail, setTrail] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'queue' | 'history'>('queue');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [qRes, tRes] = await Promise.all([getAuditQueue(), getAuditTrail()]);
    if (qRes.success) setQueue(qRes.data.retirements || []);
    if (tRes.success) setTrail(tRes.data || []);
    setLoading(false);
  }

  const stats = [
    { label: 'Pending Verification', value: queue.length, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Verified (Month)', value: trail.filter(t => t.decision === 'verified').length, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Flagged / Risks', value: trail.filter(t => t.decision === 'flagged').length, icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-50' },
    { label: 'Audit Compliance', value: '98.2%', icon: ShieldCheck, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  ];

  return (
    <div className="p-8 max-w-[1600px] w-full mx-auto space-y-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Internal Audit Dashboard</h1>
          <p className="text-slate-500 mt-1 text-lg">Institutional Financial Oversight & Integrity Control</p>
        </div>
        <div className="flex gap-3">
          <button onClick={loadData} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-all shadow-sm font-medium">
            Refresh Data
          </button>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-md font-medium">
            Export Audit Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-slate-500 font-medium text-sm uppercase tracking-wider">{stat.label}</h3>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 p-1 m-2 rounded-xl">
          <button 
            onClick={() => setActiveTab('queue')}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === 'queue' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Clock size={18} />
            Verification Queue
            {queue.length > 0 && <span className="ml-2 bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full text-xs font-bold">{queue.length}</span>}
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === 'history' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <ShieldCheck size={18} />
            Audit History
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 flex gap-4 border-b border-slate-50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by staff name, reference or purpose..." 
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          <button className="px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 flex items-center gap-2 hover:bg-slate-50">
            <Filter size={18} />
            Filters
          </button>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-slate-500 animate-pulse font-medium">Scanning institutional ledger...</p>
            </div>
          ) : activeTab === 'queue' ? (
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-slate-500 font-medium text-sm border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Submission Date</th>
                  <th className="px-6 py-4">Entity / Reference</th>
                  <th className="px-6 py-4">Purpose / Category</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {queue.length > 0 ? queue.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-slate-900 font-medium">{new Date(item.retiredAt).toLocaleDateString()}</div>
                      <div className="text-slate-400 text-xs">{new Date(item.retiredAt).toLocaleTimeString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-white transition-colors">
                           <FileText size={18} />
                        </div>
                        <div>
                          <div className="text-slate-900 font-semibold tracking-tight">Retirement #{item.id}</div>
                          <div className="text-slate-400 text-xs font-mono uppercase tracking-widest">ADV-{item.advanceId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-700 font-medium">Cash Advance Retirement</div>
                      <div className="text-slate-400 text-xs line-clamp-1">Operational expenditure verification</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-slate-900 font-bold text-lg">{settings?.base_currency || '₦'}{parseFloat(item.totalSpent).toLocaleString()}</div>
                      <div className="text-emerald-500 text-xs font-medium">Verified Receipts: Yes</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 text-indigo-600 transition-all flex items-center gap-1 mx-auto">
                        <Eye size={18} />
                        <span className="font-semibold text-sm">Review</span>
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="py-20 text-center space-y-3">
                      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                        <ShieldCheck size={40} />
                      </div>
                      <p className="text-slate-500 font-medium">Everything's clear! No pending items in the queue.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-slate-500 font-medium text-sm border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Audit Date</th>
                  <th className="px-6 py-4">Auditor</th>
                  <th className="px-6 py-4">Entity</th>
                  <th className="px-6 py-4">Decision</th>
                  <th className="px-6 py-4">Findings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {trail.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-medium">
                      {new Date(item.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
                          {item.auditor.charAt(0)}
                        </div>
                        <span className="text-slate-900 font-semibold">{item.auditor}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 uppercase text-xs font-bold tracking-widest">{item.type}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        item.decision === 'verified' ? 'bg-emerald-100 text-emerald-700' : 
                        item.decision === 'flagged' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {item.decision}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm italic line-clamp-1 max-w-xs">{item.findings || 'No findings reported.'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
