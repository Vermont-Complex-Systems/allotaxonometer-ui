import { expect, test, describe } from 'vitest';
import { 
  combElems, 
  rank_turbulence_divergence, 
  diamond_count, 
  wordShift_dat, 
  balanceDat 
} from '../dist/ssr/index.js';
import { test_elem_1, test_elem_2 } from './fixtures/fakeData.js';

describe('Utility Functions - Combine Distributions', () => {
  describe('combining two systems', () => {
    test('types in elem1 should be the exact same as elem2', () => {
      // Use the functional combElems instead of the class
      const mixed_elem_test = combElems(test_elem_1, test_elem_2);
      
      // Test that both systems have the same types (the union)
      expect(mixed_elem_test[1]['types']).toEqual(mixed_elem_test[0]['types']);
    });
    
    test('combined elements have required properties', () => {
      const mixed_elem_test = combElems(test_elem_1, test_elem_2);
      
      // Check that both systems have the required properties
      expect(mixed_elem_test[0]).toHaveProperty('types');
      expect(mixed_elem_test[0]).toHaveProperty('counts');
      expect(mixed_elem_test[0]).toHaveProperty('ranks');
      expect(mixed_elem_test[0]).toHaveProperty('probs');
      
      expect(mixed_elem_test[1]).toHaveProperty('types');
      expect(mixed_elem_test[1]).toHaveProperty('counts');
      expect(mixed_elem_test[1]).toHaveProperty('ranks');
      expect(mixed_elem_test[1]).toHaveProperty('probs');
    });
    
    test('types arrays have equal lengths', () => {
      const mixed_elem_test = combElems(test_elem_1, test_elem_2);
      
      expect(mixed_elem_test[0]['types'].length).toBe(mixed_elem_test[1]['types'].length);
    });
    
    test('handles real data without errors', () => {
      // This test will verify your 134K dataset works
      expect(() => {
        const mixed_elem_test = combElems(test_elem_1, test_elem_2);
        
        // Basic sanity checks
        expect(mixed_elem_test).toHaveLength(2);
        expect(mixed_elem_test[0]['types'].length).toBeGreaterThan(0);
        expect(mixed_elem_test[1]['types'].length).toBeGreaterThan(0);
      }).not.toThrow();
    });
    
    test('preserves original data integrity', () => {
      const originalLength1 = test_elem_1.length;
      const originalLength2 = test_elem_2.length;
      
      const mixed_elem_test = combElems(test_elem_1, test_elem_2);
      
      // Original data should not be modified
      expect(test_elem_1.length).toBe(originalLength1);
      expect(test_elem_2.length).toBe(originalLength2);
      
      // Union should be at least as large as the largest input
      const unionSize = mixed_elem_test[0]['types'].length;
      const maxOriginalSize = Math.max(originalLength1, originalLength2);
      expect(unionSize).toBeGreaterThanOrEqual(maxOriginalSize);
    });
  });
  
  describe('data processing pipeline', () => {
    test('full pipeline works with real data', async () => {
      // Use dynamic import instead of require
      const { rank_turbulence_divergence, diamond_count, wordShift_dat, balanceDat } = 
        await import('../dist/ssr/index.js');
      
      const alpha = 0.17;
      
      // Step 1: Combine
      const me = combElems(test_elem_1, test_elem_2);
      expect(me).toBeDefined();
      
      // Step 2: Calculate divergence
      const rtd = rank_turbulence_divergence(me, alpha);
      expect(rtd).toHaveProperty('normalization');
      expect(rtd).toHaveProperty('divergence_elements');
      
      // Step 3: Generate diamond data
      const dat = diamond_count(me, rtd);
      expect(dat).toHaveProperty('counts');
      expect(dat).toHaveProperty('deltas');
      
      // Step 4: Generate chart data
      const barData = wordShift_dat(me, dat);
      expect(Array.isArray(barData)).toBe(true);
      
      const balanceData = balanceDat(test_elem_1, test_elem_2);
      expect(Array.isArray(balanceData)).toBe(true);
      
      console.log(`✅ Processed ${test_elem_1.length} vs ${test_elem_2.length} items successfully`);
      console.log(`   - Union size: ${me[0]['types'].length}`);
      console.log(`   - Diamond points: ${dat.counts.length}`);
      console.log(`   - Bar data points: ${barData.length}`);
      console.log(`   - Balance data points: ${balanceData.length}`);
    });
  });
});