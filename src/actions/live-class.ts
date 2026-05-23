"use server";

import { AccessToken, EgressClient, EncodedFileType, EncodedFileOutput, RoomServiceClient, S3Upload, StreamOutput } from "livekit-server-sdk";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { db } from "@/db/db";
import { virtualClassrooms, classRecordings, enrollments, courseLecturers, users, attendance, classEvents } from "@/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { auth } from "@/auth";
import { getAIProvider } from "@/lib/ai-service";

function getS3Client() {
    return new S3Client({
        region: process.env.S3_REGION || "us-east-1",
        credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY || "",
            secretAccessKey: process.env.S3_SECRET_KEY || "",
        },
        endpoint: process.env.S3_ENDPOINT || undefined,
        forcePathStyle: true, // Typical for Wasabi/Minio
    });
}

export async function getRecordingDownloadUrl(s3Key: string) {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    try {
        const client = getS3Client();
        const command = new GetObjectCommand({
            Bucket: process.env.S3_BUCKET || "",
            Key: s3Key,
        });

        // URL valid for 1 hour
        const url = await getSignedUrl(client, command, { expiresIn: 3600 });
        return { url };
    } catch (error) {
        console.error("S3 Presign Error:", error);
        return { error: "Failed to generate secure URL" };
    }
}

import { getLiveKitCredentials } from "@/actions/system-settings";

export async function markLiveAttendance() {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        await db.insert(attendance).values({
            userId: parseInt(session.user.id),
            type: 'in',
        });
        return { success: true };
    } catch (error) {
        console.error("Auto Attendance Error:", error);
        return { error: "Failed to mark attendance" };
    }
}

export async function createClassSession(courseId: number, title: string, slotId?: number, mode: 'meeting' | 'webinar' = 'meeting') {
    const session = await auth();
    const user = session?.user as any;
    if (!user || user.role !== 'staff') {
        throw new Error("Unauthorized");
    }

    const roomName = `course-${courseId}-${Date.now()}`;

    // Create DB entry
    const insertResult = await db.insert(virtualClassrooms).values({
        courseId,
        lecturerId: parseInt(user.id),
        title,
        roomName,
        timetableSlotId: slotId,
        status: 'active',
        mode,
        startedAt: new Date(),
    });

    let insertId = Array.isArray(insertResult) ? insertResult[0]?.insertId : (insertResult as any)?.insertId;

    if (!insertId) {
        const row = await db.select({ id: virtualClassrooms.id }).from(virtualClassrooms).where(eq(virtualClassrooms.roomName, roomName)).limit(1);
        if (row.length > 0) {
            insertId = row[0].id;
        }
    }

    return {
        id: insertId,
        roomName,
        token: await generateToken(roomName, user.id.toString(), user.name || "Lecturer", true, true)
    };
}

export async function joinClassSession(courseId: number, roomId: number) {
    const session = await auth();
    const user = session?.user as any;
    if (!user) {
        throw new Error("Unauthorized");
    }

    const userId = parseInt(user.id);
    const role = user.role;

    // Verify access
    if (role === 'student') {
        const enrollment = await db.select().from(enrollments)
            .where(and(eq(enrollments.studentId, userId), eq(enrollments.courseId, courseId)))
            .limit(1);

        if (enrollment.length === 0) throw new Error("Not enrolled in this course");
    } else if (role === 'staff') {
        // Broad check for staff access, ideally verify if they teach the course
    }

    const room = await db.select().from(virtualClassrooms).where(eq(virtualClassrooms.id, roomId)).limit(1);
    if (room.length === 0) throw new Error("Room not found");

    if (room[0].status === 'ended') throw new Error("Class has ended");

    // Determine permissions
    const mode = room[0].mode || 'meeting';
    let canPublish = true;

    // Enforce participant limits
    try {
        const { url, apiKey, apiSecret } = await getLiveKitCredentials();
        const roomService = new RoomServiceClient(url, apiKey, apiSecret);
        const participants = await roomService.listParticipants(room[0].roomName);
        
        const isAlreadyIn = participants.some(p => p.identity === user.id.toString());
        const limit = mode === 'webinar' ? 300 : 100;

        if (!isAlreadyIn && participants.length >= limit) {
            throw new Error(`Room is full. Maximum ${limit} participants allowed for ${mode} mode.`);
        }
    } catch (err: any) {
        if (err.message?.includes("Room is full")) throw err;
        console.error("LiveKit Limit Check Error (continuing):", err);
    }

    if (role === 'student' && mode === 'webinar') {
        canPublish = false;
    }

    return {
        roomName: room[0].roomName,
        token: await generateToken(room[0].roomName, user.id.toString(), user.name || "User", role === 'staff', canPublish),
        role
    };
}

