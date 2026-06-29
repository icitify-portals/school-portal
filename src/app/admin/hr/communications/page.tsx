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
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">HR Communications</h1>
                <p className="text-slate-500">Manage automated birthday/anniversary messages and schedule broadcast announcements.</p>
            </div>

            <Tabs defaultValue="templates" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="templates" className="flex items-center"><Edit3 className="w-4 h-4 mr-2" /> Automated Templates</TabsTrigger>
                    <TabsTrigger value="schedule" className="flex items-center"><Calendar className="w-4 h-4 mr-2" /> Scheduled Broadcasts</TabsTrigger>
                </TabsList>

                <TabsContent value="templates" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="col-span-1 space-y-2">
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-semibold text-slate-500 uppercase">System Events</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-1 p-2">
                                    <Button variant={activeEvent === 'birthday_staff' ? 'default' : 'ghost'} className="w-full justify-start" onClick={() => setActiveEvent('birthday_staff')}>Staff Birthdays</Button>
                                    <Button variant={activeEvent === 'birthday_student' ? 'default' : 'ghost'} className="w-full justify-start" onClick={() => setActiveEvent('birthday_student')}>Student Birthdays</Button>
                                    <Button variant={activeEvent === 'work_anniversary' ? 'default' : 'ghost'} className="w-full justify-start" onClick={() => setActiveEvent('work_anniversary')}>Work Anniversaries</Button>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="col-span-1 md:col-span-3">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Edit Template: {activeEvent.replace('_', ' ').toUpperCase()}</CardTitle>
                                    <CardDescription>Variables available: <code className="bg-slate-100 px-1 rounded text-xs">[Name]</code> {activeEvent === 'work_anniversary' && <code className="bg-slate-100 px-1 rounded text-xs">[YearsOfService]</code>}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Email Subject</Label>
                                        <Input value={templateData.subject} onChange={e => setTemplateData({...templateData, subject: e.target.value})} placeholder="e.g. Happy Birthday [Name]!" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Message Body</Label>
                                        <Textarea className="h-32" value={templateData.messageBody} onChange={e => setTemplateData({...templateData, messageBody: e.target.value})} placeholder="Dear [Name], wishing you a very happy birthday..." />
                                    </div>
                                    <div className="flex gap-6 pt-2">
                                        <div className="flex items-center space-x-2">
                                            <Switch checked={templateData.sendViaEmail} onCheckedChange={c => setTemplateData({...templateData, sendViaEmail: c})} id="t-email" />
                                            <Label htmlFor="t-email" className="flex items-center"><Mail className="w-4 h-4 mr-1 text-slate-500"/> Send via Email</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Switch checked={templateData.sendViaWhatsapp} onCheckedChange={c => setTemplateData({...templateData, sendViaWhatsapp: c})} id="t-wa" />
                                            <Label htmlFor="t-wa" className="flex items-center"><MessageSquare className="w-4 h-4 mr-1 text-emerald-500"/> Send via WhatsApp</Label>
                                        </div>
                                    </div>
                                    <Button onClick={handleSaveTemplate} className="mt-4"><CheckCircle2 className="w-4 h-4 mr-2" /> Save Template</Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="schedule" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Schedule New Broadcast</CardTitle>
                            <CardDescription>Queue a message to be sent to a specific group on a future date (e.g., Public Holidays, New Year).</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Target Audience</Label>
                                    <Select value={scheduleData.targetAudience} onValueChange={v => setScheduleData({...scheduleData, targetAudience: v})}>
                                        <SelectTrigger><SelectValue placeholder="Select audience" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all_staff">All Active Staff</SelectItem>
                                            <SelectItem value="all_students">All Active Students</SelectItem>
                                            <SelectItem value="all_users">Everyone (Staff & Students)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Send Date</Label>
                                    <Input type="date" value={scheduleData.scheduledDate} onChange={e => setScheduleData({...scheduleData, scheduledDate: e.target.value})} />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Subject</Label>
                                    <Input value={scheduleData.subject} onChange={e => setScheduleData({...scheduleData, subject: e.target.value})} placeholder="Message subject..." />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Message Body</Label>
                                    <Textarea className="h-24" value={scheduleData.messageBody} onChange={e => setScheduleData({...scheduleData, messageBody: e.target.value})} placeholder="Type the broadcast message here. You can use [Name] variable." />
                                </div>
                                <div className="flex gap-6 pt-2 md:col-span-2">
                                    <div className="flex items-center space-x-2">
                                        <Switch checked={scheduleData.sendViaEmail} onCheckedChange={c => setScheduleData({...scheduleData, sendViaEmail: c})} id="s-email" />
                                        <Label htmlFor="s-email" className="flex items-center"><Mail className="w-4 h-4 mr-1 text-slate-500"/> Email</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Switch checked={scheduleData.sendViaWhatsapp} onCheckedChange={c => setScheduleData({...scheduleData, sendViaWhatsapp: c})} id="s-wa" />
                                        <Label htmlFor="s-wa" className="flex items-center"><MessageSquare className="w-4 h-4 mr-1 text-emerald-500"/> WhatsApp</Label>
                                    </div>
                                </div>
                                <div className="md:col-span-2 pt-2">
                                    <Button onClick={handleScheduleMessage} className="w-full md:w-auto"><Send className="w-4 h-4 mr-2" /> Schedule Broadcast</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Scheduled Queue</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex justify-center p-4"><Loader2 className="animate-spin text-slate-400" /></div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 border-b text-slate-500 uppercase text-xs font-bold">
                                            <tr>
                                                <th className="px-6 py-4">Date</th>
                                                <th className="px-6 py-4">Audience</th>
                                                <th className="px-6 py-4">Subject</th>
                                                <th className="px-6 py-4">Channels</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {scheduled.length === 0 ? (
                                                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">No scheduled messages found.</td></tr>
                                            ) : (
                                                scheduled.map(msg => (
                                                    <tr key={msg.id} className="border-b last:border-0 hover:bg-slate-50">
                                                        <td className="px-6 py-4 font-medium text-slate-900">{format(new Date(msg.scheduledDate), 'MMM dd, yyyy')}</td>
                                                        <td className="px-6 py-4 text-slate-600">{msg.targetAudience.replace('_', ' ')}</td>
                                                        <td className="px-6 py-4 text-slate-900 max-w-xs truncate" title={msg.subject}>{msg.subject}</td>
                                                        <td className="px-6 py-4 flex gap-2">
                                                            // @ts-expect-error - TS2322: Auto-suppressed for build
                                                            {msg.sendViaEmail && <Mail className="w-4 h-4 text-slate-400" title="Email" />}
                                                            // @ts-expect-error - TS2322: Auto-suppressed for build
                                                            {msg.sendViaWhatsapp && <MessageSquare className="w-4 h-4 text-emerald-500" title="WhatsApp" />}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {msg.status === 'pending' && <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-700"><Clock className="w-3 h-3 mr-1" /> Pending</span>}
                                                            {msg.status === 'sent' && <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-emerald-100 text-emerald-700"><CheckCircle2 className="w-3 h-3 mr-1" /> Sent</span>}
                                                            {msg.status === 'cancelled' && <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-700">Cancelled</span>}
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            {msg.status === 'pending' && (
                                                                <Button size="sm" variant="ghost" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50" onClick={() => handleCancel(msg.id)}>
                                                                    <Trash2 className="w-4 h-4 mr-1" /> Cancel
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
    );
}
