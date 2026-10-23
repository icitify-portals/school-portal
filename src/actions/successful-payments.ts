"use server";
import { db } from "@/db/db";
import { transactions, payment_transactions, students, admissionApplicationsV2, users, studentLedger, studentBills } from "@/db/schema";
import { eq, inArray, desc, sql, or, like, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getBursarySettings } from "@/actions/bursary";

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

async function resolveRemitaPayer(
    rrr?: string | null,
    reference?: string | null,
    settings?: Record<string, string>
) {
    try {
        const isLive = process.env.REMITA_ENV !== 'demo';
        const merchantId = (settings?.gateway_remita_merchant_id) || (isLive ? "19201597339" : (process.env.REMITA_MERCHANT_ID || "19201597339"));
        const apiKey = (settings?.gateway_remita_key) || (isLive ? "6NYU4646" : (process.env.REMITA_API_KEY || "6NYU4646"));
        const baseUrl = isLive ? 'https://login.remita.net' : 'https://demo.remita.net';
        const crypto = await import('crypto');

        let hash = '';
        let url = '';
        const cleanRrr = rrr ? rrr.toString().trim() : '';
        const cleanRef = reference ? reference.toString().trim() : '';

        if (cleanRrr.length > 0) {
            hash = crypto.createHash('sha512').update(`${cleanRrr}${apiKey}${merchantId}`).digest('hex');
            url = `${baseUrl}/remita/exapp/api/v1/send/api/echannelsvc/${merchantId}/${cleanRrr}/${hash}/status.reg`;
        } else if (cleanRef.length > 0) {
            hash = crypto.createHash('sha512').update(`${cleanRef}${apiKey}${merchantId}`).digest('hex');
            url = `${baseUrl}/remita/exapp/api/v1/send/api/echannelsvc/${merchantId}/${cleanRef}/${hash}/status.reg`;
        } else {
            return null;
        }

        const res = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `remitaConsumerKey=${merchantId},remitaConsumerToken=${hash}`
            },
            signal: AbortSignal.timeout(6000)
        });
        if (!res.ok) return null;
        const data = await res.json();
        return {
            payerName: data.payerName ? cleanStudentName(data.payerName) : null,
            payerEmail: data.payerEmail ? String(data.payerEmail).trim() : null,
            payerPhone: data.payerPhoneNumber ? String(data.payerPhoneNumber).trim() : null,
            paymentDescription: data.paymentDescription ? String(data.paymentDescription).trim() : null,
            amount: data.amount || null,
            orderId: data.orderId || null,
            rrr: data.RRR || cleanRrr || null,
        };
    } catch {
        return null;
    }
}