export async function getBreakoutToken(roomId: number, breakoutId: string) {
    const session = await auth();
    const user = session?.user as any;
    if (!user) {
        throw new Error("Unauthorized");
    }

    const room = await db.select().from(virtualClassrooms).where(eq(virtualClassrooms.id, roomId)).limit(1);
    if (room.length === 0) throw new Error("Main room not found");

    const breakoutRoomName = `${room[0].roomName}-breakout-${breakoutId}`;

    // For breakouts, we allow everyone to publish by default for group work
    const token = await generateToken(breakoutRoomName, user.id.toString(), user.name || "User", user.role === 'staff', true);

    return {
        token,
        roomName: breakoutRoomName,
        role: user.role
    };
}

export async function logClassEvent(
    classroomId: number,
    eventType: 'hand_raise' | 'hand_lower' | 'poll_vote' | 'qa_question' | 'qa_answer' | 'reaction' |
        'background_blur_enabled' | 'background_blur_disabled' |
        'spotlight_self_enabled' | 'spotlight_self_disabled' | 'spotlight_changed' |
        'new_poll_received' | 'poll_ended_received' | 'chat_message',
    eventData?: any
) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        await db.insert(classEvents).values({
            sessionId: 0, // Fallback for schema requirement
            participantIdentity: session.user.id.toString(),
            classroomId,
            userId: parseInt(session.user.id),
            eventType,
            eventData: eventData ? JSON.stringify(eventData) : null,
        });
        return { success: true };
    } catch (error) {
        console.error("Log Event Error:", error);
        return { error: "Failed to log event" };
    }
}

export async function getSessionAnalytics(classroomId: number) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        const events = await db.query.classEvents.findMany({
            where: eq(classEvents.classroomId, classroomId),
            with: {
                user: true,
            },
        });

        const stats = {
            totalEvents: events.length,
            handRaises: events.filter(e => e.eventType === 'hand_raise').length,
            pollVotes: events.filter(e => e.eventType === 'poll_vote').length,
            reactions: events.filter(e => e.eventType === 'reaction').length,
            questions: events.filter(e => e.eventType === 'qa_question').length,
            answers: events.filter(e => e.eventType === 'qa_answer').length,
            engagementByStudent: {} as Record<string, {
                name: string,
                score: number,
                weightedScore: number,
                events: any[]
            }>,
            classEngagementAverage: 0,
        };

        events.forEach(e => {
            const userId = e.userId?.toString() || '0';
            if (!stats.engagementByStudent[userId]) {
                stats.engagementByStudent[userId] = {
                    name: e.user?.name || "Unknown",
                    score: 0,
                    weightedScore: 0,
                    events: [],
                };
            }
            stats.engagementByStudent[userId].score += 1;

            // Weighted participation scoring
            let weight = 1;
            switch (e.eventType) {
                case 'poll_vote': weight = 10; break;
                case 'hand_raise': weight = 5; break;
                case 'qa_question': weight = 3; break;
                case 'qa_answer': weight = 8; break;
                case 'reaction': weight = 1; break;
                case 'spotlight_changed': weight = 2; break;
            }
            stats.engagementByStudent[userId].weightedScore += weight;

            stats.engagementByStudent[userId].events.push({
                type: e.eventType,
                data: e.eventData,
                time: e.createdAt,
            });
        });

        return stats;
    } catch (error) {
        console.error("Aggregation Error:", error);
        return { error: "Failed to aggregate analytics" };
    }
}

export async function summarizeLiveClass(classroomId: number) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        const events = await db.query.classEvents.findMany({
            where: and(
                eq(classEvents.classroomId, classroomId),
                inArray(classEvents.eventType, ['chat_message', 'qa_question', 'qa_answer'])
            ),
            with: { user: true },
            orderBy: [desc(classEvents.createdAt)]
        });

        if (events.length === 0) return { summary: "Not enough interaction data to generate a summary." };

        const interactionLogs = events.reverse().map(e => {
            const type = e.eventType === 'chat_message' ? 'CHAT' : e.eventType === 'qa_question' ? 'QUESTION' : 'ANSWER';
            const data = e.eventData as any;
            return `[${type}] ${e.user?.name || 'Unknown'}: ${data?.text || data?.questionId || ''}`;
        }).join('\n');

        const ai = getAIProvider();
        const prompt = `
            You are an AI teaching assistant. Summarize the following live class interaction logs into a concise, professional summary for the lecturer.
            Focus on:
            1. Key topics discussed.
            2. Major questions asked by students.
            3. General engagement sentiment.

            Logs:
            ${interactionLogs}

            Output as a clean markdown-formatted summary with bullet points.
        `;

        const summary = await ai.generateText(prompt, "You are a helpful academic assistant providing class session summaries.");
        return { summary };
    } catch (error) {
        console.error("AI Summary Error:", error);
        return { error: "Failed to generate AI summary" };
    }
}

