import { describe, it, expect } from 'vitest';
import { combElems } from '../src/lib/utils/combine_distributions.js';
import rank_turbulence_divergence from '../src/lib/utils/rank_turbulence_divergence.js';
import diamond_count from '../src/lib/utils/diamond_count.js';

describe('WASM Map to Object Fix', () => {
  it('rank_turbulence_divergence returns plain object, not Map', () => {
    // Create simple test data
    const elem1 = {
      types: ['a', 'b', 'c'],
      counts: [10, 5, 2],
      totalunique: 3,
      probs: [10/17, 5/17, 2/17]
    };

    const elem2 = {
      types: ['a', 'b', 'd'],
      counts: [8, 6, 1],
      totalunique: 3,
      probs: [8/15, 6/15, 1/15]
    };

    const mixedelements = combElems([elem1], [elem2]);
    const result = rank_turbulence_divergence(mixedelements, 1.0);

    // Verify result is a plain object, not a Map
    expect(result instanceof Map).toBe(false);
    expect(typeof result).toBe('object');

    // Verify it has the expected properties
    expect(result).toHaveProperty('divergence_elements');
    expect(result).toHaveProperty('normalization');

    // Verify properties can be accessed with bracket notation
    expect(Array.isArray(result['divergence_elements'])).toBe(true);
    expect(typeof result['normalization']).toBe('number');

    // Verify properties can be accessed with dot notation
    expect(Array.isArray(result.divergence_elements)).toBe(true);
    expect(typeof result.normalization).toBe('number');
  });

  it('diamond_count works with rank_turbulence_divergence output', () => {
    // Create simple test data
    const elem1 = {
      types: ['a', 'b', 'c', 'd', 'e'],
      counts: [100, 50, 20, 10, 5],
      totalunique: 5,
      probs: [100/185, 50/185, 20/185, 10/185, 5/185]
    };

    const elem2 = {
      types: ['a', 'c', 'e', 'f', 'g'],
      counts: [80, 40, 15, 8, 4],
      totalunique: 5,
      probs: [80/147, 40/147, 15/147, 8/147, 4/147]
    };

    const mixedelements = combElems([elem1], [elem2]);
    const rtd_result = rank_turbulence_divergence(mixedelements, 1.0);

    // This should not throw an error about accessing properties on Map
    expect(() => {
      const diamond_result = diamond_count(mixedelements, rtd_result);

      // Verify diamond_count returns expected structure
      expect(diamond_result).toHaveProperty('counts');
      expect(diamond_result).toHaveProperty('deltas');
      expect(diamond_result).toHaveProperty('max_delta_loss');

      expect(Array.isArray(diamond_result.counts)).toBe(true);
      expect(Array.isArray(diamond_result.deltas)).toBe(true);
      expect(typeof diamond_result.max_delta_loss).toBe('number');
    }).not.toThrow();
  });

  it('full pipeline integration test', () => {
    // Use realistic test data - must be provided as arrays
    const elem1 = [{
      types: ['apple', 'banana', 'cherry', 'date', 'elderberry', 'fig', 'grape'],
      counts: [100, 80, 60, 40, 20, 10, 5],
      totalunique: 7,
      probs: [100/315, 80/315, 60/315, 40/315, 20/315, 10/315, 5/315]
    }];

    const elem2 = [{
      types: ['apple', 'banana', 'cherry', 'honeydew', 'kiwi', 'lemon', 'mango'],
      counts: [90, 70, 50, 35, 18, 8, 3],
      totalunique: 7,
      probs: [90/274, 70/274, 50/274, 35/274, 18/274, 8/274, 3/274]
    }];

    // Run full pipeline
    const mixedelements = combElems(elem1, elem2);
    const rtd_result = rank_turbulence_divergence(mixedelements, 0.58);
    const diamond_result = diamond_count(mixedelements, rtd_result);

    // Verify all results are valid
    expect(rtd_result.divergence_elements).toBeDefined();
    expect(Array.isArray(rtd_result.divergence_elements)).toBe(true);
    expect(rtd_result.divergence_elements.length).toBeGreaterThan(0);
    expect(typeof rtd_result.normalization).toBe('number');
    // Normalization should be finite and not NaN
    expect(isFinite(rtd_result.normalization)).toBe(true);
    expect(diamond_result.counts.length).toBeGreaterThan(0);
    expect(diamond_result.deltas.length).toBeGreaterThan(0);
    expect(typeof diamond_result.max_delta_loss).toBe('number');
  });
});
