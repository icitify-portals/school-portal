"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BarChart, X, PlusCircle, Trash, CheckCircle2 } from "lucide-react";
import { useRoomContext, useLocalParticipant } from "@livekit/components-react";
import { RoomEvent } from "livekit-client";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { logClassEvent } from "@/actions/live-class";

interface PollOption {
    id: string;
    text: string;
    votes: number;
}

interface Poll {
    id: string;
    question: string;
    options: PollOption[];
    isActive: boolean;
    totalVotes: number;
    assignedStudents: string[]; // identities
}

export default function InClassPoll({ onClose, role, dbRoomId }: { onClose: () => void, role?: "staff" | "student", dbRoomId?: string }) {
    const room = useRoomContext();
    const { localParticipant } = useLocalParticipant();

    const [activePoll, setActivePoll] = useState<Poll | null>(null);
    const [hasVoted, setHasVoted] = useState(false);

    // Lecturer Creation State
    const [newQuestion, setNewQuestion] = useState("");
    const [newOptions, setNewOptions] = useState<string[]>(["", ""]);

    // Listen for Poll packets
    useEffect(() => {
        if (!room) return;

        const handleData = (payload: Uint8Array, participant?: any, kind?: any, topic?: string) => {
            if (topic !== 'polls') return;

            try {
                const text = new TextDecoder().decode(payload);
                const data = JSON.parse(text);

                if (data.type === 'NEW_POLL') {
                    setActivePoll(data.poll);
                    setHasVoted(false);
                    if (role === 'student') {
                        toast.info("A new poll has started!");
                    }
                } else if (data.type === 'END_POLL') {
                    setActivePoll(prev => prev ? { ...prev, isActive: false } : null);
                    if (role === 'student') {
                        toast.info("The active poll has ended.");
                    }
                } else if (data.type === 'SUBMIT_VOTE') {
                    // Update tally for everyone
                    setActivePoll(prev => {
                        if (!prev) return null;
                        const updatedOptions = prev.options.map((opt, idx) =>
                            idx === data.optionIdx ? { ...opt, votes: opt.votes + 1 } : opt
                        );
                        return { ...prev, options: updatedOptions, totalVotes: prev.totalVotes + 1 };
                    });
                }
            } catch (e) {
                // ...
            }
        };

        room.on(RoomEvent.DataReceived, handleData);
        return () => { room.off(RoomEvent.DataReceived, handleData); };
    }, [room, role]);

    const handleLaunchPoll = async () => {
        if (!localParticipant || role !== 'staff') return;

        const validOptions = newOptions.filter(o => o.trim() !== "");
        if (!newQuestion.trim() || validOptions.length < 2) {
            toast.error("Please provide a question and at least 2 options.");
            return;
        }

        const poll: Poll = {
            id: Math.random().toString(36).substring(7),
            question: newQuestion,
            options: validOptions.map((opt, i) => ({ id: `opt-${i}`, text: opt, votes: 0 })),
            isActive: true,
            totalVotes: 0,
            assignedStudents: [] // This will be populated by the backend or not used for now
        };

        const payload = JSON.stringify({ type: 'NEW_POLL', poll });
        const encoder = new TextEncoder();
        try {
            await localParticipant.publishData(encoder.encode(payload), { reliable: true, topic: 'polls' });
            setActivePoll(poll);
            setNewQuestion("");
            setNewOptions(["", ""]);
            toast.success("Poll launched successfully.");
        } catch (err) {
            toast.error("Failed to launch poll.");
        }
    };

    const handleEndPoll = async () => {
        if (!localParticipant || role !== 'staff' || !activePoll) return;

        setActivePoll({ ...activePoll, isActive: false });

        const payload = JSON.stringify({ type: 'END_POLL', pollId: activePoll.id });
        const encoder = new TextEncoder();
        try {
            await localParticipant.publishData(encoder.encode(payload), { reliable: true, topic: 'polls' });
            toast("Poll ended.");
        } catch (err) { }
    };

    const handleVote = async (optionIdx: number) => {
        if (!localParticipant || hasVoted || !activePoll || !activePoll.isActive) return;

        setHasVoted(true);

        if (dbRoomId) logClassEvent(parseInt(dbRoomId), 'poll_vote', { pollId: activePoll.id, optionIdx });

        // Optimistic UI
        setActivePoll(prev => {
            if (!prev) return null;
            const updatedOptions = prev.options.map((opt, idx) =>
                idx === optionIdx ? { ...opt, votes: opt.votes + 1 } : opt
            );
            return { ...prev, options: updatedOptions, totalVotes: prev.totalVotes + 1 };
        });

        const payload = JSON.stringify({ type: 'SUBMIT_VOTE', pollId: activePoll.id, optionIdx });
        const encoder = new TextEncoder();
        try {
            await localParticipant.publishData(encoder.encode(payload), { reliable: true, topic: 'polls' });
            toast.success("Vote submitted!");
        } catch (err) {
            toast.error("Failed to submit vote.");
        }
    };

    return (
        <div className="absolute top-24 left-6 w-80 md:w-96 bg-white/95 backdrop-blur shadow-2xl rounded-xl border border-slate-200 z-50 flex flex-col max-h-[70vh] overflow-hidden">
            <div className="bg-fuchsia-600 text-white p-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2 font-semibold">
                    <BarChart className="w-5 h-5 text-fuchsia-200" />
                    Class Polls
                </div>
                <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
                {activePoll ? (
                    <div className="space-y-4">
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                            <h3 className="font-semibold text-slate-800 mb-2">{activePoll.question}</h3>
                            <div className="text-xs text-slate-500 mb-4 flex justify-between">
                                <span>{activePoll.isActive ? "🟢 Active" : "🔴 Ended"}</span>
                                <span>{activePoll.totalVotes} Votes</span>
                            </div>

                            <div className="space-y-3">
                                {activePoll.options.map((opt, idx) => {
                                    const percentage = activePoll.totalVotes > 0 ? Math.round((opt.votes / activePoll.totalVotes) * 100) : 0;
                                    // Students can only see results AFTER they vote or if poll ended. Staff see always.
                                    const showResults = role === 'staff' || hasVoted || !activePoll.isActive;

                                    return (
                                        <div key={opt.id} className="space-y-1">
                                            <Button
                                                variant="outline"
                                                className={`w-full justify-between h-auto py-3 whitespace-normal text-left ${hasVoted && !activePoll.isActive ? 'opacity-80' : ''}`}
                                                disabled={hasVoted || !activePoll.isActive || role === 'staff'}
                                                onClick={() => handleVote(idx)}
                                            >
                                                <span>{opt.text}</span>
                                                {showResults && <span className="text-xs font-semibold text-fuchsia-600 ml-2">{percentage}%</span>}
                                            </Button>
                                            {showResults && (
                                                <Progress value={percentage} className="h-1.5 bg-slate-100" indicatorcolor="bg-fuchsia-500" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {role === 'staff' && (
                            <div className="flex gap-2 pt-2">
                                {activePoll.isActive ? (
                                    <Button variant="destructive" className="w-full" onClick={handleEndPoll}>
                                        End Poll
                                    </Button>
                                ) : (
                                    <Button variant="outline" className="w-full border-slate-300" onClick={() => setActivePoll(null)}>
                                        Create New Poll
                                    </Button>
                                )}
                            </div>
                        )}

                        {role === 'student' && hasVoted && activePoll.isActive && (
                            <div className="text-center text-sm text-slate-500 flex items-center justify-center gap-1.5 mt-4">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                Your vote has been recorded.
                            </div>
                        )}
                    </div>
                ) : (
                    role === 'staff' ? (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Question</label>
                                <Input
                                    placeholder="e.g. Do you understand this concept?"
                                    value={newQuestion}
                                    onChange={(e) => setNewQuestion(e.target.value)}
                                    className="bg-slate-50 border-slate-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 flex justify-between items-center">
                                    Options
                                    <button
                                        className="text-fuchsia-600 flex items-center gap-1 hover:text-fuchsia-700"
                                        onClick={() => setNewOptions([...newOptions, ""])}
                                    >
                                        <PlusCircle className="w-3.5 h-3.5" /> Add
                                    </button>
                                </label>
                                {newOptions.map((opt, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <Input
                                            placeholder={`Option ${idx + 1}`}
                                            value={opt}
                                            onChange={(e) => {
                                                const opts = [...newOptions];
                                                opts[idx] = e.target.value;
                                                setNewOptions(opts);
                                            }}
                                            className="bg-slate-50 border-slate-200"
                                        />
                                        {newOptions.length > 2 && (
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="shrink-0 text-red-500 border-red-200 hover:bg-red-50"
                                                onClick={() => setNewOptions(newOptions.filter((_, i) => i !== idx))}
                                            >
                                                <Trash className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <Button className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 mt-4" onClick={handleLaunchPoll}>
                                Launch Poll
                            </Button>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center space-y-4">
                            <BarChart className="w-12 h-12 text-slate-200" />
                            <p className="text-sm">There are no active polls right now.</p>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
