import { db } from "@/db/db";
import { users, students, parents, parentStudentMappings } from "@/db/schema";
import { eq } from "drizzle-orm";

export class AcademicNotificationService {

    /**
     * Sends a result notification via Email.
     */
    static async sendResultEmail(studentId: number, resultData: any) {
        // 1. Fetch student and linked parents
        const studentInfo = await db.select({
            name: users.name,
            email: users.email
        })
        .from(users)
        .innerJoin(students, eq(users.id, students.userId))
        .where(eq(students.id, studentId))
        .limit(1);

        const parentInfo = await db.select({
            name: users.name,
            email: users.email
        })
        .from(users)
        .innerJoin(parentStudentMappings, eq(users.id, parentStudentMappings.parentId))
        .where(eq(parentStudentMappings.studentId, studentId));

        const recipients = [...studentInfo, ...parentInfo];

        console.log(`[Notification] Sending Result Email to ${recipients.length} recipients for Student ID: ${studentId}`);
        // Integration with NodeMailer or SendGrid would go here
        return { success: true };
    }

    /**
     * Sends a result notification via WhatsApp.
     */
    static async sendResultWhatsApp(studentId: number, message: string) {
        // Fetch phone numbers for parents/students
        const phoneData = await db.select({
            phone: users.phone,
            name: users.name
        })
        .from(users)
        .innerJoin(students, eq(users.id, students.userId))
        .where(eq(students.id, studentId))
        .limit(1);

        console.log(`[Notification] Dispatching WhatsApp Result to ${phoneData[0]?.phone} (${phoneData[0]?.name})`);
        // Integration with Twilio WhatsApp API or similar would go here
        return { success: true };
    }
}
