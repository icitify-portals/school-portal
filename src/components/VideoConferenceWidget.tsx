"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Loader2, ExternalLink, Calendar, Clock } from "lucide-react";
import { createMeeting, getConferencingStatus } from "@/actions/video-conferencing";
import { toast } from "sonner";

interface Props {
    courseId?: number;
    courseName?: string;
}

export default function VideoConferenceWidget({ courseId, courseName }: Props) {
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [meetingResult, setMeetingResult] = useState<any>(null);
    const [provider, setProvider] = useState<'zoom' | 'bbb'>('zoom');
    const [title, setTitle] = useState(courseName ? `${courseName} - Live Session` : '');
    const [duration, setDuration] = useState(60);
    const [startTime, setStartTime] = useState('');

    const handleCreate = async () => {
        if (!title || !startTime) { toast.error("Fill in all fields"); return; }
        setLoading(true);
        const result = await createMeeting({
            provider,
            title,
            startTime: new Date(startTime).toISOString(),
            duration,
            courseId,
        });
        if (result?.success) {
            setMeetingResult(result.meeting);
            toast.success(`${provider === 'zoom' ? 'Zoom' : 'BBB'} meeting created!`);
        } else {
            toast.error(result?.error || "Failed to create meeting");
        }
        setLoading(false);
    };

    if (meetingResult) {
        return (
            <Card className="border-indigo-200 bg-indigo-50">
                <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                        <Video className="w-5 h-5 text-indigo-600" />
                        <span className="font-black text-indigo-900">{meetingResult.title}</span>
                    </div>
                    <div className="flex gap-2">
                        <a href={meetingResult.joinUrl} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                                <ExternalLink className="w-3 h-3" /> Join Meeting
                            </Button>
                        </a>
                        {meetingResult.hostUrl && (
                            <a href={meetingResult.hostUrl} target="_blank" rel="noopener noreferrer">
                                <Button size="sm" variant="outline" className="gap-2">
                                    Host Link
                                </Button>
                            </a>
                        )}
                    </div>
                    <button onClick={() => { setMeetingResult(null); setShowForm(false); }}
                        className="text-xs text-indigo-600 font-bold hover:underline">
                        Done
                    </button>
                </CardContent>
            </Card>
        );
    }

    if (!showForm) {
        return (
            <Button onClick={() => setShowForm(true)} variant="outline" className="gap-2">
                <Video className="w-4 h-4" /> Schedule Meeting
            </Button>
        );
    }

    return (
        <Card>
            <CardContent className="p-4 space-y-3">
                <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                    <Video className="w-4 h-4 text-indigo-600" /> Schedule Video Conference
                </h3>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => setProvider('zoom')}
                        className={`p-2 rounded-lg border-2 text-xs font-bold transition-all ${provider === 'zoom' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500'}`}
                    >
                        📹 Zoom
                    </button>
                    <button
                        onClick={() => setProvider('bbb')}
                        className={`p-2 rounded-lg border-2 text-xs font-bold transition-all ${provider === 'bbb' ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 text-slate-500'}`}
                    >
                        🎥 BigBlueButton
                    </button>
                </div>
                <input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Meeting title"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700"
                />
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Start Time
                        </label>
                        <input
                            type="datetime-local"
                            value={startTime}
                            onChange={e => setStartTime(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Duration (min)
                        </label>
                        <input
                            type="number"
                            min={15}
                            value={duration}
                            onChange={e => setDuration(parseInt(e.target.value) || 60)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700"
                        />
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleCreate} disabled={loading} size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Video className="w-3 h-3" />}
                        Create
                    </Button>
                    <Button onClick={() => setShowForm(false)} size="sm" variant="outline">Cancel</Button>
                </div>
            </CardContent>
        </Card>
    );
}
