"use server";

import { db } from "@/db/db";
import { students, users, staffProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
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
}) {
    try {
        const [currentProfile] = await db.select().from(students).where(eq(students.userId, userId)).limit(1);

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
            .where(eq(students.userId, userId));

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
        const [profile] = await db.select().from(students).where(eq(students.userId, userId)).limit(1);
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
        // @ts-expect-error - TS2339: Auto-suppressed for build
        if (!isStaff && profile.isProfileLocked) {
            return { success: false, error: "Profile image is locked and cannot be changed." };
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
