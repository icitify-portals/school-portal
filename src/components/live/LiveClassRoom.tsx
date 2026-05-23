"use client";

import {
    LiveKitRoom,
    VideoConference,
    RoomAudioRenderer,
    LayoutContextProvider,
    usePinnedTracks
} from "@livekit/components-react";
import { RoomEvent, RoomOptions, VideoPresets, Participant, Track } from "livekit-client";
import "@livekit/components-styles";
import { Activity } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import ClassInteractions from "./ClassInteractions";
import { DataSaverMode } from "./DataSaverToggle";

interface LiveClassRoomProps {
    token: string;
    serverUrl: string;
    roomName: string;
    onDisconnected: () => void;
    role: "staff" | "student";
    courseId: string;
    dbRoomId: string;
}

export default function LiveClassRoom({
    token,
    serverUrl,
    roomName,
    onDisconnected,
    role,
    courseId,
    dbRoomId,
}: LiveClassRoomProps) {
    const [connect, setConnect] = useState(false);
    const [spotlightId, setSpotlightId] = useState<string | null>(null);
    const [dataSaverMode, setDataSaverMode] = useState<DataSaverMode>('off');

    useEffect(() => {
        setConnect(true);
        return () => {
            setConnect(false);
        }
    }, []);

    if (!token) {
        return <div className="p-4 text-center">Getting connection token...</div>;
    }

    // Default: Staff ON, Student OFF
    const startOn = role === 'staff';

    // Room configurations for strict bandwidth conservation
    const roomOptions = useMemo<RoomOptions>(() => {
        const isLow = dataSaverMode === 'low';
        const isExtreme = dataSaverMode === 'extreme';

        return {
            adaptiveStream: true, // Automatically pauses off-screen videos or lowers quality
            dynacast: true,      // Tells publishers only to send resolutions that are actually being requested
            videoCaptureDefaults: {
                resolution: (isLow || isExtreme) ? VideoPresets.h180.resolution : VideoPresets.h540.resolution, 
            },
            publishDefaults: {
                videoSimulcastLayers: (isLow || isExtreme) 
                    ? [VideoPresets.h180] 
                    : [VideoPresets.h180, VideoPresets.h360, VideoPresets.h540], 
                videoCodec: 'vp8', 
                red: false,        
            }
        };
    }, [dataSaverMode]);

    // Create a pinned track array based on the spotlight identity if one exists
    const pinnedTracks = useMemo(() => {
        if (!spotlightId || dataSaverMode === 'extreme') return [];
        // We only tell LiveKit to pin the camera track of the spotlighted identity.
        return [
            {
                participantIdentity: spotlightId,
                source: Track.Source.Camera,
            }
        ] as any[]; // Cast as 'any' to bypass strict TS checking for TrackReference while preserving layout behavior
    }, [spotlightId, dataSaverMode]);

    return (
        <LiveKitRoom
            video={startOn && dataSaverMode === 'off'}
            audio={startOn}
            token={token}
            serverUrl={serverUrl}
            connect={connect}
            options={roomOptions}
            onDisconnected={onDisconnected}
            data-lk-theme="default"
            style={{ height: "100vh", display: "flex", flexDirection: "column", position: "relative" }}
        >
            <LayoutContextProvider value={{
                pin: {
                    dispatch: () => { },
                    state: pinnedTracks
                },
                widget: {
                    dispatch: () => { },
                    state: { showChat: false, unreadMessages: 0 }
                }
            }}>
                {dataSaverMode !== 'extreme' ? (
                    <VideoConference />
                ) : (
                    <div className="flex-1 flex items-center justify-center bg-slate-950 text-white flex-col gap-4">
                        <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse">
                            <Activity className="h-10 w-10 text-red-500" />
                        </div>
                        <div className="text-center">
                            <h2 className="text-xl font-bold">Extreme Data Saver Active</h2>
                            <p className="text-slate-400 text-sm">Incoming video is disabled to save bandwidth. Audio only.</p>
                        </div>
                    </div>
                )}
            </LayoutContextProvider>

            <RoomAudioRenderer />
            <ClassInteractions 
                role={role} 
                onSpotlightChange={setSpotlightId} 
                currentSpotlight={spotlightId} 
                courseId={courseId} 
                dbRoomId={dbRoomId} 
                dataSaverMode={dataSaverMode}
                onDataSaverChange={setDataSaverMode}
            />
        </LiveKitRoom>
    );
}
