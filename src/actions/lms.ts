"use server";

import { db } from "@/db/db";
import {
    courseModules,
    courseLessons,
    studentProgress,
    assignments,
    quizzes,
    examSlots,
    courses,
    assignmentSubmissions,
    gradingRubrics,
    rubricCriteria
} from "@/db/schema";
import { eq, and, asc, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { AssignmentService } from "@/services/AssignmentService";
import { CredentialService } from "@/services/CredentialService";

// --- STUDENT ACTIONS ---

export async function getCourseContent(courseId: number, studentId?: number) {
    try {
        // Fetch modules
        const modules = await db.select().from(courseModules)
            .where(eq(courseModules.courseId, courseId))
            .orderBy(asc(courseModules.order));

        // Fetch lessons for all modules
        // Optimization: In a real app we might fetch per module or use a join, 
        // but for simplicity we fetch all for the course's modules.
        // Drizzle doesn't have a simple "whereIn" for subquery easily without some verbosity,
        // so let's fetch lessons and filter in JS or use a join if we want to be strict.

        // Let's get all lessons linked to these modules.
        const moduleIds = modules.map(m => m.id);
        let lessons: any[] = [];
        let courseAssignments: any[] = [];
        let courseQuizzes: any[] = [];

        if (moduleIds.length > 0) {
            const allLessons = await db.select().from(courseLessons); // Should filter by moduleIds in production
            lessons = allLessons.filter(l => moduleIds.includes(l.moduleId)).sort((a, b) => a.order - b.order);

            // Fetch Assignments & Quizzes
            courseAssignments = await db.select().from(assignments).where(eq(assignments.courseId, courseId));
            
            // Join quizzes with examSlots
            courseQuizzes = await db.select({
                quiz: quizzes,
                slot: examSlots
            })
            .from(quizzes)
            .leftJoin(examSlots, eq(quizzes.slotId, examSlots.id))
            .where(eq(quizzes.courseId, courseId));
        }

        // Fetch progress if studentId is provided
        let progressMap: Record<string, any> = {};
        let submissionMap: Record<string, any> = {};

        if (studentId) {
            const prog = await db.select().from(studentProgress)
                .where(and(
                    eq(studentProgress.studentId, studentId),
                    eq(studentProgress.courseId, courseId)
                ));

            prog.forEach(p => {
                if (p.moduleId) progressMap[`module-${p.moduleId}`] = p;
                if (p.lessonId) progressMap[`lesson-${p.lessonId}`] = p;
            });

            // Fetch Assignments Submissions
            // Need to import assignmentSubmissions schema
            const subs = await db.select().from(assignmentSubmissions)
                .where(eq(assignmentSubmissions.studentId, studentId));

            subs.forEach(s => {
                submissionMap[`assignment-${s.assignmentId}`] = s;
            });
        }

        // Structure the response
        const content = modules.map(m => {
            const moduleLessons = lessons.filter(l => l.moduleId === m.id);
            const isCompleted = progressMap[`module-${m.id}`]?.isCompleted || false;

            // Check Lock Status
            let isLocked = m.isLocked;
            if (!isLocked && m.prerequisiteModuleId) {
                const prereq = progressMap[`module-${m.prerequisiteModuleId}`];
                if (!prereq?.isCompleted) isLocked = true;
            }

            return {
                ...m,
                lessons: moduleLessons.map(l => {
                    const lProg = progressMap[`lesson-${l.id}`];
                    let lLocked = isLocked;

                    if (!lLocked && l.prerequisiteLessonId) {
                        const lPrereq = progressMap[`lesson-${l.prerequisiteLessonId}`];
                        if (!lPrereq?.isCompleted) lLocked = true;
                    }

                    // Attach Assignment/Quiz Data
                    let extendedData = {};
                    if (l.contentType === 'assignment') {
                        const assign = courseAssignments.find(a => a.lessonId === l.id);
                        extendedData = {
                            assignment: assign,
                            submission: assign ? submissionMap[`assignment-${assign.id}`] : undefined
                        };
                    } else if (l.contentType === 'quiz') {
                        const qObj = courseQuizzes.find(q => q.quiz.lessonId === l.id);
                        extendedData = { 
                            quiz: qObj ? { ...qObj.quiz, slot: qObj.slot } : undefined 
                        };
                    }

                    return {
                        ...l,
                        ...extendedData,
                        isLocked: lLocked,
                        isCompleted: lProg?.isCompleted || false,
                        lastAccessed: lProg?.lastAccessed
                    };
                }),
                isLocked,
                isCompleted
            };
        });

        return { success: true, content };
    } catch (error) {
        console.error("Failed to get course content:", error);
        return { success: false, error: "Failed to load course content" };
    }
}

export async function updateProgress(studentId: number, courseId: number, itemId: number, itemType: 'module' | 'lesson', isCompleted: boolean = true) {
    try {
        const existing = await db.select().from(studentProgress)
            .where(and(
                eq(studentProgress.studentId, studentId),
                itemType === 'module' ? eq(studentProgress.moduleId, itemId) : eq(studentProgress.lessonId, itemId)
            ))
            .limit(1);

        if (existing.length > 0) {
            await db.update(studentProgress)
                .set({
                    isCompleted,
                    lastAccessed: new Date()
                })
                .where(eq(studentProgress.id, existing[0].id));
        } else {
            await db.insert(studentProgress).values({
                studentId,
                courseId,
                moduleId: itemType === 'module' ? itemId : undefined,
                lessonId: itemType === 'lesson' ? itemId : undefined,
                isCompleted,
                lastAccessed: new Date()
            });
        }

        // --- NEW: Module Completion Logic ---
        if (itemType === 'lesson' && isCompleted) {
            // Check if all lessons in this module are complete
            const lesson = await db.select().from(courseLessons).where(eq(courseLessons.id, itemId)).limit(1);
            if (lesson.length > 0) {
                const moduleId = lesson[0].moduleId;
                const moduleLessons = await db.select().from(courseLessons).where(eq(courseLessons.moduleId, moduleId));
                const completedLessons = await db.select().from(studentProgress)
                    .where(and(
                        eq(studentProgress.studentId, studentId),
                        eq(studentProgress.isCompleted, true)
                    ));

                const completedIds = completedLessons.filter(p => !!p.lessonId).map(p => p.lessonId!);
                const allComplete = moduleLessons.every(l => completedIds.includes(l.id));

                if (allComplete) {
                    // Mark module as complete
                    const modExists = await db.select().from(studentProgress)
                        .where(and(
                            eq(studentProgress.studentId, studentId),
                            eq(studentProgress.moduleId, moduleId)
                        )).limit(1);

                    if (modExists.length > 0) {
                        await db.update(studentProgress).set({ isCompleted: true }).where(eq(studentProgress.id, modExists[0].id));
                    } else {
                        await db.insert(studentProgress).values({
                            studentId, courseId, moduleId, isCompleted: true
                        });
                    }
                }
            }
        }

        // --- NEW: Calculate Total Progress ---
        const allLessons = await db.select().from(courseLessons)
            .innerJoin(courseModules, eq(courseLessons.moduleId, courseModules.id))
            .where(eq(courseModules.courseId, courseId));

        const completedLessons = await db.select().from(studentProgress)
            .where(and(
                eq(studentProgress.studentId, studentId),
                eq(studentProgress.courseId, courseId),
                eq(studentProgress.isCompleted, true)
            ));

        const completedLessonIds = completedLessons.filter(p => !!p.lessonId).map(p => p.lessonId!);
        const totalLessonsCount = allLessons.length;
        const totalCompletedCount = allLessons.filter(l => completedLessonIds.includes(l.course_lessons.id)).length;

        const percentage = totalLessonsCount > 0 ? (totalCompletedCount / totalLessonsCount) * 100 : 0;
        const isCourseComplete = percentage >= 100;

        if (isCourseComplete) {
            await CredentialService.checkAndIssueCourseCertificate(courseId, studentId);
        }

        revalidatePath(`/student/classroom/${courseId}`);
        return {
            success: true,
            percentage,
            isCourseComplete
        };
    } catch (error) {
        console.error("Failed to update progress:", error);
        return { success: false, error: "Failed to save progress" };
    }
}

// --- TEACHER ACTIONS ---

export async function createModule(courseId: number, title: string, order: number) {
    try {
        await db.insert(courseModules).values({
            courseId,
            title,
            order
        });
        revalidatePath(`/teacher/courses/${courseId}`);
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to create module" };
    }
}

export async function createLesson(moduleId: number, title: string, order: number, type: 'text' | 'video' | 'pdf' | 'scorm' | 'quiz' | 'assignment', content?: string) {
    try {
        // Get Course ID
        const module = await db.select().from(courseModules).where(eq(courseModules.id, moduleId)).limit(1);
        if (!module.length) return { success: false, error: "Module not found" };
        const courseId = module[0].courseId;

        // Create Lesson
        const [res] = await db.insert(courseLessons).values({
            moduleId,
            title,
            order,
            contentType: type,
            contentUrl: ['video', 'pdf', 'scorm'].includes(type) ? content : undefined,
            contentBody: type === 'text' ? content : undefined
        });

        const lessonId = res.insertId;

        // Create Linked Entity
        if (type === 'assignment') {
            await db.insert(assignments).values({
                courseId,
                moduleId,
                lessonId,
                title,
                description: "New Assignment Description", // Placeholder
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 1 week
            });
        } else if (type === 'quiz') {
            await db.insert(quizzes).values({
                courseId,
                moduleId,
                lessonId,
                title,
                description: "New Quiz Description",
                timeLimitMinutes: 30,
            });
        }

        revalidatePath(`/teacher/courses/${courseId}`);
        return { success: true };
    } catch (error) {
        console.error("Create lesson error:", error);
        return { success: false, error: "Failed to create lesson" };
    }
}

export async function deleteModule(moduleId: number, courseId: number) {
    try {
        await db.delete(courseModules).where(eq(courseModules.id, moduleId));
        revalidatePath(`/teacher/courses/${courseId}`); // Fix path to match editor
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to delete module" };
    }
}

export async function deleteLesson(lessonId: number, courseId: number) {
    try {
        await db.delete(courseLessons).where(eq(courseLessons.id, lessonId));
        revalidatePath(`/teacher/courses/${courseId}`);
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to delete lesson" };
    }
}

export async function reorderModules(items: { id: number; order: number }[], courseId: number) {
    try {
        await db.transaction(async (tx) => {
            for (const item of items) {
                await tx.update(courseModules)
                    .set({ order: item.order })
                    .where(eq(courseModules.id, item.id));
            }
        });
        revalidatePath(`/teacher/courses/${courseId}`);
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to reorder modules" };
    }
}

export async function updateLessonContent(
    lessonId: number,
    data: {
        title: string;
        contentBody?: string;
        contentUrl?: string;
        // Assignment specific
        dueDate?: Date;
        maxScore?: number;
        assignmentDescription?: string;
        // Quiz specific
        timeLimit?: number;
        passingScore?: number;
        quizDescription?: string;
        // Advanced Assignment
        cutOffDate?: Date;
        submissionTypes?: string[]; // JSON array
        rubricId?: number;
        includeInCa?: boolean;
        caAveragingMethod?: 'simple' | 'weighted';
        allowResubmission?: boolean;
        // Robust Quiz Fields
        quizType?: 'standard' | 'examination';
        slotId?: number | null;
        visibilityRule?: 'always' | 'scheduled';
        gracePeriodMinutes?: number;
        availableFrom?: Date;
        availableUntil?: Date;
    }
) {
    try {
        // Update Lesson Base
        await db.update(courseLessons).set({
            title: data.title,
            contentBody: data.contentBody,
            contentUrl: data.contentUrl,
        }).where(eq(courseLessons.id, lessonId));

        // Update Assignment if linked
        if (data.dueDate || data.maxScore !== undefined || data.assignmentDescription || data.cutOffDate || data.submissionTypes || data.rubricId !== undefined) {
            await db.update(assignments).set({
                title: data.title, // Sync title
                description: data.assignmentDescription,
                dueDate: data.dueDate,
                cutOffDate: data.cutOffDate,
                maxScore: data.maxScore,
                submissionTypes: data.submissionTypes ? JSON.stringify(data.submissionTypes) : undefined,
                rubricId: data.rubricId,
                includeInCa: data.includeInCa,
                caAveragingMethod: data.caAveragingMethod,
                allowResubmission: data.allowResubmission
            }).where(eq(assignments.lessonId, lessonId));
        }

        // Update Quiz if linked
        if (
            data.timeLimit !== undefined || 
            data.passingScore !== undefined || 
            data.quizDescription ||
            data.quizType ||
            data.slotId !== undefined ||
            data.visibilityRule ||
            data.gracePeriodMinutes !== undefined ||
            data.availableFrom !== undefined ||
            data.availableUntil !== undefined ||
            data.includeInCa !== undefined ||
            data.caAveragingMethod !== undefined
        ) {
            await db.update(quizzes).set({
                title: data.title,
                description: data.quizDescription,
                timeLimitMinutes: data.timeLimit,
                passingScore: data.passingScore,
                quizType: data.quizType,
                slotId: data.slotId,
                visibilityRule: data.visibilityRule,
                gracePeriodMinutes: data.gracePeriodMinutes,
                availableFrom: data.availableFrom,
                availableUntil: data.availableUntil,
                includeInCa: data.includeInCa,
                caAveragingMethod: data.caAveragingMethod
            }).where(eq(quizzes.lessonId, lessonId));
        }

        revalidatePath(`/staff/courses`);
        return { success: true };
    } catch (error) {
        console.error("Update lesson error:", error);
        return { success: false, error: "Failed to update lesson" };
    }
}

export async function updateModuleSettings(
    moduleId: number,
    courseId: number,
    data: {
        isLocked?: boolean;
        prerequisiteModuleId?: number | null;
        title?: string;
    }
) {
    try {
        await db.update(courseModules)
            .set({
                isLocked: data.isLocked,
                prerequisiteModuleId: data.prerequisiteModuleId,
                title: data.title
            })
            .where(eq(courseModules.id, moduleId));

        revalidatePath(`/staff/courses/${courseId}/editor`);
        return { success: true };
    } catch (error) {
        console.error("Update module settings error:", error);
        return { success: false, error: "Failed to update module settings" };
    }
}

export async function updateLessonSettings(
    lessonId: number,
    courseId: number,
    data: {
        prerequisiteLessonId?: number | null;
    }
) {
    try {
        await db.update(courseLessons)
            .set({
                prerequisiteLessonId: data.prerequisiteLessonId
            })
            .where(eq(courseLessons.id, lessonId));

        revalidatePath(`/staff/courses/${courseId}/editor`);
        return { success: true };
    } catch (error) {
        console.error("Update lesson settings error:", error);
        return { success: false, error: "Failed to update lesson settings" };
    }
}

export async function submitAssignment(assignmentId: number, studentId: number, data: { 
    fileUrl?: string; 
    onlineText?: string;
    audioUrl?: string;
    externalLinks?: string;
    cloudFileUrl?: string;
    cloudFileType?: string;
}) {
    try {
        const res = await AssignmentService.submitAssignment({
            assignmentId,
            studentId,
            ...data
        });

        revalidatePath(`/student/classroom/any`); // Revalidate all potentially
        return res;
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function gradeAssignmentSubmission(data: {
    submissionId: number;
    gradedBy: number;
    score?: number;
    feedback?: string;
    annotations?: any[];
    rubricGrades?: { criterionId: number; points: number; feedback?: string }[];
}) {
    try {
        const res = await AssignmentService.gradeSubmission(data);
        revalidatePath(`/staff/grading`);
        return res;
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function createGradingRubric(data: {
    title: string;
    description?: string;
    courseId?: number;
    criteria: { title: string; weight: number; levels: any[]; order: number }[];
}) {
    try {
        const res = await AssignmentService.createRubric(data);
        return res;
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function getRubrics(courseId?: number) {
    try {
        const rubrics = await db.select().from(gradingRubrics).where(courseId ? eq(gradingRubrics.courseId, courseId) : undefined);
        const criteria = await db.select().from(rubricCriteria).orderBy(asc(rubricCriteria.order));

        return {
            success: true,
            rubrics: rubrics.map(r => ({
                ...r,
                criteria: criteria.filter(c => c.rubricId === r.id)
            }))
        };
    } catch (error) {
        return { success: false, error: "Failed to fetch rubrics" };
    }
}

export async function createCourseFromAI(courseId: number, modules: { title: string; lessons: string[] }[]) {
    try {
        // We could run this in a transaction but for simplicity and to reuse existing logic we'll loop.
        // Or better, explicit loop here to avoid overhead of function calls if possible, but createLesson has logic.
        // Let's reuse createModule and createLesson but we need to manage order manually.

        let moduleOrder = 1; // start after existing? Or assume empty? 
        // Best to fetch current max order.
        const existingModules = await db.select().from(courseModules).where(eq(courseModules.courseId, courseId));
        moduleOrder = existingModules.length + 1;

        for (const mod of modules) {
            // Create Module
            const [mRes] = await db.insert(courseModules).values({
                courseId,
                title: mod.title,
                order: moduleOrder++
            });
            const moduleId = mRes.insertId;

            // Create Lessons
            if (mod.lessons && mod.lessons.length > 0) {
                let lessonOrder = 1;
                for (const lessonTitle of mod.lessons) {
                    await db.insert(courseLessons).values({
                        moduleId,
                        title: lessonTitle,
                        order: lessonOrder++,
                        contentType: 'text', // Default to text for AI generated structure
                        contentBody: "" // Empty content to be filled later
                    });
                }
            }
        }

        revalidatePath(`/teacher/courses/${courseId}`);
        return { success: true };

    } catch (error) {
        console.error("Create course from AI error:", error);
        return { success: false, error: "Failed to create course structure" };
    }
}
