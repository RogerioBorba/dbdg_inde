<script lang="ts">
    import { onMount } from 'svelte';
    import { get } from '#lib/request/get.js';
    import type { CSWCatalog } from '#lib/ogc/csw/CSWCatalog.js';

    let { catalog }: { catalog: CSWCatalog } = $props();

    let qtdMetadados = $state<number | null>(null);
    let isLoadingCount = $state(true);
    let countError = $state('');

    let startFromRecord = $state<number | null>(1);
    let maxRecordsToEvaluate = $state<number | null>(null);

    function buildResultUrl(): string {
        const params = new URLSearchParams({
            descricao: catalog.descricao,
            iri: catalog.iri
        });

        if (catalog.noCentralCategoria) {
            params.set('noCentralCategoria', catalog.noCentralCategoria);
        }

        if (startFromRecord && startFromRecord > 1) {
            params.set('startPosition', String(Math.floor(startFromRecord)));
        }

        if (maxRecordsToEvaluate && maxRecordsToEvaluate > 0) {
            params.set('maxRecords', String(Math.floor(maxRecordsToEvaluate)));
        }

        return `/ogc/csw/links-quebrados/result?${params.toString()}`;
    }

    onMount(async () => {
        try {
            const baseUrl = catalog.iri.split('?')[0];
            const url = new URL(baseUrl);
            url.searchParams.set('service', 'CSW');
            url.searchParams.set('version', '2.0.2');
            url.searchParams.set('request', 'GetRecords');
            url.searchParams.set('typeNames', 'csw:Record');
            url.searchParams.set('resultType', 'hits');
            url.searchParams.set('ElementSetName', 'brief');

            if (catalog.noCentralCategoria) {
                url.searchParams.set('constraintLanguage', 'CQL_TEXT');
                url.searchParams.set('CONSTRAINT_LANGUAGE_VERSION', '1.1.0');
                url.searchParams.set('constraint', `_cat = '${catalog.noCentralCategoria}'`);
            }

            const res = await get(url);
            const xmlText = await res.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'application/xml');
            const searchResults = xmlDoc.querySelector('SearchResults, csw\\:SearchResults');
            const matched = searchResults?.getAttribute('numberOfRecordsMatched');
            qtdMetadados = matched !== null && matched !== undefined ? parseInt(matched, 10) : 0;
        } catch {
            countError = 'Indisponível';
        } finally {
            isLoadingCount = false;
        }
    });
</script>

<article class="flex flex-col justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition">
    <div>
        <div class="flex items-start justify-between gap-2">
            <h2 class="font-bold text-gray-900 leading-snug">{catalog.descricao}</h2>
            {#if isLoadingCount}
                <span class="inline-flex items-center gap-1 text-[11px] text-gray-500 whitespace-nowrap">
                    <svg class="h-3.5 w-3.5 animate-spin text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span>contando...</span>
                </span>
            {:else if qtdMetadados !== null}
                <span class="rounded bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700 whitespace-nowrap dark:bg-blue-900/30 dark:text-blue-300">
                    {qtdMetadados.toLocaleString('pt-BR')} metadados
                </span>
            {:else}
                <span class="text-[11px] text-amber-600 font-medium">Total não obtido</span>
            {/if}
        </div>

        <p class="mt-1 break-all text-xs text-gray-500">{catalog.iri}</p>
        {#if catalog.noCentralCategoria}
            <p class="mt-0.5 text-xs text-gray-600"><span class="font-semibold">Categoria central:</span> {catalog.noCentralCategoria}</p>
        {/if}

        <!-- Filtro de Amostragem / Intervalo -->
        <div class="mt-3 rounded border border-gray-100 bg-gray-50/90 p-2.5 text-xs">
            <span class="font-semibold text-gray-700 block mb-1">Intervalo de avaliação:</span>
            <div class="grid grid-cols-2 gap-2">
                <div>
                    <label for="start-{catalog.id}" class="text-[10px] text-gray-500 block">A partir do registro:</label>
                    <input
                        id="start-{catalog.id}"
                        type="number"
                        min="1"
                        placeholder="Ex: 1"
                        bind:value={startFromRecord}
                        class="w-full rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                    />
                </div>
                <div>
                    <label for="max-{catalog.id}" class="text-[10px] text-gray-500 block">Quantidade:</label>
                    <input
                        id="max-{catalog.id}"
                        type="number"
                        min="1"
                        placeholder="Todos"
                        bind:value={maxRecordsToEvaluate}
                        class="w-full rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                    />
                </div>
            </div>

            <!-- Atalhos rápidos -->
            <div class="mt-2 flex items-center gap-1 flex-wrap">
                <span class="text-[10px] text-gray-400 mr-1">Atalhos:</span>
                <button
                    type="button"
                    class="rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] text-gray-600 hover:bg-gray-100"
                    onclick={() => { startFromRecord = 1; maxRecordsToEvaluate = 20; }}
                >
                    20
                </button>
                <button
                    type="button"
                    class="rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] text-gray-600 hover:bg-gray-100"
                    onclick={() => { startFromRecord = 1; maxRecordsToEvaluate = 50; }}
                >
                    50
                </button>
                <button
                    type="button"
                    class="rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] text-gray-600 hover:bg-gray-100"
                    onclick={() => { startFromRecord = 1; maxRecordsToEvaluate = 100; }}
                >
                    100
                </button>
                <button
                    type="button"
                    class="rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] text-gray-500 hover:bg-gray-100"
                    onclick={() => { startFromRecord = 1; maxRecordsToEvaluate = null; }}
                    title="Avaliar todo o catálogo"
                >
                    Todos
                </button>
            </div>
        </div>
    </div>

    <div class="mt-3 pt-2 border-t border-gray-100">
        <a
            class="inline-flex w-full items-center justify-center rounded bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
            href={buildResultUrl()}
        >
            Ver links quebrados
        </a>
    </div>
</article>
