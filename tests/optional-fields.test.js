import { describe, it, expect } from 'vitest';
import { combElems } from '../src/lib/utils/combine_distributions.js';
import { Allotaxonograph } from '../src/lib/utils/allotaxonograph.svelte.ts';

describe('Optional totalunique and probs fields', () => {
  it('should work with minimal data (only types and counts)', () => {
    // User-friendly minimal format - just types and counts!
    const elem1 = [
      { types: 'apple', counts: 100 },
      { types: 'banana', counts: 50 },
      { types: 'cherry', counts: 25 }
    ];

    const elem2 = [
      { types: 'apple', counts: 80 },
      { types: 'banana', counts: 60 },
      { types: 'date', counts: 30 }
    ];

    // Should not throw
    expect(() => {
      const result = combElems(elem1, elem2);
      expect(result).toBeDefined();
      expect(result[0].types).toBeDefined();
      expect(result[0].probs).toBeDefined();
      expect(result[0].totalunique).toBeDefined();
    }).not.toThrow();
  });

  it('should calculate probs correctly when missing', () => {
    const elem1 = [
      { types: 'a', counts: 50 },  // Total = 100, so prob = 0.5
      { types: 'b', counts: 30 },  // prob = 0.3
      { types: 'c', counts: 20 }   // prob = 0.2
    ];

    const elem2 = [
      { types: 'a', counts: 40 },  // Total = 100, so prob = 0.4
      { types: 'b', counts: 35 },  // prob = 0.35
      { types: 'd', counts: 25 }   // prob = 0.25
    ];

    const result = combElems(elem1, elem2);

    // Check that probs sum to 1 (or very close)
    const sum1 = result[0].probs.reduce((a, b) => a + b, 0);
    const sum2 = result[1].probs.reduce((a, b) => a + b, 0);

    expect(sum1).toBeCloseTo(1.0, 10);
    expect(sum2).toBeCloseTo(1.0, 10);

    // Check specific probabilities for items we know
    // Note: result includes union of types, so we need to find indices
    const aIndex = result[0].types.indexOf('a');
    expect(result[0].probs[aIndex]).toBeCloseTo(0.5, 10);
    expect(result[1].probs[aIndex]).toBeCloseTo(0.4, 10);
  });

  it('should calculate totalunique correctly when missing', () => {
    const elem1 = [
      { types: 'a', counts: 10 },
      { types: 'b', counts: 20 },
      { types: 'c', counts: 30 }
    ];

    const elem2 = [
      { types: 'a', counts: 15 },
      { types: 'd', counts: 25 }
    ];

    const result = combElems(elem1, elem2);

    // After union, we have 4 unique types: a, b, c, d
    expect(result[0].totalunique).toBe(4);
    expect(result[1].totalunique).toBe(4);
  });

  it('should preserve existing probs and totalunique if provided', () => {
    const elem1 = [
      { types: 'a', counts: 100, probs: 0.6, totalunique: 5 },
      { types: 'b', counts: 50, probs: 0.3, totalunique: 5 },
      { types: 'c', counts: 20, probs: 0.1, totalunique: 5 }
    ];

    const elem2 = [
      { types: 'a', counts: 80, probs: 0.5, totalunique: 4 },
      { types: 'b', counts: 60, probs: 0.4, totalunique: 4 },
      { types: 'd', counts: 30, probs: 0.1, totalunique: 4 }
    ];

    const result = combElems(elem1, elem2);

    // Should use provided probs (before union)
    const aIndex = result[0].types.indexOf('a');
    expect(result[0].probs[aIndex]).toBe(0.6);
    expect(result[1].probs[aIndex]).toBe(0.5);
  });

  it('should work with Allotaxonograph class using minimal data', () => {
    const elem1 = [{
      types: ['apple', 'banana', 'cherry'],
      counts: [100, 50, 25]
      // No totalunique or probs!
    }];

    const elem2 = [{
      types: ['apple', 'banana', 'date'],
      counts: [80, 60, 30]
      // No totalunique or probs!
    }];

    // Should work without errors
    expect(() => {
      const instance = new Allotaxonograph(elem1, elem2);
      expect(instance.isDataReady).toBeDefined();
      expect(instance.rtd).toBeDefined();
    }).not.toThrow();
  });

  it('should handle mixed format (some with probs, some without)', () => {
    const elem1 = [
      { types: 'a', counts: 100, probs: 0.5 },  // Has probs
      { types: 'b', counts: 50, probs: 0.25 },  // Has probs
      { types: 'c', counts: 50 }                 // No probs
    ];

    const elem2 = [
      { types: 'a', counts: 80 },                // No probs
      { types: 'b', counts: 60, probs: 0.6 }     // Has probs
    ];

    // Should not throw
    expect(() => {
      const result = combElems(elem1, elem2);
      expect(result[0].probs).toBeDefined();
      expect(result[1].probs).toBeDefined();
    }).not.toThrow();
  });

  it('should produce correct results with real-world minimal data', () => {
    // Simulating user data where they only provide types and counts
    const tweets2020 = [
      { types: 'covid', counts: 10000 },
      { types: 'pandemic', counts: 8000 },
      { types: 'vaccine', counts: 5000 },
      { types: 'lockdown', counts: 3000 },
      { types: 'mask', counts: 2000 }
    ];

    const tweets2021 = [
      { types: 'vaccine', counts: 12000 },
      { types: 'covid', counts: 8000 },
      { types: 'delta', counts: 6000 },
      { types: 'booster', counts: 4000 },
      { types: 'pandemic', counts: 3000 }
    ];

    const result = combElems(tweets2020, tweets2021);

    // Should have all unique types from both datasets
    expect(result[0].types.length).toBeGreaterThanOrEqual(7);

    // Should have valid probabilities
    expect(result[0].probs.every(p => p >= 0 && p <= 1)).toBe(true);
    expect(result[1].probs.every(p => p >= 0 && p <= 1)).toBe(true);

    // Should have valid totalunique
    expect(result[0].totalunique).toBeGreaterThan(0);
    expect(result[1].totalunique).toBeGreaterThan(0);
  });
});
