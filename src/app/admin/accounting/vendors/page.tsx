"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Plus,
    Search,
    Loader2,
    Truck,
    Phone,
    Mail,
    Building2,
    CheckCircle2,
    XCircle,
    MoreVertical,
    MapPin,
    CreditCard
} from "lucide-react";
import { getVendors, createVendor, updateVendorStatus } from "@/actions/vendors";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function VendorsPage() {
    const [vendorsList, setVendorsList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Form State
    const [name, setName] = useState("");
    const [contact, setContact] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [taxId, setTaxId] = useState("");
    const [bankName, setBankName] = useState("");
    const [accountNo, setAccountNo] = useState("");
    const [category, setCategory] = useState("General");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const data = await getVendors();
        setVendorsList(data);
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        const res = await createVendor({
            name,
            contactPerson: contact,
            email,
            phone,
            address,
            taxId,
            bankName,
            accountNumber: accountNo,
            category
        });
        if (res.success) {
            setIsAdding(false);
            fetchData();
            // Clear form
            setName(""); setContact(""); setEmail(""); setPhone(""); setAddress("");
            setTaxId(""); setBankName(""); setAccountNo("");
        } else {
            alert(res.error);
        }
        setSubmitting(false);
    };

    const handleToggleStatus = async (id: number, current: boolean) => {
        const res = await updateVendorStatus(id, !current);
        if (res.success) fetchData();
    };

    const filteredVendors = vendorsList.filter(v =>
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-transparent">
      <div className="max-w-[1600px] w-full mx-auto space-y-10 text-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 text-white rounded-[3rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden border border-slate-800">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/30 to-slate-600/30 opacity-50 mix-blend-overlay" />
            <div className="relative z-10">
                <div className="flex items-center gap-4 mb-2">
                    <Truck className="w-12 h-12 text-indigo-400 drop-shadow-md" />
                    <h2 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase italic drop-shadow-md">
                        Approved Vendors
                    </h2>
                </div>
                <p className="text-slate-300 font-medium mt-1 uppercase text-sm tracking-wide opacity-90">
                    Supplier directory, category tagging, and payment profiles
                </p>
            </div>
            
            <div className="relative z-10 flex gap-4 w-full md:w-auto items-center">
                <div className="relative flex-1 md:w-64">
                    <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-[1.5rem] text-sm font-bold text-white placeholder-slate-400 focus:bg-white focus:text-slate-900 focus:placeholder-slate-400 outline-none transition-all shadow-inner"
                        placeholder="Search suppliers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button
                    onClick={() => setIsAdding(!isAdding)}
                    className="bg-indigo-600 border border-indigo-500/50 hover:bg-indigo-700 text-white px-8 py-6 rounded-[1.5rem] font-black uppercase text-xs tracking-wider shadow-lg active:scale-95 transition-all gap-2 shrink-0"
                >
                    <Plus className="w-4 h-4" />
                    Add Vendor
                </Button>
            </div>
        </div>

        {isAdding && (
            <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] overflow-hidden animate-in slide-in-from-top-8 duration-500">
                <CardHeader className="p-8 lg:p-10 border-b border-white/40 bg-white/40">
                    <CardTitle className="text-2xl font-black text-slate-900 italic tracking-tight uppercase">Register New Supplier</CardTitle>
                </CardHeader>
                <CardContent className="p-8 lg:p-10">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Vendor Name</label>
                                <input required className="w-full px-5 py-3 rounded-[1.2rem] border border-white/60 bg-white/60 focus:bg-white focus:ring-4 focus:ring-indigo-500/20 outline-none font-bold transition-all shadow-inner text-slate-800" value={name} onChange={e => setName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Contact Person</label>
                                <input className="w-full px-5 py-3 rounded-[1.2rem] border border-white/60 bg-white/60 focus:bg-white focus:ring-4 focus:ring-indigo-500/20 outline-none font-bold transition-all shadow-inner text-slate-800" value={contact} onChange={e => setContact(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Email</label>
                                <input type="email" className="w-full px-5 py-3 rounded-[1.2rem] border border-white/60 bg-white/60 focus:bg-white focus:ring-4 focus:ring-indigo-500/20 outline-none font-bold transition-all shadow-inner text-slate-800" value={email} onChange={e => setEmail(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Phone</label>
                                <input className="w-full px-5 py-3 rounded-[1.2rem] border border-white/60 bg-white/60 focus:bg-white focus:ring-4 focus:ring-indigo-500/20 outline-none font-bold transition-all shadow-inner text-slate-800" value={phone} onChange={e => setPhone(e.target.value)} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Address</label>
                                <input className="w-full px-5 py-3 rounded-[1.2rem] border border-white/60 bg-white/60 focus:bg-white focus:ring-4 focus:ring-indigo-500/20 outline-none font-bold transition-all shadow-inner text-slate-800 h-[52px]" value={address} onChange={e => setAddress(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Category</label>
                                <select className="w-full px-5 py-3 rounded-[1.2rem] border border-white/60 bg-white/60 focus:bg-white focus:ring-4 focus:ring-indigo-500/20 outline-none font-bold transition-all shadow-inner text-slate-800 h-[52px]" value={category} onChange={e => setCategory(e.target.value)}>
                                    <option value="General">General</option>
                                    <option value="Stationery">Stationery</option>
                                    <option value="IT Services">IT Services</option>
                                    <option value="Construction">Construction</option>
                                    <option value="Logistics">Logistics</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t pt-6 border-white/60">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Tax ID / TIN</label>
                                <input className="w-full px-5 py-3 rounded-[1.2rem] border border-white/60 bg-white/60 focus:bg-white focus:ring-4 focus:ring-indigo-500/20 outline-none font-bold transition-all shadow-inner text-slate-800" value={taxId} onChange={e => setTaxId(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Bank Name</label>
                                <input className="w-full px-5 py-3 rounded-[1.2rem] border border-white/60 bg-white/60 focus:bg-white focus:ring-4 focus:ring-indigo-500/20 outline-none font-bold transition-all shadow-inner text-slate-800" value={bankName} onChange={e => setBankName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Account Number</label>
                                <input className="w-full px-5 py-3 rounded-[1.2rem] border border-white/60 bg-white/60 focus:bg-white focus:ring-4 focus:ring-indigo-500/20 outline-none font-bold transition-all shadow-inner text-slate-800" value={accountNo} onChange={e => setAccountNo(e.target.value)} />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button 
                              type="submit" 
                              disabled={submitting} 
                              className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-wider shadow-lg active:scale-95 transition-all"
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Register Vendor"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {loading ? (
                <div className="lg:col-span-2 py-20 text-center">
                    <Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-600" />
                </div>
            ) : filteredVendors.length === 0 ? (
                <div className="lg:col-span-2 py-20 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">No vendors found.</div>
            ) : (
                filteredVendors.map(vendor => (
                    <Card key={vendor.id} className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] overflow-hidden group hover:shadow-2xl transition-all h-full flex flex-col justify-between">
                        <CardContent className="p-8 flex flex-col justify-between h-full space-y-6">
                            <div>
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-4 items-center">
                                        <div className="w-14 h-14 bg-indigo-600/90 border border-indigo-500/50 text-white rounded-[1.2rem] flex items-center justify-center shadow-lg shadow-indigo-500/10 shrink-0">
                                            <Truck className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{vendor.name}</h4>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 bg-white/80 border border-white/60 text-slate-500 rounded-md shadow-sm">{vendor.category}</span>
                                                {vendor.isActive ? (
                                                    <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-md shadow-sm">Active</span>
                                                ) : (
                                                    <span className="bg-slate-100 text-slate-400 border border-slate-200 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-md shadow-sm">Inactive</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="h-10 w-10 rounded-xl p-0 flex items-center justify-center bg-white/80 border-white/60 hover:bg-white hover:border-indigo-400 transition-all shadow-sm active:scale-95"
                                        onClick={() => handleToggleStatus(vendor.id, vendor.isActive)}
                                    >
                                        {vendor.isActive ? <XCircle className="w-5 h-5 text-slate-400" /> : <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                    <div className="flex items-center gap-3 text-sm text-slate-600 font-bold">
                                        <Mail className="w-4 h-4 text-indigo-500 shrink-0" />
                                        {vendor.email || "No email"}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-slate-600 font-bold">
                                        <Phone className="w-4 h-4 text-indigo-500 shrink-0" />
                                        {vendor.phone || "No phone"}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-slate-600 font-bold md:col-span-2">
                                        <MapPin className="w-4 h-4 text-indigo-500 shrink-0" />
                                        <span className="truncate">{vendor.address || "No address provided"}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/40 p-5 rounded-[1.5rem] flex items-center justify-between border border-white/60 shadow-inner">
                                <div className="flex items-center gap-3">
                                    <CreditCard className="w-6 h-6 text-slate-400" />
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Bank Details</p>
                                        <p className="text-sm font-black text-slate-700">{vendor.bankName || "No Bank"} | {vendor.accountNumber || "N/A"}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tax ID</p>
                                    <p className="text-xs font-mono font-black text-slate-600 mt-0.5">{vendor.taxId || "Not Set"}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))
            )}
        </div>
      </div>
    </div>
  );
}
