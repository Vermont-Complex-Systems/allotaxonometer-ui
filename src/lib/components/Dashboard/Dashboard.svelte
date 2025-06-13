<script lang="ts">
  import Diamond from '../Diamond/Diamond.svelte';
  import Wordshift from '../Wordshift/Wordshift.svelte';
  import DivergingBarChart from '../DivergingBarChart/DivergingBarChart.svelte';
  import Legend from '../Legend/Legend.svelte';

  import { dashboardStyles } from '../../styles/styleHelpers.js';

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
  <div style="display:flex; flex-wrap: wrap; align-items:center; justify-content: center; row-gap: 50px;">
    <div style="margin-top:20px">
      <!-- Titles with instrument text positioned relative to left title -->
      <div style="display:flex; gap: 10em; justify-content: center; margin-bottom: -70px; margin-right: 70px; position: relative;">
          <div style="position: relative;">
            <div style={dashboardStyles.title()}>{title[0]}</div>
            <!-- Instrument text positioned at far left edge -->
            <div style="position: absolute; top: 100%; left: -12em; margin-top: 2.5em; {dashboardStyles.instrumentText()}">{instrumentText}</div>
            <div style="position: absolute; top: 100%; left: -12em; margin-top: 3.5em; {dashboardStyles.alphaText()}">α = {alpha}</div>
          </div>
          <div style={dashboardStyles.title()}>{title[1]}</div>
      </div>
      
      <div id="diamondplot">
            <Diamond 
              {dat} {alpha} {divnorm} {title} {maxlog10} 
              {DiamondHeight} {marginInner} {marginDiamond}
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
              width={640}
              marginLeft={140}
            />
      </div>
    </div>
  </div>
</div>