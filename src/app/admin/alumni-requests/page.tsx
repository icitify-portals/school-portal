"use client";

import React, { useState, useEffect } from "react";
import { getAlumniRequests, updateAlumniRequestStatus } from "@/actions/alumni-requests";
import { Loader2, GraduationCap, MapPin, Search, CheckCircle, RefreshCcw } from "lucide-react";

export default function AdminAlumniRequestsPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState("all");
    const [processingId, setProcessingId] = useState<number | null>(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    async function fetchRequests() {
        setLoading(true);
        const res = await getAlumniRequests();
        if (res.success && res.data) {
            setRequests(res.data);
        } else {
            setError(res.error || "Failed to load requests.");
        }
        setLoading(false);
    }

    async function handleStatusUpdate(id: number, status: "pending" | "approved" | "fulfilled" | "rejected") {
        setProcessingId(id);
        await updateAlumniRequestStatus(id, status);
        fetchRequests();
        setProcessingId(null);
    }

    const filteredRequests = requests.filter(r => {
        if (filter === "all") return true;
        if (filter === "paid") return r.paymentStatus === "paid";
        if (filter === "unpaid") return r.paymentStatus !== "paid";
        if (filter === "pending") return r.approvalStatus === "pending";
        if (filter === "fulfilled") return r.approvalStatus === "fulfilled";
        return true;
    });

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold mb-1 flex items-center gap-2"><GraduationCap className="text-amber-500"/> Alumni Certificate Requests</h1>
                    <p className="text-slate-500">Manage certificate requests from graduated legacy students.</p>
                </div>
                <button onClick={fetchRequests} disabled={loading} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
                    <RefreshCcw className={`w-5 h-5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium">
                    {error}
                </div>
            )}

            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {['all', 'paid', 'unpaid', 'pending', 'fulfilled'].map(f => (
                    <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider ${filter === f ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
                        {f}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-xs">
                            <tr>
                                <th className="p-4">Applicant</th>
                                <th className="p-4">Academics</th>
                                <th className="p-4">Delivery</th>
                                <th className="p-4">Payment</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && requests.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-500">Loading requests...</td></tr>
                            ) : filteredRequests.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-500">No requests found matching criteria.</td></tr>
                            ) : filteredRequests.map(req => (
                                <tr key={req.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                    <td className="p-4">
                                        <div className="font-bold text-slate-800">{req.applicantName}</div>
                                        <div className="text-slate-500 text-xs">{req.email} • {req.phone}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-indigo-700">{req.matricNumber}</div>
                                        <div className="text-slate-500 text-xs">{req.programmeType} • {req.department} • {req.yearOfGraduation}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="uppercase text-xs font-bold bg-slate-100 inline-block px-2 py-1 rounded text-slate-600">{req.deliveryMethod}</div>
                                        {req.deliveryMethod === 'courier' && req.deliveryAddress && (
                                            <div className="text-xs text-slate-500 mt-1 max-w-[200px] truncate" title={req.deliveryAddress}>
                                                <MapPin className="inline w-3 h-3"/> {req.deliveryAddress}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {req.paymentStatus === 'paid' ? (
                                            <span className="text-emerald-700 bg-emerald-100 px-2 py-1 rounded text-xs font-bold">PAID</span>
                                        ) : (
                                            <span className="text-rose-700 bg-rose-100 px-2 py-1 rounded text-xs font-bold uppercase">{req.paymentStatus}</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${req.approvalStatus === 'fulfilled' ? 'bg-emerald-100 text-emerald-700' : req.approvalStatus === 'approved' ? 'bg-blue-100 text-blue-700' : req.approvalStatus === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {req.approvalStatus}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <select 
                                            disabled={processingId === req.id}
                                            className="p-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none"
                                            value={req.approvalStatus}
                                            onChange={(e) => handleStatusUpdate(req.id, e.target.value as any)}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="approved">Approved</option>
                                            <option value="fulfilled">Fulfilled</option>
                                            <option value="rejected">Rejected</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
