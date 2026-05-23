"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlayCircle, Download, Loader2, AlertCircle } from "lucide-react";
import { getRecordingDownloadUrl } from "@/actions/live-class";
import { toast } from "sonner";

interface RecordingPlayerProps {
    s3Key: string;
    title: string;
    trigger?: React.ReactNode;
}

export default function RecordingPlayer({ s3Key, title, trigger }: RecordingPlayerProps) {
    const [url, setUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    const handleOpen = async () => {
        setIsOpen(true);
        if (url) return; // Already fetched

        setLoading(true);
        setError(null);
        try {
            const res = await getRecordingDownloadUrl(s3Key);
            if (res.error) throw new Error(res.error);
            if (res.url) {
                setUrl(res.url);
            }
        } catch (err: any) {
            setError(err.message || "Failed to load recording");
            toast.error("Could not generate secure playback link.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild onClick={(e) => { e.preventDefault(); handleOpen(); }}>
                {trigger || (
                    <Button variant="outline" size="sm">
                        <PlayCircle className="w-4 h-4 mr-2" /> Play Recording
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-4xl bg-slate-950 border-slate-800 p-0 overflow-hidden shadow-2xl">
                <DialogHeader className="p-4 bg-slate-900 border-b border-slate-800 flex flex-row items-center justify-between">
                    <DialogTitle className="text-slate-100 flex items-center gap-2">
                        <PlayCircle className="w-5 h-5 text-indigo-400" />
                        {title}
                    </DialogTitle>
                </DialogHeader>

                <div className="aspect-video w-full bg-black flex items-center justify-center relative">
                    {loading && (
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-10 h-10 animate-spin text-white opacity-50" />
                            <p className="text-slate-400 text-sm animate-pulse">Requesting secure access...</p>
                        </div>
                    )}

                    {error && (
                        <div className="flex flex-col items-center gap-3 text-red-400 p-8 text-center">
                            <AlertCircle className="w-12 h-12 mb-2" />
                            <p className="font-bold">Playback Error</p>
                            <p className="text-sm opacity-80 max-w-xs">{error}</p>
                            <Button variant="outline" size="sm" onClick={handleOpen} className="mt-4 border-red-900/50 hover:bg-red-950">
                                Retry Connection
                            </Button>
                        </div>
                    )}

                    {!loading && !error && url && (
                        <video
                            src={url}
                            controls
                            autoPlay
                            className="w-full h-full"
                            style={{ display: loading ? 'none' : 'block' }}
                        />
                    )}
                </div>

                <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-end gap-3">
                    {url && (
                        <Button variant="outline" size="sm" asChild className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white">
                            <a href={url} download={`${title}.mp4`}>
                                <Download className="w-4 h-4 mr-2" /> Download MP4
                            </a>
                        </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
                        Close Player
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
