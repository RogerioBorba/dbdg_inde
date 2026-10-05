<script lang="ts">
	import { Tabs as TabsPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: TabsPrimitive.TriggerProps = $props();
</script>

<TabsPrimitive.Trigger
	bind:ref
	data-slot="tabs-trigger"
	class={cn(
		"inline-flex items-center justify-center whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-all cursor-pointer rounded-t-lg outline-none select-none disabled:pointer-events-none disabled:opacity-50",
		"text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800",
		"data-[state=active]:bg-gray-100 data-[state=active]:text-[#ef562f] data-[state=active]:font-semibold dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-[#ef562f]",
		className
	)}
	{...restProps}
/>
