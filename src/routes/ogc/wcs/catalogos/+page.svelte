<script lang="ts">
    import Navbar from '$lib/components/navbar/navbar.svelte'
    import { preventDefault } from '$lib/components/svelte_util/util';
    import type { IGeoservicoDescricao } from '$lib/inde/catalogos/ICatalogoGeoservico';
    import { onMount } from 'svelte';
    import type { OGCProcessRecord } from '$lib/ogc/commom/OGCRecord';
    import WCSCatalogCard from '$lib/components/openlayers/wcs/WCSCatalogCard.svelte';
    interface Props {id: number, descricao: string, iri: string};
    let selectedItems = $state<Props[]>([]);
    let selectedCatalogs = $state<Props[]>([]);
    let checked = $state(false);
    let records: OGCProcessRecord[] = $state([]);
    let hiddenBtnCSV = $derived(  records.length == 0 ? 'hidden' : 'inline-flex');
    let i = 1;
    let nameCatalog = $state('');
    let adressCatalog = $state('');
    let qtdCatalog = $derived(selectedItems.length);
    let disableButtonAddNewCatalog = $derived( nameCatalog.length == 0 || adressCatalog.length == 0);
    let totalCoverages = $state(0);
    let totalCoveragesWithoutMetadata = $state(0);
    let countWCSProcessado = $state(0);
        
    const newObjIdDescricaoIRI = (obj: IGeoservicoDescricao) => {
        return { id: i++, descricao: obj.descricao, iri: obj.wcsGetCapabilities}
    }      

    let objIdDescricaoIRIArray = $state<Props[]>([]);
    
    const addNewCatalog = () => {
        let objIdDescricaoIRI = {id: objIdDescricaoIRIArray.length + 1, descricao: nameCatalog, iri: adressCatalog, noCentralCategoria: null}
        objIdDescricaoIRIArray = [...objIdDescricaoIRIArray, objIdDescricaoIRI]
        nameCatalog = ''
        adressCatalog = ''
    }
        
    const isChecking = () => {
        if (!checked) 
            selectedItems = [...objIdDescricaoIRIArray]
        else {
           
            i = 1
            selectedItems =[]
        }
        checked = !checked
    }
    
    async function btnSearchClicked() {
        if (selectedItems.length == 0)
            return alert( 'Escolha pelo menos uma instituição')
        selectedCatalogs = selectedCatalogs.concat(selectedItems)
        
    }

    onMount(async() => {
        try{
            const response = await fetch("/api/inde/catalogos-servicos");
            const data = await response.json();
            objIdDescricaoIRIArray = data.map(newObjIdDescricaoIRI);
        } catch (error) {
            console.error('Failed to fetch catalogos_servicos:', error);
        }
    })

    function escapeCSV(value: any) {
        if (value === null || value === undefined) return '""';
        const s = String(value);
        return '"' + s.replace(/"/g, '""') + '"';
    }

    function downloadCSV() {
        function dateNowAsString() {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
        }

        if (!records.length || records.length === 0) {
            return alert('Nenhum registro para exportar');
        }
        const header = [
            'tipo_de_servico',
            'operacao_do_servico',
            'data_e_hora_da_requisicao',
            'tempo_da_requisicao_em_segundos',
            'nome',
            'quantidade_de_coberturas',
            'quantidade_de_coberturas_sem_metadados_associados',
            'quantidade_de_coberturas_sem_palavras_chave',
            'url',
            'processadoSemErro'
        ];

        const rows = records.map(r => [
            r.serviceType,
            r.operation,
            r.datetime,
            r.requestTimeSeconds,
            r.name,
            r.numLayers,
            r.numLayersWithoutMetadata,
            r.numLayersWithoutKeywords,
            r.url,
            r.processadoSemErro
        ].map(escapeCSV).join(','));

        const csv = [header.map(escapeCSV).join(','), ...rows].join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `wcs_catalogs_${dateNowAsString()}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }
    // chamado por cada WCSCatalogCard quando um registro é criado
    function handleRecordCreated(record: OGCProcessRecord) {  
        records = [...records, record];
        totalCoverages += record.numLayers;
        totalCoveragesWithoutMetadata += record.numLayersWithoutMetadata;
        countWCSProcessado += 1;
    }
</script>
<Navbar brand="OGC/WCS Catálogos"></Navbar>
<form class="m-2">
    {@render counterWCSGlobal()}
    {@render selecionarInstituicoes()}
    {@render adiconarNovoWCSGetCapabilities()}
</form>
{@render exibirCards()}

{#snippet counterWCSGlobal()}
    <div class="flex items-center flex-col sm:flex-row mb-1 text-sm font-medium text-gray-900 dark:text-gray-400">
        <label for="instituicoes_multiple" class="mr-4">Escolha as instituições</label>
        <div>
            <input class="mr-1 rounded w-4 h-4 focus:outline-none border-gray-300" type="checkbox" {checked} onclick={isChecking}> 
            <span class="mr-2">selecione todos</span>
        </div>
        <button class="mr-4 focus:outline-none bg-grey-light hover:bg-grey font-bold rounded inline-flex items-center
         hover:bg-gray-100 disabled:cursor-not-allowed disabled:bg-gray-200" 
         disabled={selectedItems.length == 0} 
        onclick={preventDefault(btnSearchClicked)} title="Realizar requisição">
            <svg  class="text-indigo-500 fill-current border rounded border-gray-400" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="20" height="20" color='green' viewBox="0 0 24 24"><path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z" /></svg>
        </button>
       <button 
            class="{hiddenBtnCSV} mr-4 focus:outline-none bg-green-500 hover:bg-green-600 text-white font-bold rounded items-center px-3 py-1"
            onclick={preventDefault(downloadCSV)} 
            title="Exportar CSV">
            Exportar CSV ({records.length})
        </button>
        
        <p class="mr-2"> Quantidade de catálogos processados: {countWCSProcessado}/{qtdCatalog} </p>
        <p> Quantidade de coberturas sem metadados: {totalCoveragesWithoutMetadata}</p>
        <p class="ml-auto text-sm ">Qtd de coberturas: {totalCoverages}</p>
        
    </div>
{/snippet}
{#snippet selecionarInstituicoes()}
    <select size=6 multiple id="instituicoes_multiple" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" bind:value={selectedItems}>
        {#each objIdDescricaoIRIArray as obj}
            <option value={obj}>
                {obj.descricao}
            </option>
        {/each}
    </select>
{/snippet}
{#snippet adiconarNovoWCSGetCapabilities()}
    <div class="mt-2 w-full p1 flex flex-col md:flex-row">
        <input class="border-gray-300 focus:outline-none w-full rounded md:w-2/5 mr-1" type="text"  bind:value={nameCatalog} placeholder="Informe o nome do catálogo"> 
        <input class="border-gray-300 focus:outline-none rounded w-full md:w-2/5 mr-1" type="text"  bind:value={adressCatalog} placeholder="Informe o endereço/link WCS do GetCapabilities"> 
        <button class=" md:w-1/5 shadow-sm rounded bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 disabled:opacity-25" 
        onclick={preventDefault(addNewCatalog)} disabled={disableButtonAddNewCatalog}>Adicionar novo catálogo</button>
    </div>
{/snippet}
{#snippet exibirCards()}
    <div class="m-2 grid gap-2 md:grid-cols-3 grid-cols-1">
        {#each selectedCatalogs as objIdDescricaoIri (objIdDescricaoIri.id)}
            <WCSCatalogCard objIdDescricaoIri={objIdDescricaoIri} onRecordCreated={handleRecordCreated} />
        {/each}
</div>
{/snippet}
