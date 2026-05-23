import { db } from "@/db/db";
import { 
    users, 
    userPermissions, 
    staffProfiles 
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export class UserService {

    /**
     * Checks if a user has a specific permission.
     * Ported from Rust 'User::hasPermission'.
     */
    static async hasPermission(userId: number, permissionKey: string) {
        // 1. Check direct user-level permissions
        const direct = await db.select()
            .from(userPermissions)
            .where(and(
                eq(userPermissions.userId, userId),
                eq(userPermissions.permissionKey, permissionKey)
            ))
            .limit(1);
        
        if (direct[0]) return direct[0].isGranted;

        // 2. Fallback to Role-based logic (can be expanded to check roles/clearance)
        const user = await db.select({ role: users.role })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);
        
        if (user[0]?.role === 'superadmin' || user[0]?.role === 'icitify_dev') return true;

        return false;
    }

    /**
     * Grants or revokes a permission for a user.
     * Ported from Rust 'User::setPermission'.
     */
    static async setPermission(userId: number, permissionKey: string, isGranted: boolean, grantedBy: number) {
        // Check if permission already recorded
        const existing = await db.select()
            .from(userPermissions)
            .where(and(
                eq(userPermissions.userId, userId),
                eq(userPermissions.permissionKey, permissionKey)
            )).limit(1);

        if (existing[0]) {
            await db.update(userPermissions)
                .set({ isGranted, grantedBy })
                .where(eq(userPermissions.id, existing[0].id));
        } else {
            await db.insert(userPermissions).values({
                userId,
                permissionKey,
                isGranted,
                grantedBy
            });
        }
        return { success: true };
    }

    /**
     * Updates the professional office description for a user.
     * Ported from Rust 'User::describe_office'.
     */
    static async describeOffice(userId: number, description: string) {
        return await db.update(users)
            .set({ officeDescription: description })
            .where(eq(users.id, userId));
    }

    /**
     * Changes the institutional branch for a user.
     * Ported from Rust 'User::change_branch'.
     */
    static async changeBranch(userId: number, branchId: number) {
        // This usually involves updating the user's active session or staff profile branch
        return await db.update(staffProfiles)
            .set({ departmentId: branchId }) // Simplified for this implementation
            .where(eq(staffProfiles.userId, userId));
    }

    /**
     * Updates a specific profile property for a user.
     * Ported from Rust 'User::update_profile'.
     */
    static async updateProfile(userId: number, property: string, value: string) {
        const allowedProperties = ['name', 'email', 'phone', 'officeDescription', 'imageUrl'];
        if (!allowedProperties.includes(property)) throw new Error(`Invalid property: ${property}`);

        return await db.update(users)
            .set({ [property]: value })
            .where(eq(users.id, userId));
    }

    /**
     * Generates a temporary access token to view another user's account.
     * Ported from Rust 'User::view_account'.
     */
    static async viewAccount(adminId: number, targetUserId: number) {
        // 1. Verify target exists
        const target = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);
        if (!target[0]) throw new Error("Target user not found.");

        // 2. Generate temporary session token (Simulated)
        const token = `VIEW-${crypto.randomUUID()}`;
        
        // 3. Log the impersonation event for audit
        console.log(`[AUDIT] Admin ${adminId} assumed identity of User ${targetUserId} (${target[0].name})`);

        return { token, targetName: target[0].name };
    }

    /**
     * Deletes a user account.
     * Ported from Rust 'User::delete'.
     */
    static async deleteUser(userId: number) {
        return await db.update(users)
            .set({ deletedAt: new Date() })
            .where(eq(users.id, userId));
    }
}
