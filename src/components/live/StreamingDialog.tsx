"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Share2, Radio, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { startLiveStream, stopLiveStream } from "@/actions/live-class";

interface StreamingDialogProps {
    isOpen: boolean;
    onClose: () => void;
    roomName: string;
}

export default function StreamingDialog({ isOpen, onClose, roomName }: StreamingDialogProps) {
    const [urls, setUrls] = useState<string[]>([""]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [egressId, setEgressId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const addUrl = () => setUrls([...urls, ""]);
    const removeUrl = (index: number) => {
        if (urls.length === 1) {
            setUrls([""]);
            return;
        }
        setUrls(urls.filter((_, i) => i !== index));
    };

    const updateUrl = (index: number, value: string) => {
        const newUrls = [...urls];
        newUrls[index] = value;
        setUrls(newUrls);
    };

    const handleToggleStreaming = async () => {
        setIsLoading(true);
        if (isStreaming && egressId) {
            try {
                const res = await stopLiveStream(egressId);
                if (res.error) throw new Error(res.error);
                setIsStreaming(false);
                setEgressId(null);
                toast.success("Streaming stopped successfully");
            } catch (err: any) {
                toast.error(err.message || "Failed to stop streaming");
            }
        } else {
            const validUrls = urls.filter(url => url.trim() !== "");
            if (validUrls.length === 0) {
                toast.error("Please add at least one valid RTMP URL");
                setIsLoading(false);
                return;
            }

            try {
                const res = await startLiveStream(roomName, validUrls);
                if (res.error) throw new Error(res.error);
                setIsStreaming(true);
                setEgressId(res.egressId || null);
                toast.success("Multi-streaming started!");
            } catch (err: any) {
                toast.error(err.message || "Failed to start streaming");
            }
        }
        setIsLoading(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] rounded-3xl border-slate-200 shadow-2xl bg-white/95 backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
                        <Radio className={isStreaming ? "text-red-500 animate-pulse" : "text-indigo-600"} />
                        Multi-Platform Streaming
                    </DialogTitle>
                    <DialogDescription className="text-slate-500">
                        Broadcast your live class to YouTube, Facebook, or any RTMP-compatible platform.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-4 max-h-[300px] overflow-y-auto px-1">
                        {urls.map((url, index) => (
                            <div key={index} className="flex flex-col gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:border-indigo-100">
                                <div className="flex items-center justify-between">
                                    <Label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Stream Destination {index + 1}</Label>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full"
                                        onClick={() => removeUrl(index)}
                                        disabled={isStreaming}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                                <Input
                                    placeholder="rtmp://a.rtmp.youtube.com/live2/xxxx-xxxx-xxxx-xxxx"
                                    value={url}
                                    onChange={(e) => updateUrl(index, e.target.value)}
                                    className="h-10 rounded-xl border-slate-200 bg-white focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                                    disabled={isStreaming}
                                />
                            </div>
                        ))}
                    </div>

                    {!isStreaming && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full h-10 border-dashed border-2 border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/30 rounded-xl flex items-center gap-2 transition-all"
                            onClick={addUrl}
                        >
                            <Plus className="h-4 w-4" />
                            Add Stream Destination
                        </Button>
                    )}
                </div>

                <DialogFooter className="flex sm:justify-between items-center gap-4 border-t border-slate-100 pt-4 mt-2">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Share2 className="h-3 w-3" />
                        LiveKit Egress Engine
                    </div>
                    <Button
                        onClick={handleToggleStreaming}
                        className={isStreaming ? "bg-red-600 hover:bg-red-700 text-white rounded-xl px-6 h-11" : "bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 h-11"}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Please wait...
                            </>
                        ) : isStreaming ? (
                            "Stop All Streams"
                        ) : (
                            "Go Live Now"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
