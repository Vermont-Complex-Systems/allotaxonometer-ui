<script>
    import * as d3 from "d3";

    let { alpha, maxlog10, rtd, DiamondInnerHeight } = $props();

    function alpha_norm_type2(x1, x2, alpha) {
        if (alpha == 0) {
            return Math.abs(Math.log(x1 / x2));
        } else if (alpha === Infinity) {
            return x1 === x2 ? 0 : Math.max(x1, x2);
        } else {
            const prefactor = (alpha + 1) / alpha;
            const power = 1 / (alpha + 1);
            return prefactor * Math.abs(Math.pow(x1, alpha) - Math.pow(x2, alpha)) ** power;
        }
    }

    function make_grid(Ninset, tmpr1, tmpr2, alpha, rtd) {
        const deltamatrix = Array.from({ length: Ninset }, () => Array(Ninset).fill(0));

        for (let i = 0; i < Ninset; i++) {
            for (let j = 0; j < Ninset; j++) {
                const divElem = alpha_norm_type2(1 / tmpr1[i], 1 / tmpr2[j], alpha);
                deltamatrix[i][j] = divElem / rtd.normalization; 
            }

            deltamatrix[i][i] = -1;

            if (i < Ninset - 1) {
                deltamatrix[i][i + 1] = -1;
                deltamatrix[i + 1][i] = -1;
            }
        }

        return deltamatrix;
    };

    function filter_contours(tmpcontours, Ninset, maxlog10) {
        const chart2val = d3.scaleLinear()
            .domain([0, Ninset])
            .range([0, maxlog10]);

        let out = [];
        tmpcontours.forEach((contour) => {
            contour.coordinates.forEach((pair, i) => {
                const tmpr1 = pair[0].map(d => d[0]);
                const tmpr2 = pair[0].map(d => d[1]);
                const filteredPairs = [];

                for (let index = 0; index < tmpr1.length-1; index++) {
                    const x1 = chart2val(tmpr1[index]);
                    const x2 = chart2val(tmpr2[index]);
                    const tmpxrot = Math.abs(x2 - x1) / Math.sqrt(2);
                    
                    if (Math.abs(tmpxrot) >= 0.1 & x1 != maxlog10 & x2 != 0 & x1 != 0 & x2 != maxlog10) {
                        filteredPairs.push([x1, x2]);
                    }
                }

                if (filteredPairs.length > 0) {
                    out.push(filteredPairs);
                }
            });
        });
        return out;
    }

    function get_contours(alpha, maxlog10) {
        // Check if we're in browser environment
        if (typeof window === 'undefined') {
            return []; // Return empty array during SSR
        }

        const Ninset = 10 ** 3;
        const tmpr1 = d3.range(0, 1000).map(d => Math.pow(10, d / 999 * 5));
        const tmpr2 = d3.range(0, 1000).map(d => Math.pow(10, d / 999 * 5));
        
        const Ncontours = 10;
        const scale = d3.scaleLinear()
            .domain([0, Ncontours + 1])
            .range([1, tmpr1.length]);
        
        const contour_indices = d3.range(Ncontours + 2).map(i => Math.round(scale(i)));
        const grid = make_grid(Ninset, tmpr1, tmpr2, alpha, rtd);
        const indices = contour_indices.slice(1, -1);
        const lastRow = grid[grid.length - 1];
        const heights = indices.map(index => lastRow[index]);
        
        const logTmpr = tmpr1.map(Math.log10);
        
        const contourGenerator = d3.contours()
            .size([logTmpr.length, logTmpr.length])
            .thresholds(heights);
        
        const flatDeltamatrix = grid.flat();
        const tmpcontours = contourGenerator(flatDeltamatrix);  
        
        return filter_contours(tmpcontours, Ninset, maxlog10);
    }

    // Only calculate contours in browser
    let mycontours = $derived(get_contours(alpha, maxlog10));
    const x = $derived(d3.scaleLinear([0, maxlog10], [0, DiamondInnerHeight]));
    const y = $derived(d3.scaleLinear([maxlog10, 0], [DiamondInnerHeight, 0]));

    const pathData = d3.line()
        .x((d, i) => x(d[0]))
        .y((d, i) => y(d[1]));
</script>

<g class="contours">
    {#each mycontours as contour, index}
        <path 
            fill="none"
            stroke="grey"
            d={pathData(contour)}
            stroke-width="0.9"
            stroke-opacity="0.9">
        </path>
    {/each}
</g>