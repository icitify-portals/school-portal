
import { oLevelResults, jambCandidates, programmes } from "@/db/schema";
import { InferSelectModel } from "drizzle-orm";

export type JambCandidate = InferSelectModel<typeof jambCandidates>;
export type OLevelResult = InferSelectModel<typeof oLevelResults>;
export type Programme = InferSelectModel<typeof programmes>;

export interface ScoringContext {
    candidate: JambCandidate;
    oLevelResults: OLevelResult[];
    programme: Programme;
    screeningScore?: number; // Optional Post-UTME score
}

export interface ScoringStrategy {
    calculateScore(context: ScoringContext): Promise<number>;
    validateRequirements(context: ScoringContext): Promise<{
        eligible: boolean;
        reason?: string;
    }>;
}
