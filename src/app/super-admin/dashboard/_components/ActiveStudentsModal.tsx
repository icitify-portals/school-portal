"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface BreakdownItem {
    unit: string;
    student_count: number | string;
}

export default function ActiveStudentsModal({ children, breakdown }: { children: React.ReactNode, breakdown: BreakdownItem[] }) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <div className="cursor-pointer block active:scale-95 transition-transform h-full">
                    {children}
                </div>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col bg-white">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black text-slate-900">Active Students by Branch</DialogTitle>
                </DialogHeader>
                <div className="overflow-y-auto mt-4">
                    <Table>
                        <TableHeader className="bg-slate-50 sticky top-0">
                            <TableRow>
                                <TableHead className="font-bold text-slate-600">Branch / Unit</TableHead>
                                <TableHead className="font-bold text-slate-600 text-right">Active Students</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {breakdown && breakdown.length > 0 ? breakdown.map((item, idx) => (
                                <TableRow key={idx}>
                                    <TableCell className="font-medium text-slate-800">{item.unit}</TableCell>
                                    <TableCell className="text-right font-black text-slate-900">{item.student_count}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center text-slate-500 py-8">
                                        No active students found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
        </Dialog>
    );
}
