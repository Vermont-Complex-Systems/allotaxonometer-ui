<script lang="ts">
  import Diamond from '../Diamond/Diamond.svelte';
  import Wordshift from '../Wordshift/Wordshift.svelte';
  import DivergingBarChart from '../DivergingBarChart/DivergingBarChart.svelte';
  import Legend from '../Legend/Legend.svelte';

  import { alloColors, alloFonts } from '../../utils/aesthetics.js';

  interface DashboardProps {
    // -------- Canonical data shape (matches the Rust/Python output of
    //          `compute_allotax`). Prefer these for new code; they let you
    //          spread the result of `allotax.compute_allotax(...)` directly:
    //              <Dashboard {...result_data} alpha={alpha} />
    diamond_counts?: any[];       // Sparse cells from Rust core
    ncells?: number;              // Total cells per row of the diamond grid
    wordshift?: any[];            // Wordshift entries
    balance?: any[];              // Balance entries
    normalization?: number;       // RTD normalization factor (= D_alpha denom)
    max_delta_loss?: number;      // Carried for completeness; unused by render
    delta_sum?: number;           // Carried for completeness; unused by render

    // -------- Legacy / nested shape (still accepted for backward compat).
    //          `Allotaxonograph` exposes these names, and per-stage scrolly
    //          callers may already build them by hand. Canonical names take
    //          precedence when both are passed.
    dat?: any;                    // { counts, deltas, max_delta_loss, ncells }
    barData?: any[];              // alias of `wordshift`
    balanceData?: any[];          // alias of `balance`
    divnorm?: number;             // alias of `normalization`

    // -------- Shared props (no rename across shapes)
    alpha?: number;
    title?: string[];
    maxlog10?: number;
    height?: number;
    width?: number;
    DashboardHeight?: number;
    DashboardWidth?: number;
    DiamondHeight?: number;
    DiamondWidth?: number;
    WordshiftWidth?: number;
    marginInner?: number;
    marginDiamond?: number;
    max_count_log?: number;       // For legend
    xDomain?: [number, number]; // Optional x-axis domain for Wordshift
    labelThreshold?: number;      // Maximum number of types per cell to show labels in Diamond

    // Style props
    class?: string;
    style?: string;

    // Component visibility
    showDiamond?: boolean;
    showWordshift?: boolean;
    showDivergingBar?: boolean;
    showLegend?: boolean;

    // Instrument text
    instrumentText?: string;
  }

  let {
    // Canonical
    diamond_counts = undefined,
    ncells = undefined,
    wordshift = undefined,
    balance = undefined,
    normalization = undefined,
    // Legacy aliases
    dat = undefined,
    barData = undefined,
    balanceData = undefined,
    divnorm = undefined,
    // Shared
    alpha = 0.58,
    xDomain = undefined,
    instrumentText = 'Instrument: Rank-Turbulence Divergence',
    title = ['System 1', 'System 2'],
    maxlog10 = 0,
    height = 815,
    width = 1200,
    DashboardHeight = 815,
    DashboardWidth = 1200,
    DiamondHeight = 600,
    DiamondWidth = 600,
    WordshiftWidth = 640,
    marginInner = 160,
    marginDiamond = 40,
    max_count_log = undefined,
    labelThreshold = Infinity,
  }: DashboardProps = $props();

  // -------- Normalize: canonical first, fall back to legacy. ----------
  // Children consume the legacy `dat`/`barData`/`balanceData`/`divnorm` shape
  // so we synthesize a `dat` object when the caller only passed canonical
  // (flat) props. The reverse fallback keeps existing call sites working.
  let effective_diamond_counts = $derived(
    diamond_counts ?? dat?.counts ?? []
  );
  let effective_ncells = $derived(ncells ?? dat?.ncells);
  let effective_wordshift = $derived(wordshift ?? barData ?? []);
  let effective_balance = $derived(balance ?? balanceData ?? []);
  let effective_normalization = $derived(normalization ?? divnorm ?? 1);

  // Synthetic `dat` for <Diamond>/<Legend>. When the caller already passed a
  // legacy `dat`, prefer it (preserves any extra fields like `deltas`).
  let datForChildren = $derived(
    dat ?? {
      counts: effective_diamond_counts,
      ncells: effective_ncells,
    }
  );

  let max_shift = $derived(
    effective_wordshift.length > 0
      ? Math.max(...effective_wordshift.map(d => Math.abs(d.metric)))
      : 1
  );

  let wordshiftXDomain = $derived(xDomain || [-max_shift * 1.5, max_shift * 1.5]);
</script>

<div id="allotaxonometer-dashboard" style="position: relative; margin: 0; padding: 0;">
  <div style="display:flex; flex-wrap: wrap; align-items:center; justify-content: center; row-gap: 50px;">
    <div id="diamond-group" style="margin-top:20px; margin-right: -50px;">
      <!-- Titles with instrument text positioned relative to left title -->
      <div style="display:flex; gap: 10em; justify-content: center; margin-bottom: -50px; margin-right: 55px; position: relative;">
          <div style="position: relative;">
            <div style="font-family: {alloFonts.family}; font-size: 16px; color: {alloColors.css.superdarkgrey};">{title[0]}</div>
            <!-- Instrument text positioned at far left edge -->
            <div style="position: absolute; top: 100%; left: -8em; margin-top: 3em; font-family: {alloFonts.family}; font-size: 14px; color: {alloColors.css.darkgrey}; width: 150px; line-height: 1;">
            <div style="margin-bottom: 0.5em;">{instrumentText}</div>
            <div>α = {alpha}</div>
          </div>
          </div>
          <div style="font-family: {alloFonts.family}; font-size: 16px; color: {alloColors.css.superdarkgrey};">{title[1]}</div>
      </div>

      <div id="diamondplot">
            <Diamond
              dat={datForChildren}
              {alpha} {title} {maxlog10}
              divnorm={effective_normalization}
              {DiamondHeight} {marginInner} {marginDiamond}
              {labelThreshold}
            />
      </div>

      <!-- FLEX Legend and balance plot -->
      <div style="display: flex; gap: 13em; justify-content: center;">
        <div id="legend" style="margin-left: -50px;">
              <Legend
                diamond_dat={effective_diamond_counts}
                DiamondHeight={DiamondHeight}
                max_count_log={max_count_log || 5}
              />
        </div>
        <div id="balance">
              <DivergingBarChart
                data={effective_balance}
                DiamondHeight={DiamondHeight}
                DiamondWidth={DiamondWidth}
              />
        </div>
      </div>
    </div>

    <!-- Wordshift -->
    <div style="margin-top:60px; overflow: visible;">
      <div id="wordshift" style="overflow: visible;">
            <Wordshift
              barData={effective_wordshift}
              DashboardHeight={DashboardHeight}
              DashboardWidth={DashboardWidth}
              xDomain={wordshiftXDomain}
              width={WordshiftWidth}
              marginLeft={110}
            />
      </div>
    </div>
  </div>
</div>