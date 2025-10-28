import { describe, it, expect, beforeAll } from 'vitest';

describe('WASM Map return type bug - Allotaxonograph integration', () => {
  let Allotaxonograph;

  beforeAll(async () => {
    // Import from utils directly (works in test environment)
    const module = await import('../src/lib/utils/index.ts');
    Allotaxonograph = module.Allotaxonograph;
  });
  it('should handle rank_turbulence_divergence output correctly through Allotaxonograph', () => {
    // Mock data matching the structure from FastAPI endpoint
    const elem1 = [{
      types: [".", ",", "the", "of", "to", "and", "in", "a", "is", "that"],
      counts: [65477072370, 54321098765, 43210987654, 38765432109, 32109876543,
               27654321098, 23210987654, 19876543210, 16543210987, 13210987654],
      totalunique: 10,
      probs: [0.077069, 0.063456, 0.050543, 0.045321, 0.037654,
              0.032345, 0.027123, 0.023234, 0.019345, 0.015456]
    }];

    const elem2 = [{
      types: [".", ",", "the", "of", "and", "to", "a", "in", "is", "for"],
      counts: [87969106740, 76543210987, 65432109876, 54321098765, 43210987654,
               38765432109, 32109876543, 27654321098, 23210987654, 19876543210],
      totalunique: 10,
      probs: [0.078352, 0.068234, 0.058321, 0.048432, 0.038543,
              0.034567, 0.028654, 0.024678, 0.020678, 0.017689]
    }];

    // Create instance (this works)
    const instance = new Allotaxonograph(elem1, elem2, {
      alpha: 0.58,
      title: ['2024-10-10', '2024-11-10']
    });

    // Check that rtd returns correct type (not a Map!)
    expect(instance.rtd).toBeDefined();
    expect(instance.rtd).toBeTypeOf('object');
    expect(instance.rtd instanceof Map).toBe(false);

    // This should work - if rtd is a Map, these will fail
    expect(instance.rtd.divergence_elements).toBeDefined();
    expect(Array.isArray(instance.rtd.divergence_elements)).toBe(true);
    expect(typeof instance.rtd.normalization).toBe('number');
    expect(instance.rtd.normalization).toBeGreaterThan(0);

    // CRITICAL TEST - accessing dat triggers diamond_count which was failing
    // This was the original error: "can't access property 'length', A is undefined"
    expect(() => instance.dat).not.toThrow();
    expect(instance.dat).toBeDefined();
    expect(instance.dat.counts).toBeDefined();
    expect(Array.isArray(instance.dat.counts)).toBe(true);
    expect(instance.dat.deltas).toBeDefined();
    expect(Array.isArray(instance.dat.deltas)).toBe(true);
  });

  it('should produce valid barData for visualization', () => {
    const elem1 = [generateMockData(50, 1)];
    const elem2 = [generateMockData(50, 2)];  // Different seed for variation

    const instance = new Allotaxonograph(elem1, elem2, {
      alpha: 0.58,
      title: ['System 1', 'System 2']
    });

    // This accesses the full pipeline: me → rtd → dat → barData
    expect(() => instance.barData).not.toThrow();
    expect(Array.isArray(instance.barData)).toBe(true);
    expect(instance.barData.length).toBeGreaterThan(0);

    // Validate barData structure - each item should have expected properties
    const firstBar = instance.barData[0];
    expect(firstBar).toHaveProperty('type');
    expect(firstBar).toHaveProperty('metric');
    expect(typeof firstBar.metric).toBe('number');
  });

  it('should work with different alpha values', () => {
    const elem1 = [generateMockData(30, 1)];
    const elem2 = [generateMockData(30, 2)];

    // Test with alpha = 0 (special case in rank_turbulence_divergence)
    const instance1 = new Allotaxonograph(elem1, elem2, { alpha: 0 });
    expect(() => instance1.dat).not.toThrow();
    expect(instance1.rtd.divergence_elements).toBeDefined();

    // Test with alpha = Infinity (another special case)
    const instance2 = new Allotaxonograph(elem1, elem2, { alpha: Infinity });
    expect(() => instance2.dat).not.toThrow();
    expect(instance2.rtd.divergence_elements).toBeDefined();

    // Test with normal alpha value
    const instance3 = new Allotaxonograph(elem1, elem2, { alpha: 1.5 });
    expect(() => instance3.dat).not.toThrow();
    expect(instance3.rtd.divergence_elements).toBeDefined();
  });

  it('should handle large datasets without throwing Map-related errors', () => {
    // Generate larger dataset to potentially trigger WASM path
    const elem1 = [generateMockData(200, 1)];
    const elem2 = [generateMockData(200, 2)];

    const instance = new Allotaxonograph(elem1, elem2, {
      alpha: 0.58,
      topN: 50
    });

    // Full pipeline test - this is the MAIN TEST for the Map bug fix!
    expect(() => {
      const rtd = instance.rtd;
      const dat = instance.dat;  // This calls diamond_count which was failing with Map
      const barData = instance.barData;
      const balanceData = instance.balanceData;

      expect(rtd).toBeDefined();
      expect(dat).toBeDefined();
      expect(barData).toBeDefined();
      expect(balanceData).toBeDefined();
    }).not.toThrow();

    // Verify the data is actually usable (not NaN or invalid)
    expect(instance.rtd.normalization).toBeGreaterThan(0);
    expect(isFinite(instance.rtd.normalization)).toBe(true);
  });

  it('should allow updating data and recomputing without errors', () => {
    const elem1 = [generateMockData(40, 1)];
    const elem2 = [generateMockData(40, 2)];

    const instance = new Allotaxonograph(elem1, elem2);

    // Initial data should work
    expect(() => instance.dat).not.toThrow();
    const initialNorm = instance.rtd.normalization;

    // Update data with different distributions
    const elem3 = [generateMockData(40, 3)];
    const elem4 = [generateMockData(40, 4)];
    instance.updateData(elem3, elem4, ['Updated 1', 'Updated 2']);

    // Should recompute without errors
    expect(() => instance.dat).not.toThrow();
    const updatedNorm = instance.rtd.normalization;

    // Normalization should have changed (different data)
    expect(updatedNorm).not.toEqual(initialNorm);
    expect(instance.rtd.divergence_elements).toBeDefined();
  });
});

// Helper function to generate realistic mock data
function generateMockData(count, seed = 1) {
  const commonWords = [
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
    'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
    'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
    'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what'
  ];

  const types = [];
  const counts = [];
  const probs = [];
  let totalCounts = 0;

  for (let i = 0; i < count; i++) {
    const word = i < commonWords.length ? commonWords[i] : `word_${i}_${seed}`;
    // Zipf-like distribution: counts decrease by rank
    // Add seed variation to make datasets different
    const count_val = Math.floor((1000000 + seed * 10000) / Math.pow(i + 1, 1.5));

    types.push(word);
    counts.push(count_val);
    totalCounts += count_val;
  }

  // Calculate probabilities
  for (let i = 0; i < count; i++) {
    probs.push(counts[i] / totalCounts);
  }

  return {
    types,
    counts,
    totalunique: count,
    probs
  };
}
