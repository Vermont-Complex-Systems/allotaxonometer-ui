<script lang="ts">
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



<div class="allotaxonometer-dashboard" style="position: relative; margin: 0; padding: 0;">
  <!-- Instrument and Alpha, absolutely positioned -->
  <div class="allo-fonts" style="position: absolute; top: 12%; left: 5.5%; font-size: 14px;">{instrumentText}</div>
  <div class="allo-fonts" style="position: absolute; top: 14.5%; left: 5.5%; font-size: 14px;">α = {alpha}</div>

  <!-- FLEX layout for diamond/legend/wordshift -->
  <div style="display:flex; flex-wrap: wrap; align-items:center; justify-content: center; row-gap: 50px;">
    <div style="margin-top:60px">
      <!-- Titles with exact same styling -->
      <div style="display:flex; gap: 10em; justify-content: center; font-size: 16px; margin-bottom: -70px; margin-right: 70px;">
          <div class="allo-fonts">{title[0]}</div>
          <div class="allo-fonts">{title[1]}</div>
      </div>
      
      <!-- Diamond plot - NO explicit width/height, just like original -->
      <div id="diamondplot" >
          <svg xmlns="http://www.w3.org/2000/svg"></svg>
            <Diamond 
              {dat} {alpha} {divnorm} {title} {maxlog10} 
              {DiamondHeight} {marginInner} {marginDiamond}
            />
      </div>
      
      <!-- FLEX Legend and balance plot -->
      <div style="display: flex; gap: 13em; justify-content: center;">
        <div id="legend" style="margin-left: -50px;">
            <svg xmlns="http://www.w3.org/2000/svg"></svg>
              <Legend 
                diamond_dat={dat.counts}
                DiamondHeight={DiamondHeight}
                max_count_log={max_count_log || 5}
              />
        </div>
        <div id="balance">
          <svg xmlns="http://www.w3.org/2000/svg"></svg>
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
         <svg xmlns="http://www.w3.org/2000/svg"></svg>
            <Wordshift 
              barData={barData} 
              DashboardHeight={DashboardHeight}
              DashboardWidth={DashboardWidth}
              xDomain={wordshiftXDomain}
              width={640}
              marginLeft={140}
            />
      </div>
    </div>
  </div>
</div>

<style>
  .allo-fonts {
    font-family: "EB Garamond", "Garamond", "Century Schoolbook L",
                 "URW Bookman L", "Bookman Old Style", "Times", serif;
  }
</style>