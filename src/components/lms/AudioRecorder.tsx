"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Play, Trash2, CheckCircle, Loader2 } from "lucide-react";
import { uploadFile } from "@/actions/upload";

interface AudioRecorderProps {
    onRecordingComplete: (url: string) => void;
}

export default function AudioRecorder({ onRecordingComplete }: AudioRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [uploading, setUploading] = useState(false);
    
    const mediaRecorder = useRef<MediaRecorder | null>(null);
    const audioChunks = useRef<Blob[]>([]);
    const timerRef = useRef<any>(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder.current = new MediaRecorder(stream);
            audioChunks.current = [];

            mediaRecorder.current.ondataavailable = (event) => {
                audioChunks.current.push(event.data);
            };

            mediaRecorder.current.onstop = async () => {
                const audioBlob = new Blob(audioChunks.current, { type: 'audio/mpeg' });
                const url = URL.createObjectURL(audioBlob);
                setAudioUrl(url);
                
                // Reset timer
                clearInterval(timerRef.current);
            };

            mediaRecorder.current.start();
            setIsRecording(true);
            setRecordingTime(0);
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorder.current && isRecording) {
            mediaRecorder.current.stop();
            setIsRecording(false);
        }
    };

    const handleSubmit = async () => {
        if (!audioChunks.current.length) return;
        
        setUploading(true);
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/mpeg' });
        const file = new File([audioBlob], "submission-audio.mp3", { type: 'audio/mpeg' });
        
        const formData = new FormData();
        formData.append("file", file);
        
        const res = await uploadFile(formData);
        if (res.success) {
            onRecordingComplete((res as any).url);
        } else {
            alert("Failed to upload recording.");
        }
        setUploading(false);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="p-8 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center space-y-6">
            <div className={`h-24 w-24 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-rose-50 animate-pulse' : 'bg-slate-50'}`}>
                <Mic className={`w-10 h-10 ${isRecording ? 'text-rose-500' : 'text-slate-400'}`} />
            </div>

            {isRecording ? (
                <div className="space-y-4">
                    <p className="text-3xl font-black text-slate-800 font-mono">{formatTime(recordingTime)}</p>
                    <p className="text-sm text-rose-500 font-bold uppercase tracking-widest animate-pulse">Recording In Progress...</p>
                    <Button variant="destructive" size="lg" className="rounded-2xl px-8 h-12" onClick={stopRecording}>
                        <Square className="w-4 h-4 mr-2 fill-current" /> Stop Recording
                    </Button>
                </div>
            ) : audioUrl ? (
                <div className="space-y-6 w-full max-w-sm">
                    <div className="p-4 bg-slate-50 rounded-2xl">
                        <audio src={audioUrl} controls className="w-full" />
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="flex-1 rounded-2xl h-12" onClick={() => { setAudioUrl(null); setRecordingTime(0); }}>
                            <Trash2 className="w-4 h-4 mr-2" /> Redo
                        </Button>
                        <Button className="flex-1 rounded-2xl h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold" onClick={handleSubmit} disabled={uploading}>
                            {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                            Confirm Audio
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <h4 className="font-bold text-slate-800 text-lg">Audio Submission</h4>
                    <p className="text-sm text-slate-500 max-w-xs">Record your response directly from your browser.</p>
                    <Button onClick={startRecording} size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-12 h-14 font-bold shadow-lg shadow-indigo-100">
                        <Mic className="w-5 h-5 mr-2" /> Start Recording
                    </Button>
                </div>
            )}
        </div>
    );
}
