<script>
    import { scaleBand, rollup, range, InternSet, scaleLinear, extent, map } from "d3";
    
    let { 
        data,  // Now expects pre-calculated balance data
        DiamondHeight, 
        DiamondWidth,
        x = d => d.frequency,
        y = d => d.y_coord,
        marginTop = 0,
        marginRight = 40,
        marginBottom = 10,
        marginLeft = 40,
        width = 200,
        yPadding = 0.5,
        colors = ["lightgrey", "lightblue"]
    } = $props();
    
    // Compute values (matching D3 version exactly)
    let X = $derived(map(data, x));
    let Y = $derived(map(data, y));
    
    // Compute domains
    let xDomain = $derived(extent(X));
    let yDomain = $derived(new InternSet(Y));
    
    // Compute dimensions
    let xRange = $derived([marginLeft, width - marginRight]);
    let height = $derived(Math.ceil((yDomain.size + yPadding) * 25) + marginTop + marginBottom);
    let yRange = $derived([marginTop, height - marginBottom]);
    
    // Filter indices and create lookup
    let I = $derived(range(X.length).filter(i => yDomain.has(Y[i])));
    let YX = $derived(rollup(I, ([i]) => X[i], i => Y[i]));
    
    // Scales
    let xScale = $derived(scaleLinear(xDomain, xRange));
    let yScale = $derived(scaleBand().domain(yDomain).range(yRange).padding(yPadding));
    let format = $derived(xScale.tickFormat(100, "%"));
</script>

<g class="balance-chart" transform="translate({DiamondWidth-75}, {DiamondHeight+75})">
    
    <!-- Bars -->
    {#each I as i}
        <rect
            x={Math.min(xScale(0), xScale(X[i]))}
            y={yScale(Y[i])}
            fill={colors[X[i] > 0 ? colors.length - 1 : 0]}
            width={Math.abs(xScale(X[i]) - xScale(0))}
            height={yScale.bandwidth()}
        />
        
        <!-- Value labels -->
        <text
            x={xScale(X[i]) + Math.sign(X[i] - 0) * 4}
            y={yScale(Y[i]) + yScale.bandwidth() / 2}
            opacity="0.5"
            dy="0.35em"
            font-size="10"
            font-family="sans-serif"
            text-anchor={X[i] < 0 ? "end" : "start"}
        >{format(Math.abs(X[i]))}</text>
    {/each}
    
    <!-- Y-axis labels (matching D3 positioning) -->
    <g class="y-axis" transform="translate({xScale(0)},-12)">
        {#each yScale.domain() as label}
            <text
                x="0"
                y={yScale(label) + yScale.bandwidth() / 2}
                dy="0.35em"
                font-size="10"
                font-family="sans-serif"
                text-anchor="middle"
                opacity={YX.get(label) ? "0.5" : "1"}
            >{label}</text>
        {/each}
    </g>
</g>