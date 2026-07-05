import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db/db";
import {
    students,
    semesterSummaries,
    results,
    enrollments,
    courses,
    academicSessions,
    users,
    departments,
    programmes,
    systemSettings,
    institutionalUnits
} from "@/db/schema";
import { eq, and, asc, sql } from "drizzle-orm";
import StudentResults from "@/components/lms/StudentResults";
import { OfficialService } from "@/services/OfficialService";

export const dynamic = "force-dynamic";

export default async function ResultsPage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login");
    }

    const userId = parseInt(session.user.id);

    let student: any = null;
    let summaries: any[] = [];
    let brandingRows: any[] = [];
    let sessionsData: any[] = [];
    let currentCgpa = 0;

    try {
        // 1. Get Student Profile
        const studentRows = await db.select({
            student: students,
            programme: programmes,
            department: departments,
            user: users,
            unit: institutionalUnits
        })
            .from(students)
            .leftJoin(programmes, eq(students.programmeId, programmes.id))
            .leftJoin(departments, eq(students.deptId, departments.id))
            .leftJoin(users, eq(students.userId, users.id))
            .leftJoin(institutionalUnits, eq(students.unitId, institutionalUnits.id))
            .where(eq(students.userId, userId))
            .limit(1);

        student = studentRows[0] ? {
            ...studentRows[0].student,
            programme: studentRows[0].programme,
            department: studentRows[0].department,
            user: studentRows[0].user,
            academicTier: studentRows[0].unit?.academicTier || 'tertiary'
        } : null;

        if (student) {
            // 2. Fetch All Semester Summaries
            summaries = await db.select().from(semesterSummaries)
                .where(eq(semesterSummaries.studentId, student.id))
                .orderBy(asc(semesterSummaries.sessionId), asc(semesterSummaries.semester));

            // 3. Fetch Branding Settings
            brandingRows = await db.select().from(systemSettings)
                .where(sql`${systemSettings.settingKey} IN ('institution_name', 'institution_motto', 'institution_logo')`);

            // 4. Construct Session/Semester Data Structure
            const sessionIds = Array.from(new Set(summaries.map(s => s.sessionId)));

            for (const sId of sessionIds) {
                const [academicSession] = await db.select().from(academicSessions).where(eq(academicSessions.id, sId)).limit(1);
                if (!academicSession) continue;

                const sessionSemesters = summaries.filter(s => s.sessionId === sId);
                const semestersData = [];

                for (const summary of sessionSemesters) {
                    // Fetch courses for this specific semester
                    const courseResults = await db.select({
                        code: courses.code,
                        title: courses.name,
                        units: courses.creditUnits,
                        score: results.totalScore,
                        grade: results.grade,
                        gp: results.gradePoint,
                    })
                        .from(results)
                        .innerJoin(enrollments, eq(results.enrollmentId, enrollments.id))
                        .innerJoin(courses, eq(enrollments.courseId, courses.id))
                        .where(and(
                            eq(enrollments.studentId, student.id),
                            eq(enrollments.academicYear, academicSession.name),
                            eq(enrollments.semester, parseInt(summary.semester))
                        ));

                    semestersData.push({
                        number: summary.semester,
                        gpa: parseFloat(summary.gpa?.toString() || '0'),
                        tcr: summary.tcr || 0,
                        tce: summary.tce || 0,
                        courses: courseResults.map(r => ({
                            code: r.code,
                            title: r.title,
                            units: r.units,
                            score: parseFloat(r.score?.toString() || '0'),
                            grade: r.grade || 'N/A',
                            gp: parseFloat(r.gp?.toString() || '0')
                        }))
                    });
                }

                sessionsData.push({
                    name: academicSession.name,
                    semesters: semestersData
                });
            }

            // 5. Calculate Current CGPA
            currentCgpa = summaries.length > 0
                ? parseFloat(summaries[summaries.length - 1].cgpa?.toString() || '0')
                : 0;
        }
    } catch (error) {
        console.error("Results page data fetch error:", error);
    }
    const branding = {
        name: brandingRows.find(r => ['institution_name', 'portal_name', 'INST_NAME'].includes(r.settingKey))?.settingValue || "FSS Portal",
        motto: brandingRows.find(r => ['institution_motto', 'school_motto', 'INST_MOTTO'].includes(r.settingKey))?.settingValue || "Excellence in Learning",
        logoUrl: brandingRows.find(r => ['institution_logo', 'portal_logo', 'INST_LOGO'].includes(r.settingKey))?.settingValue || "/logo.png"
    };

    // 6. Fetch Official Signatures (Server Side)
    const [registrarSig, headSig] = await Promise.all([
        OfficialService.getRegistrarSignature(),
        student ? OfficialService.getAcademicHeadSignature(student.unitId) : Promise.resolve(null)
    ]);

    if (!student) {
        return <div className="p-8 text-center text-slate-500 font-bold uppercase tracking-widest">Student record not found.</div>;
    }

    return (
        <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
            <div className="max-w-6xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase tracking-widest">Academic Records</h1>
                    <p className="text-slate-500 font-medium">Detailed breakdown of your performance across sessions.</p>
                </div>

                <StudentResults
                    student={{
                        name: student.user?.name || "",
                        matricNumber: student.matricNumber || "",
                        department: student.department?.name || "",
                        level: student.currentLevel || 100,
                        programme: student.programme?.name || "",
                        unitId: student.unitId
                    }}
                    sessions={sessionsData}
                    cgpa={currentCgpa}
                    branding={branding}
                    signatures={{
                        registrar: registrarSig ? { name: registrarSig.name, signatureUrl: registrarSig.signatureUrl || undefined } : undefined,
                        head: headSig ? { name: headSig.name, signatureUrl: headSig.signatureUrl || undefined } : undefined
                    }}
                />
            </div>
        </div>
    );
}

