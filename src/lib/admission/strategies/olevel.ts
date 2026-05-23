
import { ScoringContext, ScoringStrategy } from "./types";

interface OLevelConfig {
    gradingSystem: Record<string, number>; // e.g. { "A1": 6, "B2": 5, ... }
    requiredSubjects: string[]; // e.g., ["Mathematics", "English"]
    sittingPolicy: "ONE_SITTING" | "TWO_SITTINGS";
    maxPoints: number; // e.g., 30 for 5 subjects * 6 points
}

const DEFAULT_GRADING: Record<string, number> = {
    "A1": 6, "B2": 5, "B3": 4, "C4": 3, "C5": 2, "C6": 1, "D7": 0, "E8": 0, "F9": 0
};

export class OLevelPointsStrategy implements ScoringStrategy {
    async calculateScore(context: ScoringContext): Promise<number> {
        const config = context.programme.scoringConfig
            ? (JSON.parse(context.programme.scoringConfig) as OLevelConfig)
            : {
                gradingSystem: DEFAULT_GRADING,
                requiredSubjects: ["Mathematics", "English"],
                sittingPolicy: "TWO_SITTINGS",
                maxPoints: 30
            };

        const grading = config.gradingSystem || DEFAULT_GRADING;
        let totalPoints = 0;

        // Flatten all subjects from all results (handle 2 sittings)
        const allSubjects: { subject: string; grade: string; points: number }[] = [];

        for (const result of context.oLevelResults) {
            if (!result.subjects) continue;
            const subjectsMap = JSON.parse(result.subjects as string) as Record<string, string>;

            if (!subjectsMap || typeof subjectsMap !== 'object') {
                console.warn("Invalid subjectsMap for candidate:", context.candidate.jambRegNo);
                return 0;
            }

            for (const [subject, grade] of Object.entries(subjectsMap)) {
                const points = grading[grade.toUpperCase()] || 0;
                allSubjects.push({ subject, grade, points });
            }
        }

        // Sort by points descending to get best grades if duplicates exist (e.g. Maths in both sittings)
        // Simplified logic: strict subject matching would be complex. 
        // Here we just take the top 5 distinct subjects or required subjects.

        // For now, simple summation of top 5 subjects
        allSubjects.sort((a, b) => b.points - a.points);

        const uniqueSubjects = new Map<string, number>();
        for (const item of allSubjects) {
            if (!uniqueSubjects.has(item.subject)) {
                uniqueSubjects.set(item.subject, item.points);
            }
        }

        // Take top 5
        let count = 0;
        for (const points of uniqueSubjects.values()) {
            if (count >= 5) break;
            totalPoints += points;
            count++;
        }

        return totalPoints;
    }

    async validateRequirements(context: ScoringContext): Promise<{
        eligible: boolean;
        reason?: string;
    }> {
        const config = context.programme.scoringConfig
            ? (JSON.parse(context.programme.scoringConfig) as OLevelConfig)
            : {
                gradingSystem: DEFAULT_GRADING,
                requiredSubjects: ["Mathematics", "English"],
                sittingPolicy: "TWO_SITTINGS",
                maxPoints: 30
            };

        // Check sittings
        if (config.sittingPolicy === "ONE_SITTING" && context.oLevelResults.length > 1) {
            return { eligible: false, reason: "Programme requires one sitting only." };
        }

        // Check required subjects
        // This requires robust subject name matching (e.g., "Maths" vs "Mathematics").
        // We'll trust the string match for now.

        const availableSubjects = new Set<string>();
        for (const result of context.oLevelResults) {
            if (!result.subjects) continue;
            const subjectsMap = JSON.parse(result.subjects as string);
            if (subjectsMap && typeof subjectsMap === 'object') {
                Object.keys(subjectsMap).forEach(s => availableSubjects.add(s));
            }
        }

        const missing = config.requiredSubjects.filter(req => !availableSubjects.has(req));

        if (missing.length > 0) {
            return { eligible: false, reason: `Missing required subjects: ${missing.join(", ")}` };
        }

        return { eligible: true };
    }
}
