<script>
    import * as d3 from "d3";
    import AxisX from './AxisX.svelte';
    import AxisY from './AxisY.svelte';
    import Grid from './Grid.svelte';
    import Contours from './Contours.svelte';
    import { diamondStyles } from '../../styles/styleHelpers.js';

    let { 
        dat, 
        alpha, 
        divnorm,  
        title, 
        maxlog10, 
        DiamondHeight = 600, 
        marginInner = 160, 
        marginDiamond = 40 
    } = $props();
    
    // Extract data from dat object
    let diamond_dat = $derived(dat.counts);
    let deltas = $derived(dat.deltas);
    
    // Calculate derived dimensions (matching D3 version exactly)
    let innerHeight = $derived(DiamondHeight - marginInner);   
    let diamondHeight = $derived(innerHeight - marginDiamond);

    function get_relevant_types(diamond_dat) {
        const ncells = d3.max(diamond_dat, d => d.x1);
        const cumbin = d3.range(0, ncells, 1.5);
        const relevant_types = [];

        for (let sys of ["right", "left"]) {
            for (let i = 1; i < cumbin.length; i++) {
                const filtered_dat = diamond_dat.filter(d => d.value > 0 && d.which_sys == sys)
                                    .filter(d => d.coord_on_diag >= cumbin[i-1] && 
                                        d.coord_on_diag < cumbin[i]);
                
                if (filtered_dat.length > 0) {
                    const cos_dists = filtered_dat.map(d => d.cos_dist);
                    const max_dist = cos_dists.reduce((a, b) => Math.max(a, b));
                    const max_dist_idx = cos_dists.indexOf(max_dist);
                    
                    const types = filtered_dat[max_dist_idx]['types'].split(",");
                    const name = types[Math.floor(Math.random() * types.length)];
                    relevant_types.push(name);
                }
            }
        }
        return relevant_types;
    }

    function rin(arr1, arr2) {
        return Array.from(arr1, (x) => arr2.indexOf(x) !== -1);
    }
    
    // Wrangling data
    let relevant_types = $derived(get_relevant_types(diamond_dat));
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
    
    function filter_labs(d, relevant_types) {
        return rin(relevant_types, d.types.split(",")).some((x) => x === true);
    }
</script>

<svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={DiamondHeight} 
    height={DiamondHeight}
    viewBox="0 0 {DiamondHeight} {DiamondHeight}"
    style="overflow: visible; display: block;"
    transform="scale(-1,1) rotate(45) translate({innerHeight/4}, {innerHeight/4})"
>   
    <!-- Background polygons with correct colors - order matters! -->
    <polygon 
        class="diamond-background grey-triangle"
        points={grey_triangle} 
        fill="rgb(230, 230, 230)"
        fill-opacity="0.8"
        stroke="black" 
        stroke-width="0.5"
    />
    <polygon 
        class="diamond-background blue-triangle"
        points={blue_triangle} 
        fill="rgb(195, 230, 243)"
        fill-opacity="0.8"
        stroke="black" 
        stroke-width="0.5"
    />

    <AxisX {innerHeight} scale={logScale} {title} />
    <AxisY {innerHeight} scale={logScale} {title}/>
    <Grid height={innerHeight} {wxy} {ncells} scale={linScale}></Grid>

    <!-- Base layer: Heatmap cells with fill, NO stroke -->
    {#each diamond_dat as d}
        <rect
            class="diamond-cell"
            x={xy(d.x1)}
            y={xy(d.y1)}
            width={xy.bandwidth()}
            height={xy.bandwidth()}
            fill={d.value === 0 ? "none" : d.value > 10 ? "red" : d.value > 5 ? "orange" : "yellow"}
            opacity={d.value === 0 ? 0 : 1}
        />
    {/each}

     <!-- Overlay layer: Stroke-only rects -->
    {#each diamond_dat as d}
        <rect
            x={xy(d.x1)}
            y={xy(d.y1)}
            width={xy.bandwidth()}
            height={xy.bandwidth()}
            fill={d.value > 0 ? color_scale(d.value): "none"}
            style={d.value > 0 ? diamondStyles.cellStroke() : ''}
        />
    {/each}

    <!-- Text labels -->
    {#each diamond_dat.filter(d => filter_labs(d, relevant_types)) as d}
        <text
            x={xy(d.x1)}
            y={Number.isInteger(d.coord_on_diag) ? xy(d.y1) : xy(d.y1)-1}
            dx={d.x1 - d.y1 <= 0 ? 5 : -5}
            dy="5"
            text-anchor={d.x1 - d.y1 <= 0 ? "start" : "end"}
            transform="scale(1,-1) rotate(-90) rotate(-45, {xy(d.x1)}, {xy(d.y1)}) translate({d.which_sys === "right" ? xy(Math.sqrt(d.cos_dist))*1.5 : -xy(Math.sqrt(d.cos_dist))*1.5}, 0)"
            style={diamondStyles.label()}
        >{d.types.split(",")[0]}</text>
    {/each}
    <!-- Middle diagonal line -->
    <line 
        x1="0" y1="0" 
        x2={innerHeight-7} y2={innerHeight-7}
        style={diamondStyles.middleLine()}
    />

    <Contours {alpha} {maxlog10} {divnorm} DiamondInnerHeight={innerHeight}></Contours>
</svg>