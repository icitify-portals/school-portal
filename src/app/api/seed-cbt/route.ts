import { NextResponse } from "next/server";
import { db } from "@/db/db";
import { users, students, courses, unifiedExams, unifiedExamQuestions, unifiedExamAssignments } from "@/db/schema";
import { hash } from "bcrypt";
import { eq } from "drizzle-orm";

export async function GET() {
    try {
        let [course] = await db.select().from(courses).where(eq(courses.code, "MAT777"));
        if (!course) {
            const [res] = await db.insert(courses).values({
                name: "Demo Mathematics 777",
                code: "MAT777",
                creditUnits: 3,
                description: "Demo course for testing CBT functionality"
            });
            course = { id: res.insertId } as any;
        }

        const email = "demo.elearning@example.com";
        let [user] = await db.select().from(users).where(eq(users.email, email));
        if (!user) {
            const hashedPassword = await hash("password123", 10);
            const [uRes] = await db.insert(users).values({
                email,
                name: "Demo ELearner",
                password: hashedPassword,
                role: "student",
                matricNumber: "DEMO/EL/001"
            });
            
            await db.insert(students).values({
                userId: uRes.insertId,
                firstName: "Demo",
                lastName: "ELearner",
                programmeType: "ND",
                currentLevel: 1,
                studyMode: "elearning",
                matricNumber: "DEMO/EL/001"
            });
            user = { id: uRes.insertId } as any;
        }

        let [exam] = await db.select().from(unifiedExams).where(eq(unifiedExams.title, "MAT 777 Midterm (Demo)"));
        if (!exam) {
            const [eRes] = await db.insert(unifiedExams).values({
                title: "MAT 777 Midterm (Demo)",
                description: "Midterm CBT for MAT 777",
                durationMinutes: 10,
                totalMarks: "10.00",
                passingScore: "5.00",
                contextType: "course",
                courseId: course.id,
                requireAssignment: true,
                isActive: true
            });
            exam = { id: eRes.insertId } as any;

            await db.insert(unifiedExamQuestions).values([
                { examId: exam.id, questionText: "What is 2 + 2?", questionType: "multiple_choice", options: JSON.stringify([{id:"A",text:"3"},{id:"B",text:"4"},{id:"C",text:"5"}]), correctAnswer: "B", marks: "5.00" },
                { examId: exam.id, questionText: "Is the earth flat?", questionType: "true_false", options: JSON.stringify([{id:"A",text:"True"},{id:"B",text:"False"}]), correctAnswer: "B", marks: "5.00" }
            ]);
        }

        const [assignment] = await db.select().from(unifiedExamAssignments).where(eq(unifiedExamAssignments.userId, user.id));
        if (!assignment) {
            await db.insert(unifiedExamAssignments).values({
                examId: exam.id,
                userId: user.id
            });
        }
        return NextResponse.json({ success: true, message: "Successfully seeded!" });
    } catch(e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

