"use client";

import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  User, 
  ChevronRight,
  Loader2,
  Mail,
  Zap,
  Lock,
  ArrowLeft
} from 'lucide-react';
import { getAllUsers } from '@/actions/user-actions';
import { elevateUserRole } from '@/actions/super_admin';

const ROLES = [
  { id: 'admin', label: 'Administrator', desc: 'Standard administrative access' },
  { id: 'superadmin', label: 'Super-Admin', desc: 'Full institutional authority' },
  { id: 'icitify_dev', label: 'Icitify Developer', desc: 'System hooks & dynamic logic access' },
  { id: 'staff', label: 'Academic/Non-Academic Staff', desc: 'Standard staff access' },
  { id: 'student', label: 'Student', desc: 'Student portal access' },
];

export default function RoleManagerPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [usersList, setUsersList] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  async function handleSearch(term: string) {
    setLoading(true);
    const res = await getAllUsers({ search: term, pageSize: 5 });
    if (res.success) setUsersList(res.data);
    setLoading(false);
  }

  useEffect(() => {
    if (searchTerm.length > 2) {
      const timer = setTimeout(() => handleSearch(searchTerm), 500);
      return () => clearTimeout(timer);
    } else {
      setUsersList([]);
    }
  }, [searchTerm]);

  const handleElevate = async (role: any) => {
    if (!selectedUser) return;
    setUpdating(true);
    const res = await elevateUserRole(selectedUser.id, role);
    setUpdating(false);
    
    if (res.success) {
      setMessage({ type: 'success', text: `User ${selectedUser.name} is now a ${role}.` });
      setSelectedUser({ ...selectedUser, role });
      // Refresh list
      handleSearch(searchTerm);
    } else {
      setMessage({ type: 'error', text: res.error || 'Elevation failed.' });
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 bg-slate-50 min-h-screen">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
          <ShieldAlert size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Institutional Role Manager</h1>
          <p className="text-slate-500 font-medium">Elevate accounts and manage system clearances</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: User Selection */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Search size={20} className="text-indigo-500" />
              Find User Account
            </h2>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search by name or email..."
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-2 mt-4">
              {loading ? (
                <div className="p-10 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <Loader2 size={24} className="animate-spin text-indigo-500" />
                  <span className="text-sm font-medium">Searching institutional records...</span>
                </div>
              ) : usersList.length > 0 ? (
                usersList.map((user) => (
                  <button 
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className={`w-full p-4 rounded-2xl border flex items-center justify-between group transition-all ${
                      selectedUser?.id === user.id ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500/10' : 'bg-white border-slate-100 hover:border-indigo-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold group-hover:bg-white transition-colors">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-slate-900 font-bold tracking-tight">{user.name}</div>
                        <div className="text-slate-400 text-xs flex items-center gap-1">
                          <Mail size={12} />
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                       <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Current Role</span>
                       <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                         {user.role}
                       </span>
                    </div>
                  </button>
                ))
              ) : searchTerm.length > 2 && (
                <div className="p-8 text-center text-slate-400">
                  <User size={40} className="mx-auto opacity-20 mb-2" />
                  <p className="text-sm">No user found matching "{searchTerm}"</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-indigo-900 p-8 rounded-2xl text-white relative overflow-hidden group">
            <Zap className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold mb-2">Security Note</h3>
            <p className="text-indigo-200 text-sm leading-relaxed">
              Elevating an account to <span className="text-white font-bold">superadmin</span> or <span className="text-white font-bold">icitify_dev</span> grants extensive access to system-level operations. 
              Always verify the user's identity before proceeding with institutional elevation.
            </p>
          </div>
        </div>

        {/* Right: Elevation Details */}
        <div className="space-y-6">
          {selectedUser ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-xl space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 text-2xl font-bold shadow-inner">
                  {selectedUser.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{selectedUser.name}</h2>
                  <p className="text-slate-500 font-medium">{selectedUser.email}</p>
                </div>
              </div>

              {message && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 font-semibold text-sm ${
                  message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}>
                  {message.type === 'success' ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
                  {message.text}
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Lock size={14} />
                  Available Elevation Targets
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {ROLES.map((role) => (
                    <button
                      key={role.id}
                      onClick={() => handleElevate(role.id)}
                      disabled={updating || selectedUser.role === role.id}
                      className={`p-4 rounded-2xl border text-left flex items-center justify-between group transition-all ${
                        selectedUser.role === role.id 
                        ? 'bg-slate-50 border-slate-100 cursor-not-allowed opacity-60' 
                        : 'bg-white border-slate-100 hover:border-indigo-600 hover:bg-indigo-50/30'
                      }`}
                    >
                      <div>
                        <div className="text-slate-900 font-bold group-hover:text-indigo-600 transition-colors">{role.label}</div>
                        <div className="text-slate-400 text-xs">{role.desc}</div>
                      </div>
                      {updating ? (
                        <Loader2 className="animate-spin text-slate-300" size={20} />
                      ) : selectedUser.role === role.id ? (
                        <ShieldCheck className="text-emerald-500" size={20} />
                      ) : (
                        <ChevronRight className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" size={20} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-20 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-4 opacity-50">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                <User size={40} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">No Selection</h3>
                <p className="text-slate-500">Search and select a user account to manage their institutional roles.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
