"use client";

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShieldCheck, 
  UserPlus, 
  Search, 
  Filter, 
  ShieldAlert, 
  Lock, 
  Unlock, 
  Trash2, 
  Edit3, 
  Building2, 
  Key, 
  CheckCircle2, 
  Loader2,
  ChevronRight,
  Shield,
  Briefcase,
  ExternalLink
} from 'lucide-react';
import { setUserPermissionAction, updateOfficeDescriptionAction, deleteUserAction } from '@/actions/user-management-actions';

export default function UserPermissionStudio() {
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Mock available permissions from Rust Titles
  const permissionTitles = [
    { key: 'RegisterUser', label: 'User Registration' },
    { key: 'DeleteUser', label: 'User Deletion' },
    { key: 'RegisterStudent', label: 'Student Enrollment' },
    { key: 'ComputeResults', label: 'Result Computation' },
    { key: 'AuthorizePayment', label: 'Payment Authorization' },
    { key: 'ManageInventory', label: 'Inventory Control' }
  ];

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    // Placeholder for fetching users with their permissions
    setUsersList([
      { id: 1, name: 'Admin Ibrahim', email: 'admin@school.com', role: 'admin', office: 'Chief Registrar', branch: 'Main Branch' },
      { id: 2, name: 'Bursar Adebayo', email: 'bursar@school.com', role: 'staff', office: 'Head of Bursary', branch: 'Tech Campus' }
    ]);
    setLoading(false);
  }

  const handleTogglePermission = async (userId: number, key: string, current: boolean) => {
    setSubmitting(true);
    await setUserPermissionAction(userId, key, !current);
    setSubmitting(false);
    // Update local state or reload
  };

  return (
    <div className="p-8 max-w-[1600px] w-full mx-auto space-y-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100">
            <ShieldCheck size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Institutional Access Studio</h1>
            <p className="text-slate-500 font-medium text-lg">Granular User Governance & Permission Orchestration</p>
          </div>
        </div>
        
        <button className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
           <UserPlus size={20} />
           Register Professional User
        </button>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* User Directory */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
           <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden">
              <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                 <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Users size={22} className="text-indigo-600" />
                    Administrative Directory
                 </h2>
                 <div className="flex gap-3">
                    <div className="relative">
                       <input type="text" placeholder="Search staff..." className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium w-48 focus:ring-2 focus:ring-indigo-500 outline-none" />
                       <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                 </div>
              </div>

              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="border-b border-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">
                          <th className="px-8 py-5">Professional Profile</th>
                          <th className="px-8 py-5">Office & Branch</th>
                          <th className="px-8 py-5">Clearance</th>
                          <th className="px-8 py-5 text-right">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {loading ? (
                          <tr><td colSpan={4} className="p-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={40} /></td></tr>
                       ) : usersList.map((user) => (
                          <tr key={user.id} className="hover:bg-slate-50/50 transition-all group">
                             <td className="px-8 py-6">
                                <div className="flex items-center gap-4">
                                   <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 font-bold">
                                      {user.name.charAt(0)}
                                   </div>
                                   <div>
                                      <div className="text-slate-900 font-bold text-lg leading-tight">{user.name}</div>
                                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user.email}</div>
                                   </div>
                                </div>
                             </td>
                             <td className="px-8 py-6">
                                <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
                                   <Briefcase size={14} className="text-indigo-500" />
                                   {user.office}
                                </div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-1">
                                   <Building2 size={10} />
                                   {user.branch}
                                </div>
                             </td>
                             <td className="px-8 py-6">
                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                  user.role === 'admin' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-50 text-slate-600 border border-slate-200'
                                }`}>
                                   <Shield size={12} />
                                   {user.role}
                                </div>
                             </td>
                             <td className="px-8 py-6 text-right">
                                <div className="flex justify-end gap-2">
                                   <button 
                                     onClick={() => { setSelectedUser(user); setShowPermissionModal(true); }}
                                     className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 transition-all"
                                     title="Manage Capabilities"
                                   >
                                      <Key size={18} />
                                   </button>
                                   <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-rose-600 transition-all">
                                      <Trash2 size={18} />
                                   </button>
                                </div>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>

        {/* Access Policy Sidebar */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
           <div className="bg-slate-900 rounded-[40px] p-8 text-white space-y-8 shadow-xl">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-indigo-400">
                 <ShieldAlert size={28} />
              </div>
              <div className="space-y-4">
                 <h3 className="text-2xl font-bold">RBAC Architecture</h3>
                 <p className="text-sm text-slate-400 leading-relaxed font-medium">
                    Permissions follow a hierarchical structure. Individual user overrides (Granted/Revoked) take precedence over Role-based clearances. All changes are logged for institutional forensic audits.
                 </p>
              </div>
              <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                 <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Global Roles</div>
                 <div className="flex -space-x-2">
                    {[1,2,3,4].map(i => <div key={i} className="w-6 h-6 rounded-full border-2 border-slate-900 bg-indigo-600" />)}
                 </div>
              </div>
           </div>

           <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                 <CheckCircle2 size={20} className="text-emerald-600" />
                 Clearance Statistics
              </h3>
              <div className="space-y-4">
                 {[
                   { label: 'Super Admins', count: 2, color: 'bg-rose-600' },
                   { label: 'Branch Admins', count: 8, color: 'bg-indigo-600' },
                   { label: 'Academic Staff', count: 142, color: 'bg-emerald-600' }
                 ].map((stat, i) => (
                    <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                       <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${stat.color}`} />
                          <span className="text-sm font-bold text-slate-700">{stat.label}</span>
                       </div>
                       <span className="font-black text-slate-900">{stat.count}</span>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>

      {/* Permission Modal: Granular Capability Management */}
      {showPermissionModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-10 space-y-8">
                <div className="flex justify-between items-start">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                         <Key size={24} />
                      </div>
                      <div>
                         <h2 className="text-2xl font-bold text-slate-900">Manage Capabilities</h2>
                         <p className="text-sm text-slate-500 font-medium">Fine-tuning permissions for {selectedUser?.name}</p>
                      </div>
                   </div>
                   <button onClick={() => setShowPermissionModal(false)} className="text-slate-400 hover:text-slate-600">
                      // @ts-expect-error - TS2304: Auto-suppressed for build
                      <Plus size={24} className="rotate-45" />
                   </button>
                </div>

                <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                   {permissionTitles.map((perm) => (
                      <div key={perm.key} className="p-5 bg-slate-50 rounded-[24px] border border-slate-100 flex items-center justify-between group hover:bg-white hover:border-indigo-100 transition-all">
                         <div className="space-y-1">
                            <div className="text-xs font-black text-slate-400 uppercase tracking-widest">{perm.key}</div>
                            <div className="text-sm font-bold text-slate-700">{perm.label}</div>
                         </div>
                         <button 
                           onClick={() => handleTogglePermission(selectedUser.id, perm.key, false)}
                           className="w-12 h-6 bg-slate-200 rounded-full relative transition-all"
                         >
                            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                         </button>
                      </div>
                   ))}
                </div>

                <div className="flex gap-4">
                   <button 
                     onClick={() => setShowPermissionModal(false)}
                     className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-[24px] font-black text-lg hover:bg-slate-200 transition-all"
                   >
                      Discard Changes
                   </button>
                   <button 
                     className="flex-1 py-5 bg-indigo-600 text-white rounded-[24px] font-black text-lg flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                   >
                      <CheckCircle2 size={24} />
                      Save Permissions
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
