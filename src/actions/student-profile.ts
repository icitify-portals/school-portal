"use server";

import { db } from "@/db/db";
import { students, users, staffProfiles, admissionApplicationsV2, programmes, departments, academicSessions } from "@/db/schema";
import { eq, ne, and, or, isNull, inArray, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getStaffProfileByUserId } from "@/actions/hr_leave";
import { getStudentProfile as fetchStudentProfile } from "@/actions/students";
import { storage } from "@/lib/storage";
import { isStudentMatricLocked } from "@/lib/matric-visibility";
import { extractBiodataFields } from "@/lib/applicant-names";

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

        // Allow students to replace their profile image if needed
        if (data.imageUrl && data.imageUrl !== currentProfile.imageUrl) {
            updateData.isProfileLocked = false;
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
        if (profile && await isStudentMatricLocked({ studentId: profile.id, userId })) {
            return { ...profile, matricNumber: null, matricLocked: true };
        }
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
                .set({ imageUrl, isProfileLocked: false })
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

    const userId = Number(session.user.id);
    if (isNaN(userId)) return { success: false, error: "Invalid user session" };

    const [row] = await db.select({
        student: students,
        programme: programmes,
        department: departments,
        currentSession: academicSessions,
    })
        .from(students)
        .leftJoin(programmes, eq(students.programmeId, programmes.id))
        .leftJoin(departments, eq(students.deptId, departments.id))
        .leftJoin(academicSessions, eq(students.currentSessionId, academicSessions.id))
        .where(and(eq(students.userId, userId), isNull(students.deletedAt)))
        .orderBy(
            sql`CASE WHEN ${students.status} = 'active' THEN 0 ELSE 1 END`,
            sql`CASE WHEN ${students.programmeType} = 'HND' THEN 0 ELSE 1 END`,
            desc(students.id)
        )
        .limit(1);

    if (!row?.student) return { success: false, error: "Student record not found" };
    const student = row.student;

    const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { email: true, phone: true, name: true, firstName: true, surname: true },
    });

    const [latestApp] = await db.select()
        .from(admissionApplicationsV2)
        .where(eq(admissionApplicationsV2.applicantId, userId))
        .orderBy(desc(admissionApplicationsV2.id))
        .limit(1);

    let formData: Record<string, any> = {};
    if (latestApp?.data) {
        try { formData = typeof latestApp.data === "string" ? JSON.parse(latestApp.data) : latestApp.data; } catch {}
    }

    const rawBio = extractBiodataFields({
        formData,
        student,
        user: user || null,
        application: latestApp || null,
    });

    const normalizedGender = rawBio.gender?.toLowerCase() === "male" || rawBio.gender?.toLowerCase() === "female"
        ? rawBio.gender.toLowerCase()
        : "";

    const capturedFields = {
        surname: Boolean(rawBio.surname?.trim()),
        firstName: Boolean(rawBio.firstName?.trim()),
        middleName: Boolean(rawBio.middleName?.trim()),
        gender: normalizedGender === "male" || normalizedGender === "female",
        dob: Boolean(rawBio.dob?.trim()),
        stateOfOrigin: Boolean(rawBio.stateOfOrigin?.trim()),
        lga: Boolean(rawBio.lga?.trim()),
        nin: Boolean(rawBio.nin?.trim()),
        phone: Boolean(rawBio.phone?.trim()),
        email: Boolean(rawBio.email?.trim()),
        jambNumber: Boolean(rawBio.jambNumber?.trim()),
    };

    const missing: string[] = [];
    if (!capturedFields.firstName) missing.push("first_name");
    if (!capturedFields.surname) missing.push("last_name");
    if (!capturedFields.gender) missing.push("gender");
    if (!capturedFields.dob) missing.push("dob");
    if (!capturedFields.nin) missing.push("nin");
    if (!capturedFields.jambNumber) missing.push("jamb_number");
    if (!capturedFields.stateOfOrigin) missing.push("state_of_origin");
    if (!capturedFields.lga) missing.push("lga");
    if (!capturedFields.phone) missing.push("phone");
    if (!capturedFields.email) missing.push("email");

    const matricLocked = await isStudentMatricLocked({ studentId: student.id, userId });
    const hasAssignedMatric = Boolean(student.matricNumber && student.matricNumber.trim().length > 0);
    const matricVisibility = hasAssignedMatric
        ? (matricLocked ? "Hidden from Student (NELFUND Ready)" : "Unlocked (Fees Paid)")
        : "Not Assigned";
    const levelLabel = student.status === "nd_graduant" || student.status === "nd_graduated"
        ? "ND Graduant"
        : student.status === "hnd_graduant" || student.status === "hnd_graduated"
            ? "HND Graduant"
            : student.currentLevel
                ? `${student.programmeType || row.programme?.programmeType || ""} ${student.currentLevel}`.trim()
                : (student.programmeType || row.programme?.programmeType || "");
    const academicSession = row.currentSession?.name || (student.admissionYear ? `${student.admissionYear}/${student.admissionYear + 1}` : "2026/2027");

    return {
        success: true,
        profile: {
            ...student,
            matricNumber: matricLocked ? null : student.matricNumber,
            matricLocked,
            matricVisibility,
            levelLabel,
            programmeName: row.programme?.name || "",
            departmentName: row.department?.name || "",
            academicSession,
            firstName: rawBio.firstName || "",
            lastName: rawBio.surname || "",
            otherNames: rawBio.middleName || "",
            gender: normalizedGender,
            dob: rawBio.dob || "",
            nin: rawBio.nin || "",
            jambNumber: rawBio.jambNumber || "",
            stateOfOrigin: rawBio.stateOfOrigin || "",
            lga: rawBio.lga || "",
            email: rawBio.email || "",
            phone: rawBio.phone || "",
        },
        capturedFields,
        missing,
        isComplete: missing.length === 0 || student.profileCompleted === true,
    };
}

