"use server";
import { db } from "@/db/db";
import { 
    transactions, 
    payment_transactions, 
    paystackDeveloperFees, 
    students, 
    admissionApplicationsV2, 
    users, 
    studentLedger 
} from "@/db/schema";
import { eq, inArray, desc, sql, or, like, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

function cleanStudentName(rawName?: string | null): string {
    if (!rawName) return '';
    const trimmed = rawName.trim();
    if (trimmed.toLowerCase() === 'null' || trimmed.toLowerCase() === 'undefined') return '';
    return trimmed
        .replace(/\bnull\b/gi, '')
        .replace(/\bundefined\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}

export async function getSuccessfulPaymentsGrouped() {
    try {
        // 1. Live Admissions & Portal Transactions
        const admissionTxs = await db.select({
            id: transactions.id,
            studentId: transactions.studentId,
            amount: transactions.amount,
            gateway: transactions.gateway,
            gatewayReference: transactions.gatewayReference,
            rrr: transactions.rrr,
            gatewayTransactionId: transactions.gatewayTransactionId,
            createdAt: transactions.createdAt,
            purpose: transactions.purpose,
            type: sql<string>`'admission'`,
            userId: sql<number | null>`null`,
        }).from(transactions).where(eq(transactions.status, 'completed'));

        // 2. Paystack Developer & Portal Processing Fees (Paid ND 2, HND 2 & Applicants)
        const devFeeTxs = await db.select({
            id: paystackDeveloperFees.id,
            studentId: sql<number | null>`null`,
            amount: paystackDeveloperFees.amount,
            gateway: sql<string>`'paystack'`,
            gatewayReference: paystackDeveloperFees.reference,
            rrr: sql<string | null>`null`,
            gatewayTransactionId: paystackDeveloperFees.reference,
            createdAt: paystackDeveloperFees.paidAt,
            purpose: sql<string>`CASE WHEN paystack_developer_fees.type = 'school_fees' THEN 'ND 2 / HND 2 Portal Processing Fee' ELSE 'Admission Application Processing Fee' END`,
            type: sql<string>`'developer_fee'`,
            userId: sql<number | null>`null`,
            devType: paystackDeveloperFees.type,
            identifier: paystackDeveloperFees.identifier,
            email: paystackDeveloperFees.email,
        }).from(paystackDeveloperFees).where(eq(paystackDeveloperFees.status, 'paid'));

        // 3. Bursary Transactions
        const bursaryTxs = await db.select({
            id: payment_transactions.id,
            studentId: sql<number | null>`null`,
            amount: payment_transactions.amount,
            gateway: payment_transactions.paymentGateway,
            gatewayReference: payment_transactions.transactionReference,
            rrr: payment_transactions.gatewayTransactionId,
            createdAt: payment_transactions.createdAt,
            purpose: payment_transactions.transactionType,
            type: sql<string>`'bursary'`,
            userId: payment_transactions.userId,
            metadata: payment_transactions.metadata,
        }).from(payment_transactions).where(
            or(
                eq(payment_transactions.status, 'completed'),
                eq(payment_transactions.status, 'paid')
            )
        );

        // Dedupe by gatewayReference or rrr or unique key
        const seen = new Map<string, any>();
        for (const tx of [...admissionTxs, ...devFeeTxs, ...bursaryTxs]) {
            const anyTx: any = tx;
            const rrr = anyTx.rrr || (() => { 
                try { 
                    const m = typeof anyTx.metadata === 'string' ? JSON.parse(anyTx.metadata) : anyTx.metadata; 
                    return m?.rrr || m?.RRR || null; 
                } catch { 
                    return null; 
                } 
            })() || anyTx.gatewayTransactionId || null;

            const key = (tx.gatewayReference || rrr || `${tx.type}-${tx.id}`).toString().trim();
            if (seen.has(key)) {
                const existing = seen.get(key);
                seen.set(key, {
                    ...existing,
                    ...tx,
                    studentId: tx.studentId || existing.studentId || null,
                    userId: tx.userId || existing.userId || null,
                    rrr: rrr || existing.rrr || null,
                    purpose: tx.purpose || existing.purpose,
                    identifier: anyTx.identifier || existing.identifier || null,
                    devType: anyTx.devType || existing.devType || null,
                    email: anyTx.email || existing.email || null,
                });
            } else {
                seen.set(key, { ...tx, rrr });
            }
        }

        const txs = Array.from(seen.values()).sort((a, b) => {
            const dA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dB - dA;
        });

        const appIds = new Set<number>();
        const studentIds = new Set<number>();
        const userIds = new Set<number>();
        const matricNumbers = new Set<string>();
        const txIdsWithoutStudentId: number[] = [];
        const unknownRefs = new Set<string>();

        txs.forEach(tx => {
            if (tx.studentId) {
                studentIds.add(Number(tx.studentId));
            } else if (tx.type === 'admission') {
                txIdsWithoutStudentId.push(tx.id);
            }

            if (tx.userId) userIds.add(Number(tx.userId));

            if (tx.type === 'developer_fee') {
                if (tx.devType === 'school_fees' && tx.identifier) {
                    const parsed = parseInt(tx.identifier);
                    if (!isNaN(parsed)) {
                        studentIds.add(parsed);
                        userIds.add(parsed);
                    } else {
                        matricNumbers.add(tx.identifier.trim().toUpperCase());
                    }
                } else if (tx.devType === 'admission_form' && tx.identifier) {
                    const parsed = parseInt(tx.identifier);
                    if (!isNaN(parsed)) appIds.add(parsed);
                }
            }

            if (tx.gatewayReference) unknownRefs.add(tx.gatewayReference);
            if (tx.rrr) unknownRefs.add(tx.rrr);

            const match = tx.gatewayReference?.match(/(?:SCH|ACC|PROC|FORM|PAY-ADM|ADM|APP)[-_](\d+)/i);
            if (match) {
                appIds.add(parseInt(match[1]));
            }
            
            const purposeMatch = tx.purpose?.match(/(?:Application\s*ID|App\s*ID|Application|App)[\s:#_-]*(\d+)/i);
            if (purposeMatch) {
                appIds.add(parseInt(purposeMatch[1]));
            }

            const studentIdInPurpose = tx.purpose?.match(/(?:Student\s*ID|StudentId|ID)[\s:#_-]*(\d+)/i);
            if (studentIdInPurpose) {
                studentIds.add(parseInt(studentIdInPurpose[1]));
            }

            if (tx.purpose) {
                const matricMatches = tx.purpose.match(/[A-Za-z]{2,5}\/[A-Za-z0-9\/-]+/g);
                if (matricMatches) {
                    matricMatches.forEach((m: string) => {
                        const cleanM = m.trim().toUpperCase();
                        if (!cleanM.startsWith('HTTP') && !cleanM.startsWith('TX-') && cleanM.length > 5) {
                            matricNumbers.add(cleanM);
                        }
                    });
                }
            }
        });

        // Fast batch lookup: studentLedger for admission transactions without explicit studentId
        const txIdToStudentId = new Map<number, number>();
        if (txIdsWithoutStudentId.length > 0) {
            for (let i = 0; i < txIdsWithoutStudentId.length; i += 150) {
                const chunk = txIdsWithoutStudentId.slice(i, i + 150);
                const ledgerRows = await db.select({
                    transactionId: studentLedger.transactionId,
                    studentId: studentLedger.studentId,
                })
                .from(studentLedger)
                .where(inArray(studentLedger.transactionId, chunk));

                ledgerRows.forEach(l => {
                    if (l.transactionId && l.studentId) {
                        txIdToStudentId.set(l.transactionId, Number(l.studentId));
                        studentIds.add(Number(l.studentId));
                    }
                });
            }
        }

        const studentMap = new Map<number | string, string>();
        const matricToStudentMap = new Map<string, string>();
        const appMap = new Map<number | string, string>();
        const refToNameMap = new Map<string, string>();
        const userMap = new Map<number | string, string>();

        // Batch query students & their levels (ND 2 / HND 2 / ND 1 / HND 1)
        if (studentIds.size > 0) {
            const idArray = Array.from(studentIds);
            for (let i = 0; i < idArray.length; i += 100) {
                const chunk = idArray.slice(i, i + 100);
                const studentsData = await db.select({ 
                    id: students.id, 
                    userId: students.userId,
                    firstName: students.firstName, 
                    lastName: students.lastName, 
                    matricNumber: students.matricNumber,
                    currentLevel: students.currentLevel,
                    programmeType: students.programmeType,
                    userName: users.name,
                    userEmail: users.email
                })
                .from(students)
                .leftJoin(users, eq(students.userId, users.id))
                .where(or(inArray(students.id, chunk), inArray(students.userId, chunk)));

                studentsData.forEach(s => {
                    const cleanU = cleanStudentName(s.userName);
                    const cleanF = cleanStudentName(s.firstName);
                    const cleanL = cleanStudentName(s.lastName);
                    let fullName = cleanU || `${cleanF} ${cleanL}`.trim();
                    if (!fullName) fullName = s.matricNumber || s.userEmail || 'Student';
                    
                    const levelLabel = s.programmeType && s.currentLevel ? ` [${s.programmeType} ${s.currentLevel}]` : '';
                    const display = s.matricNumber && !fullName.includes(s.matricNumber)
                        ? `${fullName} (${s.matricNumber})${levelLabel}`
                        : `${fullName}${levelLabel}`;

                    studentMap.set(Number(s.id), display);
                    studentMap.set(String(s.id), display);
                    if (s.userId) {
                        studentMap.set(Number(s.userId), display);
                        studentMap.set(String(s.userId), display);
                    }
                    if (s.matricNumber) {
                        matricToStudentMap.set(s.matricNumber.trim().toUpperCase(), display);
                    }
                });
            }
        }

        // Batch query applications
        if (appIds.size > 0) {
            const idArray = Array.from(appIds);
            for (let i = 0; i < idArray.length; i += 100) {
                const chunk = idArray.slice(i, i + 100);
                const apps = await db.select({ 
                    id: admissionApplicationsV2.id, 
                    name: users.name, 
                    data: admissionApplicationsV2.data,
                    formNumber: admissionApplicationsV2.formNumber,
                    appNumber: admissionApplicationsV2.applicationNumber,
                    payRef: admissionApplicationsV2.paymentReference,
                    procRef: admissionApplicationsV2.processingFeeReference,
                    accRef: admissionApplicationsV2.acceptancePaymentReference,
                })
                .from(admissionApplicationsV2)
                .leftJoin(users, eq(admissionApplicationsV2.applicantId, users.id))
                .where(inArray(admissionApplicationsV2.id, chunk));

                apps.forEach(app => {
                    let fallback = 'Applicant';
                    try { 
                        const d = JSON.parse(app.data as string || '{}');
                        fallback = d.fullName || d.name || `${d.FirstName || d.firstName || ''} ${d['Last Name'] || d.lastName || ''}`.trim() || 'Applicant';
                    } catch(e) {}
                    const clean = cleanStudentName(app.name) || fallback;
                    const display = `${clean} (App #${app.appNumber || app.formNumber || app.id})`;

                    appMap.set(app.id, display);
                    if (app.formNumber) appMap.set(app.formNumber, display);
                    if (app.appNumber) appMap.set(app.appNumber, display);
                    if (app.payRef) refToNameMap.set(app.payRef, display);
                    if (app.procRef) refToNameMap.set(app.procRef, display);
                    if (app.accRef) refToNameMap.set(app.accRef, display);
                });
            }
        }

        // Batch query matched users
        if (userIds.size > 0) {
            const idArray = Array.from(userIds);
            for (let i = 0; i < idArray.length; i += 100) {
                const chunk = idArray.slice(i, i + 100);
                const usersData = await db.select({ 
                    id: users.id, 
                    name: users.name,
                    studentFirstName: students.firstName,
                    studentLastName: students.lastName,
                    matricNumber: students.matricNumber,
                    currentLevel: students.currentLevel,
                    programmeType: students.programmeType,
                })
                .from(users)
                .leftJoin(students, eq(students.userId, users.id))
                .where(inArray(users.id, chunk));
                
                usersData.forEach(u => {
                    const cleanU = cleanStudentName(u.name);
                    const cleanF = cleanStudentName(u.studentFirstName);
                    const cleanL = cleanStudentName(u.studentLastName);
                    let fullName = cleanU || `${cleanF} ${cleanL}`.trim() || 'Student';
                    const levelLabel = u.programmeType && u.currentLevel ? ` [${u.programmeType} ${u.currentLevel}]` : '';
                    if (u.matricNumber && !fullName.includes(u.matricNumber)) {
                        fullName = `${fullName} (${u.matricNumber})${levelLabel}`;
                    } else if (levelLabel) {
                        fullName = `${fullName}${levelLabel}`;
                    }
                    userMap.set(Number(u.id), fullName);
                    userMap.set(String(u.id), fullName);
                });
            }
        }

        // Group into categorical tabs
        const grouped: Record<string, any[]> = {
            'School Fees': [],
            'Processing Fee': [],
            'ICT Fee': [],
            'Incidental Fee': [],
            'Acceptance Fee': [],
            'Application Form Fee': [],
            'Transcript Fee': [],
            'Certificate Fee': [],
            'ID Card Fee': [],
            'Wallet Topup': [],
            'Others': [],
        };

        for (const tx of txs) {
            const p = (tx.purpose || '').toLowerCase();
            const ref = (tx.gatewayReference || '').toLowerCase();
            const amt = parseFloat(tx.amount || '0');
            const gw = (tx.gateway || '').toLowerCase().trim();

            let category = 'Others';
            let itemBreakdown = tx.purpose || 'Other Payment';

            // 1. Paystack Developer Fees (Directly handles ND 2 / HND 2 and applicant processing fees)
            if (tx.type === 'developer_fee') {
                category = 'Processing Fee';
                itemBreakdown = tx.devType === 'school_fees' 
                    ? `ND 2 / HND 2 Portal Processing Fee (₦${amt ? amt.toLocaleString() : '4,500'})` 
                    : `Admission Application Processing Fee (₦${amt ? amt.toLocaleString() : '3,000'})`;
            }
            // 2. ICT Fee Check (₦2,000 or courseform access, under ₦10,000)
            else if (
                (
                    /\bict\b/i.test(p) || 
                    p.includes('information and communication') || 
                    p.includes('ict fee') || 
                    p.includes('ict payment') || 
                    p.includes('ict training') || 
                    ref.includes('ict') ||
                    p.includes('courseform_payment')
                ) && amt <= 10000
            ) {
                category = 'ICT Fee';
                itemBreakdown = tx.purpose || 'ICT Fee / Technology Payment';
            } 
            // 3. Incidental Fee Check (₦5,500 or ancillary, under ₦10,000)
            else if (
                (
                    p.includes('incidental') || 
                    p.includes('ancillary') || 
                    ref.includes('incidental') || 
                    ref.startsWith('inc-') ||
                    (gw === 'alatpay' && amt === 5500)
                ) && amt <= 10000
            ) {
                category = 'Incidental Fee';
                itemBreakdown = tx.purpose || 'Incidental Fee Payment (₦5,500)';
            } 
            // 4. Processing Fee Check (Standalone under ₦10,000 or PROC reference)
            else if (
                (p.includes('processing') || ref.startsWith('proc-') || ref.startsWith('dev-')) && amt <= 10000
            ) {
                category = 'Processing Fee';
                itemBreakdown = tx.purpose || 'Portal Processing Fee';
            } 
            // 5. Transcript Fee Check
            else if (
                p.includes('transcript') || ref.startsWith('tr-')
            ) {
                category = 'Transcript Fee';
                itemBreakdown = tx.purpose || 'Official Academic Transcript';
            } 
            // 6. Certificate & Convocation Fee Check
            else if (
                p.includes('certificate') || 
                p.includes('convocation') || 
                p.includes('graduation') || 
                p.includes('alumni') || 
                ref.startsWith('alumni-')
            ) {
                category = 'Certificate Fee';
                itemBreakdown = tx.purpose || 'Certificate & Convocation Payment';
            } 
            // 7. Acceptance Fee Check
            else if (
                p.includes('acceptance') || ref.startsWith('acc-') || ref.startsWith('wal-acc-')
            ) {
                category = 'Acceptance Fee';
                itemBreakdown = tx.purpose || 'Acceptance Fee & ID Card';
            } 
            // 8. Application Form Fee Check
            else if (
                (p.includes('application form') || p.includes('form fee') || p.includes('adm_payment') || ref.startsWith('form-') || ref.startsWith('adm-') || ref.startsWith('pay-adm-')) && !p.includes('processing')
            ) {
                category = 'Application Form Fee';
                itemBreakdown = tx.purpose || 'Admission Application Form';
            } 
            // 9. ID Card Fee Check
            else if (
                (p.includes('id card') || p.includes('idcard') || p.includes('identity card')) && !p.includes('acceptance')
            ) {
                category = 'ID Card Fee';
                itemBreakdown = tx.purpose || 'Student ID Card';
            } 
            // 10. Wallet Topup Check
            else if (
                p.includes('wallet_topup') || p.includes('wallet funding') || ref.startsWith('wal-top-')
            ) {
                category = 'Wallet Topup';
                itemBreakdown = 'Wallet Funding';
            } 
            // 11. School Fees (Tuition)
            else if (
                (gw !== 'alatpay' && (p.includes('school fee') || p.includes('tuition') || amt > 10000)) ||
                p.includes('legacy fss school_fee')
            ) {
                category = 'School Fees';
                itemBreakdown = tx.purpose || 'Tuition / School Fees';
            } 
            // 12. Fallback Others
            else {
                category = 'Others';
                itemBreakdown = tx.purpose || 'Other Payment';
            }

            // Student name resolution
            let studentName = 'N/A';
            const sId = tx.studentId ? Number(tx.studentId) : (txIdToStudentId.get(tx.id) || null);
            const uId = tx.userId ? Number(tx.userId) : null;

            if (tx.type === 'developer_fee') {
                if (tx.devType === 'school_fees' && tx.identifier && studentMap.has(tx.identifier)) {
                    studentName = studentMap.get(tx.identifier)!;
                } else if (tx.devType === 'admission_form' && tx.identifier && appMap.has(parseInt(tx.identifier))) {
                    studentName = appMap.get(parseInt(tx.identifier))!;
                } else if (tx.email) {
                    studentName = tx.email;
                }
            } else if (sId && studentMap.has(sId)) {
                studentName = studentMap.get(sId)!;
            } else if (uId && userMap.has(uId)) {
                studentName = userMap.get(uId)!;
            }

            if (tx.type === 'developer_fee' && studentName === 'N/A') {
                const rawId = (tx as any).identifier;
                if (rawId) {
                    const numId = parseInt(rawId);
                    if (!isNaN(numId)) {
                        if (studentMap.has(numId)) studentName = studentMap.get(numId)!;
                        else if (userMap.has(numId)) studentName = userMap.get(numId)!;
                        else if (appMap.has(numId)) studentName = appMap.get(numId)!;
                    }
                    if (studentName === 'N/A' && matricToStudentMap.has(rawId.toUpperCase())) {
                        studentName = matricToStudentMap.get(rawId.toUpperCase())!;
                    }
                }
                if (studentName === 'N/A' && (tx as any).email) {
                    studentName = (tx as any).email;
                }
            }


            if (studentName === 'N/A') {
                const match = tx.gatewayReference?.match(/(?:SCH|ACC|PROC|FORM|PAY-ADM|ADM|APP)[-_](\d+)/i);
                const appId = match ? parseInt(match[1]) : null;
                if (appId && appMap.has(appId)) {
                    studentName = appMap.get(appId)!;
                } else if (tx.purpose) {
                    const pAppMatch = tx.purpose.match(/(?:Application\s*ID|App\s*ID|Application|App)[\s:#_-]*(\d+)/i);
                    if (pAppMatch && appMap.has(parseInt(pAppMatch[1]))) {
                        studentName = appMap.get(parseInt(pAppMatch[1]))!;
                    }
                }
            }

            if (studentName === 'N/A') {
                if (tx.gatewayReference && refToNameMap.has(tx.gatewayReference)) {
                    studentName = refToNameMap.get(tx.gatewayReference)!;
                } else if (tx.rrr && refToNameMap.has(tx.rrr)) {
                    studentName = refToNameMap.get(tx.rrr)!;
                }
            }

            if (studentName === 'N/A' && tx.purpose) {
                const embeddedMatch = tx.purpose.match(/-\s*([A-Za-z\s]+)\s*\(([^)]+)\)/);
                if (embeddedMatch) {
                    const candidateName = cleanStudentName(embeddedMatch[1]);
                    const matric = embeddedMatch[2].trim().toUpperCase();
                    if (candidateName && candidateName.length > 2) {
                        studentName = `${candidateName} (${matric})`;
                    } else if (matricToStudentMap.has(matric)) {
                        studentName = matricToStudentMap.get(matric)!;
                    }
                } else {
                    const matricMatches = tx.purpose.match(/[A-Za-z]{2,5}\/[A-Za-z0-9\/-]+/g);
                    if (matricMatches) {
                        for (const m of matricMatches) {
                            const upperM = m.trim().toUpperCase();
                            if (matricToStudentMap.has(upperM)) {
                                studentName = matricToStudentMap.get(upperM)!;
                                break;
                            }
                        }
                    }
                }
            }


            if (studentName === 'N/A') {
                if (tx.studentId) studentName = `Student #${tx.studentId}`;
                else if (tx.rrr) studentName = `Payer (RRR: ${tx.rrr})`;
                else if (tx.gatewayReference) studentName = `Payer (${tx.gatewayReference})`;
            }

            if (!grouped[category]) grouped[category] = [];
            grouped[category].push({
                ...tx,
                itemBreakdown,
                studentName,
                date: tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : 'N/A'
            });
        }

        return { success: true, data: grouped };
    } catch(e) {
        console.error("Failed to fetch successful payments:", e);
        return { success: false, error: String(e) };
    }
}

export async function deleteTransaction(txId: number, type: string = 'admission') {
    try {
        if (type === 'developer_fee') {
            await db.delete(paystackDeveloperFees).where(eq(paystackDeveloperFees.id, txId));
        } else if (type === 'bursary') {
            await db.delete(payment_transactions).where(eq(payment_transactions.id, txId));
        } else {
            await db.delete(transactions).where(eq(transactions.id, txId));
        }
        revalidatePath("/admin/bursary/successful-payments");
        return { success: true };
    } catch(e) {
        return { success: false, error: String(e) };
    }
}

export async function bulkDeleteTransactions(items: { id: number, type: string }[]) {
    try {
        const devFeeIds = items.filter(i => i.type === 'developer_fee').map(i => i.id);
        const bursaryIds = items.filter(i => i.type === 'bursary').map(i => i.id);
        const admissionIds = items.filter(i => i.type === 'admission').map(i => i.id);

        if (devFeeIds.length > 0) {
            await db.delete(paystackDeveloperFees).where(inArray(paystackDeveloperFees.id, devFeeIds));
        }
        if (bursaryIds.length > 0) {
            await db.delete(payment_transactions).where(inArray(payment_transactions.id, bursaryIds));
        }
        if (admissionIds.length > 0) {
            await db.delete(transactions).where(inArray(transactions.id, admissionIds));
        }
        revalidatePath("/admin/bursary/successful-payments");
        return { success: true };
    } catch(e) {
        return { success: false, error: String(e) };
    }
}

export async function updateSuccessfulPayment(
    txId: number,
    type: string,
    updates: {
        rrr?: string | null;
        gatewayReference?: string | null;
        gateway?: string | null;
        amount?: string | null;
        purpose?: string | null;
        createdAt?: string | null;
        studentId?: number | string | null;
    }
) {
    try {
        if (type === 'developer_fee') {
            const data: Record<string, any> = {};
            if (updates.gatewayReference !== undefined) data.reference = updates.gatewayReference;
            if (updates.amount !== undefined) {
                const amt = parseFloat(updates.amount || '0');
                if (isNaN(amt) || amt < 0) return { success: false, error: "Invalid amount" };
                data.amount = updates.amount;
            }
            if (updates.studentId !== undefined) data.identifier = String(updates.studentId);
            if (updates.createdAt !== undefined) data.paidAt = updates.createdAt ? new Date(updates.createdAt) : null;
            if (Object.keys(data).length > 0) {
                await db.update(paystackDeveloperFees).set(data).where(eq(paystackDeveloperFees.id, txId));
            }
        } else if (type === 'bursary') {
            const data: Record<string, any> = {};
            if (updates.rrr !== undefined) data.gatewayTransactionId = updates.rrr || null;
            if (updates.gatewayReference !== undefined) data.transactionReference = updates.gatewayReference || null;
            if (updates.gateway !== undefined) data.paymentGateway = updates.gateway || null;
            if (updates.amount !== undefined) {
                const amt = parseFloat(updates.amount || '0');
                if (isNaN(amt) || amt < 0) return { success: false, error: "Invalid amount" };
                data.amount = updates.amount;
            }
            if (updates.purpose !== undefined) data.transactionType = updates.purpose || null;
            if (updates.createdAt !== undefined) data.createdAt = updates.createdAt ? new Date(updates.createdAt) : null;
            if (updates.studentId !== undefined && updates.studentId !== null && updates.studentId !== '') {
                const parsedId = Number(updates.studentId);
                if (!isNaN(parsedId)) {
                    const [stu] = await db.select({ userId: students.userId }).from(students).where(eq(students.id, parsedId)).limit(1);
                    if (stu && stu.userId) {
                        data.userId = stu.userId;
                    } else {
                        data.userId = parsedId;
                    }
                }
            }
            if (Object.keys(data).length > 0) {
                await db.update(payment_transactions).set(data).where(eq(payment_transactions.id, txId));
            }
        } else {
            const data: Record<string, any> = {};
            if (updates.rrr !== undefined) data.rrr = updates.rrr || null;
            if (updates.gatewayReference !== undefined) data.gatewayReference = updates.gatewayReference || null;
            if (updates.gateway !== undefined) data.gateway = updates.gateway || null;
            if (updates.amount !== undefined) {
                const amt = parseFloat(updates.amount || '0');
                if (isNaN(amt) || amt < 0) return { success: false, error: "Invalid amount" };
                data.amount = updates.amount;
            }
            if (updates.purpose !== undefined) data.purpose = updates.purpose || null;
            if (updates.createdAt !== undefined) data.createdAt = updates.createdAt ? new Date(updates.createdAt) : null;
            if (updates.studentId !== undefined && updates.studentId !== null && updates.studentId !== '') {
                const parsedId = Number(updates.studentId);
                if (!isNaN(parsedId)) {
                    const [stu] = await db.select({ id: students.id }).from(students).where(eq(students.id, parsedId)).limit(1);
                    if (stu) {
                        data.studentId = stu.id;
                    } else {
                        const [stuByUser] = await db.select({ id: students.id }).from(students).where(eq(students.userId, parsedId)).limit(1);
                        if (stuByUser) {
                            data.studentId = stuByUser.id;
                        } else {
                            data.studentId = parsedId;
                        }
                    }
                }
            }
            if (Object.keys(data).length > 0) {
                await db.update(transactions).set(data).where(eq(transactions.id, txId));
            }
        }
        revalidatePath("/admin/bursary/successful-payments");
        return { success: true };
    } catch(e) {
        return { success: false, error: String(e) };
    }
}
