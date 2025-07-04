<script>
	
	import { Dashboard, Allotaxonograph } from 'allotaxonometer-ui';

	import boys1895 from '../../tests/fixtures/boys-1895.json';
	import boys1968 from '../../tests/fixtures/boys-1968.json';

	// Initialize the diamond class with data
	const diamond = new Allotaxonograph(
		boys1895, 
		boys1968, 
		0.58, 
		['Boys 1895', 'Boys 1968']
	);
</script>

<Dashboard {...diamond} />

