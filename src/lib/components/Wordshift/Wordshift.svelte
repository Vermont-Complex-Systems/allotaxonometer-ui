<script>
    import * as d3 from "d3";
    
    let { 
        barData, 
        DashboardHeight, 
        DashboardWidth,
        x = d => d.metric,
        y = d => d.type,
        xDomain,
        marginTop = 30,
        marginRight = 40,
        marginBottom = 10,
        marginLeft = 40,
        width = 300,
        height = 680,
        xFormat = '%',
        xLabel = '← System 1 · Divergence contribution · System 2 →',
        yPadding = 0.2,
        colors = ['lightgrey', 'lightblue']
    } = $props();
    
    // Compute values (matching D3 version)
    let X = $derived(d3.map(barData, x));
    let Y = $derived(d3.map(barData, y));
    
    // Compute domains
    let computedXDomain = $derived(xDomain || d3.extent(X));
    let yDomain = $derived(new d3.InternSet(Y));
    
    // Compute dimensions
    let xRange = $derived([marginLeft, width - marginRight]);
    let computedHeight = $derived(Math.ceil((yDomain.size + yPadding) * 25) + marginTop + marginBottom);
    let yRange = $derived([marginTop, computedHeight - marginBottom]);
    
    // Filter indices and create lookup
    let I = $derived(d3.range(X.length).filter(i => yDomain.has(Y[i])));
    let YX = $derived(d3.rollup(I, ([i]) => X[i], i => Y[i]));
    
    // Scales
    let xScale = $derived(d3.scaleLinear(computedXDomain, xRange));
    let yScale = $derived(d3.scaleBand().domain(yDomain).range(yRange).padding(yPadding));
    let format = $derived(xScale.tickFormat(100, xFormat));
    let xTicks = $derived(xScale.ticks(width / 80));
    
    // Position the chart (matching your current positioning)
    let chartX = $derived(DashboardWidth - width + marginLeft);
    let chartY = $derived(marginTop);
</script>

<g class='wordshift-container' transform="translate({chartX}, {chartY})">
    <!-- X-axis with grid lines -->
    <g class='axis x' transform="translate(0, {marginTop})">
        {#each xTicks as tick}
            <g class="tick">
                <line 
                    x1={xScale(tick)} 
                    y1="0" 
                    x2={xScale(tick)}
                    y2={computedHeight - marginTop - marginBottom} 
                    stroke="currentColor"
                    stroke-opacity="0.1"
                />
                <text 
                    x={xScale(tick)} 
                    y="-12" 
                    font-size="0.8em"
                    text-anchor="middle"
                >{format(tick)}</text>
            </g>
        {/each}
        
        <!-- X-axis label -->
        <text 
            x={xScale(0)} 
            y="-22" 
            fill="currentColor" 
            text-anchor="center"
            font-size="0.9em"
        >{xLabel}</text>
    </g>
    
    <!-- Bars -->
    {#each I as i}
        <rect
            x={Math.min(xScale(0), xScale(X[i]))}
            y={yScale(Y[i])}
            fill={colors[X[i] > 0 ? colors.length - 1 : 0]}
            width={Math.abs(xScale(X[i]) - xScale(0))}
            height={yScale.bandwidth()}
        />
    {/each}
    
    <!-- Y-axis labels (positioned like D3 version) -->
    <g class="y-axis" transform="translate({xScale(0)}, 0)">
        {#each yScale.domain() as label}
            <text 
                x={YX.get(label) > 0 ? 6 : -6}
                y={yScale(label) + yScale.bandwidth() / 2}
                dy="0.35em"
                font-size="0.7em"
                text-anchor={YX.get(label) > 0 ? "start" : "end"}
            >{label}</text>
        {/each}
    </g>
</g>

<style>
    .wordshift-container {
        font-family: sans-serif;
    }
</style>