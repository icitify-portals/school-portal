"use server";

import { getAIProvider } from "@/lib/ai-service";
import { hasPermission, hasRole } from "@/lib/rbac";

export async function generateSEOMetadata(title: string, content: string, tone: string = "Professional & Academic") {
    try {
        const isAllowed = await hasPermission("cms.pages.manage") || await hasPermission("cms.content.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!isAllowed) return { success: false, error: "Unauthorized" };
        const provider = getAIProvider(process.env.AI_PROVIDER || 'gemini');

        const prompt = `
        You are an expert SEO specialist for higher education. Analyze the following university page content and suggest optimal SEO metadata.
        
        Page Title: "${title}"
        Content: "${content.substring(0, 3000)}..."
        Desired Tone: "${tone}"

        Return exactly a JSON object with these keys:
        - metaTitle: A browser title (max 60 chars) including institution name if appropriate.
        - metaDescription: A compelling summary for search results (max 160 chars).
        - keywords: A comma-separated string of 5-8 relevant focus keywords.
        - socialCaption: A brief, engaging caption for social media sharing.

        Format: Pure JSON only, no markdown blocks.
        `;

        const responseText = await provider.generateText(prompt);
        
        try {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            const data = JSON.parse(jsonMatch ? jsonMatch[0] : "{}");
            return { success: true, data };
        } catch (e) {
            console.error("Failed to parse AI SEO response:", responseText);
            return { success: false, error: "Failed to parse AI suggestions" };
        }
    } catch (error) {
        console.error("AI SEO Generation Error:", error);
        return { success: false, error: "AI service unavailable" };
    }
}

export async function performSEOAudit(content: string, focusKeyword: string) {
    try {
        const isAllowed = await hasPermission("cms.pages.manage") || await hasPermission("cms.content.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!isAllowed) return { success: false, error: "Unauthorized" };
        const provider = getAIProvider(process.env.AI_PROVIDER || 'gemini');

        const prompt = `
        Perform a technical SEO and readability audit on the following HTML content, focusing on the keyword: "${focusKeyword}".
        
        Content: "${content.substring(0, 5000)}..."

        Evaluate:
        1. Keyword placement (H1, first p, density).
        2. Heading hierarchy (H1, H2, H3).
        3. Readability (sentence length, transition words).
        4. Links and Media (alt text, internal links).

        Return exactly a JSON object with:
        - score: A number from 0 to 100.
        - checks: An array of objects: { label: string, status: 'pass' | 'warning' | 'fail', message: string }.
        - suggestions: A string summarizing 3 critical "Quick Fixes."

        Format: Pure JSON only.
        `;

        const responseText = await provider.generateText(prompt);
        
        try {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            const data = JSON.parse(jsonMatch ? jsonMatch[0] : "{}");
            return { success: true, data };
        } catch (e) {
            return { success: false, error: "Failed to parse AI audit" };
        }
    } catch (error) {
        return { success: false, error: "AI audit service unavailable" };
    }
}
