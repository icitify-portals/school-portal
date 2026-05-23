
import { auth } from "@/auth";

export async function getSessionPermissions() {
    const session = await auth();
    return (session?.user as any)?.permissions || [];
}

export async function hasPermission(permission: string) {
    const permissions = await getSessionPermissions();
    if (permissions.includes("system.all")) return true;
    return permissions.includes(permission);
}

export async function hasAnyPermission(requiredPermissions: string[]) {
    const permissions = await getSessionPermissions();
    if (permissions.includes("system.all")) return true;
    return requiredPermissions.some(p => permissions.includes(p));
}

export async function hasRole(roleName: string) {
    const session = await auth();
    const roles = (session?.user as any)?.roles || [];
    return roles.includes(roleName) || (session?.user as any)?.role === "admin";
}