export async function endClassSession(roomId: number) {
    const session = await auth();
    const user = session?.user as any;
    if (!user || user.role !== 'staff') {
        throw new Error("Unauthorized");
    }

    // Update status
    await db.update(virtualClassrooms)
        .set({ status: 'ended', endedAt: new Date() })
        .where(eq(virtualClassrooms.id, roomId));

    // In a real scenario, we'd trigger Egress stop here via API
    return { success: true };
}

export async function getActiveClassesForStudent(studentId: number) {
    // Get all enrolled courses
    const studentEnrollments = await db.select({ courseId: enrollments.courseId })
        .from(enrollments)
        .where(eq(enrollments.studentId, studentId));

    const courseIds = studentEnrollments.map(e => e.courseId);
    if (courseIds.length === 0) return [];

    // Find active rooms
    /* 
       Note: Drizzle's `inArray` requires a non-empty array. 
       We return empty if no courses.
    */
    const activeRooms = await db.select()
        .from(virtualClassrooms)
        .where(and(
            // inArray(virtualClassrooms.courseId, courseIds),
            eq(virtualClassrooms.status, 'active')
        ));

    // Filter manually if needed or ensure inArray matches
    return activeRooms.filter(r => courseIds.includes(r.courseId));
}

export async function getCourseRecordings(courseId: number) {

    return await db.select({
        id: classRecordings.id,
        title: virtualClassrooms.title,
        date: virtualClassrooms.startedAt,
        duration: classRecordings.durationSeconds,
        url: classRecordings.s3Url,
        s3Key: classRecordings.s3Key,
    })
        .from(classRecordings)
        .innerJoin(virtualClassrooms, eq(classRecordings.classroomId, virtualClassrooms.id))
        .where(eq(virtualClassrooms.courseId, courseId))
        .orderBy(desc(virtualClassrooms.startedAt));
}

export async function getLecturerRecordings(lecturerId: number) {
    return await db.select({
        id: classRecordings.id,
        title: virtualClassrooms.title,
        date: virtualClassrooms.startedAt,
        duration: classRecordings.durationSeconds,
        url: classRecordings.s3Url,
        s3Key: classRecordings.s3Key,
    })
        .from(classRecordings)
        .innerJoin(virtualClassrooms, eq(classRecordings.classroomId, virtualClassrooms.id))
        .where(eq(virtualClassrooms.lecturerId, lecturerId))
        .orderBy(desc(virtualClassrooms.startedAt));
}

export async function getStudentRecordings(studentId: number) {
    // Get all enrolled courses
    const studentEnrollments = await db.select({ courseId: enrollments.courseId })
        .from(enrollments)
        .where(eq(enrollments.studentId, studentId));

    const courseIds = studentEnrollments.map(e => e.courseId);
    if (courseIds.length === 0) return [];

    const recordings = await db.select({
        id: classRecordings.id,
        title: virtualClassrooms.title,
        date: virtualClassrooms.startedAt,
        duration: classRecordings.durationSeconds,
        url: classRecordings.s3Url,
        s3Key: classRecordings.s3Key,
        courseId: virtualClassrooms.courseId
    })
        .from(classRecordings)
        .innerJoin(virtualClassrooms, eq(classRecordings.classroomId, virtualClassrooms.id))
        .orderBy(desc(virtualClassrooms.startedAt));

    return recordings.filter(r => courseIds.includes(r.courseId));
}

