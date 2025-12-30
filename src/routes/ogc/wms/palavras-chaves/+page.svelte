<script lang="ts">
    import { listToCSV } from '$lib/components/csv/gerarCSV';

    
    import Navbar from '$lib/components/navbar/navbar.svelte';
    import {dataToPdf} from '$lib/components/pdf/gerarPDF'
    import { preventDefault } from '$lib/components/svelte_util/util';
    import type { IGeoservicoDescricao } from '$lib/inde';
    import { iWMSCapabilities, type IWMSLayer } from '$lib/ogc/wms/wmsCapabilities';
    import { get } from '$lib/request/get';
    import { FileCsvSolid, FilePdfSolid } from 'flowbite-svelte-icons';
    import { all } from 'ol/events/condition';
    import { onMount } from 'svelte';
    let selectedItems = $state<{id: number, descricao: string, iri: string}[]>([]);
    interface IdDescricaoIRI {id: number, descricao: string, iri: string};
    let objIdDescricaoIRIArray = $state<IdDescricaoIRI[]>([]);
    let checked = $state(false);
    let nameCatalog = $state('');
    let adressCatalog = $state('');
    let disableButtonAddNewCatalog = $derived( nameCatalog.length == 0 || adressCatalog.length == 0);
    let keywordCountByName = $state<Record<string, number>>({});
    let allKeywords: string[] = $state([]);
    let countWMSProcessado = $state(0);
    let countTotalLayer = $state(0);
    let isProcessing = $state(false);
    
    async function processLayersRequested(wmsLayers: IWMSLayer[]) {
        countTotalLayer += wmsLayers.length;
        countWMSProcessado += 1;
        const todasKeywords = wmsLayers.flatMap((layer: IWMSLayer) => layer.keywords);
        allKeywords = allKeywords.concat(todasKeywords);
        for (let i = 0; i < todasKeywords.length; i++) {
            let keyword = todasKeywords[i];
            let value = keywordCountByName[keyword];
            if (value) 
                keywordCountByName[keyword] = value + 1;
            else 
                keywordCountByName[keyword] = 1;
        }
    };
    
    async function processRequestForSelectedItems(objIdDescricaoIri: IdDescricaoIRI) {
        try {
            const res = await get(objIdDescricaoIri.iri);
            const xmlText = await res.text();
            const wmsCapabilities = iWMSCapabilities(xmlText);
            const wmsLayers: IWMSLayer[] = wmsCapabilities.capability.layers;
            await processLayersRequested(wmsLayers);
        } catch (error) {
            console.error('Failed to process WMS for', objIdDescricaoIri.descricao, error);
        }
    }
    
    async function btnSearchClicked() {
        if (selectedItems.length == 0)
            return alert('Escolha pelo menos uma instituição');
        
        // Reset contadores
        countWMSProcessado = 0;
        countTotalLayer = 0;
        keywordCountByName = {};
        allKeywords = [];
        isProcessing = true;
        
        // Executar todas as requisições em paralelo
        await Promise.all(
            selectedItems.map(item => processRequestForSelectedItems(item))
        );
        
        isProcessing = false;
    }

    function isChecking() {
        checked = !checked;
        selectedItems = checked ? [...objIdDescricaoIRIArray] : [];
    }
    
    function addNewCatalog() {
        let objIdDescricaoIRI = {id: objIdDescricaoIRIArray.length + 1, descricao: nameCatalog, iri: adressCatalog}
        objIdDescricaoIRIArray = [...objIdDescricaoIRIArray, objIdDescricaoIRI]
        nameCatalog = ''
        adressCatalog = ''
    }

    function newObjIdDescricaoIRI(obj: IGeoservicoDescricao, idx: number) {
        return { id: idx, descricao: obj.descricao, iri: obj.wmsGetCapabilities}
    }
    
    onMount(async() => {
        try {
            const response = await fetch("/api/inde/catalogos-servicos")
            const data = await response.json();
            let i = 1;
            objIdDescricaoIRIArray = data.map((obj: IGeoservicoDescricao) => newObjIdDescricaoIRI(obj, i++));
        } catch (error) {
            console.error('Failed to fetch catalogos_servicos:', error);
        }
    });
    
    function btnPDFClicked() {
        const sortedKeywords = Object.entries(keywordCountByName)
            .sort((a, b) => b[1] - a[1])
            .map(([keyword, count]) => ({ keyword, count }));
        dataToPdf(sortedKeywords, 'palavras_chaves_wms.pdf');
    };
    function btnCSVClicked() {
        const keywordArray = Object.entries(keywordCountByName)
            .map(([keyword, count]) => ({ keyword, count }));
        return listToCSV(keywordArray,'palavras_chaves_wms.csv');
        
    };
