<script lang="ts">
    import WCSCoverageCard from '$lib/components/ogc/wcs/WCSCoverageCard.svelte';
    import { onMount } from 'svelte';
    import { counterWCS } from '$lib/shared/ogc/wcs/shared.svelte';
    import CsvWcs from '$lib/components/csv/csvWCS.svelte';
    import PdfJsObject from '$lib/components/pdf/pdfJSObject.svelte';
    import type { IWCSCoverageDescription, IWCSMetadataURL } from '$lib/ogc/wcs/wcsCapabilities';
    import type { ICSVLayer } from '$lib/components/csv/icsv';
    import { loadCoverageDetails } from '$lib/ogc/wcs/wcsDescribeCoverage';

    let wcsCoverages = $state<IWCSCoverageDescription[]>([]);
    let textEntered = $state('');
    let metadataFilter = $state<'all' | 'with' | 'without'>('all');
    let withoutKeywordChecked = $state(false);
    let identifierEqualTitleChecked = $state(false);
    // null representa uma resposta concluída sem estimativa disponível.
    let coverageSizesMB = $state<Record<string, number | null>>({});
    
    onMount(async () => {
        let current = counterWCS.currentWCSCapability;
        if (!current)
            return
        wcsCoverages = current.summary?.coverages || [];
        if (!current.serviceUrl) return;
        for (const coverage of wcsCoverages) {
            void loadCoverageDetails(
                current.serviceUrl,
                current.describeCoverageUrl,
                current.version,
                coverage.identifier
            ).then((details) => {
                coverageSizesMB = {
                    ...coverageSizesMB,
                    [coverage.identifier]: details.estimatedSizeMB ?? null
                };
            }).catch(() => {
                coverageSizesMB = { ...coverageSizesMB, [coverage.identifier]: null };
            });
        }
    });

    let filteredCoverages = $derived.by( () => {
        let filteredItems: IWCSCoverageDescription[] = [];
        if (textEntered && textEntered.length >= 3) {
            filteredItems = wcsCoverages.filter((e: IWCSCoverageDescription) => 
                                (e.title?.toLowerCase().includes(textEntered?.toLowerCase() || '')) ||
                                (e.identifier?.toLowerCase().includes(textEntered?.toLowerCase() || '')))
        }
        else {
            filteredItems = [...wcsCoverages]
        }  
        
        // Aplica filtro de metadados baseado no radio button
        if (metadataFilter === 'without') {
            filteredItems = filteredItems.filter((e: IWCSCoverageDescription) => !e.metadataURLs || e.metadataURLs.length == 0);
        } else if (metadataFilter === 'with') {
            filteredItems = filteredItems.filter((e: IWCSCoverageDescription) => e.metadataURLs && e.metadataURLs.length > 0);
        }
        
        if (withoutKeywordChecked)
            filteredItems = filteredItems.filter((e: IWCSCoverageDescription) => !e.keywords || e.keywords.length == 0);
        if (identifierEqualTitleChecked)
            filteredItems = filteredItems.filter((e: IWCSCoverageDescription) => e.title == e.identifier)   
        return filteredItems;
    });

    let filteredCoverageSizeSummary = $derived.by(() => {
        const results = filteredCoverages
            .filter((coverage) => Object.prototype.hasOwnProperty.call(coverageSizesMB, coverage.identifier))
            .map((coverage) => coverageSizesMB[coverage.identifier]);
        const totalMB = results.reduce((total, size) => total + (size || 0), 0);
        return {
            totalGB: totalMB / 1000,
            resolved: results.length,
            unavailable: results.filter((size) => size === null).length
        };
    });

    function gigabytes(value: number) {
        if (value > 0 && value < 0.001) return '< 0,001';
        return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 }).format(value);
    }


