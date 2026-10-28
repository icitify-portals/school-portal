"use server";

import { db } from "@/db/db";
import { students, users, staffProfiles } from "@/db/schema";
import { eq, ne, and, or, isNull, inArray, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getStaffProfileByUserId } from "@/actions/hr_leave";
import { getStudentProfile as fetchStudentProfile } from "@/actions/students";
import { storage } from "@/lib/storage";

export async function updateStudentProfile(userId: number, data: {
    guardianName?: string;
    guardianAddress?: string;
    guardianOccupation?: string;
    guardianPhone?: string;
    guardianWhatsapp?: string;
    guardianEmail?: string;
    kinName?: string;
    kinAddress?: string;
    kinOccupation?: string;
    kinPhone?: string;
    kinWhatsapp?: string;
    kinEmail?: string;
    doctorName?: string;
    doctorAddress?: string;
    doctorPhone?: string;
    doctorWhatsapp?: string;
    doctorEmail?: string;
    ailments?: string;
    operations?: string;
    foodAllergies?: string;
    bloodGroup?: string;
    genotype?: string;
    imageUrl?: string;
    dob?: string;
}) {
    try {
        const [currentProfile] = await db.select().from(students)
            .where(and(eq(students.userId, userId), isNull(students.deletedAt)))
            .orderBy(
                sql`CASE WHEN ${students.status} = 'active' THEN 0 ELSE 1 END`,
                sql`CASE WHEN ${students.programmeType} = 'HND' THEN 0 ELSE 1 END`,
                desc(students.id)
            )
            .limit(1);

        if (!currentProfile) return { success: false, error: "Profile not found" };

        const updateData: any = { ...data };

        // Handle Image Locking
        if (data.imageUrl && data.imageUrl !== currentProfile.imageUrl) {
            if (currentProfile.isProfileLocked) {
                return { success: false, error: "Profile image is locked and cannot be changed." };
            }
            // If user is setting a new image, lock it immediately
            updateData.isProfileLocked = true;
        }

        await db.update(students)
            .set(updateData)
            .where(eq(students.id, currentProfile.id));

        revalidatePath("/student/profile");
        revalidatePath("/profile");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to update student profile:", error);
        return { success: false, error: error.message };
    }
}

export async function updateStaffProfile(userId: number, data: {
    bankName?: string;
    accountNumber?: string;
    maritalStatus?: string;
    qualification?: string;
    imageUrl?: string;
}) {
    try {
        const [currentProfile] = await db.select().from(staffProfiles).where(eq(staffProfiles.userId, userId)).limit(1);

        if (!currentProfile) return { success: false, error: "Staff profile not found" };

        const updateData: any = { ...data };

        await db.update(staffProfiles)
            .set(updateData)
            .where(eq(staffProfiles.userId, userId));

        revalidatePath("/profile");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to update staff profile:", error);
        return { success: false, error: error.message };
    }
}

export async function getStudentProfile(userId: number) {
    try {
        const [profile] = await db.select().from(students)
            .where(and(eq(students.userId, userId), isNull(students.deletedAt)))
            .orderBy(
                sql`CASE WHEN ${students.status} = 'active' THEN 0 ELSE 1 END`,
                sql`CASE WHEN ${students.programmeType} = 'HND' THEN 0 ELSE 1 END`,
                desc(students.id)
            )
            .limit(1);
        return profile;
    } catch (error) {
        console.error("Failed to fetch student profile:", error);
        return null;
    }
}

