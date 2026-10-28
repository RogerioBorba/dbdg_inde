<script lang="ts">
    import WMSLayerCard from '#lib/components/openlayers/wms/WMSLayerCard.svelte';
    import { onMount } from 'svelte';
    import { counterWMS } from '#lib/shared/ogc/wms/shared.svelte.js';
    import CsvWms from '#lib/components/csv/csvWMS.svelte';
    import PdfJsObject from '#lib/components/pdf/pdfJSObject.svelte';
    import Navbar from '#lib/components/navbar/navbar.svelte';
    import type { IWMSLayer, IWMSMetadataURL } from '#lib/ogc/wms/wmsCapabilities.js';
    import type { ICSVLayer } from '#lib/components/csv/icsv.js';

    let wmsLayers = $state<IWMSLayer[]>([]);
    let textEntered = $state('');
    let metadataFilter = $state<'all' | 'with' | 'without'>('all');
    let withoutKeywordChecked = $state(false);
    let nameEqualTitleChecked = $state(false);
    
    onMount(() => {
        let current = counterWMS.currentWMSCapability;
        if (!current) return;
        wmsLayers = current.capability.layers || [];
    });

    let serviceTitle = $derived(counterWMS.currentWMSCapability?.service?.title || '');
    let serviceAbstract = $derived(counterWMS.currentWMSCapability?.service?.abstract || '');

    function layerHasMetadata(layer: IWMSLayer): boolean {
        return Boolean(
            layer.metadataURLs &&
            layer.metadataURLs.length > 0 &&
            layer.metadataURLs.some((m) => Boolean(m && m.href && m.href.trim().length > 0))
        );
    }

    let filteredWMSLayers = $derived.by(() => {
        let filteredLayers: IWMSLayer[] = [];
        if (textEntered && textEntered.trim().length >= 3) {
            const query = textEntered.trim().toLowerCase();
            filteredLayers = wmsLayers.filter((e: IWMSLayer) => 
                (e.title?.toLowerCase().includes(query)) ||
                (e.name?.toLowerCase().includes(query))
            );
        } else {
            filteredLayers = [...wmsLayers];
        }  
        
        // Aplica filtro de metadados baseado no pill selecionado
        if (metadataFilter === 'without') {
            filteredLayers = filteredLayers.filter((e: IWMSLayer) => !layerHasMetadata(e));
        } else if (metadataFilter === 'with') {
            filteredLayers = filteredLayers.filter((e: IWMSLayer) => layerHasMetadata(e));
        }
        
        if (withoutKeywordChecked) {
            filteredLayers = filteredLayers.filter((e: IWMSLayer) => !e.keywords || e.keywords.length === 0);
        }
        if (nameEqualTitleChecked) {
            filteredLayers = filteredLayers.filter((e: IWMSLayer) => Boolean(e.name && e.title && e.name.trim() === e.title.trim()));
        }

        return filteredLayers;
    });

    // Contagens gerais baseadas no catálogo carregado
    let totalLayersCount = $derived(wmsLayers.length);
    let withMetadataCount = $derived(wmsLayers.filter(layerHasMetadata).length);
    let withoutMetadataCount = $derived(totalLayersCount - withMetadataCount);
    let withoutKeywordCount = $derived(wmsLayers.filter((e) => !e.keywords || e.keywords.length === 0).length);
    let nameEqualTitleCount = $derived(wmsLayers.filter((e) => Boolean(e.name && e.title && e.name.trim() === e.title.trim())).length);

    const xmlToArray = (filteredLayers: IWMSLayer[]): ICSVLayer[] => {
        const arrayToCSV: ICSVLayer[] = [];

        filteredLayers.forEach((element: IWMSLayer) => {
            const name = element.name || '';
            const title = element.title || '';

            const style = element.styles
                ? element.styles.map((st: any) => st.title || st.name).filter(Boolean).join(', ')
                : '';

            const keywords = element.keywords && element.keywords.length > 0
                ? element.keywords.join(', ')
                : 'Não há palavras-chave';

            const crss = element.crs
                ? (Array.isArray(element.crs) ? element.crs.join(', ') : String(element.crs))
                : '';

            const metadados = (element.metadataURLs || []).filter(
                (m: IWMSMetadataURL) => Boolean(m && m.href && m.href.trim().length > 0)
            );
            const link_metadados = metadados.length > 0
                ? metadados.map((metadataURL: IWMSMetadataURL) => metadataURL.href).join('\n')
                : 'Sem metadado associado';

            const obj: ICSVLayer = {
                Nome: name,
                Título: title,
                'Palavras Chaves': keywords,
                Estilo: style,
                Crss: crss,
                link_metadados: link_metadados
            };

            arrayToCSV.push(obj);
        });
        return arrayToCSV;
    };

    let wmsArrayToCSV = $derived.by(() => xmlToArray(filteredWMSLayers));
