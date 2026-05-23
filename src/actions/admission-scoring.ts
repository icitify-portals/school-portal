"use server";

import { db } from "@/db/db";
import {
  programmes,
  jambCandidates,
  postUtmeScores,
  admissionApplications,
  users
} from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

// Scoring Strategy Types
export const SCORING_STRATEGIES = {
  JAMB_ONLY: {
    name: 'JAMB Score Only',
    description: 'Admission based solely on UTME score',
    config: {
      utmeWeight: 100,
      postUtmeWeight: 0,
      olevelWeight: 0
    }
  },
  WEIGHTED_AGGREGATE: {
    name: 'Weighted Aggregate',
    description: 'Combined UTME, Post-UTME, and O-Level scores',
    config: {
      utmeWeight: 50,
      postUtmeWeight: 30,
      olevelWeight: 20
    }
  },
  OLEVEL_POINTS: {
    name: 'O-Level Points',
    description: 'Admission based on O-Level grades converted to points',
    config: {
      utmeWeight: 0,
      postUtmeWeight: 0,
      olevelWeight: 100
    }
  },
  IBADAN_50_50: {
    name: 'Ibadan 50/50 Model',
    description: 'UTME/8 + Post-UTME/2, minimum 50 in Post-UTME',
    config: {
      utmeWeight: 50,
      postUtmeWeight: 50,
      utmeDivisor: 8,
      postUtmeDivisor: 2,
      minPostUtmeScore: 50
    }
  },
  UTME_OVER_8_PLUS_POST_UTME_OVER_2: {
    name: 'UTME/8 + Post-UTME/2',
    description: 'UTME score divided by 8 plus Post-UTME score divided by 2',
    config: {
      utmeWeight: 50,
      postUtmeWeight: 50,
      utmeDivisor: 8,
      postUtmeDivisor: 2
    }
  },
  UTME_PERCENTAGE_PLUS_POST_UTME_PERCENTAGE: {
    name: 'UTME % + Post-UTME %',
    description: 'UTME percentage + Post-UTME percentage aggregate',
    config: {
      utmeWeight: 60,
      postUtmeWeight: 40,
      utmeMaxScore: 400,
      postUtmeMaxScore: 100
    }
  },
  CUSTOM: {
    name: 'Custom Formula',
    description: 'Institution-specific custom scoring formula',
    config: {
      utmeWeight: 50,
      postUtmeWeight: 30,
      olevelWeight: 20,
      customFormula: ''
    }
  }
};

// Update programme scoring strategy
export async function updateProgrammeScoring(
  programmeId: number,
  scoringStrategy: keyof typeof SCORING_STRATEGIES,
  customConfig?: any
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const strategy = SCORING_STRATEGIES[scoringStrategy];
    const config = customConfig || strategy.config;

    await db
      .update(programmes)
      .set({
        scoringStrategy,
        scoringConfig: JSON.stringify(config)
      })
      .where(eq(programmes.id, programmeId));

    revalidatePath("/admin/admission/scoring");
    return { success: true, strategy, config };

  } catch (error) {
    console.error("Update scoring error:", error);
    return { success: false, error: "Failed to update scoring strategy" };
  }
}

// Get programme scoring configuration
export async function getProgrammeScoring(programmeId: number) {
  try {
    const [programme] = await db
      .select()
      .from(programmes)
      .where(eq(programmes.id, programmeId))
      .limit(1);

    if (!programme) {
      return { success: false, error: "Programme not found" };
    }

    const strategy = programme.scoringStrategy as keyof typeof SCORING_STRATEGIES;
    const config = programme.scoringConfig ? JSON.parse(programme.scoringConfig) : SCORING_STRATEGIES[strategy].config;

    return {
      success: true,
      programme,
      strategy,
      config,
      strategyInfo: SCORING_STRATEGIES[strategy]
    };

  } catch (error) {
    console.error("Get scoring error:", error);
    return { success: false, error: "Failed to get scoring configuration" };
  }
}

