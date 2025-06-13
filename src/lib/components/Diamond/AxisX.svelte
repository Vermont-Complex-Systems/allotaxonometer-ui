<script>
	let { height, scale, title, DiamondInnerHeight, trueDiamondHeight } = $props();

	let logFormat10 = scale.tickFormat()
    let xTicks = scale.ticks()
</script>

<g class='axis x' transform="translate(0, {height})">
	{#each xTicks as tick, index}
		<g class="xtick" transform="translate({scale(tick)}, 0)">
			<line class="tick-line" x1="0" x2="0" y1="0" y2="6"></line>
		</g>
		<g class="tick-text" transform="translate({scale(tick)}, 0) scale(-1,1) rotate(45)">
			<text class="axis-tick-label" dx="11" dy="0">{logFormat10(tick)}</text>
		</g>
	{/each}
	<g class="xlab" transform="scale(-1,1) translate(-{height}, 0)">
		<text class="axis-label" dy="45" x={height/2}>Rank r</text>
		<text class="axis-label" dy="63" x={height/2}>for</text>
		<text class="axis-label" dy="80" x={height/2}>{title[1]}</text>
		<text class="axis-helper-text" dy="60" x={height-40}>more →</text>
		<text class="axis-helper-text" dy="75" x={height-40}>frequent</text>
		<text class="axis-helper-text" dy="60" x={40}>← less</text>
		<text class="axis-helper-text" dy="75" x={40}>frequent</text>
	</g>
</g>

<style>
	.axis.x {
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
	}
	
	.axis-helper-text {
		font-family: var(--allo-font-family);
		font-size: 12px;
		fill: var(--allo-darkgrey);
		text-anchor: middle;
		opacity: 0.8;
	}
</style>