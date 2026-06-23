import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { db } from "@/db/db";
import { users, roles, permissions, rolePermissions, userRoles } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import { cookies } from "next/headers";

// Helper to fetch roles and permissions for a user
async function fetchUserRolesAndPermissions(userId: number) {
    let roleNames: string[] = [];
    let permissionNames: string[] = [];

    try {
        const rolesAndPermissions = await db
            .select({
                roleName: roles.name,
                permissionName: permissions.name,
            })
            .from(userRoles)
            .innerJoin(roles, eq(userRoles.roleId, roles.id))
            .leftJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
            .leftJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
            .where(eq(userRoles.userId, userId));

        const roleSet = new Set<string>();
        const permissionSet = new Set<string>();

        rolesAndPermissions.forEach(row => {
            if (row.roleName) roleSet.add(row.roleName);
            if (row.permissionName) permissionSet.add(row.permissionName);
        });

        roleNames = Array.from(roleSet);
        permissionNames = Array.from(permissionSet);
    } catch (rbacError) {
        console.error("RBAC fetch error:", rbacError);
    }

    return { roleNames, permissionNames };
}

// LDAP authentication helper (activated when LDAP_URL env is set)
async function authenticateWithLDAP(email: string, password: string): Promise<boolean> {
    const ldapUrl = process.env.LDAP_URL;
    if (!ldapUrl) return false;

    // LDAP authentication infrastructure
    // When an LDAP server is configured, this will attempt to bind with the user's credentials
    // Configure via: LDAP_URL, LDAP_BASE_DN, LDAP_BIND_DN, LDAP_BIND_PASSWORD
    try {
        // NOTE: Install 'ldapjs' package and uncomment to activate:
        // const ldap = require('ldapjs');
        // const client = ldap.createClient({ url: ldapUrl });
        // const baseDN = process.env.LDAP_BASE_DN || 'dc=example,dc=com';
        // const userDN = `uid=${email.split('@')[0]},${baseDN}`;
        // await new Promise((resolve, reject) => {
        //     client.bind(userDN, password, (err: any) => {
        //         client.unbind();
        //         if (err) reject(err);
        //         else resolve(true);
        //     });
        // });
        // return true;
        console.log("LDAP URL configured but ldapjs not installed. Using local auth.");
        return false;
    } catch {
        return false;
    }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    adapter: DrizzleAdapter(db),
    providers: [
        // Email/Password credentials
        Credentials({
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                const email = (credentials.email as string).trim().toLowerCase();

                const [user] = await db
                    .select()
                    .from(users)
                    .where(eq(users.email, email))
                    .limit(1);

                if (!user) return null;

                // Check if account is locked
                if (user.lockoutUntil && new Date(user.lockoutUntil) > new Date()) {
                    console.warn(`Attempted login on locked account: ${email}`);
                    return null; // NextAuth doesn't easily surface custom error messages from authorize to the UI without extra handling
                }

                // Try LDAP first (if configured), then local password
                let isAuthenticated = false;

                if (process.env.LDAP_URL) {
                    isAuthenticated = await authenticateWithLDAP(email, credentials.password as string);
                }

                if (!isAuthenticated) {
                    if (!user.password) return null;
                    isAuthenticated = await bcrypt.compare(
                        credentials.password as string,
                        user.password
                    );
                }

                if (!isAuthenticated) {
                    // Record failed attempt
                    const attempts = (user.failedLoginAttempts || 0) + 1;
                    let lockoutUntil = null;
                    if (attempts >= 3) {
                        lockoutUntil = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes lockout
                    }

                    await db.update(users)
                        .set({
                            failedLoginAttempts: attempts,
                            lockoutUntil: lockoutUntil as any
                        })
                        .where(eq(users.id, user.id));

                    return null;
                }

                // Success: Reset failures
                if (user.failedLoginAttempts !== 0 || user.lockoutUntil) {
                    await db.update(users).set({
                        failedLoginAttempts: 0,
                        lockoutUntil: null
                    }).where(eq(users.id, user.id));
                }

                const { roleNames, permissionNames } = await fetchUserRolesAndPermissions(user.id);

                return {
                    id: user.id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    status: user.status,
                    roles: roleNames,
                    permissions: permissionNames,
                    schoolPortalId: (user as any).schoolPortalId,
                    requiresPasswordChange: (user as any).requiresPasswordChange,
                };
            },
        }),

        // Google OAuth (activated when GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET are set)
        ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
            ? [Google({
                clientId: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                allowDangerousEmailAccountLinking: false, // Security: Do not allow hijacking via external OAuth providers
            })]
            : []),

        // Microsoft Entra ID / Azure AD (activated when MS_CLIENT_ID + MS_CLIENT_SECRET are set)
        ...(process.env.MS_CLIENT_ID && process.env.MS_CLIENT_SECRET
            ? [MicrosoftEntraID({
                clientId: process.env.MS_CLIENT_ID,
                clientSecret: process.env.MS_CLIENT_SECRET,
                allowDangerousEmailAccountLinking: false, // Security: Do not allow hijacking via external OAuth providers
            })]
            : []),
    ],
    events: {
        // When an OAuth user signs in, ensure they have a matching local user record
        async signIn({ user, account }) {
            if (account?.provider === 'google' || account?.provider === 'microsoft-entra-id') {
                if (user.email) {
                    const [existingUser] = await db.select().from(users)
                        .where(eq(users.email, user.email.toLowerCase()))
                        .limit(1);

                    if (existingUser) {
                        // Link OAuth login to existing user — update name if missing
                        if (!existingUser.name && user.name) {
                            await db.update(users)
                                .set({ name: user.name })
                                .where(eq(users.id, existingUser.id));
                        }
                    }
                }
            }
        },
    },
    callbacks: {
        ...authConfig.callbacks,
        async jwt({ token, user, trigger, account }) {
            // Call the base jwt from authConfig
            if (authConfig.callbacks?.jwt) {
                token = await authConfig.callbacks.jwt({ token, user, trigger, account } as any) as any;
            }

            // For OAuth sign-ins, fetch from DB on first OAuth token creation
            if (account && (account.provider === 'google' || account.provider === 'microsoft-entra-id') && user?.email) {
                try {
                    const [dbUser] = await db.select().from(users)
                        .where(eq(users.email, user.email.toLowerCase()))
                        .limit(1);

                    if (dbUser) {
                        token.id = dbUser.id.toString();
                        token.role = dbUser.role;
                        token.status = dbUser.status;
                        token.schoolPortalId = (dbUser as any).schoolPortalId;
                        token.requiresPasswordChange = (dbUser as any).requiresPasswordChange;

                        const { roleNames, permissionNames } = await fetchUserRolesAndPermissions(dbUser.id);
                        token.roles = roleNames;
                        token.permissions = permissionNames;
                    }
                } catch (e) {
                    console.error("OAuth DB lookup error:", e);
                }
            }

            return token;
        },
        async session({ session, token }) {
            // Call the base session from authConfig
            if (authConfig.callbacks?.session) {
                session = await authConfig.callbacks.session({ session, token } as any) as any;
            }

            try {
                const cookieStore = await cookies();
                const impersonatedId = cookieStore.get("impersonated_id")?.value;
                const impersonatedRole = cookieStore.get("impersonated_role")?.value;
                const originalAdminId = cookieStore.get("original_admin_id")?.value;

                if (impersonatedId && originalAdminId && token.role === 'admin') {
                    (session.user as any).impersonating = true;
                    (session.user as any).originalId = originalAdminId;
                    (session.user as any).id = impersonatedId;
                    if (impersonatedRole) {
                        (session.user as any).role = impersonatedRole;
                    }
                }
            } catch (e) {
                // Cookies unavailable in some contexts
            }
            return session;
        },
    },
});
