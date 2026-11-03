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

        // 3. Live Bursary Transactions (Strictly excluding migrated legacy FSS data)
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
            and(
                or(
                    eq(payment_transactions.status, 'completed'),
                    eq(payment_transactions.status, 'paid')
                ),
                sql`${payment_transactions.paymentGateway} IS NOT NULL`,
                sql`LOWER(${payment_transactions.transactionType}) NOT LIKE '%legacy%'`,
                sql`LOWER(${payment_transactions.transactionReference}) NOT LIKE '%legacy%'`
            )
        );

        // Dedupe by gatewayReference or rrr or unique key, strictly excluding any legacy portal records
        const seen = new Map<string, any>();
        for (const tx of [...admissionTxs, ...devFeeTxs, ...bursaryTxs]) {
            const p = (tx.purpose || '').toLowerCase();
            const ref = (tx.gatewayReference || '').toLowerCase();
            if (p.includes('legacy') || ref.includes('legacy')) continue;

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

        // Step 1: Initialize grouped categories, counts, and totals
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

        const counts: Record<string, number> = {
            'School Fees': 0,
            'Processing Fee': 0,
            'ICT Fee': 0,
            'Incidental Fee': 0,
            'Acceptance Fee': 0,
            'Application Form Fee': 0,
            'Transcript Fee': 0,
            'Certificate Fee': 0,
            'ID Card Fee': 0,
            'Wallet Topup': 0,
            'Others': 0,
        };

        const totals: Record<string, number> = {
            'School Fees': 0,
            'Processing Fee': 0,
            'ICT Fee': 0,
            'Incidental Fee': 0,
            'Acceptance Fee': 0,
            'Application Form Fee': 0,
            'Transcript Fee': 0,
            'Certificate Fee': 0,
            'ID Card Fee': 0,
            'Wallet Topup': 0,
            'Others': 0,
        };

        // Step 2: In-memory single-pass classification and total sum/count accumulation across all transactions
        for (const tx of txs) {
            const p = (tx.purpose || '').toLowerCase();
            const ref = (tx.gatewayReference || '').toLowerCase();
            const rawAmt = parseFloat(tx.amount || '0');
            const amt = isNaN(rawAmt) ? 0 : rawAmt;
            const gw = (tx.gateway || '').toLowerCase().trim();

            let category = 'Others';
            let itemBreakdown = tx.purpose || 'Other Payment';

            if (tx.type === 'developer_fee') {
                category = 'Processing Fee';
                itemBreakdown = tx.devType === 'school_fees' 
                    ? `ND 2 / HND 2 Portal Processing Fee (₦${amt ? amt.toLocaleString() : '4,500'})` 
                    : `Admission Application Processing Fee (₦${amt ? amt.toLocaleString() : '3,000'})`;
            } else if (
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
            } else if (
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
            } else if (
                (p.includes('processing') || ref.startsWith('proc-') || ref.startsWith('dev-')) && amt <= 10000
            ) {
                category = 'Processing Fee';
                itemBreakdown = tx.purpose || 'Portal Processing Fee';
            } else if (
                p.includes('transcript') || ref.startsWith('tr-')
            ) {
                category = 'Transcript Fee';
                itemBreakdown = tx.purpose || 'Official Academic Transcript';
            } else if (
                p.includes('certificate') || 
                p.includes('convocation') || 
                p.includes('graduation') || 
                p.includes('alumni') || 
                ref.startsWith('alumni-')
            ) {
                category = 'Certificate Fee';
                itemBreakdown = tx.purpose || 'Certificate & Convocation Payment';
            } else if (
                p.includes('acceptance') || ref.startsWith('acc-') || ref.startsWith('wal-acc-')
            ) {
                category = 'Acceptance Fee';
                itemBreakdown = tx.purpose || 'Acceptance Fee & ID Card';
            } else if (
                (p.includes('application form') || p.includes('form fee') || p.includes('adm_payment') || ref.startsWith('form-') || ref.startsWith('adm-') || ref.startsWith('pay-adm-')) && !p.includes('processing')
            ) {
                category = 'Application Form Fee';
                itemBreakdown = tx.purpose || 'Admission Application Form';
            } else if (
                (p.includes('id card') || p.includes('idcard') || p.includes('identity card')) && !p.includes('acceptance')
            ) {
                category = 'ID Card Fee';
                itemBreakdown = tx.purpose || 'Student ID Card';
            } else if (
                p.includes('wallet_topup') || p.includes('wallet funding') || ref.startsWith('wal-top-')
            ) {
                category = 'Wallet Topup';
                itemBreakdown = 'Wallet Funding';
            } else if (
                gw !== 'alatpay' && (p.includes('school fee') || p.includes('tuition') || amt > 10000)
            ) {
                category = 'School Fees';
                itemBreakdown = tx.purpose || 'Tuition / School Fees';
            } else {
                category = 'Others';
                itemBreakdown = tx.purpose || 'Other Payment';
            }

            if (!grouped[category]) grouped[category] = [];
            counts[category] = (counts[category] || 0) + 1;
            totals[category] = (totals[category] || 0) + amt;

            // Retain top 200 newest items per category for the client payload
            if (grouped[category].length < 200) {
                let dateStr = 'N/A';
                try {
                    if (tx.createdAt) {
                        const d = new Date(tx.createdAt);
                        if (!isNaN(d.getTime())) {
                            dateStr = d.toISOString().split('T')[0];
                        }
                    }
                } catch {}

                grouped[category].push({
                    ...tx,
                    category,
                    itemBreakdown,
                    studentName: 'N/A',
                    date: dateStr,
                    amount: amt.toFixed(2),
                });
            }
        }

        // Step 3: Collect IDs ONLY for the items actually present in grouped (~1,300 items total)
        const displayedItems = Object.values(grouped).flat();
        const appIds = new Set<number>();
        const studentIds = new Set<number>();
        const userIds = new Set<number>();
        const matricNumbers = new Set<string>();
        const txIdsWithoutStudentId: number[] = [];

        displayedItems.forEach(tx => {
            if (tx.studentId) {
                const s = Number(tx.studentId);
                if (!isNaN(s) && s > 0) studentIds.add(s);
            } else if (tx.type === 'admission') {
                txIdsWithoutStudentId.push(tx.id);
            }

            if (tx.userId) {
                const u = Number(tx.userId);
                if (!isNaN(u) && u > 0) userIds.add(u);
            }

            if (tx.type === 'developer_fee') {
                if (tx.devType === 'school_fees' && tx.identifier) {
                    const parsed = parseInt(tx.identifier);
                    if (!isNaN(parsed) && parsed > 0) {
                        studentIds.add(parsed);
                        userIds.add(parsed);
                    } else {
                        matricNumbers.add(tx.identifier.trim().toUpperCase());
                    }
                } else if (tx.devType === 'admission_form' && tx.identifier) {
                    const parsed = parseInt(tx.identifier);
                    if (!isNaN(parsed) && parsed > 0) appIds.add(parsed);
                }
            }

            const match = tx.gatewayReference?.match(/(?:SCH|ACC|PROC|FORM|PAY-ADM|ADM|APP)[-_](\d+)/i);
            if (match) {
                const parsed = parseInt(match[1]);
                if (!isNaN(parsed) && parsed > 0) appIds.add(parsed);
            }
            
            const purposeMatch = tx.purpose?.match(/(?:Application\s*ID|App\s*ID|Application|App)[\s:#_-]*(\d+)/i);
            if (purposeMatch) {
                const parsed = parseInt(purposeMatch[1]);
                if (!isNaN(parsed) && parsed > 0) appIds.add(parsed);
            }

            const studentIdInPurpose = tx.purpose?.match(/(?:Student\s*ID|StudentId|ID)[\s:#_-]*(\d+)/i);
            if (studentIdInPurpose) {
                const parsed = parseInt(studentIdInPurpose[1]);
                if (!isNaN(parsed) && parsed > 0) studentIds.add(parsed);
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
                        const s = Number(l.studentId);
                        txIdToStudentId.set(l.transactionId, s);
                        studentIds.add(s);
                    }
                });
            }
        }

        const studentMap = new Map<number | string, string>();
        const matricToStudentMap = new Map<string, string>();
        const appMap = new Map<number | string, string>();
        const refToNameMap = new Map<string, string>();
        const userMap = new Map<number | string, string>();

        // Step 4: Batch query students & their levels (ND 2 / HND 2 / ND 1 / HND 1)
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

        // Query students by matric numbers if any still unresolved
        if (matricNumbers.size > 0) {
            const matricsToFetch = Array.from(matricNumbers).filter(m => !matricToStudentMap.has(m));
            if (matricsToFetch.length > 0) {
                for (let i = 0; i < matricsToFetch.length; i += 100) {
                    const chunk = matricsToFetch.slice(i, i + 100);
                    const studentsByMatric = await db.select({
                        id: students.id,
                        matricNumber: students.matricNumber,
                        firstName: students.firstName,
                        lastName: students.lastName,
                        currentLevel: students.currentLevel,
                        programmeType: students.programmeType,
                        userName: users.name,
                    })
                    .from(students)
                    .leftJoin(users, eq(students.userId, users.id))
                    .where(inArray(students.matricNumber, chunk));

                    studentsByMatric.forEach(s => {
                        if (s.matricNumber) {
                            const cleanU = cleanStudentName(s.userName);
                            const cleanF = cleanStudentName(s.firstName);
                            const cleanL = cleanStudentName(s.lastName);
                            let fullName = cleanU || `${cleanF} ${cleanL}`.trim();
                            if (!fullName) fullName = s.matricNumber;
                            const levelLabel = s.programmeType && s.currentLevel ? ` [${s.programmeType} ${s.currentLevel}]` : '';
                            const display = `${fullName} (${s.matricNumber})${levelLabel}`;
                            matricToStudentMap.set(s.matricNumber.trim().toUpperCase(), display);
                        }
                    });
                }
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
            const idArray = Array.from(userIds).filter(uid => !studentMap.has(uid) && !userMap.has(uid));
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

        // Step 5: Assign studentName to the displayed items
        for (const cat of Object.keys(grouped)) {
            for (const item of grouped[cat]) {
                let studentName = 'N/A';
                const sId = item.studentId ? Number(item.studentId) : (txIdToStudentId.get(item.id) || null);
                const uId = item.userId ? Number(item.userId) : null;

                if (item.type === 'developer_fee') {
                    if (item.devType === 'school_fees' && item.identifier && studentMap.has(item.identifier)) {
                        studentName = studentMap.get(item.identifier)!;
                    } else if (item.devType === 'admission_form' && item.identifier && appMap.has(parseInt(item.identifier))) {
                        studentName = appMap.get(parseInt(item.identifier))!;
                    } else if (item.email) {
                        studentName = item.email;
                    }
                } else if (sId && studentMap.has(sId)) {
                    studentName = studentMap.get(sId)!;
                } else if (uId && userMap.has(uId)) {
                    studentName = userMap.get(uId)!;
                }

                if (item.type === 'developer_fee' && studentName === 'N/A') {
                    const rawId = item.identifier;
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
                    if (studentName === 'N/A' && item.email) {
                        studentName = item.email;
                    }
                }

                if (studentName === 'N/A') {
                    const match = item.gatewayReference?.match(/(?:SCH|ACC|PROC|FORM|PAY-ADM|ADM|APP)[-_](\d+)/i);
                    const appId = match ? parseInt(match[1]) : null;
                    if (appId && appMap.has(appId)) {
                        studentName = appMap.get(appId)!;
                    } else if (item.purpose) {
                        const pAppMatch = item.purpose.match(/(?:Application\s*ID|App\s*ID|Application|App)[\s:#_-]*(\d+)/i);
                        if (pAppMatch && appMap.has(parseInt(pAppMatch[1]))) {
                            studentName = appMap.get(parseInt(pAppMatch[1]))!;
                        }
                    }
                }

                if (studentName === 'N/A') {
                    if (item.gatewayReference && refToNameMap.has(item.gatewayReference)) {
                        studentName = refToNameMap.get(item.gatewayReference)!;
                    } else if (item.rrr && refToNameMap.has(item.rrr)) {
                        studentName = refToNameMap.get(item.rrr)!;
                    }
                }

                if (studentName === 'N/A' && item.purpose) {
                    const embeddedMatch = item.purpose.match(/-\s*([A-Za-z\s]+)\s*\(([^)]+)\)/);
                    if (embeddedMatch) {
                        const candidateName = cleanStudentName(embeddedMatch[1]);
                        const matric = embeddedMatch[2].trim().toUpperCase();
                        if (candidateName && candidateName.length > 2) {
                            studentName = `${candidateName} (${matric})`;
                        } else if (matricToStudentMap.has(matric)) {
                            studentName = matricToStudentMap.get(matric)!;
                        }
                    } else {
                        const matricMatches = item.purpose.match(/[A-Za-z]{2,5}\/[A-Za-z0-9\/-]+/g);
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
                    if (item.studentId) studentName = `Student #${item.studentId}`;
                    else if (item.rrr) studentName = `Payer (RRR: ${item.rrr})`;
                    else if (item.gatewayReference) studentName = `Payer (${item.gatewayReference})`;
                }

                item.studentName = studentName;
            }
        }

        // Step 6: Sanitize displayed items to minimize payload and remove bulky unneeded fields (like raw metadata)
        for (const cat of Object.keys(grouped)) {
            grouped[cat] = grouped[cat].map(item => ({
                id: item.id,
                studentId: item.studentId || null,
                amount: item.amount,
                gateway: item.gateway || 'portal',
                gatewayReference: item.gatewayReference || null,
                rrr: item.rrr || null,
                gatewayTransactionId: item.gatewayTransactionId || null,
                createdAt: item.createdAt ? (item.createdAt instanceof Date ? item.createdAt.toISOString() : String(item.createdAt)) : null,
                purpose: item.purpose || null,
                type: item.type,
                userId: item.userId || null,
                category: item.category,
                itemBreakdown: item.itemBreakdown,
                studentName: item.studentName || 'N/A',
                date: item.date || 'N/A',
            }));
        }

        return { 
            success: true, 
            data: grouped,
            counts,
            totals
        };
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
