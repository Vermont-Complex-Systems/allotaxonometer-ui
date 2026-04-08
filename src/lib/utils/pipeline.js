// Single-call data pipeline.
// Uses WASM `compute_allotax` (full Rust pipeline) when available;
// falls back to the per-stage JS pipeline otherwise.
//
// Input shape (both modes):
//   sys1, sys2: Array<{ types: string, counts: number, ... }>
//
// Output shape (both modes):
//   { rtd, dat, barData, balanceData, maxlog10 }

import * as d3 from 'd3';
import { sum } from 'd3-array';
import {
  combElems,
  balanceDat,
  wordShift_dat,
} from './combine_distributions.js';
import diamond_count from './diamond_count.js';
import { which } from './utils_helpers.js';

// --- WASM module cache ---------------------------------------------------

let wasmModule = null;
let wasmInitialized = false;

(async function initWasm() {
  try {
    const mod = await import('./wasm/allotaxonometer_wasm.js');
    await mod.default();
    if (typeof mod.compute_allotax === 'function') {
      wasmModule = mod;
      wasmInitialized = true;
    }
  } catch {
    wasmModule = null;
    wasmInitialized = false;
  }
})();

// --- JS RTD (private) ----------------------------------------------------
// Pure-JS rank turbulence divergence used by the JS fallback pipeline.
// This logic used to live in `rank_turbulence_divergence.js`; it now exists
// only as a private fallback for environments where WASM isn't available
// (e.g. Node-based SSR via `--target web`).

function divElems(inv_r1, inv_r2, alpha) {
  if (alpha === Infinity) {
    return inv_r1.map((_, i) => (inv_r1[i] === inv_r2[i] ? 0 : Math.max(inv_r1[i], inv_r2[i])));
  } else if (alpha === 0) {
    const x_max = inv_r1.map((_, i) => Math.max(1 / inv_r1[i], 1 / inv_r2[i]));
    const x_min = inv_r1.map((_, i) => Math.min(1 / inv_r1[i], 1 / inv_r2[i]));
    return inv_r1.map((_, i) => Math.log10(x_max[i] / x_min[i]));
  } else {
    return inv_r1.map(
      (_, i) =>
        ((alpha + 1) / alpha) *
        Math.abs(inv_r1[i] ** alpha - inv_r2[i] ** alpha) ** (1 / (alpha + 1))
    );
  }
}

function normDivElems(mixedelements, inv_r1, inv_r2, alpha) {
  const c1 = mixedelements[0]['counts'];
  const c2 = mixedelements[1]['counts'];

  const indices1 = which(c1.map((d) => d > 0));
  const indices2 = which(c2.map((d) => d > 0));

  const N1 = indices1.length;
  const N2 = indices2.length;

  const calcDisjoint = (a, b) => 1 / (b + a / 2);
  const inv_r1_disjoint = calcDisjoint(N1, N2);
  const inv_r2_disjoint = calcDisjoint(N2, N1);

  if (alpha === Infinity) {
    return sum(indices1.map((i) => inv_r1[i])) + sum(indices2.map((i) => inv_r2[i]));
  } else if (alpha === 0) {
    const term1 = sum(indices1.map((i) => Math.abs(Math.log(inv_r1[i] / inv_r2_disjoint))));
    const term2 = sum(indices2.map((i) => Math.abs(Math.log(inv_r2[i] / inv_r1_disjoint))));
    return term1 + term2;
  } else {
    const term1 =
      ((alpha + 1) / alpha) *
      sum(
        indices1
          .map((i) => inv_r1[i])
          .map((d) => (Math.abs(d ** alpha) - inv_r2_disjoint ** alpha) ** (1 / (alpha + 1)))
      );
    const term2 =
      ((alpha + 1) / alpha) *
      sum(
        indices2
          .map((i) => inv_r2[i])
          .map((d) => Math.abs(inv_r1_disjoint ** alpha - d ** alpha) ** (1 / (alpha + 1)))
      );
    return term1 + term2;
  }
}

// Pure-JS rank turbulence divergence.
// Exported publicly so consumers doing per-stage work (e.g. scrollytelling
// that reveals the pipeline one step at a time) can call it directly
// alongside `combElems`, `diamond_count`, `wordShift_dat`, `balanceDat`.
// For full-pipeline perf, prefer `Allotaxonograph`, which uses WASM when available.
export function rank_turbulence_divergence(mixedelements, alpha) {
  const inv_r1 = mixedelements[0]['ranks'].map((d) => Math.pow(d, -1));
  const inv_r2 = mixedelements[1]['ranks'].map((d) => Math.pow(d, -1));

  const divergence_elements = divElems(inv_r1, inv_r2, alpha);
  const normalization = normDivElems(mixedelements, inv_r1, inv_r2, alpha);

  return {
    divergence_elements: divergence_elements.map((d) => d / normalization),
    normalization,
  };
}

// --- JS pipeline (fallback) ---------------------------------------------

function runPipelineJS(sys1, sys2, alpha) {
  const me = combElems(sys1, sys2);
  const rtd = rank_turbulence_divergence(me, alpha);
  const dat = diamond_count(me, rtd);
  const barData = wordShift_dat(me, dat);
  const balanceData = balanceDat(sys1, sys2);

  const maxlog10 = Math.ceil(
    d3.max([Math.log10(d3.max(me[0].ranks)), Math.log10(d3.max(me[1].ranks))])
  );

  return { rtd, dat, barData, balanceData, maxlog10 };
}

// --- WASM pipeline -------------------------------------------------------

function runPipelineWasm(sys1, sys2, alpha) {
  const types1 = sys1.map((d) => d.types);
  const counts1 = Float64Array.from(sys1, (d) => d.counts);
  const types2 = sys2.map((d) => d.types);
  const counts2 = Float64Array.from(sys2, (d) => d.counts);

  // Canonical `AllotaxDisplayResult` shape from allotax-core — same schema
  // the Python binding returns. Intermediate fields (`divergence_elements`,
  // per-cell `deltas`) are omitted: only the JS fallback pipeline needs them,
  // and there `diamond_count` / `wordShift_dat` are what produce them.
  const result = wasmModule.compute_allotax(types1, counts1, types2, counts2, alpha);

  return {
    rtd: {
      normalization: result.normalization,
    },
    dat: {
      // Sparse cell list — `<Diamond>` consumes it natively and uses
      // `dat.ncells` to size its band scale.
      counts: result.diamond_counts,
      max_delta_loss: result.max_delta_loss,
      ncells: result.ncells,
    },
    barData: result.wordshift,
    balanceData: result.balance,
    maxlog10: Math.ceil(result.maxlog10),
  };
}

// --- Public entry --------------------------------------------------------

export function runPipeline(sys1, sys2, alpha) {
  if (wasmInitialized && wasmModule) {
    try {
      return runPipelineWasm(sys1, sys2, alpha);
    } catch (e) {
      console.warn('⚠️  WASM compute_allotax failed, using JS fallback:', e);
      return runPipelineJS(sys1, sys2, alpha);
    }
  }
  return runPipelineJS(sys1, sys2, alpha);
}

export function isWasmReady() {
  return wasmInitialized && wasmModule !== null;
}
