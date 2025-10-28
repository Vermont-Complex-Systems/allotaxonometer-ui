import { sum } from "d3-array";
import { which } from "./utils_helpers.js";

// WASM module cache
let wasmModule = null;
let wasmInitialized = false;

// Eagerly try to load WASM (but don't block)
(async function initWASM() {
  try {
    const module = await import('./wasm/allotaxonometer_wasm.js');
    await module.default(); // Initialize WASM
    wasmModule = module;
    wasmInitialized = true;
    console.log('✅ WASM module loaded successfully');
  } catch (e) {
    console.warn('⚠️  WASM not available, using JS fallback:', e.message);
    wasmModule = null;
    wasmInitialized = false;
  }
})();

// JavaScript fallback implementation
function divElems(inv_r1, inv_r2, alpha) {
  if (alpha === Infinity) {
      return inv_r1.map((d,i) => inv_r1[i] == inv_r2[i] ? 0 : Math.max(inv_r1[i], inv_r2[i]))
  } else if (alpha == 0) {
      const x_max = inv_r1.map((d,i) => Math.max(1 / inv_r1[i], 1 / inv_r2[i]))
      const x_min = inv_r1.map((d,i) => Math.min(1 / inv_r1[i], 1 / inv_r2[i]))
      return inv_r1.map((d,i) => Math.log10(x_max[i] / x_min[i]))
  } else {
      return inv_r1.map((d,i) => (alpha+1) / alpha * Math.abs(inv_r1[i]**alpha - inv_r2[i]**alpha)**(1. / (alpha+1)))
    }
}

function norm_divElems(mixedelements, inv_r1, inv_r2, alpha) {
  const c1 = mixedelements[0]['counts']
  const c2 = mixedelements[1]['counts']

  const indices1 = which(c1.map(d => d > 0))
  const indices2 = which(c2.map(d => d > 0))

  const N1 = indices1.length
  const N2 = indices2.length

  function calc_disjoint(N1, N2) {
    return( 1 / (N2 + N1/2) )
    }

  const inv_r1_disjoint = calc_disjoint(N1, N2)
  const inv_r2_disjoint = calc_disjoint(N2, N1)

  if (alpha === Infinity) {
      return sum(indices1.map((i) => inv_r1[i])) + sum(indices2.map((i) => inv_r2[i]))
  } else if (alpha === 0) {
      const term1 = sum(
        indices1.map((i) => Math.abs(Math.log(inv_r1[i] / inv_r2_disjoint)))
      )
      const term2 = sum(
        indices2.map((i) => Math.abs(Math.log(inv_r2[i] / inv_r1_disjoint)))
      )
      return term1 + term2
  } else {
      const term1 = (alpha+1)/alpha * sum(
        indices1.map((i) => inv_r1[i]).map( d => (Math.abs(d**alpha) - inv_r2_disjoint**alpha)**(1./(alpha+1) ))
      )
      const term2 = (alpha+1)/alpha * sum(
        indices2.map((i) => inv_r2[i]).map(d => Math.abs(inv_r1_disjoint**alpha - d**alpha)**(1. / (alpha+1)))
      )
      return term1 + term2
    }
}

// JS implementation (fallback)
function rank_turbulence_divergence_js(mixedelements, alpha) {
  const inv_r1 = mixedelements[0]['ranks'].map(d => Math.pow(d, -1))
  const inv_r2 = mixedelements[1]['ranks'].map(d => Math.pow(d, -1))

  const divergence_elements = divElems(inv_r1, inv_r2, alpha)
  const normalization = norm_divElems(mixedelements, inv_r1, inv_r2, alpha)

  return {
    'divergence_elements': divergence_elements.map(d => d / normalization),
    'normalization': normalization
  }
}

// Main export: SYNCHRONOUS - uses WASM if available, otherwise JS
export default function rank_turbulence_divergence(mixedelements, alpha) {
  // If WASM is loaded, use it
  if (wasmInitialized && wasmModule) {
    try {
      // Call WASM implementation
      const result = wasmModule.rank_turbulence_divergence(
        mixedelements[0]['ranks'],
        mixedelements[1]['ranks'],
        mixedelements[0]['counts'],
        mixedelements[1]['counts'],
        alpha
      );

      // WASM returns a Map, convert to plain object to match expected interface
      if (result instanceof Map) {
        return {
          divergence_elements: result.get('divergence_elements'),
          normalization: result.get('normalization')
        };
      }

      // Handle plain object (in case WASM serialization changes in the future)
      if (result && typeof result === 'object' && result.divergence_elements) {
        return {
          divergence_elements: result.divergence_elements,
          normalization: result.normalization
        };
      }

      // Unexpected format, fall back to JS
      console.warn('⚠️  WASM returned unexpected format, using JS fallback. Got:', result);
      return rank_turbulence_divergence_js(mixedelements, alpha);
    } catch (e) {
      console.warn('⚠️  WASM execution failed, using JS fallback:', e);
      return rank_turbulence_divergence_js(mixedelements, alpha);
    }
  } else {
    // Use JS fallback
    return rank_turbulence_divergence_js(mixedelements, alpha);
  }
}