export async function getSuccessfulPaymentsGrouped() {
    try {
        const settings = await getBursarySettings().catch(() => ({} as Record<string, string>));

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
            serviceTypeId: transactions.serviceTypeId,
            tuitionProfile: transactions.tuitionProfile,
            type: sql<string>`'admission'`,
            userId: sql<number | null>`null`,
        }).from(transactions).where(eq(transactions.status, 'completed'));

        const bursaryTxs = await db.select({
            id: payment_transactions.id,
            studentId: sql<number | null>`null`,
            amount: payment_transactions.amount,
            gateway: payment_transactions.paymentGateway,
            gatewayReference: payment_transactions.transactionReference,
            rrr: payment_transactions.gatewayTransactionId,
            metadata: payment_transactions.metadata,
            createdAt: payment_transactions.createdAt,
            purpose: payment_transactions.transactionType,
            serviceTypeId: sql<string | null>`null`,
            tuitionProfile: sql<string | null>`null`,
            type: sql<string>`'bursary'`,
            userId: payment_transactions.userId,
        }).from(payment_transactions).where(
            or(
                eq(payment_transactions.status, 'completed'),
                eq(payment_transactions.status, 'paid')
            )
        );

        // Dedupe by gatewayReference (and fallback rrr) — merge so studentId or userId from either table is preserved
        const seen = new Map<string, any>();
        for (const tx of [...admissionTxs, ...bursaryTxs]) {
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
                    tuitionProfile: tx.tuitionProfile || existing.tuitionProfile,
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

            // Extract references for admission / bill matching
            if (tx.gatewayReference) unknownRefs.add(tx.gatewayReference);
            if (tx.rrr) unknownRefs.add(tx.rrr);
            if (tx.gatewayTransactionId) unknownRefs.add(tx.gatewayTransactionId);

            // Broad match for application references: SCH-123-, ACC-123-, ADM-123-, APP-123, etc.
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

            // Extract potential matric numbers from purpose
            if (tx.purpose) {
                const matricMatches = tx.purpose.match(/[A-Za-z]{2,5}\/[A-Za-z0-9\/-]+/g);
                if (matricMatches) {
                    matricMatches.forEach(m => {
                        const cleanM = m.trim().toUpperCase();
                        if (!cleanM.startsWith('HTTP') && !cleanM.startsWith('TX-') && cleanM.length > 5) {
                            matricNumbers.add(cleanM);
                        }
                    });
                }
            }
        });

        // Fallback: Check studentLedger for transactions without studentId
        const txIdToStudentId = new Map<number, number>();
        if (txIdsWithoutStudentId.length > 0) {
            const chunkedTxIds = [];
            for (let i = 0; i < txIdsWithoutStudentId.length; i += 100) {
                chunkedTxIds.push(txIdsWithoutStudentId.slice(i, i + 100));
            }
            for (const chunk of chunkedTxIds) {
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

        const refToNameMap = new Map<string, string>();
        const appMap = new Map<number | string, string>();
        const studentMap = new Map<number | string, string>();
        const matricToStudentMap = new Map<string, string>();

        const extractName = (app: any) => {
            let fallback = 'Applicant';
            try { 
                const d = JSON.parse(app.data as string || '{}');
                fallback = d.fullName || d.name || `${d.FirstName || d.firstName || d.first_name || ''} ${d['Last Name'] || d.lastName || d.last_name || d.surname || ''}`.trim() || 'Applicant';
            } catch(e) {}
            return app.name || fallback;
        };

        if (appIds.size > 0) {
            const idArray = Array.from(appIds);
            const chunkedAppIds = [];
            for (let i = 0; i < idArray.length; i += 100) chunkedAppIds.push(idArray.slice(i, i + 100));

            for (const chunk of chunkedAppIds) {
                const apps = await db.select({ 
                    id: admissionApplicationsV2.id, 
                    name: users.name, 
                    data: admissionApplicationsV2.data,
                    formNumber: admissionApplicationsV2.formNumber,
                    appNumber: admissionApplicationsV2.applicationNumber,
                })
                .from(admissionApplicationsV2)
                .leftJoin(users, eq(admissionApplicationsV2.applicantId, users.id))
                .where(inArray(admissionApplicationsV2.id, chunk));
                
                apps.forEach(app => {
                    const name = extractName(app);
                    appMap.set(app.id, name);
                    if (app.formNumber) appMap.set(app.formNumber, name);
                    if (app.appNumber) appMap.set(app.appNumber, name);
                });
            }
        }

        if (studentIds.size > 0) {
            const idArray = Array.from(studentIds);
            const chunkedIds = [];
            for (let i = 0; i < idArray.length; i += 100) chunkedIds.push(idArray.slice(i, i + 100));

            for (const chunk of chunkedIds) {
                // Query both students.id AND students.userId to support transactions referencing either
                const studentsData = await db.select({ 
                    id: students.id, 
                    userId: students.userId,
                    firstName: students.firstName, 
                    lastName: students.lastName, 
                    matricNumber: students.matricNumber,
                    userName: users.name,
                    userEmail: users.email
                })
                .from(students)
                .leftJoin(users, eq(students.userId, users.id))
                .where(
                    or(
                        inArray(students.id, chunk),
                        inArray(students.userId, chunk)
                    )
                );

                studentsData.forEach(s => {
                    const cleanU = cleanStudentName(s.userName);
                    const cleanF = cleanStudentName(s.firstName);
                    const cleanL = cleanStudentName(s.lastName);
                    let fullName = cleanU || `${cleanF} ${cleanL}`.trim();
                    if (!fullName) fullName = s.matricNumber || s.userEmail || 'Student';
                    const display = s.matricNumber && !fullName.includes(s.matricNumber)
                        ? `${fullName} (${s.matricNumber})`
                        : fullName;
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

        if (matricNumbers.size > 0) {
            const matricsArray = Array.from(matricNumbers);
            const chunkedMatrics = [];
            for (let i = 0; i < matricsArray.length; i += 100) chunkedMatrics.push(matricsArray.slice(i, i + 100));

            for (const chunk of chunkedMatrics) {
                const matchedStudents = await db.select({
                    id: students.id,
                    userId: students.userId,
                    firstName: students.firstName,
                    lastName: students.lastName,
                    matricNumber: students.matricNumber,
                    userName: users.name,
                    userEmail: users.email
                })
                .from(students)
                .leftJoin(users, eq(students.userId, users.id))
                .where(inArray(students.matricNumber, chunk));

                matchedStudents.forEach(s => {
                    const cleanU = cleanStudentName(s.userName);
                    const cleanF = cleanStudentName(s.firstName);
                    const cleanL = cleanStudentName(s.lastName);
                    let fullName = cleanU || `${cleanF} ${cleanL}`.trim();
                    if (!fullName) fullName = s.matricNumber || s.userEmail || 'Student';
                    const display = s.matricNumber && !fullName.includes(s.matricNumber)
                        ? `${fullName} (${s.matricNumber})`
                        : fullName;
                    if (s.matricNumber) {
                        matricToStudentMap.set(s.matricNumber.trim().toUpperCase(), display);
                    }
                    studentMap.set(Number(s.id), display);
                    studentMap.set(String(s.id), display);
                    if (s.userId) {
                        studentMap.set(Number(s.userId), display);
                        studentMap.set(String(s.userId), display);
                    }
                });
            }
        }

        if (unknownRefs.size > 0) {
            const refsArray = Array.from(unknownRefs);
            const chunkedRefs = [];
            for (let i = 0; i < refsArray.length; i += 100) chunkedRefs.push(refsArray.slice(i, i + 100));
            
            for (const chunk of chunkedRefs) {
                const matchedApps = await db.select({ 
                    payRef: admissionApplicationsV2.paymentReference, 
                    procRef: admissionApplicationsV2.processingFeeReference,
                    accRef: admissionApplicationsV2.acceptancePaymentReference,
                    formNumber: admissionApplicationsV2.formNumber,
                    appNumber: admissionApplicationsV2.applicationNumber,
                    name: users.name, 
                    data: admissionApplicationsV2.data 
                })
                .from(admissionApplicationsV2)
                .leftJoin(users, eq(admissionApplicationsV2.applicantId, users.id))
                .where(or(
                    inArray(admissionApplicationsV2.paymentReference, chunk),
                    inArray(admissionApplicationsV2.processingFeeReference, chunk),
                    inArray(admissionApplicationsV2.acceptancePaymentReference, chunk),
                    inArray(admissionApplicationsV2.formNumber, chunk),
                    inArray(admissionApplicationsV2.applicationNumber, chunk)
                ));

                matchedApps.forEach(app => {
                    const name = extractName(app);
                    if (app.payRef) refToNameMap.set(app.payRef, name);
                    if (app.procRef) refToNameMap.set(app.procRef, name);
                    if (app.accRef) refToNameMap.set(app.accRef, name);
                    if (app.formNumber) refToNameMap.set(app.formNumber, name);
                    if (app.appNumber) refToNameMap.set(app.appNumber, name);
                });
            }
        }

        const userMap = new Map<number | string, string>();
        if (userIds.size > 0) {
            const idArray = Array.from(userIds);
            const chunkedUserIds = [];
            for (let i = 0; i < idArray.length; i += 100) chunkedUserIds.push(idArray.slice(i, i + 100));

            for (const chunk of chunkedUserIds) {
                const usersData = await db.select({ 
                    id: users.id, 
                    name: users.name,
                    studentId: students.id,
                    studentFirstName: students.firstName,
                    studentLastName: students.lastName,
                    matricNumber: students.matricNumber,
                })
                .from(users)
                .leftJoin(students, eq(students.userId, users.id))
                .where(inArray(users.id, chunk));
                
                usersData.forEach(u => {
                    const cleanU = cleanStudentName(u.name);
                    const cleanF = cleanStudentName(u.studentFirstName);
                    const cleanL = cleanStudentName(u.studentLastName);
                    let fullName = cleanU || `${cleanF} ${cleanL}`.trim() || 'Student';
                    if (u.matricNumber && !fullName.includes(u.matricNumber)) {
                        fullName = `${fullName} (${u.matricNumber})`;
                    }
                    userMap.set(Number(u.id), fullName);
                    userMap.set(String(u.id), fullName);
                });
            }
        }

        const grouped: Record<string, any[]> = {};
        for (const tx of txs) {
            const gw = (tx.gateway || '').toLowerCase().trim();
            const hasRrr = !!(tx.rrr && tx.rrr.toString().trim().length >= 8);
            const isSplitRef = !!(tx.gatewayReference && tx.gatewayReference.startsWith('TX-SPL-'));

            // Accept standard gateways or any transaction with valid RRR / split reference
            if (gw !== 'paystack' && gw !== 'remita' && gw !== 'alatpay' && gw !== 'flutterwave' && gw !== 'opay' && gw !== 'manual' && !hasRrr && !isSplitRef) {
                continue;
            }
            
            let category = 'Other';
            let itemBreakdown = tx.purpose || 'N/A';
            
            const p = (tx.purpose || '').toLowerCase();
            if (p.includes('acceptance')) {
                category = 'Acceptance Fee';
                itemBreakdown = 'Acceptance Fee & ID Card (N2,000)';
            } else if (p.includes('school fee') || p.includes('tuition') || tx.tuitionProfile || (gw === 'remita' && parseFloat(tx.amount) > 10000) || isSplitRef) {
                category = 'School Fees';
                itemBreakdown = tx.tuitionProfile || tx.purpose || 'Tuition / School Fees';
            } else if (p.includes('processing')) {
                category = 'Processing Fee';
                itemBreakdown = 'Processing Fee';
            } else if (p.includes('id card')) {
                category = 'ID Card Fee';
            } else if (p.includes('form') || p.includes('application')) {
                category = 'Application Form Fee';
            } else if (p.includes('wallet_topup') || p.includes('wallet')) {
                category = 'Wallet Topup';
                itemBreakdown = 'Wallet Funding';
            }

            let studentName = 'N/A';
            
            // 1. Check studentMap (by studentId or ledger transactionId)
            const sId = tx.studentId ? Number(tx.studentId) : (txIdToStudentId.get(tx.id) || null);
            const uId = tx.userId ? Number(tx.userId) : null;

            if (sId && studentMap.has(sId)) {
                studentName = studentMap.get(sId)!;
            } else if (uId && userMap.has(uId)) {
                studentName = userMap.get(uId)!;
            }

            // 2. Application ID or reference
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

            // 3. Direct Reference Map (gatewayReference, rrr, gatewayTransactionId)
            if (studentName === 'N/A') {
                if (tx.gatewayReference && refToNameMap.has(tx.gatewayReference)) {
                    studentName = refToNameMap.get(tx.gatewayReference)!;
                } else if (tx.rrr && refToNameMap.has(tx.rrr)) {
                    studentName = refToNameMap.get(tx.rrr)!;
                } else if (tx.gatewayTransactionId && refToNameMap.has(tx.gatewayTransactionId)) {
                    studentName = refToNameMap.get(tx.gatewayTransactionId)!;
                }
            }

            // 4. Extract student details embedded in purpose
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

                if (studentName === 'N/A') {
                    const idMatch = tx.purpose.match(/(?:Student\s*ID|StudentId|ID)[\s:#_-]*(\d+)/i);
                    if (idMatch && studentMap.has(Number(idMatch[1]))) {
                        studentName = studentMap.get(Number(idMatch[1]))!;
                    }
                }
            }

            // 5. Live Remita Status API Fallback for Remita / RRR transactions
            if (studentName === 'N/A' && (gw === 'remita' || hasRrr || isSplitRef) && (tx.rrr || tx.gatewayReference)) {
                try {
                    const remitaPayer = await resolveRemitaPayer(tx.rrr, tx.gatewayReference, settings);
                    if (remitaPayer) {
                        let matchedUser: any = null;
                        const rawEmail = remitaPayer.payerEmail || '';
                        const retiredMatch = rawEmail.match(/^retired\.(\d+)\./);
                        const retiredUserId = retiredMatch ? parseInt(retiredMatch[1]) : null;
                        const cleanEmail = rawEmail.replace(/^retired\.\d+\./, '').trim();
                        const phone = (remitaPayer.payerPhone || '').trim();

                        const userConditions = [];
                        if (retiredUserId) userConditions.push(eq(users.id, retiredUserId));
                        if (cleanEmail) userConditions.push(like(users.email, `%${cleanEmail}%`));
                        if (rawEmail) userConditions.push(eq(users.email, rawEmail));
                        if (phone && phone.length >= 7) userConditions.push(eq(users.phone, phone));

                        if (userConditions.length > 0) {
                            const foundUsers = await db.select({
                                id: users.id,
                                name: users.name,
                                email: users.email,
                                studentId: students.id,
                                firstName: students.firstName,
                                lastName: students.lastName,
                                matricNumber: students.matricNumber,
                            })
                            .from(users)
                            .leftJoin(students, eq(students.userId, users.id))
                            .where(or(...userConditions))
                            .limit(1);

                            if (foundUsers.length > 0) {
                                matchedUser = foundUsers[0];
                            }
                        }

                        // Also try matching by payerName against users if full name is present
                        if (!matchedUser && remitaPayer.payerName && remitaPayer.payerName.length > 3) {
                            const nameParts = remitaPayer.payerName.split(/\s+/).filter(Boolean);
                            if (nameParts.length >= 2) {
                                const foundByName = await db.select({
                                    id: users.id,
                                    name: users.name,
                                    email: users.email,
                                    studentId: students.id,
                                    firstName: students.firstName,
                                    lastName: students.lastName,
                                    matricNumber: students.matricNumber,
                                })
                                .from(users)
                                .leftJoin(students, eq(students.userId, users.id))
                                .where(
                                    or(
                                        like(users.name, `%${nameParts[0]}%${nameParts[1]}%`),
                                        and(
                                            like(students.firstName, `%${nameParts[0]}%`),
                                            like(students.lastName, `%${nameParts[1]}%`)
                                        )
                                    )
                                )
                                .limit(1);

                                if (foundByName.length > 0) {
                                    matchedUser = foundByName[0];
                                }
                            }
                        }

                        if (matchedUser) {
                            const cleanU = cleanStudentName(matchedUser.name);
                            const cleanF = cleanStudentName(matchedUser.firstName);
                            const cleanL = cleanStudentName(matchedUser.lastName);
                            let resolved = cleanU || `${cleanF} ${cleanL}`.trim() || cleanStudentName(remitaPayer.payerName) || 'Student';
                            if (matchedUser.matricNumber && !resolved.includes(matchedUser.matricNumber)) {
                                resolved = `${resolved} (${matchedUser.matricNumber})`;
                            }
                            studentName = resolved;

                            // PERSIST back to DB so we never need to query Remita API again for this tx
                            try {
                                if (tx.type === 'admission') {
                                    await db.update(transactions)
                                        .set({ 
                                            studentId: matchedUser.studentId || undefined,
                                            rrr: remitaPayer.rrr || tx.rrr || undefined,
                                            purpose: tx.purpose || remitaPayer.paymentDescription || undefined,
                                        })
                                        .where(eq(transactions.id, tx.id));
                                } else if (tx.type === 'bursary') {
                                    await db.update(payment_transactions)
                                        .set({ 
                                            userId: matchedUser.id,
                                            gatewayTransactionId: remitaPayer.rrr || tx.rrr || undefined
                                        })
                                        .where(eq(payment_transactions.id, tx.id));
                                }
                            } catch (updateErr) {
                                console.error("Failed to persist resolved student to DB:", updateErr);
                            }
                        } else if (remitaPayer.payerName) {
                            studentName = remitaPayer.payerName;
                            try {
                                if (tx.type === 'admission') {
                                    await db.update(transactions)
                                        .set({ 
                                            rrr: remitaPayer.rrr || tx.rrr || undefined,
                                            purpose: tx.purpose?.includes(remitaPayer.payerName)
                                                ? tx.purpose
                                                : `${tx.purpose || 'Payment'} - ${remitaPayer.payerName}`
                                        })
                                        .where(eq(transactions.id, tx.id));
                                }
                            } catch (e) {}
                        }
                    }
                } catch (remitaErr) {
                    console.error("Remita payer fallback resolution error:", remitaErr);
                }
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
        return { success: false, error: String(e) };
    }
}

export async function deleteTransaction(txId: number, type: string = 'admission') {
    try {
        if (type === 'bursary') {
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
        const bursaryIds = items.filter(i => i.type === 'bursary').map(i => i.id);
        const admissionIds = items.filter(i => i.type === 'admission').map(i => i.id);

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
        if (type === 'bursary') {
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
                    // Check if parsedId is student.id
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
                    // Check if it's already a students.id
                    const [stu] = await db.select({ id: students.id }).from(students).where(eq(students.id, parsedId)).limit(1);
                    if (stu) {
                        data.studentId = stu.id;
                    } else {
                        // Check if it's a users.id
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
