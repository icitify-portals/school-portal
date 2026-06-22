import { db } from "@/db/db";
import { students, users } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";

export class StudentService {
    
    /**
     * Changes a student's admission (or matriculation) number.
     * Matches 'Student::change_admission_number' from Rust.
     */
    static async changeAdmissionNumber(oldNumber: string, newNumber: string) {
        // 1. Verify old number exists
        const [student] = await db.select({ id: students.id })
            .from(students)
            .where(eq(students.admissionNumber, oldNumber))
            .limit(1);

        if (!student) {
            throw new Error(`Student with admission number ${oldNumber} not found.`);
        }

        // 2. Check if new number is already taken
        const [existing] = await db.select({ id: students.id })
            .from(students)
            .where(eq(students.admissionNumber, newNumber))
            .limit(1);

        if (existing) {
            throw new Error(`The admission number ${newNumber} is already in use by another student.`);
        }

        // 3. Perform update
        return await db.update(students)
            .set({ admissionNumber: newNumber })
            .where(eq(students.id, student.id));
    }
    /**
     * Creates a new student record and associated user account.
     * Matches 'Student::create' from Rust.
     */
    static async createStudent(data: any, createdBy: number) {
        // 1. Create User Account
        const [userResult] = await db.insert(users).values({
            name: data.name,
            email: `${data.admissionNumber.replace(/\//g, '_')}@school.edu`, // Placeholder email
            password: 'password123', // Default password
            role: 'student'
        });

        const userId = (userResult as any).insertId;

        // 2. Create Student Profile
        const [studentResult] = await db.insert(students).values({
            userId: userId,
            admissionNumber: data.admissionNumber,
            matricNumber: data.matricNumber || data.admissionNumber, // Default to admission if matric not provided
            firstName: data.firstName,
            lastName: data.surname,
            otherNames: data.otherNames,
            gender: data.sex?.toLowerCase() as any,
            admissionYear: new Date().getFullYear(),
            unitId: data.unitId,
            deptId: data.deptId,
            programmeId: data.programmeId,
            currentLevel: data.level || 100 // Defaults to 100 for tertiary
        });

        return {
            studentId: (studentResult as any).insertId,
            userId: userId,
            admissionNumber: data.admissionNumber,
            matricNumber: data.matricNumber || data.admissionNumber
        };
    }

    /**
     * Changes a student's matriculation number (Tertiary).
     */
    static async changeMatricNumber(oldNumber: string, newNumber: string) {
        const [student] = await db.select({ id: students.id })
            .from(students)
            .where(eq(students.matricNumber, oldNumber))
            .limit(1);

        if (!student) throw new Error(`Student with matric number ${oldNumber} not found.`);

        return await db.update(students)
            .set({ matricNumber: newNumber })
            .where(eq(students.id, student.id));
    }

    /**
     * Moves a student to the recycle bin (Soft Delete).
     * Matches the 'Bin' requirement.
     */
    static async deleteStudent(admissionNumber: string) {
        const [student] = await db.select({ id: students.id, userId: students.userId })
            .from(students)
            .where(eq(students.admissionNumber, admissionNumber))
            .limit(1);

        if (!student) throw new Error(`Student ${admissionNumber} not found.`);

        const now = new Date();
        await db.update(students).set({ deletedAt: now }).where(eq(students.id, student.id));
        if (student.userId) {
            await db.update(users).set({ deletedAt: now }).where(eq(users.id, student.userId));
        }

        return true;
    }

    /**
     * Restores a student from the recycle bin.
     */
    static async restoreStudent(admissionNumber: string) {
        const [student] = await db.select({ id: students.id, userId: students.userId })
            .from(students)
            .where(eq(students.admissionNumber, admissionNumber))
            .limit(1);

        if (!student) throw new Error(`Student ${admissionNumber} not found.`);

        await db.update(students).set({ deletedAt: null }).where(eq(students.id, student.id));
        if (student.userId) {
            await db.update(users).set({ deletedAt: null }).where(eq(users.id, student.userId));
        }

        return true;
    }

    /**
     * Permanently deletes a student from the system.
     */
    static async permanentlyDeleteStudent(admissionNumber: string) {
        const [student] = await db.select({ id: students.id, userId: students.userId })
            .from(students)
            .where(eq(students.admissionNumber, admissionNumber))
            .limit(1);

        if (!student) throw new Error(`Student ${admissionNumber} not found.`);

        await db.delete(students).where(eq(students.id, student.id));
        if (student.userId) {
            await db.delete(users).where(eq(users.id, student.userId));
        }

        return true;
    }

    /**
     * Clears all deleted records in the recycle bin.
     */
    static async emptyRecycleBin() {
        await db.delete(students).where(sql`${students.deletedAt} IS NOT NULL`);
        await db.delete(users).where(sql`${users.deletedAt} IS NOT NULL`);
        return true;
    }

