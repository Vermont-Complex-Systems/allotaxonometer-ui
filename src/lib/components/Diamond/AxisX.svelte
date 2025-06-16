<script>
  	import { alloColors, alloFonts, style } from '../../utils/aesthetics.js';
  
  	let { innerHeight, scale, title } = $props();
	let logFormat10 = $derived(scale.tickFormat());
	let xTicks = $derived(
	scale.ticks().filter(t => t >= 1 && Number.isInteger(Math.log10(t)))
	);

    let axisStyles = () => style({
        fontFamily: alloFonts.family,
        fontSize: alloFonts.sizes.lg,
        fill: alloColors.css.darkergrey,
        textAnchor: "middle"
    })

    let helperText = () => style({
            fontFamily: alloFonts.family,
            fontSize: alloFonts.sizes.sm,
            fill: alloColors.css.darkergrey,
            textAnchor: "middle"
        })

</script>

<g class='axis x' transform="translate(0, {innerHeight})">
    {#each xTicks as tick, index}
        <g transform="translate({scale(tick)}, 0)">
            <line x1="0" x2="0" y1="0" y2="6" stroke={alloColors.css.darkergreyy} stroke-width= "0.5"></line>
        </g>
        <g transform="translate({scale(tick)}, 0) scale(-1,1) rotate(45)">
            <text dx="5" dy="13" text-anchor="start" font-family={alloFonts.family} font-size={alloFonts.sizes.md} fill={alloColors.css.darkergrey} >{logFormat10(tick)}</text>
        </g>
    {/each}

    <g class="xlab">
        <text x={innerHeight/2} dy="45" transform="scale(-1,1) translate(-{innerHeight}, 0)" style={axisStyles()}>Rank r</text>
        <text x={innerHeight/2} dy="63" transform="scale(-1,1) translate(-{innerHeight}, 0)" style={axisStyles()}>for</text>
        <text x={innerHeight/2} dy="80" transform="scale(-1,1) translate(-{innerHeight}, 0)" style={axisStyles()}>{title[1]}</text>
        <text x={innerHeight-40} dy="60" transform="scale(-1,1) translate(-{innerHeight}, 0)" style={helperText()}>more →</text>
        <text x={innerHeight-40} dy="75" transform="scale(-1,1) translate(-{innerHeight}, 0)" style={helperText()}>frequent</text>
        <text x={40} dy="60" transform="scale(-1,1) translate(-{innerHeight}, 0)" style={helperText()}>← less</text>
        <text x={40} dy="75" transform="scale(-1,1) translate(-{innerHeight}, 0)" style={helperText()}>frequent</text>
    </g>
</g>