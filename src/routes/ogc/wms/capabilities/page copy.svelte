<script lang="ts">
    import WMSLayerCard from '$lib/components/openlayers/wms/WMSLayerCard.svelte';
    import { onMount } from 'svelte';
    import { counterWMS } from '$lib/shared/ogc/wms/shared.svelte';
    import PdfHTML from "$lib/components/pdf/pdfHTML.svelte";   
    import { NavUl, NavHamburger, NavLi } from 'flowbite-svelte';
    import CsvWms from '$lib/components/csv/csvWMS.svelte';
    import PdfJsObject from '$lib/components/pdf/pdfJSObject.svelte';
    import type { IWMSCapabilities, IWMSLayer, iWMSLayers } from '$lib/ogc/wms/wmsCapabilities';


    let wmsLayers = $state<IWMSLayer[]>([]);
    let filteredWMSLayers = $state<IWMSLayer[]>([]);
    let textEntered = $state('');

    let withMetadadaChecked = $state(false);
    let withoutMetadadaChecked = $state(false);
    let withoutKeywordChecked = $state(false);
    let nameEqualTitleChecked = $state(false);
    
    onMount(async () => {
        let current = counterWMS.currentWMSCapability
        let i = 1
        if (!current)
            return
        console.log(current)
        wmsLayers = current.capability.layers;
        
    })
     
    function filterWMSLayers() {
        if (textEntered && textEntered.length >= 3) {
            wmsLayers.filter((e: IWMSLayer) => (e.title.toLowerCase().search(textEntered.toLowerCase()) > -1) || 
                              (e?.name?.toLowerCase().search(textEntered.toLowerCase()) > -1)
            )
        } else {

        }
    }

    $derived: {
        if (textEntered && textEntered.length >= 3) {
            filteredWMSLayers = wmsLayers.filter((e: IWMSLayer) => (e.title.toLowerCase().search(textEntered.toLowerCase()) > -1) || (e?.name.toLowerCase().search(textEntered.toLowerCase()) > -1))
            
        }
        else {
            filteredWMSLayers = [...wmsLayers]
        }    

        if (withoutMetadadaChecked) 
            filteredWMSLayers = filteredWMSLayers.filter((e: IWMSLayer) =>  e && e.metadataURLs.length == 0);
        
        if (withMetadadaChecked) 
            filteredWMSLayers = filteredWMSLayers.filter((e: IWMSLayer) => e.metadataURLs && e.metadataURLs().length > 0)
        
        if (withoutKeywordChecked)
            filteredWMSLayers = filteredWMSLayers.filter(e => !e.keywords || e.keywords.length == 0)
        
        if (nameEqualTitleChecked)
            filteredWMSLayers = filteredWMSLayers.filter(e => e.title== e.name)    
    }     
    


    //XML está em filteredWMS e eu estou criando objetos com as informações contidas nele 
    const xmlToArray = (filteredWMSLayers: IWMSLayer[]) => {
        let arrayToCSV: any = [];

        //let metadataLink = 'Sem metadado associado';
        let metadataLink: any[] = [];

        filteredWMSLayers.forEach((element: IWMSLayer) => {
            
            let name = element.name;
            let title = element.title;

            let style = element.styles? element.styles.map( st => st.title).toString() : '';
            
            let keywords = element.keywords? element.keywords.toString(): 'Não há palavras chaves';
   
            let crss = element.crs? element.crs.toString() : '';

            let metadados = element.metadataURLs;
            

            if(metadados){
                metadados.forEach(metadado => metadataLink = [...metadataLink,metadado.metadataObject.OnlineResource["@attributes"]["xlink:href"].toString()]);
               //metadataLink = metadados[0].metadataObject.OnlineResource["@attributes"]["xlink:href"].toString();
            }


            let obj = {['Nome'] : name,
            ['Título']: title,
            ['Palavras Chaves'] : keywords,
            ['Estilo'] : style,
            ['Crss'] : crss
            }

            let link_metadados;
            if(metadataLink.length === 1){
                link_metadados = metadataLink;
            }else if(metadataLink.length > 1){
                link_metadados = metadataLink.map(link => link).join('\n')
            }else{
                link_metadados = 'Sem metadado associado'
            }
            
            obj.Link_metadados = link_metadados;
           
            arrayToCSV = [...arrayToCSV, obj];
            //console.log(JSON.stringify(obj))
            metadataLink = [];
        })
        return arrayToCSV;
    }

</script>

<div>
    <div id="hideDiv" class="flex items-center">
        <div class="flex md:flex-row justify-start">
            <NavUl class="order-1">
                <NavLi href="/">Home</NavLi>
            </NavUl>
        </div>
        <input class="m-1 p-1 w-1/4 mr-2" type="text" bind:value={textEntered} placeholder="Digite para filtrar">
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
            <PdfJsObject listJsonObject = {wmsArrayToCSV} header={""} ></PdfJsObject>
            <CsvWms {wmsArrayToCSV}></CsvWms>
            
        </div>
    </div>
</div>
<div class = "m-2 grid gap-2 md:grid-cols-3 grid-cols-1">
    {#each filteredWMSLayers as wmsLayer}
   <!--    <WMSLayerCard wmsLayer={wmsLayer}></WMSLayerCard> -->
    {/each}    


</div>
