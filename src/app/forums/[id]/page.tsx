"use client";

import { useState } from "react";
import { replyToTopic } from "@/actions/communication";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    User,
    MessageCircle,
    Share2,
    MoreHorizontal,
    Pin,
    CornerDownRight,
    ArrowLeft
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";

import { useParams } from "next/navigation";

export default function ForumTopicPage() {
    const params = useParams<{ id: string }>();
    const [reply, setReply] = useState("");
    const [loading, setLoading] = useState(false);

    const handleReply = async () => {
        if (!reply.trim()) return;
        setLoading(true);
        const res = await replyToTopic(parseInt(params.id), reply);
        if (res.success) {
            toast.success("Reply posted!");
            setReply("");
            // In a real app, revalidate or update local state
        } else {
            toast.error(res.error);
        }
        setLoading(false);
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <Link
                href="/forums"
                className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" /> Back to Forums
            </Link>

            {/* Original Post */}
            <Card className="overflow-hidden border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="bg-indigo-600 h-1.5 w-full" />
                <CardContent className="p-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <Avatar className="w-12 h-12 border-2 border-slate-50 shadow-sm">
                                <AvatarFallback className="bg-indigo-100 text-indigo-600 font-bold">AS</AvatarFallback>
                            </Avatar>
                            <div>
                                <h4 className="text-sm font-black text-slate-800">Adebola Samuel</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Post Author • 2 hours ago</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="rounded-full text-slate-400">
                                <Pin className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="rounded-full text-slate-400">
                                <MoreHorizontal className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-4">How to handle complex database migrations in Drizzle?</h1>
                    <div className="prose prose-slate max-w-none">
                        <p className="text-slate-600 leading-relaxed text-base font-medium">
                            I've been working on the communication module and I'm finding it tricky to manage relations across 20+ tables. Does anyone have a recommended pattern for splitting schemas or managing large migration files without breaking things?
                        </p>
                    </div>
                    <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <button className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-xl transition-all">
                                <MessageCircle className="w-4 h-4" /> 12 Replies
                            </button>
                            <button className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600">
                                <Share2 className="w-4 h-4" /> Share
                            </button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Replies */}
            <div className="space-y-6 pl-12">
                <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <CornerDownRight className="w-5 h-5 text-slate-300" />
                    </div>
                    <Card className="flex-1 border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-3">
                                <Avatar className="w-8 h-8">
                                    <AvatarFallback className="bg-slate-100 text-xs font-bold">JD</AvatarFallback>
                                </Avatar>
                                <span className="text-xs font-black text-slate-800">Jane Doe</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">1 hour ago</span>
                            </div>
                            <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                I usually split my schema into multiple files and import them into a central `schema.ts`. Drizzle handles this really well with the `out` directory during migrations!
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Quick Reply */}
            <div className="pt-8">
                <Card className="/50 border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <CardContent className="p-6 space-y-4">
                        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <MessageCircle className="w-3 h-3" /> Post your reply
                        </div>
                        <Textarea
                            value={reply}
                            onChange={(e) => setReply(e.target.value)}
                            placeholder="Share your thoughts or answer the question..."
                            className="bg-white rounded-2xl border-none p-4 shadow-sm min-h-[120px] font-medium"
                        />
                        <div className="flex justify-end">
                            <Button
                                onClick={handleReply}
                                disabled={loading || !reply.trim()}
                                className="bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-xs uppercase tracking-widest px-8 shadow-lg shadow-slate-200"
                            >
                                {loading ? "Posting..." : "Post Reply"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
