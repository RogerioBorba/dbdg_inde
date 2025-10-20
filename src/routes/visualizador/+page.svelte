<script lang="ts">
    import { onMount } from "svelte";
    import Map from "$lib/components/map_libre/map/map.svelte"
    import Sidebar from "$lib/components/sidebar/sidebar.svelte";
    import BaseTiles from "$lib/components/map_libre/baseTile/baseTiles.svelte";
    import ExpansionPanel from "$lib/components/expansionpanel/ExpansionPanel.svelte";

    onMount( async ()  => {});
</script>
<Sidebar home={"home"}>
    <ExpansionPanel header={"Camada base"}>
        {#snippet svg()}
            <span>
            <svg  class=" text-blue-400 fill-current h-6 w-6" viewBox="0 0 24 24">
            <path d="M12,16L19.36,10.27L21,9L12,2L3,9L4.63,10.27M12,18.54L4.62,12.81L3,14.07L12,21.07L21,14.07L19.37,12.8L12,18.54Z" />
            </svg>
            </span>
        {/snippet}
       <BaseTiles></BaseTiles>
        
    </ExpansionPanel>
</Sidebar>
<Map></Map>

