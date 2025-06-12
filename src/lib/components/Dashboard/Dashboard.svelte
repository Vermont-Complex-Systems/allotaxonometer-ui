<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import Diamond from '../Diamond/Diamond.svelte';
  import Wordshift from '../Wordshift/Wordshift.svelte';
  import DivergingBarChart from '../DivergingBarChart/DivergingBarChart.svelte';
  import Legend from '../Legend/Legend.svelte';

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
    marginInner?: number;         // Replaces margin.inner
    marginDiamond?: number;       // Replaces margin.diamond
    max_count_log?: number;       // For legend
    xDomain?: [number, number]; // Optional x-axis domain for Wordshift
    
    // Style props
    class?: string;
    style?: string;
    
    // Component visibility
    showDiamond?: boolean;
    showWordshift?: boolean;
    showDivergingBar?: boolean;
    showLegend?: boolean;
  }

  let {
    dat = null,
    alpha = 0.58,
    divnorm = 1,
    barData = [],
    balanceData = [],
    xDomain = undefined,  // Add this prop
    title = ['System 1', 'System 2'],
    maxlog10 = 0,
    height = 815,
    width = 1200,
    DashboardHeight = 815,    // Add these
    DashboardWidth = 1200,     // Add these
    DiamondHeight = 600,
    DiamondWidth = 600,
    marginInner = 160,
    marginDiamond = 40,
    max_count_log = undefined,
    class: className = '',
    style = '',
    showDiamond = true,
    showWordshift = true,
    showDivergingBar = true,
    showLegend = true,
    ...restProps
  }: DashboardProps = $props();
  
  let max_shift = $derived(
    barData.length > 0 
      ? Math.max(...barData.map(d => Math.abs(d.metric))) 
      : 1
  );

  let wordshiftXDomain = $derived(xDomain || [-max_shift * 1.5, max_shift * 1.5]);
</script>

<div class="allotaxonometer-dashboard {className}" {style} {...restProps}>
  <svg id="allotaxonometer-svg" {height} {width}>
    {#if showDiamond && dat}
      <Diamond 
        {dat}
        {alpha}
        {divnorm}
        {title}
        {maxlog10}
        {DiamondHeight}
        {marginInner}
        {marginDiamond}
      />
    {/if}
    
    {#if showWordshift && barData.length > 0}
      <Wordshift 
        {barData} 
        {DashboardHeight}
        {DashboardWidth}
        xDomain={wordshiftXDomain}
        width={640}
        marginLeft={140}
      />
    {/if}
    
    {#if showDivergingBar && balanceData.length > 0}
      <DivergingBarChart 
        data={balanceData}
        {DiamondHeight} 
        {DiamondWidth} 
      />
    {/if}
    
    {#if showLegend && dat}
      <Legend 
        diamond_dat={dat.counts}
        {DiamondHeight}
        {max_count_log}
      />
    {/if}
  </svg>
</div>

<style>
  .allotaxonometer-dashboard {
    /* Minimal base styles - users can override */
    display: block;
    width: 100%;
  }
  
  svg {
    display: block;
    width: 100%;
    height: auto;
  }
</style>