import { db } from "@/db/db";
import { feeItems, studentBillItems, studentBills, students } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export class PaymentItemService {

    /**
     * Lists available fee items for a branch.
     * Matches 'PaymentItems::list' from Rust.
     */
    static async listItems() {
        return await db.select().from(feeItems);
    }

    /**
     * Lists payment items for a specific student in a term.
     * Matches 'SchoolBill::term_payment_items' from Rust.
     */
    static async getStudentTermItems(admissionNumber: string, sessionId: number) {
        const [student] = await db.select({ id: students.id })
            .from(students)
            .where(eq(students.admissionNumber, admissionNumber))
            .limit(1);

        if (!student) throw new Error(`Student ${admissionNumber} not found`);

        const bills = await db.select()
            .from(studentBills)
            .where(and(
                eq(studentBills.studentId, student.id),
                eq(studentBills.sessionId, sessionId)
            ));

        const items = [];
        for (const bill of bills) {
            const billItems = await db.select({
                id: feeItems.id,
                label: feeItems.name,
                amount: studentBillItems.amount
            })
            .from(studentBillItems)
            .innerJoin(feeItems, eq(studentBillItems.feeItemId, feeItems.id))
            .where(eq(studentBillItems.billId, bill.id));
            
            items.push(...billItems);
        }

        return items;
    }
}
