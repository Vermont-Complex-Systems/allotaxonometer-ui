// Full-pipeline WASM acceleration via allotax-core.
// Falls back to JS implementations if WASM is unavailable.

let wasmModule = null;
let wasmInitialized = false;

// Eagerly load WASM (non-blocking)
(async function initWASM() {
  try {
    const module = await import('./wasm/allotax_wasm.js');
    await module.default();
    wasmModule = module;
    wasmInitialized = true;
    console.log('✅ allotax-core WASM loaded (full pipeline)');
  } catch (e) {
    console.warn('⚠️  allotax-core WASM not available, using JS fallback:', e.message);
    wasmModule = null;
    wasmInitialized = false;
  }
})();

/**
 * Adapt WASM AllotaxResult to the shapes expected by existing components.
 * WASM returns: { mixed_elements: { system1, system2 }, rtd, diamond, wordshift, balance }
 * Components expect: me = [sys1, sys2], rtd, dat (diamond), barData, balanceData
 */
function adaptResult(result) {
  // mixed_elements: { system1, system2 } → [sys1, sys2] array
  const me = [result.mixed_elements.system1, result.mixed_elements.system2];

  // rtd: direct mapping
  const rtd = result.rtd;

  // diamond result — the JS diamond_count mutates `me` in place to reorder
  // by divergence. The Rust version returns reordered mixed_elements inside
  // the diamond result. We need to apply that reordering to `me` as well.
  const dat = {
    counts: result.diamond.counts,
    deltas: result.diamond.deltas,
    max_delta_loss: result.diamond.max_delta_loss,
  };

  // Apply the reordering from diamond to me (matching JS behavior where
  // diamond_count mutates the input mixed elements)
  const reorderedMe = [
    result.diamond.mixed_elements.system1,
    result.diamond.mixed_elements.system2,
  ];

  // wordshift: already has { type, rank_diff, metric } via serde rename
  const wordshift = result.wordshift;

  // balance: direct mapping
  const balance = result.balance;

  return { me: reorderedMe, rtd, dat, wordshift, balance };
}

/**
 * Run the full allotax pipeline via WASM.
 *
 * @param {Array<{types: string, counts: number}>} sys1 - AcceptedData[]
 * @param {Array<{types: string, counts: number}>} sys2 - AcceptedData[]
 * @param {number} alpha
 * @returns {object|null} Adapted result or null if WASM unavailable
 */
export function computeAllotaxWasm(sys1, sys2, alpha) {
  if (!wasmInitialized || !wasmModule) return null;

  try {
    // AcceptedData[] is [{types: "John", counts: 8502}, ...] — flatten to parallel arrays
    const types1 = sys1.map(d => d.types);
    const counts1 = new Float64Array(sys1.map(d => d.counts));
    const types2 = sys2.map(d => d.types);
    const counts2 = new Float64Array(sys2.map(d => d.counts));

    const result = wasmModule.compute_allotax_wasm(types1, counts1, types2, counts2, alpha);

    return adaptResult(result);
  } catch (e) {
    console.warn('⚠️  WASM pipeline failed, falling back to JS:', e);
    return null;
  }
}

/**
 * Compute RTD only via WASM (for backward compat / alpha slider recomputation).
 * Returns null if WASM unavailable.
 */
export function computeRtdWasm(mixedElements, alpha) {
  if (!wasmInitialized || !wasmModule) return null;

  try {
    const result = wasmModule.rank_turbulence_divergence(
      mixedElements[0].ranks,
      mixedElements[1].ranks,
      mixedElements[0].counts,
      mixedElements[1].counts,
      alpha
    );

    // Handle Map or plain object return
    if (result instanceof Map) {
      return {
        divergence_elements: result.get('divergence_elements'),
        normalization: result.get('normalization')
      };
    }
    return result;
  } catch (e) {
    console.warn('⚠️  WASM RTD failed, falling back to JS:', e);
    return null;
  }
}

export function isWasmAvailable() {
  return wasmInitialized;
}
