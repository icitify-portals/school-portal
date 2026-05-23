import { db } from "@/db/db";
import { attendance } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export class AttendanceService {

    /**
     * Clocks a user in or out within a specific context.
     * Matches 'attendance.clock(context, operator_id)' from Rust.
     */
    static async clock(userId: number, context: string, operatorId: number) {
        // Fetch last record to determine if this is an 'in' or 'out' event
        const [lastRecord] = await db.select()
            .from(attendance)
            .where(and(
                eq(attendance.userId, userId),
                eq(attendance.context, context)
            ))
            .orderBy(desc(attendance.timestamp))
            .limit(1);

        const nextType = (lastRecord?.type === 'in') ? 'out' : 'in';

        const [result] = await db.insert(attendance).values({
            userId: userId,
            type: nextType,
            context: context,
            category: 'student', // Default for Entrance Exams
            location: 'gate',
            loggedBy: operatorId,
            timestamp: new Date()
        });

        return {
            success: true,
            type: nextType,
            attendanceId: (result as any).insertId
        };
    }
}
