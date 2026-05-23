import { db } from "@/db/db";
import { userRoles, roles, staffProfiles, institutionalUnits, users as usersTable } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export class OfficialService {
    /**
     * Finds the official signature for a specific role and branch (unit).
     * Falls back to a global official if no unit-specific one is found.
     */
    static async getOfficialSignature(roleName: string, unitId?: number) {
        try {
            // Find role ID
            const [role] = await db.select().from(roles).where(eq(roles.name, roleName)).limit(1);
            if (!role) return null;

            // Find user assigned to this role in this unit
            // Find user assigned to this role, prioritizing unit match
            const baseQuery = db.select({
                signatureUrl: staffProfiles.signatureUrl,
                isDigital: staffProfiles.isSignatureDigital,
                name: usersTable.name,
                unitId: userRoles.unitId
            })
            .from(userRoles)
            .innerJoin(usersTable, eq(userRoles.userId, usersTable.id))
            .innerJoin(staffProfiles, eq(usersTable.id, staffProfiles.userId))
            .where(eq(userRoles.roleId, role.id));

            const officials = await baseQuery;

            if (unitId) {
                const unitSpecific = officials.find(o => o.unitId === unitId);
                if (unitSpecific && unitSpecific.signatureUrl) return unitSpecific;
            }

            // Fallback to global (where unitId is null)
            const globalOfficial = officials.find(o => o.unitId === null);
            return globalOfficial || null;
        } catch (error) {
            console.error(`Error fetching signature for ${roleName}:`, error);
            return null;
        }
    }

    /**
     * Convenience method for Bursar (Receipts)
     */
    static async getBursarSignature(unitId?: number) {
        return this.getOfficialSignature('Bursar', unitId);
    }

    /**
     * Convenience method for Principal/Headteacher (Report Cards)
     */
    static async getAcademicHeadSignature(unitId?: number, isPrimary: boolean = true) {
        return this.getOfficialSignature(isPrimary ? 'Headteacher' : 'Principal', unitId);
    }

    /**
     * Convenience method for Registrar (Transcripts)
     */
    static async getRegistrarSignature() {
        return this.getOfficialSignature('Registrar');
    }
}
