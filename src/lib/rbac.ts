import { auth } from "@/auth";

export async function getSessionPermissions() {
    const session = await auth();
    return (session?.user as any)?.permissions || [];
}

export async function hasPermission(permission: string) {
    const session = await auth();
    const baseRole = (session?.user as any)?.role;
    
    // Absolute power for developer and superadmin
    if (baseRole === "icitify_dev" || baseRole === "superadmin") return true;

    const permissions = await getSessionPermissions();
    if (permissions.includes("system.all")) return true;
    return permissions.includes(permission);
}

export async function hasAnyPermission(requiredPermissions: string[]) {
    const session = await auth();
    const baseRole = (session?.user as any)?.role;
    
    // Absolute power for developer and superadmin
    if (baseRole === "icitify_dev" || baseRole === "superadmin") return true;

    const permissions = await getSessionPermissions();
    if (permissions.includes("system.all")) return true;
    return requiredPermissions.some(p => permissions.includes(p));
}

export async function hasRole(roleName: string | string[]) {
    const session = await auth();
    const baseRole = (session?.user as any)?.role;
    const roles = (session?.user as any)?.roles || [];

    // Absolute power for developer and superadmin
    if (baseRole === "icitify_dev" || baseRole === "superadmin") return true;

    if (Array.isArray(roleName)) {
        return roleName.some(r => roles.includes(r)) || roleName.includes(baseRole);
    }

    return roles.includes(roleName) || baseRole === "admin" || baseRole === roleName;
}
