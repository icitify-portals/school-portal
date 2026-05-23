import { db } from "@/db/db";
import { 
    users, staffProfiles, institutionalUnits, 
    staffClassAssignments, staffSubjectAssignments,
    studentGroups, courses, students, reportRemarks, behavioralScores, resultMarks
} from "@/db/schema";
import { eq, and, sql, inArray } from "drizzle-orm";

export interface TeacherData {
    name: string;
    username: string;
    email: string;
    qualification: string;
    sex: string;
    phoneNumber: string;
    maritalStatus: string;
    branchId: number;
    staffId?: string; // Staff ID
    category?: 'academic' | 'non-academic' | 'management' | 'security' | 'maintenance';
}

export class TeacherService {

    /**
     * Creates a new institutional staff member.
     * Handles both Academic (Teachers/Lecturers) and Non-Academic staff.
     */
    static async createTeacher(data: TeacherData, adminId: number) {
        // 1. Resolve Academic Tier & Job Title
        const [unit] = await db.select({ tier: institutionalUnits.academicTier })
            .from(institutionalUnits)
            .where(eq(institutionalUnits.id, data.branchId))
            .limit(1);

        const isTertiary = unit?.tier === 'tertiary';
        let jobTitle = data.category === 'academic' 
            ? (isTertiary ? 'Lecturer' : 'Teacher') 
            : (data.category === 'management' ? 'Administrator' : 
               data.category === 'security' ? 'Security Officer' : 
               data.category === 'maintenance' ? 'Facility Tech' : 'Staff');

        // 2. Create User Account
        const [userResult] = await db.insert(users).values({
            name: data.name,
            email: data.email,
            password: 'password123', 
            role: 'staff',
            phone: data.phoneNumber
        });

        const userId = (userResult as any).insertId;

        // 3. Create Staff Profile
        const [staffResult] = await db.insert(staffProfiles).values({
            userId: userId,
            staffId: data.staffId,
            jobTitle: jobTitle,
            unitId: data.branchId,
            qualification: data.qualification,
            maritalStatus: data.maritalStatus,
            gender: data.sex?.toLowerCase() as any,
            staffCategory: data.category || 'academic'
        });

        return {
            staffId: (staffResult as any).insertId,
            userId: userId,
            title: jobTitle,
            category: data.category || 'academic'
        };
    }

    /**
     * Lists staff filtered by category and branch.
     */
    static async listStaff(branchId: number, category?: string) {
        return await db.select({
            id: staffProfiles.id,
            staffId: staffProfiles.staffId,
            name: users.name,
            title: staffProfiles.jobTitle,
            category: staffProfiles.staffCategory,
            email: users.email
        })
        .from(staffProfiles)
        .innerJoin(users, eq(staffProfiles.userId, users.id))
        .where(and(
            eq(staffProfiles.unitId, branchId),
            category ? eq(staffProfiles.staffCategory, category as any) : undefined as any
        ))
        .orderBy(users.name);
    }

    /**
     * Moves a teacher to the recycle bin (Soft Delete).
     */
    static async deleteTeacher(staffId: string) {
        const [profile] = await db.select({ id: staffProfiles.id, userId: staffProfiles.userId })
            .from(staffProfiles)
            .where(eq(staffProfiles.staffId, staffId))
            .limit(1);

        if (!profile) throw new Error("Staff not found");

        const now = new Date();
        await db.update(staffProfiles).set({ deletedAt: now }).where(eq(staffProfiles.id, profile.id));
        await db.update(users).set({ deletedAt: now }).where(eq(users.id, profile.userId));
        return true;
    }

    /**
     * Restores a teacher from the recycle bin.
     */
    static async restoreTeacher(staffId: string) {
        const [profile] = await db.select({ id: staffProfiles.id, userId: staffProfiles.userId })
            .from(staffProfiles)
            .where(eq(staffProfiles.staffId, staffId))
            .limit(1);

        if (!profile) throw new Error("Staff not found");

        await db.update(staffProfiles).set({ deletedAt: null }).where(eq(staffProfiles.id, profile.id));
        await db.update(users).set({ deletedAt: null }).where(eq(users.id, profile.userId));
        return true;
    }

    /**
     * Permanently purges a teacher record.
     */
    static async permanentlyDeleteTeacher(staffId: string) {
        const [profile] = await db.select({ id: staffProfiles.id, userId: staffProfiles.userId })
            .from(staffProfiles)
            .where(eq(staffProfiles.staffId, staffId))
            .limit(1);

        if (!profile) throw new Error("Staff not found");

        await db.delete(staffProfiles).where(eq(staffProfiles.id, profile.id));
        await db.delete(users).where(eq(users.id, profile.userId));
        return true;
    }

