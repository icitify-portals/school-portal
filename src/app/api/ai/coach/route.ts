import { NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai-service";

export async function POST(req: Request) {
    try {
        const { prompt } = await req.json();
        
        const provider = getAIProvider(process.env.AI_PROVIDER || 'gemini');
        
        const aiPrompt = `
        You are a helpful AI Study Buddy for a student on a school portal.
        The student is talking to you via voice.
        
        Student Input: "${prompt}"
        
        Guidelines:
        1. Keep your response short and concise (max 50 words) because it will be read aloud.
        2. Be encouraging and educational.
        3. Use simple language.
        4. If the student asks about a subject, give a quick interesting fact.
        5. Use a friendly, tutor-like persona.
        `;

        const response = await provider.generateText(aiPrompt);

        return NextResponse.json({ response });
    } catch (error) {
        console.error("AI Coach Error:", error);
        return NextResponse.json({ response: "I'm having trouble thinking right now. Let's try again in a moment!" }, { status: 500 });
    }
}
