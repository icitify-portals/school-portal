"use server";

import { auth } from "@/auth";
import { db } from "@/db/db";
import { logActivity } from "./audit";

// ─── Types ───
interface MeetingConfig {
    provider: 'zoom' | 'bbb';
    title: string;
    description?: string;
    startTime: string; // ISO
    duration: number; // minutes
    courseId?: number;
}

interface MeetingResult {
    id: string;
    joinUrl: string;
    hostUrl?: string;
    provider: string;
    title: string;
    startTime: string;
    duration: number;
}

// ─── Zoom Integration ───
async function createZoomMeeting(config: MeetingConfig): Promise<MeetingResult | null> {
    const apiKey = process.env.ZOOM_API_KEY;
    const apiSecret = process.env.ZOOM_API_SECRET;
    const accountId = process.env.ZOOM_ACCOUNT_ID;

    if (!apiKey || !apiSecret || !accountId) {
        throw new Error("Zoom credentials not configured. Set ZOOM_API_KEY, ZOOM_API_SECRET, and ZOOM_ACCOUNT_ID in .env");
    }

    try {
        // Get access token via Server-to-Server OAuth
        const tokenRes = await fetch(`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        const tokenData = await tokenRes.json();

        if (!tokenData.access_token) throw new Error("Failed to get Zoom access token");

        // Create meeting
        const meetingRes = await fetch('https://api.zoom.us/v2/users/me/meetings', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                topic: config.title,
                type: 2, // scheduled
                start_time: config.startTime,
                duration: config.duration,
                agenda: config.description || '',
                settings: {
                    join_before_host: true,
                    waiting_room: false,
                    mute_upon_entry: true,
                },
            }),
        });

        const meeting = await meetingRes.json();

        return {
            id: String(meeting.id),
            joinUrl: meeting.join_url,
            hostUrl: meeting.start_url,
            provider: 'zoom',
            title: config.title,
            startTime: config.startTime,
            duration: config.duration,
        };
    } catch (error) {
        console.error("Zoom create meeting error:", error);
        return null;
    }
}

// ─── BigBlueButton Integration ───
async function createBBBMeeting(config: MeetingConfig): Promise<MeetingResult | null> {
    const bbbUrl = process.env.BBB_SERVER_URL;
    const bbbSecret = process.env.BBB_SECRET;

    if (!bbbUrl || !bbbSecret) {
        throw new Error("BigBlueButton credentials not configured. Set BBB_SERVER_URL and BBB_SECRET in .env");
    }

    try {
        // BBB API uses checksum-based auth
        const crypto = await import('crypto');
        const meetingId = `meeting-${Date.now()}`;
        const params = `name=${encodeURIComponent(config.title)}&meetingID=${meetingId}&duration=${config.duration}&welcome=${encodeURIComponent('Welcome to ' + config.title)}`;
        const checksum = crypto.createHash('sha1').update(`create${params}${bbbSecret}`).digest('hex');

        const createUrl = `${bbbUrl}/api/create?${params}&checksum=${checksum}`;
        const res = await fetch(createUrl, { method: 'GET' });
        const text = await res.text();

        if (!text.includes('<returncode>SUCCESS</returncode>')) {
            throw new Error("BBB meeting creation failed");
        }

        // Generate join URL
        const joinParams = `meetingID=${meetingId}&fullName=Participant&password=ap`;
        const joinChecksum = crypto.createHash('sha1').update(`join${joinParams}${bbbSecret}`).digest('hex');
        const joinUrl = `${bbbUrl}/api/join?${joinParams}&checksum=${joinChecksum}`;

        const hostParams = `meetingID=${meetingId}&fullName=Host&password=mp`;
        const hostChecksum = crypto.createHash('sha1').update(`join${hostParams}${bbbSecret}`).digest('hex');
        const hostUrl = `${bbbUrl}/api/join?${hostParams}&checksum=${hostChecksum}`;

        return {
            id: meetingId,
            joinUrl,
            hostUrl,
            provider: 'bbb',
            title: config.title,
            startTime: config.startTime,
            duration: config.duration,
        };
    } catch (error) {
        console.error("BBB create meeting error:", error);
        return null;
    }
}

// ─── Exported Server Actions ───

export async function createMeeting(config: MeetingConfig) {
    try {
        const session = await auth();
        if (!session?.user) return { error: "Unauthorized" };

        let result: MeetingResult | null = null;

        if (config.provider === 'zoom') {
            result = await createZoomMeeting(config);
        } else if (config.provider === 'bbb') {
            result = await createBBBMeeting(config);
        }

        if (!result) return { error: `Failed to create ${config.provider} meeting` };

        await logActivity('create_meeting', 'meeting', undefined, {
            provider: config.provider,
            title: config.title,
            meetingId: result.id,
        });

        return { success: true, meeting: result };
    } catch (error: any) {
        console.error("Create Meeting Error:", error);
        return { error: error.message || "Failed to create meeting" };
    }
}

export async function getConferencingStatus() {
    const zoomConfigured = !!(process.env.ZOOM_API_KEY && process.env.ZOOM_API_SECRET && process.env.ZOOM_ACCOUNT_ID);
    const bbbConfigured = !!(process.env.BBB_SERVER_URL && process.env.BBB_SECRET);

    return {
        success: true,
        providers: {
            zoom: { configured: zoomConfigured, name: 'Zoom' },
            bbb: { configured: bbbConfigured, name: 'BigBlueButton' },
        },
    };
}
