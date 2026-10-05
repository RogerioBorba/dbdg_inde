<script lang="ts">
	import { cn } from "$lib/utils";
	import { LoaderCircle } from "lucide-svelte";

	let {
		class: className = "",
		size = "4",
		color = ""
	}: {
		class?: string;
		size?: string | number;
		color?: string;
	} = $props();

	const sizeMap: Record<string, string> = {
		"3": "h-3 w-3",
		"4": "h-4 w-4",
		"5": "h-5 w-5",
		"6": "h-6 w-6",
		"8": "h-8 w-8"
	};

	const colorMap: Record<string, string> = {
		red: "text-red-500",
		blue: "text-blue-500",
		green: "text-green-500",
		yellow: "text-yellow-500",
		gray: "text-gray-500",
		white: "text-white"
	};

	let sizeClass = $derived(typeof size === "string" && sizeMap[size] ? sizeMap[size] : "h-4 w-4");
	let colorClass = $derived(color && colorMap[color] ? colorMap[color] : "");
</script>

<LoaderCircle class={cn("inline-block animate-spin", sizeClass, colorClass, className)} />
