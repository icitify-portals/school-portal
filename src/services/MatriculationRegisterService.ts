import { db } from "@/db/db";
import { 
    matriculationRegister, 
    students, 
    users, 
    academicSessions 
} from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export class MatriculationRegisterService {

    /**
     * Records a student's official matriculation signature,
     * enforcing institutional deadlines.
     */
    static async signRegister(data: {
        studentId: number,
        sessionId: number,
        signature: string,
        ipAddress?: string,
        userAgent?: string
    }) {
        // 1. Fetch Session for Deadline Verification
        const session = await db.select()
            .from(academicSessions)
            .where(eq(academicSessions.id, data.sessionId))
            .limit(1);
        
        if (!session[0]) throw new Error("Academic session not found.");

        const deadline = session[0].matriculationDeadline;
        if (deadline && new Date() > new Date(deadline)) {
            throw new Error(`The matriculation register for ${session[0].name} has closed. Deadline was ${new Date(deadline).toLocaleDateString()}.`);
        }

        // 2. Check if already signed — allow updating signature if already signed
        const existing = await db.select()
            .from(matriculationRegister)
            .where(and(
                eq(matriculationRegister.studentId, data.studentId),
                eq(matriculationRegister.sessionId, data.sessionId)
            ))
            .limit(1);

        let result;
        if (existing[0]) {
            result = await db.update(matriculationRegister)
                .set({
                    oathSignature: data.signature,
                    signedAt: new Date(),
                    ipAddress: data.ipAddress,
                    userAgent: data.userAgent,
                })
                .where(eq(matriculationRegister.id, existing[0].id));
        } else {
            // 3. Insert into register
            result = await db.insert(matriculationRegister).values({
                studentId: data.studentId,
                sessionId: data.sessionId,
                oathSignature: data.signature,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent
            });
        }

        // 4. Update student record oathSignedAt
        await db.update(students)
            .set({ oathSignedAt: new Date() })
            .where(eq(students.id, data.studentId));

        return result;
    }

    /**
     * Retrieves the official matriculation ledger for a session.
     */
    static async getSessionLedger(sessionId: number) {
        return await db.select({
            id: matriculationRegister.id,
            studentId: matriculationRegister.studentId,
            studentName: users.name,
            matricNumber: students.matricNumber,
            signature: matriculationRegister.oathSignature,
            signedAt: matriculationRegister.signedAt,
            ip: matriculationRegister.ipAddress
        })
        .from(matriculationRegister)
        .innerJoin(students, eq(matriculationRegister.studentId, students.id))
        .innerJoin(users, eq(students.userId, users.id))
        .where(eq(matriculationRegister.sessionId, sessionId))
        .orderBy(desc(matriculationRegister.signedAt));
    }

    /**
     * Checks if a student has signed and provides deadline context.
     */
    static async checkStatus(studentId: number, sessionId: number) {
        return await this.getStatusWithDeadline(studentId, sessionId);
    }

    /**
     * Checks if a student has signed and provides deadline context.
     */
    static async getStatusWithDeadline(studentId: number, sessionId: number) {
        const session = await db.select()
            .from(academicSessions)
            .where(eq(academicSessions.id, sessionId))
            .limit(1);

        const record = await db.select()
            .from(matriculationRegister)
            .where(and(
                eq(matriculationRegister.studentId, studentId),
                eq(matriculationRegister.sessionId, sessionId)
            ))
            .limit(1);
        
        return {
            signed: !!record[0],
            record: record[0] ? {
                id: record[0].id,
                signedAt: record[0].signedAt,
                signature: record[0].oathSignature,
                ip: record[0].ipAddress
            } : null,
            deadline: session[0]?.matriculationDeadline,
            isExpired: session[0]?.matriculationDeadline ? new Date() > new Date(session[0].matriculationDeadline) : false
        };
    }
}
