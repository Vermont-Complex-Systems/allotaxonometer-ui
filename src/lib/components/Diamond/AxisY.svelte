<script>
	let { height, scale, title } = $props();
	
	let logFormat10 = scale.tickFormat();
    let yTicks = $derived(scale.ticks());
</script>

<g class='axis y' transform="translate({height}, 0) scale(-1, 1)">
    {#each yTicks as tick, index}
        <g class="ytick" transform="translate(0, {scale(tick)})">
            <line 
				class="tick-line"
				x1="0" 
				x2="-6" 
				y1="0" 
				y2="0"
            ></line>
        </g>
        <g class="tick-text" transform="translate(0, {scale(tick)}) rotate(45)">
            <text class="axis-tick-label" dx="-23" dy="10">{logFormat10(tick)}</text>
        </g>
    {/each}
	<g class="ylab" transform="rotate(90)">
		<text class="axis-label" dy="45" x={height/2}>Rank r</text>
		<text class="axis-label" dy="63" x={height/2}>for</text>
		<text class="axis-label" dy="80" x={height/2}>{title[0]}</text>
		<text class="axis-helper-text" dy="60" x={height-40}>more →</text>
		<text class="axis-helper-text" dy="75" x={height-40}>frequent</text>
		<text class="axis-helper-text" dy="60" x={40}>← less</text>
		<text class="axis-helper-text" dy="75" x={40}>frequent</text>
	</g>
</g>

<style>
	.axis.y {
		font-family: var(--allo-font-family);
	}
	
	.tick-line {
		stroke: var(--allo-darkgrey);
	}
	
	.axis-tick-label {
		font-family: var(--allo-font-family);
		font-size: 12px;
		fill: var(--allo-darkergrey);
		text-anchor: end;
	}
	
	.axis-label {
		font-family: var(--allo-font-family);
		font-size: 14px;
		fill: var(--allo-darkergrey);
		text-anchor: middle;
		opacity: 0.7;
	}
	
	.axis-helper-text {
		font-family: var(--allo-font-family);
		font-size: 12px;
		fill: var(--allo-darkgrey);
		text-anchor: middle;
		opacity: 0.7;
	}
</style>