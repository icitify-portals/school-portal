import { NextResponse } from 'next/server';
import { db } from '@/db/db';
import { admissionApplicationsV2, users, students, admissionFormTemplates } from '@/db/schema';
import { eq, like, and, isNull, not, inArray } from 'drizzle-orm';

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const execute = url.searchParams.get('execute') === 'true';

        // 1. Get the HND templates
        const hndTemplates = await db.select().from(admissionFormTemplates).where(like(admissionFormTemplates.name, '%HND%'));
        const hndTemplateIds = hndTemplates.map(t => t.id);

        if (hndTemplateIds.length === 0) {
            return NextResponse.json({ error: "No HND templates found" });
        }

        // 2. Find new applicants
        const newApplicants = await db.select({
            appId: admissionApplicationsV2.id,
            userId: users.id,
            name: users.name,
            email: users.email,
            phone: users.phone
        })
        .from(admissionApplicationsV2)
        .innerJoin(users, eq(admissionApplicationsV2.applicantId, users.id))
        .leftJoin(students, eq(users.id, students.userId))
        .where(
            and(
                inArray(admissionApplicationsV2.templateId, hndTemplateIds),
                isNull(students.id),
                not(like(users.email, '%fssibadan.edu.ng%'))
            )
        );

        let logs: string[] = [];
        let matches: any[] = [];

        for (const applicant of newApplicants) {
            // Find old student record by name
            const oldUsers = await db.select({
                userId: users.id,
                name: users.name,
                email: users.email,
                studentId: students.id,
                matricNumber: students.matricNumber
            })
            .from(users)
            .innerJoin(students, eq(users.id, students.userId))
            .where(eq(users.name, applicant.name));

            if (oldUsers.length === 1) {
                const oldUser = oldUsers[0];
                matches.push({
                    newUserId: applicant.userId,
                    oldUserId: oldUser.userId,
                    name: applicant.name,
                    newEmail: applicant.email,
                    oldEmail: oldUser.email,
                    appId: applicant.appId
                });
            } else if (oldUsers.length > 1) {
                 logs.push(`Could not automatically match ${applicant.name}. Found ${oldUsers.length} old student records.`);
            } else {
                 logs.push(`Could not automatically match ${applicant.name}. No old student record found.`);
            }
        }

        if (execute) {
            for (const match of matches) {
                // Update old user email
                await db.update(users)
                    .set({ email: match.newEmail })
                    .where(eq(users.id, match.oldUserId));
                
                // Transfer application
                await db.update(admissionApplicationsV2)
                    .set({ applicantId: match.oldUserId })
                    .where(eq(admissionApplicationsV2.id, match.appId));

                // Delete the new user record
                await db.delete(users).where(eq(users.id, match.newUserId));

                logs.push(`Successfully merged ${match.name}`);
            }
        }

        return NextResponse.json({ 
            totalNewApplicantsFound: newApplicants.length,
            totalMatchesFound: matches.length,
            matches, 
            logs, 
            executed: execute 
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
