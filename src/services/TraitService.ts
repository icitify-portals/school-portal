import { db } from "@/db/db";
import { 
    observableTraits, observableTraitGroups, observableTraitRatings, 
    observableTraitAliases, students, users 
} from "@/db/schema";
import { eq, and, or, isNull, sql } from "drizzle-orm";

export class TraitService {
    
    /**
     * Fetches all trait ratings for a student in a specific session/term.
     * Includes aliases if defined for the student's class/branch.
     */
    static async getStudentRatings(studentId: number, sessionId: number, term: number, branchId?: number) {
        // 1. Get student's current level
        const [student] = await db.select({ level: students.currentLevel }).from(students).where(eq(students.id, studentId)).limit(1);
        const classId = student?.level;

        // 2. Fetch traits within groups relevant to this unit/class
        const allTraits = await db.select({
            id: observableTraits.id,
            name: observableTraits.name,
            groupId: observableTraits.groupId,
            groupName: observableTraitGroups.name
        })
        .from(observableTraits)
        .innerJoin(observableTraitGroups, eq(observableTraits.groupId, observableTraitGroups.id))
        .where(or(
            isNull(observableTraitGroups.unitId), // Global traits
            // Logic to match student's institutional unit (assuming we can derive it from level/class)
            // For now, pulling all if unitId is null or matches branch
            branchId ? eq(observableTraitGroups.unitId, branchId) : undefined 
        ));

        // 3. Fetch Aliases for this class/branch
        const aliases = await db.select().from(observableTraitAliases)
            .where(or(
                classId ? eq(observableTraitAliases.classId, classId) : undefined,
                branchId ? eq(observableTraitAliases.branchId, branchId) : undefined
            ));

        // 4. Fetch actual ratings
        const ratings = await db.select().from(observableTraitRatings)
            .where(and(
                eq(observableTraitRatings.studentId, studentId),
                eq(observableTraitRatings.sessionId, sessionId),
                eq(observableTraitRatings.term, term)
            ));

        // 5. Map everything together
        return allTraits.map(trait => {
            const alias = aliases.find(a => a.traitId === trait.id);
            const rating = ratings.find(r => r.traitId === trait.id);
            
            return {
                traitId: trait.id,
                name: alias ? alias.alias : trait.name,
                originalName: trait.name,
                group: trait.groupName,
                rating: rating ? rating.rating : null,
                updatedAt: rating ? rating.updatedAt : null
            };
        });
    }

    /**
     * Fetches all trait ratings for all students in a specific class/level.
     */
    static async getClassRatings(level: number, sessionId: number, term: number, branchId?: number) {
        // 1. Get all students in this class
        const classStudents = await db.select({ id: students.id, name: users.name })
            .from(students)
            .innerJoin(users, eq(students.userId, users.id))
            .where(eq(students.currentLevel, level));

        if (classStudents.length === 0) return [];

        // 2. Fetch all ratings for these students in this session/term
        const allRatings = await db.select().from(observableTraitRatings)
            .where(and(
                eq(observableTraitRatings.sessionId, sessionId),
                eq(observableTraitRatings.term, term),
                sql`${observableTraitRatings.studentId} IN (${sql.join(classStudents.map(s => sql`${s.id}`), sql`, `)})`
            ));

        // 3. Map ratings by student
        return classStudents.map(student => ({
            studentId: student.id,
            studentName: student.name,
            ratings: allRatings.filter(r => r.studentId === student.id)
        }));
    }

    /**
     * Fetches all trait definitions (with aliases) for a specific class/level.
     */
    static async getClassTraits(level: number, branchId?: number) {
        // 1. Fetch all traits with their groups
        const allTraits = await db.select({
            id: observableTraits.id,
            name: observableTraits.name,
            groupId: observableTraits.groupId,
            groupName: observableTraitGroups.name,
            groupUnitId: observableTraitGroups.unitId
        })
        .from(observableTraits)
        .innerJoin(observableTraitGroups, eq(observableTraits.groupId, observableTraitGroups.id))
        .where(or(
            isNull(observableTraitGroups.unitId),
            branchId ? eq(observableTraitGroups.unitId, branchId) : undefined
        ));

        // 2. Fetch Aliases for this class/branch
        const aliases = await db.select().from(observableTraitAliases)
            .where(or(
                eq(observableTraitAliases.classId, level),
                branchId ? eq(observableTraitAliases.branchId, branchId) : undefined
            ));

        return allTraits.map(trait => {
            const alias = aliases.find(a => a.traitId === trait.id);
            return {
                id: trait.id,
                name: alias ? alias.alias : trait.name,
                originalName: trait.name,
                group: trait.groupName
            };
        });
    }

    /**
     * Batch saves trait ratings for a student.
     */
    static async saveRatings(
        studentId: number, 
        sessionId: number, 
        term: number, 
        ratings: { traitId: number, rating: number }[],
        ratedBy: number
    ) {
        for (const item of ratings) {
            // Upsert logic
            const [existing] = await db.select().from(observableTraitRatings)
                .where(and(
                    eq(observableTraitRatings.studentId, studentId),
                    eq(observableTraitRatings.traitId, item.traitId),
                    eq(observableTraitRatings.sessionId, sessionId),
                    eq(observableTraitRatings.term, term)
                )).limit(1);

            if (existing) {
                await db.update(observableTraitRatings)
                    .set({ rating: item.rating, ratedBy, updatedAt: new Date() })
                    .where(eq(observableTraitRatings.id, existing.id));
            } else {
                await db.insert(observableTraitRatings).values({
                    studentId,
                    traitId: item.traitId,
                    sessionId,
                    term,
                    rating: item.rating,
                    ratedBy
                });
            }
        }
        return { success: true };
    }
}
