<script lang="ts">
	import './app.css';
	import VanillaApp from '../apps/VanillaApp.svelte';
	import BitsuiApp from '../apps/BitsuiApp.svelte';
	import ClassApp from '../apps/ClassApp.svelte';
	import DashApp from '../apps/DashApp.svelte';
	import ShadcnApp from '../apps/ShadcnApp.svelte';
	
	let currentApp = $state(window.location.hash.slice(1) || 'vanilla');
	
	$effect(() => {
		function handleHashChange() {
			currentApp = window.location.hash.slice(1) || 'vanilla';
		}
		window.addEventListener('hashchange', handleHashChange);
		return () => window.removeEventListener('hashchange', handleHashChange);
	});
</script>

{#if currentApp === 'bitsui'}
	<BitsuiApp />
{:else if currentApp === 'class'}
	<ClassApp />
{:else if currentApp === 'dash'}
	<DashApp />
{:else if currentApp === 'shadcn'}
	<ShadcnApp />
{:else}
	<VanillaApp />
{/if}