"use server";

import { getAIProvider } from "@/lib/ai-service";

/**
 * Auto-generates a meta description for a page based on its content.
 */
export async function generateAiMetaDescription(content: string, type: "course" | "book" | "article" | "page" = "page") {
    try {
        const ai = getAIProvider("gemini");
        const prompt = `Generate a compelling, SEO-friendly meta description (max 160 characters) for the following ${type} content:\n\n${content.substring(0, 2000)}`;
        const systemInstruction = "You are an SEO expert. Output only the meta description text, no labels or quotes.";
        
        const description = await ai.generateText(prompt, systemInstruction);
        return description.trim();
    } catch (error) {
        console.error("AI Meta Generation failed:", error);
        return null;
    }
}

/**
 * Generates an AI summary for complex content (books/articles).
 */
export async function generateAiSummary(content: string) {
    try {
        const ai = getAIProvider("gemini");
        const prompt = `Provide a concise 3-sentence summary of the following content for a "Quick Overview" section:\n\n${content.substring(0, 3000)}`;
        const systemInstruction = "You are a professional academic summarizer.";
        
        const summary = await ai.generateText(prompt, systemInstruction);
        return summary.trim();
    } catch (error) {
        console.error("AI Summary Generation failed:", error);
        return null;
    }
}

/**
 * Generates a blog post draft based on target keywords.
 */
export async function generateBlogDraft(keywords: string, title?: string) {
    try {
        const ai = getAIProvider("gemini");
        const prompt = `Create a detailed blog post draft for an educational platform based on these keywords: ${keywords}. ${title ? `The title is: ${title}` : ""}`;
        const systemInstruction = "You are a high-authority educational blogger. Use professional yet accessible language. Format with Markdown headers.";
        
        const draft = await ai.generateText(prompt, systemInstruction);
        return draft;
    } catch (error) {
        console.error("AI Blog Generation failed:", error);
        return null;
    }
}

/**
 * Suggests long-tail keywords for programmatic SEO landing pages.
 */
export async function suggestLongTailKeywords(topic: string) {
    try {
        const ai = getAIProvider("gemini");
        const prompt = `Suggest 5 high-intent, long-tail SEO keywords or phrases for an eLearning landing page about: ${topic}`;
        const systemInstruction = "Output a simple list of 5 phrases, one per line.";
        
        const keywords = await ai.generateText(prompt, systemInstruction);
        return keywords.split('\n').map(k => k.replace(/^\d+\.\s*/, '').trim()).filter(Boolean);
    } catch (error) {
        console.error("AI Keyword Suggestion failed:", error);
        return [];
    }
}
