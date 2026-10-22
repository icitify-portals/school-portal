"use server";
import { db } from "@/db/db";
import { transactions, payment_transactions, students, admissionApplicationsV2, users, studentLedger, studentBills } from "@/db/schema";
import { eq, inArray, desc, sql, or, like } from "drizzle-orm";
import { revalidatePath } from "next/cache";

function cleanStudentName(rawName?: string | null): string {
    if (!rawName) return '';
    const trimmed = rawName.trim();
    if (trimmed.toLowerCase() === 'null' || trimmed.toLowerCase() === 'undefined') return '';
    return trimmed.replace(/\bnull\b/gi, '').replace(/\bundefined\b/gi, '').replace(/\s+/g, ' ').trim();
}

async function resolveRemitaPayer(rrr?: string | null, reference?: string | null) {
    try {
        const isLive = process.env.REMITA_ENV !== 'demo';
        const merchantId = isLive ? "19201597339" : (process.env.REMITA_MERCHANT_ID || "19201597339");
        const apiKey = isLive ? "6NYU4646" : (process.env.REMITA_API_KEY || "6NYU4646");
        const baseUrl = isLive ? 'https://login.remita.net' : 'https://demo.remita.net';
        const crypto = await import('crypto');

        let hash = '';
        let url = '';
        if (rrr && rrr.trim().length > 0) {
            hash = crypto.createHash('sha512').update(`${rrr.trim()}${apiKey}${merchantId}`).digest('hex');
            url = `${baseUrl}/remita/exapp/api/v1/send/api/echannelsvc/${merchantId}/${rrr.trim()}/${hash}/status.reg`;
        } else if (reference && reference.trim().length > 0) {
            hash = crypto.createHash('sha512').update(`${reference.trim()}${apiKey}${merchantId}`).digest('hex');
            url = `${baseUrl}/remita/exapp/api/v1/send/api/echannelsvc/${merchantId}/${reference.trim()}/${hash}/status.reg`;
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
            payerEmail: data.payerEmail || null,
            payerPhone: data.payerPhoneNumber || null,
            paymentDescription: data.paymentDescription || null,
            amount: data.amount || null,
            orderId: data.orderId || null,
        };
    } catch {
        return null;
    }
}

