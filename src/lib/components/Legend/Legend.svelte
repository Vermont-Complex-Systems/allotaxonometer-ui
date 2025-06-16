<script>
    import { scaleOrdinal, range, interpolateInferno, scaleBand, rgb } from "d3";
    import { alloColors, alloFonts } from '../../utils/aesthetics.js';

    let {
        diamond_dat,
        max_count_log,
        tickSize = 0,
        height =  44 + tickSize,
        width = 300,
        marginTop = 13,
        marginBottom = 16 + tickSize,
        marginLeft = 0,
        N_CATEGO = 20
    } = $props();

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
            style="stroke: black; stroke-width: 0.65; shape-rendering: crispEdges;"
        />
    {/each}

    <!-- Match the exact D3 structure -->
    <g transform="rotate(-90) translate(-60,5)">
        {#each x2.domain() as tick}
            <g class="tick" transform="translate({x2(tick)}, 0)">
                <text
                    dx="30"
                    dy="-30"
                    transform="rotate(90)"
                    style="font-family: {alloFonts.family}; font-size: 14px; fill: {alloColors.css.verydarkgrey}; text-anchor: start;"
                >{tick}</text>
            </g>
        {/each}

        <!-- Title gets SAME positioning as ticks -->
        <text
            class="title"
            x={marginLeft - 25}
            y={marginTop + marginBottom}
            dx="30"
            dy="-5"
            transform="rotate(90)"
            style="font-family: {alloFonts.family}; font-size: 14px; fill: {alloColors.css.verydarkgrey}; text-anchor: start;"
        >Counts per cell</text>
    </g>
</svg>