<script>

	let { height, scale, title, DiamondInnerHeight, trueDiamondHeight } = $props();

	let logFormat10 = scale.tickFormat()
    let xTicks = scale.ticks()
</script>


<g class='axis x' transform="translate(0, {height})">
	{#each xTicks as tick, index}
		<g class="xtick" transform="translate({scale(tick)}, 0)">
			<line x1="0" x2="0" y1="0" y2="6" stroke="hsla(212, 10%, 53%, 1)"></line>
		</g>
		<g class="tick-text" transform="translate({scale(tick)}, 0) scale(-1,1) rotate(45)">
			<text font-size="10" dx="13" dy="13">{logFormat10(tick)}</text>
		</g>
	{/each}
	<g class="xlab" transform="scale(-1,1) translate(-{height}, 0)">
		<text dy=45 x={height/2}>Rank r</text>
		<text dy=63 x={height/2}>for</text>
		<text dy=80 x={height/2}>{title[1]}</text>
		<text dy=60 x={height-40} fill="hsla(212, 10%, 53%, 1)" opacity="0.7">more →</text>
		<text dy=75 x={height-40} fill="hsla(212, 10%, 53%, 1)" opacity="0.7">frequent</text>
		<text dy=60 x={40} fill="hsla(212, 10%, 53%, 1)" opacity="0.7">← less</text>
		<text dy=75 x={40} fill="hsla(212, 10%, 53%, 1)" opacity="0.7">frequent</text>
	</g>
</g>

<style>
	.xlab {
		text-anchor: middle;
		font-size: 14px;
		fill: rgb(0, 0, 0);
	}
  </style>