export async function getSuccessfulPaymentsGrouped() {
    try {
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
            const rrr = anyTx.rrr || (() => { try { const m = typeof anyTx.metadata === 'string' ? JSON.parse(anyTx.metadata) : anyTx.metadata; return m?.rrr || m?.RRR || null; } catch { return null; } })() || anyTx.gatewayTransactionId || null;
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
        const txIdsWithoutStudentId: number[] = [];
        const unknownRefs: string[] = [];

        txs.forEach(tx => {
            if (tx.studentId) {
                studentIds.add(Number(tx.studentId));
            } else if (tx.type === 'admission') {
                txIdsWithoutStudentId.push(tx.id);
            }

            const match = tx.gatewayReference?.match(/^(?:SCH|ACC|PROC|FORM)-(\d+)-/);
            if (match) {
                appIds.add(parseInt(match[1]));
            } else if (tx.type === 'admission' && tx.gatewayReference) {
                unknownRefs.push(tx.gatewayReference);
            }
            
            const purposeMatch = tx.purpose?.match(/Application ID:?\s*(\d+)/i);
            if (purposeMatch) {
                appIds.add(parseInt(purposeMatch[1]));
            }

            const studentIdInPurpose = tx.purpose?.match(/(?:Student ID|ID):\s*(\d+)/i);
            if (studentIdInPurpose) {
                studentIds.add(parseInt(studentIdInPurpose[1]));
            }

            if (tx.userId) userIds.add(Number(tx.userId));
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
        const appMap = new Map<number, string>();
        const studentMap = new Map<number | string, string>();

        const extractName = (app: any) => {
            let fallback = 'Applicant';
            try { 
                const d = JSON.parse(app.data as string || '{}');
                fallback = d.fullName || d.name || `${d.FirstName || d.firstName || d.first_name || ''} ${d['Last Name'] || d.lastName || d.last_name || d.surname || ''}`.trim() || 'Applicant';
            } catch(e) {}
            return app.name || fallback;
        };

        if (appIds.size > 0) {
            const apps = await db.select({ id: admissionApplicationsV2.id, name: users.name, data: admissionApplicationsV2.data })
                .from(admissionApplicationsV2)
                .leftJoin(users, eq(admissionApplicationsV2.applicantId, users.id))
                .where(inArray(admissionApplicationsV2.id, Array.from(appIds)));
            
            apps.forEach(app => {
                appMap.set(app.id, extractName(app));
            });
        }

        if (studentIds.size > 0) {
            const studentsData = await db.select({ 
                id: students.id, 
                firstName: students.firstName, 
                lastName: students.lastName, 
                matricNumber: students.matricNumber,
                userName: users.name,
                userEmail: users.email
            })
            .from(students)
            .leftJoin(users, eq(students.userId, users.id))
            .where(inArray(students.id, Array.from(studentIds)));

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
            });
        }

        if (unknownRefs.length > 0) {
            const chunkedRefs = [];
            for (let i = 0; i < unknownRefs.length; i += 100) chunkedRefs.push(unknownRefs.slice(i, i + 100));
            
            for (const chunk of chunkedRefs) {
                const matchedApps = await db.select({ 
                    payRef: admissionApplicationsV2.paymentReference, 
                    procRef: admissionApplicationsV2.processingFeeReference,
                    accRef: admissionApplicationsV2.acceptancePaymentReference,
                    name: users.name, 
                    data: admissionApplicationsV2.data 
                })
                .from(admissionApplicationsV2)
                .leftJoin(users, eq(admissionApplicationsV2.applicantId, users.id))
                .where(or(
                    inArray(admissionApplicationsV2.paymentReference, chunk),
                    inArray(admissionApplicationsV2.processingFeeReference, chunk),
                    inArray(admissionApplicationsV2.acceptancePaymentReference, chunk)
                ));

                matchedApps.forEach(app => {
                    const name = extractName(app);
                    if (app.payRef) refToNameMap.set(app.payRef, name);
                    if (app.procRef) refToNameMap.set(app.procRef, name);
                    if (app.accRef) refToNameMap.set(app.accRef, name);
                });
            }
        }

        const userMap = new Map<number | string, string>();
        if (userIds.size > 0) {
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
            .where(inArray(users.id, Array.from(userIds)));
            
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

        const grouped: Record<string, any[]> = {};
        for (const tx of txs) {
            if (tx.gateway !== 'paystack' && tx.gateway !== 'remita' && tx.gateway !== 'alatpay') continue;
            
            let category = 'Other';
            let itemBreakdown = tx.purpose || 'N/A';
            
            const p = (tx.purpose || '').toLowerCase();
            if (p.includes('acceptance')) {
                category = 'Acceptance Fee';
                itemBreakdown = 'Acceptance Fee & ID Card (N2,000)';
            } else if (p.includes('school fee') || p.includes('tuition') || tx.tuitionProfile || (tx.gateway === 'remita' && parseFloat(tx.amount) > 10000)) {
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
            let matchedAppId = null;
            
            const match = tx.gatewayReference?.match(/^(?:SCH|ACC|PROC|FORM)-(\d+)-/);
            if (match) matchedAppId = parseInt(match[1]);
            
            const purposeMatch = tx.purpose?.match(/Application ID:?\s*(\d+)/i);
            if (purposeMatch) matchedAppId = parseInt(purposeMatch[1]);

            const sId = tx.studentId ? Number(tx.studentId) : (txIdToStudentId.get(tx.id) || null);
            const uId = tx.userId ? Number(tx.userId) : null;

            if (sId && studentMap.has(sId)) {
                studentName = studentMap.get(sId)!;
            } else if (matchedAppId !== null && appMap.has(matchedAppId)) {
                studentName = appMap.get(matchedAppId)!;
            } else if (tx.gatewayReference && refToNameMap.has(tx.gatewayReference)) {
                studentName = refToNameMap.get(tx.gatewayReference)!;
            } else if (uId && userMap.has(uId)) {
                studentName = userMap.get(uId)!;
            }

            // Fallback 1: Extract Student details embedded in purpose
            if (studentName === 'N/A' && tx.purpose) {
                const embeddedMatch = tx.purpose.match(/-\s*([A-Za-z\s]+)\s*\(([^)]+)\)/);
                if (embeddedMatch) {
                    const candidateName = cleanStudentName(embeddedMatch[1]);
                    const matric = embeddedMatch[2].trim();
                    if (candidateName && candidateName.length > 2) {
                        studentName = `${candidateName} (${matric})`;
                    }
                } else {
                    const idMatch = tx.purpose.match(/(?:Student ID|ID):\s*(\d+)/i);
                    if (idMatch && studentMap.has(Number(idMatch[1]))) {
                        studentName = studentMap.get(Number(idMatch[1]))!;
                    }
                }
            }

            // Fallback 2: For Remita transactions still showing N/A, query Remita status API to resolve payer
            if (studentName === 'N/A' && tx.gateway === 'remita' && (tx.rrr || tx.gatewayReference)) {
                try {
                    const remitaPayer = await resolveRemitaPayer(tx.rrr, tx.gatewayReference);
                    if (remitaPayer) {
                        let matchedUser = null;
                        const emailCandidate = (remitaPayer.payerEmail || '').replace(/^retired\.\d+\./, '').trim();
                        const phoneCandidate = (remitaPayer.payerPhone || '').trim();

                        if (emailCandidate || phoneCandidate) {
                            const foundUsers = await db.select({
                                id: users.id,
                                name: users.name,
                                studentId: students.id,
                                firstName: students.firstName,
                                lastName: students.lastName,
                                matricNumber: students.matricNumber,
                            })
                            .from(users)
                            .leftJoin(students, eq(students.userId, users.id))
                            .where(
                                or(
                                    emailCandidate ? like(users.email, `%${emailCandidate}%`) : undefined,
                                    phoneCandidate ? eq(users.phone, phoneCandidate) : undefined
                                )
                            )
                            .limit(1);

                            if (foundUsers.length > 0) {
                                matchedUser = foundUsers[0];
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

                            // Backfill studentId on the transaction record if missing
                            if (matchedUser.studentId && tx.type === 'admission' && !tx.studentId) {
                                db.update(transactions)
                                    .set({ studentId: matchedUser.studentId })
                                    .where(eq(transactions.id, tx.id))
                                    .catch(err => console.error("Failed to backfill studentId:", err));
                            }
                        } else if (remitaPayer.payerName) {
                            studentName = remitaPayer.payerName;
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
