import { describe, it, expect } from 'vitest';
import { adaptDisplayResult } from '../src/lib/utils/adapt_display.ts';

// Mock AllotaxDisplayResult matching the Rust struct shape
const mockSingleAlpha = {
    normalization: 0.42,
    diamond_counts: [
        { x1: 3, y1: 5, value: 12, types: 'foo, bar', which_sys: 'right', coord_on_diag: 4.0, cos_dist: 4.0, max_rank: 1200.0 },
        { x1: 7, y1: 2, value: 3, types: 'baz', which_sys: 'left', coord_on_diag: 4.5, cos_dist: 25.0, max_rank: 500.0 },
        { x1: 1, y1: 1, value: 45, types: 'qux, quux, corge', which_sys: 'right', coord_on_diag: 1.0, cos_dist: 0.0, max_rank: 15.0 },
    ],
    max_delta_loss: 0.03,
    wordshift: [
        { type: 'foo (1 ⇋ 3)', metric: 0.015 },
        { type: 'bar (2 ⇋ 8)', metric: -0.012 },
        { type: 'baz (5 ⇋ 1)', metric: 0.008 },
    ],
    balance: [
        { y_coord: 'total count', frequency: 0.3 },
        { y_coord: 'total count', frequency: -0.7 },
        { y_coord: 'all types', frequency: 0.45 },
        { y_coord: 'all types', frequency: -0.55 },
        { y_coord: 'exclusive types', frequency: 0.1 },
        { y_coord: 'exclusive types', frequency: -0.2 },
    ],
    alpha: 1.0,
};

describe('adaptDisplayResult', () => {
    it('should produce dat.counts with rank_L arrays for Diamond component', () => {
        const result = adaptDisplayResult(mockSingleAlpha);

        expect(result.dat.counts).toHaveLength(3);
        // Diamond reads rank_L[1] for max rank computation
        expect(result.dat.counts[0].rank_L[1]).toBe(1200.0);
        expect(result.dat.counts[1].rank_L[1]).toBe(500.0);
        expect(result.dat.counts[2].rank_L[1]).toBe(15.0);
    });

    it('should preserve all Diamond-required fields', () => {
        const result = adaptDisplayResult(mockSingleAlpha);
        const cell = result.dat.counts[0];

        expect(cell.x1).toBe(3);
        expect(cell.y1).toBe(5);
        expect(cell.value).toBe(12);
        expect(cell.types).toBe('foo, bar');
        expect(cell.which_sys).toBe('right');
        expect(cell.coord_on_diag).toBe(4.0);
        expect(cell.cos_dist).toBe(4.0);
        expect(cell.rank).toBe('');
        expect(cell.rank_R).toEqual([]);
    });

    it('should have no empty cells (value=0)', () => {
        const result = adaptDisplayResult(mockSingleAlpha);
        expect(result.dat.counts.every(c => c.value > 0)).toBe(true);
    });

    it('should set max_delta_loss on dat', () => {
        const result = adaptDisplayResult(mockSingleAlpha);
        expect(result.dat.max_delta_loss).toBe(0.03);
    });

    it('should map normalization to divnorm', () => {
        const result = adaptDisplayResult(mockSingleAlpha);
        expect(result.divnorm).toBe(0.42);
    });

    it('should pass through barData (wordshift entries)', () => {
        const result = adaptDisplayResult(mockSingleAlpha);
        expect(result.barData).toHaveLength(3);
        expect(result.barData[0].type).toBe('foo (1 ⇋ 3)');
        expect(result.barData[0].metric).toBe(0.015);
    });

    it('should pass through balanceData', () => {
        const result = adaptDisplayResult(mockSingleAlpha);
        expect(result.balanceData).toHaveLength(6);
        expect(result.balanceData[0].y_coord).toBe('total count');
    });

    it('should compute maxlog10 from max_rank values', () => {
        const result = adaptDisplayResult(mockSingleAlpha);
        // max_rank across cells = 1200, log10(1200) ≈ 3.08, ceil = 4
        expect(result.maxlog10).toBe(4);
    });

    it('should compute max_count_log from cell values', () => {
        const result = adaptDisplayResult(mockSingleAlpha);
        // max value = 45, log10(45) ≈ 1.65, ceil = 2, +1 = 3
        expect(result.max_count_log).toBe(3);
    });

    it('should compute xDomain from max_shift', () => {
        const result = adaptDisplayResult(mockSingleAlpha);
        // max_shift = max(|0.015|, |-0.012|, |0.008|) = 0.015
        expect(result.max_shift).toBe(0.015);
        expect(result.xDomain[0]).toBeCloseTo(-0.015 * 1.5);
        expect(result.xDomain[1]).toBeCloseTo(0.015 * 1.5);
    });

    it('should set isDataReady to true', () => {
        const result = adaptDisplayResult(mockSingleAlpha);
        expect(result.isDataReady).toBe(true);
    });

    it('should preserve alpha', () => {
        const result = adaptDisplayResult(mockSingleAlpha);
        expect(result.alpha).toBe(1.0);
    });
});

