import { describe, it, expect } from 'vitest';
import { computeScreeningPercentage, decideFromScreening } from '@/actions/admin-admission';

describe('computeScreeningPercentage', () => {
    it('converts /200 totals to percentages', () => {
        expect(computeScreeningPercentage(100)).toBe(50);
        expect(computeScreeningPercentage(0)).toBe(0);
        expect(computeScreeningPercentage(200)).toBe(100);
    });

    it('handles fractional results rounded to 2dp', () => {
        expect(computeScreeningPercentage(87)).toBe(43.5);
        expect(computeScreeningPercentage(1)).toBe(0.5);
        expect(computeScreeningPercentage(53)).toBe(26.5);
        expect(computeScreeningPercentage(137)).toBe(68.5);
    });
});

describe('decideFromScreening', () => {
    const CUTOFF = 40;

    it('offers admission at exactly the cut-off', () => {
        expect(decideFromScreening(40, CUTOFF, 'present')).toBe('admitted');
        expect(decideFromScreening(39.99, CUTOFF, 'present')).toBe('screened');
    });

    it('offers admission above the cut-off regardless of attendance pending state', () => {
        expect(decideFromScreening(75, CUTOFF, 'present')).toBe('admitted');
        expect(decideFromScreening(75, CUTOFF, 'pending')).toBe('admitted');
        expect(decideFromScreening(75, CUTOFF, null)).toBe('admitted');
        expect(decideFromScreening(75, CUTOFF, undefined)).toBe('admitted');
    });

    it('never offers admission to absent applicants', () => {
        expect(decideFromScreening(100, CUTOFF, 'absent')).toBe('screened');
        expect(decideFromScreening(50, 45, 'absent')).toBe('screened');
    });

    it('keeps below cut-off applicants screened', () => {
        expect(decideFromScreening(20, CUTOFF, 'present')).toBe('screened');
        expect(decideFromScreening(0, 0, 'present')).toBe('admitted'); // zero cutoff admits everyone present
    });

    it('supports different per-exercise cut-offs (ND vs HND)', () => {
        expect(decideFromScreening(45, 40, 'present')).toBe('admitted');  // ND pass
        expect(decideFromScreening(45, 50, 'present')).toBe('screened'); // HND fail
    });
});