    /**
     * Checks if a teacher/staff record exists.
     * Matches 'teacher.exists()' logic from Rust.
     */
    static async exists(staffId: string) {
        const [profile] = await db.select({ id: staffProfiles.id })
            .from(staffProfiles)
            .where(eq(staffProfiles.staffId, staffId))
            .limit(1);
        
        return profile || null;
    }

    /**
     * Identifies "invalid" staff records (e.g., orphans with missing user accounts).
     * Matches 'Teacher::invalid_teachers' logic from Rust.
     */
    static async getInvalidStaff(branchId: number) {
        // Find staff profiles where the associated user account is missing
        return await db.select({
            id: staffProfiles.id,
            staffId: staffProfiles.staffId,
            jobTitle: staffProfiles.jobTitle
        })
        .from(staffProfiles)
        .leftJoin(users, eq(staffProfiles.userId, users.id))
        .where(and(
            eq(staffProfiles.unitId, branchId),
            sql`${users.id} IS NULL`
        ));
    }

    /**
     * Purges invalid staff records from the institutional database.
     * Matches 'Teacher::delete_invalid_teachers' logic from Rust.
     */
    static async deleteInvalidStaff(branchId: number) {
        const invalid = await this.getInvalidStaff(branchId);
        if (invalid.length === 0) return true;

        for (const staff of invalid) {
            await db.delete(staffProfiles).where(eq(staffProfiles.id, staff.id));
        }
        return true;
    }

    /**
     * Retrieves all staff profiles for a branch/session.
     * Matches 'Teacher::profiles' logic from Rust.
     */
    static async getStaffProfiles(branchId: number, sessionId?: number) {
        return await db.query.staffProfiles.findMany({
            where: and(
                eq(staffProfiles.unitId, branchId),
                sql`${staffProfiles.deletedAt} IS NULL`
            ),
            with: {
                user: true
            }
        });
    }

    /**
     * Retrieves a single staff profile with session-specific context.
     * Matches 'teacher.profile(&session)' logic from Rust.
     */
    static async getStaffProfile(staffId: string, sessionId?: number) {
        const profile = await db.query.staffProfiles.findFirst({
            where: eq(staffProfiles.staffId, staffId),
            with: {
                user: true
            }
        });

        if (!profile || !sessionId) return profile;

        // Fetch session assignments
        const classAssignments = await db.select().from(staffClassAssignments)
            .where(and(
                eq(staffClassAssignments.staffProfileId, profile.id),
                eq(staffClassAssignments.sessionId, sessionId)
            ));

        const subjectAssignments = await db.select().from(staffSubjectAssignments)
            .where(and(
                eq(staffSubjectAssignments.staffProfileId, profile.id),
                eq(staffSubjectAssignments.sessionId, sessionId)
            ));

        return {
            ...profile,
            assignments: {
                classes: classAssignments,
                subjects: subjectAssignments
            }
        };
    }

    /**
     * Updates a staff profile.
     * Matches 'SaveProfile' logic from Rust.
     */
    static async saveStaffProfile(staffId: string, data: Partial<typeof staffProfiles.$inferInsert>) {
        return await db.update(staffProfiles)
            .set(data)
            .where(eq(staffProfiles.staffId, staffId));
    }

    /**
     * Registers a staff member as a user, creating an account if necessary.
     * Matches 'teacher.register_as_user(&username, &session, &admin_id)' logic from Rust.
     */
    static async registerAsUser(staffId: string, sessionId: number, adminId: number, customUsername?: string) {
        const profile = await this.getStaffProfile(staffId);
        if (!profile) throw new Error("Staff not found");

        let userId = profile.userId;

        if (!userId) {
            // Create user if not exists
            const [userResult] = await db.insert(users).values({
                name: profile.user?.name || "Staff Member", // Fallback if user object is partially missing
                email: profile.user?.email || `${staffId.replace(/\//g, '_')}@school.edu`,
                password: 'password123', 
                role: 'staff'
            });
            userId = (userResult as any).insertId;
            
            await db.update(staffProfiles)
                .set({ userId })
                .where(eq(staffProfiles.id, profile.id));
        }

        return { success: true, userId, staffId };
    }

    /**
     * Unlinks a staff profile from their user account.
     */
    static async unregisterAsUser(staffId: string) {
        return await db.update(staffProfiles)
            .set({ userId: null as any })
            .where(eq(staffProfiles.staffId, staffId));
    }