// Calculate admission aggregate score
export async function calculateAdmissionScore(jambRegNo: string, programmeId: number) {
  try {
    // Get programme scoring configuration
    const scoringRes = await getProgrammeScoring(programmeId);
    if (!scoringRes.success) {
      return { success: false, error: "Failed to get scoring configuration" };
    }

    const { strategy, config } = scoringRes;

    // Get candidate data
    const [candidate] = await db
      .select()
      .from(jambCandidates)
      .where(eq(jambCandidates.jambRegNo, jambRegNo))
      .limit(1);

    if (!candidate) {
      return { success: false, error: "Candidate not found" };
    }

    // Get Post-UTME scores
    const postUtmeScoresData = await db
      .select()
      .from(postUtmeScores)
      .where(and(
        eq(postUtmeScores.jambRegNo, jambRegNo),
        eq(postUtmeScores.isApproved, true)
      ));

    let aggregateScore = 0;
    let scoreBreakdown: any = {};

    switch (strategy) {
      case 'JAMB_ONLY':
        aggregateScore = candidate.score || 0;
        scoreBreakdown = {
          utmeScore: candidate.score,
          utmeContribution: candidate.score,
          postUtmeContribution: 0,
          olevelContribution: 0
        };
        break;

      case 'IBADAN_50_50':
        const utmeScore = (candidate.score || 0) / (config.utmeDivisor || 8);
        const postUtmeScore = postUtmeScoresData.length > 0 ?
          Math.max(...postUtmeScoresData.map(s => s.score)) / (config.postUtmeDivisor || 2) : 0;

        // Check minimum Post-UTME requirement
        if (postUtmeScore < (config.minPostUtmeScore || 50)) {
          return {
            success: false,
            error: `Post-UTME score below minimum requirement of ${config.minPostUtmeScore}`,
            currentPostUtmeScore: postUtmeScore
          };
        }

        aggregateScore = utmeScore + postUtmeScore;
        scoreBreakdown = {
          utmeScore: candidate.score,
          utmeContribution: utmeScore,
          postUtmeScore: postUtmeScoresData.length > 0 ? Math.max(...postUtmeScoresData.map(s => s.score)) : 0,
          postUtmeContribution: postUtmeScore,
          olevelContribution: 0
        };
        break;

      case 'UTME_OVER_8_PLUS_POST_UTME_OVER_2':
        const utmeScore2 = (candidate.score || 0) / (config.utmeDivisor || 8);
        const postUtmeScore2 = postUtmeScoresData.length > 0 ?
          Math.max(...postUtmeScoresData.map(s => s.score)) / (config.postUtmeDivisor || 2) : 0;

        aggregateScore = utmeScore2 + postUtmeScore2;
        scoreBreakdown = {
          utmeScore: candidate.score,
          utmeContribution: utmeScore2,
          postUtmeScore: postUtmeScoresData.length > 0 ? Math.max(...postUtmeScoresData.map(s => s.score)) : 0,
          postUtmeContribution: postUtmeScore2,
          olevelContribution: 0
        };
        break;

      case 'UTME_PERCENTAGE_PLUS_POST_UTME_PERCENTAGE':
        const utmePercentage = ((candidate.score || 0) / (config.utmeMaxScore || 400)) * (config.utmeWeight || 60);
        const maxPostUtmeScore = postUtmeScoresData.length > 0 ? Math.max(...postUtmeScoresData.map(s => s.score)) : 0;
        const postUtmePercentage = (maxPostUtmeScore / (config.postUtmeMaxScore || 100)) * (config.postUtmeWeight || 40);

        aggregateScore = utmePercentage + postUtmePercentage;
        scoreBreakdown = {
          utmeScore: candidate.score,
          utmeContribution: utmePercentage,
          postUtmeScore: maxPostUtmeScore,
          postUtmeContribution: postUtmePercentage,
          olevelContribution: 0
        };
        break;

      case 'WEIGHTED_AGGREGATE':
      case 'CUSTOM':
        const utmeWeight = config.utmeWeight || 50;
        const postUtmeWeight = config.postUtmeWeight || 30;
        const olevelWeight = config.olevelWeight || 20;

        const utmeContribution = ((candidate.score || 0) / 400) * utmeWeight; // Normalize UTME to 400 scale
        const maxPostUtmeScore3 = postUtmeScoresData.length > 0 ? Math.max(...postUtmeScoresData.map(s => s.score)) : 0;
        const postUtmeContribution = (maxPostUtmeScore3 / 100) * postUtmeWeight; // Normalize Post-UTME to 100 scale
        const olevelContribution = (0 / 100) * olevelWeight; // Placeholder for O-Level

        aggregateScore = utmeContribution + postUtmeContribution + olevelContribution;
        scoreBreakdown = {
          utmeScore: candidate.score,
          utmeContribution,
          postUtmeScore: maxPostUtmeScore3,
          postUtmeContribution,
          olevelContribution
        };
        break;

      default:
        aggregateScore = candidate.score || 0;
        scoreBreakdown = {
          utmeScore: candidate.score,
          utmeContribution: candidate.score || 0,
          postUtmeContribution: 0,
          olevelContribution: 0
        };
    }

    // Update admission application with calculated score
    await db
      .update(admissionApplications)
      .set({
        aggregateScore: aggregateScore?.toString() || '0',
        screeningScore: postUtmeScoresData.length > 0 ? Math.max(...postUtmeScoresData.map(s => s.score)).toString() : null
      })
      .where(and(
        eq(admissionApplications.jambRegNo, jambRegNo),
        eq(admissionApplications.programmeId, programmeId)
      ));

    return {
      success: true,
      aggregateScore,
      scoreBreakdown,
      strategy,
      scoringDetails: {
        candidate: {
          utmeScore: candidate.score,
          postUtmeScores: postUtmeScoresData.map(s => s.score)
        },
        calculation: scoreBreakdown,
        config
      }
    };

  } catch (error) {
    console.error("Calculate score error:", error);
    return { success: false, error: "Failed to calculate admission score" };
  }
}

