<script lang="ts">
    import Navbar from '$lib/components/navbar/navbar.svelte';
    import { listToCSV } from '$lib/components/csv/gerarCSV';
    import { dataToPdf } from '$lib/components/pdf/gerarPDF';
    import { preventDefault } from '$lib/components/svelte_util/util';
    import { FileCsvSolid, FilePdfSolid } from 'flowbite-svelte-icons';
    import { wfsFeatureTypesData } from '$lib/shared/ogc/wfs/shared.svelte';
    import { get } from '$lib/request/get';
    import type { PageData } from './$types';
    import { onMount } from 'svelte';

    interface Property {
        name: string;
        type: string;
        minOccurs?: number;
        maxOccurs?: number | string;
    }

    interface FeatureTypeDetail {
        name: string;
        title: string;
        abstract?: string;
        properties: Property[];
        isLoading?: boolean;
        error?: string;
    }

    let filterErrors = $state(false);
    let catalogName = $derived(wfsFeatureTypesData.catalogName);
    let capabilitiesUrl = $derived(wfsFeatureTypesData.capabilitiesUrl);
    let featureTypes = $state<FeatureTypeDetail[]>([]);
    let isLoadingProperties = $state(true);
    let statusMessageLoadProps = $derived(isLoadingProperties ? 'Carregando informações dos atributos...' : 'Informações dos atributos carregadas');    
    let allProperties = $derived.by(() => {
        return featureTypes.flatMap(ft => ft.properties || []);
    });

    let filteredFeatureTypes = $derived.by(() => {
        if (!filterErrors) {
            return featureTypes;
        }
        return featureTypes.filter(ft => 
            ft.properties && ft.properties.some(prop => hasSpecialChar(prop.name))
        );
    });

    let totalFeatureTypes = $derived(filteredFeatureTypes.length);
    let processedCount = $derived.by(() => {
        return featureTypes.filter(ft => !ft.isLoading && !ft.error).length;
    });
    let processedPercentage = $derived.by(() => {
        if (featureTypes.length === 0) return 0;
        return Math.round((processedCount / featureTypes.length) * 100);
    });

    function hasSpecialChar(text: string): boolean {
        const regex = /[^\w_]/;
        return regex.test(text.trim());
    }

    async function describeFeatureType(featureTypeName: string, capabilitiesUrl: string): Promise<Property[]> {
        try {
            const baseUrl = capabilitiesUrl.split('?')[0];
            const url = new URL(baseUrl);
            url.searchParams.set('service', 'WFS');
            url.searchParams.set('version', '2.0.0');
            url.searchParams.set('request', 'DescribeFeatureType');
            url.searchParams.set('typeName', featureTypeName);
            url.searchParams.set('outputFormat', 'application/json');

            const res = await get(url);
            const json = await res.json();

            const properties: Property[] = [];
            if (json.featureTypes && Array.isArray(json.featureTypes)) {
                const ft = json.featureTypes[0];
                if (ft.properties && Array.isArray(ft.properties)) {
                    ft.properties.forEach((prop: any) => {
                        properties.push({
                            name: prop.name || prop.localName || '',
                            type: prop.type || prop.typeName || 'Unknown',
                            minOccurs: prop.minOccurs ?? 0,
                            maxOccurs: prop.maxOccurs ?? '*'
                        });
                    });
                }
            }
            return properties;
        } catch (error) {
            console.error(`Error describing feature type ${featureTypeName}:`, error);
            return [];
        }
    }

    async function loadFeatureTypeProperties(): Promise<void> {
        const sourceFeatureTypes = wfsFeatureTypesData.featureTypes;
        if (!sourceFeatureTypes || sourceFeatureTypes.length === 0) {
            isLoadingProperties = false;
            return;
        }

        // Inicializar featureTypes com dados base
        featureTypes = sourceFeatureTypes.map(ft => ({
            name: ft.name,
            title: ft.title,
            abstract: ft.abstract,
            properties: [],
            isLoading: true
        }));

        // Carregar propriedades para cada feature type
        const promises = featureTypes.map(async (ft, idx) => {
            try {
                const properties = await describeFeatureType(ft.name, capabilitiesUrl);
                featureTypes[idx].properties = properties;
                featureTypes[idx].isLoading = false;
            } catch (error) {
                featureTypes[idx].error = error instanceof Error ? error.message : 'Erro desconhecido';
                featureTypes[idx].isLoading = false;
            }
        });

        await Promise.all(promises);
        isLoadingProperties = false;
    }

    function btnPDFClicked(): void {
        const pdfData = filteredFeatureTypes.map(ft => ({
            "Tipo de feição": ft.name,
            "Título": ft.title,
            "Quantidade de atributos": ft.properties ? ft.properties.length : 0,
            ...Object.fromEntries(
                (ft.properties || []).map(p => [
                    p.name,
                    `${p.type}[${p.minOccurs ?? '0'}..${p.maxOccurs ?? '*'}]`
                ])
            )
        }));
        dataToPdf(pdfData, 'esquemas-feicoes.pdf');
    }

    function btnCSVClicked(): void {
        const csvData = filteredFeatureTypes.flatMap(ft =>
            (ft.properties || []).map(p => ({
                "Tipo de Feição": ft.name,
                "Atributo": p.name,
                "Tipo": p.type,
                "MinOccurs": p.minOccurs ?? '0',
                "MaxOccurs": p.maxOccurs ?? '*'
            }))
        );
        listToCSV(csvData, 'esquemas-feicoes.csv');
    }

    onMount(async () => {
        await loadFeatureTypeProperties();
    });
