<script>
    import * as d3 from "d3";
    import AxisX from './AxisX.svelte';
    import AxisY from './AxisY.svelte';
    import Grid from './Grid.svelte';
    import Contours from './Contours.svelte';
    import { alloColors, alloFonts } from '../../utils/aesthetics.js';

    let {
        dat,
        alpha,
        divnorm,
        title,
        maxlog10,
        DiamondHeight = 600,
        marginInner = 160,
        marginDiamond = 40,
        highlightedTerm = null,
        highlightedSystem = null  // 'left' or 'right'
    } = $props();

    // Extract data from dat object
    let diamond_dat = $derived(dat.counts);
    let deltas = $derived(dat.deltas);

    // Calculate derived dimensions (matching D3 version exactly)
    let innerHeight = $derived(DiamondHeight - marginInner);
    let diamondHeight = $derived(innerHeight - marginDiamond);

    // Move rin function here before it's used
    function rin(arr1, arr2) {
        return Array.from(arr1, (x) => arr2.indexOf(x) !== -1);
    }

    // Move filter_labs function here and make it work without relevant_types parameter
    function filter_labs(d, relevant_types_array) {
        if (!relevant_types_array || relevant_types_array.length === 0) return false;
        return rin(relevant_types_array, d.types.split(",")).some((x) => x === true);
    }

    function get_relevant_types(diamond_dat) {
        const ncells = d3.max(diamond_dat, d => d.x1);
        const cumbin = d3.range(0, ncells, 1.5);
        const relevant_types = [];

        // Count how often each type appears across all cells (for selectivity)
        const type_frequency = new Map();
        diamond_dat.filter(d => d.value > 0).forEach(d => {
            d.types.split(",").forEach(type => {
                const clean_type = type.trim();
                type_frequency.set(clean_type, (type_frequency.get(clean_type) || 0) + 1);
            });
        });

        for (let sys of ["right", "left"]) {
            let sys_count = 0;
            for (let i = 1; i < cumbin.length; i++) {
                const filtered_dat = diamond_dat.filter(d => d.value > 0 && d.which_sys == sys)
                                    .filter(d => d.coord_on_diag >= cumbin[i-1] &&
                                        d.coord_on_diag < cumbin[i]);

                if (filtered_dat.length > 0) {
                    const cos_dists = filtered_dat.map(d => d.cos_dist);
                    const max_dist = cos_dists.reduce((a, b) => Math.max(a, b));
                    const max_dist_idx = cos_dists.indexOf(max_dist);

                    const types = filtered_dat[max_dist_idx]['types'].split(",").map(t => t.trim());
                    
                    // Instead of random selection, pick the LEAST common type
                    // This will give us more distinctive labels
                    let selected_type = types[0]; // fallback
                    let min_frequency = Infinity;
                    
                    for (const type of types) {
                        const freq = type_frequency.get(type) || 0;
                        if (freq < min_frequency && freq > 0) {
                            min_frequency = freq;
                            selected_type = type;
                        }
                    }
                    
                    relevant_types.push(selected_type);
                    sys_count++;
                }
            }
        }
        
        return relevant_types;
    }

    // Now derive relevant_types from diamond_dat
    let relevant_types = $derived(get_relevant_types(diamond_dat));
    
    // Calculate filtered cells count AFTER relevant_types is defined
    let filtered_cells_count = $derived(
        relevant_types ? diamond_dat.filter(d => filter_labs(d, relevant_types)).length : 0
    );
    
    // Wrangling data
    let ncells = $derived(d3.max(diamond_dat, d => d.x1));
    let max_rank = $derived(d3.max(diamond_dat, (d) => d.rank_L[1]));
    let rounded_max_rank = $derived(10**Math.ceil(Math.log10(max_rank)));
    let xyDomain = $derived([1, rounded_max_rank]);
    
    // Scales (matching D3 version dimensions)
    let xy = $derived(d3.scaleBand().domain(diamond_dat.map(d => d.y1)).range([0, diamondHeight]));
    let logScale = $derived(d3.scaleLog().domain(xyDomain).range([0, innerHeight]).nice());
    let linScale = $derived(d3.scaleLinear().domain([0, ncells-1]).range([0, innerHeight]));
    let wxy = $derived(d3.scaleBand().domain(d3.range(ncells)).range([0, innerHeight]));
    
    let color_scale = d3.scaleSequentialLog().domain([rounded_max_rank, 1]).interpolator(d3.interpolateInferno);
    
    // Background triangles
    let blue_triangle = $derived([[innerHeight, innerHeight], [0, 0], [0, innerHeight]].join(" "));
    let grey_triangle = $derived([[innerHeight, innerHeight], [0, 0], [innerHeight, 0]].join(" "));
    
    // TOOLTIP
    let tooltipVisible = $state(false);
    let tooltipContent = $state('');
    let tooltipX = $state(0);
    let tooltipY = $state(0);
    
    function showTooltip(event, d) {
        if (d.value === 0) return;
        
        const tokens = d.types.split(",");
        const displayTokens = tokens.length < 50 ?
        tokens.slice(0, 8).join(", ") :
        tokens.slice(0, 8).join(", ") + " ...";
        
        tooltipContent = `
        <div style="color: rgb(89, 89, 89); font-size: 11px;">Types: ${displayTokens}</div>
        `;
        
        tooltipX = event.clientX + 15;
        tooltipY = event.clientY - 10;
        tooltipVisible = true;
    }
    
    function updateTooltipPosition(event) {
        if (tooltipVisible) {
            tooltipX = event.clientX + 15;
            tooltipY = event.clientY - 10;
        }
    }
    
    function hideTooltip() {
        tooltipVisible = false;
    }
