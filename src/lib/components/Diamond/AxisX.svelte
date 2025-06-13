<script>
  import { axisStyles } from '../../styles/styleHelpers.js';
  
  let { innerHeight, scale, title } = $props();
  let logFormat10 = scale.tickFormat()
  let xTicks = scale.ticks()
</script>

<g class='axis x' transform="translate(0, {innerHeight})">
    {#each xTicks as tick, index}
        <g transform="translate({scale(tick)}, 0)">
            <line x1="0" x2="0" y1="0" y2="6" style={axisStyles.tickLine()}></line>
        </g>
        <g transform="translate({scale(tick)}, 0) scale(-1,1) rotate(45)">
            <text dx="31" dy="10" style={axisStyles.tickLabel()}>{logFormat10(tick)}</text>
        </g>
    {/each}

    <g class="xlab">
        <text x={innerHeight/2} dy="45" transform="scale(-1,1) translate(-{innerHeight}, 0)" style={axisStyles.label()}>Rank r</text>
        <text x={innerHeight/2} dy="63" transform="scale(-1,1) translate(-{innerHeight}, 0)" style={axisStyles.label()}>for</text>
        <text x={innerHeight/2} dy="80" transform="scale(-1,1) translate(-{innerHeight}, 0)" style={axisStyles.label()}>{title[1]}</text>
        <text x={innerHeight-40} dy="60" transform="scale(-1,1) translate(-{innerHeight}, 0)" style={axisStyles.helperText()}>more →</text>
        <text x={innerHeight-40} dy="75" transform="scale(-1,1) translate(-{innerHeight}, 0)" style={axisStyles.helperText()}>frequent</text>
        <text x={40} dy="60" transform="scale(-1,1) translate(-{innerHeight}, 0)" style={axisStyles.helperText()}>← less</text>
        <text x={40} dy="75" transform="scale(-1,1) translate(-{innerHeight}, 0)" style={axisStyles.helperText()}>frequent</text>
    </g>
</g>