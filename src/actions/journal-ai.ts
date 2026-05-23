"use server";

import { db } from "@/db/db";
import { journalArticles, journalArticleAuthors, staffProfiles, users } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { getAIProvider } from "@/lib/ai-service";
import { revalidatePath } from "next/cache";

/**
 * AI Editorial Assistant for Journals
 */

export async function summarizeSubmission(articleId: number) {
    try {
        const [article] = await db.select().from(journalArticles).where(eq(journalArticles.id, articleId)).limit(1);
        if (!article) return { success: false, error: "Article not found" };

        const ai = getAIProvider();
        const prompt = `Summarize the following research article for an editorial desk review. 
        Provide a concise 200-word executive summary highlighting the research gap, methodology, and key findings.
        
        Title: ${article.title}
        Abstract: ${article.abstract || "No abstract provided"}
        Keywords: ${article.keywords || "None"}`;

        const summary = await ai.generateText(prompt, "You are an expert academic editor.");
        
        await db.update(journalArticles).set({ aiSummary: summary }).where(eq(journalArticles.id, articleId));
        revalidatePath(`/staff/journal`);
        
        return { success: true, summary };
    } catch (error) {
        console.error("AI Summarization failed:", error);
        return { success: false, error: "AI processing failed." };
    }
}

export async function translateArticleMetadata(articleId: number) {
    try {
        const [article] = await db.select().from(journalArticles).where(eq(journalArticles.id, articleId)).limit(1);
        if (!article) return { success: false, error: "Article not found" };

        const locales = ["sw", "yo", "zu", "ig", "ha", "af", "st", "xh"]; // Standard African locales
        const ai = getAIProvider();
        
        const prompt = `Translate the following academic metadata into these languages: ${locales.join(", ")}. 
        Provide the output as a JSON object where keys are the locale codes and values are objects containing 'title' and 'abstract'.
        
        Title: ${article.title}
        Abstract: ${article.abstract || "No abstract provided"}`;

        const translations = await ai.analyzeJson(prompt);
        
        await db.update(journalArticles)
            .set({ translatedMetadata: JSON.stringify(translations) })
            .where(eq(journalArticles.id, articleId));

        return { success: true, translatedMetadata: translations };
    } catch (error) {
        console.error("AI Translation failed:", error);
        return { success: false, error: "Translation failed." };
    }
}

export async function suggestSemanticReviewers(articleId: number) {
    try {
        const [article] = await db.select().from(journalArticles).where(eq(journalArticles.id, articleId)).limit(1);
        if (!article) return { success: false, error: "Article not found" };

        const staff = await db.select({
            userId: staffProfiles.userId,
            expertise: staffProfiles.expertise,
            name: users.name
        })
        .from(staffProfiles)
        .innerJoin(users, eq(staffProfiles.userId, users.id));

        const ai = getAIProvider();
        const prompt = `Based on the following article metadata, identify the top 3 most suitable reviewers from the provided list based on their expertise.
        Explain briefly why each was chosen.
        
        Article Title: ${article.title}
        Article Abstract: ${article.abstract}
        
        Reviewers List:
        ${staff.map(s => `ID: ${s.userId}, Name: ${s.name}, Expertise: ${s.expertise}`).join("\n")}
        
        Output format: JSON array of objects with keys: userId, reason.`;

        const suggestions = await ai.analyzeJson(prompt);
        
        // Enrich with names
        const enriched = suggestions.map((s: any) => ({
            ...s,
            name: staff.find(st => st.userId === s.userId)?.name
        }));

        return { success: true, suggestions: enriched };
    } catch (error) {
        console.error("AI Reviewer matching failed:", error);
        return { success: false, error: "Reviewer matching failed." };
    }
}
