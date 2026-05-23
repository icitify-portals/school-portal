
import { ScoringContext, ScoringStrategy } from "./strategies/types";
import { JambOnlyStrategy } from "./strategies/jamb-only";
import { WeightedAggregateStrategy } from "./strategies/weighted";
import { OLevelPointsStrategy } from "./strategies/olevel";

export class AdmissionScoreCalculator {
    private static strategies: Record<string, ScoringStrategy> = {
        "JAMB_ONLY": new JambOnlyStrategy(),
        "WEIGHTED_AGGREGATE": new WeightedAggregateStrategy(),
        "OLEVEL_POINTS": new OLevelPointsStrategy(),
    };

    static getStrategy(strategyName: string): ScoringStrategy {
        return this.strategies[strategyName] || this.strategies["JAMB_ONLY"];
    }

    static async calculate(context: ScoringContext): Promise<number> {
        const strategyName = context.programme.scoringStrategy || "JAMB_ONLY";
        const strategy = this.getStrategy(strategyName);
        return strategy.calculateScore(context);
    }

    static async validate(context: ScoringContext): Promise<{ eligible: boolean; reason?: string }> {
        const strategyName = context.programme.scoringStrategy || "JAMB_ONLY";
        const strategy = this.getStrategy(strategyName);
        return strategy.validateRequirements(context);
    }
}
