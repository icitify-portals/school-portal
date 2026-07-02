"use client";

import React, { useState, useEffect } from 'react';
import { 
  FileStack, 
  Plus, 
  Send, 
  CreditCard, 
  History, 
  ChevronRight, 
  MapPin, 
  Mail, 
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Download,
  FileText
} from 'lucide-react';
import { submitTranscriptRequestAction, getTranscriptRequestsAction } from '@/actions/academic-documents';

export default function StudentTranscriptPortal() {
  const [requests, setRequests] = useState<any[]>([]);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [destinationName, setDestinationName] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'email' | 'courier' | 'pickup'>('email');

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    setLoading(true);
    const res = await getTranscriptRequestsAction();
    // @ts-expect-error - TS2345: Auto-suppressed for build
    if (res.success) setRequests(res.data);
    setLoading(false);
  }

  const handleRequest = async () => {
    setSubmitting(true);
    const res = await submitTranscriptRequestAction({
        studentId: 1, // Placeholder
        destinationName,
        destinationAddress,
        deliveryMethod,
        fee: 5000 // Fixed fee
    });
    setSubmitting(false);
    if (res.success) {
        setShowRequestForm(false);
        loadRequests();
    }
  };

  return (
    <div className="p-8 max-w-[1600px] w-full mx-auto space-y-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100">
            <FileStack size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Official Transcript Portal</h1>
            <p className="text-slate-500 font-medium text-lg">Request and track your institutional academic records</p>
          </div>
        </div>
        <button 
          onClick={() => setShowRequestForm(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
          <Plus size={20} />
          New Transcript Order
        </button>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Active Requests */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
           <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                 <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <History size={20} className="text-indigo-600" />
                    Order History
                 </h2>
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{requests.length} Orders Found</span>
              </div>

              <div className="divide-y divide-slate-50">
                 {loading ? (
                    <div className="p-20 flex justify-center">
                       <Loader2 className="animate-spin text-indigo-500" size={32} />
                    </div>
                 ) : requests.length > 0 ? requests.map((req) => (
                    <div key={req.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                       <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            req.status === 'dispatched' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                          }`}>
                             {req.status === 'dispatched' ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                          </div>
                          <div>
                             <div className="text-slate-900 font-bold text-lg leading-tight">{req.destination}</div>
                             <div className="text-slate-400 text-sm font-medium">Order #{req.id} • {new Date(req.requestedAt).toLocaleDateString()}</div>
                          </div>
                       </div>

                       <div className="flex items-center gap-8">
                          <div className="text-right">
                             <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${
                               req.payment === 'paid' ? 'text-emerald-600' : 'text-rose-600'
                             }`}>
                                {req.payment === 'paid' ? 'Paid' : 'Payment Pending'}
                             </div>
                             <div className="text-sm font-bold text-slate-900 capitalize">{req.status}</div>
                          </div>
                          <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-600 transition-all" />
                       </div>
                    </div>
                 )) : (
                    <div className="p-32 text-center space-y-4 opacity-30">
                       <FileStack size={64} className="mx-auto text-slate-300" />
                       <p className="text-lg font-bold text-slate-900">No transcript orders yet.</p>
                    </div>
                 )}
              </div>
           </div>
        </div>

        {/* Sidebar: Information */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
           <div className="bg-indigo-600 rounded-2xl p-8 text-white space-y-6 shadow-xl shadow-indigo-100">
              <h3 className="text-xl font-bold">Standard Processing</h3>
              <div className="space-y-4">
                 <div className="flex gap-4">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0"><Clock size={16} /></div>
                    <div>
                       <div className="text-sm font-bold">Turnaround Time</div>
                       <div className="text-xs text-indigo-100 opacity-80">3-5 Working Days after payment verification.</div>
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0"><CreditCard size={16} /></div>
                    <div>
                       <div className="text-sm font-bold">Order Fee</div>
                       <div className="text-xs text-indigo-100 opacity-80">₦5,000 Flat Rate per institutional copy.</div>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                 <AlertCircle size={20} className="text-amber-500" />
                 Important Note
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                Official transcripts are sent directly to the destination institution. Student copies can be downloaded from the "Results" section for personal use.
              </p>
           </div>
        </div>
      </div>

      {/* Modal: New Request */}
      {showRequestForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                   <h2 className="text-2xl font-bold text-slate-900">Order Official Transcript</h2>
                   <button onClick={() => setShowRequestForm(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                      <Plus size={24} className="rotate-45" />
                   </button>
                </div>

                <div className="space-y-4">
                   <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Destination Institution / Company</label>
                      <input 
                        type="text" 
                        placeholder="e.g. University of Lagos, Graduate School"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-medium transition-all"
                        value={destinationName}
                        onChange={(e) => setDestinationName(e.target.value)}
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Detailed Address</label>
                      <textarea 
                        placeholder="Complete mailing address or official email..."
                        className="w-full h-24 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-medium transition-all"
                        value={destinationAddress}
                        onChange={(e) => setDestinationAddress(e.target.value)}
                      />
                   </div>
                   <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'email', icon: Mail, label: 'Email' },
                        { id: 'courier', icon: Truck, label: 'Courier' },
                        { id: 'pickup', icon: MapPin, label: 'Pickup' }
                      ].map((method) => (
                        <button 
                          key={method.id}
                          onClick={() => setDeliveryMethod(method.id as any)}
                          className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                            deliveryMethod === method.id ? 'bg-indigo-50 border-indigo-600 text-indigo-600 ring-2 ring-indigo-500/10' : 'bg-white border-slate-100 text-slate-400'
                          }`}
                        >
                           <method.icon size={20} />
                           <span className="text-[10px] font-bold uppercase">{method.label}</span>
                        </button>
                      ))}
                   </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                   <div className="text-sm font-bold text-slate-600">Administrative Processing Fee</div>
                   <div className="text-xl font-black text-slate-900">₦5,000.00</div>
                </div>

                <button 
                  onClick={handleRequest}
                  disabled={submitting || !destinationName || !destinationAddress}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg"
                >
                   {submitting ? <Loader2 size={20} className="animate-spin" /> : <CreditCard size={20} />}
                   Secure Order & Proceed to Payment
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