</script>

<Navbar brand="OGC/WMS Checker"></Navbar>
<form class="m-2">
    <!-- Filtro de instituições -->
    <div class="flex items-center flex-col sm:flex-row mb-1 text-sm font-medium text-gray-900 dark:text-gray-400">
        <label for="instituicoes_multiple" class="mr-4">Escolha as instituições</label>
        <div>
            <input class="mr-1 rounded w-4 h-4 focus:outline-none border-gray-300" type="checkbox" {checked}
             onclick={preventDefault(isChecking)} > 
            <span class="mr-2">selecione todos</span>
        </div>
        <button class="mr-4 focus:outline-none bg-grey-light hover:bg-grey font-bold rounded inline-flex items-center hover:bg-gray-100" 
        onclick={preventDefault(btnSearchClicked)} title="Realizar requisição" disabled={selectedItems.length == 0 || isProcessing}>
            <svg class="text-indigo-500 fill-current border rounded border-gray-400" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="20" height="20" color='green' viewBox="0 0 24 24"><path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z" /></svg>
        </button>
        <p class="mr-2"> Quantidade de catálogos processados: {countWMSProcessado}/{selectedItems.length} </p>
        {#if isProcessing}
            <p class="mr-2 text-blue-600 font-semibold">Processando...</p>
        {/if}
        <p class="ml-auto text-sm">Qtd de camadas: {countTotalLayer}</p>
        <p class="ml-auto text-sm">Qtd de palavras chaves: {allKeywords.length}</p>
        <!-- Botões de exportação -->
        <div class="flex gap-0">
            <button 
                class="ml-4 focus:outline-none bg-grey-light hover:bg-grey font-bold rounded inline-flex items-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-200" 
                disabled={allKeywords.length == 0} 
                onclick={preventDefault(() => {btnPDFClicked();})} 
                title="Gerar PDF com todas as palavras chaves">
                <FilePdfSolid class="h-6 w-6 text-red-500 dark:text-purple-300 shrink-0 disabled:text-gray-400"/>
            </button>
            <button 
                class="ml-4 focus:outline-none bg-grey-light hover:bg-grey font-bold rounded inline-flex items-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-200" 
                disabled={allKeywords.length == 0} 
                onclick={preventDefault(() => {btnCSVClicked();})} 
                title="Gerar CSV com todas as palavras chaves">
                <FileCsvSolid class="h-6 w-6 text-green-500 dark:text-green-500 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-200"/>
            </button>    

        </div>
    </div>
    <!--lista de instituições-->
    <select size=6 multiple id="instituicoes_multiple" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
        bind:value={selectedItems}>
            {#each objIdDescricaoIRIArray as obj}   
                <option value={obj}>
                    {obj.descricao}
                </option>
            {/each}
    </select>
    <!--adicionar novo catálogo(nome e url)-->
    <div class="mt-2 w-full p1 flex flex-col md:flex-row">
        <input class="border-gray-300 focus:outline-none w-full rounded md:w-2/5 mr-1" type="text" bind:value={nameCatalog} placeholder="Informe o nome do catálogo"> 
        <input class="border-gray-300 focus:outline-none rounded w-full md:w-2/5 mr-1" type="text" bind:value={adressCatalog} placeholder="Informe o endereço/link WMS do GetCapabilities"> 
        <button class="md:w-1/5 shadow-sm rounded bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 disabled:opacity-25" 
        onclick={preventDefault(addNewCatalog)} disabled={disableButtonAddNewCatalog}>Adicionar novo catálogo</button>
    </div>
</form>
<!--exibir palavras chaves-->
<div class="">
    <div class="m-2 grid gap-2 md:grid-cols-4 grid-cols-2">
        {#each Object.entries(keywordCountByName) as keyCount, i (i)}
            <div class="p-2 bg-gray-200 text-gray-800 rounded-md shadow-sm hover:shadow-md flex flex-col break-words text-sm text-left">
                <h2><span class="font-semibold">{keyCount[0]}:</span> {keyCount[1]}</h2>
            </div>
        {/each}   
    </div> 
</div>