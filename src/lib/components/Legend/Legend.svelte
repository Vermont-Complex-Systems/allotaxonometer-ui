<script>
    import { scaleOrdinal, range, interpolateInferno, scaleBand, rgb } from "d3";
    
    let { 
        diamond_dat, 
        max_count_log,
        tickSize = 0,
        width = 300,
        marginTop = 13,
        marginBottom = 16 + tickSize,
        marginLeft = 0,
        N_CATEGO = 20
    } = $props();

    let height = $derived(44 + tickSize + marginTop + marginBottom);
    
    const myramp = range(N_CATEGO).map(i => rgb(interpolateInferno(i / (N_CATEGO - 1))).hex());
    const color = scaleOrdinal(range(N_CATEGO), myramp);

    let x = $derived(scaleBand()
        .domain(color.domain())
        .rangeRound([marginLeft, width - 100]));

    let x2 = $derived(scaleBand()
        .domain(range(max_count_log).map(i => 10**i).sort((a, b) => b - a))
        .rangeRound([marginLeft - 40, width - 90]));
</script>

<svg 
    {width} 
    {height}
    viewBox="0 0 {width} {height}"
    style="overflow: visible; display: block;"
>
    <!-- Color rectangles -->
    {#each color.domain() as d}
        <rect
            x={x(d)}
            y={marginTop}
            width={Math.max(0, x.bandwidth())}
            height={x.bandwidth()}
            fill={color(d)}
            transform="rotate(-90) translate(-70,0)"
            stroke="black"
            stroke-width="0.65"
            style="shape-rendering: crispEdges;"
        />
    {/each}

    <!-- Text labels with the EXACT same attributes as D3 -->
    <g transform="rotate(-90) translate(-60,5)">
        {#each x2.domain() as tick}
            <text
                x={x2(tick)}
                y="0"
                dx="30"
                dy="-5"
                transform="rotate(90)"
                text-anchor="start"
                font-family="EB Garamond, serif"
                font-size="14px"
                fill="#333"
            >{tick}</text>
        {/each}
        
        <text
            x={marginLeft - 25}
            y={marginTop + marginBottom}
            text-anchor="start"
            font-size="14"
            font-family="EB Garamond, serif"
            fill="#333"
        >Counts per cell</text>
    </g>
</svg>