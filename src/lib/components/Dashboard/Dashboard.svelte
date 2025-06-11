<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import Diamond from '../Diamond/Diamond.svelte';
  import Wordshift from '../Wordshift/Wordshift.svelte';
  import DivergingBarChart from '../DivergingBarChart/DivergingBarChart.svelte';
  import Legend from '../Legend/Legend.svelte';

  interface DashboardProps {
    // Data props
    diamond_count?: any[];
    diamond_dat?: any[];
    barData?: any[];
    test_elem_1?: any;
    test_elem_2?: any;
    
    // Configuration props
    height?: number;
    width?: number;
    DiamondHeight?: number;
    DiamondWidth?: number;
    DiamondInnerHeight?: number;
    margin?: { inner: number; diamond: number };
    trueDiamondHeight?: number;
    alpha?: number;
    maxlog10?: number;
    rtd?: any;
    title?: string[];
    
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
    diamond_count = [],
    diamond_dat = [],
    barData = [],
    test_elem_1 = null,
    test_elem_2 = null,
    height = 815,
    width = 1200,
    DiamondHeight = 600,
    DiamondWidth = 600,
    DiamondInnerHeight = 440,
    margin = { inner: 160, diamond: 40 },
    trueDiamondHeight = 400,
    alpha = 0.58,
    maxlog10 = 0,
    rtd = null,
    title = ['System 1', 'System 2'],
    class: className = '',
    style = '',
    showDiamond = true,
    showWordshift = true,
    showDivergingBar = true,
    showLegend = true,
    ...restProps
  }: DashboardProps = $props();
</script>

<div class="allotaxonometer-dashboard {className}" {style} {...restProps}>
  <svg id="allotaxonometer-svg" {height} {width}>
    {#if showDiamond}
      <Diamond 
        {diamond_count} 
        {diamond_dat} 
        {DiamondInnerHeight} 
        {margin} 
        {trueDiamondHeight} 
        {alpha} 
        {maxlog10} 
        {rtd} 
        {title}
      />
    {/if}
    
    {#if showWordshift}
      <Wordshift 
        {barData} 
        DashboardHeight={height} 
        DashboardWidth={width}
      />
    {/if}
    
    {#if showDivergingBar}
      <DivergingBarChart 
        {test_elem_1} 
        {test_elem_2} 
        {DiamondHeight} 
        {DiamondWidth} 
      />
    {/if}
    
    {#if showLegend}
      <Legend 
        {diamond_dat} 
        {DiamondHeight}
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