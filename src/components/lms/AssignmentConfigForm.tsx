"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calculator, Calendar, Repeat, FileCheck, Layers } from "lucide-react";

interface AssignmentConfigFormProps {
    assignment: any;
    onChange: (data: any) => void;
}

const SUBMISSION_METHODS = [
    { id: 'file', label: 'File Upload', icon: FileCheck },
    { id: 'text', label: 'Online Text', icon: Layers },
    { id: 'audio', label: 'Audio Recording', icon: Calculator }, // Using calculator as placeholder for record
    { id: 'link', label: 'External Link', icon: Calendar },
    { id: 'cloud', label: 'Cloud (Google/OneDrive)', icon: Repeat },
];

export default function AssignmentConfigForm({ assignment, onChange }: AssignmentConfigFormProps) {
    const [config, setConfig] = useState({
        dueDate: assignment?.dueDate ? new Date(assignment.dueDate).toISOString().slice(0, 16) : "",
        cutOffDate: assignment?.cutOffDate ? new Date(assignment.cutOffDate).toISOString().slice(0, 16) : "",
        maxScore: assignment?.maxScore || 100,
        includeInCa: assignment?.includeInCa || false,
        caAveragingMethod: assignment?.caAveragingMethod || 'simple',
        allowResubmission: assignment?.allowResubmission ?? true,
        submissionTypes: JSON.parse(assignment?.submissionTypes || '["file"]'),
    });

    const update = (patch: any) => {
        const next = { ...config, ...patch };
        setConfig(next);
        onChange(next);
    };

    const toggleType = (typeId: string) => {
        const nextTypes = config.submissionTypes.includes(typeId)
            ? config.submissionTypes.filter((t: string) => t !== typeId)
            : [...config.submissionTypes, typeId];
        update({ submissionTypes: nextTypes });
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* 1. Core Config */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-slate-700">
                        <Calendar className="w-4 h-4 text-indigo-500" />
                        Due Date
                    </Label>
                    <Input
                        type="datetime-local"
                        value={config.dueDate}
                        onChange={(e) => update({ dueDate: e.target.value })}
                        className="border-slate-200 focus:ring-indigo-500"
                    />
                    <p className="text-[10px] text-slate-400">Date when student work is marked as 'Late'.</p>
                </div>

                <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-slate-700">
                        <Calendar className="w-4 h-4 text-rose-500" />
                        Cut-off Date
                    </Label>
                    <Input
                        type="datetime-local"
                        value={config.cutOffDate}
                        onChange={(e) => update({ cutOffDate: e.target.value })}
                        className="border-slate-200 focus:ring-indigo-500"
                    />
                    <p className="text-[10px] text-slate-400">Submissions are disabled after this date.</p>
                </div>
            </div>

            {/* 2. Submission Methods */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                    <Label className="font-bold text-slate-800">Allowed Submission Methods</Label>
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider">{config.submissionTypes.length} Selected</Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {SUBMISSION_METHODS.map((method) => {
                        const isSelected = config.submissionTypes.includes(method.id);
                        return (
                            <button
                                key={method.id}
                                onClick={() => toggleType(method.id)}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all group ${
                                    isSelected 
                                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700' 
                                    : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                                }`}
                            >
                                <method.icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-indigo-600' : 'text-slate-300 group-hover:text-slate-400'}`} />
                                <span className="text-[10px] font-bold">{method.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 3. CA & Grading Logic */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex items-center gap-3">
                        <Calculator className="w-5 h-5 text-indigo-600" />
                        <h4 className="font-bold text-sm text-slate-800">Grading</h4>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs text-slate-500">Maximum Possible Marks</Label>
                        <Input
                            type="number"
                            value={config.maxScore}
                            onChange={(e) => update({ maxScore: Number(e.target.value) })}
                            className="h-9 font-bold text-indigo-600"
                        />
                    </div>
                </div>

                <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex items-center gap-3">
                        <Repeat className="w-5 h-5 text-emerald-600" />
                        <h4 className="font-bold text-sm text-slate-800">Resubmission</h4>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox 
                            id="allow-resub" 
                            checked={config.allowResubmission}
                            onChange={(e) => update({ allowResubmission: e.target.checked })}
                        />
                        <Label htmlFor="allow-resub" className="text-xs font-medium cursor-pointer">Allow resubmission before deadline</Label>
                    </div>
                </div>

                <div className="p-5 bg-indigo-900 rounded-2xl border border-indigo-800 shadow-lg space-y-4">
                    <div className="flex items-center gap-3">
                        <FileCheck className="w-5 h-5 text-indigo-200" />
                        <h4 className="font-bold text-sm text-white text-indigo-100">CA Integration</h4>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox 
                            id="include-ca" 
                            checked={config.includeInCa}
                            onChange={(e) => update({ includeInCa: e.target.checked })}
                            className="border-indigo-400"
                        />
                        <Label htmlFor="include-ca" className="text-xs font-medium text-indigo-100 cursor-pointer">Include in CA Average</Label>
                    </div>
                    
                    {config.includeInCa && (
                        <div className="pt-2 animate-in zoom-in-95 duration-300">
                            <Select 
                                value={config.caAveragingMethod} 
                                onValueChange={(val: 'simple' | 'weighted') => update({ caAveragingMethod: val })}
                            >
                                <SelectTrigger className="h-8 bg-indigo-800 border-indigo-700 text-indigo-100 text-[10px] font-bold">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                    <SelectItem value="simple">Simple Average</SelectItem>
                                    <SelectItem value="weighted">Weighted (by Max Score)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
