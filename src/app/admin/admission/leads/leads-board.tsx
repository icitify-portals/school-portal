"use client";

import { useState } from "react";
import { updateLeadStatus } from "@/actions/admission_extended";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Phone, Mail, GraduationCap } from "lucide-react";

type LeadStatus = "new" | "contacted" | "applied" | "cold";

export function LeadsBoard({ initialLeads }: { initialLeads: any[] }) {
    const [leads, setLeads] = useState(initialLeads);

    const columns: { id: LeadStatus; title: string; color: string }[] = [
        { id: "new", title: "New Inquiry", color: "bg-blue-100 border-blue-200" },
        { id: "contacted", title: "Contacted", color: "bg-yellow-100 border-yellow-200" },
        { id: "applied", title: "Applied", color: "bg-green-100 border-green-200" },
        { id: "cold", title: "Cold / Lost", color: "bg-slate-100 border-slate-200" },
    ];

    const moveLead = async (leadId: number, newStatus: LeadStatus) => {
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
        
        const result = await updateLeadStatus(leadId, newStatus);
        if (!result.success) {
            toast.error("Failed to update status");
            // revert
            setLeads(initialLeads);
        } else {
            toast.success("Lead moved successfully");
        }
    };

    return (
        <div className="flex gap-4 overflow-x-auto pb-4">
            {columns.map(col => {
                const columnLeads = leads.filter(l => l.status === col.id);
                
                return (
                    <div key={col.id} className={`flex-1 min-w-[300px] rounded-lg border bg-slate-50 p-4`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-slate-700">{col.title}</h3>
                            <Badge variant="secondary">{columnLeads.length}</Badge>
                        </div>
                        
                        <div className="space-y-3 min-h-[500px]">
                            {columnLeads.map(lead => (
                                <Card key={lead.id} className="cursor-pointer hover:shadow-md transition-shadow">
                                    <CardContent className="p-4 space-y-3">
                                        <div className="font-medium text-slate-900">{lead.name}</div>
                                        
                                        <div className="text-xs text-slate-500 space-y-1">
                                            {lead.email && <div className="flex items-center gap-1"><Mail className="w-3 h-3"/> {lead.email}</div>}
                                            {lead.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3"/> {lead.phone}</div>}
                                            {lead.programOfInterest && <div className="flex items-center gap-1"><GraduationCap className="w-3 h-3"/> {lead.programOfInterest}</div>}
                                        </div>

                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {columns.filter(c => c.id !== col.id).map(c => (
                                                <button 
                                                    key={c.id}
                                                    onClick={() => moveLead(lead.id, c.id)}
                                                    className="text-[10px] px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 transition-colors"
                                                >
                                                    Move to {c.title}
                                                </button>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
