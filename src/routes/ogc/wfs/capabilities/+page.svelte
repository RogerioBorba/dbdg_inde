<script lang="ts">
    import WFSFeatureTypeCard from '$lib/components/openlayers/wfs/WFSFeatureTypeCard.svelte';
    import { onMount } from 'svelte';
    import { counterWFS } from '$lib/shared/ogc/wfs/shared.svelte';
    import CsvWfs from '$lib/components/csv/csvWFS.svelte';
    import PdfJsObject from '$lib/components/pdf/pdfJSObject.svelte';
    import type { IFeatureType, IMetadataUrl } from '$lib/ogc/wfs/wfsCapabilities';
    import type { ICSVLayer } from '$lib/components/csv/icsv';

    let wfsFeatureTypes = $state<IFeatureType[]>([]);
    let textEntered = $state('');
    let metadataFilter = $state<'all' | 'with' | 'without'>('all'); // Radio button state
    let withoutKeywordChecked = $state(false);
    let nameEqualTitleChecked = $state(false);
    
    onMount(async () => {
        let current = counterWFS.currentCapability;
        if (!current)
            return
        wfsFeatureTypes = current.featureTypes;  
    });

    let filteredFeatureTypes = $derived.by( () => {
        let filteredLayers: IFeatureType[] = [];
        if (textEntered && textEntered.length >= 3) {
            filteredLayers = wfsFeatureTypes.filter((e: IFeatureType) => 
                                (e.title?.toLowerCase().includes(textEntered?.toLowerCase() || '')) ||
                                (e.name?.toLowerCase().includes(textEntered?.toLowerCase() || '')))
        }
        else {
            filteredLayers = [...wfsFeatureTypes]
        }  
        
        // Aplica filtro de metadados baseado no radio button
        if (metadataFilter === 'without') {
            filteredLayers = filteredLayers.filter((e: IFeatureType) => !e.metadataURLs || e.metadataURLs.length == 0);
        } else if (metadataFilter === 'with') {
            filteredLayers = filteredLayers.filter((e: IFeatureType) => e.metadataURLs && e.metadataURLs.length > 0);
        }
        
        if (withoutKeywordChecked)
            filteredLayers = filteredLayers.filter((e: IFeatureType) => !e.keywords || e.keywords.length == 0);
        if (nameEqualTitleChecked)
            filteredLayers = filteredLayers.filter((e: IFeatureType) => e.title == e.name)   
        return filteredLayers;
    });


const xmlToArray = (filteredLayers: IFeatureType[]): ICSVLayer[] => {
    const arrayToCSV: ICSVLayer[] = [];

    filteredLayers.forEach((element: IFeatureType) => {
        const name = element.name || '';
        const title = element.title || '';
        const abstract = element.abstract || '';

        const keywords = element.keywords
            ? element.keywords.join(', ')
            : 'Não há palavras-chave';

        const crs = element.defaultCRS || '';

        const metadados = element.metadataURLs || [];
        const link_metadados = metadados.length > 0
            ? metadados.map((metadataURL: IMetadataUrl) => metadataURL.href).join('\n')
            : 'Sem metadado associado';

        const obj: ICSVLayer = {
            Nome: name,
            Título: title,
            Resumo: abstract,
            'Palavras Chaves': keywords,
            CRS: crs,
            link_metadados: link_metadados
        };

        arrayToCSV.push(obj);
    });
    return arrayToCSV;
};
let wfsArrayToCSV = $derived.by(() => xmlToArray(filteredFeatureTypes));
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
            
            <!-- Checkboxes restantes -->
            <label class="flex items-center cursor-pointer">
                <input class="mr-2" type="checkbox" bind:checked={withoutKeywordChecked}>
                <span class="text-sm dark:text-gray-300">Sem palavra chave</span>
            </label>
            
            <label class="flex items-center cursor-pointer">
                <input class="mr-2" type="checkbox" bind:checked={nameEqualTitleChecked}>
                <span class="text-sm dark:text-gray-300">Nome igual ao título</span>
            </label>
        </div>

        <!-- Contador e botões de exportação -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
            <div>
                <p class="text-sm font-medium dark:text-gray-300">
                    Quantidade de tipos de feições: <span class="font-bold text-xl text-gray-700 dark:text-gray-100">{filteredFeatureTypes.length}</span>
                </p>
            </div>
            <div class="flex gap-0">
                <PdfJsObject listJsonObject={wfsArrayToCSV}></PdfJsObject>
                <CsvWfs wfsArrayToCSV={wfsArrayToCSV}></CsvWfs>
            </div>
        </div>
    </div>
</div>

<!-- Grid de cards responsivo -->
<div class="m-2 grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {#each filteredFeatureTypes as featureType (featureType.name)}
        <WFSFeatureTypeCard {featureType}></WFSFeatureTypeCard>
    {/each}    
</div>
