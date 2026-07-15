import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    session: { strategy: "jwt" },
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.role = (user as any).role;
                token.id = user.id;
                token.status = (user as any).status;
                token.roles = (user as any).roles;
                token.permissions = (user as any).permissions;
                token.schoolPortalId = (user as any).schoolPortalId;
                token.requiresPasswordChange = (user as any).requiresPasswordChange;
                token.twoFactorPending = (user as any).twoFactorPending;
            }
            if (trigger === "update" && session) {
                if (session.twoFactorVerified !== undefined) {
                    token.twoFactorPending = !session.twoFactorVerified;
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).role = token.role;
                (session.user as any).id = token.id;
                (session.user as any).status = token.status;
                (session.user as any).roles = token.roles;
                (session.user as any).permissions = token.permissions;
                (session.user as any).schoolPortalId = token.schoolPortalId;
                (session.user as any).requiresPasswordChange = token.requiresPasswordChange;
                (session.user as any).twoFactorPending = token.twoFactorPending;
            }
            return session;
        },
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            console.log('AUTHORIZED CHECK:', { isLoggedIn, pathname: nextUrl.pathname, session: auth?.user });
            const isLoginPage = nextUrl.pathname === "/login";
            const isRegisterPage = nextUrl.pathname === "/register";
            const isJobsPage = nextUrl.pathname.startsWith("/jobs");
            const isAdminPage = nextUrl.pathname.startsWith("/admin");
            const isTwoFactorPage = nextUrl.pathname === "/login/2fa";

            // SECURITY FIX: Only allow specific public API endpoints without authentication.
            // The old blanket `isApiPage` bypass exposed ALL /api routes publicly.
            const isPublicApiRoute = 
                nextUrl.pathname === "/api/auth/callback/google" ||
                nextUrl.pathname === "/api/auth/callback/microsoft-entra-id" ||
                nextUrl.pathname.startsWith("/api/auth/") ||     // NextAuth's own routes
                nextUrl.pathname === "/api/webhooks/remita" ||   // Remita payment webhook
                nextUrl.pathname === "/api/healthz" ||           // Health check
                nextUrl.pathname === "/api/push";                // Push notification subscription (pre-auth)

            // Allow public API routes and public pages
            if (isPublicApiRoute || isJobsPage) return true;

            // If user is logged in, check if 2FA verification is pending
            const twoFactorPending = (auth?.user as any)?.twoFactorPending;

            if (isLoggedIn && twoFactorPending && !isTwoFactorPage) {
                return Response.redirect(new URL("/login/2fa", nextUrl));
            }

            // Handle login/register pages
            if (isLoginPage || isRegisterPage) {
                // If already logged in, redirect to 2FA page if pending, else dashboard
                if (isLoggedIn) {
                    if (twoFactorPending) {
                        return Response.redirect(new URL("/login/2fa", nextUrl));
                    }
                    return Response.redirect(new URL("/dashboard", nextUrl));
                }
                // Allow access to login/register when not logged in
                return true;
            }

            // Require authentication for all other pages
            if (!isLoggedIn) return false;

            if (isTwoFactorPage) {
                // If on 2FA page but not pending 2FA, redirect to dashboard
                if (!twoFactorPending) {
                    return Response.redirect(new URL("/dashboard", nextUrl));
                }
                return true;
            }

            // Forced Password Change logic
            const requiresPasswordChange = (auth?.user as any)?.requiresPasswordChange;
            const isChangePasswordPage = nextUrl.pathname === "/change-password";

            if (requiresPasswordChange && !isChangePasswordPage) {
                return Response.redirect(new URL("/change-password", nextUrl));
            }
            if (!requiresPasswordChange && isChangePasswordPage) {
                return Response.redirect(new URL("/dashboard", nextUrl));
            }

            // Check role permissions for admin pages
            const userRole = (auth?.user as any)?.role?.toLowerCase();
            const allowedAdminPaths = ["/admin/academics", "/admin/students", "/admin/hr", "/admin/exams-records"]; // Paths staff can access
            
            const userPermissions = (auth?.user as any)?.permissions || [];
            const userRoles = (auth?.user as any)?.roles || [];
            const hasCmsAccess = userPermissions.some((p: string) => p.startsWith("cms.")) || userRoles.includes("CMS Manager");

            if (isAdminPage) {
                if (userRole === 'admin' || userRole === 'superadmin' || userRole === 'dvc' || userRole === 'icitify_dev') return true;
                if (nextUrl.pathname.startsWith("/admin/cms") && hasCmsAccess) return true;
                if (userRole === 'bursar' && (nextUrl.pathname === "/admin/dashboard" || nextUrl.pathname.startsWith("/admin/bursary") || nextUrl.pathname.startsWith("/admin/accounting") || nextUrl.pathname.startsWith("/admin/analytics") || nextUrl.pathname.startsWith("/admin/students") || nextUrl.pathname.startsWith("/admin/hr"))) return true;
                if (userRole === 'registrar' && (nextUrl.pathname === "/admin/dashboard" || nextUrl.pathname.startsWith("/admin/admission") || nextUrl.pathname.startsWith("/admin/admissions") || nextUrl.pathname.startsWith("/admin/academics") || nextUrl.pathname.startsWith("/admin/academic") || nextUrl.pathname.startsWith("/admin/courses") || nextUrl.pathname.startsWith("/admin/faculties") || nextUrl.pathname.startsWith("/admin/departments") || nextUrl.pathname.startsWith("/admin/programmes") || nextUrl.pathname.startsWith("/admin/curriculum") || nextUrl.pathname.startsWith("/admin/calendar") || nextUrl.pathname.startsWith("/admin/quality-assurance") || nextUrl.pathname.startsWith("/admin/registration") || nextUrl.pathname.startsWith("/admin/cbt") || nextUrl.pathname.startsWith("/admin/students") || nextUrl.pathname.startsWith("/admin/hr") || nextUrl.pathname.startsWith("/admin/exams-records") || nextUrl.pathname.startsWith("/admin/registrar"))) return true;
                if (userRole === 'admission_officer' && (nextUrl.pathname === "/admin/dashboard" || nextUrl.pathname.startsWith("/admin/admission") || nextUrl.pathname.startsWith("/admin/admissions") || nextUrl.pathname.startsWith("/admin/students") || nextUrl.pathname.startsWith("/admin/settings/units"))) return true;
                if (userRole === 'librarian' && (nextUrl.pathname === "/admin/dashboard" || nextUrl.pathname.startsWith("/admin/library") || nextUrl.pathname.startsWith("/admin/journal") || nextUrl.pathname.startsWith("/admin/students") || nextUrl.pathname.startsWith("/admin/hr"))) return true;
                if (userRole === 'hod' && (nextUrl.pathname === "/admin/dashboard" || nextUrl.pathname.startsWith("/admin/hod") || nextUrl.pathname.startsWith("/admin/academics") || nextUrl.pathname.startsWith("/admin/academic") || nextUrl.pathname.startsWith("/admin/students") || nextUrl.pathname.startsWith("/admin/hr"))) return true;
                if (userRole === 'dean' && (nextUrl.pathname === "/admin/dashboard" || nextUrl.pathname.startsWith("/admin/dean") || nextUrl.pathname.startsWith("/admin/academics") || nextUrl.pathname.startsWith("/admin/academic") || nextUrl.pathname.startsWith("/admin/students") || nextUrl.pathname.startsWith("/admin/hr"))) return true;
                if (userRole === 'staff' && allowedAdminPaths.some(p => nextUrl.pathname.startsWith(p))) return true;
                return Response.redirect(new URL("/dashboard", nextUrl));
            }

            if (nextUrl.pathname.startsWith("/parent")) {
                if (userRole === 'parent' || userRole === 'admin' || userRole === 'superadmin') return true;
                return Response.redirect(new URL("/dashboard", nextUrl));
            }

            return true;
        },
    },
    providers: [], // Add providers in auth.ts as they might be Node-dependent
} satisfies NextAuthConfig;
