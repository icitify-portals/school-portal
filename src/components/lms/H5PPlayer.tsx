"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface H5PPlayerProps {
    h5pJsonPath: string; // Base URL of extracted H5P folder (e.g., https://.../h5p/uuid)
    onComplete?: (score?: number) => void;
}

export default function H5PPlayer({ h5pJsonPath, onComplete }: H5PPlayerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        let h5pInstance: any = null;

        const initH5P = async () => {
            try {
                // @ts-ignore
                const { H5P } = await import("h5p-standalone");
                
                if (containerRef.current) {
                    // Ensure container is empty
                    containerRef.current.innerHTML = "";
                    
                    const options = {
                        id: 'h5p-player',
                        h5pJsonPath: h5pJsonPath,
                        // Using CDNs for the player frame assets to ensure they are available
                        frameJs: "https://cdn.jsdelivr.net/npm/h5p-standalone@1.3.11/dist/frame.bundle.js",
                        frameCss: "https://cdn.jsdelivr.net/npm/h5p-standalone@1.3.11/dist/styles/h5p.css",
                        fullScreen: false
                    };

                    h5pInstance = new H5P(containerRef.current, options);
                    
                    await h5pInstance.init();

                    // Listen for xAPI statements for completion tracking
                    // @ts-ignore
                    if (window.H5P && window.H5P.externalDispatcher) {
                        // @ts-ignore
                        window.H5P.externalDispatcher.on('xAPI', (event: any) => {
                            const verb = event.getVerb();
                            if (verb === 'completed' || verb === 'passed') {
                                const score = event.getScore();
                                if (onComplete) onComplete(score);
                            }
                        });
                    }
                }
            } catch (error) {
                console.error("H5P Initialization failed:", error);
            } finally {
                setLoading(false);
            }
        };

        initH5P();

        return () => {
            // No explicit destroy in standalone, but clear container
            if (containerRef.current) containerRef.current.innerHTML = "";
        };
    }, [h5pJsonPath]);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.parentElement?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    return (
        <div className={cn(
            "relative w-full min-h-[600px] bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-xl",
            isFullscreen && "fixed inset-0 z-50 h-screen w-screen rounded-none"
        )}>
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Loading Interactive Experience...</p>
                    </div>
                </div>
            )}

            <div className="absolute top-4 right-4 z-20">
                <Button 
                    variant="secondary" 
                    size="sm" 
                    className="h-10 w-10 p-0 rounded-xl bg-white/90 backdrop-blur border-none shadow-lg hover:scale-110 transition-transform"
                    onClick={toggleFullscreen}
                >
                    {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </Button>
            </div>

            <div ref={containerRef} className="h5p-container w-full h-full" id="h5p-container" />
        </div>
    );
}
