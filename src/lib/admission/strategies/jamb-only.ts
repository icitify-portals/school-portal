
import { ScoringContext, ScoringStrategy } from "./types";

export class JambOnlyStrategy implements ScoringStrategy {
    async calculateScore(context: ScoringContext): Promise<number> {
        // Only use the JAMB score
        // Typically JAMB is over 400. To standardize to 100% or just return raw?
        // Let's return raw for now, or scaled if config says so.
        // For now, return raw score.
        return context.candidate.score || 0;
    }

    async validateRequirements(context: ScoringContext): Promise<{
        eligible: boolean;
        reason?: string;
    }> {
        const cutOff = context.programme.cutOffMark || 180;
        const score = context.candidate.score || 0;

        if (score < cutOff) {
            return { eligible: false, reason: `JAMB score (${score}) is below cut-off (${cutOff})` };
        }

        return { eligible: true };
    }
}
