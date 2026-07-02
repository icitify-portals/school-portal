import { db } from './src/db';
import { feeAllocations, academicSessions } from './src/db/schema';
import { eq, isNull } from 'drizzle-orm';

(async () => {
    try {
        const [session] = await db.select().from(academicSessions).where(eq(academicSessions.name, '2025/2026')).limit(1);
        if (session) {
            await db.update(feeAllocations).set({ sessionId: session.id }).where(isNull(feeAllocations.sessionId));
            console.log('Fixed missing sessionIds!');
        } else {
            console.log('Session not found!');
        }
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
})();
