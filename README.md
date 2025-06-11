# Allotaxonometer UI

Headless UI components for allotaxonometer visualizations built with Svelte 5.

## Installation

```bash
npm install allotaxonometer-ui
```

Make sure you have these installed:

```bash
npm install svelte d3 allotaxonometer @ungap/structured-clone
```

## Usage

```svelte
<script>
  import { Dashboard } from 'allotaxonometer-ui';
  
  // Your data
  let sys1 = [...];
  let sys2 = [...];
</script>

<Dashboard 
  test_elem_1={sys1}
  test_elem_2={sys2}
  alpha={0.58}
  title={['System 1', 'System 2']}
/>
```

## Components

- Dashboard - Complete dashboard with all visualizations
- Diamond - Diamond chart component
- Wordshift - Word shift visualization
- DivergingBarChart - Diverging bar chart
- Legend - Legend component

## Development

```bash
git clone https://github.com/yourusername/allotaxonometer-ui.git
cd allotaxonometer-ui
npm install
npm run build
```