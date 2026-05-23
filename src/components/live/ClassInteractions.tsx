"use client";

import { useLocalParticipant, useRoomContext } from "@livekit/components-react";
import { RoomEvent, DataPacket_Kind, Participant, Track } from "livekit-client";
import { Hand, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import ClassWhiteboard from "./ClassWhiteboard";
import ModerationPanel from "./ModerationPanel";
import LiveChat from "./LiveChat";
import InClassPoll from "./InClassPoll";
import BreakoutRoomsPanel from "./BreakoutRoomsPanel";
import SessionAnalytics from "./SessionAnalytics";
import LiveCaptions from "./LiveCaptions";
import StreamingDialog from "./StreamingDialog";
import { PenTool, Video, Square, ShieldAlert, Smile, MessageSquare, Wand2, BarChart, Users, TrendingUp, Type, Share2 } from "lucide-react";
import { startRecording, stopRecording, logClassEvent } from "@/actions/live-class";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BackgroundBlur } from "@livekit/track-processors";
import DataSaverToggle, { DataSaverMode } from "./DataSaverToggle";

export type RaisedHand = { identity: string; name: string; timestamp: number };

export default function ClassInteractions({ role, onSpotlightChange, currentSpotlight, courseId, dbRoomId, dataSaverMode, onDataSaverChange }: {
    role?: "staff" | "student",
    onSpotlightChange?: (id: string | null) => void,
    currentSpotlight?: string | null,
    courseId?: string,
    dbRoomId?: string,
    dataSaverMode?: DataSaverMode,
    onDataSaverChange?: (mode: DataSaverMode) => void
}) {
    const room = useRoomContext();
    const { localParticipant } = useLocalParticipant();
    const [isHandRaised, setIsHandRaised] = useState(false);
    const [raisedHands, setRaisedHands] = useState<RaisedHand[]>([]);
    const [showChat, setShowChat] = useState(false);
    const [showPolls, setShowPolls] = useState(false);
    const [showBreakout, setShowBreakout] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [showCaptions, setShowCaptions] = useState(false);
    const [isBlurred, setIsBlurred] = useState(false);
    const [activePollCount, setActivePollCount] = useState(0);
    const [showStreaming, setShowStreaming] = useState(false);

    // Background Blur toggle
    const toggleBlur = async () => {
        if (!localParticipant) return;
        try {
            const trackPub = localParticipant.getTrackPublication(Track.Source.Camera);
            if (!trackPub || !trackPub.videoTrack) return;

            if (isBlurred) {
                // @ts-expect-error - Livekit allows undefined or null to clear the processor, but types may lag
                await trackPub.videoTrack.setProcessor(undefined);
                setIsBlurred(false);
                toast.success("Background blur disabled");
                if (dbRoomId) logClassEvent(parseInt(dbRoomId), 'background_blur_disabled');
            } else {
                const processor = BackgroundBlur(10);
                await trackPub.videoTrack.setProcessor(processor);
                setIsBlurred(true);
                toast.success("Background blurred");
                if (dbRoomId) logClassEvent(parseInt(dbRoomId), 'background_blur_enabled');
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to toggle blur. Ensure camera is on.");
        }
    };

    const toggleSpotlightSelf = async () => {
        if (!localParticipant || role !== 'staff') return;

        const newSpotlight = currentSpotlight === localParticipant.identity ? null : localParticipant.identity;
        if (onSpotlightChange) onSpotlightChange(newSpotlight);

        const payload = JSON.stringify({ type: 'SET_SPOTLIGHT', identity: newSpotlight });
        const encoder = new TextEncoder();
        try {
            await localParticipant.publishData(encoder.encode(payload), { reliable: true, topic: 'spotlight' });
            if (newSpotlight) {
                toast.success("You are now spotlighted for the class.");
                if (dbRoomId) logClassEvent(parseInt(dbRoomId), 'spotlight_self_enabled');
            } else {
                toast.info("Spotlight removed.");
                if (dbRoomId) logClassEvent(parseInt(dbRoomId), 'spotlight_self_disabled');
            }
        } catch (err) { }
    };

    useEffect(() => {
        if (!room) return;

        const handleData = (payload: Uint8Array, participant?: any, kind?: any, topic?: string) => {
            // In case we only want to listen to a specific topic
            if (topic && topic !== 'reactions') return;

            try {
                const text = new TextDecoder().decode(payload);
                const data = JSON.parse(text);

                // Do not toast for our own messages, we handle them locally
                if (participant?.identity === localParticipant?.identity) return;

                if (data.type === 'RAISE_HAND') {
                    if (role === 'staff') {
                        setRaisedHands(prev => {
                            if (prev.find(h => h.identity === data.identity)) return prev;
                            return [...prev, { identity: data.identity, name: data.from, timestamp: Date.now() }];
                        });
                    }
                    toast(`${data.from} raised their hand`, {
                        icon: '✋',
                        duration: 4000
                    });
                    if (dbRoomId) logClassEvent(parseInt(dbRoomId), 'hand_raise', { participant: data.from });
                } else if (data.type === 'LOWER_HAND') {
                    if (role === 'staff') {
                        setRaisedHands(prev => prev.filter(h => h.identity !== data.identity));
                    }
                    if (dbRoomId) logClassEvent(parseInt(dbRoomId), 'hand_lower', { participant: data.from });
                } else if (data.type === 'EMOJI') {
                    toast(`${data.from} reacted ${data.emoji}`, {
                        icon: data.emoji,
                        duration: 2000
                    });
                    if (dbRoomId) logClassEvent(parseInt(dbRoomId), 'reaction', { emoji: data.emoji, participant: data.from });
                } else if (data.type === 'NEW_POLL') {
                    if (role === 'student' && !showPolls) {
                        setActivePollCount(1);
                    }
                    if (dbRoomId) logClassEvent(parseInt(dbRoomId), 'new_poll_received');
                } else if (data.type === 'END_POLL') {
                    setActivePollCount(0);
                    if (dbRoomId) logClassEvent(parseInt(dbRoomId), 'poll_ended_received');
                } else if (data.type === 'SET_SPOTLIGHT') {
                    if (onSpotlightChange) {
                        onSpotlightChange(data.identity);
                        if (data.identity && data.identity !== localParticipant?.identity && role === 'student') {
                            toast.info("A participant has been spotlighted by the instructor.");
                        }
                    }
                    if (dbRoomId) logClassEvent(parseInt(dbRoomId), 'spotlight_changed', { identity: data.identity });
                }
            } catch (e) {
                // Ignore malformed JSON or other random payloads
            }
        };

        room.on(RoomEvent.DataReceived, handleData);

        return () => {
            room.off(RoomEvent.DataReceived, handleData);
        };
    }, [room, localParticipant, role, showPolls, dbRoomId, onSpotlightChange]);

    const sendReaction = async (type: 'RAISE_HAND' | 'LOWER_HAND' | 'EMOJI', emoji?: string) => {
        if (!localParticipant) return;

        if (type === 'RAISE_HAND') {
            setIsHandRaised(true);
            if (dbRoomId) logClassEvent(parseInt(dbRoomId), 'hand_raise');
        }
        if (type === 'LOWER_HAND') {
            setIsHandRaised(false);
            if (dbRoomId) logClassEvent(parseInt(dbRoomId), 'hand_lower');
        }
        if (type === 'EMOJI' && dbRoomId) {
            logClassEvent(parseInt(dbRoomId), 'reaction', { emoji });
        }

        const payload = JSON.stringify({
            type,
            from: localParticipant.name || localParticipant.identity || "A participant",
            identity: localParticipant.identity,
            emoji
        });

        const encoder = new TextEncoder();
        try {
            await localParticipant.publishData(encoder.encode(payload), { reliable: true, topic: 'reactions' });

            if (type === 'RAISE_HAND') {
                toast.success("You raised your hand", { icon: '✋' });
            } else if (type === 'LOWER_HAND') {
                toast("You lowered your hand");
            } else {
                toast.success(`You reacted ${emoji}`, { icon: emoji });
            }
        } catch (error) {
            console.error("Failed to publish reaction", error);
        }
    };

    const [showWhiteboard, setShowWhiteboard] = useState(false);
    const [showModeration, setShowModeration] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [egressId, setEgressId] = useState<string | null>(null);

    const toggleRecording = async () => {
        if (!room) return;

        if (isRecording && egressId) {
            toast.promise(stopRecording(egressId), {
                loading: 'Stopping recording...',
                success: (data) => {
                    if (data.error) throw new Error(data.error);
                    setIsRecording(false);
                    setEgressId(null);
                    return 'Recording stopped successfully';
                },
                error: (err: any) => err.message
            });
        } else {
            toast.promise(startRecording(room.name), {
                loading: 'Starting cloud recording...',
                success: (data) => {
                    if (data.error) throw new Error(data.error);
                    setIsRecording(true);
                    setEgressId(data.egressId || null);
                    return 'Recording started! Please notify the class.';
                },
                error: (err: any) => err.message
            });
        }
    };

    return (
        <>
            {showWhiteboard && <ClassWhiteboard onClose={() => setShowWhiteboard(false)} role={role} />}
            {showChat && <LiveChat onClose={() => setShowChat(false)} role={role} dbRoomId={dbRoomId} />}
            {showPolls && <InClassPoll onClose={() => setShowPolls(false)} role={role} dbRoomId={dbRoomId} />}
            {showAnalytics && dbRoomId && <SessionAnalytics classroomId={dbRoomId} onClose={() => setShowAnalytics(false)} />}
            {showCaptions && <LiveCaptions isActive={showCaptions} />}
            {showBreakout && <BreakoutRoomsPanel onClose={() => setShowBreakout(false)} role={role} courseId={courseId || ''} dbRoomId={dbRoomId || ''} />}
            <StreamingDialog isOpen={showStreaming} onClose={() => setShowStreaming(false)} roomName={room?.name || ''} />


            {/* 
              * Even if students don't open the BreakoutRoomsPanel, we need it to exist in the tree 
              * so it can listen to `breakout` datachannels and popup toast notifications to them.
              * If role === student, it returns null internally for the UI, but still runs the hook!
              */}
            {role === 'student' && <BreakoutRoomsPanel onClose={() => setShowBreakout(false)} role={role} courseId={courseId || ''} dbRoomId={dbRoomId || ''} />}

            <div className="absolute top-24 right-6 flex flex-col gap-3 z-50">
                {role === 'staff' && (
                    <>
                        <Button
                            variant={currentSpotlight === localParticipant?.identity ? "default" : "outline"}
                            size="icon"
                            className={`rounded-full shadow-lg h-12 w-12 ${currentSpotlight === localParticipant?.identity ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600' : 'bg-white/90 backdrop-blur text-slate-700 hover:bg-slate-100 border-slate-200'} tooltip-trigger`}
                            onClick={toggleSpotlightSelf}
                            title={currentSpotlight === localParticipant?.identity ? "Cancel Spotlight" : "Spotlight Yourself"}
                        >
                            <Video className="h-5 w-5" />
                        </Button>
                        <Button
                            variant={isRecording ? "destructive" : "outline"}
                            size="icon"
                            className={`rounded-full shadow-lg h-12 w-12 ${isRecording ? 'animate-pulse' : 'bg-white/90 backdrop-blur text-slate-700 hover:bg-slate-100 border-slate-200'} tooltip-trigger`}
                            onClick={toggleRecording}
                            title={isRecording ? "Stop Recording" : "Start Cloud Recording"}
                        >
                            {isRecording ? <Square className="h-5 w-5" fill="currentColor" /> : <Video className="h-5 w-5 text-red-500" />}
                        </Button>
                        <Button
                            variant={showWhiteboard ? "default" : "outline"}
                            size="icon"
                            className={`rounded-full shadow-lg h-12 w-12 ${showWhiteboard ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600' : 'bg-white/90 backdrop-blur text-slate-700 hover:bg-slate-100 border-slate-200'} tooltip-trigger`}
                            onClick={() => setShowWhiteboard(!showWhiteboard)}
                            title={showWhiteboard ? "Close Whiteboard" : "Open Whiteboard"}
                        >
                            <PenTool className="h-5 w-5" />
                        </Button>
                        <Button
                            variant={showCaptions ? "default" : "outline"}
                            size="icon"
                            className={`rounded-full shadow-lg h-12 w-12 ${showCaptions ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600' : 'bg-white/90 backdrop-blur text-slate-700 hover:bg-slate-100 border-slate-200'} tooltip-trigger`}
                            onClick={() => setShowCaptions(!showCaptions)}
                            title={showCaptions ? "Disable Captions" : "Enable Live Captions"}
                        >
                            <Type className="h-5 w-5" />
                        </Button>
                        <Button
                            variant={showAnalytics ? "default" : "outline"}
                            size="icon"
                            className={`rounded-full shadow-lg h-12 w-12 ${showAnalytics ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600' : 'bg-white/90 backdrop-blur text-slate-700 hover:bg-slate-100 border-slate-200'} tooltip-trigger`}
                            onClick={() => setShowAnalytics(!showAnalytics)}
                            title={showAnalytics ? "Close Analytics" : "Session Analytics"}
                        >
                            <TrendingUp className="h-5 w-5" />
                        </Button>
                        <Button
                            variant={showBreakout ? "default" : "outline"}
                            size="icon"
                            className={`rounded-full shadow-lg h-12 w-12 ${showBreakout ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600' : 'bg-white/90 backdrop-blur text-slate-700 hover:bg-slate-100 border-slate-200'} tooltip-trigger`}
                            onClick={() => setShowBreakout(!showBreakout)}
                            title={showBreakout ? "Close Breakout Rooms" : "Breakout Rooms"}
                        >
                            <Users className="h-5 w-5" />
                        </Button>
                        <Button
                            variant={showModeration ? "default" : "outline"}
                            size="icon"
                            className={`rounded-full shadow-lg h-12 w-12 relative ${showModeration ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600' : 'bg-white/90 backdrop-blur text-slate-700 hover:bg-slate-100 border-slate-200'} tooltip-trigger`}
                            onClick={() => setShowModeration(!showModeration)}
                            title={showModeration ? "Close Moderation" : "Class Moderation"}
                        >
                            <ShieldAlert className="h-5 w-5" />
                            {!showModeration && raisedHands.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                                    {raisedHands.length}
                                </span>
                            )}
                        </Button>
                        <Button
                            variant={showStreaming ? "default" : "outline"}
                            size="icon"
                            className={`rounded-full shadow-lg h-12 w-12 ${showStreaming ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-600' : 'bg-white/90 backdrop-blur text-slate-700 hover:bg-slate-100 border-slate-200'} tooltip-trigger`}
                            onClick={() => setShowStreaming(!showStreaming)}
                            title={showStreaming ? "Close Streaming" : "Multi-Platform Streaming"}
                        >
                            <Share2 className="h-5 w-5" />
                        </Button>
                    </>
                )}

                <Button
                    variant={showChat ? "default" : "outline"}
                    size="icon"
                    className={`rounded-full shadow-lg h-12 w-12 ${showChat ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600' : 'bg-white/90 backdrop-blur text-slate-700 hover:bg-slate-100 border-slate-200'} tooltip-trigger`}
                    onClick={() => setShowChat(!showChat)}
                    title={showChat ? "Close Chat" : "Open Chat"}
                >
                    <MessageSquare className="h-5 w-5" />
                </Button>
                <Button
                    variant={showPolls ? "default" : "outline"}
                    size="icon"
                    className={`rounded-full shadow-lg h-12 w-12 relative ${showPolls ? 'bg-fuchsia-600 hover:bg-fuchsia-700 text-white border-fuchsia-600' : 'bg-white/90 backdrop-blur text-slate-700 hover:bg-slate-100 border-slate-200'} tooltip-trigger`}
                    onClick={() => {
                        setShowPolls(!showPolls);
                        setActivePollCount(0);
                    }}
                    title={showPolls ? "Close Polls" : "Class Polls"}
                >
                    <BarChart className="h-5 w-5" />
                    {!showPolls && activePollCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                            {activePollCount}
                        </span>
                    )}
                </Button>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full shadow-lg h-12 w-12 bg-white/90 backdrop-blur text-slate-700 hover:bg-slate-100 border-slate-200 tooltip-trigger"
                            title="Reactions"
                        >
                            <Smile className="h-5 w-5 text-blue-500" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent side="left" className="w-auto p-2 rounded-2xl flex gap-2">
                        {['👍', '❤️', '😂', '🎉', '😮', '😢'].map((emoji) => (
                            <button
                                key={emoji}
                                className="text-2xl hover:scale-125 transition-transform p-1"
                                onClick={() => sendReaction('EMOJI', emoji)}
                            >
                                {emoji}
                            </button>
                        ))}
                    </PopoverContent>
                </Popover>
                <Button
                    variant={isHandRaised ? "default" : "outline"}
                    size="icon"
                    className={`rounded-full shadow-lg h-12 w-12 ${isHandRaised ? 'bg-amber-500 hover:bg-amber-600 border-amber-500' : 'bg-white/90 backdrop-blur hover:bg-slate-100 border-slate-200'} text-slate-700 transition-colors`}
                    onClick={() => isHandRaised ? sendReaction('LOWER_HAND') : sendReaction('RAISE_HAND')}
                    title={isHandRaised ? "Lower Hand" : "Raise Hand"}
                >
                    <Hand className={`h-5 w-5 ${isHandRaised ? 'text-white' : 'text-amber-500'}`} />
                </Button>
                <Button
                    variant={isBlurred ? "default" : "outline"}
                    size="icon"
                    className={`rounded-full shadow-lg h-12 w-12 ${isBlurred ? 'bg-purple-600 hover:bg-purple-700 border-purple-600' : 'bg-white/90 backdrop-blur hover:bg-slate-100 border-slate-200'} text-slate-700 transition-colors`}
                    onClick={toggleBlur}
                    title={isBlurred ? "Disable Background Blur" : "Enable Background Blur"}
                >
                    <Wand2 className={`h-5 w-5 ${isBlurred ? 'text-white' : 'text-purple-600'}`} />
                </Button>
                {dataSaverMode && onDataSaverChange && (
                    <DataSaverToggle mode={dataSaverMode} onChange={onDataSaverChange} />
                )}
            </div>
            {showModeration && role === 'staff' && (
                <ModerationPanel
                    onClose={() => setShowModeration(false)}
                    raisedHands={raisedHands}
                    onLowerHand={(identity) => {
                        setRaisedHands(prev => prev.filter(h => h.identity !== identity));
                        // In a fully built system, we'd also send a targeted message back to the student to drop their hand locally.
                    }}
                />
            )}
        </>
    );
}
