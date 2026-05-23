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
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight text-center">Approved Vendors</h2>
                    <p className="text-slate-500 mt-1">Institutional supplier directory and payment profiles</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            placeholder="Search suppliers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button
                        onClick={() => setIsAdding(!isAdding)}
                        className="bg-indigo-600 hover:bg-indigo-700 h-10 px-5 rounded-xl shadow-lg shadow-indigo-500/20 gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add Vendor
                    </Button>
                </div>
            </div>

            {isAdding && (
                <Card className="mb-10 border-none shadow-md bg-slate-50 border border-slate-100">
                    <CardHeader>
                        <CardTitle className="text-lg">Register New Supplier</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Vendor Name</label>
                                    <input required className="w-full px-4 py-2 rounded-lg border border-slate-200" value={name} onChange={e => setName(e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Contact Person</label>
                                    <input className="w-full px-4 py-2 rounded-lg border border-slate-200" value={contact} onChange={e => setContact(e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                                    <input type="email" className="w-full px-4 py-2 rounded-lg border border-slate-200" value={email} onChange={e => setEmail(e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Phone</label>
                                    <input className="w-full px-4 py-2 rounded-lg border border-slate-200" value={phone} onChange={e => setPhone(e.target.value)} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Address</label>
                                    <input className="w-full px-4 py-2 rounded-lg border border-slate-200" value={address} onChange={e => setAddress(e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                                    <select className="w-full px-4 py-2 rounded-lg border border-slate-200 h-10" value={category} onChange={e => setCategory(e.target.value)}>
                                        <option value="General">General</option>
                                        <option value="Stationery">Stationery</option>
                                        <option value="IT Services">IT Services</option>
                                        <option value="Construction">Construction</option>
                                        <option value="Logistics">Logistics</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t pt-6 border-slate-200">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Tax ID / TIN</label>
                                    <input className="w-full px-4 py-2 rounded-lg border border-slate-200" value={taxId} onChange={e => setTaxId(e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Bank Name</label>
                                    <input className="w-full px-4 py-2 rounded-lg border border-slate-200" value={bankName} onChange={e => setBankName(e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Account Number</label>
                                    <input className="w-full px-4 py-2 rounded-lg border border-slate-200" value={accountNo} onChange={e => setAccountNo(e.target.value)} />
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button type="submit" disabled={submitting} className="bg-slate-900 px-10 h-11">
                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Registry Vendor"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {loading ? (
                    <div className="lg:col-span-2 py-20 text-center">
                        <Loader2 className="w-10 h-10 animate-spin mx-auto text-slate-300" />
                    </div>
                ) : filteredVendors.length === 0 ? (
                    <div className="lg:col-span-2 py-20 text-center text-slate-400 italic">No vendors found.</div>
                ) : (
                    filteredVendors.map(vendor => (
                        <Card key={vendor.id} className="border-none shadow-sm hover:shadow-md transition-all group border border-slate-50">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex gap-4">
                                        <div className="p-4 bg-indigo-50 rounded-2xl">
                                            <Truck className="w-6 h-6 text-indigo-600" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">{vendor.name}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="outline" className="text-[10px] uppercase font-bold text-slate-400 border-slate-200">{vendor.category}</Badge>
                                                {vendor.isActive ? (
                                                    <Badge className="bg-green-50 text-green-600 border-none text-[10px] font-bold">Active</Badge>
                                                ) : (
                                                    <Badge className="bg-slate-100 text-slate-400 border-none text-[10px] font-bold">Inactive</Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="h-8 w-8 rounded-lg p-0 flex items-center justify-center"
                                        onClick={() => handleToggleStatus(vendor.id, vendor.isActive)}
                                    >
                                        {vendor.isActive ? <XCircle className="w-4 h-4 text-slate-400" /> : <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                                        <Mail className="w-4 h-4 opacity-40" />
                                        {vendor.email || "No email"}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                                        <Phone className="w-4 h-4 opacity-40" />
                                        {vendor.phone || "No phone"}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-slate-500 font-medium md:col-span-2">
                                        <MapPin className="w-4 h-4 opacity-40 shrink-0" />
                                        <span className="truncate">{vendor.address || "No address provided"}</span>
                                    </div>
                                </div>

                                <div className="bg-slate-50 p-4 rounded-xl flex items-center justify-between border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <CreditCard className="w-5 h-5 text-slate-400" />
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Bank Details</p>
                                            <p className="text-sm font-bold text-slate-700">{vendor.bankName || "No Bank"} | {vendor.accountNumber || "N/A"}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Tax ID</p>
                                        <p className="text-xs font-mono font-bold text-slate-500">{vendor.taxId || "Not Set"}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
