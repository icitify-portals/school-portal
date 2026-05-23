"use client";

import { Tldraw, useEditor } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import { Maximize2, Minimize2, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useRoomContext, useLocalParticipant } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';
import { toast } from 'sonner';

interface Props {
    onClose: () => void;
    role?: "staff" | "student";
}

// Inner component to access the Tldraw editor instance context
function SyncLogic({ isStaff, localIdentity }: { isStaff: boolean, localIdentity: string }) {
    const editor = useEditor();
    const room = useRoomContext();
    const { localParticipant } = useLocalParticipant();

    // Set read-only for students
    useEffect(() => {
        editor.updateInstanceState({ isReadonly: !isStaff });
    }, [editor, isStaff]);

    useEffect(() => {
        if (!room) return;

        // 1. Listen for incoming drawing updates from others
        const handleData = (payload: Uint8Array, participant?: any, kind?: any, topic?: string) => {
            if (topic !== 'whiteboard') return;
            // Ignore our own echoed packets if any
            if (participant?.identity === localIdentity) return;

            try {
                const text = new TextDecoder().decode(payload);
                const update = JSON.parse(text);

                if (update.type === 'DRAW_SYNC') {
                    // Temporarily disable our own listener so we don't broadcast what we just received
                    editor.store.mergeRemoteChanges(() => {
                        editor.store.put(Object.values(update.added));
                        editor.store.put(Object.values(update.updated));
                        editor.store.remove(Object.values(update.removed));
                    });
                } else if (update.type === 'CLEAR') {
                    editor.store.mergeRemoteChanges(() => {
                        editor.selectAll();
                        editor.deleteShapes(editor.getSelectedShapeIds());
                    });
                }
            } catch (err) {
                console.error("Whiteboard sync error", err);
            }
        };

        room.on(RoomEvent.DataReceived, handleData);

        // 2. Broadcast our own drawing changes (Staff only typically)
        const unlisten = editor.store.listen(
            (update) => {
                // Return early if we aren't allowed to draw or if it's a remote change
                if (!isStaff) return;
                // 'remote' changes are changes we applied from `mergeRemoteChanges` above
                // 'ephemeral' changes are pointer movements, not actual shape commits
                if (update.source === 'remote') return;

                const { added, updated, removed } = update.changes;

                // Filter out non-shape updates like camera or pointer movements if needed, 
                // but Tldraw's default store sync usually handles full records.
                const hasChanges =
                    Object.keys(added).length > 0 ||
                    Object.keys(updated).length > 0 ||
                    Object.keys(removed).length > 0;

                if (!hasChanges) return;

                const payload = JSON.stringify({
                    type: 'DRAW_SYNC',
                    added,
                    updated,
                    removed
                });

                if (localParticipant) {
                    const encoder = new TextEncoder();
                    localParticipant.publishData(encoder.encode(payload), { reliable: true, topic: 'whiteboard' });
                }
            },
            { scope: 'document', source: 'user' }
        );

        return () => {
            room.off(RoomEvent.DataReceived, handleData);
            unlisten();
        };
    }, [editor, room, localIdentity, localParticipant, isStaff]);

    return null;
}

export default function ClassWhiteboard({ onClose, role = "student" }: Props) {
    const [isExpanded, setIsExpanded] = useState(false);
    const { localParticipant } = useLocalParticipant();
    const isStaff = role === 'staff';

    return (
        <div
            className={`fixed z-50 bg-white shadow-2xl transition-all duration-300 ${isExpanded
                ? 'inset-4 rounded-xl border'
                : 'top-20 bottom-24 right-4 w-[600px] rounded-xl border'
                }`}
        >
            {!isStaff && (
                <div className="absolute top-4 left-4 z-50 flex items-center gap-2 bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm pointer-events-none">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Read Only
                </div>
            )}
            <div className="absolute top-4 right-4 z-50 flex gap-2">
                <Button
                    variant="secondary"
                    size="icon"
                    className="shadow-sm bg-white hover:bg-slate-100"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
                <Button
                    variant="destructive"
                    size="icon"
                    className="shadow-sm"
                    onClick={onClose}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <div className="w-full h-full overflow-hidden rounded-xl">
                {/* Tldraw wrapper provides the editor context */}
                <Tldraw autoFocus={isStaff} hideUi={!isStaff}>
                    <SyncLogic isStaff={isStaff} localIdentity={localParticipant?.identity || ""} />
                </Tldraw>
            </div>
        </div>
    );
}
