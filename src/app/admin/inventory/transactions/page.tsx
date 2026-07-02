
import { db } from "@/db/db";
import { inventoryTransactions } from "@/db/schema";
import { desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { auth } from "@/auth";

export default async function StockHistoryPage() {
    const session = await auth();
    if (!session) return <div>Unauthorized</div>;

    const transactions = await db.query.inventoryTransactions.findMany({
        orderBy: [desc(inventoryTransactions.transactionDate)],
        with: {
            item: true,
            recorder: true,
            recipient: true,
            supplier: true
        }
    });

    return (
        <div className="p-8 max-w-[1600px] w-full mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Stock Movement History</h1>
                <p className="text-slate-500 mt-1">Audit log of all inventory changes and issuances.</p>
            </div>

            <Card className=" border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                    <CardTitle>Transactions Log</CardTitle>
                    <CardDescription>Comprehensive list of stock activities.</CardDescription>
                </CardHeader>
                <CardContent className=" p-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Item</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Entity</TableHead>
                                <TableHead>Recorded By</TableHead>
                                <TableHead>Notes</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.map((tx) => (
                                <TableRow key={tx.id}>
                                    <TableCell className="text-slate-500 text-sm">
                                        {format(new Date(tx.transactionDate || Date.now()), "MMM dd, yyyy HH:mm")}
                                    </TableCell>
                                    <TableCell className="font-semibold text-slate-900">{tx.item?.name}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className={`border-none capitalize ${
                                            tx.type === 'purchase' ? 'bg-emerald-50 text-emerald-700' :
                                            tx.type === 'issuance' ? 'bg-blue-50 text-blue-700' :
                                            'bg-slate-50 text-slate-700'
                                        }`}>
                                            {tx.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-bold">
                                        {tx.type === 'purchase' ? '+' : '-'}{tx.quantity}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {tx.type === 'purchase' ? tx.supplier?.name : tx.recipient?.name || "N/A"}
                                    </TableCell>
                                    <TableCell className="text-sm">{tx.recorder?.name}</TableCell>
                                    <TableCell className="text-sm text-slate-500 max-w-xs truncate">{tx.notes || "-"}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
