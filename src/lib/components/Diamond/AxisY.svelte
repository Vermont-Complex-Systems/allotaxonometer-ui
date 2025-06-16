<script>
    import { alloColors, alloFonts, style } from '../../utils/aesthetics.js';
    
    let { innerHeight, scale, title } = $props();
    
    let logFormat10 = $derived(scale.tickFormat());
    let yTicks = $derived(
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

<g class='axis y' transform="translate({innerHeight}, 0) scale(-1, 1)">
    {#each yTicks as tick, index}
        <g transform="translate(0, {scale(tick)})">
            <line x1="0" x2="-6" y1="0" y2="0" stroke={alloColors.css.darkergreyy} stroke-width= "0.5"></line>
        </g>
        <g transform="translate(0, {scale(tick)}) rotate(45)">
            <text dx="-5" dy="13"  text-anchor="end" font-family={alloFonts.family} font-size={alloFonts.sizes.md} fill={alloColors.css.darkergrey}>{logFormat10(tick)}</text>
        </g>
    {/each}

    <g class="ylab" transform="rotate(90)">
        <text x={innerHeight/2} dy="45" style={axisStyles()}>Rank r</text>
        <text x={innerHeight/2} dy="63" style={axisStyles()}>for</text>
        <text x={innerHeight/2} dy="80" style={axisStyles()}>{title[0]}</text>
        <text x={innerHeight-40} dy="60" style={helperText()}>less →</text>
        <text x={innerHeight-40} dy="75" style={helperText()}>frequent</text>
        <text x={40} dy="60" style={helperText()}>← more</text>
        <text x={40} dy="75" style={helperText()}>frequent</text>
    </g>
</g>