const xmlToArray = (filteredItems: IWCSCoverageDescription[]): ICSVLayer[] => {
    const arrayToCSV: ICSVLayer[] = [];

    filteredItems.forEach((element: IWCSCoverageDescription) => {
        const identifier = element.identifier || '';
        const title = element.title || '';
        const abstract = element.abstract || '';

        const keywords = element.keywords
            ? element.keywords.join(', ')
            : 'Não há palavras-chave';

        const crs = element.nativeCRS || '';
        const formats = element.formats ? element.formats.join(', ') : '';

        const metadados = element.metadataURLs || [];
        const link_metadados = metadados.length > 0
            ? metadados.map((metadataURL: IWCSMetadataURL) => metadataURL.href).join('\n')
            : 'Sem metadado associado';

        const obj: ICSVLayer = {
            Identificador: identifier,
            Título: title,
            Resumo: abstract,
            'Palavras Chaves': keywords,
            'CRS Nativo': crs,
            Formatos: formats,
            link_metadados: link_metadados
        };

        arrayToCSV.push(obj);
    });
    return arrayToCSV;
};
let wcsArrayToCSV = $derived.by(() => xmlToArray(filteredCoverages));
</script>
<div>
    <!-- Container de filtros responsivo -->
    <div id="hideDiv" class="p-2 md:p-3">
        <!-- Link Home -->
        <div class="mb-2 md:mb-3">
            <span class="font-semibold">
                <a href="/">Home</a>
            </span>    
        </div>

        <!-- Input de busca em linha separada no mobile -->
        <div class="mb-2">
            <input 
                class="w-full md:w-96 p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white" 
                type="text" 
                bind:value={textEntered} 
                placeholder="Digite para filtrar (mín. 3 caracteres)">
        </div>

        <!-- Filtros em grid responsivo -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-1 border rounded p-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800">
            <!-- Radio buttons para metadados -->
            <div class="flex flex-col gap-1">
                <label class="flex items-center cursor-pointer">
                    <input 
                        class="mr-2" 
                        type="radio" 
                        name="metadata" 
                        value="all"
                        bind:group={metadataFilter}>
                    <span class="text-sm dark:text-gray-300">Todos</span>
                </label>
                
                <label class="flex items-center cursor-pointer">
                    <input 
                        class="mr-2" 
                        type="radio" 
                        name="metadata" 
                        value="with"
                        bind:group={metadataFilter}>
                    <span class="text-sm dark:text-gray-300">Com metadado</span>
                </label>
                
                <label class="flex items-center cursor-pointer">
                    <input 
                        class="mr-2" 
                        type="radio" 
                        name="metadata" 
                        value="without"
                        bind:group={metadataFilter}>
                    <span class="text-sm dark:text-gray-300">Sem metadado</span>
                </label>
            </div>            
            <label class="flex items-center cursor-pointer">
                <input class="mr-2" type="checkbox" bind:checked={withoutKeywordChecked}>
                <span class="text-sm dark:text-gray-300">Sem palavra chave</span>
            </label>
            
            <label class="flex items-center cursor-pointer">
                <input class="mr-2" type="checkbox" bind:checked={identifierEqualTitleChecked}>
                <span class="text-sm dark:text-gray-300">Identificador igual ao título</span>
            </label>
        </div>

        <!-- Contador e botões de exportação -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
            <div class="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-6">
                <p class="text-sm font-medium dark:text-gray-300">
                    Quantidade de coberturas: <span class="font-bold text-xl text-gray-700 dark:text-gray-100">{filteredCoverages.length}</span>
                </p>
                <p class="text-sm font-medium dark:text-gray-300">
                    Tamanho total estimado:
                    <span class="font-bold text-xl text-blue-700 dark:text-blue-300">{gigabytes(filteredCoverageSizeSummary.totalGB)} GB</span>
                    {#if filteredCoverageSizeSummary.resolved < filteredCoverages.length}
                        <span class="text-xs text-gray-500 dark:text-gray-400">
                            (calculando {filteredCoverageSizeSummary.resolved}/{filteredCoverages.length})
                        </span>
                    {:else if filteredCoverageSizeSummary.unavailable > 0}
                        <span class="text-xs text-amber-700 dark:text-amber-300">
                            (parcial: {filteredCoverageSizeSummary.unavailable} sem estimativa)
                        </span>
                    {/if}
                </p>
            </div>
            <div class="flex gap-0">
                <PdfJsObject listJsonObject={wcsArrayToCSV}></PdfJsObject>
                <CsvWcs wcsArrayToCSV={wcsArrayToCSV}></CsvWcs>
            </div>
        </div>
    </div>
</div>

<!-- Grid de cards responsivo -->
<div class="m-2 grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {#each filteredCoverages as coverage (coverage.identifier)}
        <WCSCoverageCard
            {coverage}
            serviceUrl={counterWCS.currentWCSCapability?.serviceUrl}
            operationUrl={counterWCS.currentWCSCapability?.describeCoverageUrl}
            version={counterWCS.currentWCSCapability?.version}
        ></WCSCoverageCard>
    {/each}    
</div>
