<script>
    // @ts-nocheck

    let { scale, height, wxy, ncells } = $props();


    let xygridLines = $derived(scale.ticks(ncells/2));

</script>

<g class="grid">
    {#each xygridLines as yline, index}
        <g transform="translate({wxy(yline)}, 0)">
            <line
            y1={height}
            y2="0"
            stroke="#d3d3d3"
            stroke-dasharray="1,3"
            opacity={index === 0 ? 0 : 1}></line>
        </g>
        <g transform="translate(0, {wxy(yline)})">
            <line
            x1={height}
            x2="0"
            stroke="#d3d3d3"
            stroke-dasharray="1,3"
            opacity={index === 0 ? 0 : 1}></line>
        </g>
    {/each}
</g>