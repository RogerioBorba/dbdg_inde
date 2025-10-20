<script lang="ts">
    import { mapper } from '$lib/shared/map_libre/shared.svelte';
    import { onMount } from 'svelte';
    import { addBaseLayer, Osm, recordTileLayer } from '../map_libre';

    let currentBaseId: string | null = $state(null);
    let camadaEscolhida = $state('osm');

    
    function onChangeBaseLayer(event: Event) {
        const tileName = (event.currentTarget as HTMLInputElement).value;
        const baseLayer = recordTileLayer[tileName];
         if (!mapper.map) return;

        // Remove base atual se existir
        if (currentBaseId && mapper.map.getLayer(currentBaseId)) {
            mapper.map.removeLayer(currentBaseId);
        }
        if (currentBaseId && mapper.map.getSource(currentBaseId)) {
            mapper.map.removeSource(currentBaseId);
        }

        // Se for "none", não adiciona nada
        if (baseLayer.id === 'none') {
            currentBaseId = null;
            return;
        }
        // Adiciona nova base se não for "none"
        if (baseLayer.id !== 'none' && baseLayer.tiles) {
            addBaseLayer(mapper.map, baseLayer);
            currentBaseId = baseLayer.id;
        }       
        
    }

    function addBaseLayer1(id: string, urlTemplate: string) {
        if (!mapper.map) return;
        mapper.map.addSource(id, {
            type: 'raster',
            tiles: [urlTemplate],
            tileSize: 256
        });
        mapper.map.addLayer({
            id,
            type: 'raster',
            source: id,
            paint: {}
        });
    }

    onMount(() => {
        // Adiciona OSM como camada inicial
        // quando o mapa carregar, adiciona a camada OSM inicial
        camadaEscolhida = 'osm';
        const osmLayer = recordTileLayer['osm'];        
        //addBaseLayer(osmLayer.id, osmLayer.tiles[0]);
        currentBaseId = osmLayer.id;
        
        
    });
</script>

{#snippet camada(titulo: string, valor: string)}
    <div class="mt-1">
        <input
            type="radio"
            bind:group={camadaEscolhida}
            value={valor}
            onchange={onChangeBaseLayer}
        />
        {titulo}
    </div>
{/snippet}

<div class="flex flex-col text-justify text-sm pl-4 whitespace-nowrap">
    {@render camada('Sem camada base', 'none')}
    {@render camada('Camada base OpenStreetMap', 'osm')}
    {@render camada('Camada base Esri World Street', 'esri_world_street')}
</div>
