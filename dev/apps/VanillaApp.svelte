<script>
    import { Diamond, Wordshift, Allotaxonograph } from 'allotaxonometer-ui';
    import boys1895 from '../../tests/fixtures/boys-1895.json';
    import boys1968 from '../../tests/fixtures/boys-1968.json';

    let alpha = $state(0.58);
    let title = $derived(['Boys 1895', 'Boys 1968']);

    let DiamondHeight = 600;

  // Single reactive state container — runs the full pipeline (WASM if available, JS fallback otherwise).
  const allotax = new Allotaxonograph(boys1895, boys1968, { alpha, topN: 30 });
  $effect(() => { allotax.alpha = alpha; });

  let dat = $derived(allotax.dat);
  let rtd = $derived(allotax.rtd);
  let barData = $derived(allotax.barData);
  let maxlog10 = $derived(allotax.maxlog10);
  let max_shift = $derived(allotax.max_shift);

  // Interactive highlighting state
  let highlightedTerm = $state(null);
  let highlightedSystem = $state(null); // 'left' or 'right'
  let selectedBar = $state(null); // Track selected bar label

  // Tooltip state
  let hoveredBar = $state(null);
  let tooltipX = $state(0);
  let tooltipY = $state(0);

  // Click handler
  function handleBarClick(event, data, label) {
    const typeName = label.split(' (')[0];
    // Determine which system based on metric sign
    const system = data.metric > 0 ? 'right' : 'left';

    // Toggle: if clicking same term on same side, clear
    if (highlightedTerm === typeName && highlightedSystem === system) {
      highlightedTerm = null;
      highlightedSystem = null;
      selectedBar = null;
      hoveredBar = null;
    } else {
      highlightedTerm = typeName;
      highlightedSystem = system;
      selectedBar = label;
      // Show tooltip on click
      hoveredBar = { data, label };
      tooltipX = event.clientX + 15;
      tooltipY = event.clientY - 10;
    }

    console.log('Clicked:', typeName, 'System:', system === 'right' ? '2' : '1');
  }
</script>

<div style="padding: 2rem;">
  <h1>Interactive Highlighting Test</h1>
  <p>Click a bar to highlight that name in the diamond plot!</p>
  {#if highlightedTerm}
    <p style="color: #ff6b6b; font-weight: bold;">Highlighted: {highlightedTerm}</p>
  {/if}

  <div style="display: flex; gap: 2rem; margin-top: 2rem;">
    <div>
      <h3>Diamond Plot</h3>
      <Diamond
        {dat}
        {alpha}
        divnorm={rtd?.normalization || 1}
        {title}
        {maxlog10}
        {DiamondHeight}
        {highlightedTerm}
        {highlightedSystem}
      />
    </div>

    <div>
      <h3>Wordshift (Click bars!)</h3>
      <Wordshift
        {barData}
        xDomain={[-max_shift * 1.5, max_shift * 1.5]}
        onBarClick={handleBarClick}
        {selectedBar}
      />
    </div>
  </div>

  <!-- Tooltip -->
  {#if hoveredBar}
    {@const typeName = hoveredBar.label.split(' (')[0]}
    {@const system = hoveredBar.data.metric > 0 ? 'System 2' : 'System 1'}
    <div
      style="
        position: fixed;
        left: {tooltipX}px;
        top: {tooltipY}px;
        background: white;
        border: 1px solid #ddd;
        border-radius: 6px;
        padding: 10px 12px;
        font-family: 'EB Garamond', serif;
        font-size: 13px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        pointer-events: none;
        z-index: 1000;
        max-width: 250px;
      "
    >
      <div style="font-weight: bold; margin-bottom: 4px;">{typeName}</div>
      <div style="color: #666;">System: {system}</div>
      <div style="color: #666;">Contribution: {(hoveredBar.data.metric * 100).toFixed(2)}%</div>
      <div style="color: #666;">Rank diff: {hoveredBar.data.rank_diff}</div>
    </div>
  {/if}
</div>