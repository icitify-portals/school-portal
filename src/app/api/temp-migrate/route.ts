import { NextResponse } from 'next/server';
import { db } from "@/db/db";
import { sql, eq, like } from "drizzle-orm";
import { admissionFormTemplates, admissionApplicationsV2 } from "@/db/schema";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    if (searchParams.get('key') !== 'migrate2026') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 1. Get the ND and HND templates
        const ndTemplates = await db.select().from(admissionFormTemplates).where(like(admissionFormTemplates.name, '%(ND)%'));
        const hndTemplates = await db.select().from(admissionFormTemplates).where(like(admissionFormTemplates.name, '%(HND)%'));

        if (ndTemplates.length === 0 || hndTemplates.length === 0) {
            return NextResponse.json({ error: "Could not find (ND) or (HND) templates on this server." });
        }

        const ndTemplateId = ndTemplates[0].id;
        const hndTemplateId = hndTemplates[0].id;

        const uniqueNames = [
            "ABAYOMI FADUNSI",
            "Ifedamola Akinwunmi",
            "Fehintola Aderibigbe",
            "Adeoti Omowunmi",
            "Haliyat Ayanshina",
            "Tunmise Adepoju",
            "Anuoluwapo Ogunsiji",
            "Hammed Obasola",
            "Olayiwola Olayinka",
            "Tosin Owolabi",
            "Sulaimon Matti",
            "Owoiya Ayomide",
            "ABDULBASIT OYEKANMI",
            "Damilola Akiode",
            "MOTUNRAYO Ajayi",
            "Mary Oladeji"
        ];

        let updatedCount = 0;
        const updatedUsers = [];

        for (const name of uniqueNames) {
            const parts = name.split(" ").filter(p => p.trim() !== "");
            const res = await db.execute(sql`
                SELECT u.id as user_id 
                FROM users u
                WHERE u.name LIKE ${'%' + parts[0] + '%'} AND u.name LIKE ${'%' + (parts[1] || '') + '%'}
            `);

            if (res[0] && (res[0] as any).length > 0) {
                const user = (res[0] as any)[0];
                
                // Move the application from ND template to HND template
                await db.execute(sql`
                    UPDATE admission_applications_v2
                    SET template_id = ${hndTemplateId}
                    WHERE applicant_id = ${user.user_id} AND template_id = ${ndTemplateId}
                `);

                // Also try to update programme_id if we know their old one
                try {
                    const progRes = await db.execute(sql`
                        SELECT programme_id FROM students WHERE user_id = ${user.user_id}
                    `);
                    if (progRes[0] && (progRes[0] as any).length > 0) {
                        const oldProgId = (progRes[0] as any)[0].programme_id;
                        const mapping: Record<number, number> = {
                            8: 14, // OND Computer Science -> HND Computer Science
                            12: 18, // OND Business Admin -> HND Business Admin
                            13: 19, // OND Accountancy -> HND Accountancy
                            11: 17, // OND Statistics -> HND Statistics
                        };
                        const newProgId = mapping[oldProgId];
                        if (newProgId) {
                            await db.execute(sql`
                                UPDATE admission_applications_v2
                                SET programme_id = ${newProgId}
                                WHERE applicant_id = ${user.user_id} AND template_id = ${hndTemplateId}
                            `);
                        }
                    }
                } catch (e) {
                    // ignore if it fails
                }

                updatedUsers.push(name);
                updatedCount++;
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: `Successfully moved applications from ND Template (ID: ${ndTemplateId}) to HND Template (ID: ${hndTemplateId}).`,
            updatedCount,
            updatedUsers
        });

    } catch (err: any) {
        console.error("Migration failed:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
