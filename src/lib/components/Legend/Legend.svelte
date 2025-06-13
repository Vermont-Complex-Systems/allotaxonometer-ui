<script>
    import { scaleOrdinal, range, interpolateInferno, scaleBand, max, rgb, scaleLog } from "d3";
    
    let { 
        diamond_dat, 
        DiamondHeight,
        max_count_log,
        tickSize = 0,
        marginLeft = 10,
        marginTop = 65,
        marginRight = 40
    } = $props();

    const N_CATEGO = 20;
    const myramp = range(N_CATEGO).map(i => rgb(interpolateInferno(i / (N_CATEGO - 1))).hex());
    const color = scaleOrdinal(range(N_CATEGO), myramp);

    let height = 370;
    const margin = { right: marginRight, top: marginTop, left: marginLeft };
    
    let innerHeight = $derived(height - margin.top - margin.right);   
    let max_rank = $derived(max(diamond_dat, (d) => d.rank_L[1]));

    let y = $derived(scaleBand().domain(color.domain().reverse()).rangeRound([0, innerHeight]));
    
    // Use max_count_log if provided, otherwise calculate from data
    let logDomain = $derived(max_count_log || 10**Math.ceil(Math.log10(max_rank)-1));
    let logY = $derived(scaleLog().domain([1, logDomain]).rangeRound([0, innerHeight]).nice());

    let logFormat10 = $derived(logY.tickFormat());
    let yTicks = $derived(logY.ticks());
</script>

<g class="legend-container" transform="translate({margin.left}, {DiamondHeight-margin.top})">
    <!-- Color swatches -->
    {#each color.domain() as d}
        <rect
            class="legend-swatch"
            x="0"
            y={y(d)}
            width="14"
            height="13"
            fill={color(d)}
            stroke="whitesmoke"
            stroke-width="1"
        />
    {/each}
    
    <!-- Scale ticks and labels -->
    {#each yTicks as tick, i}
        <g class="legend-tick" transform="translate({margin.left}, {logY(tick)-margin.top})">
            <text
                class="legend-tick-label"
                dy={yTicks.length-1 == i ? "-3" : "13"}
                dx="20"
            >{logFormat10(tick)}</text>
        </g>
        
        {#if i === yTicks.length-1}
            <g class="legend-title-container" transform="translate({margin.left}, {logY(tick)-margin.top})">
                <text class="legend-title" dy="9">Counts per cell</text>
            </g>
        {/if}
    {/each}
</g>

<style>
    .legend-container {
        font-family: var(--allo-font-family);
    }
    
    .legend-swatch {
        /* Color swatches - styling handled by fill attribute */
    }
    
    .legend-tick-label {
        font-family: var(--allo-font-family);
        font-size: 14px;
        fill: var(--allo-verydarkgrey);
        text-anchor: start;
    }
    
    .legend-title {
        font-family: var(--allo-font-family);
        font-size: 14px;
        fill: var(--allo-verydarkgrey);
        text-anchor: start;
        font-weight: normal;
    }
    
</style>