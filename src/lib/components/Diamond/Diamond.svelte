<script>
    import * as d3 from "d3";

    import AxisX from './AxisX.svelte';
    import AxisY from './AxisY.svelte';
    import Grid from './Grid.svelte';
    import Contours from './Contours.svelte';

    let { diamond_count, diamond_dat, margin, DiamondInnerHeight, trueDiamondHeight, alpha, maxlog10, rtd, title } = $props();
    
    function get_relevant_types(diamond_dat) {
        const ncells = 60;
        const bin_size = 1.5;
        const cummulative_bin = d3.range(0, ncells, bin_size);
        const relevant_types = [];

        for (let sys of ["right", "left"]) {
            for (let i=1; i < cummulative_bin.length; i++) {
                const filtered_dat = diamond_dat.filter(d => d.value > 0 && d.which_sys == sys)
                                .filter(d => d.coord_on_diag >= cummulative_bin[i-1] && 
                                    d.coord_on_diag < cummulative_bin[i]);
                
                if (filtered_dat.length > 0) {
                    const cos_dists = filtered_dat.map(d => d.cos_dist);
                    const max_dist = cos_dists.reduce((a, b) => { return Math.max(a, b) });
                    const max_dist_idx = cos_dists.indexOf(max_dist);
                    
                    // Use a simple random selection instead of d3.shuffle during SSR
                    const types = filtered_dat[max_dist_idx]['types'].split(",");
                    const name = types[Math.floor(Math.random() * types.length)];
                    relevant_types.push(name);
                }
            }
        }
        return relevant_types;
    }

    function rin(arr1, arr2) {
        return Array.from(arr1, (x) => {
            return arr2.indexOf(x) == -1 ? false : true;
        });
    }
    
    // Wrangling data
    let relevant_types = $derived(get_relevant_types(diamond_dat));

    // Extracting constants - all these should be SSR-safe
    let max_rank_raw = $derived(d3.range(d3.max(diamond_count, d => d.x1)));
    let max_rank = $derived(d3.max(diamond_dat, (d) => d.rank_L[1]));
    let rounded_max_rank = $derived(10**Math.ceil(Math.max(Math.log10(max_rank))));
    let ncells = $derived(d3.max(max_rank_raw));
    let xyDomain = $derived([1, rounded_max_rank]);

    // All the Scales! - These should be SSR-safe
    let linScale = $derived(d3.scaleLinear().domain([0,ncells-1]).range([0, DiamondInnerHeight]));
    let wxy = $derived(d3.scaleBand().domain(max_rank_raw).range([0, DiamondInnerHeight]));
    let logScale = $derived(d3.scaleLog().domain(xyDomain).range([0, DiamondInnerHeight]).nice());
    let xy = $derived(d3.scaleBand().domain(max_rank_raw).range([0, trueDiamondHeight]));
    
    let color_scale = d3.scaleSequentialLog().domain([rounded_max_rank, 1]).interpolator(d3.interpolateInferno);     
    
    // Background colors
    let blue_triangle = [[DiamondInnerHeight, DiamondInnerHeight], [0, 0], [0, DiamondInnerHeight]].join(" ");
    let grey_triangle = [[DiamondInnerHeight, DiamondInnerHeight], [0, 0], [DiamondInnerHeight, 0]].join(" ");
    
    function filter_labs(d, relevant_types) {
        return rin(relevant_types, d.types.split(",")).some((x) => x === true);
    }
</script>

<g class='diamond-chart' transform="translate(360, 0) scale (-1,1) rotate(45) translate({margin.inner/2}, {margin.inner/2})">
    
    <polygon points={blue_triangle} fill="#89CFF0" fill-opacity="0.2" stroke="black" stroke-width="0.5"/>
    <polygon points={grey_triangle} fill="grey" fill-opacity="0.2" stroke="black" stroke-width="0.5"/>
    
    <AxisX height={DiamondInnerHeight} scale={logScale} {title}/>
    <AxisY height={DiamondInnerHeight} scale={logScale} {title}/>
    <Grid  height={DiamondInnerHeight} {wxy} {ncells} scale={linScale}></Grid>

    {#each diamond_dat as d}
        <rect
            x={xy(d.x1)}
            y={xy(d.y1)}
            width={xy.bandwidth()}
            height={xy.bandwidth()}
            fill={color_scale(d.value)}
            opacity={d.value === null ? 0 : 1.}
            stroke="black"
            stroke-width="0.2"
        />
    {/each}

    {#each diamond_dat.filter(d => filter_labs(d, relevant_types)) as d}
        <g class="diamond-lab" 
        transform="
            scale(1,-1) 
            rotate(-90) 
            rotate(-45, {xy(d.x1)}, {xy(d.y1)}) 
            translate({d.which_sys === "right" ? xy(Math.sqrt(d.cos_dist))*1.5 : -xy(Math.sqrt(d.cos_dist))*1.5}, 0)
        ">
        <text
            x={xy(d.x1)}
            y={Number.isInteger(d.coord_on_diag) ? xy(d.y1) : xy(d.y1)-1}
            dy="20"
            font-size="10"
            text-anchor={d.x1 - d.y1 <= 0 ? "start" : "end"}
        >{d.types.split(",")[0]}</text>
        </g>
    {/each}

    <Contours {alpha} {maxlog10} {rtd} {DiamondInnerHeight}></Contours>
</g>