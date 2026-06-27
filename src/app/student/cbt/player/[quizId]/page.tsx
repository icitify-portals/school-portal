import { db } from "@/db/db";
import { cbtQuizzes, cbtQuestions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import CbtPlayer from "./CbtPlayer";

export default async function CBTPlayerPage({ params }: { params: { quizId: string } }) {
    const session = await auth();
    if (!session) redirect("/login");

    const quizId = parseInt(params.quizId);
    if (isNaN(quizId)) return <div>Invalid Quiz ID</div>;

    const [quiz] = await db.select().from(cbtQuizzes).where(eq(cbtQuizzes.id, quizId)).limit(1);
    if (!quiz) return <div>Quiz not found</div>;

    const questions = await db.select().from(cbtQuestions).where(eq(cbtQuestions.quizId, quizId));

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <CbtPlayer 
                quiz={quiz} 
                questions={questions} 
                userId={parseInt(session.user?.id as string)} 
            />
        </div>
    );
}
