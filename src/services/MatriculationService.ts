import { db } from "@/db/db";
import { 
    admissionApplicationsV2, 
    students, 
    users, 
    departments, 
    academicSessions,
    institutionalUnits 
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export class MatriculationService {

    /**
     * Generates a unique identifier based on the academic tier.
     * Tertiary: [YEAR]/[DEPT]/[SEQ] (Matriculation Number)
     * K-12: [UNIT_CODE]/[YEAR]/[SEQ] (Admission/Registration Number)
     */
    static async generateAcademicNumber(sessionId: number, unitId: number, deptId?: number) {
        // 1. Fetch Session and Unit Info
        const session = await db.select().from(academicSessions).where(eq(academicSessions.id, sessionId)).limit(1);
        const unit = await db.select().from(institutionalUnits).where(eq(institutionalUnits.id, unitId)).limit(1);
        
        const year = session[0]?.name.split('/')[0] || new Date().getFullYear().toString();
        const tier = unit[0]?.academicTier || 'tertiary';
        const unitCode = unit[0]?.code || "SCH";

        // 2. Count existing students in this unit for this session
        const countRes = await db.select({ count: sql<number>`count(*)` })
            .from(students)
            .where(and(
                eq(students.unitId, unitId),
                sql`YEAR(created_at) = ${year}`
            ));
        
        const sequence = (countRes[0]?.count || 0) + 1;
        const formattedSeq = sequence.toString().padStart(4, '0');

        if (tier === 'tertiary') {
            const dept = deptId ? await db.select().from(departments).where(eq(departments.id, deptId)).limit(1) : null;
            const deptCode = dept?.[0]?.code || "GEN";
            return {
                number: `${year}/${deptCode}/${formattedSeq}`,
                label: 'Matriculation Number'
            };
        } else {
            // K-12 Model: Admission Number
            return {
                number: `${unitCode}/${year}/${formattedSeq}`,
                label: 'Admission Number'
            };
        }
    }

    /**
     * Converts an admitted candidate into a full student.
     */
    static async matriculateCandidate(applicationId: number, sessionId: number, unitId: number, deptId?: number) {
        return await db.transaction(async (tx) => {
            // 1. Fetch Application Data
            const application = await tx.select().from(admissionApplicationsV2)
                .where(eq(admissionApplicationsV2.id, applicationId))
                .limit(1);
            
            if (!application[0]) throw new Error("Application not found.");
            
            const formData = JSON.parse(application[0].formData || '{}');

            // 2. Generate Number based on Tier
            const { number, label } = await this.generateAcademicNumber(sessionId, unitId, deptId);

            // 3. Create/Link User
            let userId = application[0].studentId ? (await tx.select().from(students).where(eq(students.id, application[0].studentId!)).limit(1))[0].userId : null;
            
            if (!userId) {
                const [newUser] = await tx.insert(users).values({
                    name: `${formData.firstName} ${formData.lastName}`,
                    email: formData.email,
                    phone: formData.phone,
                    role: 'student'
                });
                userId = (newUser as any).insertId;
            }

            // 4. Create Student Profile
            const [newStudent] = await tx.insert(students).values({
                userId: userId!,
                matricNumber: number, // Stores the generated ID
                unitId: unitId,
                deptId: deptId || null,
                sessionId: sessionId,
                levelId: 1, 
                status: 'enrolled'
            });

            // 5. Finalize Application
            await tx.update(admissionApplicationsV2)
                .set({ 
                    status: 'admitted', 
                    studentId: (newStudent as any).insertId 
                })
                .where(eq(admissionApplicationsV2.id, applicationId));

            return { success: true, academicNumber: number, label };
        });
    }
}