// Add Post-UTME score
export async function addPostUtmeScore(
  jambRegNo: string,
  programmeId: number,
  score: number,
  examType: string,
  examDate: string
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    await db.insert(postUtmeScores).values({
      jambRegNo,
      programmeId,
      score,
      examType,
      examDate: new Date(examDate),
      isApproved: false // Requires admin approval
    });

    // Recalculate aggregate score
    await calculateAdmissionScore(jambRegNo, programmeId);

    revalidatePath("/admin/admission/scoring");
    return { success: true };

  } catch (error) {
    console.error("Add Post-UTME score error:", error);
    return { success: false, error: "Failed to add Post-UTME score" };
  }
}

// Approve Post-UTME score
export async function approvePostUtmeScore(scoreId: number) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const [scoreRecord] = await db
      .select()
      .from(postUtmeScores)
      .where(eq(postUtmeScores.id, scoreId))
      .limit(1);

    if (!scoreRecord) {
      return { success: false, error: "Score record not found" };
    }

    await db
      .update(postUtmeScores)
      .set({
        isApproved: true,
        approvedBy: parseInt(session.user.id),
        approvedAt: new Date()
      })
      .where(eq(postUtmeScores.id, scoreId));

    // Recalculate aggregate score
    await calculateAdmissionScore(scoreRecord.jambRegNo, scoreRecord.programmeId);

    revalidatePath("/admin/admission/scoring");
    return { success: true };

  } catch (error) {
    console.error("Approve Post-UTME score error:", error);
    return { success: false, error: "Failed to approve Post-UTME score" };
  }
}

// Get all Post-UTME scores for a candidate
export async function getCandidatePostUtmeScores(jambRegNo: string) {
  try {
    const scores = await db
      .select()
      .from(postUtmeScores)
      .where(eq(postUtmeScores.jambRegNo, jambRegNo))
      .orderBy(desc(postUtmeScores.createdAt));

    return { success: true, scores };

  } catch (error) {
    console.error("Get Post-UTME scores error:", error);
    return { success: false, error: "Failed to get Post-UTME scores" };
  }
}

// Get all programmes with scoring configurations
export async function getAllProgrammesWithScoring() {
  try {
    const allProgrammes = await db.select().from(programmes);

    const programmesWithScoring = allProgrammes.map(programme => {
      const strategy = programme.scoringStrategy as keyof typeof SCORING_STRATEGIES;
      const config = programme.scoringConfig ? JSON.parse(programme.scoringConfig) : SCORING_STRATEGIES[strategy].config;

      return {
        ...programme,
        scoringStrategy: strategy,
        scoringConfig: config,
        strategyInfo: SCORING_STRATEGIES[strategy]
      };
    });

    return { success: true, programmes: programmesWithScoring };

  } catch (error) {
    console.error("Get programmes with scoring error:", error);
    return { success: false, error: "Failed to get programmes" };
  }
}

// Calculate admission decision based on scoring
export async function calculateAdmissionDecision(jambRegNo: string, programmeId: number) {
  try {
    const scoreRes = await calculateAdmissionScore(jambRegNo, programmeId);
    if (!scoreRes.success) {
      return scoreRes;
    }

    const [programme] = await db
      .select()
      .from(programmes)
      .where(eq(programmes.id, programmeId))
      .limit(1);

    if (!programme) {
      return { success: false, error: "Programme not found" };
    }

    const { aggregateScore = 0 } = scoreRes;
    const cutOffMark = programme.cutOffMark || 180;

    const decision = aggregateScore >= cutOffMark ? 'admitted' : 'not_admitted';
    const status = decision === 'admitted' ? 'admitted' : 'screened';

    // Update admission application status
    await db
      .update(admissionApplications)
      .set({
        status,
        aggregateScore: aggregateScore.toString()
      })
      .where(and(
        eq(admissionApplications.jambRegNo, jambRegNo),
        eq(admissionApplications.programmeId, programmeId)
      ));

    return {
      success: true,
      decision,
      aggregateScore,
      cutOffMark,
      scoreBreakdown: scoreRes.scoreBreakdown,
      meetsRequirement: aggregateScore >= cutOffMark,
      difference: aggregateScore - cutOffMark
    };

  } catch (error) {
    console.error("Calculate admission decision error:", error);
    return { success: false, error: "Failed to calculate admission decision" };
  }
}