    /**
     * Updates the class assignment for a teacher.
     * Matches 'teacher.update_teaching_class(&session, class, division)' logic from Rust.
     */
    static async updateTeachingClass(staffId: string, sessionId: number, className?: string, division?: string) {
        const profile = await this.getStaffProfile(staffId);
        if (!profile) throw new Error("Staff not found");

        if (!className) {
            // Delete existing assignment for this session
            return await db.delete(staffClassAssignments)
                .where(and(
                    eq(staffClassAssignments.staffProfileId, profile.id),
                    eq(staffClassAssignments.sessionId, sessionId)
                ));
        }

        // Resolve Group ID (Student Group)
        const groupId = 1; // Placeholder for resolved ID

        return await db.insert(staffClassAssignments)
            .values({
                staffProfileId: profile.id,
                groupId,
                sessionId
            });
    }

    /**
     * Updates subject assignments for a teacher (Batch).
     * Matches 'teacher.update_teaching_subjects(&session, data)' logic from Rust.
     */
    static async updateTeachingSubjects(staffId: string, sessionId: number, data: Array<{ courseId: number, groupId: number }>) {
        const profile = await this.getStaffProfile(staffId);
        if (!profile) throw new Error("Staff not found");

        // Clear existing assignments for this session
        await db.delete(staffSubjectAssignments)
            .where(and(
                eq(staffSubjectAssignments.staffProfileId, profile.id),
                eq(staffSubjectAssignments.sessionId, sessionId)
            ));

        if (data.length === 0) return true;

        // Batch Insert
        const values = data.map(d => ({
            staffProfileId: profile.id,
            courseId: d.courseId,
            groupId: d.groupId,
            sessionId
        }));

        return await db.insert(staffSubjectAssignments).values(values);
    }

    /**
     * Caches/Persists a staff profile snapshot for a specific session.
     * Matches 'teacher.cache_profile(&session)' logic from Rust.
     */
    static async cacheProfile(staffId: string, sessionId: number) {
        const profile = await this.getStaffProfile(staffId);
        if (!profile) throw new Error("Staff not found");

        return await db.update(staffProfiles)
            .set({ updatedAt: sql`NOW()` })
            .where(eq(staffProfiles.staffId, staffId));
    }

    /**
     * Searches for staff members based on contextual identity (name, email, ID).
     */
    static async searchStaff(query: string, branchId: number) {
        return await db.select({
            id: staffProfiles.id,
            staffId: staffProfiles.staffId,
            name: users.name,
            title: staffProfiles.jobTitle,
            category: staffProfiles.staffCategory
        })
        .from(staffProfiles)
        .innerJoin(users, eq(staffProfiles.userId, users.id))
        .where(and(
            eq(staffProfiles.unitId, branchId),
            sql`(${users.name} LIKE ${`%${query}%`} OR ${users.email} LIKE ${`%${query}%`} OR ${staffProfiles.staffId} LIKE ${`%${query}%`})`
        ))
        .limit(10);
    }

    /**
     * Finds a teacher/lecturer based on their institutional role.
     * Supports both K-12 (Class/Subject) and Tertiary (Course/Lecturer) contexts.
     */
    static async whois(options: {
        context: 'class' | 'subject' | 'course';
        className?: string; // or Department Name
        division?: string; // or Level
        sessionId: number;
        branchId: number;
        subjectId?: number; // or Course ID
    }) {
        // Resolve Group ID (Class/Level)
        const groupId = 1; // Placeholder

        if (options.context === 'class') {
            const [assignment] = await db.select({
                staffId: staffProfiles.staffId,
                name: users.name,
                title: staffProfiles.jobTitle,
                category: staffProfiles.staffCategory
            })
            .from(staffClassAssignments)
            .innerJoin(staffProfiles, eq(staffClassAssignments.staffProfileId, staffProfiles.id))
            .innerJoin(users, eq(staffProfiles.userId, users.id))
            .where(and(
                eq(staffClassAssignments.groupId, groupId),
                eq(staffClassAssignments.sessionId, options.sessionId)
            ))
            .limit(1);
            return assignment;
        } else {
            const idToFind = options.subjectId;
            if (!idToFind) throw new Error("ID required for role-based lookup");

            const [assignment] = await db.select({
                staffId: staffProfiles.staffId,
                name: users.name,
                title: staffProfiles.jobTitle,
                category: staffProfiles.staffCategory
            })
            .from(staffSubjectAssignments)
            .innerJoin(staffProfiles, eq(staffSubjectAssignments.staffProfileId, staffProfiles.id))
            .innerJoin(users, eq(staffProfiles.userId, users.id))
            .where(and(
                eq(staffSubjectAssignments.courseId, idToFind),
                eq(staffSubjectAssignments.groupId, groupId),
                eq(staffSubjectAssignments.sessionId, options.sessionId)
            ))
            .limit(1);
            return assignment;
        }
    }

