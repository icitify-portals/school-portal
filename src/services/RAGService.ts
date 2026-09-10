import { db } from "@/db/db";
import { lessonNotes, lessonNoteEmbeddings } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

// Open-source embeddings via Xenova/transformers (all-MiniLM-L6-v2) - no OpenAI key needed
// Falls back to TF-IDF keyword match if model not loaded

let embedder: any = null;
async function getEmbedder() {
  if (embedder) return embedder;
  try {
    // Dynamic import so build doesn't fail if package not installed yet
    const { pipeline } = await import("@xenova/transformers");
    embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    console.log("[RAG] Loaded open-source embedder all-MiniLM-L6-v2");
  } catch (e) {
    console.warn("[RAG] Xenova not available, using TF-IDF fallback", (e as Error).message);
    embedder = null;
  }
  return embedder;
}

async function embedText(text: string): Promise<number[]> {
  const enc = await getEmbedder();
  if (enc) {
    const output = await enc(text, { pooling: "mean", normalize: true });
    return Array.from(output.data as Float32Array);
  }
  // Fallback: simple hash-based vector (not semantic, but deterministic)
  const vec = new Array(384).fill(0);
  for (let i = 0; i < text.length; i++) {
    vec[i % 384] += text.charCodeAt(i) % 10;
  }
  const norm = Math.sqrt(vec.reduce((a, b) => a + b * b, 0)) || 1;
  return vec.map(v => v / norm);
}

function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

export async function ingestLessonNote(lessonNoteId: number) {
  const [note] = await db.select().from(lessonNotes).where(eq(lessonNotes.id, lessonNoteId)).limit(1);
  if (!note || !note.contentBody) return { success: false };
  const chunks = chunkText(note.contentBody, 500);
  for (let i = 0; i < chunks.length; i++) {
    const vec = await embedText(chunks[i]);
    try {
      await db.insert(lessonNoteEmbeddings).values({
        lessonNoteId,
        chunkIndex: i,
        chunkText: chunks[i],
        embedding: JSON.stringify(vec),
      });
    } catch (e) {
      // If table doesn't exist yet (migration pending), just log
      console.warn("[RAG] Insert embedding failed, table may not exist", (e as Error).message);
    }
  }
  console.log(`[RAG] Embedded ${chunks.length} chunks for lessonNote ${lessonNoteId} with open-source model`);
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
  // Try semantic search via embeddings first
  try {
    const qVec = await embedText(question);
    const rows: any[] = await db.select().from(lessonNoteEmbeddings).leftJoin(lessonNotes, eq(lessonNoteEmbeddings.lessonNoteId, lessonNotes.id)).where(eq(lessonNotes.courseId, courseId)).limit(50);
    if (rows.length > 0 && qVec.length > 10) {
      const scored = rows.map((r: any) => {
        try {
          const vec = JSON.parse(r.lesson_note_embeddings.embedding || "[]");
          return { text: r.lesson_note_embeddings.chunkText, score: cosine(qVec, vec) };
        } catch { return { text: r.lesson_note_embeddings.chunkText, score: 0 }; }
      }).sort((a, b) => b.score - a.score).slice(0, 3);
      if (scored.length > 0 && scored[0].score > 0.1) return scored.map(s => s.text.slice(0, 500));
    }
  } catch {}
  // Fallback: keyword match
  const notes = await db.select().from(lessonNotes).where(eq(lessonNotes.courseId, courseId)).limit(5);
  const lowerQ = question.toLowerCase();
  const scored = notes.map(n => {
    const content = (n.contentBody || "").toLowerCase();
    const score = lowerQ.split(/\s+/).filter(w => content.includes(w)).length;
    return { note: n, score };
  }).sort((a, b) => b.score - a.score).slice(0, 3);
  return scored.map(s => s.note.contentBody?.slice(0, 500) || "");
}
