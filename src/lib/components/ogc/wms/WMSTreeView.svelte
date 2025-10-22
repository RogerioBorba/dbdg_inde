<script lang="ts">
    import type { IWMSLayer } from './wmsLayer';
    import { mapper } from '$lib/shared/map_libre/shared.svelte';
    import Self from './WMSTreeView.svelte';

    let { wmsLayer, capabilitiesUrl } = $props<{
        wmsLayer: IWMSLayer;
        capabilitiesUrl: string;
    }>();

    let expanded = $state(false);

    function addLayerToMap(layer: IWMSLayer) {
        const map = mapper.map;
        if (!map || !layer.name) {
            alert('Mapa não inicializado ou camada sem nome.');
            return;
        }

        const sourceId = `wms-source-${layer.name}`;
        const layerId = `wms-layer-${layer.name}`;

        if (map.getLayer(layerId) || map.getSource(sourceId)) {
            alert(`A camada "${layer.title}" já foi adicionada.`);
            return;
        }

        const baseUrl = capabilitiesUrl.split('?')[0];
        const params = new URLSearchParams({
            SERVICE: 'WMS',
            VERSION: '1.3.0',
            REQUEST: 'GetMap',
            LAYERS: layer.name,
            STYLES: '',
            FORMAT: 'image/png',
            TRANSPARENT: 'true',
            CRS: 'EPSG:3857'
        });

        const tileUrl = `${baseUrl}?${params.toString()}&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256`;

        try {
            map.addSource(sourceId, {
                type: 'raster',
                tiles: [tileUrl],
                tileSize: 256,
                attribution: layer.attribution ?? `Fonte: ${new URL(baseUrl).hostname}`
            });

            map.addLayer(
                {
                    id: layerId,
                    type: 'raster',
                    source: sourceId,
                    paint: {}
                },
                map.getStyle().layers.find((l) => l.type === 'symbol')?.id
            );

        } catch (e: any) {
            console.error('Erro ao adicionar camada WMS:', e);
            alert(`Não foi possível adicionar a camada: ${e?.message ?? e}`);
        }
    }

    function viewMetadata(layer: IWMSLayer) {
        const metadataUrl = layer.metadataURLs?.[0]?.url;
        if (metadataUrl) {
            window.open(metadataUrl, '_blank', 'noopener,noreferrer');
        } else {
            alert('Nenhuma URL de metadado encontrada para esta camada.');
        }
    }
</script>

<div class="ml-2 border-l border-gray-200 pl-2">
    <div class="flex items-center justify-between py-1">
        <div class="flex items-center">
            {#if wmsLayer.children && wmsLayer.children.length > 0}
                <button
                    type="button"
                    class="mr-1 text-gray-500 p-1 rounded"
                    onclick={() => (expanded = !expanded)}
                    aria-label={expanded ? 'Recolher' : 'Expandir'}
                >
                    <svg class="w-4 h-4 transition-transform" class:rotate-90={expanded} viewBox="0 0 24 24">
                        <path fill="currentColor" d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" />
                    </svg>
                </button>
            {:else}
                <span class="w-4 h-4 mr-1"></span>
            {/if}
            <span class="text-sm text-gray-800">{wmsLayer.title}</span>
        </div>

        <!-- Botões sempre visíveis; metadado só aparece se existir; incluir aparece somente se layer.name -->
        <div class="flex items-center space-x-1">
            {#if wmsLayer.metadataURLs && wmsLayer.metadataURLs.length > 0}
                <button
                    type="button"
                    class="p-1 text-gray-600 hover:bg-gray-200 rounded-full"
                    title="Visualizar Metadado"
                    onclick={() => viewMetadata(wmsLayer)}
                    aria-label="Visualizar metadado"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" style="width:16px;height:16px" fill="#FCF3CF" viewBox="0 0 24 24" >
			            <path stroke="#1C2833" stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
		            </svg>
                </button>
            {/if}

            {#if wmsLayer.name && wmsLayer.name.trim().length > 0}
                <button
                    type="button"
                    class="p-1 text-green-600 hover:bg-green-200 rounded-full"
                    title="Adicionar camada ao mapa"
                    onclick={() => addLayerToMap(wmsLayer)}
                    aria-label="Adicionar camada ao mapa"
                >
                    <!-- ícone 'layers' (stack) -->
                    <svg xmlns="http://www.w3.org/2000/svg" style="width:16px;height:16px" viewBox="0 0 24 24" fill="currentColor">
						<path d="M12,16L19.36,10.27L21,9L12,2L3,9L4.63,10.27M12,18.54L4.62,12.81L3,14.07L12,21.07L21,14.07L19.37,12.8L12,18.54Z" />
					</svg>
                </button>
			
            {/if}
        </div>
    </div>

    {#if expanded && wmsLayer.children}
        <div>
            {#each wmsLayer.children as childLayer}
                <Self wmsLayer={childLayer} {capabilitiesUrl} />
            {/each}
        </div>
    {/if}
</div>