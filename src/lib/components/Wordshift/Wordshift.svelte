<script>
    import * as d3 from "d3";
    import { wordshiftStyles } from '../../styles/styleHelpers.js';

    let { 
        barData, 
        x = d => d.metric,
        y = d => d.type,
        xDomain,
        marginTop = 50,
        marginRight = 60,
        marginBottom = 40,
        marginLeft = 70,
        width = 360,
        height,
        xFormat = '%',
        xLabel = '← System 1 · Divergence contribution · System 2 →',
        yPadding = 0,
        colors = ['lightgrey', 'lightblue'],
        barHeightFactor = 0.7
    } = $props();
    
    // Compute values (matching D3 version exactly)
    let X = $derived(d3.map(barData, x));
    let Y = $derived(d3.map(barData, y));
    
    // Compute domains
    let computedXDomain = $derived(xDomain || d3.extent(X));
    let yDomain = $derived(new d3.InternSet(Y));
    
    // Match D3 dimensions exactly
    const xAxisYOffset = 10; // Space below x-axis (from original)
    const bandHeight = 18;   // Fixed band height (from original)
    const shiftSvgBy = 12;   // shift svg up to align with system titles
    const barYOffset = 10;   // NEW: Additional offset just for bars
    
    let compactHeight = $derived(yDomain.size * bandHeight);
    let innerWidth = $derived(width - marginLeft - marginRight);
    let innerHeight = $derived(compactHeight + xAxisYOffset);
    let computedHeight = $derived(innerHeight + marginTop + marginBottom);
    
    // Compute ranges exactly like D3
    let xRange = $derived([0, innerWidth]);
    let yRange = $derived([xAxisYOffset + barYOffset, xAxisYOffset + barYOffset + compactHeight]);
    
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

    let finalHeight = $derived(height || computedHeight);
</script>

<svg 
    {width} 
    height={finalHeight}
    viewBox="0 0 {width} {finalHeight}"
    style="overflow: visible; display: block;"
>
    <!-- Main wrapper transform matching D3 exactly -->
    <g class='wordshift-container' transform="translate({marginLeft}, {marginTop - shiftSvgBy})">
        <!-- X-axis with grid lines -->
        <!-- X-axis with ticks and grid lines -->
        <g class='wordshift-axis x' transform="translate(0, {xAxisYOffset})">
            {#each xTicks as tick}
                <!-- Original tick marks (short) -->
                <line 
                    x1={xScale(tick)} 
                    y1="0" 
                    x2={xScale(tick)}
                    y2="6"
                    style="stroke: currentColor; stroke-width: 1;"
                />
                <!-- Extended grid lines (cloned effect) -->
                <line 
                    class="wordshift-grid-line"
                    x1={xScale(tick)} 
                    y1="0" 
                    x2={xScale(tick)}
                    y2={innerHeight - xAxisYOffset + barYOffset} 
                    style={tick === 0 ? "stroke: rgb(38, 38, 38); stroke-width: 1; stroke-opacity: 0.8;" : wordshiftStyles.gridLine()}
                />
                <!-- Tick labels -->
                <text 
                    x={xScale(tick)} 
                    y="-12" 
                    text-anchor="middle"
                    style={wordshiftStyles.tickLabel()}
                >{format(tick)}</text>
            {/each}
            
            <!-- X-axis label -->
            <text 
                x={xScale(0)} 
                y="-35" 
                style={wordshiftStyles.axisTitle()}
            >{xLabel}</text>
        </g>
        
        <!-- Bars are now offset by the additional barYOffset -->
        {#each I as i}
            <rect
                class="wordshift-bar"
                x={Math.min(xScale(0), xScale(X[i]))}
                y={yScale(Y[i]) + (yScale.bandwidth() - yScale.bandwidth() * barHeightFactor) / 2}
                fill={colors[X[i] > 0 ? colors.length - 1 : 0]}
                width={Math.abs(xScale(X[i]) - xScale(0))}
                height={yScale.bandwidth() * barHeightFactor}
                style="mix-blend-mode: multiply;" 
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
                        x={xValue > 0 ? 6 : -6}
                        dy="0.32em"
                        text-anchor={xValue > 0 ? "start" : "end"}
                        style={wordshiftStyles.nameLabel()}
                    >{labelData.name_y}</text>
                    
                    <!-- Numbers text on the opposite side (matching D3 positioning) -->
                    {#if labelData.numbers_y}
                        <text 
                            x={xValue > 0 ? -6 : 6}
                            dy="0.32em"
                            text-anchor={xValue > 0 ? "end" : "start"}
                            style={wordshiftStyles.numbersLabel()}
                        >{labelData.numbers_y}</text>
                    {/if}
                </g>
            {/each}
        </g>
    </g>
</svg>