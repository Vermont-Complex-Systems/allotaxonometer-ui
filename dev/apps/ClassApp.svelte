<script>
	import { DiamondClass } from './DiamondState.svelte.ts';
	import { Dashboard } from 'allotaxonometer-ui';

	import boys1895 from '../../tests/fixtures/boys-1895.json';
	import boys1968 from '../../tests/fixtures/boys-1968.json';

	// Initialize the diamond class with data
	const diamond = new DiamondClass(
		boys1895, 
		boys1968, 
		0.58, 
		['Boys 1895', 'Boys 1968']
	);
</script>

<Dashboard {...diamond} />

