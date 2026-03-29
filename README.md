
# Allotaxonometer UI

<img width="50%" alt="pipeline" src="https://github.com/user-attachments/assets/41375b5f-e942-499f-aea4-bca004767e52">

Headless UI components for allotaxonometer visualizations built with **Svelte 5**.

- Visit our [single-page web application](https://vermont-complex-systems.github.io/complex-stories/allotaxonometry) to try it out online.
- Use [allotaxonometer-core](https://github.com/jstonge/allotaxonometer-core) for Rust/Python server-side computation.
- See the original [py-allotax](https://github.com/compstorylab/py-allotax) for the Python-only implementation.

## Installation

```bash
npm install allotaxonometer-ui
```

## Usage

### Client-side pipeline (Allotaxonograph class)

Compute everything in the browser using the built-in JS/WASM pipeline:

```svelte
<script>
  import { Allotaxonograph, Dashboard } from 'allotaxonometer-ui';

  const instance = new Allotaxonograph(elem1, elem2, {
    alpha: 0.58,
    title: ['System 1', 'System 2']
  });

  let dat = $derived(instance?.dat);
  let barData = $derived(instance?.barData);
  let balanceData = $derived(instance?.balanceData);
</script>

<Dashboard {dat} {barData} {balanceData}
  divnorm={instance.rtd.normalization}
  alpha={0.58}
  maxlog10={instance.maxlog10}
  title={['System 1', 'System 2']}
/>
```

### Server-computed data (API adapter)

When using a backend that computes allotax results (e.g. via `allotaxonometer-core`), use `adaptDisplayResult` to map the API response to component-ready props:

```js
import { adaptDisplayResult } from 'allotaxonometer-ui';

const apiResult = await fetch('/allotax?...').then(r => r.json());
const display = adaptDisplayResult(apiResult);
// display.dat, display.barData, display.balanceData, display.divnorm, display.maxlog10, etc.
```

### Multi-alpha (recommended for API usage)

Fetch all alpha values at once and switch instantly on the client:

```svelte
<script>
  // Fetch once with all alphas — no refetch when alpha slider changes
  const data = await fetch('/allotax?alphas=0,0.08,0.17,...').then(r => r.json());
  // data.balance — shared across alphas
  // data.alpha_results[i] — { diamond_counts, wordshift, normalization, alpha }
</script>

{@const slice = data.alpha_results[alphaIndex]}
{@const dat = { counts: slice.diamond_counts, deltas: [] }}

<Dashboard
  {dat}
  barData={slice.wordshift}
  balanceData={data.balance}
  divnorm={slice.normalization}
  alpha={slice.alpha}
/>
```

## Components

| Component | Description |
|-----------|-------------|
| `Dashboard` | Main orchestrating component combining all visualizations |
| `Diamond` | Rank-rank scatter plot showing relationships between systems |
| `Wordshift` | Horizontal bar chart showing type contributions to divergence |
| `DivergingBarChart` | Bar chart for positive/negative shifts |
| `Legend` | Color and size legends |

## Data Input

The allotaxonometer expects 2 datasets with `types` and `counts`. The `totalunique` and `probs` fields are **optional** and will be calculated automatically if not provided.

### Minimal Format (Recommended)
```javascript
const data = [{
  types: ['John', 'William', 'James', 'George', 'Charles'],
  counts: [8502, 7494, 5097, 4458, 4061]
  // totalunique and probs calculated automatically!
}];
```

### Full Format
```javascript
const data = [{
  types: ['John', 'William', 'James', 'George', 'Charles'],
  counts: [8502, 7494, 5097, 4458, 4061],
  totalunique: 1161,
  probs: [0.0766, 0.0675, 0.0459, 0.0402, 0.0366]
}];
```

## Development

```bash
npm run build          # Build library (includes WASM)
npm run build:wasm     # Build Rust/WASM module only
npm run test:run       # Run all tests once
npm test               # Run tests in watch mode
```

## WASM Acceleration

The `rank_turbulence_divergence` computation is implemented in Rust/WASM for 3-4x speedup on datasets with 10K+ types. WASM loads eagerly but falls back to JavaScript if unavailable. See [WASM_IMPLEMENTATION.md](WASM_IMPLEMENTATION.md) for details.
