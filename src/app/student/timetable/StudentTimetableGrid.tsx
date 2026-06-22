"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, User, BookOpen } from "lucide-react";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"] as const;

function generateTimeSlots(start: string, end: string) {
    const slots = [];
    let currentHour = parseInt(start.split(':')[0]);
    const endHour = parseInt(end.split(':')[0]);

    for (let h = currentHour; h <= endHour; h++) {
        slots.push(`${h.toString().padStart(2, '0')}:00`);
    }
    return slots;
}

export default function StudentTimetableGrid({ initialData, deptSettings }: any) {
    const settings = deptSettings || {
        timetableStart: "08:00",
        timetableEnd: "16:00",
        breakStart: "13:00",
        breakEnd: "14:00"
    };

    const times = generateTimeSlots(settings.timetableStart, settings.timetableEnd);

    const getSlotsForDayAndTime = (day: string, time: string) => {
        return initialData.filter((s: any) => s.day === day && s.startTime === time);
    };

    return (
        <Card className="border-none shadow-2xl overflow-hidden rounded-2xl">
            <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-8">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Weekly View</CardTitle>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Current Semester</span>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <div className="min-w-[1000px]">
                        {/* Header Days */}
                        <div className="grid grid-cols-6 bg-slate-50 border-b border-slate-100">
                            <div className="p-6 text-xs font-black uppercase tracking-widest text-slate-400">Schedule</div>
                            {DAYS.map(day => (
                                <div key={day} className="p-6 text-xs font-black uppercase tracking-widest text-slate-400 text-center border-l border-slate-100">{day}</div>
                            ))}
                        </div>

                        {/* Time Grid */}
                        <div className="divide-y divide-slate-100">
                            {times.map(time => {
                                const isBreak = time >= settings.breakStart && time < settings.breakEnd;
                                return (
                                    <div key={time} className="grid grid-cols-6 items-stretch min-h-[140px]">
                                        <div className="p-6 text-xs font-black text-slate-400 bg-slate-50/50 flex flex-col justify-center items-center gap-1 border-r border-slate-100">
                                            <Clock className="w-4 h-4 text-slate-300" />
                                            {time}
                                        </div>
                                        {DAYS.map(day => {
                                            const slots = getSlotsForDayAndTime(day, time);
                                            return (
                                                <div key={`${day}-${time}`} className={`p-3 border-l border-slate-100 relative group transition-all duration-300 ${isBreak ? 'bg-slate-50/30' : 'hover:bg-slate-50/50'}`}>
                                                    {isBreak ? (
                                                        <div className="h-full flex items-center justify-center opacity-10 rotate-[-15deg]">
                                                            <span className="text-xl font-black uppercase tracking-[0.5em] text-slate-400">BREAK</span>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            {slots.map((slot: any) => (
                                                                <div key={slot.id} className="bg-white border-2 border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all cursor-default border-l-4 border-l-indigo-600 group/item">
                                                                    <div className="flex justify-between items-start mb-2">
                                                                        <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-none font-black text-[10px] tracking-tight">{slot.assignment.course.code}</Badge>
                                                                        <span className="text-[10px] font-black text-slate-300 group-hover/item:text-indigo-200 transition-colors uppercase tracking-widest">{slot.assignment.course.creditUnits} Units</span>
                                                                    </div>
                                                                    <h4 className="text-xs font-black text-slate-800 line-clamp-2 leading-relaxed mb-3 pr-2">{slot.assignment.course.name}</h4>

                                                                    <div className="space-y-2">
                                                                        <div className="flex items-center gap-2 text-slate-500 group-hover/item:text-slate-900 transition-colors">
                                                                            <MapPin className="w-3 h-3 text-indigo-400" />
                                                                            <span className="text-[10px] font-bold uppercase tracking-tight">{slot.venue}</span>
                                                                        </div>

                                                                        {/* Hover effect for Lecturer Name */}
                                                                        <div className="pt-2 border-t border-slate-50 opacity-60 group-hover/item:opacity-100 flex items-center gap-2 text-slate-400 group-hover/item:text-indigo-600 transition-all">
                                                                            <User className="w-3 h-3" />
                                                                            <p className="text-[10px] font-bold italic truncate">
                                                                                {slot.assignment.staff.user.name}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
