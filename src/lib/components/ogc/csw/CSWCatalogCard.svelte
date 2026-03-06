<script lang="ts">
    import { Spinner} from 'flowbite-svelte';
    import { goto } from '$app/navigation';
    import { fade } from 'svelte/transition'
    import { onMount } from 'svelte';
    import { get } from "$lib/request/get";
    import { preventDefault } from '$lib/components/svelte_util/util';
    interface Id_Descricao_IRI_NoCentralCategoria {id: number, descricao: string, iri: string, noCentralCategoria: string | null};
    let { id_descricao_iri_noCentralCategoria, onMetadaddoProcessado }: 
    {id_descricao_iri_noCentralCategoria: Id_Descricao_IRI_NoCentralCategoria, onMetadaddoProcessado?: (record: any) => void} = $props();
    let tempoRequisicao = $state(0);
    let qtdMetadados = $state(0)
    let qtdMetadadosComWMS = $state(0)
    let qtdMetadadosComWFS = $state(0)
    let bgColor = $state('bg-gray-200')  
    let spinHidden = $state('')
    let spinMessage = $state('processando ...')
    let requestGetRecordsTextOrError = $state('')
    //protocolo => OGC:WMS | OGC:WFS | etc 
    interface CategoriaCentral { noCentralCategoria?: string;}

    function urlWithParametersOGCService( protocolo: string | null): URL {
        // Cria um objeto URL a partir da string base
        const baseUrl = id_descricao_iri_noCentralCategoria.iri.split('?')[0];
        const url = new URL(baseUrl);
        // Define os parâmetros comuns baseados no getRecordsParams fornecido
        url.searchParams.set('service', 'CSW');
        url.searchParams.set('version', '2.0.2');
        url.searchParams.set('request', 'GetRecords');
        url.searchParams.set('typeNames', 'csw:Record');
        url.searchParams.set('resultType', 'hits');
        url.searchParams.set('ElementSetName', 'brief');
        //url.searchParams.set('ElementSetName', 'brief');
        //url.searchParams.set('outputSchema', 'http://www.isotc211.org/2005/gmd');
    
        // Constrói o filtro baseado no protocolo e categoria
        if (protocolo || id_descricao_iri_noCentralCategoria.noCentralCategoria) {
            url.searchParams.set('constraintLanguage', 'CQL_TEXT');
            url.searchParams.set('CONSTRAINT_LANGUAGE_VERSION', '1.1.0');
            const filterParts = [];
            if (protocolo) {
                filterParts.push(`protocol = '${protocolo}'`);
            }
            if (id_descricao_iri_noCentralCategoria.noCentralCategoria) {
                filterParts.push(`_cat = '${id_descricao_iri_noCentralCategoria.noCentralCategoria}'`);
            }
            const filter = filterParts.length > 1 ? filterParts.join(' AND ') : filterParts[0];
            url.searchParams.set('constraint', filter);
        }
        return url;
    }
    
    async function getNumberOfRecordsMatched(anURL: URL): Promise<number> {
        try {
            console.log("URL de GetRecords: " + anURL.toString());
            const res = await get(anURL);
            let xmlText = await res.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, "application/xml");
            const searchResults = xmlDoc.querySelector("SearchResults");
            return parseInt(searchResults?.getAttribute("numberOfRecordsMatched") || "0", 10);

        } catch (error: Error | any) {
            console.log("Erro na chamada da requisição");
            console.log(error.statusText, error.status);
            return 0;
        }           
    }

    function linkClicked() {
        
        goto('/ogc/csw/metadados')
    }

    onMount(async () => {
        try {
            let url = urlWithParametersOGCService(null) ;
            console.log("URL de GetRecords: " + url.toString());
            qtdMetadados = await getNumberOfRecordsMatched(url);
            url = urlWithParametersOGCService('OGC:WMS') ;
            qtdMetadadosComWMS = await getNumberOfRecordsMatched(url);
            url = urlWithParametersOGCService('OGC:WFS') ;
            qtdMetadadosComWFS = await getNumberOfRecordsMatched(url);
            spinHidden = 'hidden';
            spinMessage = 'processado com sucesso'
            
            
        } catch (error: Error | any) {
            console.log("Erro na chamada da requisição")
            console.log(error.statusText, error.status)
            requestGetRecordsTextOrError = `ERRO na requisição. ${error.status} - ${error.statusText}. Contate o responsável.`
            bgColor =  'bg-red-200'
            spinHidden = 'hidden'
            spinMessage = 'processado com erro'
        }
        onMetadaddoProcessado?.({qtdMetadados, qtdMetadadosComWMS, qtdMetadadosComWFS});
	});
    
</script>
<div class= "p-2 {bgColor} text-sm text-left text-gray-800  rounded-md shadow-sm hover:shadow-md flex flex-col"  transition:fade>
    <h2 class="font-semibold"> {requestGetRecordsTextOrError}</h2>
    <h2 class="font-semibold"> {id_descricao_iri_noCentralCategoria.descricao}</h2>
    <h2> Quantidade de registros de metadados: {qtdMetadados}</h2>
    <h2> Quantidade de registros de metadados com WMS: {qtdMetadadosComWMS}</h2>
    <h2> Quantidade de registros de metadados com WFS: {qtdMetadadosComWFS}</h2>
    <button class="text-green-600 text-left font-semibold hover:bg-gray-200 hover:underline py-1"  
    onclick={preventDefault(linkClicked)}>Mais detalhes</button>
    <!--<a class="text-xs text-blue-500 underline underline-offset-4 uppercase" href="{metadadoAssociado()}">{metadadoText}</a>-->
    <div class="bg-slate-300 text-slate-600 rounded-md text-center p-1">
        <Spinner class="{spinHidden} mr-3" size="4" color="blue" />
        {spinMessage}
    </div>
</div>