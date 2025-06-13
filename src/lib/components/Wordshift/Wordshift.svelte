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
        colors = ['lightgrey', 'lightblue'],
        barHeightFactor = 0.8
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
    
    // Helper function matching D3 logic exactly
    function parseLabelData(label) {
        const splitIndex = label.indexOf(' ');
        let name_y, numbers_y;
        if (splitIndex === -1) {
            name_y = label;
            numbers_y = "";
        } else {
            name_y = label.slice(0, splitIndex);
            numbers_y = label.slice(splitIndex + 1).trim();
            // Strip first and last characters from numbers_y if possible
            if (numbers_y.length > 2) {
                numbers_y = numbers_y.slice(1, numbers_y.length - 1);
            }
        }
        return { name_y, numbers_y };
    }

    let finalHeight = $derived(height || (computedHeight + marginTop + marginBottom));
</script>

<svg 
    {width} 
    height={finalHeight}
    viewBox="0 0 {width} {finalHeight}"
    style="overflow: visible; display: block;"
>
<g class='wordshift-container'>
    <!-- X-axis with grid lines -->
    <g class='wordshift-axis x' transform="translate(0, {marginTop})">
        {#each xTicks as tick}
            <g class="wordshift-tick">
                <line 
                    class="wordshift-grid-line"
                    x1={xScale(tick)} 
                    y1="0" 
                    x2={xScale(tick)}
                    y2={computedHeight - marginTop - marginBottom} 
                    stroke="currentColor"
                    stroke-opacity="0.1"
                />
                <text 
                    class="wordshift-tick-label"
                    x={xScale(tick)} 
                    y="-12" 
                    text-anchor="middle"
                    font-family="EB Garamond, serif"
                    font-size="14"
                    fill="#333"
                >{format(tick)}</text>
            </g>
        {/each}
        
        <!-- X-axis label - centered on zero line like D3 version -->
        <text 
            class="wordshift-axis-title"
            x={xScale(0)} 
            y="-35" 
            text-anchor="middle"
            font-family="EB Garamond, serif"
            font-size="16"
            fill="#333"
        >{xLabel}</text>
    </g>
    
    <!-- Bars -->
    {#each I as i}
        <rect
            class="wordshift-bar"
            x={Math.min(xScale(0), xScale(X[i]))}
            y={yScale(Y[i]) + (yScale.bandwidth() - yScale.bandwidth() * barHeightFactor) / 2}
            fill={colors[X[i] > 0 ? colors.length - 1 : 0]}
            width={Math.abs(xScale(X[i]) - xScale(0))}
            height={yScale.bandwidth() * barHeightFactor}
        />
    {/each}
    
    <!-- Y-axis labels with names and numbers -->
    <g class="wordshift-y-axis" transform="translate({xScale(0)}, 0)">
        {#each yScale.domain() as label}
            {@const labelData = parseLabelData(label)}
            {@const xValue = YX.get(label)}
            <g class="wordshift-label-group" transform="translate(0, {yScale(label) + yScale.bandwidth() / 2})">
                <!-- Name text on the normal side (matching D3 positioning) -->
                <text 
                    class="wordshift-name-label"
                    x={xValue > 0 ? 6 : -6}
                    dy="0.32em"
                    text-anchor={xValue > 0 ? "start" : "end"}
                    font-family="EB Garamond, serif"
                    font-size="14"
                    fill="#333"
                >{labelData.name_y}</text>
                
                <!-- Numbers text on the opposite side (matching D3 positioning) -->
                {#if labelData.numbers_y}
                    <text 
                        class="wordshift-numbers-label"
                        x={xValue > 0 ? -6 : 6}
                        dy="0.32em"
                        text-anchor={xValue > 0 ? "end" : "start"}
                        font-family="EB Garamond, serif"
                        font-size="14"
                        fill="#666"
                        opacity="0.7"
                    >{labelData.numbers_y}</text>
                {/if}
            </g>
        {/each}
    </g>
</g>
</svg>