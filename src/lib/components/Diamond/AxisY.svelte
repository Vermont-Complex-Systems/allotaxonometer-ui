<script>
	let { height, scale, title } = $props();
	
	let logFormat10 = scale.tickFormat();
    let yTicks = $derived(scale.ticks());


</script>


<g class='axis y' transform="translate({height}, 0) scale(-1, 1)">
    {#each yTicks as tick, index}
        <g class="ytick" transform="translate(0, {scale(tick)})">
            <line 
            x1="0" 
            x2="-6" 
            y1="0" 
            y2="0" 
            stroke="hsla(212, 10%, 53%, 1)"
            ></line>
        </g>
        <g class="tick-text" transform="translate(0, {scale(tick)}) rotate(45)">
            <text font-size="10" dx="-23" dy="10">{logFormat10(tick)}</text>
        </g>
    {/each}
	<g class="ylab" transform="rotate(90)">
		<text dy=45 x={height/2}>Rank r</text>
		<text dy=63 x={height/2}>for</text>
		<text dy=80 x={height/2}>{title[0]}</text>
		<text dy=60 x={height-40} fill="hsla(212, 10%, 53%, 1)" opacity="0.7">more →</text>
		<text dy=75 x={height-40} fill="hsla(212, 10%, 53%, 1)" opacity="0.7">frequent</text>
		<text dy=60 x={40} fill="hsla(212, 10%, 53%, 1)" opacity="0.7">← less</text>
		<text dy=75 x={40} fill="hsla(212, 10%, 53%, 1)" opacity="0.7">frequent</text>
	</g>
</g>

<style>
	.ylab {
		text-anchor: middle;
		font-size: 14px;
		fill: rgb(0, 0, 0);
	}
  </style>