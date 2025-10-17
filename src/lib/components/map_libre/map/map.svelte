<script>
  import { onMount } from 'svelte';
  import maplibregl from 'maplibre-gl';
  import 'maplibre-gl/dist/maplibre-gl.css';
  import {current_styler, mapper} from "$lib/shared/map_libre/shared.svelte";
  /**
     * @type {HTMLDivElement}
     */
  let mapContainer;

  onMount(() => {
    mapper.map = new maplibregl.Map({
      container: mapContainer,
      style: current_styler.style,
      center: [-43.1729, -22.9068], // Rio de Janeiro
      zoom: 12
    });

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