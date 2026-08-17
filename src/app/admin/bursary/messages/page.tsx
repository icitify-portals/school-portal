"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { dispatchBulkMessage, getBroadcastMessages } from "@/actions/registrar-messages";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getProgrammes } from "@/actions/programmes";
import { getDepartments } from "@/actions/departments";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function BursaryMessagesPage() {
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [channel, setChannel] = useState<"toast" | "email" | "both">("both");
    const [targetType, setTargetType] = useState<"all" | "levels" | "departments" | "programmes" | "users">("all");
    const [scheduledFor, setScheduledFor] = useState("");
    const [loading, setLoading] = useState(false);
    
    // Metadata states
    const [programmesList, setProgrammesList] = useState<any[]>([]);
    const [departmentsList, setDepartmentsList] = useState<any[]>([]);
    const [broadcasts, setBroadcasts] = useState<any[]>([]);
    
    // Selections
    const [selectedLevel, setSelectedLevel] = useState<string>("");
    const [selectedDept, setSelectedDept] = useState<string>("");
    const [selectedProg, setSelectedProg] = useState<string>("");
    const [targetCriteriaEmails, setTargetCriteriaEmails] = useState<string>("");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [progRes, deptRes, bRes] = await Promise.all([
            getProgrammes(),
            getDepartments(),
            getBroadcastMessages()
        ]);
        
        if (Array.isArray(progRes)) setProgrammesList(progRes);
        if (Array.isArray(deptRes)) setDepartmentsList(deptRes);
        if (bRes.success) setBroadcasts(bRes.data || []);
    };

    const handleSend = async () => {
        if (!title || !message) {
            toast.error("Please provide a title and a message");
            return;
        }

        let payload: any = {
            title,
            message,
            channel,
            targetType,
        };

        if (scheduledFor) {
            payload.scheduledFor = scheduledFor;
        }

        if (targetType === "levels" && selectedLevel) {
            payload.levels = [selectedLevel];
        } else if (targetType === "departments" && selectedDept) {
            payload.departments = [parseInt(selectedDept)];
        } else if (targetType === "programmes" && selectedProg) {
            payload.programmes = [parseInt(selectedProg)];
        } else if (targetType === "users" && targetCriteriaEmails) {
            payload.emails = targetCriteriaEmails.split(",").map(e => e.trim());
        }

        setLoading(true);
        const res = await dispatchBulkMessage(payload);
        setLoading(false);

        if (res.success) {
            toast.success("Broadcast message scheduled/dispatched successfully.");
            setTitle("");
            setMessage("");
            loadData();
        } else {
            toast.error(res.error || "Failed to dispatch message.");
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>Send Bulk Message</CardTitle>
                    <CardDescription>Dispatch in-app notifications and emails</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">Title</label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Message Title" />
                    </div>
                    
                    <div>
                        <label className="text-sm font-medium">Message Body</label>
                        <Textarea rows={6} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type your message here..." />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium">Channel</label>
                            <Select value={channel} onValueChange={(val: any) => setChannel(val)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="both">Both (Email & In-App)</SelectItem>
                                    <SelectItem value="toast">In-App Notification Only</SelectItem>
                                    <SelectItem value="email">Email Only</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Target Audience</label>
                            <Select value={targetType} onValueChange={(val: any) => setTargetType(val)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Entire School</SelectItem>
                                    <SelectItem value="levels">Specific Level</SelectItem>
                                    <SelectItem value="departments">Specific Department</SelectItem>
                                    <SelectItem value="programmes">Specific Programme</SelectItem>
                                    <SelectItem value="users">Individual Users</SelectItem>
                                    <SelectItem value="staff">Staff Only</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {targetType === "users" && (
                        <div>
                            <label className="text-sm font-medium">Individual Emails (comma separated)</label>
                            <Input value={targetCriteriaEmails} onChange={(e) => setTargetCriteriaEmails(e.target.value)} placeholder="e.g. user1@example.com, aa.adelopo2@gmail.com" />
                        </div>
                    )}

                    {targetType === "levels" && (
                        <div>
                            <label className="text-sm font-medium">Select Level</label>
                            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                                <SelectTrigger><SelectValue placeholder="Choose a level" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Applicant">Applicant</SelectItem>
                                    <SelectItem value="ND 1">ND 1</SelectItem>
                                    <SelectItem value="ND 2">ND 2</SelectItem>
                                    <SelectItem value="ND_graduated">ND Graduated</SelectItem>
                                    <SelectItem value="HND 1">HND 1</SelectItem>
                                    <SelectItem value="HND 2">HND 2</SelectItem>
                                    <SelectItem value="HND_graduated">HND Graduated</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {targetType === "departments" && (
                        <div>
                            <label className="text-sm font-medium">Select Department</label>
                            <Select value={selectedDept} onValueChange={setSelectedDept}>
                                <SelectTrigger><SelectValue placeholder="Choose a department" /></SelectTrigger>
                                <SelectContent>
                                    {departmentsList.map(d => (
                                        <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {targetType === "programmes" && (
                        <div>
                            <label className="text-sm font-medium">Select Programme</label>
                            <Select value={selectedProg} onValueChange={setSelectedProg}>
                                <SelectTrigger><SelectValue placeholder="Choose a programme" /></SelectTrigger>
                                <SelectContent>
                                    {programmesList.map(p => (
                                        <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div>
                        <label className="text-sm font-medium">Schedule (Optional)</label>
                        <Input type="datetime-local" value={scheduledFor} onChange={e => setScheduledFor(e.target.value)} />
                        <p className="text-xs text-gray-500 mt-1">Leave blank to send immediately.</p>
                    </div>

                    <Button onClick={handleSend} disabled={loading} className="w-full">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Dispatch Message
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Broadcast History</CardTitle>
                    <CardDescription>Recent messages sent by the registrar</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto">
                        {broadcasts.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">No broadcasts found.</p>
                        ) : (
                            broadcasts.map(b => (
                                <div key={b.id} className="border p-4 rounded-lg flex flex-col gap-1">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-semibold">{b.title}</h4>
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                            b.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                            b.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            b.status === 'failed' ? 'bg-red-100 text-red-800' :
                                            'bg-blue-100 text-blue-800'
                                        }`}>
                                            {b.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 line-clamp-2">{b.message}</p>
                                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                                        <span>Sent via {b.channel}</span>
                                        {b.scheduledFor && <span>Scheduled: {new Date(b.scheduledFor).toLocaleString()}</span>}
                                        <span>{new Date(b.createdAt).toLocaleString()}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
