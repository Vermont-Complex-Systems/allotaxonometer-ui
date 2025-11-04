<script lang="ts">
  import Diamond from '../Diamond/Diamond.svelte';
  import Wordshift from '../Wordshift/Wordshift.svelte';
  import DivergingBarChart from '../DivergingBarChart/DivergingBarChart.svelte';
  import Legend from '../Legend/Legend.svelte';

  import { alloColors, alloFonts } from '../../utils/aesthetics.js';

  interface DashboardProps {
    // Updated data props (new API)
    dat?: any;                    // Main data object containing counts, deltas, etc.
    alpha?: number;
    divnorm?: number;             // Replaces rtd
    barData?: any[];
    balanceData?: any[];          // Pre-calculated balance data

    // Configuration props
    title?: string[];
    maxlog10?: number;
    height?: number;
    width?: number;
    DashboardHeight?: number;
    DashboardWidth?: number;
    DiamondHeight?: number;
    DiamondWidth?: number;
    WordshiftWidth?: number;
    marginInner?: number;         // Replaces margin.inner
    marginDiamond?: number;       // Replaces margin.diamond
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
    dat = null,
    alpha = 0.58,
    divnorm = 1,
    barData = [],
    balanceData = [],
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

  let max_shift = $derived(
    barData.length > 0
      ? Math.max(...barData.map(d => Math.abs(d.metric)))
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
              {dat} {alpha} {divnorm} {title} {maxlog10}
              {DiamondHeight} {marginInner} {marginDiamond}
              {labelThreshold}
            />
      </div>

      <!-- FLEX Legend and balance plot -->
      <div style="display: flex; gap: 13em; justify-content: center;">
        <div id="legend" style="margin-left: -50px;">
              <Legend
                diamond_dat={dat.counts}
                DiamondHeight={DiamondHeight}
                max_count_log={max_count_log || 5}
              />
        </div>
        <div id="balance">
              <DivergingBarChart
                data={balanceData}
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
              barData={barData}
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