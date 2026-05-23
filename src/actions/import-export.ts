"use server";

import * as xlsx from "xlsx";
import { db } from "@/db/db";
import { faculties, departments, programmes, courses, users, staffProfiles, institutionalUnits } from "@/db/schema";
import { auth } from "@/auth";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Define the supported entity types
export type ImportExportEntity = 'faculties' | 'departments' | 'programmes' | 'courses' | 'staff';

interface EntityDefinition {
    name: string;
    columns: string[];
    instructions: string[];
}

const ENTITY_CONFIG: Record<ImportExportEntity, EntityDefinition> = {
    faculties: {
        name: "Faculties",
        columns: ["Name", "Code", "Institutional Unit Code"],
        instructions: [
            "Name: Full name of the faculty (e.g., Faculty of Science)",
            "Code: Short unique code (e.g., SCI)",
            "Institutional Unit Code: Code of the parent campus/unit (e.g., MAIN). Must exist in the system first."
        ]
    },
    departments: {
        name: "Departments",
        columns: ["Name", "Code", "Faculty Code", "Institutional Unit Code"],
        instructions: [
            "Name: Full name of the department",
            "Code: Short unique code (e.g., CSC)",
            "Faculty Code: Code of the parent faculty. Must exist in the system.",
            "Institutional Unit Code: Code of the parent campus. Must match the faculty's unit."
        ]
    },
    programmes: {
        name: "Programmes",
        columns: ["Name", "Code", "Department Code", "Duration Years", "Duration Months"],
        instructions: [
            "Name: Name of the degree programme (e.g., B.Sc. Computer Science)",
            "Code: Short code (e.g., BSC-CSC)",
            "Department Code: Code of the parent department",
            "Duration Years: Total years of the programme (e.g., 4)",
            "Duration Months: Total months (e.g., 48)"
        ]
    },
    courses: {
        name: "Courses",
        columns: ["Course Name", "Course Code", "Credit Units", "Is Practical", "Description"],
        instructions: [
            "Course Name: Full title of the course",
            "Course Code: Unique Alphanumeric code (e.g., CSC101)",
            "Credit Units: Numeric weight of the course (e.g., 3)",
            "Is Practical: TRUE or FALSE",
            "Description: Optional summary of the course content"
        ]
    },
    staff: {
        name: "Staff Profiles",
        columns: ["First Name", "Last Name", "Email", "Staff Number", "Job Title", "Department Code", "Gender", "Phone Number"],
        instructions: [
            "First Name & Last Name: Required fields",
            "Email: Must be unique. Used for login.",
            "Staff Number: Unique employee ID",
            "Job Title: e.g., Senior Lecturer, Professor, Admin Officer",
            "Department Code: Code of primary department",
            "Gender: male, female, or other",
            "Phone Number: International format preferred"
        ]
    }
};

/**
 * 1. DOWNLOAD TEMPLATE
 * Generates an empty XLSX blob (Base64 so it can cross RSC boundaries to client)
 */
export async function downloadTemplate(entity: ImportExportEntity): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
        const session = await auth();
        if ((session?.user as any)?.role !== 'admin') return { success: false, error: "Unauthorized" };

        const config = ENTITY_CONFIG[entity];
        const wb = xlsx.utils.book_new();

        // Data Sheet
        const dataSheet = xlsx.utils.aoa_to_sheet([config.columns]);
        xlsx.utils.book_append_sheet(wb, dataSheet, "Data");

        // Instructions Sheet
        const instructionsSheet = xlsx.utils.aoa_to_sheet([
            ["Instructions for Import"],
            ...config.instructions.map(inst => [inst])
        ]);
        xlsx.utils.book_append_sheet(wb, instructionsSheet, "Instructions");

        const options = { bookType: 'xlsx' as const, type: 'base64' as const };
        const b64 = xlsx.write(wb, options);

        return { success: true, data: b64 };
    } catch (e: any) {
        console.error("Download Template Error:", e);
        return { success: false, error: "Failed to generate template" };
    }
}

/**
 * 2. EXPORT DATA
 * Pulls current data from the DB and generates an XLSX blob
 */
