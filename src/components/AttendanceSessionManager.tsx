"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    QrCode,
    Video,
    Users,
    Play,
    CircleStop,
    Clock,
    CheckCircle2,
    Printer,
    Download,
    RefreshCw,
    Shield
} from "lucide-react";
import { startLectureSession, closeLectureSession, rotateQrToken, getSessionAttendees } from "@/actions/attendance";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const DEFAULT_QR_ROTATION_INTERVAL = 30; // seconds fallback

interface AttendanceSessionManagerProps {
    slot: {
        id: number;
        day: string;
        startTime: string;
        endTime: string;
        type: string;
        assignment: {
            course: {
                id: number;
                name: string;
                code: string;
            };
        };
    };
    qrRotationInterval?: number;
}

export function AttendanceSessionManager({ slot, qrRotationInterval }: AttendanceSessionManagerProps) {
    const QR_ROTATION_INTERVAL = qrRotationInterval || DEFAULT_QR_ROTATION_INTERVAL;
    const [status, setStatus] = useState<'idle' | 'ongoing' | 'completed'>('idle');
    const [sessionId, setSessionId] = useState<number | null>(null);
    const [qrToken, setQrToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [attendees, setAttendees] = useState<any[]>([]);
    const [countdown, setCountdown] = useState(QR_ROTATION_INTERVAL);
    const [rotationCount, setRotationCount] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const pollRef = useRef<NodeJS.Timeout | null>(null);

    // QR Rotation timer
    useEffect(() => {
        if (status !== 'ongoing' || !sessionId) {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }

        setCountdown(QR_ROTATION_INTERVAL);

        timerRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    // Time to rotate
                    rotateQrToken(sessionId).then(res => {
                        if (res.success && res.qrToken) {
                            setQrToken(res.qrToken);
                            setRotationCount(c => c + 1);
                        }
                    });
                    return QR_ROTATION_INTERVAL;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [status, sessionId]);

    // Attendee polling
    useEffect(() => {
        if (status !== 'ongoing' || !sessionId) {
            if (pollRef.current) clearInterval(pollRef.current);
            return;
        }

        const fetchAttendees = () => {
            getSessionAttendees(sessionId).then(res => {
                if (res.success) {
                    setAttendees(res.attendees);
                }
            });
        };

        fetchAttendees(); // Initial fetch
        pollRef.current = setInterval(fetchAttendees, 5000); // Poll every 5s

        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [status, sessionId]);

    const handleStartSession = async (type: 'physical' | 'online') => {
        setLoading(true);
        const res = await startLectureSession(slot.id, type);
        if (res.success) {
            setSessionId(res.sessionId!);
            setQrToken(res.qrToken!);
            setStatus('ongoing');
            setCountdown(QR_ROTATION_INTERVAL);
            toast.success("Lecture session started!");
        } else {
            toast.error(res.error || "Failed to start session");
        }
        setLoading(false);
    };

    const handleCloseSession = async () => {
        if (!sessionId) return;
        setLoading(true);
        const res = await closeLectureSession(sessionId);
        if (res.success) {
            setStatus('completed');
            toast.success("Lecture session completed.");
        } else {
            toast.error(res.error || "Failed to close session");
        }
        setLoading(false);
    };

    // Countdown progress as percentage
    const countdownPercent = (countdown / QR_ROTATION_INTERVAL) * 100;

    return (
        <Card className="border-none shadow-xl bg-white/80 backdrop-blur-xl overflow-hidden rounded-[2.5rem]">
            <CardHeader className="p-8 bg-slate-50/50 border-b">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-slate-900 text-white border-none font-black uppercase text-[10px] tracking-widest px-3">
                                {slot.assignment.course.code}
                            </Badge>
                            <Badge className={cn(
                                "font-black uppercase text-[10px] tracking-widest px-3 border-none",
                                status === 'ongoing' ? "bg-emerald-500" : status === 'completed' ? "bg-slate-400" : "bg-blue-600"
                            )}>
                                {status.toUpperCase()}
                            </Badge>
                            {status === 'ongoing' && (
                                <Badge className="bg-amber-500 border-none font-black uppercase text-[10px] tracking-widest px-3 gap-1">
                                    <Shield className="w-3 h-3" /> ROTATING QR
                                </Badge>
                            )}
                        </div>
                        <CardTitle className="text-2xl font-black text-slate-900 tracking-tight mt-2">
                            {slot.assignment.course.name}
                        </CardTitle>
                        <CardDescription className="font-bold flex items-center gap-2 text-slate-500">
                            <Clock className="w-4 h-4" /> {slot.day.toUpperCase()} • {slot.startTime} - {slot.endTime}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-8">
                {status === 'idle' && (
                    <div className="flex flex-col items-center py-10 space-y-6">
                        <div className="p-6 bg-blue-50 rounded-full">
                            <Play className="w-12 h-12 text-blue-600" />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-black text-slate-900 uppercase italic">Initialize Session</h3>
                            <p className="text-sm text-slate-500 font-medium">Select the mode for today&apos;s lecture to begin monitoring attendance.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 w-full">
                            <Button
                                onClick={() => handleStartSession('physical')}
                                disabled={loading}
                                className="h-16 rounded-2xl bg-slate-900 hover:bg-black font-black uppercase tracking-widest text-[10px] gap-3"
                            >
                                <Users className="w-5 h-5" /> Physical Class
                            </Button>
                            <Button
                                onClick={() => handleStartSession('online')}
                                disabled={loading}
                                className="h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black uppercase tracking-widest text-[10px] gap-3 shadow-lg shadow-indigo-100"
                            >
                                <Video className="w-5 h-5" /> Online Class
                            </Button>
                        </div>
                    </div>
                )}

                {status === 'ongoing' && qrToken && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 py-4">
                        <div className="flex flex-col items-center space-y-6">
                            {/* QR Code with rotation indicator */}
                            <div className="relative">
                                <div className="p-6 bg-white rounded-2xl border-4 border-slate-100 shadow-2xl shadow-slate-100 relative">
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${qrToken}`}
                                        alt="Attendance QR"
                                        className="w-64 h-64 transition-opacity duration-300"
                                        key={qrToken}
                                    />
                                </div>
                                {/* Circular countdown indicator */}
                                <div className="absolute -top-3 -right-3 w-14 h-14 rounded-full bg-white shadow-xl flex items-center justify-center border-2 border-slate-100">
                                    <div className="relative w-10 h-10">
                                        <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
                                            <circle cx="20" cy="20" r="16" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                                            <circle
                                                cx="20" cy="20" r="16"
                                                fill="none"
                                                stroke={countdown <= 5 ? "#ef4444" : countdown <= 10 ? "#f59e0b" : "#22c55e"}
                                                strokeWidth="3"
                                                strokeLinecap="round"
                                                strokeDasharray={`${countdownPercent} 100`}
                                                className="transition-all duration-1000"
                                            />
                                        </svg>
                                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-slate-700">
                                            {countdown}s
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="text-center space-y-2">
                                <h3 className="text-lg font-black text-slate-900 uppercase flex items-center gap-2 justify-center">
                                    <QrCode className="w-5 h-5 text-blue-600" /> Session QR Code
                                </h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-xs">
                                    Code rotates every {QR_ROTATION_INTERVAL}s for security. Students must scan the live code.
                                </p>
                                <div className="flex items-center justify-center gap-4 text-[10px] font-black text-slate-500">
                                    <span className="flex items-center gap-1">
                                        <RefreshCw className="w-3 h-3" /> {rotationCount} rotations
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2 w-full">
                                <Button variant="outline" className="flex-1 rounded-xl h-12 font-black uppercase text-[10px] tracking-widest gap-2">
                                    <Printer className="w-4 h-4" /> Print QR
                                </Button>
                                <Button variant="outline" className="flex-1 rounded-xl h-12 font-black uppercase text-[10px] tracking-widest gap-2">
                                    <Download className="w-4 h-4" /> Save Image
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="font-black text-slate-900 uppercase tracking-widest text-[10px] flex items-center gap-2">
                                    <Users className="w-4 h-4 text-emerald-500" /> Live Attendees
                                </h3>
                                <Badge className="bg-emerald-100 text-emerald-700 font-black text-[10px]">{attendees.length} PRESENT</Badge>
                            </div>
                            <div className="bg-slate-50 rounded-2xl p-6 h-[25rem] overflow-y-auto border border-slate-100">
                                {attendees.length > 0 ? (
                                    <div className="space-y-3">
                                        {attendees.map((a, i) => (
                                            <div key={a.id || i} className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center font-black text-[10px] text-emerald-600">
                                                        {i + 1}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{a.studentName}</p>
                                                        <p className="text-[8px] font-bold text-slate-400">{a.matricNo || 'N/A'}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">
                                                        {a.timeIn ? new Date(a.timeIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                                                    </p>
                                                    <Badge className="bg-blue-100 text-blue-600 border-none text-[7px] font-bold px-1">{a.method}</Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-40">
                                        <Users className="w-12 h-12 text-slate-300" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Waiting for scans...</p>
                                    </div>
                                )}
                            </div>
                            <Button
                                onClick={handleCloseSession}
                                disabled={loading}
                                variant="destructive"
                                className="w-full h-16 rounded-2xl font-black uppercase tracking-widest text-[10px] gap-3 shadow-lg shadow-rose-100"
                            >
                                <CircleStop className="w-5 h-5" /> Terminate Session
                            </Button>
                        </div>
                    </div>
                )}

                {status === 'completed' && (
                    <div className="flex flex-col items-center py-10 space-y-6 text-center">
                        <div className="p-6 bg-emerald-50 rounded-full">
                            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-black text-slate-900 uppercase italic">Session Finalized</h3>
                            <p className="text-sm text-slate-500 font-medium">
                                {attendees.length} student{attendees.length !== 1 ? 's' : ''} recorded. QR rotated {rotationCount} times.
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            className="h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] px-10"
                            onClick={() => window.location.reload()}
                        >
                            View Analysis Report
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
