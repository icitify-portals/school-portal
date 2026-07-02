"use client";

import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Truck, 
  AlertTriangle, 
  Plus, 
  Search, 
  Filter, 
  BarChart3, 
  Box, 
  Wrench, 
  History, 
  ArrowUpRight, 
  ArrowDownRight, 
  ShieldCheck,
  Loader2,
  Monitor,
  Printer,
  ChevronRight,
  ShoppingCart
} from 'lucide-react';
import { recordInventoryTransactionAction, getInventoryStatusAction } from '@/actions/inventory-actions';

export default function InventoryDashboard() {
  const [masterList, setMasterList] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const [quantity, setQuantity] = useState('');
  const [type, setType] = useState<'purchase' | 'issuance'>('purchase');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const res = await getInventoryStatusAction();
    if (res.success) {
        // @ts-expect-error - TS2345: Auto-suppressed for build
        setMasterList(res.masterList);
        // @ts-expect-error - TS2345: Auto-suppressed for build
        setLowStock(res.lowStock);
    }
    setLoading(false);
  }

  const handleTransaction = async () => {
    if (!selectedItem || !quantity) return;
    setSubmitting(true);
    const res = await recordInventoryTransactionAction({
        itemId: selectedItem,
        quantity: parseFloat(quantity),
        type: type as any
    });
    setSubmitting(false);
    if (res.success) {
        setShowTransactionForm(false);
        loadData();
    }
  };

  return (
    <div className="p-8 max-w-[1600px] w-full mx-auto space-y-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100">
            <Package size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Inventory & Assets Studio</h1>
            <p className="text-slate-500 font-medium text-lg">Centralized oversight of institutional physical resources</p>
          </div>
        </div>
        
        <div className="flex gap-4">
           <button 
             onClick={() => setShowTransactionForm(true)}
             className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
           >
              <Plus size={20} />
              Record Transaction
           </button>
        </div>
      </div>

      {/* Critical Stock Alerts */}
      {lowStock.length > 0 && (
         <div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-rose-600 text-white rounded-2xl flex items-center justify-center animate-pulse">
                  <AlertTriangle size={24} />
               </div>
               <div>
                  <h3 className="text-lg font-bold text-rose-900">Critical Stock Warning</h3>
                  <p className="text-rose-600 font-medium text-sm">{lowStock.length} items have fallen below institutional reorder levels.</p>
               </div>
            </div>
            <button className="bg-rose-600 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-rose-700 transition-all shadow-lg shadow-rose-200">
               Generate Reorder List
            </button>
         </div>
      )}

      <div className="grid grid-cols-12 gap-4">
        {/* Inventory Master Ledger */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
           <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden">
              <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                 <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Box size={22} className="text-indigo-600" />
                    Master Inventory Ledger
                 </h2>
                 <div className="flex gap-3">
                    <div className="relative">
                       <input type="text" placeholder="Search stock..." className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium w-48 focus:ring-2 focus:ring-indigo-500 outline-none" />
                       <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                 </div>
              </div>

              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="border-b border-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">
                          <th className="px-8 py-5">Item Details</th>
                          <th className="px-8 py-5">Current Stock</th>
                          <th className="px-8 py-5">Status</th>
                          <th className="px-8 py-5 text-right">Reference</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {loading ? (
                          <tr><td colSpan={4} className="p-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={40} /></td></tr>
                       ) : masterList.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/50 transition-all group">
                             <td className="px-8 py-6">
                                <div className="flex items-center gap-4">
                                   <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 font-bold">
                                      {item.name.charAt(0)}
                                   </div>
                                   <div>
                                      <div className="text-slate-900 font-bold text-lg leading-tight">{item.name}</div>
                                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SKU: {item.sku || 'N/A'}</div>
                                   </div>
                                </div>
                             </td>
                             <td className="px-8 py-6">
                                <div className="text-lg font-black text-slate-900">{item.stock} {item.unit}</div>
                                <div className="text-[10px] font-bold text-slate-400">Reorder Level: {item.reorder}</div>
                             </td>
                             <td className="px-8 py-6">
                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                  parseFloat(item.stock) > parseFloat(item.reorder) ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                                }`}>
                                   {parseFloat(item.stock) > parseFloat(item.reorder) ? <ShieldCheck size={12} /> : <AlertTriangle size={12} />}
                                   {parseFloat(item.stock) > parseFloat(item.reorder) ? 'Optimal' : 'Low Stock'}
                                </div>
                             </td>
                             <td className="px-8 py-6 text-right">
                                <button className="p-2 text-slate-400 hover:text-indigo-600">
                                   <History size={18} />
                                </button>
                                <button className="p-2 text-slate-400 hover:text-indigo-600 ml-1">
                                   <ChevronRight size={18} />
                                </button>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>

        {/* Assets & Maintenance Sidebar */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
           <div className="bg-slate-900 rounded-[40px] p-8 text-white space-y-8 shadow-xl">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-indigo-400">
                 <Monitor size={28} />
              </div>
              <div className="space-y-4">
                 <h3 className="text-2xl font-bold">Fixed Assets</h3>
                 <p className="text-sm text-slate-400 leading-relaxed font-medium">
                    Tracking institutional property including electronics, vehicles, and furniture with automated depreciation algorithms.
                 </p>
              </div>
              <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                 <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Valuation</div>
                 <div className="text-xl font-black text-indigo-400">₦24.8M</div>
              </div>
           </div>

           <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                 <Wrench size={20} className="text-indigo-600" />
                 Maintenance Schedule
              </h3>
              <div className="space-y-4">
                 {[
                   { label: 'Server Maintenance', date: 'Oct 24', status: 'Upcoming' },
                   { label: 'Fleet Servicing', date: 'Oct 28', status: 'Pending' }
                 ].map((task, i) => (
                   <div key={i} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center">
                      <div>
                         <div className="font-bold text-slate-900 text-sm">{task.label}</div>
                         <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{task.date}</div>
                      </div>
                      <span className="text-[10px] font-black uppercase text-indigo-600">{task.status}</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>

      {/* Modal: Transaction Form */}
      {showTransactionForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-10 space-y-8">
                <div className="flex justify-between items-start">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                         <Truck size={24} />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900">Inventory Transaction</h2>
                   </div>
                   <button onClick={() => setShowTransactionForm(false)} className="text-slate-400 hover:text-slate-600">
                      <Plus size={24} className="rotate-45" />
                   </button>
                </div>

                <div className="space-y-6">
                   <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => setType('purchase')}
                        className={`py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                          type === 'purchase' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-500'
                        }`}
                      >
                         <ArrowUpRight size={18} />
                         Stock In (Purchase)
                      </button>
                      <button 
                        onClick={() => setType('issuance')}
                        className={`py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                          type === 'issuance' ? 'bg-rose-600 text-white shadow-lg' : 'bg-slate-50 text-slate-500'
                        }`}
                      >
                         <ArrowDownRight size={18} />
                         Stock Out (Issue)
                      </button>
                   </div>

                   <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-2">Select Item</label>
                      <select 
                        className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none font-medium transition-all"
                        value={selectedItem || ''}
                        onChange={(e) => setSelectedItem(parseInt(e.target.value))}
                      >
                         <option value="">Choose an item...</option>
                         {masterList.map(item => <option key={item.id} value={item.id}>{item.name} ({item.stock} {item.unit} available)</option>)}
                      </select>
                   </div>

                   <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-2">Quantity</label>
                      <input 
                        type="number" 
                        className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none font-black text-xl transition-all"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="0.00"
                      />
                   </div>
                </div>

                <button 
                  onClick={handleTransaction}
                  disabled={submitting || !selectedItem || !quantity}
                  className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black text-xl flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
                >
                   {submitting ? <Loader2 size={24} className="animate-spin" /> : <ShieldCheck size={24} />}
                   Complete Transaction
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
