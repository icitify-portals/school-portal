"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

type MsgType = 'Data' | 'Complete' | 'Close' | 'Error';
type Pipe = 'StdOut' | 'StdErr';

interface MsgOut {
    type: MsgType;
    pipe?: Pipe;
    message?: string;
    pid?: number;
    hash?: string;
    timestamp: number;
}

export function useWebsocketTerminal() {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [output, setOutput] = useState<MsgOut[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [activeProcess, setActiveProcess] = useState<{ pid: number; hash: string } | null>(null);

    const connect = useCallback((url: string = "wss://localhost:8087") => {
        const ws = new WebSocket(url);

        ws.onopen = () => {
            setIsConnected(true);
            setOutput(prev => [...prev, { 
                type: 'Data', 
                message: "[SYSTEM] Secure WebSocket connection established.", 
                timestamp: Date.now() 
            }]);
        };

        ws.onmessage = (event) => {
            try {
                const msg: MsgOut = JSON.parse(event.data);
                setOutput(prev => [...prev, msg]);

                if (msg.type === 'Data' && msg.pid && msg.hash) {
                    setActiveProcess({ pid: msg.pid, hash: msg.hash });
                }

                if (msg.type === 'Complete' || msg.type === 'Close') {
                    setActiveProcess(null);
                }
            } catch (e) {
                console.error("Failed to parse websocket message", e);
            }
        };

        ws.onclose = () => {
            setIsConnected(false);
            setSocket(null);
        };

        setSocket(ws);
    }, []);

    const runCommand = (version: string, args: string[]) => {
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            console.error("Socket not connected");
            return;
        }

        const msgIn = {
            version,
            args,
            timestamp: Date.now()
        };

        socket.send(JSON.stringify(msgIn));
    };

    const terminateProcess = () => {
        if (!socket || !activeProcess) return;

        const msgIn = {
            terminate: true,
            pid: activeProcess.pid,
            hash: activeProcess.hash,
            timestamp: Date.now()
        };

        socket.send(JSON.stringify(msgIn));
    };

    const clearOutput = () => setOutput([]);

    return {
        connect,
        isConnected,
        output,
        runCommand,
        terminateProcess,
        clearOutput,
        activeProcess
    };
}
