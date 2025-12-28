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
    let withMetadadaChecked = $state(false);
    let withoutMetadadaChecked = $state(false);
    let withoutKeywordChecked = $state(false);
    let nameEqualTitleChecked = $state(false);
    let wmsArrayToCSV: ICSVLayer[];

    
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
        if (withoutMetadadaChecked) 
             filteredLayers = filteredLayers.filter((e: IWMSLayer) =>  e && e.metadataURLs.length == 0);
        if (withMetadadaChecked) 
            filteredLayers = filteredLayers.filter((e: IWMSLayer) => e.metadataURLs && e.metadataURLs.length > 0);
        if (withoutKeywordChecked)
            filteredLayers = filteredLayers.filter((e: IWMSLayer) => !e.keywords || e.keywords.length == 0);
        if (nameEqualTitleChecked)
            filteredLayers = filteredLayers.filter((e: IWMSLayer) => e.title== e.name)   
        
        wmsArrayToCSV = xmlToArray(filteredLayers);
        return filteredLayers;
    });

    

const xmlToArray = (filteredLayers: IWMSLayer[]): ICSVLayer[] => {
    const arrayToCSV: ICSVLayer[] = [];

    filteredLayers.forEach((element: IWMSLayer) => {
        const name = element.name || '';
        const title = element.title || '';

        // Trata `styles` como array ou retorna string vazia
        const style = element.styles
            ? element.styles.map((st: any) => st.title).join(', ')
            : '';

        // Trata `keywords` como array ou retorna mensagem padrão
        const keywords = element.keywords
            ? element.keywords.join(', ')
            : 'Não há palavras-chave';

        // Trata `crs` como array ou string, ou retorna string vazia
        const crss = element.crs
            ? (Array.isArray(element.crs) ? element.crs.join(', ') : String(element.crs))
            : '';

        // Trata `metadataURLs` como array ou retorna mensagem padrão
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


</script>

<div>
    <div id="hideDiv" class="flex items-center">
        <div class="flex md:flex-row justify-start">  
           <span class="font-semibold mr-4">
                <a href="/">Home</a>
            </span>    
        </div>
        <input class="m-1 p-1 w-1/4 mr-2 rounded" type="text" bind:value={textEntered} placeholder="Digite para filtrar">
        <div class="flex items-center">
            <input class="mr-2" type="checkbox" bind:checked={withMetadadaChecked}>
            <span class="mr-2 whitespace-nowrap text-sm">Com metadado associado</span>
        </div>
        <div class="flex items-center">
            <input class="mr-2" type="checkbox" bind:checked={withoutMetadadaChecked}>
            <span class="mr-2 whitespace-nowrap text-sm">Sem metadado associado</span>
        </div>
        <div class="flex items-center">
            <input class="mr-2" type="checkbox" bind:checked={withoutKeywordChecked}>
            <span class="mr-2 whitespace-nowrap text-sm">Sem palavra chave</span>
        </div>
        <div class="flex items-center">
            <input class="mr-2" type="checkbox" bind:checked={nameEqualTitleChecked}>
            <span class="mr-4 whitespace-nowrap text-sm">Nome igual ao título</span>
        </div>
        <div>
            <p class="whitespace-nowrap text-sm">Qtd : {filteredWMSLayers.length}</p>
        </div>
        <div class="flex ml-2 space-x-0">
            <PdfJsObject listJsonObject = {wmsArrayToCSV}></PdfJsObject>
            <CsvWms wmsArrayToCSV ={wmsArrayToCSV}></CsvWms>
        </div>
    </div>
</div>
<div class = "m-2 grid gap-2 md:grid-cols-3 grid-cols-1">
    {#each filteredWMSLayers as wmsLayer}
        <WMSLayerCard wmsLayer={wmsLayer}></WMSLayerCard>
    {/each}    


</div>
