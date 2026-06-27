import { db } from "@/db/db";
import { cbtQuizzes } from "@/db/schema";
import QuizEditor from "./QuizEditor";

export default async function CBTEditorPage() {
    // For demo purposes, we fetch all quizzes or allow creating a new one
    const quizzes = await db.select().from(cbtQuizzes);

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">CBT Quiz Editor</h1>
                <p className="text-slate-500 mt-1">Build assessments with native LaTeX support</p>
            </div>

            <QuizEditor existingQuizzes={quizzes} />
        </div>
    );
}
