
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
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Academic Calendar</h1>
                    <p className="text-slate-500 mt-1">Institutional timeline, term dates, and event coordination.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        Today
                    </Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Event
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Main Calendar Grid */}
                <Card className="lg:col-span-3 border-none shadow-sm bg-white overflow-hidden">
                    <CardHeader className="flex flex-row justify-between items-center bg-slate-50/50 border-b border-slate-100">
                        <div>
                            <CardTitle className="text-xl font-bold text-slate-800">
                                {format(today, "MMMM yyyy")}
                            </CardTitle>
                        </div>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="grid grid-cols-7 border-b border-slate-100">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <div key={day} className="py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    {day}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7">
                            {days.map((day, idx) => {
                                const dayEvents = events.filter(e => isSameDay(new Date(e.startDate), day));
                                return (
                                    <div 
                                        key={idx} 
                                        className={`min-h-[140px] p-3 border-r border-b border-slate-50 hover:bg-slate-50/30 transition-colors ${
                                            !isSameMonth(day, today) ? 'bg-slate-50/50' : ''
                                        }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <span className={`text-sm font-bold ${
                                                isToday(day) 
                                                    ? 'w-7 h-7 flex items-center justify-center bg-indigo-600 text-white rounded-full' 
                                                    : 'text-slate-600'
                                            }`}>
                                                {format(day, "d")}
                                            </span>
                                        </div>
                                        <div className="mt-2 space-y-1">
                                            {dayEvents.map(event => (
                                                <div 
                                                    key={event.id}
                                                    className="px-2 py-1 text-[10px] font-bold rounded-md truncate border-l-2"
                                                    style={{ 
                                                        backgroundColor: `${event.color}15`, 
                                                        color: event.color || '#4F46E5',
                                                        borderColor: event.color || '#4F46E5'
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
                <div className="space-y-6">
                    <Card className="border-none shadow-sm bg-white overflow-hidden">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg">Key Milestones</CardTitle>
                            <CardDescription>Academic Session 2026/27</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[
                                { name: "Resumption", date: "May 10", done: true },
                                { name: "Registration Deadline", date: "May 25", done: false },
                                { name: "Mid-Term Break", date: "Jun 15", done: false },
                                { name: "Exams Start", date: "Jul 20", done: false },
                            ].map((milestone, idx) => (
                                <div key={idx} className="flex items-center gap-3 group">
                                    <div className={`p-1.5 rounded-full ${
                                        milestone.done ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'
                                    }`}>
                                        <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1">
                                        <p className={`text-xs font-bold ${milestone.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                            {milestone.name}
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-medium">{milestone.date}</p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-indigo-900 text-white overflow-hidden">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg text-white">Featured Events</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {upcoming.map((event) => (
                                <div key={event.id} className="space-y-2 border-l-2 border-indigo-400/30 pl-4 py-1">
                                    <p className="text-sm font-bold leading-tight">{event.title}</p>
                                    <div className="flex items-center gap-2 text-[10px] text-indigo-200">
                                        <Clock className="w-3 h-3" />
                                        {format(new Date(event.startDate), "MMM dd, hh:mm a")}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-indigo-200">
                                        <MapPin className="w-3 h-3" />
                                        {event.unit?.name || "Main Campus"}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-indigo-200">
                                        <Users className="w-3 h-3" />
                                        {event.targetAudience}
                                    </div>
                                </div>
                            ))}
                            {upcoming.length === 0 && (
                                <p className="text-xs text-indigo-300 italic text-center py-4">No upcoming featured events</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