</script>



<div style="position: relative;">
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={DiamondHeight}
        height={DiamondHeight}
        viewBox="0 0 {DiamondHeight} {DiamondHeight}"
        style="overflow: visible; display: block;"
    >
        <!-- <g transform="scale(-1,1) rotate(45) translate({innerHeight/4}, {innerHeight/4})"> -->
        <!-- Using matrix notation because safari... -->
        <g transform="matrix(-0.7071, 0.7071, 0.7071, 0.7071, {DiamondHeight * 0.5}, {DiamondHeight * 0.067})">
        
        <!-- Background polygons with correct colors from aesthetics.js -->
        <polygon
            class="diamond-background grey-triangle"
            points={grey_triangle}
            fill={alloColors.css.lightgrey}
            fill-opacity="0.8"
            stroke="black"
            stroke-width="0.5"
        />
        <polygon
            class="diamond-background blue-triangle"
            points={blue_triangle}
            fill={alloColors.css.paleblue}
            fill-opacity="0.8"
            stroke="black"
            stroke-width="0.5"
        />

        <AxisX {innerHeight} scale={logScale} {title} />
        <AxisY {innerHeight} scale={logScale} {title}/>
        <Grid height={innerHeight} {wxy} {ncells} scale={linScale}></Grid>

        <!-- Base layer: Heatmap cells with hover -->
        {#each diamond_dat as d}
            {@const typesList = d.types.split(',').map(t => t.trim())}
            {@const isHighlighted = highlightedTerm &&
                                   typesList.includes(highlightedTerm) &&
                                   (!highlightedSystem || d.which_sys === highlightedSystem)}
            <rect
                class="diamond-cell"
                class:highlighted={isHighlighted}
                x={xy(d.x1)}
                y={xy(d.y1)}
                width={xy.bandwidth()}
                height={xy.bandwidth()}
                fill={d.value === 0 ? "none" : color_scale(d.value)}
                style="opacity: {highlightedTerm && !isHighlighted ? 0.3 : 1};"
            />
        {/each}

        <!-- Overlay layer: Stroke-only rects matching original D3 -->
        {#each diamond_dat as d}
            <rect
                x={xy(d.x1)}
                y={xy(d.y1)}
                width={xy.bandwidth()}
                height={xy.bandwidth()}
                fill={d.value > 0 ? 'rgba(255,255,255,0.001)' : 'none'}
                stroke={d.value > 0 ? alloColors.css.darkergrey : 'none'}
                stroke-width={d.value > 0 ? '1.18' : '0'}
                stroke-opacity={d.value > 0 ? '0.4' : '0'}
                style="cursor: {d.value > 0 ? 'pointer' : 'default'};"
                onmouseenter={(e) => showTooltip(e, d)}
                onmouseleave={hideTooltip}
                onmousemove={updateTooltipPosition}
            />
        {/each}

        <!-- Text labels with aesthetics styling - add null check -->
        {#if relevant_types}
            {#each diamond_dat.filter(d => filter_labs(d, relevant_types)) as d}
                <text
                    x={xy(d.x1)}
                    y={Number.isInteger(d.coord_on_diag) ? xy(d.y1) : xy(d.y1)-1}
                    dx={d.x1 - d.y1 <= 0 ? 5 : -5}
                    dy="5"
                    text-anchor={d.x1 - d.y1 <= 0 ? "start" : "end"}
                    transform="scale(1,-1) rotate(-90) rotate(-45, {xy(d.x1)}, {xy(d.y1)}) translate({d.which_sys === "right" ? xy(Math.sqrt(d.cos_dist))*1.5 : -xy(Math.sqrt(d.cos_dist))*1.5}, 0)"
                    style="font-family: {alloFonts.family}; font-size: 12px; fill: {alloColors.css.darkergrey};"
                >{d.types.split(",")[0]}</text>
            {/each}
        {/if}

        <!-- Middle diagonal line with aesthetics colors -->
        <line
            x1="0" y1="0"
            x2={innerHeight-7} y2={innerHeight-7}
            style="stroke: {alloColors.css.verydarkgrey}; stroke-width: 0.5;"
        />

        <Contours {alpha} {maxlog10} {divnorm} DiamondInnerHeight={innerHeight}></Contours>
        </g>
    </svg>

    <!-- Tooltip with inline styles to ensure they work -->
    {#if tooltipVisible}
        <div
            style="
                position: fixed;
                left: {tooltipX}px;
                top: {tooltipY}px;
                background: white;
                border: 1px solid rgb(200, 200, 200);
                border-radius: 6px;
                padding: 10px 12px;
                font-family: 'EB Garamond', serif;
                font-size: 12px;
                line-height: 1.5;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                pointer-events: none;
                z-index: 1000;
                max-width: 280px;
            "
        >
            {@html tooltipContent}
        </div>
    {/if}
</div>

<style>
    .diamond-cell.highlighted {
        stroke: #ff6b6b;
        stroke-width: 2;
        filter: drop-shadow(0 0 4px rgba(255, 107, 107, 0.5));
    }
</style>