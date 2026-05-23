"use server";

import { getAIProvider } from "@/lib/ai-service";

export async function generateLessonNoteContent(prompt: string, subject: string, level: string) {
    try {
        const ai = getAIProvider();
        
        const systemInstruction = `
        You are an expert pedagogical assistant helping teachers and lecturers create high-quality lesson notes.
        Your goal is to generate structured, engaging, and professional lesson content.
        
        Follow this structure:
        1. Title
        2. Learning Objectives (Numbered list)
        3. Introduction
        4. Main Content (Divided into sections with clear headings)
        5. Summary
        6. Review Questions
        
        Tailor the tone and depth for:
        Subject: ${subject}
        Educational Level: ${level}
        
        Use HTML tags for formatting (e.g., <h2>, <p>, <ul>, <li>, <strong>).
        `;

        const response = await ai.generateText(prompt, systemInstruction);
        return { success: true, content: response };
    } catch (error) {
        console.error("AI Generation Error:", error);
        return { success: false, error: "Failed to generate content with AI" };
    }
}

export async function improveLessonContent(currentContent: string, instruction: string) {
    try {
        const ai = getAIProvider();
        
        const prompt = `
        Original Content:
        ${currentContent}
        
        Instruction:
        ${instruction}
        
        Please rewrite or expand the original content following the instruction. 
        Maintain the HTML formatting style of the original.
        `;

        const response = await ai.generateText(prompt, "You are a content editor assisting a teacher.");
        return { success: true, content: response };
    } catch (error) {
        console.error("AI Improvement Error:", error);
        return { success: false, error: "Failed to improve content with AI" };
    }
}

export const generateAIContent = generateLessonNoteContent;