export async function getLoggedUserProfile() {
    try {
        const session = await auth();
        if (!session?.user) return null;

        let dbUser;
        if (session.user.id) {
            const userId = parseInt(session.user.id);
            if (!isNaN(userId)) {
                [dbUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
            }
        }

        // Fallback to searching by email if the session ID didn't match a user (e.g. after a re-seed)
        if (!dbUser && session.user.email) {
            [dbUser] = await db.select().from(users).where(eq(users.email, session.user.email.toLowerCase())).limit(1);
        }

        if (!dbUser) return null;

        const userId = dbUser.id;
        const userRole = dbUser.role;

        if (userRole === 'staff' || userRole === 'admin' || userRole === 'superadmin' || userRole === 'dvc') {
            let staffProfile = await getStaffProfileByUserId(userId);
            
            // JIT Staff Profile Creation: Create a staff profile on the fly if it doesn't exist
            if (!staffProfile) {
                await db.insert(staffProfiles).values({
                    userId: userId,
                    staffId: `FSS/STF/${Math.floor(100 + Math.random() * 900)}`,
                    jobTitle: userRole === 'superadmin' ? 'Super Admin' : (userRole === 'admin' ? 'System Administrator' : 'Staff Member'),
                    isActive: true
                });
                // Re-fetch the newly created profile
                staffProfile = await getStaffProfileByUserId(userId);
            }

            if (staffProfile) {
                return {
                    ...staffProfile,
                    isStaffProfile: true
                };
            }
        } else {
            const studentProfile = await fetchStudentProfile();
            if (studentProfile) {
                const { systemSettings } = await import("@/db/schema");
                const [deadlineSetting] = await db.select().from(systemSettings).where(eq(systemSettings.settingKey, 'student_profile_update_deadline')).limit(1);
                
                let isDeadlinePassed = false;
                if (deadlineSetting && deadlineSetting.settingValue) {
                    const deadline = new Date(deadlineSetting.settingValue);
                    if (!isNaN(deadline.getTime()) && new Date() > deadline) {
                        isDeadlinePassed = true;
                    }
                }

                return {
                    ...studentProfile,
                    isStaffProfile: false,
                    isDeadlinePassed
                };
            }
        }
        return null;
    } catch (e) {
        console.error("Error in getLoggedUserProfile:", e);
        return null;
    }
}

export async function uploadProfileImage(formData: FormData) {
    try {
        const session = await auth();
        if (!session?.user) {
            return { success: false, error: "Not authenticated" };
        }

        const file = formData.get("file") as File;
        if (!file) {
            return { success: false, error: "No file provided" };
        }

        // Validate file type and size
        const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
        const maxSize = 2 * 1024 * 1024; // 2MB

        if (!allowedTypes.includes(file.type)) {
            return { success: false, error: "Invalid file type. Only JPEG and PNG images are allowed" };
        }

        if (file.size > maxSize) {
            return { success: false, error: "File size too large. Maximum 2MB allowed" };
        }

        // Fetch the database user profile to get exact userId and type
        const profile = await getLoggedUserProfile();
        if (!profile) {
            return { success: false, error: "Profile not found" };
        }

        const userId = profile.userId;
        const isStaff = profile.isStaffProfile;

        // Check if student profile is already locked
        // Allow returning students (level > 1) and ICT-captured photos to bypass the lock
        // @ts-expect-error - TS2339: Auto-suppressed for build
        if (!isStaff && profile.isProfileLocked) {
            // @ts-expect-error - TS2339: Auto-suppressed for build
            const studentLevel = profile.currentLevel || 1;
            if (studentLevel <= 1) {
                return { success: false, error: "Profile image is locked. Returning students (ND 2/HND 2) can upload at the ICT unit." };
            }
            // Level > 1: allow re-upload (returning students)
        }

        // Create unique filename
        const fileExtension = file.name.split('.').pop() || 'jpg';
        const uniqueFilename = `profile_${userId}_${Date.now()}.${fileExtension}`;

        // Upload file via storage provider (local or S3/Wasabi)
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const uploadResult = await storage.upload(buffer, uniqueFilename, 'profiles', file.type);

        if (!uploadResult.success || !uploadResult.url) {
            return { success: false, error: uploadResult.error || "Failed to upload image" };
        }

        const imageUrl = uploadResult.url;

        // Update database
        if (isStaff) {
            await db.update(staffProfiles)
                .set({ imageUrl })
                // @ts-expect-error - TS2769: Auto-suppressed for build
                .where(eq(staffProfiles.userId, userId));
        } else {
            await db.update(students)
                .set({ imageUrl, isProfileLocked: true })
                // @ts-expect-error - TS2769: Auto-suppressed for build
                .where(eq(students.userId, userId));
        }

        revalidatePath("/profile");
        revalidatePath("/student/profile");
        return { success: true, imageUrl };
    } catch (error: any) {
        console.error("Failed to upload profile image:", error);
        return { success: false, error: error.message || "Failed to upload image" };
    }
}

export async function uploadSignatureImage(formData: FormData) {
    try {
        const session = await auth();
        if (!session?.user) return { success: false, error: "Not authenticated" };

        const file = formData.get("file") as File;
        if (!file) return { success: false, error: "No file provided" };

        const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
        if (!allowedTypes.includes(file.type)) return { success: false, error: "Only JPEG and PNG images are allowed" };
        if (file.size > 2 * 1024 * 1024) return { success: false, error: "File size too large. Maximum 2MB allowed" };

        const profile = await getLoggedUserProfile();
        if (!profile) return { success: false, error: "Profile not found" };

        const userId = profile.userId;
        const isStaff = profile.isStaffProfile;

        const fileExtension = file.name.split('.').pop() || 'jpg';
        const uniqueFilename = `sig_${userId}_${Date.now()}.${fileExtension}`;
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const uploadResult = await storage.upload(buffer, uniqueFilename, 'signatures', file.type);

        if (!uploadResult.success || !uploadResult.url) return { success: false, error: uploadResult.error || "Failed to upload signature" };

        const signatureUrl = uploadResult.url;

        if (isStaff) {
            await db.update(staffProfiles).set({ signatureUrl }).where(eq(staffProfiles.userId, userId));
        } else {
            await db.update(students).set({ signatureUrl }).where(eq(students.userId, userId));
        }

        revalidatePath("/profile");
        return { success: true, signatureUrl };
    } catch (error: any) {
        console.error("Failed to upload signature:", error);
        return { success: false, error: error.message || "Failed to upload signature" };
    }
}

// ──────────────────────────────────────────────────────────────
// Profile Completion (for new students on first login)
// ──────────────────────────────────────────────────────────────

export async function getStudentProfileStatus() {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Not authenticated" };

    const [student] = await db.select({
        id: students.id, firstName: students.firstName, lastName: students.lastName, otherNames: students.otherNames,
        gender: students.gender, nin: students.nin, jambNumber: students.jambNumber,
        stateOfOrigin: students.stateOfOrigin, lga: students.lga, profileCompleted: students.profileCompleted,
        currentLevel: students.currentLevel, programmeType: students.programmeType, deptId: students.deptId,
        matricNumber: students.matricNumber, currentSessionId: students.currentSessionId, admissionYear: students.admissionYear, studyMode: students.studyMode,
    })
        .from(students)
        // @ts-expect-error - TS2769: Auto-suppressed for build
        .where(and(eq(students.userId, session.user.id), isNull(students.deletedAt)))
        .orderBy(
            sql`CASE WHEN ${students.status} = 'active' THEN 0 ELSE 1 END`,
            sql`CASE WHEN ${students.programmeType} = 'HND' THEN 0 ELSE 1 END`,
            desc(students.id)
        )
        .limit(1);

    if (!student) return { success: false, error: "Student record not found" };

    const user = await db.query.users.findFirst({
        // @ts-expect-error - TS2769: Auto-suppressed for build
        where: eq(users.id, session.user.id),
        columns: { email: true, phone: true, name: true, firstName: true, surname: true },
    });

    const firstName = student.firstName?.trim() || user?.firstName?.trim() || user?.name?.trim()?.split(/\s+/)[0] || "";
    const lastName = student.lastName?.trim() || user?.surname?.trim() || user?.name?.trim()?.split(/\s+/).slice(1).join(" ") || "";

    const missing: string[] = [];
    if (!firstName) missing.push("first_name");
    if (!lastName) missing.push("last_name");
    if (!student.gender) missing.push("gender");
    if (!student.nin?.trim()) missing.push("nin");
    if (!student.jambNumber?.trim()) missing.push("jamb_number");
    if (!student.stateOfOrigin?.trim()) missing.push("state_of_origin");
    if (!student.lga?.trim()) missing.push("lga");
    if (!user?.phone?.trim()) missing.push("phone");
    if (!user?.email?.trim()) missing.push("email");

    return {
        success: true,
        profile: { ...student, firstName, lastName, email: user?.email || "", phone: user?.phone || "" },
        missing,
        isComplete: missing.length === 0 || student.profileCompleted === true,
    };
}

export async function completeStudentProfile(data: {
    firstName: string; lastName: string; otherNames?: string; gender: string;
    nin: string; jambNumber: string; phone: string; email: string;
    stateOfOrigin: string; lga: string;
}) {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Not authenticated" };

    const [student] = await db.select({ id: students.id })
        .from(students)
        // @ts-expect-error - TS2769: Auto-suppressed for build
        .where(and(eq(students.userId, session.user.id), isNull(students.deletedAt)))
        .orderBy(
            sql`CASE WHEN ${students.status} = 'active' THEN 0 ELSE 1 END`,
            sql`CASE WHEN ${students.programmeType} = 'HND' THEN 0 ELSE 1 END`,
            desc(students.id)
        )
        .limit(1);
    if (!student) return { success: false, error: "Student record not found" };

    if (!data.firstName?.trim()) return { success: false, error: "First name is required" };
    if (!data.lastName?.trim()) return { success: false, error: "Last name is required" };
    if (!data.gender) return { success: false, error: "Gender is required" };
    if (!data.nin?.trim() || data.nin.trim().length !== 11) return { success: false, error: "NIN must be exactly 11 digits" };
    if (!data.jambNumber?.trim()) return { success: false, error: "JAMB Registration Number is required" };
    if (!data.phone?.trim()) return { success: false, error: "Phone number is required" };
    if (!data.email?.trim()) return { success: false, error: "Email is required" };
    if (!data.stateOfOrigin?.trim()) return { success: false, error: "State of Origin is required" };
    if (!data.lga?.trim()) return { success: false, error: "Local Government Area is required" };

    await db.update(students).set({
        firstName: data.firstName.trim(), lastName: data.lastName.trim(),
        otherNames: data.otherNames?.trim() || null, gender: data.gender as any,
        nin: data.nin.trim(), jambNumber: data.jambNumber.trim(),
        stateOfOrigin: data.stateOfOrigin.trim(), lga: data.lga.trim(),
        profileCompleted: true,
    }).where(eq(students.id, student.id));

    await db.update(users).set({
        firstName: data.firstName.trim(), surname: data.lastName.trim(),
        phone: data.phone.trim(), email: data.email.trim(),
        // @ts-expect-error - TS2769: Auto-suppressed for build
    }).where(eq(users.id, session.user.id));

    revalidatePath("/student");
    revalidatePath("/student/complete-profile");
    return { success: true, message: "Profile completed successfully." };
}

export async function updateUserEmail(newEmail: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Not authenticated. Please log in." };
        }

        const userId = Number(session.user.id);
        const cleanEmail = String(newEmail ?? '').trim().toLowerCase();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!cleanEmail || !emailRegex.test(cleanEmail)) {
            return { success: false, error: "Please provide a valid email address (e.g. yourname@gmail.com)." };
        }

        // Check if email is already in use by another active account
        const [existing] = await db.select({ id: users.id })
            .from(users)
            .where(and(eq(users.email, cleanEmail), ne(users.id, userId)))
            .limit(1);

        if (existing) {
            return { success: false, error: "This email address is already in use by another account." };
        }

        // Update user email
        await db.update(users)
            .set({ email: cleanEmail })
            .where(eq(users.id, userId));

        // Sync with student record companion twins if applicable
        try {
            const [student] = await db.select().from(students).where(eq(students.userId, userId)).limit(1);
            if (student) {
                const twinConditions = [];
                if (student.admissionNumber) {
                    twinConditions.push(eq(students.admissionNumber, student.admissionNumber));
                }
                if (student.firstName && student.lastName) {
                    twinConditions.push(
                        and(
                            eq(students.firstName, student.firstName),
                            eq(students.lastName, student.lastName)
                        )
                    );
                }
                if (twinConditions.length > 0) {
                    const twins = await db.select({ id: students.id, userId: students.userId })
                        .from(students)
                        .where(and(or(...twinConditions), isNull(students.deletedAt)));

                    const companionUserIds = twins
                        .map(t => t.userId)
                        .filter((uid): uid is number => !!uid && uid !== userId);

                    if (companionUserIds.length > 0) {
                        await db.update(users)
                            .set({ email: cleanEmail })
                            .where(inArray(users.id, companionUserIds));
                    }
                }
            }
        } catch (twinErr) {
            console.warn("Twin email sync warning:", twinErr);
        }

        revalidatePath("/profile");
        revalidatePath("/student");
        return { success: true, message: "Email address updated successfully! You can now use this email to log in." };
    } catch (error: any) {
        console.error("Failed to update email:", error);
        return { success: false, error: error.message || "Failed to update email address." };
    }
}
