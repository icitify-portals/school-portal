
import { getCalendarEvents, getUpcomingEvents } from "@/actions/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    Calendar as CalendarIcon, 
    Plus, 
    ChevronLeft, 
    ChevronRight,
    MapPin,
    Clock,
    Users,
    CheckCircle2
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from "date-fns";
import Link from "next/link";

export default async function AcademicCalendarPage() {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    const events = await getCalendarEvents({
        startDate: monthStart,
        endDate: monthEnd
    });

    const upcoming = await getUpcomingEvents(3);

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-transparent">
            <div className="max-w-[1600px] w-full mx-auto space-y-10 text-slate-800">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 text-white rounded-[3rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden border border-slate-800">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-indigo-650/30 opacity-50 mix-blend-overlay" />
                    <div className="relative z-10 flex-1">
                        <div className="flex items-center gap-4 mb-2">
                            <CalendarIcon className="w-12 h-12 text-indigo-400 drop-shadow-md" />
                            <h2 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase italic drop-shadow-md">
                                Academic Calendar
                            </h2>
                        </div>
                        <p className="text-slate-300 font-medium mt-1 uppercase text-sm tracking-wide opacity-90">
                            Institutional timeline, term dates, and event coordination
                        </p>
                    </div>
                    <div className="relative z-10 flex gap-3 shrink-0">
                        <Button variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-2xl font-black uppercase tracking-widest text-xs h-14 px-6 active:scale-95 transition-all">
                            <CalendarIcon className="w-4 h-4 mr-2" />
                            Today
                        </Button>
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-6 rounded-2xl font-black uppercase tracking-widest text-xs shadow-md border border-white/10 active:scale-95 transition-all">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Event
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Main Calendar Grid */}
                    <Card className="lg:col-span-3 border border-white/40 shadow-2xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl overflow-hidden rounded-[3rem]">
                        <CardHeader className="flex flex-row justify-between items-center bg-slate-900 text-white p-8">
                            <CardTitle className="text-2xl font-black uppercase italic tracking-tight">
                                {format(today, "MMMM yyyy")}
                            </CardTitle>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="icon" className="h-10 w-10 text-white hover:bg-white/10 rounded-xl">
                                    <ChevronLeft className="w-5 h-5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-10 w-10 text-white hover:bg-white/10 rounded-xl">
                                    <ChevronRight className="w-5 h-5" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="grid grid-cols-7 border-b border-white/45 bg-slate-100/50">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                    <div key={day} className="py-4 text-center text-[10px] font-black text-slate-450 uppercase tracking-widest">
                                        {day}
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 bg-white/20 divide-x divide-y divide-white/45">
                                {days.map((day, idx) => {
                                    const dayEvents = events.filter(e => isSameDay(new Date(e.startDate), day));
                                    const isCurrentMonthDay = isSameMonth(day, today);
                                    return (
                                        <div 
                                            key={idx} 
                                            className={`min-h-[140px] p-4 transition-colors flex flex-col justify-between ${
                                                !isCurrentMonthDay ? 'bg-slate-100/20 text-slate-400' : 'text-slate-800'
                                            } hover:bg-white/30`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <span className={`text-xs font-black ${
                                                    isToday(day) 
                                                        ? 'w-7 h-7 flex items-center justify-center bg-indigo-600 text-white rounded-full font-mono shadow-md shadow-indigo-200' 
                                                        : 'text-slate-500 font-mono'
                                                }`}>
                                                    {format(day, "d")}
                                                </span>
                                            </div>
                                            <div className="mt-4 space-y-1.5">
                                                {dayEvents.map(event => (
                                                    <div 
                                                        key={event.id}
                                                        className="px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-xl truncate border"
                                                        style={{ 
                                                            backgroundColor: `${event.color}15`, 
                                                            color: event.color || '#4F46E5',
                                                            borderColor: `${event.color}40` || '#4F46E5'
                                                        }}
                                                    >
                                                        {event.title}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sidebar: Upcoming & Milestones */}
                    <div className="space-y-8">
                        <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[2.5rem] p-6 overflow-hidden">
                            <CardHeader className="p-0 mb-6">
                                <CardTitle className="text-lg font-black text-slate-800 uppercase italic tracking-tight">Key Milestones</CardTitle>
                                <CardDescription className="text-[10px] font-bold text-slate-455 uppercase tracking-widest">Academic Session 2026/27</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0 space-y-4">
                                {[
                                    { name: "Resumption", date: "May 10", done: true },
                                    { name: "Registration Deadline", date: "May 25", done: false },
                                    { name: "Mid-Term Break", date: "Jun 15", done: false },
                                    { name: "Exams Start", date: "Jul 20", done: false },
                                ].map((milestone, idx) => (
                                    <div key={idx} className="flex items-center gap-3 group">
                                        <div className={`p-1.5 rounded-full border ${
                                            milestone.done ? 'bg-emerald-50 border-emerald-250 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-400'
                                        }`}>
                                            <CheckCircle2 className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1">
                                            <p className={`text-xs font-black uppercase ${milestone.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                                {milestone.name}
                                            </p>
                                            <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wide font-mono mt-0.5">{milestone.date}</p>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card className="border border-white/10 shadow-xl bg-indigo-900 text-white rounded-[2.5rem] p-6 overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-800/50 to-purple-800/50 opacity-40" />
                            <CardHeader className="p-0 mb-6 relative z-10">
                                <CardTitle className="text-lg font-black uppercase italic tracking-tight">Featured Events</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 space-y-6 relative z-10">
                                {upcoming.map((event) => (
                                    <div key={event.id} className="space-y-2 border-l-2 border-indigo-400/40 pl-4 py-1">
                                        <p className="text-sm font-black uppercase tracking-wide leading-tight">{event.title}</p>
                                        <div className="flex items-center gap-2 text-[10px] text-indigo-200 font-bold uppercase tracking-wider font-mono">
                                            <Clock className="w-3.5 h-3.5 text-indigo-300" />
                                            {format(new Date(event.startDate), "MMM dd, hh:mm a")}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-indigo-200 font-bold uppercase tracking-wider">
                                            <MapPin className="w-3.5 h-3.5 text-indigo-300" />
                                            {event.unit?.name || "Main Campus"}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-indigo-200 font-bold uppercase tracking-wider">
                                            <Users className="w-3.5 h-3.5 text-indigo-300" />
                                            {event.targetAudience}
                                        </div>
                                    </div>
                                ))}
                                {upcoming.length === 0 && (
                                    <p className="text-xs text-indigo-300 italic text-center py-4 uppercase font-bold tracking-wider">No upcoming featured events</p>
                                )}
                            </CardContent>
                            <CalendarIcon className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5 pointer-events-none" />
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
