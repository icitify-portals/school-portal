import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Receipt, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMyReceipts } from "@/actions/bursary";
import ReceiptCenter from "@/components/finance/ReceiptCenter";

const STUDENT_KINDS = new Set(['student_transaction', 'wallet_topup', 'online_payment']);

export default async function StudentReceiptsPage() {
    const session = await auth();
    if (!session?.user) redirect('/login');

    const res = await getMyReceipts().catch(() => ({ success: false as const, data: [] }));
    const items = (res.data || []).filter(i => STUDENT_KINDS.has(i.kind));

    return (
        <div className="p-8 w-full max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 italic uppercase tracking-tighter">
                        <Receipt className="w-8 h-8 text-indigo-600" />
                        My Receipts
                    </h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">All payments — print or download anytime</p>
                </div>
                <Button variant="ghost" asChild className="gap-2 text-slate-500">
                    <Link href="/student/finance"><Undo2 className="w-4 h-4" /> Finance</Link>
                </Button>
            </div>

            <ReceiptCenter items={items} />
        </div>
    );
}
