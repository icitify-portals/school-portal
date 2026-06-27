import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    generateTwoFactorSetupAction,
    enableTwoFactorAction,
    verifyTwoFactorLoginAction,
    verifyBackupCodeLoginAction,
    disableTwoFactorAction
} from '../../actions/two-factor';
import { db } from '@/db/db';
import { auth } from '@/auth';
import { users } from '@/db/schema';
import * as totp from '@/lib/totp';
import * as encryption from '@/lib/encryption';
import bcrypt from 'bcryptjs';

describe('Two-Factor Authentication Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        
        // Mock DB behavior
        (db.select as any).mockImplementation(() => {
            const mockValue: any[] = [{ 
                id: 1, 
                twoFactorEnabled: true, 
                twoFactorSecret: 'ENCRYPTED_SECRET', 
                password: 'hashed_password' 
            }];
            return {
                from: vi.fn(() => ({
                    where: vi.fn(() => ({
                        limit: vi.fn().mockResolvedValue(mockValue)
                    }))
                }))
            };
        });

        (db.update as any).mockImplementation(() => {
            return {
                set: vi.fn(() => ({
                    where: vi.fn().mockResolvedValue([{ insertId: 1 }])
                }))
            };
        });

        // Mock Auth
        (auth as any).mockResolvedValue({
            user: { id: 1, email: 'test@school.com', tenant: 'school_portal' }
        });
        
        // Mock TOTP & Encryption
        vi.spyOn(encryption, 'encrypt').mockReturnValue('ENCRYPTED');
        vi.spyOn(encryption, 'decrypt').mockReturnValue('DECRYPTED');
        vi.spyOn(totp, 'verifyTOTP').mockReturnValue(true);
        vi.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
    });

    it('generates a 2FA setup secret and URI', async () => {
        const result = await generateTwoFactorSetupAction();
        expect(result.error).toBeUndefined();
        expect(result.secret).toBeDefined();
        expect(result.otpauthUri).toContain('otpauth://totp/');
        expect(result.otpauthUri).toContain('test%40school.com');
    });

    it('enables 2FA with a valid code', async () => {
        const result = await enableTwoFactorAction('MOCKSECRET', '123456');
        expect(totp.verifyTOTP).toHaveBeenCalledWith('MOCKSECRET', '123456');
        expect(result.error).toBeUndefined();
        expect(result.success).toBe(true);
        expect(result.backupCodes).toHaveLength(8);
        expect(db.update).toHaveBeenCalled();
    });

    it('fails to enable 2FA with an invalid code', async () => {
        vi.spyOn(totp, 'verifyTOTP').mockReturnValue(false);
        const result = await enableTwoFactorAction('MOCKSECRET', '000000');
        expect(result.error).toBe('Invalid verification code. Please check your authenticator app and try again.');
        expect(result.success).toBeUndefined();
    });

    it('disables 2FA with valid code', async () => {
        const result = await disableTwoFactorAction('123456');
        expect(totp.verifyTOTP).toHaveBeenCalled();
        expect(result.error).toBeUndefined();
        expect(result.success).toBe(true);
        expect(db.update).toHaveBeenCalled();
    });
});
