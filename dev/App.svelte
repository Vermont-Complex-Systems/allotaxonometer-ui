<script>
    import * as d3 from "d3";
    import { Dashboard } from 'allotaxonometer-ui';
    import { combElems, rank_turbulence_divergence, diamond_count, wordShift_dat, balanceDat } from 'allotaxonometer-ui';
    import boys1895 from '../tests/fixtures/boys-1895.json';
    import boys1968 from '../tests/fixtures/boys-1968.json';

    // Process the data directly
    let sys1 = boys1895;
    let sys2 = boys1968;
    let alpha = $state(0.58);
    let title = $derived(['Boys 1895', 'Boys 1968']);

    let DashboardHeight = 815;
    let DashboardWidth = 1200;
    let DiamondHeight = 600;
    let DiamondWidth = DiamondHeight;
    let marginInner = 160;
    let marginDiamond = 40;

    const alphas = d3.range(0,18).map(v => +(v/12).toFixed(2)).concat([1, 2, 5, Infinity])

  // Updated data processing with new API
  let me = $derived(sys1 && sys2 ? combElems(sys1, sys2) : null);
  let rtd = $derived(me ? rank_turbulence_divergence(me, alpha) : null);
  let dat = $derived(me && rtd ? diamond_count(me, rtd) : null);
  
  // Updated derived values
  let barData = $derived(me && dat ? wordShift_dat(me, dat).slice(0, 30) : []);
  let balanceData = $derived(sys1 && sys2 ? balanceDat(sys1, sys2) : []);
  let maxlog10 = $derived(me ? Math.ceil(d3.max([Math.log10(d3.max(me[0].ranks)), Math.log10(d3.max(me[1].ranks))])) : 0);
  let max_count_log = $derived(dat ? Math.ceil(Math.log10(d3.max(dat.counts, d => d.value))) + 1 : 2);
  let max_shift = $derived(barData.length > 0 ? d3.max(barData, d => Math.abs(d.metric)) : 1);
</script>

<h1>Hello allotaxonometer-ui!</h1>

<Dashboard 
        {dat}
        {alpha}
        divnorm={rtd?.normalization || 1}
        {barData}
        {balanceData}
        {title}
        {maxlog10}
        {max_count_log}
        height={DashboardHeight}
        width={DashboardWidth}
        {DiamondHeight}
        {DiamondWidth}
        {marginInner}
        {marginDiamond}
        xDomain={[-max_shift * 1.5, max_shift * 1.5]}
        class="dashboard"
      />