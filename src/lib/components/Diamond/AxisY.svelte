<script>
    import { axisStyles } from '../../styles/styleHelpers.js';
    
    let { innerHeight, scale, title } = $props();
    
    let logFormat10 = $derived(scale.tickFormat());
    let yTicks = $derived(
    scale.ticks().filter(t => t >= 1 && Number.isInteger(Math.log10(t)))
    );
</script>

<g class='axis y' transform="translate({innerHeight}, 0) scale(-1, 1)">
    {#each yTicks as tick, index}
        <g transform="translate(0, {scale(tick)})">
            <line x1="0" x2="-6" y1="0" y2="0" style={axisStyles.tickLine()}></line>
        </g>
        <g transform="translate(0, {scale(tick)}) rotate(45)">
            <text dx="-5" dy="13"  text-anchor="end" style={axisStyles.tickLabel()}>{logFormat10(tick)}</text>
        </g>
    {/each}

    <g class="ylab" transform="rotate(90)">
        <text x={innerHeight/2} dy="45" style={axisStyles.label()}>Rank r</text>
        <text x={innerHeight/2} dy="63" style={axisStyles.label()}>for</text>
        <text x={innerHeight/2} dy="80" style={axisStyles.label()}>{title[0]}</text>
        <text x={innerHeight-40} dy="60" style={axisStyles.helperText()}>less →</text>
        <text x={innerHeight-40} dy="75" style={axisStyles.helperText()}>frequent</text>
        <text x={40} dy="60" style={axisStyles.helperText()}>← more</text>
        <text x={40} dy="75" style={axisStyles.helperText()}>frequent</text>
    </g>
</g>