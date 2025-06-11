<script>
  import { scaleLinear } from 'd3-scale';
  import { range, extent } from 'd3-array';
  
  let { message = "Hello World", data = [] } = $props();
  
  // If no data provided, generate some test data
  let testData = data.length > 0 ? data : range(10).map(i => ({
    x: i,
    y: Math.sin(i / 2) * 20 + 50,
    value: Math.random()
  }));
  
  // Pure D3 calculations - no DOM manipulation
  let xScale = scaleLinear()
    .domain(extent(testData, d => d.x))
    .range([20, 380]);
    
  let yScale = scaleLinear()
    .domain(extent(testData, d => d.y))
    .range([180, 20]);
  
  // Calculate positions
  let points = testData.map(d => ({
    cx: xScale(d.x),
    cy: yScale(d.y),
    r: 4 + d.value * 6,
    fill: `hsl(${d.value * 360}, 70%, 50%)`
  }));
</script>

<svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="200" fill="#f8f9fa" stroke="#dee2e6"/>
  
  <text x="200" y="25" text-anchor="middle" font-size="16" font-weight="bold">
    {message}
  </text>
  
  <g class="chart">
    {#each points as point}
      <circle 
        cx={point.cx} 
        cy={point.cy} 
        r={point.r} 
        fill={point.fill}
        stroke="white"
        stroke-width="1"
      />
    {/each}
  </g>
  
  <!-- Simple axes -->
  <line x1="20" y1="180" x2="380" y2="180" stroke="#666" stroke-width="1"/>
  <line x1="20" y1="20" x2="20" y2="180" stroke="#666" stroke-width="1"/>
  
  <text x="200" y="198" text-anchor="middle" font-size="12" fill="#666">X Axis</text>
  <text x="12" y="100" text-anchor="middle" font-size="12" fill="#666" transform="rotate(-90, 12, 100)">Y Axis</text>
</svg>