<script>
    import { onMount } from "svelte";

    let count = $state(0);

    onMount(() => {
        console.log("Inicial:", count);
    });

    $effect(() => {
        console.log("Mudou:", count);
    });
</script>

<button  class="m-1 rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"onclick={() => count++}>
    Incrementar
</button>
<div>Abra o log para ver a diferença</div>