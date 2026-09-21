import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Receipt } from "lucide-react";
import { getMyReceipts } from "@/actions/bursary";
import ReceiptCenter from "@/components/finance/ReceiptCenter";

const APPLICANT_KINDS = new Set(['application_fee', 'processing_fee', 'acceptance_fee']);

export default async function ApplicantReceiptsPage() {
    const session = await auth();
    if (!session?.user) redirect('/login');

    const res = await getMyReceipts().catch(() => ({ success: false as const, data: [] }));
    const items = (res.data || []).filter(i => APPLICANT_KINDS.has(i.kind));

    return (
        <div className="p-8 w-full max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 italic uppercase tracking-tighter">
                    <Receipt className="w-8 h-8 text-indigo-600" />
                    My Receipts
                </h1>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Payment History and Receipts — print anytime</p>
            </div>

            <ReceiptCenter items={items} />
        </div>
    );
}
