import { NextResponse } from "next/server";
import { queryRAG } from "@/services/RAGService";

export async function POST(req: Request) {
  try {
    const { courseId, question } = await req.json();
    if (!courseId || !question) return NextResponse.json({ error: "Missing courseId or question" }, { status: 400 });
    const chunks = await queryRAG(Number(courseId), String(question));
    // Mock OpenAI response using chunks
    const answer = `Based on ${chunks.length} course documents: ${chunks.join(" ").slice(0, 500)}...`;
    return NextResponse.json({ success: true, answer, chunks });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
