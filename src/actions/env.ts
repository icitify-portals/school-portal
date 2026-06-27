"use server";

import fs from 'fs/promises';
import path from 'path';
import { auth } from '@/auth';

export type EnvVar = {
    key: string;
    value: string;
    isSecret: boolean;
};

// Extremely basic heuristic to hide common secret keys in UI by default
const isSecretKey = (key: string) => {
    const lowerKey = key.toLowerCase();
    return lowerKey.includes('secret') || 
           lowerKey.includes('password') || 
           lowerKey.includes('key') || 
           lowerKey.includes('token') ||
           lowerKey.includes('database_url');
};

const getEnvFilePath = () => path.join(process.cwd(), '.env');

// SECURITY FIX C-3: Only superadmin can read/write .env. Admin role is insufficient.
// Also block impersonation sessions from touching env configuration.
async function requireSuperAdmin() {
    const session = await auth();
    const role = (session?.user as any)?.role;
    const isImpersonating = (session?.user as any)?.impersonating;
    if (role !== 'superadmin' || isImpersonating) {
        return null;
    }
    return session;
}

/**
 * Parses the .env file into key-value pairs
 */
export async function getEnvVariables(): Promise<{ success: boolean; data?: EnvVar[]; error?: string }> {
    try {
        const session = await requireSuperAdmin();
        if (!session) {
            return { success: false, error: 'Unauthorized. Superadmin access required.' };
        }

        const envPath = getEnvFilePath();
        let envContent = '';
        try {
            envContent = await fs.readFile(envPath, 'utf8');
        } catch (e: any) {
            // File might not exist
            if (e.code === 'ENOENT') {
                return { success: true, data: [] };
            }
            throw e;
        }

        const lines = envContent.split('\n');
        const variables: EnvVar[] = [];

        for (const line of lines) {
            const trimmedLine = line.trim();
            // Ignore empty lines and comments
            if (!trimmedLine || trimmedLine.startsWith('#')) continue;

            const splitIndex = trimmedLine.indexOf('=');
            if (splitIndex !== -1) {
                const key = trimmedLine.slice(0, splitIndex).trim();
                let value = trimmedLine.slice(splitIndex + 1).trim();

                // Remove surrounding quotes if present
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }

                variables.push({
                    key,
                    value,
                    isSecret: isSecretKey(key),
                });
            }
        }

        return { success: true, data: variables };
    } catch (e: any) {
        console.error('Error reading .env file:', e);
        return { success: false, error: 'Failed to read environment configuration.' };
    }
}

/**
 * Saves given list of variables into the .env file.
 * We try to preserve existing comments/formatting if a key already exists.
 * New keys are appended to the end.
 */
export async function saveEnvVariables(updates: { key: string; value: string }[]): Promise<{ success: boolean; error?: string }> {
    try {
        const session = await requireSuperAdmin();
        if (!session) {
            return { success: false, error: 'Unauthorized. Superadmin access required.' };
        }

        const envPath = getEnvFilePath();
        let envContent = '';
        try {
            envContent = await fs.readFile(envPath, 'utf8');
        } catch (e: any) {
             if (e.code !== 'ENOENT') throw e;
        }

        const lines = envContent.split('\n');
        const updatedLines: string[] = [];
        const processedKeys = new Set<string>();
        const updatesMap = new Map(updates.map(u => [u.key, u.value]));

        for (let i = 0; i < lines.length; i++) {
            const trimmedLine = lines[i].trim();
            
            if (!trimmedLine || trimmedLine.startsWith('#')) {
                updatedLines.push(lines[i]); 
                continue;
            }

            const splitIndex = trimmedLine.indexOf('=');
            if (splitIndex !== -1) {
                const key = trimmedLine.slice(0, splitIndex).trim();
                
                if (updatesMap.has(key)) {
                    const newValue = updatesMap.get(key)!;
                    const val = newValue.includes(' ') || newValue.includes('#') 
                                ? `"${newValue}"` 
                                : newValue;
                    updatedLines.push(`${key}=${val}`);
                    processedKeys.add(key);
                } else {
                    // Key was in old file but NOT in the updates list passed from the UI
                    // This implies the admin deleted it. We omit it from updatedLines.
                }
            } else {
                 updatedLines.push(lines[i]); 
            }
        }

        // Add any brand new keys that weren't in the original file
        const newKeys = updates.filter(u => !processedKeys.has(u.key));
        if (newKeys.length > 0) {
            if (updatedLines.length > 0 && updatedLines[updatedLines.length - 1].trim() !== '') {
                updatedLines.push(''); 
            }
            for (const newVar of newKeys) {
                const val = newVar.value.includes(' ') || newVar.value.includes('#') 
                            ? `"${newVar.value}"` 
                            : newVar.value;
                updatedLines.push(`${newVar.key}=${val}`);
            }
        }

        const newContent = updatedLines.join('\n');
        await fs.writeFile(envPath, newContent, 'utf8');

        // SECURITY FIX C-3: Audit every .env write so all credential changes are traceable.
        try {
            const { db } = await import('@/db/db');
            const { systemAuditLogs } = await import('@/db/schema');
            const actorId = session.user?.id ? parseInt(session.user.id as string) : 0;
            await db.insert(systemAuditLogs).values({
                actorId,
                action: 'ENV_FILE_UPDATED',
                targetId: 'system',
                details: JSON.stringify({
                    updatedKeys: updates.map(u => u.key),
                    timestamp: new Date().toISOString(),
                }),
                status: 'success',
            });
        } catch (auditErr) {
            // Non-fatal — log but do not fail the write
            console.error('Failed to write env audit log:', auditErr);
        }

        return { success: true };
    } catch (e: any) {
        console.error('Error saving .env configuration:', e);
        return { success: false, error: 'Failed to write configuration to file.' };
    }
}
