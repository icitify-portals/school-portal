"use strict";
"use server";

import { db } from "@/db/db";
import { matriculationSettings, matriculationSequences, departments, faculties, institutionalUnits } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { hasPermission, hasRole } from "@/lib/rbac";

export async function getMatriculationSettings() {
    try {
        const settings = await db.select({
            id: matriculationSettings.id,
            nomenclature: matriculationSettings.nomenclature,
            format: matriculationSettings.format,
            serialStart: matriculationSettings.serialStart,
            serialPadding: matriculationSettings.serialPadding,
            unitId: matriculationSettings.unitId,
            facultyId: matriculationSettings.facultyId,
            deptId: matriculationSettings.deptId,
            deptCode: departments.code,
            facultyCode: faculties.code,
            unitName: institutionalUnits.name,
        }).from(matriculationSettings)
            .leftJoin(departments, eq(matriculationSettings.deptId, departments.id))
            .leftJoin(faculties, eq(matriculationSettings.facultyId, faculties.id))
            .leftJoin(institutionalUnits, eq(matriculationSettings.unitId, institutionalUnits.id));
        return settings;
    } catch (error) {
        console.error("Failed to fetch matriculation settings:", error);
        return [];
    }
}

export async function saveMatriculationSetting(data: {
    id?: number;
    nomenclature: string;
    format: string;
    serialStart: number;
    serialPadding: number;
    unitId?: number;
    facultyId?: number;
    deptId?: number;
}) {
    try {
        const allowed = await hasPermission("academic.matriculation.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to manage matriculation settings" };

        if (data.id) {
            await db.update(matriculationSettings).set({
                nomenclature: data.nomenclature,
                format: data.format,
                serialStart: data.serialStart,
                serialPadding: data.serialPadding,
                unitId: data.unitId || null,
                facultyId: data.facultyId || null,
                deptId: data.deptId || null,
            }).where(eq(matriculationSettings.id, data.id));
        } else {
            await db.insert(matriculationSettings).values({
                nomenclature: data.nomenclature,
                format: data.format,
                serialStart: data.serialStart,
                serialPadding: data.serialPadding,
                unitId: data.unitId || null,
                facultyId: data.facultyId || null,
                deptId: data.deptId || null,
            });
        }
        revalidatePath("/admin/settings/matriculation");
        return { success: true };
    } catch (error) {
        console.error("Failed to save matriculation setting:", error);
        return { success: false, error: "Failed to save settings." };
    }
}

export async function deleteMatriculationSetting(id: number) {
    try {
        const allowed = await hasPermission("academic.matriculation.manage") || await hasRole("admin") || await hasRole("superadmin");
        if (!allowed) return { success: false, error: "Unauthorized: Insufficient permissions to delete matriculation setting" };

        // Can't delete if sequences exist, so we delete sequences first
        await db.delete(matriculationSequences).where(eq(matriculationSequences.settingId, id));
        await db.delete(matriculationSettings).where(eq(matriculationSettings.id, id));
        revalidatePath("/admin/settings/matriculation");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete matriculation setting:", error);
        return { success: false, error: "Failed to delete setting." };
    }
}