</script>

<Navbar />

<main class="min-h-screen bg-gray-50 p-4 transition-colors md:p-6 dark:bg-gray-950">
    <div class="mx-auto max-w-7xl space-y-5">
        <!-- Navegação Breadcrumb & Ações Exportar -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <nav class="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                <a href="/" class="hover:text-blue-600 hover:underline">Home</a>
                <span>/</span>
                <a href="/ogc/wms/catalogos" class="hover:text-blue-600 hover:underline">WMS Catálogos</a>
                <span>/</span>
                <span class="text-gray-900 dark:text-gray-100 font-semibold">Capabilities</span>
            </nav>

            <!-- Botões de exportação (PDF / CSV) -->
            <div class="flex items-center gap-1">
                <PdfJsObject listJsonObject={wmsArrayToCSV} />
                <CsvWms {wmsArrayToCSV} />
            </div>
        </div>

        <!-- Título do Serviço / Instituição se disponível -->
        {#if serviceTitle}
            <div class="border-b border-gray-200 pb-3 dark:border-gray-800">
                <h1 class="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                    {serviceTitle}
                </h1>
                {#if serviceAbstract}
                    <p class="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {serviceAbstract}
                    </p>
                {/if}
            </div>
        {/if}

        <!-- Filtros e Barra de Busca (estilo conformidade-mgb) -->
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div class="relative flex-1">
                <input 
                    type="text" 
                    bind:value={textEntered} 
                    placeholder="Filtrar camadas por título ou nome técnico (mín. 3 caracteres)..."
                    class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
            </div>

            <!-- Filtros de Status (Pill buttons estilo conformidade-mgb) -->
            <div class="flex flex-wrap items-center gap-1.5">
                <button
                    type="button"
                    class="rounded-lg px-3 py-1.5 text-xs font-semibold transition {metadataFilter === 'all' ? 'bg-gray-800 text-white dark:bg-white dark:text-gray-900' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'}"
                    onclick={() => (metadataFilter = 'all')}
                >
                    Todos ({totalLayersCount})
                </button>
                <button
                    type="button"
                    class="rounded-lg px-3 py-1.5 text-xs font-semibold transition {metadataFilter === 'with' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300'}"
                    onclick={() => (metadataFilter = 'with')}
                >
                    Com Metadado ({withMetadataCount})
                </button>
                <button
                    type="button"
                    class="rounded-lg px-3 py-1.5 text-xs font-semibold transition {metadataFilter === 'without' ? 'bg-rose-700 text-white' : 'bg-rose-50 text-rose-800 hover:bg-rose-100 dark:bg-rose-950/50 dark:text-rose-300'}"
                    onclick={() => (metadataFilter = 'without')}
                >
                    Sem Metadado ({withoutMetadataCount})
                </button>
                <button
                    type="button"
                    class="rounded-lg px-3 py-1.5 text-xs font-semibold transition {withoutKeywordChecked ? 'bg-amber-700 text-white' : 'bg-amber-50 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300'}"
                    onclick={() => (withoutKeywordChecked = !withoutKeywordChecked)}
                >
                    Sem Palavra-chave ({withoutKeywordCount})
                </button>
                <button
                    type="button"
                    class="rounded-lg px-3 py-1.5 text-xs font-semibold transition {nameEqualTitleChecked ? 'bg-indigo-700 text-white' : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-300'}"
                    onclick={() => (nameEqualTitleChecked = !nameEqualTitleChecked)}
                >
                    Nome = Título ({nameEqualTitleCount})
                </button>
            </div>
        </div>

        <!-- Indicador de quantidade filtrada -->
        <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>
                Exibindo <strong class="text-gray-800 dark:text-gray-200">{filteredWMSLayers.length}</strong> de <strong class="text-gray-800 dark:text-gray-200">{totalLayersCount}</strong> camada(s)
            </span>
        </div>

        <!-- Conteúdo dos Cards ou Avisos -->
        {#if !counterWMS.currentWMSCapability}
            <div class="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                <p class="font-semibold text-base mb-1">Nenhum serviço WMS carregado na memória</p>
                <p class="text-sm text-amber-700 dark:text-amber-300 mb-3">
                    Acesse a listagem de catálogos e selecione uma instituição para visualizar as camadas.
                </p>
                <a href="/ogc/wms/catalogos" class="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700 transition">
                    Ir para Catálogos WMS
                </a>
            </div>
        {:else if filteredWMSLayers.length === 0}
            <div class="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                Nenhuma camada corresponde aos filtros selecionados.
            </div>
        {:else}
            <!-- Grid de cards responsivo -->
            <div class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {#each filteredWMSLayers as wmsLayer (wmsLayer.name || wmsLayer.title || wmsLayer)}
                    <WMSLayerCard {wmsLayer} />
                {/each}    
            </div>
        {/if}
    </div>
</main>
