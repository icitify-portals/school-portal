import { db } from "@/db/db";
import { unifiedExams } from "@/db/schema";
import QuizEditor from "./QuizEditor";

export default async function CBTEditorPage() {
    const exams = await db.select().from(unifiedExams);

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">CBT Quiz Editor</h1>
                <p className="text-slate-500 mt-1">Build assessments with native LaTeX support</p>
            </div>

            <QuizEditor existingQuizzes={exams} />
        </div>
    );
}
