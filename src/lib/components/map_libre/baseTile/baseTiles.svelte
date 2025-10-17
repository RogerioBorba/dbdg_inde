<script lang="ts">
    import { mapper } from '$lib/shared/map_libre/shared.svelte';
    import { onMount } from 'svelte';

    let currentBaseId: string | null = null;
    let camadaEscolhida = 'osm';

    const baseLayers: Record<string, { id: string; tiles: string }> = {
        none: {
            id: 'none',
            tiles: ''
        },
        osm: {
            id: 'base-osm',
            tiles: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
        },
        esri_world_street: {
            id: 'base-esri',
            tiles: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'
        }
    };

    function onChangeBaseLayer(event: Event) {
        const value = (event.currentTarget as HTMLInputElement).value;
        const baseLayer = baseLayers[value];
        console.log(`baseLayer: ${baseLayer}`);
        if (!baseLayer) return;

        // Remove a base atual, se houver
        if (currentBaseId && mapper?.map?.getLayer(currentBaseId)) {
            mapper.map.removeLayer(currentBaseId);
        }
        if (currentBaseId && mapper?.map?.getSource(currentBaseId)) {
            mapper.map.removeSource(currentBaseId);
        }

        // Adiciona nova base se não for "none"
        if (baseLayer.id !== 'none' && baseLayer.tiles) {
            addBaseLayer(baseLayer.id, baseLayer.tiles);
            currentBaseId = baseLayer.id;
        } else {
            currentBaseId = null;
        }
    }

    function addBaseLayer(id: string, urlTemplate: string) {
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
        const osmLayer = baseLayers['osm'];
        addBaseLayer(osmLayer.id, osmLayer.tiles);
        currentBaseId = osmLayer.id;
        camadaEscolhida = 'osm';
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