export async function updateMissingStudentBiodata(data: {
    surname?: string;
    firstName?: string;
    middleName?: string;
    gender?: string;
    dob?: string;
    stateOfOrigin?: string;
    lga?: string;
    nin?: string;
    phone?: string;
    email?: string;
    jambNumber?: string;
}) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Not authenticated. Please log in." };

        const userId = Number(session.user.id);
        if (isNaN(userId)) return { success: false, error: "Invalid user session." };

        const [student] = await db.select()
            .from(students)
            .where(and(eq(students.userId, userId), isNull(students.deletedAt)))
            .orderBy(
                sql`CASE WHEN ${students.status} = 'active' THEN 0 ELSE 1 END`,
                sql`CASE WHEN ${students.programmeType} = 'HND' THEN 0 ELSE 1 END`,
                desc(students.id)
            )
            .limit(1);

        if (!student) return { success: false, error: "Student record not found." };

        const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        const [latestApp] = await db.select()
            .from(admissionApplicationsV2)
            .where(eq(admissionApplicationsV2.applicantId, userId))
            .orderBy(desc(admissionApplicationsV2.id))
            .limit(1);

        let formData: Record<string, any> = {};
        if (latestApp?.data) {
            try { formData = typeof latestApp.data === "string" ? JSON.parse(latestApp.data) : { ...(latestApp.data as Record<string, any>) }; } catch {}
        }

        const currentBio = extractBiodataFields({
            formData,
            student,
            user: user || null,
            application: latestApp || null,
        });

        const currentGender = currentBio.gender?.toLowerCase() === "male" || currentBio.gender?.toLowerCase() === "female"
            ? currentBio.gender.toLowerCase()
            : "";

        const isCaptured = {
            surname: Boolean(currentBio.surname?.trim()),
            firstName: Boolean(currentBio.firstName?.trim()),
            middleName: Boolean(currentBio.middleName?.trim()),
            gender: currentGender === "male" || currentGender === "female",
            dob: Boolean(currentBio.dob?.trim()),
            stateOfOrigin: Boolean(currentBio.stateOfOrigin?.trim()),
            lga: Boolean(currentBio.lga?.trim()),
            nin: Boolean(currentBio.nin?.trim()),
            phone: Boolean(currentBio.phone?.trim()),
            email: Boolean(currentBio.email?.trim()),
            jambNumber: Boolean(currentBio.jambNumber?.trim()),
        };

        const studentUpdates: Record<string, any> = {};
        const userUpdates: Record<string, any> = {};
        const appFormUpdates: Record<string, any> = {};
        const updatedFields: string[] = [];

        if (!isCaptured.surname && data.surname?.trim()) {
            const val = data.surname.trim();
            studentUpdates.lastName = val;
            userUpdates.surname = val;
            appFormUpdates.surname = val;
            updatedFields.push("Surname");
        }
        if (!isCaptured.firstName && data.firstName?.trim()) {
            const val = data.firstName.trim();
            studentUpdates.firstName = val;
            userUpdates.firstName = val;
            appFormUpdates.firstName = val;
            updatedFields.push("First Name");
        }
        if (!isCaptured.middleName && data.middleName?.trim()) {
            const val = data.middleName.trim();
            studentUpdates.otherNames = val;
            appFormUpdates.middleName = val;
            updatedFields.push("Middle Name");
        }
        if (!isCaptured.gender && data.gender?.trim()) {
            const val = data.gender.trim().toLowerCase();
            if (val !== "male" && val !== "female") {
                return { success: false, error: "Gender must be Male or Female." };
            }
            studentUpdates.gender = val;
            appFormUpdates.gender = val;
            updatedFields.push("Gender");
        }
        if (!isCaptured.dob && data.dob?.trim()) {
            const val = data.dob.trim();
            const parsed = new Date(val);
            if (isNaN(parsed.getTime())) {
                return { success: false, error: "Please enter a valid Date of Birth." };
            }
            studentUpdates.dob = val;
            appFormUpdates.dob = val;
            updatedFields.push("Date of Birth");
        }
        if (!isCaptured.stateOfOrigin && data.stateOfOrigin?.trim()) {
            const val = data.stateOfOrigin.trim();
            studentUpdates.stateOfOrigin = val;
            appFormUpdates.stateOfOrigin = val;
            updatedFields.push("State of Origin");
        }
        if (!isCaptured.lga && data.lga?.trim()) {
            const val = data.lga.trim();
            studentUpdates.lga = val;
            appFormUpdates.lga = val;
            updatedFields.push("LGA");
        }
        if (!isCaptured.nin && data.nin?.trim()) {
            const val = data.nin.trim().replace(/\D/g, "");
            if (!/^\d{11}$/.test(val)) {
                return { success: false, error: "NIN must be exactly 11 digits." };
            }
            studentUpdates.nin = val;
            appFormUpdates.nin = val;
            updatedFields.push("NIN");
        }
        if (!isCaptured.phone && data.phone?.trim()) {
            const val = data.phone.trim();
            if (val.replace(/\D/g, "").length < 10) {
                return { success: false, error: "Please enter a valid phone number." };
            }
            userUpdates.phone = val;
            appFormUpdates.phone = val;
            updatedFields.push("Phone Number");
        }
        if (!isCaptured.email && data.email?.trim()) {
            const val = data.email.trim().toLowerCase();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
                return { success: false, error: "Please enter a valid email address." };
            }
            const [existingEmail] = await db.select({ id: users.id })
                .from(users)
                .where(and(eq(users.email, val), ne(users.id, userId)))
                .limit(1);
            if (existingEmail) {
                return { success: false, error: "This email address is already registered to another account." };
            }
            userUpdates.email = val;
            appFormUpdates.email = val;
            updatedFields.push("Email");
        }
        if (!isCaptured.jambNumber && data.jambNumber?.trim()) {
            const val = data.jambNumber.trim().toUpperCase();
            const [existingJamb] = await db.select({ id: students.id, status: students.status, userId: students.userId })
                .from(students)
                .where(and(eq(students.jambNumber, val), ne(students.id, student.id)))
                .limit(1);
            if (existingJamb) {
                if (existingJamb.status === "withdrawn" || existingJamb.userId === userId) {
                    await db.update(students)
                        .set({ jambNumber: `${val}.retired.${existingJamb.id}` })
                        .where(eq(students.id, existingJamb.id));
                } else {
                    return { success: false, error: "This JAMB Registration Number is already associated with another active student." };
                }
            }
            studentUpdates.jambNumber = val;
            appFormUpdates.jambNumber = val;
            updatedFields.push("JAMB No");
        }

        if (updatedFields.length === 0) {
            return { success: false, error: "No missing fields were provided to update. Already-captured fields are read-only." };
        }

        if (Object.keys(studentUpdates).length > 0) {
            await db.update(students).set(studentUpdates).where(eq(students.id, student.id));
        }

        if (Object.keys(userUpdates).length > 0 || studentUpdates.lastName || studentUpdates.firstName || studentUpdates.otherNames) {
            const finalSurname = studentUpdates.lastName || currentBio.surname || user?.surname || "";
            const finalFirst = studentUpdates.firstName || currentBio.firstName || user?.firstName || "";
            const finalMiddle = studentUpdates.otherNames || currentBio.middleName || "";
            const fullName = `${finalSurname} ${finalFirst}${finalMiddle ? " " + finalMiddle : ""}`.trim();
            if (fullName) {
                userUpdates.name = fullName;
            }
            if (Object.keys(userUpdates).length > 0) {
                await db.update(users).set(userUpdates).where(eq(users.id, userId));
            }
        }

        if (latestApp && Object.keys(appFormUpdates).length > 0) {
            const mergedFormData = { ...formData, ...appFormUpdates };
            await db.update(admissionApplicationsV2)
                .set({ data: JSON.stringify(mergedFormData) })
                .where(eq(admissionApplicationsV2.id, latestApp.id));
        }

        revalidatePath("/profile");
        revalidatePath("/student");
        revalidatePath("/student/profile");
        revalidatePath("/student/complete-profile");

        return {
            success: true,
            updatedFields,
            message: `Saved ${updatedFields.join(", ")}. Captured fields are now locked as read-only.`,
        };
    } catch (err: any) {
        console.error("updateMissingStudentBiodata error:", err);
        return { success: false, error: err.message || "Failed to update missing biodata." };
    }
}

