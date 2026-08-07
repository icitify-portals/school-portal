import { db } from '@/db/db';
import { admissionApplicationsV2, users, students, admissionFormTemplates } from '@/db/schema';
import { eq, inArray, like, and, isNull, not } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

async function run() {
    console.log("Fetching recent applicants to identify the remaining 16...");
    
    // Let's first fetch the total applicants for HND templates
    const allApps = await db.select({
        appId: admissionApplicationsV2.id,
        userId: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        templateName: admissionFormTemplates.name,
        studentId: students.id
    })
    .from(admissionApplicationsV2)
    .leftJoin(users, eq(admissionApplicationsV2.applicantId, users.id))
    .leftJoin(admissionFormTemplates, eq(admissionApplicationsV2.templateId, admissionFormTemplates.id))
    .leftJoin(students, eq(users.id, students.userId))
    .where(
        like(admissionFormTemplates.name, '%HND%')
    );

    console.log(`Total HND applicants found: ${allApps.length}`);

    // The user says "others that are not students that uses fresh email"
    // "not students" = they don't have a record in the students table linked to their user account, or they haven't been assigned a formal student email.
    
    const notStudents = allApps.filter(a => !a.studentId);
    console.log(`\nHND applicants that are NOT linked to a student account: ${notStudents.length}`);
    
    notStudents.forEach((a, i) => {
        console.log(`${i+1}. Name: ${a.name}, Email: ${a.email}, Phone: ${a.phone}, AppID: ${a.appId}`);
    });

    const notStudentEmails = allApps.filter(a => a.email && !a.email.includes('fssibadan.edu.ng'));
    console.log(`\nHND applicants with non-institutional emails (gmail, yahoo, etc): ${notStudentEmails.length}`);
    notStudentEmails.forEach((a, i) => {
        // console.log(`${i+1}. Name: ${a.name}, Email: ${a.email}, Phone: ${a.phone}`);
    });
    
    process.exit(0);
}

run();
