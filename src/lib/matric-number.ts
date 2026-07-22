import { eq, sql, inArray, and } from "drizzle-orm";
import {
    students,
    programmes,
    departments,
    studentBills,
    studentBillItems,
    systemSettings,
    feeItems
} from "@/db/schema";

export async function checkAndGenerateMatricNumber(studentId: number, tx: any) {
    try {
        // 1. Check if the student already has a matric number
        const [student] = await tx.select().from(students).where(eq(students.id, studentId)).limit(1);
        
        if (!student) {
            console.error(`[Matric Generation] Student ${studentId} not found.`);
            return false;
        }

        if (student.matriculationNumber) {
            console.log(`[Matric Generation] Student ${studentId} already has matric number: ${student.matriculationNumber}`);
            return false; // Already generated
        }

        // 2. Check global setting for trigger fees (e.g. JSON array of FeeItem IDs)
        const [setting] = await tx.select().from(systemSettings).where(eq(systemSettings.settingKey, 'matriculation_trigger_fees')).limit(1);
        let requiredFeeItemIds: number[] = [];

        if (setting && setting.settingValue) {
            try {
                requiredFeeItemIds = JSON.parse(setting.settingValue);
            } catch (e) {
                console.error("[Matric Generation] Invalid JSON in matriculation_trigger_fees", e);
            }
        }

        // If no global setting found, let's use a fallback by name: "Acceptance" and "ID Card"
        if (!requiredFeeItemIds || requiredFeeItemIds.length === 0) {
            // Find fee items with "Acceptance" or "ID Card" in their name
            const fees = await tx.select().from(feeItems);
            for (const f of fees) {
                if (f.name.toLowerCase().includes('acceptance') || f.name.toLowerCase().includes('id card')) {
                    requiredFeeItemIds.push(f.id);
                }
            }
            if (requiredFeeItemIds.length === 0) {
                console.log("[Matric Generation] No trigger fee items found in DB.");
                return false; 
            }
        }

        // 3. Verify if student has paid all required fee items
        // We look for paid bills that contain these fee items
        const paidItems = await tx.select({
            feeItemId: studentBillItems.feeItemId,
        })
        .from(studentBillItems)
        .innerJoin(studentBills, eq(studentBillItems.billId, studentBills.id))
        .where(
            and(
                eq(studentBills.studentId, studentId),
                eq(studentBills.status, 'paid'), // Must be fully paid
                inArray(studentBillItems.feeItemId, requiredFeeItemIds)
            )
        );

        const paidFeeItemIds = new Set(paidItems.map((item: any) => item.feeItemId));
        
        const hasPaidAll = requiredFeeItemIds.every(id => paidFeeItemIds.has(id));

        if (!hasPaidAll) {
            console.log(`[Matric Generation] Student ${studentId} has not paid all required fees for matriculation.`);
            return false;
        }

        // 4. Generate the Matric Number
        let prefix = "";

        // Check if Part-time (DPP)
        const isDPP = student.studyMode === 'part-time' || student.studyMode === 'dpp';
        if (isDPP) {
            prefix += "DPP/";
        }

        let isHND = false;
        let deptCode = "GEN";

        if (student.programmeId) {
            const [prog] = await tx.select().from(programmes).where(eq(programmes.id, student.programmeId)).limit(1);
            if (prog) {
                if (prog.name.toUpperCase().includes('HND') || student.currentLevel >= 300) {
                    isHND = true;
                }
                
                if (prog.departmentId) {
                    const [dept] = await tx.select().from(departments).where(eq(departments.id, prog.departmentId)).limit(1);
                    if (dept && dept.code) {
                        deptCode = dept.code.toUpperCase();
                    }
                }
            }
        } else {
             if (student.currentLevel >= 300) {
                 isHND = true;
             }
        }

        if (isHND) {
            prefix += `HND/${deptCode}/FSS/IB/`;
        } else {
            prefix += `${deptCode}/FSS/IB/`;
        }

        const year = new Date().getFullYear();
        prefix += `${year}/`;

        // 5. Get the next sequence
        // We'll query students for the highest matric number starting with this prefix
        const [lastStudent] = await tx.select({ matriculationNumber: students.matriculationNumber })
            .from(students)
            .where(sql`${students.matriculationNumber} LIKE ${prefix + '%'}`)
            .orderBy(sql`CAST(SUBSTRING_INDEX(${students.matriculationNumber}, '/', -1) AS UNSIGNED) DESC`)
            .limit(1);

        let nextSeq = 119000; // Starting sequence for FSS based on examples like 119613
        
        if (lastStudent && lastStudent.matriculationNumber) {
            const parts = lastStudent.matriculationNumber.split('/');
            const lastSeqStr = parts[parts.length - 1];
            const lastSeq = parseInt(lastSeqStr);
            if (!isNaN(lastSeq)) {
                nextSeq = lastSeq + 1;
            }
        }

        const matricNumber = `${prefix}${nextSeq}`;

        // 6. Save the new matric number
        await tx.update(students)
            .set({ matriculationNumber: matricNumber })
            .where(eq(students.id, studentId));
            
        console.log(`[Matric Generation] Successfully generated ${matricNumber} for student ${studentId}`);
        return matricNumber;

    } catch (error) {
        console.error(`[Matric Generation] Error generating matric for student ${studentId}:`, error);
        return false;
    }
}
