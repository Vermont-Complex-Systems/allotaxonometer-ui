<script>
    // @ts-nocheck

    import * as d3 from "d3";
    
    let { barData, DashboardHeight, DashboardWidth } = $props();
    
    let margin = ({ top: 80, left: 140, right: 50, bottom: 10 })

	let width = 640;
    
    let yPadding = 0.2;
    
    let Y = $derived(d3.map(barData, (d) => d.type));
    let max_shift = $derived(d3.max(barData, (d) => Math.abs(d.metric))*1.5);

    let xDomain = $derived([-max_shift, max_shift]);
    let yDomain = $derived(new d3.InternSet(Y));

    let xRange = $derived([DashboardWidth - width + margin.left, DashboardWidth - margin.right]);
    let yRange = $derived([margin.top, DashboardHeight - margin.bottom]);
    
    let xScale = $derived(d3.scaleLinear().domain(xDomain).range(xRange));
    let yScale = $derived(d3.scaleBand(yDomain, yRange).padding(yPadding));
    
    let xTicks = $derived(xScale.ticks(width / 80));
    
    const colors = ["lightgrey", "lightblue"]
</script>


 <g class='barChart-container'>
     <g class='axis x' transform="translate(0, {margin.top})">
         {#each xTicks as tick}
             <g class="tick">
                 <line 
                     x1={xScale(tick)} 
                     y1="0" 
                     x2={xScale(tick)}
                     y2={DashboardHeight - margin.top - margin.bottom} 
                     stroke="hsla(212, 10%, 53%, 1)"
                     stroke-opacity=0.2
                 >{tick}</line>
                 <text 
                 x={xScale(tick)} 
                 y="-12" 
                 font-size=0.8em
                 >{tick*100}%</text>
             </g>
         {/each}
     </g>
     {#each barData as d, i}
         <rect
             x={Math.min(xScale(0), xScale(d.metric))}
             y={yScale(d.type)}
             fill={colors[d.metric > 0 ? colors.length - 1 : 0]}
             width={Math.abs(xScale(d.metric) - xScale(0))}
             height={ yScale.bandwidth() }
         />
         <text 
             x={Math.min(xScale(0), xScale(d.metric))}
             y={yScale(d.type)}
             dy="14"
             font-size=0.7em
         >{d.type}</text>
     {/each}
 </g>


<style>
    .barChart-container {
        position: relative;
    }
</style>
