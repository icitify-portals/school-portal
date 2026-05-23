"use client";

import { useRoomContext } from "@livekit/components-react";
import { RoomEvent, TranscriptionSegment, Participant } from "livekit-client";
import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

export default function LiveCaptions({ isActive }: { isActive: boolean }) {
    const room = useRoomContext();
    const [segments, setSegments] = useState<{ id: string, text: string, participant: string }[]>([]);
    const segmentsRef = useRef<{ id: string, text: string, participant: string, timestamp: number }[]>([]);

    useEffect(() => {
        if (!room || !isActive) {
            setSegments([]);
            return;
        }

        const handleTranscription = (segments: TranscriptionSegment[], participant?: Participant) => {
            const now = Date.now();

            segments.forEach(segment => {
                if (!segment.text.trim()) return;

                // Update existing or add new
                const existingIndex = segmentsRef.current.findIndex(s => s.id === segment.id);
                if (existingIndex > -1) {
                    segmentsRef.current[existingIndex].text = segment.text;
                } else {
                    segmentsRef.current.push({
                        id: segment.id,
                        text: segment.text,
                        participant: participant?.name || participant?.identity || "Unknown",
                        timestamp: now
                    });
                }
            });

            // Keep only last 3 seconds of transcriptions
            const filtered = segmentsRef.current.filter(s => now - s.timestamp < 4000);
            segmentsRef.current = filtered;

            setSegments([...filtered]);
        };

        room.on(RoomEvent.TranscriptionReceived, handleTranscription);

        // Cleanup stale segments every second
        const interval = setInterval(() => {
            const now = Date.now();
            const filtered = segmentsRef.current.filter(s => now - s.timestamp < 4000);
            if (filtered.length !== segmentsRef.current.length) {
                segmentsRef.current = filtered;
                setSegments([...filtered]);
            }
        }, 1000);

        return () => {
            room.off(RoomEvent.TranscriptionReceived, handleTranscription);
            clearInterval(interval);
        };
    }, [room, isActive]);

    if (!isActive || segments.length === 0) return null;

    return (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4 pointer-events-none">
            <div className="flex flex-col items-center gap-2">
                {segments.map((s) => (
                    <div
                        key={s.id}
                        className={cn(
                            "bg-black/70 backdrop-blur-md text-white px-4 py-2 rounded-lg text-center shadow-xl border border-white/10 animate-in fade-in slide-in-from-bottom-2 duration-300",
                            "text-sm md:text-base font-medium leading-relaxed"
                        )}
                    >
                        <span className="text-indigo-400 font-bold mr-2 text-[10px] uppercase tracking-wider">{s.participant}:</span>
                        {s.text}
                    </div>
                ))}
            </div>
        </div>
    );
}
