import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db/db";
import { institutionalUnits, academicSessions, systemConfig, studentGroups } from "@/db/schema";
import { eq } from "drizzle-orm";
import InstitutionSettings from "./_components/InstitutionSettings";
import { decrypt } from "@/lib/encryption";

export default async function InstitutionalSettingsPage() {
    const session = await auth();

    if (!session || !['admin', 'superadmin'].includes((session.user as any).role)) {
        redirect("/login");
    }

    // Fetch required data
    const units = await db.select().from(institutionalUnits);
    const currentSession = await db.query.academicSessions.findFirst({
        where: eq(academicSessions.isCurrent, true)
    });
    
    const settingsRaw = await db.select().from(systemConfig);
    const settings = settingsRaw.reduce((acc: Record<string, string>, curr) => {
        acc[curr.key] = curr.isEncrypted ? decrypt(curr.value) : curr.value;
        return acc;
    }, {});

    const classGroups = await db.select().from(studentGroups);

    return (
        <div className="container mx-auto py-10 px-4 max-w-7xl">
            <InstitutionSettings 
                units={units}
                currentSession={currentSession}
                initialSettings={settings}
                classGroups={classGroups}
            />
        </div>
    );
}
