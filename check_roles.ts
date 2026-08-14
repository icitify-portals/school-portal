import { db } from './src/db';
import { users, students } from './src/db/schema';
import { eq, and, not, sql, like } from 'drizzle-orm';

async function checkRoleMismatch() {
    try {
        // Find users who have a role other than 'student' but are in the students table
        const result = await db
            .select({
                userId: users.id,
                username: users.username,
                role: users.role,
                firstName: users.firstName,
                lastName: users.lastName
            })
            .from(users)
            .innerJoin(students, eq(users.id, students.userId))
            .where(not(eq(users.role, 'student')));

        console.log(`Found ${result.length} users with non-student roles but in students table.`);
        console.log(result.slice(0, 10)); // print first 10
        
        // Let's also check users where role is not student, but their username looks like a matric number e.g. FSS/
        const result2 = await db
            .select({
                userId: users.id,
                username: users.username,
                role: users.role,
            })
            .from(users)
            .where(
                and(
                    not(eq(users.role, 'student')),
                    like(users.username, '%/%') // e.g. FSS/2026/001
                )
            );
        console.log(`Found ${result2.length} users with non-student roles but username has slash`);
        console.log(result2.slice(0, 10));
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

checkRoleMismatch();
