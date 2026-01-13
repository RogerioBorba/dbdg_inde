<script lang="ts">
    import WMSLayerCard from '$lib/components/openlayers/wms/WMSLayerCard.svelte';
    import { onMount } from 'svelte';
    import { counterWMS } from '$lib/shared/ogc/wms/shared.svelte';
    import CsvWms from '$lib/components/csv/csvWMS.svelte';
    import PdfJsObject from '$lib/components/pdf/pdfJSObject.svelte';
    import type { IWMSLayer,  IWMSMetadataURL } from '$lib/ogc/wms/wmsCapabilities';
    import type { ICSVLayer } from '$lib/components/csv/icsv';

    let wmsLayers = $state<IWMSLayer[]>([]);
    let textEntered = $state('');
    let metadataFilter = $state<'all' | 'with' | 'without'>('all'); // Radio button state
    let withoutKeywordChecked = $state(false);
    let nameEqualTitleChecked = $state(false);
    
    onMount(async () => {
        filteredWMSLayers = [...wmsLayers];
        let current = counterWMS.currentWMSCapability;
        if (!current)
            return
        wmsLayers = current.capability.layers;  
    });

    let filteredWMSLayers = $derived.by( () => {
        let filteredLayers: IWMSLayer[] = [];
        if (textEntered && textEntered.length >= 3) {
            filteredLayers = wmsLayers.filter((e: IWMSLayer) => 
                                (e.title?.toLowerCase().includes(textEntered?.toLowerCase() || '')) ||
                                (e.name?.toLowerCase().includes(textEntered?.toLowerCase() || '')))
        }
        else {
            filteredLayers = [...wmsLayers]
        }  
        
        // Aplica filtro de metadados baseado no radio button
        if (metadataFilter === 'without') {
            filteredLayers = filteredLayers.filter((e: IWMSLayer) => e && e.metadataURLs.length == 0);
        } else if (metadataFilter === 'with') {
            filteredLayers = filteredLayers.filter((e: IWMSLayer) => e.metadataURLs && e.metadataURLs.length > 0);
        }
        
        if (withoutKeywordChecked)
            filteredLayers = filteredLayers.filter((e: IWMSLayer) => !e.keywords || e.keywords.length == 0);
        if (nameEqualTitleChecked)
            filteredLayers = filteredLayers.filter((e: IWMSLayer) => e.title == e.name)   
        return filteredLayers;
    });


const xmlToArray = (filteredLayers: IWMSLayer[]): ICSVLayer[] => {
    const arrayToCSV: ICSVLayer[] = [];

    filteredLayers.forEach((element: IWMSLayer) => {
        const name = element.name || '';
        const title = element.title || '';

        const style = element.styles
            ? element.styles.map((st: any) => st.title).join(', ')
            : '';

        const keywords = element.keywords
            ? element.keywords.join(', ')
            : 'Não há palavras-chave';

        const crss = element.crs
            ? (Array.isArray(element.crs) ? element.crs.join(', ') : String(element.crs))
            : '';

        const metadados = element.metadataURLs || [];
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
                class="w-full md:w-96 p-2 rounded border border-gray-300" 
                type="text" 
                bind:value={textEntered} 
                placeholder="Digite para filtrar (mín. 3 caracteres)">
        </div>

        <!-- Filtros em grid responsivo -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-1 border-1 rounded p-2 border-gray-300">
            <!-- Radio buttons para metadados -->
            <div class="flex flex-col gap-1">
                <label class="flex items-center cursor-pointer">
                    <input 
                        class="mr-2" 
                        type="radio" 
                        name="metadata" 
                        value="all"
                        bind:group={metadataFilter}>
                    <span class="text-sm">Todos</span>
                </label>
                
                <label class="flex items-center cursor-pointer">
                    <input 
                        class="mr-2" 
                        type="radio" 
                        name="metadata" 
                        value="with"
                        bind:group={metadataFilter}>
                    <span class="text-sm">Com metadado</span>
                </label>
                
                <label class="flex items-center cursor-pointer">
                    <input 
                        class="mr-2" 
                        type="radio" 
                        name="metadata" 
                        value="without"
                        bind:group={metadataFilter}>
                    <span class="text-sm">Sem metadado</span>
                </label>
            </div>
            
            <!-- Checkboxes restantes -->
            <label class="flex items-center cursor-pointer">
                <input class="mr-2" type="checkbox" bind:checked={withoutKeywordChecked}>
                <span class="text-sm">Sem palavra chave</span>
            </label>
            
            <label class="flex items-center cursor-pointer">
                <input class="mr-2" type="checkbox" bind:checked={nameEqualTitleChecked}>
                <span class="text-sm">Nome igual ao título</span>
            </label>
        </div>

        <!-- Contador e botões de exportação -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
            <div>
                <p class="text-sm font-medium">
                    Quantidade de camadas: <span class="font-bold text-xl text-gray-700">{filteredWMSLayers.length}</span>
                </p>
            </div>
            <div class="flex gap-0">
                <PdfJsObject listJsonObject={wmsArrayToCSV}></PdfJsObject>
                <CsvWms wmsArrayToCSV={wmsArrayToCSV}></CsvWms>
            </div>
        </div>
    </div>
</div>

<!-- Grid de cards responsivo -->
<div class="m-2 grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {#each filteredWMSLayers as wmsLayer}
        <WMSLayerCard wmsLayer={wmsLayer}></WMSLayerCard>
    {/each}    
</div>