export async function exportData(entity: ImportExportEntity): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
        const session = await auth();
        if ((session?.user as any)?.role !== 'admin') return { success: false, error: "Unauthorized" };

        const config = ENTITY_CONFIG[entity];
        let rows: any[][] = [config.columns];

        if (entity === 'faculties') {
            const data = await db.select({
                name: faculties.name,
                code: faculties.code,
                unitCode: institutionalUnits.code
            }).from(faculties)
                .leftJoin(institutionalUnits, eq(faculties.unitId, institutionalUnits.id));

            data.forEach(d => rows.push([d.name, d.code, d.unitCode || '']));
        }
        else if (entity === 'departments') {
            const data = await db.select({
                name: departments.name,
                code: departments.code,
                facultyCode: faculties.code,
                unitCode: institutionalUnits.code
            }).from(departments)
                .leftJoin(faculties, eq(departments.facultyId, faculties.id))
                .leftJoin(institutionalUnits, eq(departments.unitId, institutionalUnits.id));

            data.forEach(d => rows.push([d.name, d.code, d.facultyCode || '', d.unitCode || '']));
        }
        else if (entity === 'programmes') {
            const data = await db.select({
                name: programmes.name,
                code: programmes.code,
                deptCode: departments.code,
                durationY: programmes.durationYears,
                durationM: programmes.durationMonths
            }).from(programmes)
                .leftJoin(departments, eq(programmes.deptId, departments.id));

            data.forEach(d => rows.push([d.name, d.code, d.deptCode || '', d.durationY, d.durationM]));
        }
        else if (entity === 'courses') {
            const data = await db.select().from(courses);
            data.forEach(d => rows.push([d.name, d.code, d.creditUnits, !!d.isPractical, d.description || '']));
        }
        else if (entity === 'staff') {
            const data = await db.select({
                first: users.name, // Using monolithic name for export display, though separate in import forms ideally
                email: users.email,
                staffNo: staffProfiles.staffId,
                title: staffProfiles.jobTitle,
                deptCode: departments.code
            }).from(staffProfiles)
                .leftJoin(users, eq(staffProfiles.userId, users.id))
                .leftJoin(departments, eq(staffProfiles.departmentId, departments.id));

            // Naively split name assuming 'First Last' but realistically user might have custom data mapping
            data.forEach(d => {
                const parts = (d.first || '').split(' ');
                const firstName = parts[0];
                const lastName = parts.slice(1).join(' ');
                rows.push([firstName, lastName, d.email, d.staffNo, d.title || '', d.deptCode || '']);
            });
        }

        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.aoa_to_sheet(rows);
        xlsx.utils.book_append_sheet(wb, ws, config.name);

        const options = { bookType: 'xlsx' as const, type: 'base64' as const };
        const b64 = xlsx.write(wb, options);

        return { success: true, data: b64 };
    } catch (e: any) {
        console.error("Export Data Error:", e);
        return { success: false, error: "Failed to export data" };
    }
}

/**
 * 3. IMPORT DATA
 * Accepts Base64 encoded file content from client, parses it, and safely bulk inserts.
 */
