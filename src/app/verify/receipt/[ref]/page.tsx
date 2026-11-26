import Link from "next/link";
import { verifyReceiptByReferenceAction } from "@/actions/receipt-verification";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    ShieldCheck,
    ShieldAlert,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Search,
    User,
    CreditCard,
    Calendar,
    Hash,
    Building2,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReceiptVerificationResultPage({
    params,
}: {
    params: Promise<{ ref: string }>;
}) {
    const { ref } = await params;
    const res = await verifyReceiptByReferenceAction(ref);

    const isVerified = res.found && res.authentic;
    const isLegacyVerified = isVerified && res.isLegacy;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 sm:p-10">
            <div className="w-full max-w-xl space-y-6">
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto ring-1 ring-slate-200">
                        {isVerified ? (
                            <ShieldCheck className={`w-9 h-9 ${isLegacyVerified ? "text-amber-600" : "text-emerald-600"}`} />
                        ) : (
                            <ShieldAlert className="w-9 h-9 text-rose-600" />
                        )}
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                        Payment Receipt Verification
                    </h1>
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest">
                        Federal School of Statistics, Ibadan • Live Bursary Registry
                    </p>
                </div>

                <Card className="overflow-hidden border border-slate-200 shadow-xl rounded-2xl bg-white">
                    <div
                        className={`p-5 flex items-center justify-between text-white ${
                            isLegacyVerified
                                ? "bg-amber-600"
                                : isVerified
                                ? "bg-emerald-600"
                                : "bg-rose-600"
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            {isVerified ? (
                                <CheckCircle2 className="w-6 h-6 shrink-0" />
                            ) : (
                                <XCircle className="w-6 h-6 shrink-0" />
                            )}
                            <div>
                                <p className="font-black uppercase tracking-wider text-sm">
                                    {isLegacyVerified
                                        ? "LEGACY PAYMENT RECORD — VERIFY CAREFULLY"
                                        : isVerified
                                        ? "AUTHENTIC & VERIFIED PAYMENT"
                                        : res.status === "UNPAID_PENDING"
                                        ? "UNPAID / PENDING — DO NOT ACCEPT"
                                        : res.status === "FAILED"
                                        ? "FAILED TRANSACTION — INVALID RECEIPT"
                                        : "RECORD NOT FOUND — POSSIBLE FORGERY"}
                                </p>
                                <p className="text-xs text-white/85 font-mono mt-0.5 break-all">
                                    Ref: {res.reference}
                                </p>
                            </div>
                        </div>
                    </div>

                    <CardContent className="p-6 space-y-5">
                        {res.warningMessage && (
                            <div
                                className={`p-4 rounded-xl border flex items-start gap-3 ${
                                    isLegacyVerified
                                        ? "bg-amber-50 border-amber-200 text-amber-900"
                                        : "bg-rose-50 border-rose-200 text-rose-900"
                                }`}
                            >
                                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                                <p className="text-xs font-semibold leading-relaxed">{res.warningMessage}</p>
                            </div>
                        )}

                        {res.found ? (
                            <>
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                            Official Amount Recorded
                                        </p>
                                        <p className="text-3xl font-black text-slate-900 mt-0.5">
                                            ₦{(res.amount || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span
                                            className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase ${
                                                isVerified
                                                    ? "bg-emerald-100 text-emerald-800"
                                                    : "bg-rose-100 text-rose-800"
                                            }`}
                                        >
                                            {res.status.replace("_", " ")}
                                        </span>
                                        {res.sessionLabel && (
                                            <p className="text-xs font-bold text-slate-500 mt-1">
                                                Session: {res.sessionLabel}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="divide-y divide-slate-100 text-sm">
                                    <DetailRow
                                        icon={<User className="w-4 h-4 text-slate-400" />}
                                        label="Registered Payer Name"
                                        value={res.payer?.fullName || "N/A"}
                                        strong
                                    />
                                    {res.payer?.email && (
                                        <DetailRow
                                            icon={<User className="w-4 h-4 text-slate-400" />}
                                            label="Payer Email"
                                            value={res.payer.email}
                                        />
                                    )}
                                    {(res.payer?.matricNumber || res.payer?.formNumber) && (
                                        <DetailRow
                                            icon={<Hash className="w-4 h-4 text-slate-400" />}
                                            label="Matric / Form No."
                                            value={res.payer.matricNumber || res.payer.formNumber || "N/A"}
                                            mono
                                        />
                                    )}
                                    {(res.payer?.department || res.payer?.programme) && (
                                        <DetailRow
                                            icon={<Building2 className="w-4 h-4 text-slate-400" />}
                                            label="Department / Programme"
                                            value={[res.payer.department, res.payer.programme].filter(Boolean).join(" • ")}
                                        />
                                    )}
                                    <DetailRow
                                        icon={<CreditCard className="w-4 h-4 text-slate-400" />}
                                        label="Payment Purpose"
                                        value={res.purpose || "N/A"}
                                    />
                                    {res.rrr && (
                                        <DetailRow
                                            icon={<Hash className="w-4 h-4 text-slate-400" />}
                                            label="Remita RRR"
                                            value={res.rrr}
                                            mono
                                        />
                                    )}
                                    <DetailRow
                                        icon={<CreditCard className="w-4 h-4 text-slate-400" />}
                                        label="Payment Gateway"
                                        value={(res.gateway || "N/A").toUpperCase()}
                                    />
                                    <DetailRow
                                        icon={<Calendar className="w-4 h-4 text-slate-400" />}
                                        label="Official Date & Time"
                                        value={
                                            res.paymentDate
                                                ? new Date(res.paymentDate).toLocaleString("en-GB", {
                                                      day: "2-digit",
                                                      month: "short",
                                                      year: "numeric",
                                                      hour: "2-digit",
                                                      minute: "2-digit",
                                                  })
                                                : "N/A"
                                        }
                                    />
                                </div>

                                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
                                    <strong>Bursary Staff Check:</strong> Confirm that the <strong>Payer Name</strong>,{" "}
                                    <strong>Amount</strong>, <strong>Purpose</strong>, and <strong>Date</strong> shown above
                                    match the presented receipt exactly. Any mismatch indicates a tampered or forged document.
                                </div>
                            </>
                        ) : (
                            <div className="py-6 text-center space-y-2">
                                <p className="text-sm font-bold text-slate-700">
                                    Reference <span className="font-mono text-rose-600">{res.reference}</span> was not found.
                                </p>
                                <p className="text-xs text-slate-500">
                                    Ensure the reference or Remita RRR was typed accurately. Official portal receipts are only
                                    issued from <span className="font-mono">https://portal.fssibadan.edu.ng</span>.
                                </p>
                            </div>
                        )}

                        <div className="pt-2">
                            <Button asChild variant="outline" className="w-full h-11 rounded-xl gap-2 font-bold">
                                <Link href="/verify/receipt">
                                    <Search className="w-4 h-4" />
                                    Verify Another Receipt
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function DetailRow({
    icon,
    label,
    value,
    strong,
    mono,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    strong?: boolean;
    mono?: boolean;
}) {
    return (
        <div className="py-3 flex items-start justify-between gap-4">
            <div className="flex items-center gap-2 text-slate-500 shrink-0">
                {icon}
                <span className="text-xs font-semibold">{label}</span>
            </div>
            <span
                className={`text-right break-all ${strong ? "font-black text-slate-900" : "font-semibold text-slate-800"} ${
                    mono ? "font-mono text-xs" : ""
                }`}
            >
                {value}
            </span>
        </div>
    );
}
