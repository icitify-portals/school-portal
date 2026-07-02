"use client";

import React, { useEffect, useState } from "react";
import { getStudentLibraryFines, processLibraryFinePayment } from "@/actions/library";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen, CreditCard, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function LibraryFinancePage() {
    const { data: session } = useSession();
    const [fines, setFines] = useState<any[]>([]);
    const [totalOwed, setTotalOwed] = useState("0.00");
    const [isLoading, setIsLoading] = useState(true);
    const [isPaying, setIsPaying] = useState(false);

    useEffect(() => {
        if (session?.user) {
            fetchData();
        }
    }, [session]);

    const fetchData = async () => {
        setIsLoading(true);
        // SECURITY: No studentId passed — server action derives it from the session cookie
        const res = await getStudentLibraryFines();
        if (res.success) {
            setFines(res.fines);
            setTotalOwed(res.totalOwed);
        }
        setIsLoading(false);
    };

    const handlePayment = async () => {
        if (parseFloat(totalOwed) <= 0) return;
        setIsPaying(true);

        // Simulating Remita Payment Gateway
        toast.info("Redirecting to Remita Payment Gateway...");

        setTimeout(async () => {
            // SECURITY: No studentId or amount passed — server action recomputes everything internally
            const res = await processLibraryFinePayment();
            if (res.success) {
                toast.success("Payment successful! Your library account is unlocked.");
                fetchData();
            } else {
                toast.error(res.error || "Payment failed.");
            }
            setIsPaying(false);
        }, 2000);
    };

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading library fines...</div>;
    }

    const hasFines = parseFloat(totalOwed) > 0;

    return (
        <div className="p-8 space-y-8 max-w-5xl mx-auto">
            <div className="flex items-center gap-4 border-b pb-6">
                <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Library Fines</h1>
                    <p className="text-muted-foreground mt-1">Settle outstanding balances for overdue library resources.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className={`col-span-1 border-2 shadow-none ${hasFines ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                        <CardTitle className="text-lg">Total Amount Due</CardTitle>
                    </CardHeader>
                    <CardContent className=" p-6">
                        <div className="text-4xl font-black mb-4">
                            ₦{totalOwed}
                        </div>
                        {hasFines ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-rose-700 text-sm font-medium bg-white/50 p-2 rounded-md">
                                    <AlertCircle className="w-4 h-4" />
                                    Library borrowing is restricted.
                                </div>
                                <Button 
                                    className="w-full bg-rose-600 hover:bg-rose-700" 
                                    onClick={handlePayment}
                                    disabled={isPaying}
                                >
                                    <CreditCard className="w-4 h-4 mr-2" />
                                    {isPaying ? "Processing..." : "Pay via Remita"}
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-emerald-700 font-medium bg-white/50 p-3 rounded-md">
                                <CheckCircle2 className="w-5 h-5" />
                                Your account is clear!
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="col-span-1 md:col-span-2 border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                        <CardTitle>Overdue Fines Ledger</CardTitle>
                        <CardDescription>Detailed breakdown of daily late fees.</CardDescription>
                    </CardHeader>
                    <CardContent className=" p-6">
                        {fines.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                No unpaid fines found.
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Resource</TableHead>
                                        <TableHead>Date Billed</TableHead>
                                        <TableHead>Reason</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {fines.map((row: any) => (
                                        <TableRow key={row.fine.id}>
                                            <TableCell>
                                                <div className="font-medium">{row.resource.title}</div>
                                                <div className="text-xs text-muted-foreground uppercase">{row.copy.barcode}</div>
                                            </TableCell>
                                            <TableCell>{new Date(row.fine.createdAt).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-rose-600 border-rose-200 bg-rose-50">
                                                    {row.fine.reason}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">₦{row.fine.amount}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