export async function importData(entity: ImportExportEntity, base64Data: string): Promise<{ success: boolean; inserted?: number; errors?: string[] }> {
    try {
        const session = await auth();
        if ((session?.user as any)?.role !== 'admin') return { success: false, errors: ["Unauthorized"] };

        // 1. Read buffer
        const buffer = Buffer.from(base64Data, 'base64');
        const wb = xlsx.read(buffer, { type: 'buffer' });
        const sheetName = wb.SheetNames[0]; // Assuming data is on first sheet
        const sheet = wb.Sheets[sheetName];

        // 2. Parse to JSON
        const rawData = xlsx.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
        if (rawData.length < 2) return { success: false, errors: ["File is empty or missing data rows."] };

        // Exclude header row
        const dataRows = rawData.slice(1).filter(r => r && r.length > 0 && r.some(cell => !!cell));

        let insertedCount = 0;
        const processingErrors: string[] = [];

        // 3. Process records according to entity type (Inside a Transaction wrapper ideally, but for massive imports looping is safer to catch individual skips)
        await db.transaction(async (tx) => {

            if (entity === 'faculties') {
                // Pre-fetch units for mapping
                const units = await tx.select().from(institutionalUnits);
                const unitMap = new Map(units.map(u => [u.code.toUpperCase(), u.id]));

                for (let i = 0; i < dataRows.length; i++) {
                    const [rowName, rowCode, unitCode] = dataRows[i];
                    if (!rowName || !rowCode) {
                        processingErrors.push(`Row ${i + 2}: Missing required Name or Code.`);
                        continue;
                    }
                    const uid = unitCode ? unitMap.get(String(unitCode).toUpperCase()) : null;
                    if (unitCode && !uid) processingErrors.push(`Row ${i + 2}: Unknown Unit Code '${unitCode}'`);

                    try {
                        await tx.insert(faculties).values({
                            name: String(rowName),
                            code: String(rowCode).toUpperCase(),
                            unitId: uid
                        });
                        insertedCount++;
                    } catch (e: any) {
                        processingErrors.push(`Row ${i + 2}: Failed to insert (Code might already exist).`);
                    }
                }
            }
            else if (entity === 'departments') {
                const unitList = await tx.select().from(institutionalUnits);
                const facultyList = await tx.select().from(faculties);
                const unitMap = new Map(unitList.map(u => [u.code.toUpperCase(), u.id]));
                const facMap = new Map(facultyList.map(f => [f.code.toUpperCase(), f.id]));

                for (let i = 0; i < dataRows.length; i++) {
                    const [rowName, rowCode, facCode, unitCode] = dataRows[i];
                    if (!rowName || !rowCode) {
                        processingErrors.push(`Row ${i + 2}: Missing required Name or Code.`);
                        continue;
                    }

                    const fid = facCode ? facMap.get(String(facCode).toUpperCase()) : null;
                    const uid = unitCode ? unitMap.get(String(unitCode).toUpperCase()) : null;

                    try {
                        await tx.insert(departments).values({
                            name: String(rowName),
                            code: String(rowCode).toUpperCase(),
                            facultyId: fid,
                            unitId: uid
                        });
                        insertedCount++;
                    } catch (e: any) {
                        processingErrors.push(`Row ${i + 2}: Insert failed.`);
                    }
                }
            }
            else if (entity === 'courses') {
                for (let i = 0; i < dataRows.length; i++) {
                    const [cName, cCode, cUnits, isPrac, cDesc] = dataRows[i];
                    if (!cName || !cCode || !cUnits) {
                        processingErrors.push(`Row ${i + 2}: Missing required Course Name, Code, or Units.`);
                        continue;
                    }

                    try {
                        const creditNum = parseInt(String(cUnits));
                        if (isNaN(creditNum)) throw new Error("Invalid credits");

                        const pracBool = String(isPrac).toLowerCase() === 'true' || isPrac === true || isPrac === 1;

                        await tx.insert(courses).values({
                            name: String(cName),
                            code: String(cCode).toUpperCase(),
                            creditUnits: creditNum,
                            isPractical: pracBool,
                            description: cDesc ? String(cDesc) : null
                        });
                        insertedCount++;
                    } catch (e: any) {
                        processingErrors.push(`Row ${i + 2}: Insert failed (${e.message || 'Duplicate Code?'}).`);
                    }
                }
            }
            else if (entity === 'programmes') {
                const deptList = await tx.select().from(departments);
                const deptMap = new Map(deptList.map(d => [d.code.toUpperCase(), d.id]));

                for (let i = 0; i < dataRows.length; i++) {
                    const [pName, pCode, deptCode, dYears, dMonths] = dataRows[i];
                    if (!pName || !pCode || !deptCode) {
                        processingErrors.push(`Row ${i + 2}: Missing required Name, Code, or Dept Code.`);
                        continue;
                    }
                    
                    const did = deptMap.get(String(deptCode).toUpperCase());
                    if (!did) {
                        processingErrors.push(`Row ${i + 2}: Unknown Department '${deptCode}'`);
                        continue;
                    }

                    try {
                        await tx.insert(programmes).values({
                            name: String(pName),
                            code: String(pCode).toUpperCase(),
                            deptId: did,
                            durationYears: parseInt(String(dYears)) || 4,
                            durationMonths: parseInt(String(dMonths)) || 48
                        });
                        insertedCount++;
                    } catch (e: any) {
                        processingErrors.push(`Row ${i + 2}: Insert failed (Code exist?).`);
                    }
                }
            }
            else if (entity === 'staff') {
                const deptList = await tx.select().from(departments);
                const deptMap = new Map(deptList.map(d => [d.code.toUpperCase(), d.id]));

                for (let i = 0; i < dataRows.length; i++) {
                    const [firstName, lastName, email, staffNo, jobTitle, deptCode, gender, phone] = dataRows[i];
                    if (!firstName || !lastName || !email || !staffNo) {
                        processingErrors.push(`Row ${i + 2}: Missing Name, Email, or Staff Number.`);
                        continue;
                    }

                    const did = deptCode ? deptMap.get(String(deptCode).toUpperCase()) : null;

                    try {
                        // 1. Create Base User
                        const defaultPassword = await bcrypt.hash(String(staffNo).toLowerCase(), 10);
                        const [userResult] = await tx.insert(users).values({
                            name: `${firstName} ${lastName}`.trim(),
                            email: String(email).toLowerCase(),
                            password: defaultPassword,
                            role: 'staff'
                        });

                        // 2. Create Staff Profile
                        await tx.insert(staffProfiles).values({
                            userId: userResult.insertId,
                            staffId: String(staffNo),
                            jobTitle: jobTitle ? String(jobTitle) : 'Staff Member',
                            departmentId: did
                        } as any);
                        insertedCount++;
                    } catch (e: any) {
                        processingErrors.push(`Row ${i + 2}: Insert failed (Email/StaffNo duplicate?).`);
                    }
                }
            }
            else {
                processingErrors.push("Import handler for this entity not fully implemented yet.");
            }
        });

        return { success: true, inserted: insertedCount, errors: processingErrors };

    } catch (e: any) {
        console.error("Bulk Import Data Error:", e);
        return { success: false, errors: ["Fatal server error during processing or parsing."] };
    }
}
