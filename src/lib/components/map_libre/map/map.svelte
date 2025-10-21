<script>
  import { onMount } from 'svelte';
  import maplibregl from 'maplibre-gl';
  import 'maplibre-gl/dist/maplibre-gl.css';
  import {mapper} from "$lib/shared/map_libre/shared.svelte";
  import { addBaseLayer, Osm } from '../map_libre';

  /**
     * @type {HTMLDivElement}
     */
  let mapContainer;

  onMount(() => {
   
    mapper.map = new maplibregl.Map({
      container: mapContainer,
      center: [-57.90, -16.9068], // Rio de Janeiro
      zoom: 3
    });
    addBaseLayer(mapper.map, Osm);
    // Adiciona controles de navegação
    //mapper.map.addControl(new maplibregl.NavigationControl(), 'top-right');
    // Cleanup ao desmontar o componente (com verificação)
    return () => {
      if (mapper.map && typeof mapper.map.remove === 'function') {
        try { mapper.map.remove(); } catch (e) { /* noop */ }
      }
    };
  });
</script>

<div bind:this={mapContainer} class="fixed top-0 left-0 inset-0  w-screen h-screen z-0 bg-white/50" aria-hidden="true" ></div>

<style>
  :global(body) {
    height: 100%;
    margin: 0;
  }

</style>