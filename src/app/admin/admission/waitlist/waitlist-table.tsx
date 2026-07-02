"use client";

import { useState } from "react";
import { updateWaitlistStatus } from "@/actions/admission_extended";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle, XCircle } from "lucide-react";
import Image from "next/image";

export function WaitlistTable({ initialData }: { initialData: any[] }) {
    const [data, setData] = useState(initialData);
    const [loadingId, setLoadingId] = useState<number | null>(null);

    const handleUpdate = async (id: number, status: "offered" | "rejected") => {
        setLoadingId(id);
        const res = await updateWaitlistStatus(id, status);
        setLoadingId(null);
        if (res.success) {
            toast.success(`Applicant ${status === 'offered' ? 'Offered Admission' : 'Rejected'}`);
            setData(prev => prev.map(item => item.id === id ? { ...item, status } : item));
        } else {
            toast.error(res.error || "Failed to update status");
        }
    };

    return (
        <Card className=" border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-0">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600 uppercase font-medium border-b">
                        <tr>
                            <th className="px-6 py-4">Applicant</th>
                            <th className="px-6 py-4">Rank / Score</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                    No applicants on the waitlist currently.
                                </td>
                            </tr>
                        ) : data.map((item) => {
                            const name = item.parsedData.firstName 
                                ? `${item.parsedData.firstName} ${item.parsedData.lastName || ''}` 
                                : (item.parsedData.fullName || "Unknown Applicant");
                                
                            return (
                                <tr key={item.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {item.applicantPhoto ? (
                                                <Image src={item.applicantPhoto} alt="Photo" width={40} height={40} className="rounded-full object-cover" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                                                    {name.charAt(0)}
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-medium text-slate-900">{name}</div>
                                                <div className="text-slate-500 text-xs">App ID: #{item.applicationId}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-slate-600">
                                        {item.rankPosition ? `#${item.rankPosition}` : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant={item.status === 'waiting' ? 'secondary' : item.status === 'offered' ? 'default' : 'destructive'}>
                                            {item.status}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        {item.status === 'waiting' && (
                                            <>
                                                <Button 
                                                    size="sm" 
                                                    variant="outline" 
                                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                    disabled={loadingId === item.id}
                                                    onClick={() => handleUpdate(item.id, 'offered')}
                                                >
                                                    <CheckCircle className="w-4 h-4 mr-1" /> Offer
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="outline" 
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    disabled={loadingId === item.id}
                                                    onClick={() => handleUpdate(item.id, 'rejected')}
                                                >
                                                    <XCircle className="w-4 h-4 mr-1" /> Reject
                                                </Button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </CardContent>
        </Card>
    );
}
