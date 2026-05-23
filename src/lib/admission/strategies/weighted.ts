
import { ScoringContext, ScoringStrategy } from "./types";

interface WeightedConfig {
    utmeWeight: number; // e.g., 50 (for 50%)
    screeningWeight: number; // e.g., 50 (for 50%)
    baseParams?: {
        maxUtme: number; // e.g. 400
        maxScreening: number; // e.g. 100
    };
}

export class WeightedAggregateStrategy implements ScoringStrategy {
    async calculateScore(context: ScoringContext): Promise<number> {
        const config = context.programme.scoringConfig
            ? (JSON.parse(context.programme.scoringConfig) as WeightedConfig)
            : { utmeWeight: 50, screeningWeight: 50, baseParams: { maxUtme: 400, maxScreening: 100 } };

        const utmeScore = context.candidate.score || 0;
        const screeningScore = context.screeningScore || 0;

        const maxUtme = config.baseParams?.maxUtme || 400;
        const maxScreening = config.baseParams?.maxScreening || 100;

        // Normalize to percentage
        const utmePercent = (utmeScore / maxUtme) * 100;
        const screeningPercent = (screeningScore / maxScreening) * 100;

        // Apply weights
        const finalScore =
            (utmePercent * (config.utmeWeight / 100)) +
            (screeningPercent * (config.screeningWeight / 100));

        return parseFloat(finalScore.toFixed(2));
    }

    async validateRequirements(context: ScoringContext): Promise<{
        eligible: boolean;
        reason?: string;
    }> {
        const cutOff = context.programme.cutOffMark || 50; // Aggregate cut-off usually lower (e.g., 50%)

        // We can't fully validate aggregate until screening score is present.
        // But we can check if JAMB meets a minimum baseline if enforced.

        // For this strategy, main validation happens after calculation.
        // Here we check if data is sufficient.

        if (context.screeningScore === undefined || context.screeningScore === null) {
            return { eligible: false, reason: "Screening score is required for weighted aggregate." };
        }

        const score = await this.calculateScore(context);

        if (score < cutOff) {
            return { eligible: false, reason: `Aggregate score (${score}%) is below cut-off (${cutOff}%)` };
        }

        return { eligible: true };
    }
}
