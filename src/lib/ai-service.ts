
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

export type AIProviderName = 'gemini' | 'openai' | 'deepseek' | 'grok';

export interface AIProvider {
    generateText(prompt: string, systemInstruction?: string): Promise<string>;
    analyzeJson(prompt: string, schema?: any): Promise<any>;
    analyzeDocument(fileBuffer: Buffer, mimeType: string, prompt: string): Promise<any>;
}

class GeminiProvider implements AIProvider {
    private client: GoogleGenerativeAI;
    private model: any;

    constructor(apiKey: string) {
        this.client = new GoogleGenerativeAI(apiKey);
        this.model = this.client.getGenerativeModel({ model: "gemini-1.5-flash" });
    }

    async generateText(prompt: string, systemInstruction?: string): Promise<string> {
        const finalPrompt = systemInstruction ? `${systemInstruction}\n\n${prompt}` : prompt;
        const result = await this.model.generateContent(finalPrompt);
        const response = await result.response;
        return response.text();
    }

    async analyzeJson(prompt: string): Promise<any> {
        const jsonPrompt = `${prompt}\n\nOutput strictly valid JSON only. Do not wrap in markdown blocks.`;
        const result = await this.model.generateContent(jsonPrompt);
        const text = result.response.text();
        try {
            const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleaned);
        } catch (e) {
            console.error("Gemini JSON parse error:", e);
            throw new Error("Failed to parse JSON response from Gemini");
        }
    }

    async analyzeDocument(fileBuffer: Buffer, mimeType: string, prompt: string): Promise<any> {
        const result = await this.model.generateContent([
            prompt,
            {
                inlineData: {
                    data: fileBuffer.toString("base64"),
                    mimeType: mimeType
                }
            }
        ]);
        const text = result.response.text();
        try {
            const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleaned);
        } catch (e) {
            console.error("Gemini Document Analysis parse error:", e);
            return { error: "Failed to parse AI document analysis", raw: text };
        }
    }
}

class OpenAICompatibleProvider implements AIProvider {
    private client: OpenAI;
    private modelName: string;

    constructor(apiKey: string, baseURL?: string, model: string = "gpt-4o") {
        this.client = new OpenAI({
            apiKey: apiKey,
            baseURL: baseURL
        });
        this.modelName = model;
    }

    async generateText(prompt: string, systemInstruction?: string): Promise<string> {
        const messages: any[] = [];
        if (systemInstruction) messages.push({ role: "system", content: systemInstruction });
        messages.push({ role: "user", content: prompt });

        const completion = await this.client.chat.completions.create({
            messages: messages,
            model: this.modelName,
        });

        return completion.choices[0]?.message?.content || "";
    }

    async analyzeJson(prompt: string): Promise<any> {
        const completion = await this.client.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: this.modelName,
            response_format: { type: "json_object" }
        });

        const content = completion.choices[0]?.message?.content || "{}";
        return JSON.parse(content);
    }

    async analyzeDocument(fileBuffer: Buffer, mimeType: string, prompt: string): Promise<any> {
        // OpenAI uses images via URL or base64 in messages.
        // For GPT-4o, we can send base64 data.
        const completion = await this.client.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:${mimeType};base64,${fileBuffer.toString("base64")}`
                            }
                        }
                    ]
                }
            ],
            model: this.modelName,
            response_format: { type: "json_object" }
        });

        const content = completion.choices[0]?.message?.content || "{}";
        return JSON.parse(content);
    }
}

class FallbackAIProvider implements AIProvider {
    private providers: AIProvider[];

    constructor(providerNames: string[]) {
        this.providers = providerNames.map(name => getAIProvider(name, true));
    }

    private async tryAll<T>(action: (provider: AIProvider) => Promise<T>): Promise<T> {
        let lastError: any;
        for (const provider of this.providers) {
            try {
                return await action(provider);
            } catch (e) {
                console.warn(`AI Provider failed, trying next...`, e);
                lastError = e;
            }
        }
        throw lastError || new Error("All AI providers failed");
    }

    async generateText(prompt: string, systemInstruction?: string): Promise<string> {
        return this.tryAll(p => p.generateText(prompt, systemInstruction));
    }

    async analyzeJson(prompt: string): Promise<any> {
        return this.tryAll(p => p.analyzeJson(prompt));
    }

    async analyzeDocument(fileBuffer: Buffer, mimeType: string, prompt: string): Promise<any> {
        return this.tryAll(p => p.analyzeDocument(fileBuffer, mimeType, prompt));
    }
}

export function getAIProvider(providerName?: string, isInternal: boolean = false): AIProvider {
    const provider = providerName || process.env.AI_PROVIDER || 'gemini';

    if (provider.toLowerCase() === 'multi' && !isInternal) {
        return new FallbackAIProvider(['deepseek', 'gemini', 'openai']);
    }

    switch (provider.toLowerCase()) {
        case 'openai':
            if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not set");
            return new OpenAICompatibleProvider(process.env.OPENAI_API_KEY, undefined, "gpt-4o");

        case 'deepseek':
            if (!process.env.DEEPSEEK_API_KEY) throw new Error("DEEPSEEK_API_KEY is not set");
            return new OpenAICompatibleProvider(process.env.DEEPSEEK_API_KEY, "https://api.deepseek.com/v1", "deepseek-chat");

        case 'grok':
            if (!process.env.GROK_API_KEY) throw new Error("GROK_API_KEY is not set");
            return new OpenAICompatibleProvider(process.env.GROK_API_KEY, "https://api.x.ai/v1", "grok-beta");

        case 'gemini':
        default:
            const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
            if (!geminiKey) throw new Error("GEMINI_API_KEY or GOOGLE_API_KEY is not set");
            return new GeminiProvider(geminiKey);
    }
}