</script>

<Navbar brand="Esquemas das Feições - Atributos"></Navbar>

<div class="m-4">
    <!-- Header -->
    <div class="flex flex-col md:flex-row items-center justify-between mb-4">
        <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{catalogName}</h1>
            <p class="text-gray-600 dark:text-gray-400">
                Total de tipos de feição: {totalFeatureTypes}
            </p>
        </div>
        <a href="/ogc/wfs/tipo-de-feicoes" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium">
            ← Voltar
        </a>
    </div>

    <!-- Progress Bar -->
    <div class="mb-4">
        <p class="text-center font-semibold text-blue-600 mb-2">{statusMessageLoadProps}</p>
        <div class="w-full bg-gray-200 rounded-full h-2">
            <div
                class="bg-blue-600 h-2 rounded-full transition-all"
                style="width: {processedPercentage}%"
            ></div>
        </div>
        <p class="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
            {processedCount}/{featureTypes.length} ({processedPercentage}%)
        </p>
    </div>

    <!-- Export Buttons and Filter -->
    <div class="flex flex-col md:flex-row gap-3 mb-4 md:items-center">
        <div class="flex gap-2">
            <button
                class="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                onclick={preventDefault(() => btnPDFClicked())}
                title="Exportar para PDF"
            >
                <FilePdfSolid class="h-5 w-5" />
                PDF
            </button>
            <button
                class="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                onclick={preventDefault(() => btnCSVClicked())}
                title="Exportar para CSV"
            >
                <FileCsvSolid class="h-5 w-5" />
                CSV
            </button>
        </div>
        <!--<label class="flex items-center gap-2 ml-auto">
            <input type="checkbox" bind:checked={filterErrors} class="w-4 h-4 cursor-pointer" />
            <span class="text-sm text-gray-600 dark:text-gray-400">Filtrar feições com erros</span>
        </label>
        -->
    </div>

    <!-- Feature Types Grid -->
    <div class="bg-amber-100 grid gap-4 md:grid-cols-3 grid-cols-1">
        {#each filteredFeatureTypes as featureType (featureType.name)}
            <div class="border border-gray-300 rounded-lg p-4 bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="font-semibold text-lg text-gray-900 dark:text-white flex-1">
                        {featureType.name}
                    </h3>
                    {#if featureType.isLoading}
                        <div class="animate-spin h-5 w-5 text-blue-500 ml-2 flex-shrink-0"></div>
                    {/if}
                </div>

                {#if featureType.error}
                    <div class="text-red-600 dark:text-red-400 text-sm mb-2">
                        <strong>Erro:</strong> {featureType.error}
                    </div>
                {:else}
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {featureType.title}
                    </p>
                    {#if featureType.abstract}
                        <p class="text-xs text-gray-500 dark:text-gray-400 mb-2 italic">{featureType.abstract}</p>
                    {/if}
                    <p class="text-xs text-gray-500 dark:text-gray-500 mb-3 font-medium">
                        <strong>Quantidade de atributos:</strong> {featureType.properties ? featureType.properties.length : 0}
                    </p>

                    {#if featureType.properties && featureType.properties.length > 0}
                        <div class="space-y-1 text-xs max-h-64 overflow-y-auto">
                            {#each featureType.properties as property (property.name)}
                                <div class="text-gray-700 dark:text-gray-300 font-mono bg-gray-50 dark:bg-gray-700 p-1 rounded">
                                    <span class="font-semibold text-blue-600 dark:text-blue-400">
                                        {property.name}
                                    </span>
                                    <span class="text-gray-500">: {property.type}</span>
                                    <span class="text-gray-400">
                                        [{property.minOccurs ?? '0'}..{property.maxOccurs ?? '*'}]
                                    </span>
                                </div>
                            {/each}
                        </div>
                    {:else if !featureType.isLoading}
                        <p class="text-gray-500 dark:text-gray-400 text-xs italic">Nenhum atributo disponível</p>
                    {:else}
                        <p class="text-gray-400 dark:text-gray-500 text-xs italic">Carregando atributos...</p>
                    {/if}
                {/if}
            </div>
        {/each}
    </div>

    {#if filteredFeatureTypes.length === 0 && !isLoadingProperties }
        <div class="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>Nenhuma feição com erros encontrada</p>
        </div>
    {/if}

    {#if featureTypes.length === 0 && !isLoadingProperties}
        <div class="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>Nenhum tipo de feição encontrado</p>
        </div>
    {/if}
</div>