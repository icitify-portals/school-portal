"use client";

import React, { useState } from 'react';
import { 
  User, 
  ShieldCheck, 
  Key, 
  Smartphone, 
  Lock, 
  Camera, 
  Edit3, 
  Mail, 
  Phone, 
  Fingerprint, 
  ShieldAlert, 
  History, 
  CheckCircle2, 
  Loader2,
  RefreshCcw,
  Zap,
  Briefcase
} from 'lucide-react';
import { generateOTPAction, verifyOTPAction } from '@/actions/security-actions';

export default function ProfileStudio() {
  const [activeTab, setActiveTab] = useState('profile');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpId, setOtpId] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  const handleTriggerSecurity = async () => {
    setLoading(true);
    const res = await generateOTPAction();
    if (res.success) {
        // @ts-expect-error - TS2339: Auto-suppressed for build
        setOtpId(res.otpId);
        setShowOtpModal(true);
    }
    setLoading(false);
  };

  const handleVerify = async () => {
    setLoading(true);
    const res = await verifyOTPAction(otpId, otpCode);
    if (res.success) {
        setVerified(true);
        setTimeout(() => setShowOtpModal(false), 2000);
    }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100">
            <User size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Institutional Profile Studio</h1>
            <p className="text-slate-500 font-medium text-lg">Manage your identity, professional description, and security vault</p>
          </div>
        </div>
        
        <div className="flex bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
           <button 
             onClick={() => setActiveTab('profile')}
             className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'profile' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
           >
              Identity Info
           </button>
           <button 
             onClick={() => setActiveTab('security')}
             className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'security' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
           >
              Security Vault
           </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Profile Card & Info */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
           {activeTab === 'profile' ? (
             <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden animate-in slide-in-from-left-8 duration-500">
                <div className="h-40 bg-gradient-to-r from-indigo-600 to-indigo-800 relative">
                   <div className="absolute -bottom-16 left-12 p-1.5 bg-white rounded-2xl shadow-xl">
                      <div className="w-32 h-32 bg-slate-100 rounded-[22px] flex items-center justify-center text-slate-400 group relative cursor-pointer overflow-hidden">
                         <User size={48} />
                         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Camera size={24} className="text-white" />
                         </div>
                      </div>
                   </div>
                </div>
                
                <div className="pt-24 p-12 space-y-10">
                   <div className="flex justify-between items-start">
                      <div className="space-y-1">
                         <h2 className="text-3xl font-black text-slate-900 tracking-tight">Olanrewaju Ibrahim</h2>
                         <p className="text-indigo-600 font-bold flex items-center gap-2">
                            <ShieldCheck size={18} />
                            Senior Systems Administrator
                         </p>
                      </div>
                      <button className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-800 transition-all">
                         <Edit3 size={16} />
                         Edit Profile
                      </button>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Email Address</label>
                         <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3 text-slate-700 font-medium">
                            <Mail size={18} className="text-indigo-500" />
                            olaniyi@icitify.com
                         </div>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Phone Number</label>
                         <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3 text-slate-700 font-medium">
                            <Phone size={18} className="text-indigo-500" />
                            +234 812 345 6789
                         </div>
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Professional Office Description</label>
                      <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 text-slate-600 leading-relaxed italic font-medium">
                        "Responsible for the institutional digital infrastructure and academic systems orchestration. Lead developer for the Core Kernel integration and security audit routines."
                      </div>
                   </div>
                </div>
             </div>
           ) : (
             <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl p-12 space-y-10 animate-in slide-in-from-right-8 duration-500">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
                      <Lock size={24} />
                   </div>
                   <h2 className="text-2xl font-bold text-slate-900">Security Vault & 2FA</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="p-8 bg-slate-900 rounded-[32px] text-white space-y-6 shadow-xl shadow-rose-100">
                      <div className="flex justify-between items-start">
                         <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-rose-400">
                            <Fingerprint size={24} />
                         </div>
                         <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest">Active</div>
                      </div>
                      <div className="space-y-2">
                         <h3 className="text-lg font-bold">Two-Factor Authentication</h3>
                         <p className="text-xs text-slate-400 leading-relaxed font-medium">Add an extra layer of security to your account using institutional OTP verification.</p>
                      </div>
                      <button 
                        onClick={handleTriggerSecurity}
                        className="w-full py-3 bg-white text-slate-900 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all"
                      >
                         Re-verify Identity
                      </button>
                   </div>

                   <div className="p-8 border border-slate-100 rounded-[32px] space-y-6">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-indigo-600">
                         <Key size={24} />
                      </div>
                      <div className="space-y-2">
                         <h3 className="text-lg font-bold text-slate-900">Change Password</h3>
                         <p className="text-xs text-slate-500 leading-relaxed font-medium">Update your login credentials regularly to maintain high account security.</p>
                      </div>
                      <button className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all">
                         Update Password
                      </button>
                   </div>
                </div>

                <div className="space-y-4">
                   <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <History size={20} className="text-indigo-600" />
                      Login Activity
                   </h3>
                   <div className="space-y-3">
                      {[1,2,3].map(i => (
                         <div key={i} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center group hover:bg-white hover:border-indigo-100 transition-all">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-slate-400">
                                  <Smartphone size={18} />
                               </div>
                               <div>
                                  <div className="text-sm font-bold text-slate-900">Next.js Portal • Abuja, Nigeria</div>
                                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Oct 24, 2026 • 12:45 PM</div>
                               </div>
                            </div>
                            <span className="text-[10px] font-black uppercase text-emerald-600">Confirmed</span>
                         </div>
                      ))}
                   </div>
                </div>
             </div>
           )}
        </div>

        {/* Sidebar: Institutional Context */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
           <div className="bg-slate-900 rounded-[40px] p-8 text-white space-y-8 shadow-xl">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-indigo-400">
                 <ShieldAlert size={28} />
              </div>
              <div className="space-y-4">
                 <h3 className="text-2xl font-bold">Privacy Policy</h3>
                 <p className="text-sm text-slate-400 leading-relaxed font-medium">
                    Your institutional profile is protected by enterprise-grade encryption. Personal data is only visible to authorized HR and IT personnel.
                 </p>
              </div>
              <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                 <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Security Level</div>
                 <div className="font-black text-rose-500">CLASS-A (ELITE)</div>
              </div>
           </div>

           <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                 <Zap size={20} className="text-amber-500" />
                 Quick Access Roles
              </h3>
              <div className="space-y-4">
                 {[
                   { label: 'Register as Teacher', icon: Briefcase, color: 'bg-indigo-600' },
                   { label: 'Register as Student', icon: User, color: 'bg-emerald-600' }
                 ].map((role, i) => (
                    <button key={i} className="w-full p-4 bg-slate-50 rounded-2xl flex items-center gap-3 hover:bg-indigo-600 hover:text-white transition-all group">
                       <div className={`w-10 h-10 ${role.color} text-white rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                          <role.icon size={20} />
                       </div>
                       <span className="font-bold text-sm">{role.label}</span>
                    </button>
                 ))}
              </div>
           </div>
        </div>
      </div>

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-10 space-y-8 text-center">
                <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-[28px] flex items-center justify-center mx-auto">
                   <ShieldAlert size={40} />
                </div>
                <div className="space-y-2">
                   <h2 className="text-2xl font-bold text-slate-900">Security Verification</h2>
                   <p className="text-sm text-slate-500 font-medium">Please enter the 7-digit code generated by the institutional kernel (ID: {otpId})</p>
                </div>

                {verified ? (
                   <div className="p-6 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 flex items-center justify-center gap-2 animate-in zoom-in-50 duration-500">
                      <CheckCircle2 size={24} />
                      <span className="font-black uppercase tracking-widest text-sm">Identity Confirmed</span>
                   </div>
                ) : (
                   <div className="space-y-6">
                      <input 
                        type="text" 
                        maxLength={7}
                        className="w-full text-center tracking-[0.5em] py-5 bg-slate-50 border border-slate-100 rounded-[24px] font-black text-3xl outline-none focus:ring-4 focus:ring-rose-50 focus:bg-white transition-all"
                        placeholder="0000000"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                      />
                      <button 
                        onClick={handleVerify}
                        disabled={loading || otpCode.length < 7}
                        className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black text-xl flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                      >
                         {loading ? <Loader2 size={24} className="animate-spin" /> : <ShieldCheck size={24} />}
                         Verify & Proceed
                      </button>
                      <button className="text-xs font-bold text-slate-400 hover:text-indigo-600 flex items-center justify-center gap-2 mx-auto">
                         <RefreshCcw size={14} />
                         Resend Code
                      </button>
                   </div>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
