import { db } from "@/db/db";
import { 
    gradingConfigurations, courseComponents, courses, 
    institutionalUnits, academicSessions 
} from "@/db/schema";
import { eq, and } from "drizzle-orm";

export class ResultParamService {
    
    /**
     * Retrieves the academic result parameters for a specific class context.
     * Matches the 'ResultParam' logic from the Rust engine.
     */
    static async getResultParams(classCode: string, sessionId: number, context: string) {
        // 1. Resolve the Unit/Class
        const [unit] = await db.select().from(institutionalUnits).where(eq(institutionalUnits.code, classCode)).limit(1);
        if (!unit) throw new Error(`Institutional unit ${classCode} not found`);

        // 2. Fetch all grading configurations for this unit/session
        // Note: In our schema, configurations are often tied to courses.
        // We'll pull the standard configurations associated with this unit's level.
        const configs = await db.select({
            id: gradingConfigurations.id,
            name: gradingConfigurations.name,
            type: gradingConfigurations.type,
            maxMarks: gradingConfigurations.maxMarks,
            weight: gradingConfigurations.weight,
            order: gradingConfigurations.order
        })
        .from(gradingConfigurations)
        .where(eq(gradingConfigurations.sessionId, sessionId));

        // 3. Format into 'nodes' structure as expected by the Rust logic
        const params: Record<string, any> = {
            nodes: {},
            total_obtainable: 0
        };

        let total = 0;
        configs.forEach(config => {
            params.nodes[config.id] = {
                id: config.id,
                name: config.name,
                type: config.type,
                mark_obtainable: config.maxMarks,
                weight: config.weight
            };
            total += config.maxMarks;
        });

        params.total_obtainable = total;

        return params;
    }
}
