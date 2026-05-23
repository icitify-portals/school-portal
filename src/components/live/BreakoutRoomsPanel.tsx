"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, X, PlusCircle, Trash, DoorOpen } from "lucide-react";
import { useRoomContext, useLocalParticipant } from "@livekit/components-react";
import { RoomEvent } from "livekit-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface BreakoutRoom {
    id: string;
    name: string;
    assignedStudents: string[]; // identities
}

export default function BreakoutRoomsPanel({ onClose, role, courseId, dbRoomId }: {
    onClose: () => void,
    role?: "staff" | "student",
    courseId: string,
    dbRoomId: string
}) {
    const room = useRoomContext();
    const { localParticipant } = useLocalParticipant();
    const router = useRouter();

    // Lecturer Creation State
    const [rooms, setRooms] = useState<BreakoutRoom[]>([
        { id: '1', name: 'Room 1', assignedStudents: [] },
        { id: '2', name: 'Room 2', assignedStudents: [] }
    ]);
    const [isActive, setIsActive] = useState(false);

    // Listen for Breakout Room Assignments
    useEffect(() => {
        if (!room) return;

        const handleData = (payload: Uint8Array, participant?: any, kind?: any, topic?: string) => {
            if (topic !== 'breakout') return;

            try {
                const text = new TextDecoder().decode(payload);
                const data = JSON.parse(text);

                if (data.type === 'START_BREAKOUT') {
                    setIsActive(true);
                    setRooms(data.rooms);

                    if (role === 'student' && localParticipant) {
                        // Check if we were assigned a room
                        const myRoom = data.rooms.find((r: BreakoutRoom) => r.assignedStudents.includes(localParticipant.identity));
                        if (myRoom) {
                            toast.success(`Redirecting to ${myRoom.name}...`);
                            router.push(`/live/${courseId}/${dbRoomId}/breakout/${myRoom.id}`);
                        } else {
                            toast("Breakout rooms have started, but you aren't assigned to one.");
                        }
                    }
                } else if (data.type === 'END_BREAKOUT') {
                    setIsActive(false);
                    if (role === 'student') {
                        toast.info("Breakout rooms have ended. Returning to main session...");
                    }
                }
            } catch (e) { }
        };

        room.on(RoomEvent.DataReceived, handleData);
        return () => { room.off(RoomEvent.DataReceived, handleData); };
    }, [room, role, localParticipant, courseId, dbRoomId]);

    const handleLaunch = async () => {
        if (!localParticipant || role !== 'staff') return;

        // Let's do a simple random assignment of all current non-staff participants
        const participants = Array.from(room.remoteParticipants.values()).filter(p => !p.metadata?.includes('staff'));

        const newRooms = [...rooms];
        // clear existing
        newRooms.forEach(r => r.assignedStudents = []);

        // Deal them out
        participants.forEach((p, idx) => {
            const roomIdx = idx % newRooms.length;
            newRooms[roomIdx].assignedStudents.push(p.identity);
        });

        setIsActive(true);
        setRooms(newRooms);

        const payload = JSON.stringify({ type: 'START_BREAKOUT', rooms: newRooms });
        const encoder = new TextEncoder();
        try {
            await localParticipant.publishData(encoder.encode(payload), { reliable: true, topic: 'breakout' });
            toast.success("Breakout rooms launched and students assigned.");
        } catch (err) {
            toast.error("Failed to launch breakout rooms.");
        }
    };

    const handleEnd = async () => {
        if (!localParticipant || role !== 'staff') return;

        setIsActive(false);
        const payload = JSON.stringify({ type: 'END_BREAKOUT' });
        const encoder = new TextEncoder();
        try {
            await localParticipant.publishData(encoder.encode(payload), { reliable: true, topic: 'breakout' });
            toast("Breakout rooms closed.");
        } catch (err) { }
    };

    if (role === 'student') return null; // Students wait passively for assignment popups, they don't get the management UI.

    return (
        <div className="absolute top-24 left-6 w-80 md:w-96 bg-white/95 backdrop-blur shadow-2xl rounded-xl border border-slate-200 z-50 flex flex-col max-h-[70vh] overflow-hidden">
            <div className="bg-indigo-600 text-white p-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2 font-semibold">
                    <Users className="w-5 h-5 text-indigo-200" />
                    Manage Breakout Rooms
                </div>
                <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-600">
                    <p>Create separate virtual rooms. Students will be distributed evenly among the created rooms when you launch.</p>
                </div>

                <div className="space-y-3 pt-2">
                    {rooms.map((r, idx) => (
                        <div key={r.id} className="flex gap-2 items-center">
                            <Input
                                disabled={isActive}
                                value={r.name}
                                onChange={(e) => {
                                    const newR = [...rooms];
                                    newR[idx].name = e.target.value;
                                    setRooms(newR);
                                }}
                                className="bg-slate-50 border-slate-200"
                            />
                            {rooms.length > 2 && !isActive && (
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="shrink-0 text-red-500 border-red-200 hover:bg-red-50"
                                    onClick={() => setRooms(rooms.filter((_, i) => i !== idx))}
                                >
                                    <Trash className="w-4 h-4" />
                                </Button>
                            )}
                            {isActive && (
                                <div className="flex items-center gap-2">
                                    <div className="text-xs font-semibold text-indigo-600 whitespace-nowrap px-2">
                                        {r.assignedStudents.length} pax
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs"
                                        onClick={() => router.push(`/live/${courseId}/${dbRoomId}/breakout/${r.id}`)}
                                    >
                                        Join
                                    </Button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {!isActive && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 w-full"
                        onClick={() => setRooms([...rooms, { id: Math.random().toString(36).substring(7), name: `Room ${rooms.length + 1}`, assignedStudents: [] }])}
                    >
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Add Room
                    </Button>
                )}

                <div className="pt-4 border-t border-slate-100 flex gap-2">
                    {isActive ? (
                        <Button variant="destructive" className="w-full" onClick={handleEnd}>
                            Close All Rooms
                        </Button>
                    ) : (
                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={handleLaunch}>
                            <DoorOpen className="w-4 h-4 mr-2" />
                            Launch Breakouts
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
