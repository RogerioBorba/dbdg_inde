<script lang="ts">
    import { onMount } from "svelte";
    import Map from "$lib/components/openlayers/map/map.svelte"
    import Sidebar from "$lib/components/sidebar/sidebar.svelte";
    import ExpansionPanel from "$lib/components/expansionpanel/ExpansionPanel.svelte";
    import BaseTiles from "$lib/components/openlayers/baseTiles/baseTiles.svelte";
    import TabWMS from "$lib/components/openlayers/wms/TabWMS.svelte";
    import TabWFS from "$lib/components/openlayers/wfs/TabWFS.svelte";
    import BaseSelectedLayer from '$lib/components/openlayers/selectLayers/selectLayers.svelte'
  
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
    <ExpansionPanel header={"WMS - buscar camadas nos geosserviços"}>
		{#snippet svg()}
        <svg  class=" text-green-500 fill-current h-6 w-6" viewBox="0 0 24 24">
          <path d="M19.31 18.9C19.75 18.21 20 17.38 20 16.5C20 14 18 12 15.5 12S11 14 11 16.5 13 21 15.5 21C16.37 21 17.19 20.75 17.88 20.32L21 23.39L22.39 22L19.31 18.9M15.5 19C14.12 19 13 17.88 13 16.5S14.12 14 15.5 14 18 15.12 18 16.5 16.88 19 15.5 19M9.59 19.2L3 14.07L4.62 12.81L9 16.22C9 16.32 9 16.41 9 16.5C9 17.46 9.22 18.38 9.59 19.2M4.63 10.27L3 9L12 2L21 9L19.36 10.27L18.65 10.82C17.72 10.3 16.64 10 15.5 10C12.79 10 10.46 11.68 9.5 14.05L4.63 10.27Z" />
        </svg>
	    {/snippet}
		<TabWMS></TabWMS>
	</ExpansionPanel>
  <ExpansionPanel header={"WFS - buscar feições nos geosserviços"}>
		{#snippet svg()}
		  <svg  class=" text-blue-500 fill-current h-6 w-6" viewBox="0 0 24 24">
			  <path d="M19.31 18.9C19.75 18.21 20 17.38 20 16.5C20 14 18 12 15.5 12S11 14 11 16.5 13 21 15.5 21C16.37 21 17.19 20.75 17.88 20.32L21 23.39L22.39 22L19.31 18.9M15.5 19C14.12 19 13 17.88 13 16.5S14.12 14 15.5 14 18 15.12 18 16.5 16.88 19 15.5 19M9.59 19.2L3 14.07L4.62 12.81L9 16.22C9 16.32 9 16.41 9 16.5C9 17.46 9.22 18.38 9.59 19.2M4.63 10.27L3 9L12 2L21 9L19.36 10.27L18.65 10.82C17.72 10.3 16.64 10 15.5 10C12.79 10 10.46 11.68 9.5 14.05L4.63 10.27Z" />
		  </svg>
		{/snippet}
		<TabWFS></TabWFS>  
	</ExpansionPanel>
  <ExpansionPanel header={"Camadas selecionadas"}>
		{#snippet svg()}
		  <svg  class=" text-purple-500 fill-current h-6 w-6" viewBox="0 0 24 24">
			<path fill-rule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z" clip-rule="evenodd" />
		  </svg>
		{/snippet}
		<BaseSelectedLayer/>
		
	</ExpansionPanel>
</Sidebar>
<Map></Map>