export async function completeStudentProfile(data: {
    firstName: string; lastName: string; otherNames?: string; gender: string;
    dob?: string; nin: string; jambNumber: string; phone: string; email: string;
    stateOfOrigin: string; lga: string;
}) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Not authenticated. Please log in." };

        const userId = Number(session.user.id);
        if (isNaN(userId)) return { success: false, error: "Invalid user session." };

        const [student] = await db.select()
            .from(students)
            .where(and(eq(students.userId, userId), isNull(students.deletedAt)))
            .orderBy(
                sql`CASE WHEN ${students.status} = 'active' THEN 0 ELSE 1 END`,
                sql`CASE WHEN ${students.programmeType} = 'HND' THEN 0 ELSE 1 END`,
                desc(students.id)
            )
            .limit(1);
        if (!student) return { success: false, error: "Student record not found" };

        const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        const [latestApp] = await db.select()
            .from(admissionApplicationsV2)
            .where(eq(admissionApplicationsV2.applicantId, userId))
            .orderBy(desc(admissionApplicationsV2.id))
            .limit(1);

        let formData: Record<string, any> = {};
        if (latestApp?.data) {
            try { formData = typeof latestApp.data === "string" ? JSON.parse(latestApp.data) : { ...(latestApp.data as Record<string, any>) }; } catch {}
        }

        const currentBio = extractBiodataFields({
            formData,
            student,
            user: user || null,
            application: latestApp || null,
        });
        const currentGender = currentBio.gender?.toLowerCase() === "male" || currentBio.gender?.toLowerCase() === "female"
            ? currentBio.gender.toLowerCase()
            : "";

        // Fill-once enforcement: keep already-captured values, only fill missing fields from payload
        const cleanFirstName = (currentBio.firstName?.trim()) || data.firstName?.trim() || "";
        const cleanLastName = (currentBio.surname?.trim()) || data.lastName?.trim() || "";
        const cleanOtherNames = (currentBio.middleName?.trim()) || data.otherNames?.trim() || null;
        const cleanGender = currentGender || (data.gender?.trim()?.toLowerCase() || "");
        const cleanDob = (currentBio.dob?.trim()) || data.dob?.trim() || "";
        const cleanNin = (currentBio.nin?.trim()) || data.nin?.trim()?.replace(/\D/g, "") || "";
        const cleanJamb = (currentBio.jambNumber?.trim()?.toUpperCase()) || data.jambNumber?.trim()?.toUpperCase() || "";
        const cleanPhone = (currentBio.phone?.trim()) || data.phone?.trim() || "";
        const cleanEmail = (currentBio.email?.trim()?.toLowerCase()) || data.email?.trim()?.toLowerCase() || "";
        const cleanState = (currentBio.stateOfOrigin?.trim()) || data.stateOfOrigin?.trim() || "";
        const cleanLga = (currentBio.lga?.trim()) || data.lga?.trim() || "";

        if (!cleanFirstName) return { success: false, error: "First name is required" };
        if (!cleanLastName) return { success: false, error: "Last name is required" };
        if (cleanGender !== "male" && cleanGender !== "female") return { success: false, error: "Gender is required" };
        if (!cleanNin || !/^\d{11}$/.test(cleanNin)) return { success: false, error: "NIN must be exactly 11 digits" };
        if (!cleanJamb) return { success: false, error: "JAMB Registration Number is required" };
        if (!cleanPhone) return { success: false, error: "Phone number is required" };
        if (!cleanEmail) return { success: false, error: "Email is required" };
        if (!cleanState) return { success: false, error: "State of Origin is required" };
        if (!cleanLga) return { success: false, error: "Local Government Area is required" };

        if (!currentBio.email?.trim()) {
            const [existingEmail] = await db.select({ id: users.id })
                .from(users)
                .where(and(eq(users.email, cleanEmail), ne(users.id, userId)))
                .limit(1);

            if (existingEmail) {
                return { success: false, error: "This email address is already registered to another account." };
            }
        }

        if (!currentBio.jambNumber?.trim()) {
            const [existingJamb] = await db.select({ id: students.id, status: students.status, userId: students.userId })
                .from(students)
                .where(and(eq(students.jambNumber, cleanJamb), ne(students.id, student.id)))
                .limit(1);

            if (existingJamb) {
                if (existingJamb.status === 'withdrawn' || existingJamb.userId === userId) {
                    await db.update(students)
                        .set({ jambNumber: `${cleanJamb}.retired.${existingJamb.id}` })
                        .where(eq(students.id, existingJamb.id));
                } else {
                    return { success: false, error: "This JAMB Registration Number is already associated with another active student." };
                }
            }
        }

        await db.update(students).set({
            firstName: cleanFirstName,
            lastName: cleanLastName,
            otherNames: cleanOtherNames,
            gender: cleanGender as any,
            ...(cleanDob ? { dob: cleanDob } : {}),
            nin: cleanNin,
            jambNumber: cleanJamb,
            stateOfOrigin: cleanState,
            lga: cleanLga,
            profileCompleted: true,
            isProfileLocked: false,
        }).where(eq(students.id, student.id));

        const fullName = `${cleanLastName} ${cleanFirstName}${cleanOtherNames ? ' ' + cleanOtherNames : ''}`.trim();
        await db.update(users).set({
            name: fullName,
            firstName: cleanFirstName,
            surname: cleanLastName,
            phone: cleanPhone,
            email: cleanEmail,
        }).where(eq(users.id, userId));

        if (latestApp) {
            await db.update(admissionApplicationsV2)
                .set({
                    data: JSON.stringify({
                        ...formData,
                        surname: cleanLastName,
                        firstName: cleanFirstName,
                        middleName: cleanOtherNames || "",
                        gender: cleanGender,
                        ...(cleanDob ? { dob: cleanDob } : {}),
                        stateOfOrigin: cleanState,
                        lga: cleanLga,
                        nin: cleanNin,
                        phone: cleanPhone,
                        email: cleanEmail,
                        jambNumber: cleanJamb,
                    })
                })
                .where(eq(admissionApplicationsV2.id, latestApp.id));
        }

        revalidatePath("/student");
        revalidatePath("/profile");
        revalidatePath("/student/profile");
        revalidatePath("/student/complete-profile");
        return { success: true, message: "Profile completed successfully." };
    } catch (err: any) {
        console.error("completeStudentProfile error:", err);
        return { success: false, error: err.message || "Failed to update profile. Please try again." };
    }
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
