"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Plus,
    Trash2,
    Loader2,
    FileText,
    CheckCircle2,
    XCircle,
    Paperclip,
    Calendar,
    DollarSign,
    User,
    Building2,
    ArrowUpRight,
    Truck,
    Hash,
    Sparkles,
    Zap
} from "lucide-react";
import {
    getExpenditureRequests,
    createExpenditureRequest,
    approveExpenditureRequest,
    disburseExpenditure
} from "@/actions/bursary";
import { parseInvoiceWithAI, suggestGLAccount } from "@/actions/ai";
import { getVendors } from "@/actions/vendors";
import { getCOA } from "@/actions/accounting";
import { getDepartments } from "@/actions/departments";
import { getFaculties } from "@/actions/faculties";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function ExpenditurePage() {
    const { data: session } = useSession();
    const role = (session?.user as any)?.role;
    const isBursar = (session?.user as any)?.roles?.includes("bursar") || role === "admin";

    const [requests, setRequests] = useState<any[]>([]);
    const [depts, setDepts] = useState<any[]>([]);
    const [faculties, setFaculties] = useState<any[]>([]);
    const [vendors, setVendors] = useState<any[]>([]);
    const [coa, setCoa] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [scanningAI, setScanningAI] = useState(false);
    const [suggestingAI, setSuggestingAI] = useState<number | null>(null);
    const [approvalAccounts, setApprovalAccounts] = useState<{ [key: number]: string }>({});
    const [aiSuggestions, setAiSuggestions] = useState<{ [key: number]: any[] }>({});

    // Form State
    const [title, setTitle] = useState("");
    const [purpose, setPurpose] = useState("");
    const [amount, setAmount] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [selectedDept, setSelectedDept] = useState("");
    const [selectedFac, setSelectedFac] = useState("");
    const [selectedVendor, setSelectedVendor] = useState("");
    const [attachmentUrl, setAttachmentUrl] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const [reqData, deptData, facData, vendorData, coaData] = await Promise.all([
            getExpenditureRequests(),
            getDepartments(),
            getFaculties(),
            getVendors(),
            getCOA()
        ]);
        setRequests(reqData);
        setDepts(deptData);
        setFaculties(facData);
        setVendors(vendorData);
        setCoa(coaData);
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const userId = (session?.user as any)?.id;
        if (!userId) return alert("User session not found");

        setSubmitting(true);
        const res = await createExpenditureRequest({
            title,
            purpose,
            amount,
            requestedBy: parseInt(userId),
            departmentId: selectedDept ? parseInt(selectedDept) : undefined,
            facultyId: selectedFac ? parseInt(selectedFac) : undefined,
            vendorId: selectedVendor ? parseInt(selectedVendor) : undefined,
            dueDate: dueDate ? new Date(dueDate) : undefined,
            attachmentUrl: attachmentUrl || undefined
        });

        if (res.success) {
            setTitle("");
            setPurpose("");
            setAmount("");
            setDueDate("");
            setIsAdding(false);
            fetchData();
        } else {
            alert(res.error);
        }
        setSubmitting(false);
    };

    const handleAIScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setScanningAI(true);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64 = reader.result as string;
                const res = await parseInvoiceWithAI(base64);

                if (res.success && res.data) {
                    const data = res.data;
                    if (data.title) setTitle(data.title);
                    if (data.amount) setAmount(data.amount.toString());
                    if (data.purpose) setPurpose(data.purpose);

                    // Try to match vendor if name is provided
                    if (data.vendorName) {
                        const matchedVendor = vendors.find(v =>
                            v.name.toLowerCase().includes(data.vendorName.toLowerCase())
                        );
                        if (matchedVendor) setSelectedVendor(matchedVendor.id.toString());
                    }
                } else {
                    alert(res.error || "AI failed to parse the invoice.");
                }
                setScanningAI(false);
            };
        } catch (err) {
            console.error("OCR Client Error:", err);
            setScanningAI(false);
            alert("Failed to process image.");
        }
    };

    const handleApprove = async (id: number) => {
        const userId = (session?.user as any)?.id;
        if (!userId) return;
        const glAccountId = approvalAccounts[id] ? parseInt(approvalAccounts[id]) : undefined;
        const res = await approveExpenditureRequest(id, parseInt(userId), glAccountId);
        if (res.success) fetchData();
        else alert(res.error);
    };

    const handleSuggestAccount = async (id: number, title: string, purpose: string) => {
        setSuggestingAI(id);
        const res = await suggestGLAccount(`${title}: ${purpose}`);
        if (res.success && res.data) {
            setAiSuggestions(prev => ({ ...prev, [id]: res.data }));
            if (res.data.length > 0) {
                setApprovalAccounts(prev => ({ ...prev, [id]: res.data[0].accountId.toString() }));
            }
        }
        setSuggestingAI(null);
    };

    const handleDisburse = async (id: number) => {
        const res = await disburseExpenditure(id);
        if (res.success) fetchData();
        else alert(res.error);
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Fund Outflow</h2>
                    <p className="text-slate-500 mt-1">Manage expenditure requests and disbursements</p>
                </div>
                <Button
                    onClick={() => setIsAdding(!isAdding)}
                    className="bg-indigo-600 hover:bg-indigo-700 h-11 px-6 rounded-xl shadow-lg shadow-indigo-500/20 gap-2"
                >
                    <Plus className="w-4 h-4" />
                    New Request
                </Button>
            </div>

            {isAdding && (
                <Card className="mb-10 border-none shadow-md bg-slate-50">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">New Expenditure Request</CardTitle>
                        <div className="flex gap-2">
                            <input
                                type="file"
                                id="ai-ocr-upload"
                                className="hidden"
                                accept="image/*"
                                onChange={handleAIScan}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                disabled={scanningAI}
                                onClick={() => document.getElementById('ai-ocr-upload')?.click()}
                                className="h-9 rounded-lg border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 gap-2 font-bold text-xs"
                            >
                                {scanningAI ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                {scanningAI ? "Analyzing..." : "Auto-fill with AI"}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Title / Subject</label>
                                    <input
                                        required
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200"
                                        placeholder="e.g. Department Lab Equipment"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Amount (NGN)</label>
                                    <div className="relative">
                                        <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            required
                                            type="number"
                                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200"
                                            placeholder="500000"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Purpose / Detailed Description</label>
                                <textarea
                                    required
                                    rows={3}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200"
                                    placeholder="Describe the need for these funds..."
                                    value={purpose}
                                    onChange={(e) => setPurpose(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Department (Optional)</label>
                                    <select
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 h-10"
                                        value={selectedDept}
                                        onChange={(e) => setSelectedDept(e.target.value)}
                                    >
                                        <option value="">N/A</option>
                                        {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Faculty (Optional)</label>
                                    <select
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 h-10"
                                        value={selectedFac}
                                        onChange={(e) => setSelectedFac(e.target.value)}
                                    >
                                        <option value="">N/A</option>
                                        {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Vendor / Supplier</label>
                                    <select
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 h-10"
                                        value={selectedVendor}
                                        onChange={(e) => setSelectedVendor(e.target.value)}
                                    >
                                        <option value="">N/A (Cash Advance)</option>
                                        {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Due Date</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 h-10"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Invoice Attachment (URL)</label>
                                <div className="relative">
                                    <Paperclip className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200"
                                        placeholder="https://link-to-invoice.pdf"
                                        value={attachmentUrl}
                                        onChange={(e) => setAttachmentUrl(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button type="submit" disabled={submitting} className="bg-slate-900 px-10 h-11">
                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Request"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="space-y-4">
                {loading ? (
                    <div className="py-20 text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-400" />
                    </div>
                ) : requests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                        <ArrowUpRight className="w-12 h-12 text-slate-300 mb-4" />
                        <h4 className="text-lg font-bold text-slate-400">No requests found</h4>
                        <p className="text-sm text-slate-400">Submit an expenditure request using the button above.</p>
                    </div>
                ) : (
                    requests.map((req) => (
                        <Card key={req.id} className="border-none shadow-sm overflow-hidden group">
                            <CardContent className="p-0">
                                <div className="flex flex-col lg:row divide-y lg:divide-y-0 lg:divide-x divide-slate-100 flex-wrap lg:flex-nowrap">
                                    <div className="p-6 flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="font-extrabold text-slate-900 text-xl">{req.title}</h3>
                                            <Badge className={cn(
                                                "text-[10px] h-fit",
                                                req.status === 'pending' ? "bg-amber-100 text-amber-700 hover:bg-amber-100" :
                                                    req.status === 'approved' ? "bg-green-100 text-green-700 hover:bg-green-100" :
                                                        req.status === 'disbursed' ? "bg-blue-100 text-blue-700 hover:bg-blue-100" :
                                                            "bg-red-100 text-red-700 hover:bg-red-100"
                                            )}>
                                                {req.status}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-slate-500 mb-4 line-clamp-2">{req.purpose}</p>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <User className="w-3 h-3" />
                                                <span>By: {req.requestedBy?.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <Building2 className="w-3 h-3" />
                                                <span>Dept: {req.department?.name || 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <Calendar className="w-3 h-3" />
                                                <span>Due: {req.dueDate ? new Date(req.dueDate).toLocaleDateString() : 'Immediate'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-indigo-600 font-bold">
                                                <Truck className="w-3 h-3" />
                                                <span>Vendor: {req.vendor?.name || 'Manual Disbursement'}</span>
                                            </div>
                                            {req.purchaseOrderNumber && (
                                                <div className="flex items-center gap-2 text-rose-600 font-bold">
                                                    <Hash className="w-3 h-3" />
                                                    <span>PO: {req.purchaseOrderNumber}</span>
                                                </div>
                                            )}
                                            {req.attachmentUrl && (
                                                <a href={req.attachmentUrl} target="_blank" className="flex items-center gap-2 text-indigo-600 hover:underline">
                                                    <Paperclip className="w-3 h-3" />
                                                    <span>View Attachment</span>
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-6 lg:w-48 bg-slate-50/50 flex flex-col justify-center items-center text-center">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Requested</p>
                                        <p className="text-2xl font-bold text-slate-900">{settings?.base_currency || '₦'}{parseFloat(req.amount).toLocaleString()}</p>
                                    </div>

                                    <div className="p-6 lg:w-72 flex flex-col justify-center gap-4">
                                        {isBursar && req.status === 'pending' && (
                                            <div className="space-y-3">
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase">GL Mapping</label>
                                                        <button
                                                            onClick={() => handleSuggestAccount(req.id, req.title, req.purpose)}
                                                            disabled={suggestingAI === req.id}
                                                            className="text-[10px] text-indigo-600 font-bold hover:underline flex items-center gap-1"
                                                        >
                                                            {suggestingAI === req.id ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Zap className="w-2.5 h-2.5" />}
                                                            Smart Suggest
                                                        </button>
                                                    </div>
                                                    <select
                                                        className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                                                        value={approvalAccounts[req.id] || ""}
                                                        onChange={(e) => setApprovalAccounts(prev => ({ ...prev, [req.id]: e.target.value }))}
                                                    >
                                                        <option value="">Select Account...</option>
                                                        {coa.filter(a => a.category === 'expense').map(a => (
                                                            <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {aiSuggestions[req.id] && (
                                                    <div className="bg-indigo-50 p-2 rounded-lg space-y-1 border border-indigo-100">
                                                        <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-tighter">AI Recommendations</p>
                                                        {aiSuggestions[req.id].map((s: any, idx: number) => (
                                                            <button
                                                                key={idx}
                                                                onClick={() => setApprovalAccounts(prev => ({ ...prev, [req.id]: s.accountId.toString() }))}
                                                                className="w-full text-left text-[10px] p-1 hover:bg-white rounded transition-colors flex justify-between items-center"
                                                            >
                                                                <span className="truncate">{s.accountName}</span>
                                                                <span className="text-[8px] bg-indigo-200 px-1 rounded text-indigo-700">{s.confidence}%</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                <Button
                                                    onClick={() => handleApprove(req.id)}
                                                    className="bg-green-600 hover:bg-green-700 w-full h-10 gap-2 font-bold shadow-lg shadow-green-500/20"
                                                >
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    Approve & Map
                                                </Button>
                                            </div>
                                        )}
                                        {isBursar && req.status === 'approved' && (
                                            <Button
                                                onClick={() => handleDisburse(req.id)}
                                                className="bg-blue-600 hover:bg-blue-700 w-full h-10 gap-2 font-bold shadow-lg shadow-blue-500/20"
                                            >
                                                <DollarSign className="w-4 h-4" />
                                                Disburse
                                            </Button>
                                        )}
                                        {req.status === 'pending' && (
                                            <Button variant="outline" className="text-slate-400 hover:text-red-500 hover:bg-red-50 w-full h-10 gap-2 border-none text-xs">
                                                <XCircle className="w-4 h-4" />
                                                {isBursar ? "Reject" : "Cancel"}
                                            </Button>
                                        )}
                                        {(req.status === 'disbursed' || req.status === 'approved') && !isBursar && (
                                            <div className="text-center py-2 h-10 flex items-center justify-center">
                                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                                            </div>
                                        )}
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
