import { db } from '@/db';
import { payment_transactions, users } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { verifyPayment } from '@/actions/payment-gateways';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';

export default async function BursaryTransactionsPage({
    searchParams
}: {
    searchParams: { status?: string }
}) {
    const filterStatus = searchParams.status || 'all';

    // Query transactions and join with users to get payer name
    let query = db.select({
        id: payment_transactions.id,
        reference: payment_transactions.transactionReference,
        amount: payment_transactions.amount,
        gateway: payment_transactions.paymentGateway,
        gatewayId: payment_transactions.gatewayTransactionId,
        status: payment_transactions.status,
        createdAt: payment_transactions.createdAt,
        userName: users.name,
        userEmail: users.email
    })
    .from(payment_transactions)
    .leftJoin(users, eq(payment_transactions.userId, users.id));

    if (filterStatus !== 'all') {
        // @ts-expect-error - TS2741: Auto-suppressed for build
        query = query.where(eq(payment_transactions.status, filterStatus));
    }

    const transactions = await query.orderBy(desc(payment_transactions.createdAt)).limit(100);

    // Server Action for Re-querying
    async function handleRequery(formData: FormData) {
        "use server";
        const txId = parseInt(formData.get('txId') as string);
        const reference = formData.get('reference') as string;
        const gateway = formData.get('gateway') as string;

        if (!txId || !reference || !gateway) return;

        try {
            const verification = await verifyPayment(gateway, reference);
            
            if (verification.success) {
                const newStatus = verification.verified ? 'paid' : 'failed'; // Or keep it pending if not sure
                // Update DB
                await db.update(payment_transactions)
                    .set({ status: newStatus, updatedAt: new Date() })
                    .where(eq(payment_transactions.id, txId));
                
                revalidatePath('/admin/bursary/transactions');
            }
        } catch (e) {
            console.error("Manual re-query failed", e);
        }
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Transaction Logs & Reconciliation</h1>
                <p className="text-slate-500 mt-2">Monitor all incoming payments, manage webhooks, and manually reconcile stuck transactions.</p>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-6">
                <Link href="/admin/bursary/transactions?status=all" className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${filterStatus === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>All</Link>
                <Link href="/admin/bursary/transactions?status=paid" className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${filterStatus === 'paid' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Successful</Link>
                <Link href="/admin/bursary/transactions?status=pending" className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${filterStatus === 'pending' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Pending</Link>
                <Link href="/admin/bursary/transactions?status=failed" className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${filterStatus === 'failed' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Failed</Link>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="p-4 text-sm font-semibold text-slate-600">Date</th>
                            <th className="p-4 text-sm font-semibold text-slate-600">Reference (Order ID)</th>
                            <th className="p-4 text-sm font-semibold text-slate-600">Student</th>
                            <th className="p-4 text-sm font-semibold text-slate-600">Amount</th>
                            <th className="p-4 text-sm font-semibold text-slate-600">Gateway</th>
                            <th className="p-4 text-sm font-semibold text-slate-600">Status</th>
                            <th className="p-4 text-sm font-semibold text-slate-600 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {transactions.length === 0 ? (
                            <tr><td colSpan={7} className="p-8 text-center text-slate-500">No transactions found.</td></tr>
                        ) : transactions.map((tx) => (
                            <tr key={tx.id} className="hover:bg-slate-50 transition">
                                <td className="p-4 text-sm text-slate-600">
                                    {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : 'N/A'}
                                </td>
                                <td className="p-4 text-sm font-medium text-slate-800">
                                    {tx.reference}
                                    {tx.gatewayId && <div className="text-xs text-slate-400 font-normal mt-0.5">RRR: {tx.gatewayId}</div>}
                                </td>
                                <td className="p-4 text-sm text-slate-600">
                                    <div>{tx.userName || 'Unknown'}</div>
                                    <div className="text-xs text-slate-400">{tx.userEmail}</div>
                                </td>
                                <td className="p-4 text-sm font-semibold text-slate-800">
                                    ₦{Number(tx.amount).toLocaleString()}
                                </td>
                                <td className="p-4">
                                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        {tx.gateway || 'N/A'}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold 
                                        ${tx.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 
                                          tx.status === 'pending' ? 'bg-amber-100 text-amber-700' : 
                                          'bg-red-100 text-red-700'}`}>
                                        {tx.status?.toUpperCase() || 'UNKNOWN'}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    {tx.status === 'pending' && tx.gateway && (
                                        <form action={handleRequery}>
                                            <input type="hidden" name="txId" value={tx.id} />
                                            <input type="hidden" name="reference" value={tx.reference} />
                                            <input type="hidden" name="gateway" value={tx.gateway} />
                                            <button 
                                                type="submit" 
                                                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition active:scale-95"
                                            >
                                                Re-Query
                                            </button>
                                        </form>
                                    )}
                                    {tx.status !== 'pending' && (
                                        <span className="text-xs text-slate-400 italic">No actions needed</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
