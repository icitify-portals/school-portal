"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getProgrammes } from "@/actions/programmes";
import { getDepartments } from "@/actions/departments";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createAutomatedSchedule, getAutomatedSchedules } from "@/actions/automated-messages-processor";

export default function AutomatedMessagesDashboard() {
    const [title, setTitle] = useState("");
    const [messageTemplate, setMessageTemplate] = useState("");
    const [triggerType, setTriggerType] = useState<"fixed_date" | "birthday" | "custom_event">("fixed_date");
    const [targetType, setTargetType] = useState<"all" | "levels" | "departments" | "programmes" | "users" | "staff">("all");
    const [triggerDate, setTriggerDate] = useState("");
    const [loading, setLoading] = useState(false);
    
    // Metadata states
    const [programmesList, setProgrammesList] = useState<any[]>([]);
    const [departmentsList, setDepartmentsList] = useState<any[]>([]);
    const [schedules, setSchedules] = useState<any[]>([]);
    
    // Selections
    const [selectedLevel, setSelectedLevel] = useState<string>("");
    const [selectedDept, setSelectedDept] = useState<string>("");
    const [selectedProg, setSelectedProg] = useState<string>("");
    const [targetCriteriaEmails, setTargetCriteriaEmails] = useState<string>("");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [progRes, deptRes, sRes] = await Promise.all([
            getProgrammes(),
            getDepartments(),
            getAutomatedSchedules()
        ]);
        
        if (Array.isArray(progRes)) setProgrammesList(progRes);
        if (Array.isArray(deptRes)) setDepartmentsList(deptRes);
        if (sRes.success) setSchedules(sRes.data || []);
    };

    const handleCreate = async () => {
        if (!title || !messageTemplate) {
            toast.error("Please provide a title and a message template");
            return;
        }

        let targetCriteria: any = { type: targetType };

        if (targetType === "levels" && selectedLevel) {
            targetCriteria.levels = [selectedLevel];
        } else if (targetType === "departments" && selectedDept) {
            targetCriteria.departments = [parseInt(selectedDept)];
        } else if (targetType === "programmes" && selectedProg) {
            targetCriteria.programmes = [parseInt(selectedProg)];
        } else if (targetType === "users" && targetCriteriaEmails) {
            targetCriteria.emails = targetCriteriaEmails.split(",").map(e => e.trim());
        }

        setLoading(true);
        const res = await createAutomatedSchedule({
            title,
            messageTemplate,
            triggerType,
            triggerDate,
            targetCriteria
        });
        setLoading(false);

        if (res.success) {
            toast.success("Automated template scheduled successfully.");
            setTitle("");
            setMessageTemplate("");
            loadData();
        } else {
            toast.error(res.error || "Failed to schedule template.");
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>Create Felicitation / Automated Message</CardTitle>
                    <CardDescription>Configure rules to auto-dispatch messages on special days.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">Title</label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Happy Eid-l-fitr!" />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Message Template</label>
                        <Textarea 
                            value={messageTemplate} 
                            onChange={(e) => setMessageTemplate(e.target.value)} 
                            placeholder="e.g. Wishing you a blessed holiday!"
                            rows={4} 
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium">Trigger Event</label>
                            <Select value={triggerType} onValueChange={(val: any) => setTriggerType(val)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="fixed_date">Specific Date (Holidays)</SelectItem>
                                    <SelectItem value="birthday">User Birthdays</SelectItem>
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

                    {triggerType === "fixed_date" && (
                        <div>
                            <label className="text-sm font-medium">Trigger Date</label>
                            <Input type="date" value={triggerDate} onChange={e => setTriggerDate(e.target.value)} />
                            <p className="text-xs text-gray-500 mt-1">When should this trigger?</p>
                        </div>
                    )}

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

                    <Button onClick={handleCreate} disabled={loading} className="w-full">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Automated Schedule
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Active Schedules</CardTitle>
                    <CardDescription>Your configured automated message rules</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto">
                        {schedules.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">No schedules configured yet.</p>
                        ) : (
                            schedules.map(s => (
                                <div key={s.id} className="border p-4 rounded-lg flex flex-col gap-1">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-semibold">{s.title}</h4>
                                        <span className={`text-xs px-2 py-1 rounded-full ${s.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {s.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 line-clamp-2">{s.messageTemplate}</p>
                                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                                        <span className="capitalize">{s.triggerType.replace("_", " ")}</span>
                                        {s.triggerDate && <span>Triggers: {new Date(s.triggerDate).toLocaleDateString()}</span>}
                                        <span>Created: {new Date(s.createdAt).toLocaleDateString()}</span>
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
