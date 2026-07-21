"use client";

import { useState } from "react";
import { updateInterviewResult } from "@/actions/admission_extended";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Video, MapPin, CheckCircle, XCircle } from "lucide-react";

export function InterviewTable({ initialData }: { initialData: any[] }) {
    const [data, setData] = useState(initialData);
    const [loadingId, setLoadingId] = useState<number | null>(null);

    const handleUpdate = async (id: number, status: "completed" | "no_show", score: number = 0) => {
        setLoadingId(id);
        const res = await updateInterviewResult(id, status, score, "Updated from quick actions");
        setLoadingId(null);
        if (res.success) {
            toast.success(`Interview marked as ${status}`);
            setData(prev => prev.map(item => item.id === id ? { ...item, status, score } : item));
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
                            <th className="px-6 py-4">Date & Time</th>
                            <th className="px-6 py-4">Mode</th>
                            <th className="px-6 py-4">Status & Score</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                    No interviews scheduled.
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
                                                <img src={item.applicantPhoto} alt="Photo" className="w-10 h-10 rounded-full object-cover" />
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
                                    <td className="px-6 py-4 text-slate-600">
                                        {item.interviewDate ? new Date(item.interviewDate).toLocaleString() : 'TBD'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            {item.mode === 'virtual' ? <Video className="w-4 h-4 text-blue-500" /> : <MapPin className="w-4 h-4 text-emerald-500" />}
                                            <span className="capitalize">{item.mode}</span>
                                        </div>
                                        {item.locationOrLink && (
                                            <div className="text-xs text-slate-500 mt-1 truncate max-w-[150px]" title={item.locationOrLink}>
                                                {item.locationOrLink}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            <Badge variant={item.status === 'scheduled' ? 'secondary' : item.status === 'completed' ? 'default' : 'destructive'}>
                                                {item.status}
                                            </Badge>
                                            {item.score !== null && (
                                                <div className="text-xs font-mono text-slate-600">Score: {item.score}</div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        {item.status === 'scheduled' && (
                                            <>
                                                <Button 
                                                    size="sm" 
                                                    variant="outline" 
                                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                    disabled={loadingId === item.id}
                                                    onClick={() => handleUpdate(item.id, 'completed', 85)} // Hardcoded 85 for quick demo
                                                >
                                                    <CheckCircle className="w-4 h-4 mr-1" /> Complete (85)
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="outline" 
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    disabled={loadingId === item.id}
                                                    onClick={() => handleUpdate(item.id, 'no_show')}
                                                >
                                                    <XCircle className="w-4 h-4 mr-1" /> No Show
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
