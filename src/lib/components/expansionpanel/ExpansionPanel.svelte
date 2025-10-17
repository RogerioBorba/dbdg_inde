<script lang="ts">
	let { header = '', icon = 1, children, svg} = $props();
	let expanded = $state(false);
	// Computed reactions usando $derived
	let display = $derived(expanded ? 'block' : 'hidden');
	let signal = $derived(expanded ? '&minus;' : '&plus;');
	const toggleExpanded = () => { expanded = !expanded; };
</script>

<div class="relative mt-0 mr-0 border-gray-300 border-1 focus:outline-none outline-none">
	<button
		class="flex items-center border border-gray-400 bg-gray-100 hover:bg-gray-300 cursor-pointer p-2 w-full text-justify text-gray-900 text-sm focus:outline-none outline-none"
		onclick={toggleExpanded}
	>
		<div class="{icon !== null ? 'block' : 'hidden'} ml-1">
			{@render svg()}
		</div>
		<div class="ml-1 Roboto md:Roboto">{header}</div>
		<div class="ml-auto text-2xl cursor-pointer">{@html signal}</div>
	</button>

	<div class="bg-gray-50 p-1 overflow-auto m-0 {display}">
		{@render children()}
	</div>
</div>

<style lang="postcss">
	/* Seus estilos postcss aqui */
</style>