"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Save, GripVertical, AlertCircle } from "lucide-react";
import { setupGradingConfig } from "@/actions/grading";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface GradingConfig {
    id?: string; // UI only
    name: string;
    type: 'assignment' | 'quiz' | 'attendance' | 'manual' | 'exam';
    linkedId?: number;
    maxMarks: number;
    weight: number;
}

interface Props {
    courseId: number;
    sessionId: number;
    initialConfigs: any[];
    availableAssignments: any[];
    availableQuizzes: any[];
}

export default function GradingConfigEditor({ courseId, sessionId, initialConfigs, availableAssignments, availableQuizzes }: Props) {
    const router = useRouter();
    const [configs, setConfigs] = useState<GradingConfig[]>(
        initialConfigs.length > 0 ? initialConfigs : [
            { name: "First Continuous Assessment", type: "manual", maxMarks: 10, weight: 10, id: "1" },
            { name: "Second Continuous Assessment", type: "manual", maxMarks: 10, weight: 10, id: "2" },
            { name: "Final Examination", type: "exam", maxMarks: 100, weight: 70, id: "3" }
        ]
    );

    const [saving, setSaving] = useState(false);

    const addComponent = () => {
        setConfigs([...configs, {
            name: "New Component",
            type: "manual",
            maxMarks: 10,
            weight: 10,
            id: Math.random().toString()
        }]);
    };

    const removeComponent = (id: string | undefined) => {
        setConfigs(configs.filter(c => c.id !== id));
    };

    const updateComponent = (id: string | undefined, field: keyof GradingConfig, value: any) => {
        setConfigs(configs.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    const totalWeight = configs.reduce((acc, c) => acc + c.weight, 0);

    const handleSave = async () => {
        if (totalWeight !== 100) {
            return toast.error("Total weight must equal 100%");
        }

        setSaving(true);
        const res = await setupGradingConfig(courseId, sessionId, configs.map((c, i) => ({
            name: c.name,
            type: c.type,
            linkedId: c.linkedId,
            maxMarks: c.maxMarks,
            weight: c.weight,
            order: i
        })));

        if (res.success) {
            toast.success("Grading configuration saved!");
            router.refresh();
        } else {
            toast.error((res as any).error || "Failed to save configuration");
        }
        setSaving(false);
    };

    return (
        <div className="space-y-6">
            <Card className="border-indigo-100 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between py-4">
                    <div>
                        <CardTitle className="text-lg font-bold text-slate-800">CA & Exam Configuration</CardTitle>
                        <p className="text-xs text-slate-500">Define weights for each component. Total must equal 100.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "px-4 py-2 rounded-lg font-black text-sm border-2",
                            totalWeight === 100 ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-rose-50 border-rose-200 text-rose-700"
                        )}>
                            Total Weight: {totalWeight}%
                        </div>
                        <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-100">
                            <Save className="w-4 h-4 mr-2" />
                            {saving ? "Saving..." : "Save Configuration"}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow>
                                <TableHead className="w-12"></TableHead>
                                <TableHead>Component Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Link to Activity</TableHead>
                                <TableHead className="w-24">Max Pts</TableHead>
                                <TableHead className="w-24">Weight %</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {configs.map((config, index) => (
                                <TableRow key={config.id} className="group">
                                    <TableCell>
                                        <GripVertical className="w-4 h-4 text-slate-300 group-hover:text-slate-400 cursor-grab" />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            value={config.name}
                                            onChange={(e) => updateComponent(config.id, 'name', e.target.value)}
                                            className="h-9 text-sm font-medium bg-transparent border-none focus:ring-1 focus:ring-indigo-100 hover:bg-slate-50 transition-colors"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Select
                                            value={config.type}
                                            onValueChange={(val) => updateComponent(config.id, 'type', val)}
                                        >
                                            <SelectTrigger className="h-9 text-xs border-none bg-slate-50 group-hover:bg-white transition-colors">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="assignment">Assignment</SelectItem>
                                                <SelectItem value="quiz">Quiz</SelectItem>
                                                <SelectItem value="attendance">Attendance</SelectItem>
                                                <SelectItem value="manual">Manual Entry</SelectItem>
                                                <SelectItem value="exam">Examination</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell>
                                        {(config.type === 'assignment' || config.type === 'quiz') ? (
                                            <Select
                                                value={config.linkedId?.toString()}
                                                onValueChange={(val) => updateComponent(config.id, 'linkedId', parseInt(val))}
                                            >
                                                <SelectTrigger className="h-9 text-xs border-dashed border-slate-200 bg-white">
                                                    <SelectValue placeholder="Select activity..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {config.type === 'assignment' && (
                                                        <SelectItem value="-1" className="font-bold text-indigo-600">
                                                            Σ Average of All Assignments
                                                        </SelectItem>
                                                    )}
                                                    {config.type === 'quiz' && (
                                                        <SelectItem value="-1" className="font-bold text-emerald-600">
                                                            Σ Average of All Quizzes
                                                        </SelectItem>
                                                    )}
                                                    {config.type === 'assignment' ? availableAssignments.map(a => (
                                                        <SelectItem key={a.id} value={a.id.toString()}>{a.title}</SelectItem>
                                                    )) : availableQuizzes.map(q => (
                                                        <SelectItem key={q.id} value={q.id.toString()}>{q.title}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest px-3">Stand-alone mark</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            value={config.maxMarks}
                                            onChange={(e) => updateComponent(config.id, 'maxMarks', parseInt(e.target.value) || 0)}
                                            className="h-9 text-center font-bold text-sm bg-slate-50 border-none"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            value={config.weight}
                                            onChange={(e) => updateComponent(config.id, 'weight', parseInt(e.target.value) || 0)}
                                            className="h-9 text-center font-black text-sm bg-indigo-50 text-indigo-700 border-none"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeComponent(config.id)}
                                            className="h-8 w-8 p-0 text-slate-300 hover:text-rose-600 hover:bg-rose-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <div className="p-4 bg-slate-50/50 border-t border-slate-100">
                        <Button onClick={addComponent} variant="ghost" className="w-full h-12 border-2 border-dashed border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-white transition-all gap-2 font-bold">
                            <Plus className="w-4 h-4" />
                            Add Component
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {totalWeight !== 100 && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 flex items-start gap-3 sm:items-center animate-pulse">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 sm:mt-0" />
                    <p className="text-sm text-amber-700 font-medium">
                        The total weight of all components must equal exactly 100. Currently, it is {totalWeight}.
                    </p>
                </div>
            )}
        </div>
    );
}

// Utility for cn if not in scope (though usually in lib/utils)
function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}
