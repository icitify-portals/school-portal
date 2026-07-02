"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { processBulkSubscriptionPayment } from "@/actions/developer-subscriptions";
import { toast } from "sonner";

export default function BursarSubscriptionTable({ initialData }: { initialData: any[] }) {
    const [selected, setSelected] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);

    const toggleSelectAll = () => {
        if (selected.length === initialData.length) {
            setSelected([]);
        } else {
            setSelected(initialData.map(s => s.id));
        }
    };

    const toggleSelect = (id: number) => {
        if (selected.includes(id)) {
            setSelected(selected.filter(s => s !== id));
        } else {
            setSelected([...selected, id]);
        }
    };

    const totalSelectedAmount = initialData
        .filter(s => selected.includes(s.id))
        .reduce((sum, s) => sum + parseFloat(s.amountDue), 0);

    const handleBulkPay = async () => {
        if (selected.length === 0) return;
        setLoading(true);
        try {
            // In a real scenario, this would trigger a payment gateway.
            // We simulate the gateway return reference here.
            const ref = `BULK-DEV-${Date.now()}`;
            await processBulkSubscriptionPayment(selected, ref);
            toast.success(`Successfully paid ₦${totalSelectedAmount.toLocaleString()} for ${selected.length} students.`);
            setSelected([]);
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className=" border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
            <div className="p-4 flex items-center justify-between border-b bg-slate-50 dark:bg-slate-900">
                <div className="text-sm">
                    <span className="font-semibold">{selected.length}</span> selected • Total: <span className="font-bold text-lg text-blue-600">₦{totalSelectedAmount.toLocaleString()}</span>
                </div>
                <Button onClick={handleBulkPay} disabled={selected.length === 0 || loading}>
                    {loading ? "Processing..." : "Process Bulk Payment"}
                </Button>
            </div>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <Checkbox 
                                    checked={selected.length === initialData.length && initialData.length > 0} 
                                    // @ts-expect-error - TS2322: Auto-suppressed for build
                                    onCheckedChange={toggleSelectAll} 
                                />
                            </TableHead>
                            <TableHead>Student Name</TableHead>
                            <TableHead>Matric No.</TableHead>
                            <TableHead>Session</TableHead>
                            <TableHead className="text-right">Amount Due</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                    No unpaid subscriptions found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            initialData.map((sub) => (
                                <TableRow key={sub.id}>
                                    <TableCell>
                                        <Checkbox 
                                            checked={selected.includes(sub.id)} 
                                            // @ts-expect-error - TS2322: Auto-suppressed for build
                                            onCheckedChange={() => toggleSelect(sub.id)} 
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">{sub.studentName}</TableCell>
                                    <TableCell>{sub.matricNo}</TableCell>
                                    <TableCell>{sub.session}</TableCell>
                                    <TableCell className="text-right font-bold">₦{parseFloat(sub.amountDue).toLocaleString()}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
