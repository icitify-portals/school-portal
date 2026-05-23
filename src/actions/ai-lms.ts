"use server";

import { getAIProvider } from "@/lib/ai-service";

export async function generateLessonContent(topic: string, level: string = "Intermediate") {
    try {
        const provider = getAIProvider(process.env.AI_PROVIDER || 'gemini');

        const prompt = `
        You are an expert educational content creator. Create a comprehensive lesson on the topic: "${topic}".
        Target Audience Level: ${level}.

        Structure the content with:
        - Introduction
        - Key Concepts (explain in detail)
        - Examples / Case Studies
        - Summary
        - Review Questions (3-5 questions)

        Format:
        - Return strictly valid HTML.
        - Use <h3> for section headers.
        - Use <p> for paragraphs.
        - Use <ul>/<ol> and <li> for lists.
        - Use <strong> for emphasis.
        - Do NOT use <h1>, <html>, <head>, or <body> tags.
        - Make it engaging and easy to read.
        `;

        const content = await provider.generateText(prompt);

        // Basic cleanup if AI adds markdown blocks despite instructions
        const cleanContent = content.replace(/```html/g, '').replace(/```/g, '').trim();

        return { success: true, content: cleanContent };

    } catch (error) {
        console.error("LMS AI Generation Error:", error);
        return { success: false, error: "Failed to generate content" };
    }
}

export async function generateQuizQuestions(topic: string, count: number = 5) {
    try {
        const provider = getAIProvider(process.env.AI_PROVIDER || 'gemini');

        const prompt = `
        Create a quiz with ${count} multiple-choice questions on the topic: "${topic}".
        
        Return a JSON array of objects with:
        - question (string)
        - options (array of 4 strings)
        - correctOptionIndex (integer 0-3)
        - explanation (string)

        Output strictly valid JSON.
        `;

        const responseText = await provider.generateText(prompt);
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);

        if (jsonMatch) {
            return { success: true, questions: JSON.parse(jsonMatch[0]) };
        }
        return { success: false, error: "Failed to parse AI response" };

    } catch (error) {
        console.error("LMS AI Quiz Error:", error);
        return { success: false, error: "Failed to generate quiz" };
    }
}

export async function generateCourseStructure(topic: string) {
    try {
        const provider = getAIProvider(process.env.AI_PROVIDER || 'gemini');

        const prompt = `
        Create a structured course outline for the topic: "${topic}".
        
        Return a JSON array of Module objects.
        Each Module has:
        - title (string)
        - lessons (array of strings, just titles)

        Example:
        [
            { "title": "Module 1", "lessons": ["Lesson 1.1", "Lesson 1.2"] }
        ]

        Output strictly valid JSON. Limit to 4-5 modules with 3-4 lessons each.
        `;

        const responseText = await provider.generateText(prompt);
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);

        if (jsonMatch) {
            return { success: true, modules: JSON.parse(jsonMatch[0]) };
        }
        return { success: false, error: "Failed to parse AI response" };

    } catch (error) {
        console.error("LMS AI Structure Error:", error);
        return { success: false, error: "Failed to generate structure" };
    }
}
