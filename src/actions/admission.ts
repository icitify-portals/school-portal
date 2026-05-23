"use server";

import { db } from "@/db/db";
import { jambCandidates, users, students, userRoles, roles, integrationSettings, courses, programmes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";

export async function getJambCandidates() {
    try {
        return await db.select().from(jambCandidates);
    } catch (error) {
        console.error("Failed to fetch JAMB candidates:", error);
        return [];
    }
}

export async function bulkImportJambData(data: any[]) {
    try {
        await db.transaction(async (tx) => {
            for (const row of data) {
                const { jambRegNo, surname, middlename, firstname, dob, courseId, facultyId, deptId, utmeSubjects, imageUrl } = row;
                if (!jambRegNo || !surname || !firstname || !dob) continue;

                // Check if candidate already exists
                const existing = await tx.select().from(jambCandidates).where(eq(jambCandidates.jambRegNo, jambRegNo)).limit(1);
                if (existing.length > 0) continue;

                await tx.insert(jambCandidates).values({
                    jambRegNo,
                    surname,
                    middlename,
                    firstname,
                    dob,
                    courseId: parseInt(courseId) || null,
                    facultyId: parseInt(facultyId) || null,
                    deptId: parseInt(deptId) || null,
                    utmeSubjects: typeof utmeSubjects === 'string' ? utmeSubjects : JSON.stringify(utmeSubjects),
                    imageUrl: imageUrl || null
                });
            }
        });
        revalidatePath("/admin/admission");
        return { success: true };
    } catch (error) {
        console.error("Failed to import JAMB data:", error);
        return { success: false, error: "Import failed" };
    }
}

export async function verifyJambCandidate(regNo: string, dob: string) {
    try {
        const [candidate] = await db
            .select()
            .from(jambCandidates)
            .where(
                and(
                    eq(jambCandidates.jambRegNo, regNo),
                    eq(jambCandidates.dob, dob)
                )
            )
            .limit(1);

        if (!candidate) return { success: false, error: "Invalid JAMB Registration Number or Date of Birth" };
        if (candidate.isClaimed) return { success: false, error: "This admission has already been claimed" };

        return { success: true, candidate };
    } catch (error) {
        console.error("Verification error:", error);
        return { success: false, error: "An error occurred during verification" };
    }
}

export async function claimAdmissionProfile(regNo: string, dob: string, email?: string, password?: string) {
    try {
        const session = await auth();
        const verification = await verifyJambCandidate(regNo, dob);
        if (!verification.success) return verification;

        const candidate = verification.candidate!;

        // Get student role
        const studentRole = await db.select().from(roles).where(eq(roles.name, "student")).limit(1);
        const roleId = studentRole[0]?.id;

        let existingUser = null;
        if (email) {
            existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
        }

        const result = await db.transaction(async (tx) => {
            let userId: number;
            if (existingUser && existingUser.length > 0) {
                userId = existingUser[0].id;
                // Update role to applicant if not already
                await tx.update(users).set({ role: 'applicant' }).where(eq(users.id, userId));

                // Assign role if not already assigned
                const existingRole = await tx.select().from(userRoles).where(eq(userRoles.userId, userId)).limit(1);
                if (existingRole.length === 0 && roleId) {
                    await tx.insert(userRoles).values({ userId, roleId });
                }
            } else {
                // Create New User
                if (!email || !password) {
                    return { success: false, error: "Email and password are required for new accounts" };
                }
                const passwordHash = await bcrypt.hash(password, 10);
                const [newUser] = await tx.insert(users).values({
                    name: `${candidate.firstname} ${candidate.middlename ? candidate.middlename + ' ' : ''}${candidate.surname}`,
                    email,
                    password: passwordHash,
                    role: 'applicant'
                });
                userId = newUser.insertId;

                // Assign Role
                if (roleId) {
                    await tx.insert(userRoles).values({ userId, roleId });
                }
            }

            // 3. Create or Update Student Profile
            const existingStudent = await tx.select().from(students).where(eq(students.userId, userId)).limit(1);
            if (existingStudent.length > 0) {
                await tx.update(students).set({
                    programmeId: candidate.courseId,
                    currentLevel: 100,
                    imageUrl: (candidate as any).imageUrl || existingStudent[0].imageUrl,
                    barcode: `${candidate.firstname} ${candidate.surname} | ${candidate.jambRegNo}`
                }).where(eq(students.id, existingStudent[0].id));
            } else {
                await tx.insert(students).values({
                    userId,
                    programmeId: candidate.courseId,
                    currentLevel: 100,
                    imageUrl: (candidate as any).imageUrl,
                    barcode: `${candidate.firstname} ${candidate.surname} | ${candidate.jambRegNo}`
                });
            }

            // 4. Mark JAMB Record as Claimed
            await tx.update(jambCandidates)
                .set({ isClaimed: true, claimedUserId: userId })
                .where(eq(jambCandidates.id, candidate.id));

            return { success: true, userId };
        });

        return result;
    } catch (error) {
        console.error("Claim error:", error);
        if ((error as any).code === 'ER_DUP_ENTRY') {
            return { success: false, error: "Email address is already in use" };
        }
        return { success: false, error: "Failed to claim admission profile" };
    }
}
const JAMB_PROVIDER_NAME = "jamb";

export async function syncJambDataFromApi(year: string, apiKey: string) {
    try {
        // 0. Update Settings
        await db.insert(integrationSettings).values({
            provider: JAMB_PROVIDER_NAME,
            apiKey: apiKey,
            isEnabled: true,
            config: JSON.stringify({ year }),
            lastSyncAt: new Date()
        }).onDuplicateKeyUpdate({
            set: { apiKey, isEnabled: true, config: JSON.stringify({ year }), lastSyncAt: new Date() }
        });

        // 1. Initialize Provider
        const { JambMockProvider } = await import("@/lib/external/jamb"); // Dynamic import
        const provider = new JambMockProvider(apiKey, "dummy-secret");

        // 2. Fetch Data
        const response = await provider.fetchCandidates(year);
        if (!response.success || !response.data) {
            return { success: false, error: response.error || "Failed to fetch data" };
        }

        // 3. Process & Insert
        // Need to map course codes to IDs. Ideally we cache this map.
        const programmes = await db.select().from(courses);
        // Simple mapping: Course Code "CSC" -> matches Course Code "CSC" in DB?
        // Or Programme Code? The JAMB data likely maps to Programme or Department.
        // Let's assume it maps to Course for now as per schema `courseId`.

        let importedCount = 0;

        await db.transaction(async (tx) => {
            for (const candidate of response.data!) {
                // Find matching course/programme
                const course = programmes.find(p => p.code.includes(candidate.courseCode));

                // Avoid duplicates
                const existing = await tx.select().from(jambCandidates)
                    .where(eq(jambCandidates.jambRegNo, candidate.jambRegNo))
                    .limit(1);

                if (existing.length > 0) {
                    // Update existing? Or skip. Let's skip claimed ones.
                    if (existing[0].isClaimed) continue;

                    // Update score/details
                    await tx.update(jambCandidates).set({
                        score: candidate.score,
                        utmeSubjects: JSON.stringify(candidate.subjects),
                        apiReferenceId: `JAMB-${year}`,
                        courseId: course?.id || null,
                        imageUrl: candidate.imageUrl || null
                    }).where(eq(jambCandidates.id, existing[0].id));
                } else {
                    // Insert new
                    await tx.insert(jambCandidates).values({
                        jambRegNo: candidate.jambRegNo,
                        surname: candidate.surname,
                        firstname: candidate.firstname,
                        middlename: candidate.middlename,
                        dob: candidate.dob,
                        score: candidate.score,
                        utmeSubjects: JSON.stringify(candidate.subjects),
                        apiReferenceId: `JAMB-${year}`,
                        courseId: course?.id || null,
                        imageUrl: candidate.imageUrl || null
                    });
                    importedCount++;
                }
            }
        });

        revalidatePath("/admin/admission");
        return { success: true, message: `Synced successfully. Imported ${importedCount} new candidates.` };

    } catch (error: any) {
        console.error("JAMB Sync Error:", error);
        return { success: false, error: error.message };
    }
}

export async function updateAdmissionPolicy(programmeId: number, data: { cutOffMark: number, meritQuota: number, catchmentAreas: string[] }) {
    try {
        await db.update(programmes)
            .set({
                cutOffMark: data.cutOffMark,
                meritQuota: data.meritQuota,
                catchmentAreas: JSON.stringify(data.catchmentAreas)
            })
            .where(eq(programmes.id, programmeId));

        revalidatePath("/admin/admission/settings");
        return { success: true, message: "Policy updated successfully" };
    } catch (error: any) {
        console.error("Policy Update Error:", error);
        return { success: false, error: error.message };
    }
}

export async function getProgrammesWithPolicy() {
    try {
        return await db.select({
            id: programmes.id,
            name: programmes.name,
            code: programmes.id,
            deptId: programmes.deptId,
            cutOffMark: programmes.cutOffMark,
            meritQuota: programmes.meritQuota,
            catchmentAreas: programmes.catchmentAreas
        }).from(programmes);
    } catch (error) {
        return [];
    }
}
