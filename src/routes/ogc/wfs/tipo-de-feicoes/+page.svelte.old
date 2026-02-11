<script>
    import {catalogos_servicos} from '$lib/inde/CatalogoINDE'
    import {countTotalSchemaTypeFeatureWFS, countWFSSchemaProcessado} from '$lib/store/storeWFS'
    import Navbar from '$lib/component/base/navbar.svelte'
    import WFSSchemaDescribeFeatureTypeCard from '$lib/component/wfs/WFSSchemaDescribeFeatureTypeCard.svelte';
  import { onMount } from 'svelte';
    
    let selectedItems = [] // {id: number, descricao: string, iri: string}[];
    let selectedCatalogs = []
     let checked = false
    let i = 1
    let instituicaoText = ''
    let nameCatalog = ''
    let adressCatalog =''
    let disableButtonAddNewCatalog = true
    $: qtdCatalog = selectedItems.length
    $:  disableButtonAddNewCatalog = (nameCatalog.length == 0 || adressCatalog.length == 0)? true: false
    const newObjIdDescricaoIRI = (obj) => {
        if(!obj.wfsGetCapabilities)
            return null
        const partes_url = obj.wfsGetCapabilities.split('?');
        const parteAntesDaInterrogacao = partes_url[0];
        const url = `${parteAntesDaInterrogacao}?service=wfs&version=2.0.0&request=GetCapabilities`
        return { id: i++, descricao: obj.descricao, iri: url}
    }      


    let objIdDescricaoIRIArray = [];
    //let objIdDescricaoIRIArray = catalogos_servicos.map( (obj) => newObjIdDescricaoIRI(obj)).filter((obj)=> obj != null );
    
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
                const response = await fetch("/api/inde/catalogos-servicos")
                const data = await response.json();
                objIdDescricaoIRIArray = data.map((obj) => newObjIdDescricaoIRI(obj)).filter((obj)=> obj != null );
            } catch (error) {
                console.error('Failed to fetch catalogos_servicos:', error);
            }
        })
</script>
<Navbar brand="OGC/WFS Esquemas das feições"></Navbar>
<form class="m-2">
    <div class="flex items-center flex-col sm:flex-row mb-1 text-sm font-medium text-gray-900 dark:text-gray-400">
        <label for="instituicoes_multiple" class="mr-4">Escolha as instituições</label>
        <div>
            <input class="mr-1 rounded w-4 h-4 focus:outline-none border-gray-300" type="checkbox" {checked} on:click={isChecking}> 
            <span class="mr-2">selecione todos</span>
        </div>
        <button class="mr-4 focus:outline-none bg-grey-light hover:bg-grey font-bold rounded inline-flex items-center hover:bg-gray-100" on:click|preventDefault={btnSearchClicked} title="Realizar requisição">
            <svg  class="text-indigo-500 fill-current border rounded border-gray-400" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="20" height="20" color='green' viewBox="0 0 24 24"><path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z" /></svg>
        </button>
        <p class="mr-2"> Quantidade de catálogos processados: {$countWFSSchemaProcessado}/{qtdCatalog} </p>
        <p class="ml-auto text-sm ">Qtd total de tipo de feição: {$countTotalSchemaTypeFeatureWFS}</p>
        
    </div>
    <select size=6 multiple id="instituicoes_multiple" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" bind:value={selectedItems}>
        {#each objIdDescricaoIRIArray as obj}   
            <option value={obj}>
                {obj.descricao}
            </option>
        {/each}
    </select>
    <div class="mt-2 w-full p1 flex flex-col md:flex-row">
        <input class="border-gray-300 focus:outline-none w-full rounded md:w-2/5 mr-1" type="text"  bind:value={nameCatalog} placeholder="Informe o nome do catálogo"> 
        <input class="border-gray-300 focus:outline-none rounded w-full md:w-2/5 mr-1" type="text"  bind:value={adressCatalog} placeholder="Informe o endereço/link WMS do GetCapabilities"> 
        <button class=" md:w-1/5 shadow-sm rounded bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 disabled:opacity-25" on:click|preventDefault={addNewCatalog} disabled={disableButtonAddNewCatalog}>Adicionar novo catálogo</button>
    </div>
</form>
<div class = "m-2 grid gap-2 md:grid-cols-3 grid-cols-1">
       
        {#each selectedCatalogs as objIdDescricaoIri}
            <WFSSchemaDescribeFeatureTypeCard objIdDescricaoIri={objIdDescricaoIri} ></WFSSchemaDescribeFeatureTypeCard>
        {/each}
</div>