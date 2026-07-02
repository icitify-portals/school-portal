// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { getHrMessageTemplates, saveHrMessageTemplate, getScheduledMessages, scheduleMessage, cancelScheduledMessage } from "@/actions/hr_communications";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Mail, MessageSquare, Calendar, CheckCircle2, Clock, Trash2, Edit3, Send } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function HrCommunicationsDashboard() {
    const [templates, setTemplates] = useState<any[]>([]);
    const [scheduled, setScheduled] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Template Form State
    const [activeEvent, setActiveEvent] = useState('birthday_staff');
    const [templateData, setTemplateData] = useState({
        subject: '',
        messageBody: '',
        sendViaEmail: true,
        sendViaWhatsapp: true
    });

    // Scheduler Form State
    const [scheduleData, setScheduleData] = useState({
        subject: '',
        messageBody: '',
        targetAudience: 'all_staff',
        scheduledDate: '',
        sendViaEmail: true,
        sendViaWhatsapp: false
    });

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        const t = templates.find(x => x.eventName === activeEvent);
        if (t) {
            setTemplateData({
                subject: t.subject,
                messageBody: t.messageBody,
                sendViaEmail: t.sendViaEmail,
                sendViaWhatsapp: t.sendViaWhatsapp
            });
        } else {
            setTemplateData({ subject: '', messageBody: '', sendViaEmail: true, sendViaWhatsapp: true });
        }
    }, [activeEvent, templates]);

    const loadData = async () => {
        setLoading(true);
        const [tempRes, schedRes] = await Promise.all([
            getHrMessageTemplates(),
            getScheduledMessages()
        ]);
        if (tempRes.success) setTemplates(tempRes.data || []);
        if (schedRes.success) setScheduled(schedRes.data || []);
        setLoading(false);
    };

    const handleSaveTemplate = async () => {
        const res = await saveHrMessageTemplate({
            eventName: activeEvent,
            ...templateData
        });
        if (res.success) {
            toast.success("Template saved successfully.");
            loadData();
        } else {
            toast.error(res.error || "Failed to save template");
        }
    };

    const handleScheduleMessage = async () => {
        if (!scheduleData.scheduledDate) {
            toast.error("Please select a date.");
            return;
        }
        const res = await scheduleMessage({
            ...scheduleData,
            targetAudience: scheduleData.targetAudience as any,
            createdBy: 1 // Mocking current admin ID
        });
        if (res.success) {
            toast.success("Message scheduled successfully.");
            setScheduleData({ ...scheduleData, subject: '', messageBody: '', scheduledDate: '' });
            loadData();
        } else {
            toast.error(res.error || "Failed to schedule message");
        }
    };

    const handleCancel = async (id: number) => {
        const res = await cancelScheduledMessage(id);
        if (res.success) {
            toast.success("Scheduled message cancelled.");
            loadData();
        } else {
            toast.error(res.error || "Failed to cancel message");
        }
    };

    return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-transparent">
      <div className="max-w-[1600px] w-full mx-auto space-y-10 text-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 text-white rounded-[3rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden border border-slate-800">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/30 to-indigo-650/30 opacity-50 mix-blend-overlay" />
            <div className="relative z-10">
                <div className="flex items-center gap-4 mb-2">
                    <Mail className="w-12 h-12 text-emerald-400 drop-shadow-md" />
                    <h2 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase italic drop-shadow-md">
                        HR Communications
                    </h2>
                </div>
                <p className="text-slate-300 font-medium mt-1 uppercase text-sm tracking-wide opacity-90">
                    Manage automated birthday/anniversary messages and schedule broadcast announcements
                </p>
            </div>
        </div>

        <Tabs defaultValue="templates" className="w-full space-y-8">
            <TabsList className="bg-white/60 backdrop-blur-3xl border border-white/60 p-2 rounded-[2rem] h-auto shadow-xl shadow-slate-200/40 inline-flex">
                <TabsTrigger 
                    value="templates" 
                    className="flex items-center gap-2 px-8 py-4 rounded-[1.5rem] text-sm font-black uppercase tracking-wider text-slate-500 data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
                >
                    <Edit3 className="w-4 h-4" /> Automated Templates
                </TabsTrigger>
                <TabsTrigger 
                    value="schedule" 
                    className="flex items-center gap-2 px-8 py-4 rounded-[1.5rem] text-sm font-black uppercase tracking-wider text-slate-500 data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
                >
                    <Calendar className="w-4 h-4" /> Scheduled Broadcasts
                </TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="col-span-1 space-y-2">
                        <Card className="border border-white/40 shadow-xl shadow-slate-200/40 bg-white/60 backdrop-blur-3xl rounded-[2rem] overflow-hidden">
                            <CardHeader className="pb-3 pt-6 px-6">
                                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">System Events</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 p-4">
                                <Button 
                                    variant={activeEvent === 'birthday_staff' ? 'default' : 'ghost'} 
                                    className={cn("w-full justify-start rounded-xl font-bold uppercase text-[10px] tracking-wider h-11", activeEvent === 'birthday_staff' && "bg-slate-900 text-white shadow-md")} 
                                    onClick={() => setActiveEvent('birthday_staff')}
                                >
                                    Staff Birthdays
                                </Button>
                                <Button 
                                    variant={activeEvent === 'birthday_student' ? 'default' : 'ghost'} 
                                    className={cn("w-full justify-start rounded-xl font-bold uppercase text-[10px] tracking-wider h-11", activeEvent === 'birthday_student' && "bg-slate-900 text-white shadow-md")} 
                                    onClick={() => setActiveEvent('birthday_student')}
                                >
                                    Student Birthdays
                                </Button>
                                <Button 
                                    variant={activeEvent === 'work_anniversary' ? 'default' : 'ghost'} 
                                    className={cn("w-full justify-start rounded-xl font-bold uppercase text-[10px] tracking-wider h-11", activeEvent === 'work_anniversary' && "bg-slate-900 text-white shadow-md")} 
                                    onClick={() => setActiveEvent('work_anniversary')}
                                >
                                    Work Anniversaries
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="col-span-1 md:col-span-3">
                        <Card className="border border-white/40 shadow-xl shadow-slate-200/40 bg-white/60 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden">
                            <CardHeader className="p-8 border-b border-white/40 bg-white/40">
                                <CardTitle className="text-xl font-black text-slate-900 italic tracking-tight uppercase">Edit Template: {activeEvent.replace('_', ' ')}</CardTitle>
                                <CardDescription className="text-slate-500 font-bold uppercase tracking-wider text-[10px] mt-1">Variables available: <code className="bg-slate-200 px-2 py-0.5 rounded font-mono text-[10px] text-indigo-700">[Name]</code> {activeEvent === 'work_anniversary' && <code className="bg-slate-200 px-2 py-0.5 rounded font-mono text-[10px] text-indigo-700">[YearsOfService]</code>}</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Email Subject</Label>
                                    <Input value={templateData.subject} onChange={e => setTemplateData({...templateData, subject: e.target.value})} placeholder="e.g. Happy Birthday [Name]!" className="rounded-xl border-white/60 bg-white/60 focus:bg-white font-bold h-11 transition-all text-slate-800" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Message Body</Label>
                                    <Textarea className="h-36 rounded-xl border-white/60 bg-white/60 focus:bg-white font-bold transition-all text-slate-800 custom-scrollbar" value={templateData.messageBody} onChange={e => setTemplateData({...templateData, messageBody: e.target.value})} placeholder="Dear [Name], wishing you a very happy birthday..." />
                                </div>
                                <div className="flex gap-6 pt-2">
                                    <div className="flex items-center space-x-2 bg-white/50 border border-white/60 px-4 py-2.5 rounded-xl shadow-sm">
                                        <Switch checked={templateData.sendViaEmail} onCheckedChange={c => setTemplateData({...templateData, sendViaEmail: c})} id="t-email" />
                                        <Label htmlFor="t-email" className="flex items-center gap-1.5 cursor-pointer text-xs font-black uppercase tracking-wider text-slate-650"><Mail className="w-4 h-4 text-slate-400"/> Send via Email</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 bg-white/50 border border-white/60 px-4 py-2.5 rounded-xl shadow-sm">
                                        <Switch checked={templateData.sendViaWhatsapp} onCheckedChange={c => setTemplateData({...templateData, sendViaWhatsapp: c})} id="t-wa" />
                                        <Label htmlFor="t-wa" className="flex items-center gap-1.5 cursor-pointer text-xs font-black uppercase tracking-wider text-slate-655"><MessageSquare className="w-4 h-4 text-emerald-500"/> Send via WhatsApp</Label>
                                    </div>
                                </div>
                                <Button onClick={handleSaveTemplate} className="bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl font-black uppercase text-xs tracking-wider h-11 gap-2 active:scale-95 transition-all shadow-md mt-4"><CheckCircle2 className="w-4 h-4" /> Save Template</Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-6">
                <Card className="border border-white/40 shadow-xl shadow-slate-200/40 bg-white/60 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="p-8 border-b border-white/40 bg-white/40">
                        <CardTitle className="text-xl font-black text-slate-900 italic tracking-tight uppercase">Schedule New Broadcast</CardTitle>
                        <CardDescription className="text-slate-500 font-bold uppercase tracking-wider text-[10px] mt-1">Queue a message to be sent to a specific group on a future date (e.g., Public Holidays, New Year).</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Target Audience</Label>
                                <Select value={scheduleData.targetAudience} onValueChange={v => setScheduleData({...scheduleData, targetAudience: v})}>
                                    <SelectTrigger className="rounded-xl border-white/60 bg-white/60 focus:bg-white font-bold h-11 transition-all text-slate-800"><SelectValue placeholder="Select audience" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all_staff">All Active Staff</SelectItem>
                                        <SelectItem value="all_students">All Active Students</SelectItem>
                                        <SelectItem value="all_users">Everyone (Staff & Students)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Send Date</Label>
                                <Input type="date" value={scheduleData.scheduledDate} onChange={e => setScheduleData({...scheduleData, scheduledDate: e.target.value})} className="rounded-xl border-white/60 bg-white/60 focus:bg-white font-bold h-11 transition-all text-slate-800" />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Subject</Label>
                                <Input value={scheduleData.subject} onChange={e => setScheduleData({...scheduleData, subject: e.target.value})} placeholder="Message subject..." className="rounded-xl border-white/60 bg-white/60 focus:bg-white font-bold h-11 transition-all text-slate-800" />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Message Body</Label>
                                <Textarea className="h-28 rounded-xl border-white/60 bg-white/60 focus:bg-white font-bold transition-all text-slate-800 custom-scrollbar" value={scheduleData.messageBody} onChange={e => setScheduleData({...scheduleData, messageBody: e.target.value})} placeholder="Type the broadcast message here. You can use [Name] variable." />
                            </div>
                            <div className="flex gap-6 pt-2 md:col-span-2">
                                <div className="flex items-center space-x-2 bg-white/50 border border-white/60 px-4 py-2.5 rounded-xl shadow-sm">
                                    <Switch checked={scheduleData.sendViaEmail} onCheckedChange={c => setScheduleData({...scheduleData, sendViaEmail: c})} id="s-email" />
                                    <Label htmlFor="s-email" className="flex items-center gap-1.5 cursor-pointer text-xs font-black uppercase tracking-wider text-slate-650"><Mail className="w-4 h-4 text-slate-400"/> Email</Label>
                                </div>
                                <div className="flex items-center space-x-2 bg-white/50 border border-white/60 px-4 py-2.5 rounded-xl shadow-sm">
                                    <Switch checked={scheduleData.sendViaWhatsapp} onCheckedChange={c => setScheduleData({...scheduleData, sendViaWhatsapp: c})} id="s-wa" />
                                    <Label htmlFor="s-wa" className="flex items-center gap-1.5 cursor-pointer text-xs font-black uppercase tracking-wider text-slate-655"><MessageSquare className="w-4 h-4 text-emerald-500"/> WhatsApp</Label>
                                </div>
                            </div>
                            <div className="md:col-span-2 pt-4">
                                <Button onClick={handleScheduleMessage} className="bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl font-black uppercase text-xs tracking-wider h-11 gap-2 active:scale-95 transition-all shadow-md"><Send className="w-4 h-4" /> Schedule Broadcast</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] overflow-hidden">
                    <CardHeader className="p-8 lg:p-10 border-b border-white/40 bg-white/40">
                        <CardTitle className="text-2xl font-black text-slate-900 italic tracking-tight uppercase">Scheduled Queue</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-indigo-655" /></div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-900 text-white text-[10px] font-extrabold uppercase tracking-widest border-b border-slate-800">
                                            <th className="px-8 py-6">Send Date</th>
                                            <th className="px-8 py-6">Audience</th>
                                            <th className="px-8 py-6">Subject</th>
                                            <th className="px-8 py-6">Channels</th>
                                            <th className="px-8 py-6">Status</th>
                                            <th className="px-8 py-6 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/40 bg-white/20">
                                        {scheduled.length === 0 ? (
                                            <tr><td colSpan={6} className="px-8 py-16 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">No scheduled messages found.</td></tr>
                                        ) : (
                                            scheduled.map(msg => (
                                                <tr key={msg.id} className="hover:bg-white/40 transition-colors group">
                                                    <td className="px-8 py-6 font-bold text-sm text-slate-500 font-mono">{format(new Date(msg.scheduledDate), 'MMM dd, yyyy')}</td>
                                                    <td className="px-8 py-6 font-extrabold text-xs text-slate-755 uppercase tracking-wide">{msg.targetAudience.replace('_', ' ')}</td>
                                                    <td className="px-8 py-6 text-sm font-bold text-slate-900 max-w-xs truncate" title={msg.subject}>{msg.subject}</td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex gap-2">
                                                            {msg.sendViaEmail && (
                                                                <div className="p-2 bg-slate-200 rounded-lg text-slate-600" title="Email">
                                                                    <Mail className="w-4 h-4" />
                                                                </div>
                                                            )}
                                                            {msg.sendViaWhatsapp && (
                                                                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600" title="WhatsApp">
                                                                    <MessageSquare className="w-4 h-4" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        {msg.status === 'pending' && <span className="px-3 py-1 bg-amber-100 text-amber-700 border border-amber-250 text-[10px] font-black uppercase tracking-wider rounded-md shadow-sm">Pending</span>}
                                                        {msg.status === 'sent' && <span className="px-3 py-1 bg-emerald-100 text-emerald-700 border border-emerald-250 text-[10px] font-black uppercase tracking-wider rounded-md shadow-sm">Sent</span>}
                                                        {msg.status === 'cancelled' && <span className="px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-black uppercase tracking-wider rounded-md shadow-sm">Cancelled</span>}
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        {msg.status === 'pending' && (
                                                            <Button 
                                                                variant="outline" 
                                                                className="border-rose-250 text-rose-700 hover:bg-rose-100 rounded-xl font-black uppercase text-[10px] tracking-wider h-10 px-4 active:scale-95 transition-all shadow-sm gap-2" 
                                                                onClick={() => handleCancel(msg.id)}
                                                            >
                                                                <Trash2 className="w-4 h-4" /> Cancel
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
