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
        let facultyCode = "FSS";
        let unitCode = "IB";

        if (deptId) {
            const dept = await db.select().from(departments).where(eq(departments.id, deptId)).limit(1);
            if (dept.length > 0) {
                const rawCode = (dept[0].code || "").trim().toUpperCase();
                const dName = (dept[0].name || "").toLowerCase();
                if (dName.includes("business") || rawCode === "BUS" || rawCode === "BAM") deptCode = "BAM";
                else if (dName.includes("networking") || rawCode === "NET" || rawCode === "NCC") deptCode = "NCC";
                else if (dName.includes("artificial") || rawCode === "ART" || rawCode === "AI") deptCode = "AI";
                else if (dName.includes("computer") || rawCode === "COM" || rawCode === "CSC") deptCode = "CSC";
                else if (dName.includes("statistics") || rawCode === "STA" || rawCode === "STAT") deptCode = "STA";
                else if (dName.includes("account") || rawCode === "ACC") deptCode = "ACC";
                else deptCode = rawCode || "GEN";
            }
        } else {
            const rawCode = (options as any).deptCode ? String((options as any).deptCode).toUpperCase().trim() : "GEN";
            if (rawCode === "BUS" || rawCode === "BAM") deptCode = "BAM";
            else if (rawCode === "NET" || rawCode === "NCC") deptCode = "NCC";
            else if (rawCode === "ART" || rawCode === "AI") deptCode = "AI";
            else if (rawCode === "COM" || rawCode === "CSC") deptCode = "CSC";
            else if (rawCode === "STA" || rawCode === "STAT") deptCode = "STA";
            else if (rawCode === "ACC") deptCode = "ACC";
            else deptCode = rawCode;
        }

        if (facultyId) {
            const fac = await db.select().from(faculties).where(eq(faculties.id, facultyId)).limit(1);
            if (fac.length > 0) facultyCode = fac[0].code || "FSS";
        }
        if (unitId) {
            unitCode = `U${unitId}`;
        }

        const isPartTime = (studyMode || "").toLowerCase().includes("part") || (studyMode || "").toLowerCase().includes("dpp");
        const isHnd = (programmeType || "").toUpperCase() === "HND";

        // Find the best setting: Priority -> Dept > Faculty > Unit > Global
        let bestSetting = null;

        const allSettings = await db.select().from(matriculationSettings);

        if (isHnd) {
            bestSetting = allSettings.find(s => s.id === 2)
                || allSettings.find(s => s.nomenclature?.toLowerCase().includes("hnd") || s.format?.includes("HND"))
                || allSettings[0];
        } else {
            bestSetting = allSettings.find(s => s.id === 1)
                || allSettings.find(s => s.nomenclature?.toLowerCase().includes("nd") && !s.nomenclature?.toLowerCase().includes("hnd"))
                || allSettings.find(s => s.id === 3)
                || allSettings[0];
        }

        // Standard arrangement:
        // HND fulltime: HND/BAM/FSS/IB/year/serial
        // HND parttime: DPP/HND/BAM/FSS/IB/year/serial
        // ND fulltime:  BAM/FSS/IB/year/serial
        // ND parttime:  DPP/BAM/FSS/IB/year/serial
        let formatTemplate = "";
        if (isHnd) {
            formatTemplate = isPartTime
                ? "DPP/HND/{DEPT_CODE}/FSS/IB/{YEAR}/{SERIAL}"
                : "HND/{DEPT_CODE}/FSS/IB/{YEAR}/{SERIAL}";
        } else {
            formatTemplate = isPartTime
                ? "DPP/{DEPT_CODE}/FSS/IB/{YEAR}/{SERIAL}"
                : "{DEPT_CODE}/FSS/IB/{YEAR}/{SERIAL}";
        }

        // If absolutely no setting exists, create a default global one to prevent failure
        if (!bestSetting) {
            if (!previewOnly) {
                const [insertRes] = await db.insert(matriculationSettings).values({
                    nomenclature: isHnd ? "HND Matriculation Number" : "ND Matriculation Number",
                    format: formatTemplate,
                    serialStart: isHnd ? 4210 : 120546,
                    serialPadding: 4,
                });
                bestSetting = {
                    id: insertRes.insertId,
                    format: formatTemplate,
                    serialStart: isHnd ? 4210 : 120546,
                    serialPadding: 4,
                } as any;
            } else {
                bestSetting = {
                    id: isHnd ? 2 : 1,
                    format: formatTemplate,
                    serialStart: isHnd ? 4210 : 120546,
                    serialPadding: 4,
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
            // Use transaction with row-level locking (FOR UPDATE) and retries to ensure serials are never duplicated
            let attempts = 0;
            const maxAttempts = 5;
            let success = false;
            
            while (attempts < maxAttempts && !success) {
                attempts++;
                try {
                    await db.transaction(async (tx) => {
                        const sequence = await tx.select().from(matriculationSequences).where(
                            and(
                                eq(matriculationSequences.settingId, bestSetting.id),
                                eq(matriculationSequences.year, year)
                            )
                        ).limit(1).for('update');
        
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
                    success = true;
                } catch (e: any) {
                    if (e.code === 'ER_DUP_ENTRY' || e.code === 'ER_LOCK_WAIT_TIMEOUT' || e.code === 'ER_LOCK_DEADLOCK' || (e.message && (e.message.includes('Duplicate entry') || e.message.includes('Deadlock') || e.message.includes('Lock')))) {
                        if (attempts >= maxAttempts) throw e;
                        await new Promise(r => setTimeout(r, Math.random() * 200 + 50));
                    } else {
                        throw e;
                    }
                }
            }
        }

        const serialPadding = bestSetting.serialPadding ?? 4;
        const paddedSerial = serialPadding > 0 ? String(serialNumberToIssue).padStart(serialPadding, "0") : String(serialNumberToIssue);

        let generatedNumber = formatTemplate || bestSetting.format || "{YEAR}/{SERIAL}";
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
