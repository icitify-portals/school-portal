"use client";

import { useParticipants, useRoomContext } from "@livekit/components-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MicOff, UserMinus, ShieldAlert, Users } from "lucide-react";
import { toast } from "sonner";
import { kickParticipant, muteParticipantTrack } from "@/actions/live-class";
import { Participant, RemoteParticipant, Track } from "livekit-client";
import { useState } from "react";
import { RaisedHand } from "./ClassInteractions";

export default function ModerationPanel({
    onClose,
    raisedHands = [],
    onLowerHand
}: {
    onClose: () => void;
    raisedHands?: RaisedHand[];
    onLowerHand?: (identity: string) => void;
}) {
    const room = useRoomContext();
    const participants = useParticipants();
    const [isMutingAll, setIsMutingAll] = useState(false);

    // Filter out the local participant (teacher)
    const remoteParticipants = participants.filter(p => p.identity !== room.localParticipant.identity);

    const handleMuteAll = async () => {
        setIsMutingAll(true);
        let count = 0;
        try {
            for (const _p of remoteParticipants) {
                const p = _p as RemoteParticipant;
                // Find audio tracks
                const audioTracks = Array.from(p.audioTrackPublications.values());
                for (const pub of audioTracks) {
                    if (!pub.isMuted) {
                        await muteParticipantTrack(room.name, p.identity, pub.trackSid);
                        count++;
                    }
                }
            }
            toast.success(`Muted ${count} active microphones`);
        } catch (error: any) {
            toast.error("Failed to mute all participants");
        } finally {
            setIsMutingAll(false);
        }
    };

    const handleMuteUser = async (_p: Participant) => {
        try {
            const p = _p as RemoteParticipant;
            const audioTracks = Array.from(p.audioTrackPublications.values());
            let muted = false;
            for (const pub of audioTracks) {
                if (!pub.isMuted) {
                    await muteParticipantTrack(room.name, p.identity, pub.trackSid);
                    muted = true;
                }
            }
            if (muted) {
                toast.success(`Muted ${p.name || p.identity}`);
            } else {
                toast.info(`${p.name || p.identity} is already muted`);
            }
        } catch (e) {
            toast.error("Failed to mute user");
        }
    };

    const handleKickUser = async (p: Participant) => {
        if (!confirm(`Are you sure you want to remove ${p.name || p.identity} from the class?`)) return;

        try {
            await kickParticipant(room.name, p.identity);
            toast.success(`Removed ${p.name || p.identity} from the class`);
        } catch (e) {
            toast.error("Failed to remove user");
        }
    };

    return (
        <div className="absolute top-24 right-20 w-80 bg-white/95 backdrop-blur shadow-2xl rounded-xl border border-slate-200 z-50 overflow-hidden flex flex-col max-h-[60vh]">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
                <div className="flex items-center gap-2 font-semibold">
                    <ShieldAlert className="w-5 h-5 text-indigo-400" />
                    Class Moderation
                </div>
                <div className="flex items-center gap-1 text-sm bg-slate-800 px-2 py-1 rounded-md">
                    <Users className="w-4 h-4" />
                    {remoteParticipants.length}
                </div>
            </div>

            <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <span className="text-sm font-medium text-slate-600">Global Controls</span>
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleMuteAll}
                    disabled={isMutingAll || remoteParticipants.length === 0}
                    className="h-8 text-xs"
                >
                    <MicOff className="w-3.5 h-3.5 mr-1" />
                    Mute All
                </Button>
            </div>

            <ScrollArea className="flex-1 p-0">
                {raisedHands.length > 0 && (
                    <div className="mb-2">
                        <div className="px-3 py-2 bg-amber-50 border-y border-amber-100 flex justify-between items-center text-xs font-semibold text-amber-800 uppercase tracking-wider">
                            <span>Raised Hands ({raisedHands.length})</span>
                        </div>
                        <ul className="divide-y divide-slate-100">
                            {raisedHands.sort((a, b) => a.timestamp - b.timestamp).map(h => (
                                <li key={h.identity} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors bg-amber-50/30">
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <span className="text-sm font-semibold text-slate-800 truncate" title={h.name}>
                                            {h.name}
                                        </span>
                                        <span className="text-[10px] text-slate-500">
                                            {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </span>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs ml-2 text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 border-slate-200"
                                        onClick={() => onLowerHand?.(h.identity)}
                                    >
                                        Lower Hand
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="px-3 py-2 bg-slate-50 border-y border-slate-100 flex justify-between items-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <span>All Participants</span>
                </div>
                {remoteParticipants.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-sm">
                        No active students to moderate.
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {remoteParticipants.map(p => (
                            <li key={p.identity} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <span className="text-sm font-medium text-slate-700 truncate max-w-[120px]" title={p.name || p.identity}>
                                    {p.name || p.identity}
                                </span>
                                <div className="flex gap-1">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7 text-slate-500 hover:text-amber-600 hover:bg-amber-50"
                                        onClick={() => handleMuteUser(p)}
                                        title="Mute Microphone"
                                    >
                                        <MicOff className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7 text-slate-500 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => handleKickUser(p)}
                                        title="Remove from Class"
                                    >
                                        <UserMinus className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </ScrollArea>
        </div>
    );
}
