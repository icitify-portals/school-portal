"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { 
    Clock, 
    Settings2, 
    Calendar, 
    AlertCircle, 
    ShieldCheck, 
    CheckCircle2,
    CalendarDays,
    Timer,
    Eye,
    PercentCircle
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getExamSlots } from "@/actions/exam-slots";
import { format } from "date-fns";

interface QuizConfigFormProps {
    quiz: any;
    onChange: (data: any) => void;
}

export default function QuizConfigForm({ quiz, onChange }: QuizConfigFormProps) {
    const [slots, setSlots] = useState<any[]>([]);
    
    // State
    const [quizType, setQuizType] = useState<'standard' | 'examination'>(quiz?.quizType || 'standard');
    const [slotId, setSlotId] = useState<number | null>(quiz?.slotId || null);
    const [timeLimit, setTimeLimit] = useState(quiz?.timeLimitMinutes || 30);
    const [passingScore, setPassingScore] = useState(quiz?.passingScore || 50);
    const [gracePeriod, setGracePeriod] = useState(quiz?.gracePeriodMinutes || 0);
    const [visibility, setVisibility] = useState<'always' | 'scheduled'>(quiz?.visibilityRule || 'always');
    const [availableFrom, setAvailableFrom] = useState(quiz?.availableFrom ? new Date(quiz.availableFrom).toISOString().slice(0, 16) : "");
    const [availableUntil, setAvailableUntil] = useState(quiz?.availableUntil ? new Date(quiz.availableUntil).toISOString().slice(0, 16) : "");
    const [includeInCa, setIncludeInCa] = useState(quiz?.includeInCa || false);
    const [caMethod, setCaMethod] = useState<'simple' | 'weighted'>(quiz?.caAveragingMethod || 'simple');

    useEffect(() => {
        loadSlots();
    }, []);

    useEffect(() => {
        const data = {
            quizType,
            slotId,
            timeLimit,
            passingScore,
            gracePeriod,
            visibilityRule: visibility,
            availableFrom: availableFrom ? new Date(availableFrom) : null,
            availableUntil: availableUntil ? new Date(availableUntil) : null,
            includeInCa,
            caAveragingMethod: caMethod
        };
        onChange(data);
    }, [quizType, slotId, timeLimit, passingScore, gracePeriod, visibility, availableFrom, availableUntil, includeInCa, caMethod]);

    const loadSlots = async () => {
        const res = await getExamSlots();
        if (res.success && res.data) setSlots(res.data);
    };

    return (
        <div className="space-y-8 p-1 animate-in fade-in duration-500">
            {/* Type Selector */}
            <div className="grid grid-cols-2 gap-4">
                {[
                    { id: 'standard', title: 'Standard Quiz', desc: 'Flexible timing & individual progress.', icon: Timer },
                    { id: 'examination', title: 'Formal Exam', desc: 'Strict global timing via Exam Slots.', icon: ShieldCheck }
                ].map((type) => (
                    <button
                        key={type.id}
                        type="button"
                        onClick={() => setQuizType(type.id as any)}
                        className={cn(
                            "p-5 rounded-2xl border-2 text-left transition-all flex flex-col gap-3 group relative overflow-hidden",
                            quizType === type.id 
                                ? "border-indigo-600 bg-indigo-50/50 shadow-lg shadow-indigo-100" 
                                : "border-slate-100 bg-white hover:border-slate-200"
                        )}
                    >
                        <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                            quizType === type.id ? "bg-indigo-600 text-white rotate-6" : "bg-slate-50 text-slate-400 group-hover:rotate-3"
                        )}>
                            <type.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className={cn("font-black uppercase tracking-tight text-lg leading-none mb-1 transition-colors", quizType === type.id ? "text-indigo-600" : "text-slate-400")}>
                                {type.title}
                            </p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{type.desc}</p>
                        </div>
                        {quizType === type.id && (
                            <CheckCircle2 className="absolute top-4 right-4 w-5 h-5 text-indigo-600 animate-in zoom-in-50" />
                        )}
                    </button>
                ))}
            </div>

            {/* Config Sections */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl shadow-slate-100/50 space-y-8">
                
                {/* Examination Slot Selection */}
                {quizType === 'examination' ? (
                    <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                        <div className="flex items-center gap-2 mb-2">
                            <CalendarDays className="w-5 h-5 text-indigo-600" />
                            <h4 className="text-sm font-black uppercase tracking-widest text-slate-800">Select Exam Slot</h4>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {slots.filter(s => s.type === 'exam').map(slot => (
                                <button
                                    key={slot.id}
                                    type="button"
                                    onClick={() => setSlotId(slot.id)}
                                    className={cn(
                                        "p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between group",
                                        slotId === slot.id ? "border-indigo-600 bg-indigo-50/20" : "border-slate-100 hover:border-slate-300"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                            slotId === slot.id ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"
                                        )}>
                                            <Clock className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-800">{slot.title}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">
                                                {format(new Date(slot.startTime), "MMM dd, HH:mm")} — {format(new Date(slot.endTime), "HH:mm")}
                                            </p>
                                        </div>
                                    </div>
                                    {slotId === slot.id && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
                                </button>
                            ))}
                            {slots.filter(s => s.type === 'exam').length === 0 && (
                                <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    <p className="text-xs font-bold text-slate-400 uppercase">No exam slots defined by Admin</p>
                                </div>
                            )}
                        </div>
                        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3 items-start">
                            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-[11px] font-bold text-amber-800 leading-relaxed uppercase tracking-tight">
                                This quiz will automatically open and close according to the selected slot's window. Standard student timers still apply but will be overridden by the slot's hard cutoff.
                            </p>
                        </div>
                    </div>
                ) : (
                    /* Standard Quiz Controls */
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                        <div className="flex items-center gap-2 mb-2">
                            <Settings2 className="w-5 h-5 text-indigo-600" />
                            <h4 className="text-sm font-black uppercase tracking-widest text-slate-800">Advanced Timing</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Available From</label>
                                <Input 
                                    type="datetime-local" 
                                    value={availableFrom} 
                                    onChange={e => setAvailableFrom(e.target.value)}
                                    className="h-12 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-indigo-600 transition-all font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Available Until</label>
                                <Input 
                                    type="datetime-local" 
                                    value={availableUntil} 
                                    onChange={e => setAvailableUntil(e.target.value)}
                                    className="h-12 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-indigo-600 transition-all font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Extended Period (Grace Minutes)</label>
                                <Input 
                                    type="number" 
                                    value={gracePeriod} 
                                    onChange={e => setGracePeriod(Number(e.target.value))}
                                    placeholder="e.g., 15"
                                    className="h-12 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-indigo-600 transition-all font-bold"
                                />
                                <p className="text-[9px] text-slate-400 font-medium ml-1">Buffer time allowing late submissions for standard quizzes.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Visibility Rule</label>
                                <div className="flex bg-slate-100 p-1 rounded-xl">
                                    {[
                                        { id: 'always', label: 'Always Visible', icon: Eye },
                                        { id: 'scheduled', label: 'Only Scheduled', icon: Calendar }
                                    ].map(opt => (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => setVisibility(opt.id as any)}
                                            className={cn(
                                                "flex-1 py-2 rounded-lg flex items-center justify-center gap-2 text-[10px] font-black uppercase transition-all",
                                                visibility === opt.id ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400"
                                            )}
                                        >
                                            <opt.icon className="w-3 h-3" /> {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <hr className="border-slate-100" />

                {/* Shared Base Settings */}
                </div>
                
                <hr className="border-slate-100" />

                {/* CA Configuration */}
                <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100/50 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                <PercentCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black uppercase tracking-tight text-slate-800">CA Integration</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Include results in continuous assessment</p>
                            </div>
                        </div>
                        <Switch 
                            checked={includeInCa}
                            onCheckedChange={setIncludeInCa}
                        />
                    </div>

                    {includeInCa && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-2 duration-300">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Averaging Logic</label>
                                <Select value={caMethod} onValueChange={(val: any) => setCaMethod(val)}>
                                    <SelectTrigger className="h-12 rounded-xl bg-white border-transparent shadow-sm font-bold">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="simple">Simple Average (Mean)</SelectItem>
                                        <SelectItem value="weighted">Weighted by Max Points</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                </div>
        </div>
    );
}
