import { eq, inArray, and } from "drizzle-orm";
import {
    students,
    programmes,
    departments,
    studentBills,
    studentBillItems,
    systemSettings,
    feeItems
} from "@/db/schema";

/**
 * Fee-triggered matriculation number generator.
 * Called from bursary.ts when a bill status changes to 'paid'.
 * Checks 60% payment threshold + required fee items, then delegates
 * to the primary generateMatricNumber() engine.
 */
export async function checkAndGenerateMatricNumber(studentId: number, tx: any) {
    try {
        // 1. Check if the student already has a matric number
        const [student] = await tx.select().from(students).where(eq(students.id, studentId)).limit(1);

        if (!student) {
            console.error(`[Matric Generation] Student ${studentId} not found.`);
            return false;
        }

        if (student.matricNumber) {
            console.log(`[Matric Generation] Student ${studentId} already has matric number: ${student.matricNumber}`);
            return false;
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
        const paidItems = await tx.select({
            feeItemId: studentBillItems.feeItemId,
        })
        .from(studentBillItems)
        .innerJoin(studentBills, eq(studentBillItems.billId, studentBills.id))
        .where(
            and(
                eq(studentBills.studentId, studentId),
                eq(studentBills.status, 'paid'),
                inArray(studentBillItems.feeItemId, requiredFeeItemIds)
            )
        );

        const paidFeeItemIds = new Set(paidItems.map((item: any) => item.feeItemId));
        const hasPaidAll = requiredFeeItemIds.every(id => paidFeeItemIds.has(id));

        // Calculate 60% total fees requirement
        const allBills = await tx.select({
            amount: studentBills.amount,
            amountPaid: studentBills.amountPaid
        }).from(studentBills).where(eq(studentBills.studentId, studentId));

        let totalBilled = 0;
        let totalPaid = 0;
        for (const bill of allBills) {
            totalBilled += parseFloat(bill.amount?.toString() || '0');
            totalPaid += parseFloat(bill.amountPaid?.toString() || '0');
        }
        const hasPaid60Percent = totalBilled > 0 ? (totalPaid >= totalBilled * 0.60) : true;

        if (!hasPaidAll || !hasPaid60Percent) {
            console.log(`[Matric Generation] Student ${studentId} failed conditions. RequiredFeesPaid: ${hasPaidAll}, 60%Paid: ${hasPaid60Percent}`);
            return false;
        }

        // 4. Resolve programme and department info for the primary generator
        let deptId: number | undefined = undefined;
        let studyMode: string | undefined = undefined;
        let programmeType: string | undefined = undefined;

        if (student.programmeId) {
            const [prog] = await tx.select().from(programmes).where(eq(programmes.id, student.programmeId)).limit(1);
            if (prog) {
                deptId = prog.departmentId || undefined;
            }
        } else {
            deptId = student.deptId || undefined;
        }

        studyMode = student.studyMode || undefined;
        programmeType = student.programmeType || undefined;

        // 5. Delegate to the primary matriculation engine
        const { generateMatricNumber } = await import('@/actions/matriculation');
        const year = new Date().getFullYear();

        const result = await generateMatricNumber({
            year,
            deptId,
            studyMode,
            programmeType,
        });

        if (result.success && result.matricNumber) {
            // 6. Save the generated matric number
            await tx.update(students)
                .set({ matricNumber: result.matricNumber })
                .where(eq(students.id, studentId));

            console.log(`[Matric Generation] Successfully generated ${result.matricNumber} for student ${studentId}`);
            return result.matricNumber;
        } else {
            console.error(`[Matric Generation] Primary generator failed for student ${studentId}:`, result.error);
            return false;
        }

    } catch (error) {
        console.error(`[Matric Generation] Error generating matric for student ${studentId}:`, error);
        return false;
    }
}
