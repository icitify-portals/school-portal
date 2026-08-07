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

        // only the 16 with phone
        const targetApplicants = newApplicants.filter(a => a.phone != null && a.phone.length > 5);

        let logs: string[] = [];
        let matches: any[] = [];

        // Pre-fetch all old students for fast matching
        const oldStudents = await db.select({
            userId: users.id,
            name: users.name,
            email: users.email,
            phone: users.phone,
            studentId: students.id,
        })
        .from(users)
        .innerJoin(students, eq(users.id, students.userId));

        const normalize = (str: string | null) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');

        for (const applicant of targetApplicants) {
            const newPhone = normalize(applicant.phone);

            const possibleMatches = oldStudents.filter(old => {
                const oldPhone = normalize(old.phone);
                
                // Match by exact phone OR normalized name
                if (newPhone && oldPhone && newPhone === oldPhone) return true;
                if (applicant.name && old.name) {
                    // Check if all parts of new name are in old name (or vice versa)
                    const newParts = applicant.name.toLowerCase().split(/\s+/).filter(Boolean);
                    const oldParts = old.name.toLowerCase().split(/\s+/).filter(Boolean);
                    
                    const commonParts = newParts.filter(p => oldParts.includes(p));
                    if (commonParts.length >= 2) return true; // at least 2 matching name parts (first & last)
                }
                return false;
            });

            if (possibleMatches.length === 1) {
                const oldUser = possibleMatches[0];
                matches.push({
                    newUserId: applicant.userId,
                    oldUserId: oldUser.userId,
                    name: applicant.name,
                    oldName: oldUser.name,
                    newEmail: applicant.email,
                    oldEmail: oldUser.email,
                    appId: applicant.appId
                });
            } else if (possibleMatches.length > 1) {
                 logs.push(`Could not automatically match ${applicant.name}. Found ${possibleMatches.length} possible matches: ${possibleMatches.map(m=>m.name).join(', ')}.`);
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
            targetCount: targetApplicants.length,
            matchCount: matches.length,
            matches, 
            logs, 
            executed: execute 
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
