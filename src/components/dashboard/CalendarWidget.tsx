"use client";

import { useState, useEffect } from "react";
import { getUpcomingEvents } from "@/actions/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, MapPin } from "lucide-react";

export default function CalendarWidget() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getUpcomingEvents(4).then(data => {
            setEvents(data);
            setLoading(false);
        });
    }, []);

    if (loading) return (
        <Card className="border-none shadow-sm bg-white animate-pulse">
            <div className="h-[200px] w-full bg-slate-50 rounded-xl" />
        </Card>
    );

    return (
        <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-indigo-500" />
                    Upcoming Events
                </CardTitle>
                <button className="text-[10px] font-bold text-indigo-600 hover:underline uppercase">View Full</button>
            </CardHeader>
            <CardContent className="px-0">
                <div className="divide-y divide-slate-50">
                    {events.map((event) => (
                        <div key={event.id} className="p-4 hover:bg-slate-50/50 transition-colors group">
                            <div className="flex gap-4">
                                <div className="flex flex-col items-center justify-center min-w-[45px] h-[45px] rounded-xl bg-indigo-50 text-indigo-600">
                                    <span className="text-[10px] font-bold uppercase leading-none">
                                        {format(new Date(event.startDate), "MMM")}
                                    </span>
                                    <span className="text-lg font-black leading-none">
                                        {format(new Date(event.startDate), "dd")}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                                        {event.title}
                                    </p>
                                    <div className="flex items-center gap-3 mt-1">
                                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                                            <Clock className="w-3 h-3" />
                                            {format(new Date(event.startDate), "HH:mm")}
                                        </div>
                                        {event.unit && (
                                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium truncate">
                                                <MapPin className="w-3 h-3" />
                                                {event.unit.name}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {events.length === 0 && (
                        <div className="p-8 text-center">
                            <p className="text-xs text-slate-400 italic">No upcoming events scheduled.</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