export async function generateMatricNumber(options: {
    year: number;
    deptId?: number;
    facultyId?: number;
    unitId?: number;
    studyMode?: string;
    programmeType?: string;
    previewOnly?: boolean;
}): Promise<{ success: boolean; matricNumber?: string; error?: string; lastSerialNumber?: number }> {
    try {
        const { year, deptId, facultyId, unitId, studyMode, programmeType, previewOnly } = options;

        let deptCode = "GEN";
        let facultyCode = "GEN";
        let unitCode = "GEN";

        if (deptId) {
            const dept = await db.select().from(departments).where(eq(departments.id, deptId)).limit(1);
            if (dept.length > 0) deptCode = dept[0].code;
        }
        if (facultyId) {
            const fac = await db.select().from(faculties).where(eq(faculties.id, facultyId)).limit(1);
            if (fac.length > 0) facultyCode = fac[0].code;
        }
        // Assuming unit might have a name/code we can use, simplified here to "U"
        if (unitId) {
            unitCode = `U${unitId}`;
        }

        // Determine Prefix based on Study Mode and Programme Type
        let prefix = "";
        const isPartTime = studyMode?.toLowerCase().includes("part");
        const isHnd = programmeType?.toUpperCase() === "HND";

        if (isPartTime) {
            prefix = isHnd ? "DPP/HND/" : "DPP/";
        } else {
            // Full-Time
            prefix = isHnd ? "HND/" : "";
        }

        // Apply Prefix to the department code so that it seamlessly integrates with {DEPT_CODE}
        deptCode = `${prefix}${deptCode}`;

        // Find the best setting: Priority -> Dept > Faculty > Unit > Global
        let bestSetting = null;

        const allSettings = await db.select().from(matriculationSettings);

        if (deptId) bestSetting = allSettings.find(s => s.deptId === deptId);
        if (!bestSetting && facultyId) bestSetting = allSettings.find(s => s.facultyId === facultyId);
        if (!bestSetting && unitId) bestSetting = allSettings.find(s => s.unitId === unitId);
        if (!bestSetting) bestSetting = allSettings.find(s => !s.deptId && !s.facultyId && !s.unitId);

        // If absolutely no setting exists, create a default global one to prevent failure
        if (!bestSetting) {
            if (!previewOnly) {
                const [insertRes] = await db.insert(matriculationSettings).values({
                    nomenclature: "Matriculation Number",
                    format: "{DEPT_CODE}/FSS/IB/{YEAR}/{SERIAL}",
                    serialStart: 1,
                    serialPadding: 3,
                });
                bestSetting = {
                    id: insertRes.insertId,
                    format: "{DEPT_CODE}/FSS/IB/{YEAR}/{SERIAL}",
                    serialStart: 1,
                    serialPadding: 3,
                } as any;
            } else {
                bestSetting = {
                    id: -1,
                    format: "{DEPT_CODE}/FSS/IB/{YEAR}/{SERIAL}",
                    serialStart: 1,
                    serialPadding: 3,
                } as any;
            }
        }

        let serialNumberToIssue = bestSetting.serialStart;
        let lastSerialNumber = bestSetting.serialStart - 1;

        if (previewOnly) {
            const sequence = await db.select().from(matriculationSequences).where(
                and(
                    eq(matriculationSequences.settingId, bestSetting.id),
                    eq(matriculationSequences.year, year)
                )
            ).limit(1);
            if (sequence.length > 0) {
                lastSerialNumber = sequence[0].currentSerial || 0;
                serialNumberToIssue = lastSerialNumber + 1;
            }
        } else {
            // Use transaction to ensure serials are never duplicated
            await db.transaction(async (tx) => {
                const sequence = await tx.select().from(matriculationSequences).where(
                    and(
                        eq(matriculationSequences.settingId, bestSetting.id),
                        eq(matriculationSequences.year, year)
                    )
                ).limit(1);

                if (sequence.length > 0) {
                    lastSerialNumber = sequence[0].currentSerial || 0;
                    serialNumberToIssue = lastSerialNumber + 1;
                    await tx.update(matriculationSequences)
                        .set({ currentSerial: serialNumberToIssue })
                        .where(eq(matriculationSequences.id, sequence[0].id));
                } else {
                    serialNumberToIssue = bestSetting.serialStart || 1;
                    lastSerialNumber = serialNumberToIssue - 1;
                    await tx.insert(matriculationSequences).values({
                        settingId: bestSetting.id,
                        year: year,
                        currentSerial: serialNumberToIssue
                    });
                }
            });
        }

        const serialPadding = bestSetting.serialPadding ?? 3;
        const paddedSerial = serialPadding > 0 ? String(serialNumberToIssue).padStart(serialPadding, "0") : String(serialNumberToIssue);

        let generatedNumber = bestSetting.format || "{YEAR}/{SERIAL}";
        generatedNumber = generatedNumber.replace(/{YEAR}/g, year.toString());
        generatedNumber = generatedNumber.replace(/{DEPT_CODE}/g, deptCode);
        generatedNumber = generatedNumber.replace(/{FACULTY_CODE}/g, facultyCode);
        generatedNumber = generatedNumber.replace(/{UNIT_CODE}/g, unitCode);
        generatedNumber = generatedNumber.replace(/{SERIAL}/g, paddedSerial);

        return { success: true, matricNumber: generatedNumber, lastSerialNumber: lastSerialNumber };

    } catch (error) {
        console.error("Error generating matric number:", error);
        return { success: false, error: "Failed to generate matriculation number" };
    }
}
export async function getMatriculatedStudents(filters?: { sessionId?: number, programmeId?: number, level?: number }) {
    try {
        const { students, programmes, academicSessions } = await import('@/db/schema');
        const { desc, and, eq, sql, isNotNull } = await import('drizzle-orm');

        const conditions = [isNotNull(students.matricNumber)];

        if (filters?.programmeId) {
            conditions.push(eq(students.programmeId, filters.programmeId));
        }
        if (filters?.level) {
            conditions.push(eq(students.currentLevel, filters.level));
        }

        const data = await db.select({
            id: students.id,
            firstName: students.firstName,
            lastName: students.lastName,
            otherNames: students.otherNames,
            matriculationNumber: students.matricNumber,
            currentLevel: students.currentLevel,
            programmeName: programmes.name,
            studyMode: students.studyMode,
        })
        .from(students)
        .leftJoin(programmes, eq(students.programmeId, programmes.id))
        .where(and(...conditions))
            .orderBy(desc(students.matricNumber));

        return data;
    } catch (error) {
        console.error("Failed to fetch matriculated students:", error);
        return [];
    }
}