export async function startRecording(roomName: string) {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'staff') {
        return { error: "Unauthorized" };
    }

    try {
        const { url, apiKey, apiSecret } = await getLiveKitCredentials();
        const egressClient = new EgressClient(url, apiKey, apiSecret);
        const s3Upload = new S3Upload({
            accessKey: process.env.S3_ACCESS_KEY || "",
            secret: process.env.S3_SECRET_KEY || "",
            region: process.env.S3_REGION || "",
            endpoint: process.env.S3_ENDPOINT || "",
            bucket: process.env.S3_BUCKET || "",
        });

        const fileOutput = new EncodedFileOutput({
            fileType: EncodedFileType.MP4,
            filepath: `recordings/${roomName}-${Date.now()}.mp4`,
            output: {
                case: 's3',
                value: s3Upload
            }
        });

        const info = await egressClient.startRoomCompositeEgress(roomName, {
            file: fileOutput
        });

        // Insert placeholder recording in DB
        const classroomRes = await db.select({ id: virtualClassrooms.id }).from(virtualClassrooms).where(eq(virtualClassrooms.roomName, roomName)).limit(1);
        if (classroomRes.length > 0) {
            await db.insert(classRecordings).values({
                classroomId: classroomRes[0].id,
                s3Key: fileOutput.filepath!,
                s3Url: `https://${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${fileOutput.filepath}`, // Example public url struct
            });
        }

        return { success: true, egressId: info.egressId };
    } catch (error: any) {
        let errorMsg = error.message || "Failed to start recording.";

        // This specific error means LiveKit Cloud has nowhere to save the MP4 file
        if (errorMsg.includes("missing or invalid field: output") || errorMsg.includes("storage")) {
            errorMsg = "Cloud Recording Failed: No Storage Bucket configured. Please link an S3 bucket in your LiveKit Cloud dashboard, or set up a local LiveKit Docker server.";
        }

        return { error: errorMsg };
    }
}

export async function stopRecording(egressId: string) {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'staff') {
        return { error: "Unauthorized" };
    }

    try {
        const { url, apiKey, apiSecret } = await getLiveKitCredentials();
        const egressClient = new EgressClient(url, apiKey, apiSecret);

        await egressClient.stopEgress(egressId);
        return { success: true };
    } catch (error: any) {
        return { error: error.message || "Failed to stop recording." };
    }
}

async function generateToken(roomName: string, participantId: string, participantName: string, isAdmin: boolean, canPublish: boolean = true) {
    const { apiKey, apiSecret } = await getLiveKitCredentials();
    const at = new AccessToken(apiKey, apiSecret, {
        identity: participantId, // Must be URL safe string without spaces to prevent Websocket failure
        name: participantName,
    });

    at.addGrant({
        roomJoin: true,
        room: roomName,
        canPublish: canPublish,
        canSubscribe: true,
        canPublishData: canPublish
    });

    return at.toJwt();
}

export async function kickParticipant(roomName: string, identity: string) {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'staff') {
        return { error: "Unauthorized" };
    }

    try {
        const { url, apiKey, apiSecret } = await getLiveKitCredentials();
        const roomService = new RoomServiceClient(url, apiKey, apiSecret);

        await roomService.removeParticipant(roomName, identity);
        return { success: true };
    } catch (error: any) {
        return { error: error.message || "Failed to remove participant" };
    }
}

export async function muteParticipantTrack(roomName: string, identity: string, trackSid: string) {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'staff') {
        return { error: "Unauthorized" };
    }

    try {
        const { url, apiKey, apiSecret } = await getLiveKitCredentials();
        const roomService = new RoomServiceClient(url, apiKey, apiSecret);

        await roomService.mutePublishedTrack(roomName, identity, trackSid, true);
        return { success: true };
    } catch (error: any) {
        return { error: error.message || "Failed to mute participant track" };
    }
}

export async function startLiveStream(roomName: string, urls: string[]) {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'staff') {
        return { error: 'Unauthorized' };
    }

    try {
        const { url, apiKey, apiSecret } = await getLiveKitCredentials();
        const egressClient = new EgressClient(url, apiKey, apiSecret);

        const streamOutput = new StreamOutput({
            urls: urls
        });

        const info = await egressClient.startRoomCompositeEgress(roomName, {
            stream: streamOutput
        });

        return { success: true, egressId: info.egressId };
    } catch (error: any) {
        return { error: error.message || 'Failed to start live stream.' };
    }
}

export async function stopLiveStream(egressId: string) {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'staff') {
        return { error: 'Unauthorized' };
    }

    try {
        const { url, apiKey, apiSecret } = await getLiveKitCredentials();
        const egressClient = new EgressClient(url, apiKey, apiSecret);

        await egressClient.stopEgress(egressId);
        return { success: true };
    } catch (error: any) {
        return { error: error.message || 'Failed to stop live stream.' };
    }
}
