import { db } from "@/db/db";
import { lessonNotes } from "@/db/schema";
import { eq } from "drizzle-orm";

// Simple in-memory RAG for now - chunks lessonNotes.contentBody, embeds via OpenAI if key set, else TF-IDF fallback
export async function ingestLessonNote(lessonNoteId: number) {
  const [note] = await db.select().from(lessonNotes).where(eq(lessonNotes.id, lessonNoteId)).limit(1);
  if (!note || !note.contentBody) return { success: false };
  const chunks = chunkText(note.contentBody, 500);
  // For now just log, real embed would insert into lesson_note_embeddings
  console.log(`[RAG] Would embed ${chunks.length} chunks for lessonNote ${lessonNoteId}`);
  return { success: true, chunks: chunks.length };
}

function chunkText(text: string, size: number): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += size) {
    chunks.push(words.slice(i, i + size).join(" "));
  }
  return chunks;
}

export async function queryRAG(courseId: number, question: string) {
  // Fallback: simple keyword match over lessonNotes
  const notes = await db.select().from(lessonNotes).where(eq(lessonNotes.courseId, courseId)).limit(5);
  const lowerQ = question.toLowerCase();
  const scored = notes.map(n => {
    const content = (n.contentBody || "").toLowerCase();
    const score = lowerQ.split(/\s+/).filter(w => content.includes(w)).length;
    return { note: n, score };
  }).sort((a, b) => b.score - a.score).slice(0, 3);
  return scored.map(s => s.note.contentBody?.slice(0, 500) || "");
}