    /**
     * Exports students to a multi-sheet Excel workbook (one sheet per class).
     * Matches the 'Args' logic from Rust for Excel generation.
     */
    static async exportStudentsToExcel(branchId: number, sessionId: number) {
        // 1. Fetch all unique classes in the branch/session
        const classes = await db.select({ name: students.currentLevel }) // Using currentLevel as 'class'
            .from(students)
            .innerJoin(users, eq(students.userId, users.id))
            .where(and(
                eq(students.unitId, branchId),
                eq(students.admissionSessionId, sessionId)
            ))
            .groupBy(students.currentLevel);

        const XLSX = await import('xlsx');
        const workbook = XLSX.utils.book_new();

        for (const cls of classes) {
            const level = cls.name || 100;
            
            // 2. Fetch students for this class
            const studentData = await db.select({
                serialNumber: sql`ROW_NUMBER() OVER (ORDER BY ${users.name})`,
                admissionNumber: students.admissionNumber,
                surname: students.lastName,
                firstName: students.firstName,
                otherNames: students.otherNames,
                class: students.currentLevel,
                gender: students.gender,
                status: students.status,
                email: users.email,
                phone: users.phone
            })
            .from(students)
            .innerJoin(users, eq(students.userId, users.id))
            .where(and(
                eq(students.unitId, branchId),
                eq(students.admissionSessionId, sessionId),
                eq(students.currentLevel, level)
            ));

            // 3. Create Worksheet
            const worksheet = XLSX.utils.json_to_sheet(studentData);
            XLSX.utils.book_append_sheet(workbook, worksheet, `Level ${level}`);
        }

        // 4. Generate Buffer
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        return buffer;
    }

    /**
     * Retrieves a list of students filtered by session and status.
     * Matches 'school.list_of_students' from Rust.
     */
    static async listStudents(branchId: number, sessionId: number, status?: string) {
        return await db.select({
            id: students.id,
            admissionNumber: students.admissionNumber,
            name: users.name,
            gender: students.gender,
            level: students.currentLevel,
            status: students.status
        })
        .from(students)
        .innerJoin(users, eq(students.userId, users.id))
        .where(and(
            eq(students.unitId, branchId),
            eq(students.admissionSessionId, sessionId),
            status ? eq(students.status, status as any) : undefined as any
        ))
        .orderBy(users.name);
    }
    /**
     * Registers a student as a user, creating an account if necessary.
     * Matches 'student.register_as_user(&session, &admin_id)' logic from Rust.
     */
    static async registerAsUser(admissionNumber: string, sessionId: number, adminId: number) {
        const profile = await this.getProfile(admissionNumber);
        if (!profile) throw new Error("Student not found");

        let userId = profile.userId;

        if (!userId) {
            // Create user if not exists
            const [userResult] = await db.insert(users).values({
                name: `${profile.firstName} ${profile.lastName}`,
                email: `${admissionNumber.replace(/\//g, '_')}@school.edu`,
                password: 'password123', // Standard default
                role: 'student'
            });
            userId = (userResult as any).insertId;
            
            await db.update(students)
                .set({ userId })
                .where(eq(students.id, profile.id));
        }

        return { success: true, userId, admissionNumber };
    }

    /**
     * Unlinks a student profile from their user account.
     * Matches 'student.unregister_as_user(&session)' logic from Rust.
     */
    static async unregisterAsUser(admissionNumber: string, sessionId?: number) {
        return await db.update(students)
            .set({ userId: null })
            .where(eq(students.admissionNumber, admissionNumber));
    }

    /**
     * Checks if a student record exists.
     * Matches 'Exists' logic from Rust.
     */
    static async exists(admissionNumber: string) {
        const [student] = await db.select({ id: students.id })
            .from(students)
            .where(eq(students.admissionNumber, admissionNumber))
            .limit(1);
        
        return student || null;
    }

    /**
     * Retrieves a complete student profile, optionally scoped to a session.
     * Matches 'student.profile(&session)' logic from Rust.
     */
    static async getProfile(admissionNumber: string, sessionId?: number) {
        const profile = await db.query.students.findFirst({
            where: eq(students.admissionNumber, admissionNumber),
            with: {
                user: true
            }
        });

        if (!profile) return null;

        // Fetch session-specific level if available
        // In this schema, we might need a separate 'enrollments' table for historic levels
        // but for now we'll return the profile with current session context
        
        return {
            ...profile,
            sessionContext: sessionId ? { id: sessionId } : null
        };
    }

    /**
     * Saves/Updates a student profile.
     * Matches 'SaveProfile' logic from Rust.
     */
    static async saveProfile(admissionNumber: string, data: Partial<typeof students.$inferInsert>) {
        return await db.update(students)
            .set(data)
            .where(eq(students.admissionNumber, admissionNumber));
    }

    /**
     * Caches/Persists a student profile snapshot for a specific session.
     * Matches 'student.cache_profile(&session)' logic from Rust.
     */
    static async cacheProfile(admissionNumber: string, sessionId: number) {
        const profile = await this.getProfile(admissionNumber);
        if (!profile) throw new Error("Student not found");

        // Logic for caching: in a production app, this might involve Redis
        // or a snapshot table. For now, we'll update the 'updatedAt' timestamp
        // to signify a profile refresh.
        return await db.update(students)
            .set({ status: sql`${students.status}` })
            .where(eq(students.admissionNumber, admissionNumber));
    }

    /**
     * Retrieves students who are not assigned to any class/group.
     * Matches 'FloatingStudent' logic from Rust.
     */
    static async getFloatingStudents(branchId: number) {
        return await db.select({
            id: students.id,
            admissionNumber: students.admissionNumber,
            name: users.name,
            level: students.currentLevel
        })
        .from(students)
        .innerJoin(users, eq(students.userId, users.id))
        .where(and(
            eq(students.unitId, branchId),
            sql`${students.groupId} IS NULL`,
            sql`${students.deletedAt} IS NULL`
        ));
    }
}
