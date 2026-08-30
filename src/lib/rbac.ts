import { auth } from "@/auth";

export async function getSessionPermissions() {
    const session = await auth();
    return (session?.user as any)?.permissions || [];
}

export async function hasPermission(permission: string) {
    const session = await auth();
    const baseRole = ((session?.user as any)?.role || "").toString().toLowerCase();
    
    // Absolute power for developer, superadmin, admin, and registrar (full access except dev-only)
    if (baseRole === "icitify_dev" || baseRole === "superadmin" || baseRole === "admin" || baseRole === "registrar") return true;

    // Registrar automatically has access to all academic, admission, student, registry, and communication features
    if (baseRole === "registrar" && (
        permission.startsWith("admission.") || 
        permission.startsWith("academic.") || 
        permission.startsWith("students.") || 
        permission.startsWith("registry.") || 
        permission.startsWith("communication.") ||
        permission.startsWith("officers.")
    )) {
        return true;
    }

    // Admission Officer automatically has access to all admission, student, and communication features
    if ((baseRole === "admission_officer" || baseRole === "admission officer" || baseRole === "admission") && (
        permission.startsWith("admission.") || 
        permission.startsWith("students.") || 
        permission.startsWith("communication.")
    )) {
        return true;
    }

    // Bursar / Bursary staff automatically has access to all financial and admission view/payment features
    if ((baseRole === "bursar" || baseRole === "bursary" || baseRole === "accountant") && (
        permission.startsWith("finance.") || 
        permission.startsWith("admission.screening.") || 
        permission.startsWith("admission.applications.") ||
        permission === "admission.manage"
    )) {
        return true;
    }

    // Record Officer automatically has access to result module, exams/records, and communication features
    if ((baseRole === "record_officer" || baseRole === "record officer" || baseRole === "recordofficer") && (
        permission.startsWith("result_module.") || 
        permission.startsWith("exams_records.") || 
        permission.startsWith("communication.") ||
        permission === "result_module.manage"
    )) {
        return true;
    }

    const permissions = await getSessionPermissions();
    if (permissions.includes("system.all")) return true;
    return permissions.includes(permission);
}

export async function hasAnyPermission(requiredPermissions: string[]) {
    const session = await auth();
    const baseRole = ((session?.user as any)?.role || "").toString().toLowerCase();
    
    if (baseRole === "icitify_dev" || baseRole === "superadmin" || baseRole === "admin" || baseRole === "registrar") return true;

    for (const p of requiredPermissions) {
        if (await hasPermission(p)) return true;
    }
    return false;
}

export async function hasRole(roleName: string | string[]) {
    const session = await auth();
    const baseRole = ((session?.user as any)?.role || "").toString().toLowerCase();
    const userRoles = (((session?.user as any)?.roles || []) as string[]).map(r => r.toLowerCase());

    // Absolute power for developer, superadmin, admin, and registrar
    if (baseRole === "icitify_dev" || baseRole === "superadmin" || baseRole === "admin" || baseRole === "registrar") return true;

    const targets = (Array.isArray(roleName) ? roleName : [roleName]).map(r => r.toLowerCase());

    return targets.some(t => 
        baseRole === t || 
        userRoles.includes(t) ||
        (t === "bursar" && (baseRole === "bursary" || userRoles.includes("bursary") || baseRole === "accountant")) ||
        (t === "bursary" && (baseRole === "bursar" || userRoles.includes("bursar"))) ||
        (t === "admission_officer" && (baseRole === "admission officer" || baseRole === "admission" || userRoles.includes("admission_officer"))) ||
        (t === "record_officer" && (baseRole === "record officer" || baseRole === "recordofficer" || userRoles.includes("record_officer")))
    );
}