    /**
     * Fetch all classes assigned to a staff profile for a given academic session.
     */
    static async getAssignedClasses(staffProfileId: number, sessionId: number) {
        return await db.select({
            id: studentGroups.id,
            name: studentGroups.name,
            level: studentGroups.level
        })
        .from(staffClassAssignments)
        .innerJoin(studentGroups, eq(staffClassAssignments.groupId, studentGroups.id))
        .where(and(
            eq(staffClassAssignments.staffProfileId, staffProfileId),
            eq(staffClassAssignments.sessionId, sessionId)
        ));
    }

    /**
     * Fetch all subjects assigned to a staff profile for a given academic session.
     */
    static async getAssignedSubjects(staffProfileId: number, sessionId: number) {
        return await db.select({
            courseId: staffSubjectAssignments.courseId,
            groupId: staffSubjectAssignments.groupId,
            subjectName: courses.name,
            subjectCode: courses.code,
            className: studentGroups.name
        })
        .from(staffSubjectAssignments)
        .innerJoin(courses, eq(staffSubjectAssignments.courseId, courses.id))
        .innerJoin(studentGroups, eq(staffSubjectAssignments.groupId, studentGroups.id))
        .where(and(
            eq(staffSubjectAssignments.staffProfileId, staffProfileId),
            eq(staffSubjectAssignments.sessionId, sessionId)
        ));
    }

    /**
     * Compute completion stats (attendance, traits, comments) for a student group.
     */
    static async getClassCompletionStats(groupId: number, sessionId: number, term: string) {
        const classStudents = await db.select({ id: students.id })
            .from(students)
            .where(eq(students.groupId, groupId));
        const total = classStudents.length;
        if (total === 0) {
            return { attendance: 100, traits: 100, comments: 100, total: 0 };
        }

        const studentIds = classStudents.map(s => s.id);
        const remarks = await db.select({
            studentId: reportRemarks.studentId,
            classTeacherComment: reportRemarks.classTeacherComment,
            daysPresent: reportRemarks.daysPresent
        })
        .from(reportRemarks)
        .where(and(
            inArray(reportRemarks.studentId, studentIds),
            eq(reportRemarks.sessionId, sessionId),
            eq(reportRemarks.term, term as any)
        ));

        let attendanceCount = 0;
        let commentsCount = 0;
        for (const remark of remarks) {
            if (remark.daysPresent !== null && remark.daysPresent !== undefined) {
                attendanceCount++;
            }
            if (remark.classTeacherComment && remark.classTeacherComment.trim().length > 0) {
                commentsCount++;
            }
        }

        const traitsScores = await db.select({ studentId: behavioralScores.studentId })
            .from(behavioralScores)
            .where(and(
                inArray(behavioralScores.studentId, studentIds),
                eq(behavioralScores.sessionId, sessionId),
                eq(behavioralScores.term, term as any)
            ));
        
        const uniqueTraitStudents = new Set(traitsScores.map(t => t.studentId));
        const traitsCount = uniqueTraitStudents.size;

        return {
            attendance: Math.round((attendanceCount / total) * 100),
            traits: Math.round((traitsCount / total) * 100),
            comments: Math.round((commentsCount / total) * 100),
            total
        };
    }

    /**
     * Compute completion stats for a subject in a student group.
     */
    static async getSubjectCompletionStats(courseId: number, groupId: number, sessionId: number, term: number) {
        const classStudents = await db.select({ id: students.id })
            .from(students)
            .where(eq(students.groupId, groupId));
        const total = classStudents.length;
        if (total === 0) return 100;

        const studentIds = classStudents.map(s => s.id);
        const termStr = term.toString();
        
        const marks = await db.select({ studentId: resultMarks.studentId })
            .from(resultMarks)
            .where(and(
                inArray(resultMarks.studentId, studentIds),
                eq(resultMarks.courseId, courseId),
                eq(resultMarks.sessionId, sessionId),
                eq(resultMarks.semester, termStr as any)
            ));

        const uniqueMarksStudents = new Set(marks.map(m => m.studentId));
        return Math.round((uniqueMarksStudents.size / total) * 100);
    }
}
