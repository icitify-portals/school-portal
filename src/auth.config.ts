import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    session: { strategy: "jwt" },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role;
                token.id = user.id;
                token.status = (user as any).status;
                token.roles = (user as any).roles;
                token.permissions = (user as any).permissions;
                token.schoolPortalId = (user as any).schoolPortalId;
                token.requiresPasswordChange = (user as any).requiresPasswordChange;
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
            }
            return session;
        },
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isLoginPage = nextUrl.pathname === "/login";
            const isRegisterPage = nextUrl.pathname === "/register";
            const isJobsPage = nextUrl.pathname.startsWith("/jobs");
            const isApiPage = nextUrl.pathname.startsWith("/api");
            const isAdminPage = nextUrl.pathname.startsWith("/admin");

            // Allow public pages without authentication
            if (isApiPage || isJobsPage) return true;

            // Handle login/register pages
            if (isLoginPage || isRegisterPage) {
                // If already logged in, redirect to home
                if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
                // Allow access to login/register when not logged in
                return true;
            }

            // Require authentication for all other pages
            if (!isLoggedIn) return false;

            // Forced Password Change logic
            const requiresPasswordChange = (auth?.user as any)?.requiresPasswordChange;
            const isChangePasswordPage = nextUrl.pathname === "/change-password";

            if (requiresPasswordChange && !isChangePasswordPage) {
                return Response.redirect(new URL("/change-password", nextUrl));
            }
            if (!requiresPasswordChange && isChangePasswordPage) {
                return Response.redirect(new URL("/", nextUrl));
            }

            // Check role permissions for admin pages
            const userRole = (auth?.user as any)?.role?.toLowerCase();
            const allowedAdminPaths = ["/admin/academics", "/admin/students", "/admin/hr", "/admin/exams-records"]; // Paths staff can access
            
             if (isAdminPage) {
                if (userRole === 'admin' || userRole === 'superadmin' || userRole === 'dvc') return true;
                if (userRole === 'bursar' && (nextUrl.pathname.startsWith("/admin/bursary") || nextUrl.pathname.startsWith("/admin/students") || nextUrl.pathname.startsWith("/admin/hr"))) return true;
                if (userRole === 'registrar' && (nextUrl.pathname.startsWith("/admin/admission") || nextUrl.pathname.startsWith("/admin/admissions") || nextUrl.pathname.startsWith("/admin/academics") || nextUrl.pathname.startsWith("/admin/academic") || nextUrl.pathname.startsWith("/admin/students") || nextUrl.pathname.startsWith("/admin/hr") || nextUrl.pathname.startsWith("/admin/exams-records"))) return true;
                if (userRole === 'librarian' && (nextUrl.pathname.startsWith("/admin/library") || nextUrl.pathname.startsWith("/admin/journal") || nextUrl.pathname.startsWith("/admin/students") || nextUrl.pathname.startsWith("/admin/hr"))) return true;
                if (userRole === 'hod' && (nextUrl.pathname.startsWith("/admin/hod") || nextUrl.pathname.startsWith("/admin/academics") || nextUrl.pathname.startsWith("/admin/academic") || nextUrl.pathname.startsWith("/admin/students") || nextUrl.pathname.startsWith("/admin/hr"))) return true;
                if (userRole === 'dean' && (nextUrl.pathname.startsWith("/admin/dean") || nextUrl.pathname.startsWith("/admin/academics") || nextUrl.pathname.startsWith("/admin/academic") || nextUrl.pathname.startsWith("/admin/students") || nextUrl.pathname.startsWith("/admin/hr"))) return true;
                if (userRole === 'staff' && allowedAdminPaths.some(p => nextUrl.pathname.startsWith(p))) return true;
                return Response.redirect(new URL("/", nextUrl));
            }

            if (nextUrl.pathname.startsWith("/parent")) {
                if (userRole === 'parent' || userRole === 'admin' || userRole === 'superadmin') return true;
                return Response.redirect(new URL("/", nextUrl));
            }

            return true;
        },
    },
    providers: [], // Add providers in auth.ts as they might be Node-dependent
} satisfies NextAuthConfig;
