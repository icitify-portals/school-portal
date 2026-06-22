import { FinancialLockEnforcer } from '@/components/finance/FinancialLockEnforcer';
import { auth } from "@/auth";
import { db } from "@/db";
import { students, bursarySettings, studentBills } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { AlertTriangle, Lock } from "lucide-react";

export default async function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    if (!session?.user || session.user.role !== 'student') {
        return <>{children}</>;
    }

    const studentRecord = await db.query.students.findFirst({
        where: eq(students.userId, session.user.id),
    });

    if (!studentRecord) {
        return <>{children}</>;
    }

    const settings = await db.query.bursarySettings.findFirst() || {
        financial_lock_type: 'none',
        financial_lock_threshold: 0
    };

    // Calculate outstanding balance
    const bills = await db.query.studentBills.findMany({
        where: eq(studentBills.studentId, studentRecord.id)
    });
    
    const totalOwed = bills.reduce((acc, bill) => acc + Number(bill.amount), 0);
    const totalPaid = bills.reduce((acc, bill) => acc + Number(bill.amountPaid), 0);
    const outstanding = totalOwed - totalPaid;

    const threshold = Number(settings.financial_lock_threshold) || 0;
    
    // Check if locked
    const isLockedByThreshold = (settings.financial_lock_type !== 'none' && outstanding > threshold);
    const isManuallyLocked = studentRecord.isFinanciallyLocked;
    
    const isLocked = isLockedByThreshold || isManuallyLocked;
    const isHardLock = isLocked && settings.financial_lock_type === 'hard';
    const isSoftLock = isLocked && settings.financial_lock_type === 'soft';


    return (
        <FinancialLockEnforcer isHardLock={isHardLock}>
            {isSoftLock && (
                <div className="bg-rose-50 border-b border-rose-200 px-4 py-3 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                        <h3 className="text-sm font-black text-rose-900 uppercase tracking-widest">Financial Hold Notice</h3>
                        <p className="text-xs text-rose-700 mt-1 font-medium">
                            You have an outstanding balance that exceeds the allowed threshold. Please proceed to the Finance portal to settle your bills.
                        </p>
                    </div>
                </div>
            )}
            {children}
        </FinancialLockEnforcer>
    );
}
