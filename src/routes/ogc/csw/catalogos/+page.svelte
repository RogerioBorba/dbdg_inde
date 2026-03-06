<script lang="ts">

    import {catalogos_csw, type ICatalogoCSW} from '$lib/inde/catalogos/ICatalogoGeoservico';
    import Navbar from '$lib/components/navbar/navbar.svelte';
    import { onMount } from 'svelte';
    import { preventDefault } from '$lib/components/svelte_util/util';
    import CSWCatalogCard from '$lib/components/ogc/csw/CSWCatalogCard.svelte';
    let countMetadata =$state(0);
    let countProcessado = $state(0);
    interface Id_Descricao_IRI_NoCentralCategoria {id: number, descricao: string, iri: string, noCentralCategoria: string | null};
    
    let selectedItems: Id_Descricao_IRI_NoCentralCategoria[] = $state([]); 
    let selectedCatalogs: Id_Descricao_IRI_NoCentralCategoria[]= $state([])
    let checked = $state(false);
    let i = 1;
    let nameCatalog = $state('');
    let adressCatalog =$state('');
    let disableButtonAddNewCatalog = $state(true);
    let qtdCatalog = $derived(selectedItems.length);
    let objIdDescricaoIRINoCentralCategoriaArray = $state<Id_Descricao_IRI_NoCentralCategoria[]>([]);
    
    function newObjIdDescricaoIRINoCentralCategoria(obj: ICatalogoCSW): Id_Descricao_IRI_NoCentralCategoria {
    
        return { id: i++, descricao: obj.descricao, iri: obj.cswGetCapabilities, noCentralCategoria: obj.noCentralCategoria }
    }      
    
    function addNewCatalog()  {
        const objIdDescricaoIRI: Id_Descricao_IRI_NoCentralCategoria = {id: objIdDescricaoIRINoCentralCategoriaArray.length + 1, descricao: nameCatalog, iri: adressCatalog, noCentralCategoria: null}
        objIdDescricaoIRINoCentralCategoriaArray = [...objIdDescricaoIRINoCentralCategoriaArray, objIdDescricaoIRI]
        nameCatalog = ''
        adressCatalog = ''
    }
        
    function isChecking() {
        if (!checked) 
            selectedItems = [...objIdDescricaoIRINoCentralCategoriaArray]
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
        //for (const idTextIRI of selectedItems) {}  
    }

    function handleMetadadoProcessado(record: any) {
        countProcessado = countProcessado + 1;
        countMetadata = countMetadata + record.qtdMetadados;
    }

    onMount(async() => {
        objIdDescricaoIRINoCentralCategoriaArray = catalogos_csw.map( (obj: any) => 
            newObjIdDescricaoIRINoCentralCategoria(obj));
    }); 
</script>
<Navbar brand="OGC/CSW Checker"></Navbar>
<form class="m-2">
    <div class="flex items-center flex-col sm:flex-row mb-1 text-sm font-medium text-gray-900 dark:text-gray-400">
        <label for="instituicoes_multiple" class="mr-4">Escolha as instituições</label>
        <div>
            <input class="mr-1 rounded w-4 h-4 focus:outline-none border-gray-300" 
            type="checkbox" {checked} onclick={isChecking}> 
            <span class="mr-2">selecione todos</span>
        </div>
        <button class="mr-4 focus:outline-none bg-grey-light hover:bg-grey font-bold rounded inline-flex items-center hover:bg-gray-100" 
        onclick={preventDefault(btnSearchClicked)} title="Realizar requisição">
            <svg  class="text-indigo-500 fill-current border rounded border-gray-400" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="20" height="20" color='green' viewBox="0 0 24 24"><path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z" /></svg>
        </button>
        <p class="mr-2"> Quantidade de catálogos processados por selecionados: {countProcessado}/{qtdCatalog} </p>
        <p> Quantidade de metadados: {countMetadata}</p>
        
    </div>
    <select size=6 multiple id="instituicoes_multiple" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" bind:value={selectedItems}>
        {#each objIdDescricaoIRINoCentralCategoriaArray as obj}   
            <option value={obj}>
                {obj.descricao}
            </option>
        {/each}
    </select>
    <div class="mt-2 w-full p1 flex flex-col md:flex-row">
        <input class="border-gray-300 focus:outline-none w-full rounded md:w-2/5 mr-1" type="text"  bind:value={nameCatalog} placeholder="Informe o nome do catálogo"> 
        <input class="border-gray-300 focus:outline-none rounded w-full md:w-2/5 mr-1" type="text"  bind:value={adressCatalog} placeholder="Informe o endereço CSW do GetCapabilities"> 
        <button class=" md:w-1/5 shadow-sm rounded bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 disabled:opacity-25" 
            onclick={preventDefault(addNewCatalog)} disabled={disableButtonAddNewCatalog}>Adicionar novo catálogo
        </button>
    </div>
</form>
<div class = "m-2 grid gap-2 md:grid-cols-3 grid-cols-1">
       
        {#each selectedCatalogs as objIdDescricaoIri}
           <CSWCatalogCard id_descricao_iri_noCentralCategoria={objIdDescricaoIri} onMetadaddoProcessado={handleMetadadoProcessado} ></CSWCatalogCard>
        {/each}
    

</div>