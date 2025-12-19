<script lang="ts">
    import {counterWMS} from '$lib/shared/ogc/wms/shared.svelte';
    import { goto } from '$app/navigation';
    import {countWMSLayers, iWMSCapabilities} from '$lib/ogc/wms/wmsCapabilities';
    import type {IWMSCapabilities, IWMSLayer, IWMSLayerStats} from '$lib/ogc/wms/wmsCapabilities';
    import { Spinner} from 'flowbite-svelte';
    import { fade } from 'svelte/transition'
    import { onMount } from 'svelte';
    import { get } from "$lib/request/get";
    let wmsCapabilities: IWMSCapabilities;
    let { objIdDescricaoIri }: {objIdDescricaoIri: {id: number, descricao: string, iri: string}} = $props();
    let tempoRequisicao = $state(0);
    let qtdCamada = $state(0);
    let qtdCamadaSemMetadadosAssociado = $state(0);
    let qtdCamadaSemPalavraChave = $state(0);
    let bgColor = $state('bg-gray-200');
    let spinHidden = $state('');
    let spinMessage = $state('processando ...');
    let requestGetRecordsTextOrError =  $state('Requisição GetCapabilities');
    let showMaisDetalhesHidden = $state(''); 
    
    function linkClicked() {
        counterWMS.currentWMSCapability = wmsCapabilities;
        goto("/wms/capabilities")
    }
    function initializeVariablesOnMount(wmsLayers: IWMSLayer[]) {
        const stats: IWMSLayerStats = countWMSLayers(wmsLayers);
        qtdCamada = stats.withName || 0;
        qtdCamadaSemMetadadosAssociado = stats.withNameWithoutMetadata || 0 ;
        qtdCamadaSemPalavraChave = stats.withNameWithoutKeywords || 0 ;
    }
   
    onMount(async () => {
        try {
            if(!objIdDescricaoIri.iri) {
                spinHidden = 'hidden'
                spinMessage = 'Sem catálogo WMS para processamento'
                return 
            }
            
            const tempo = new Date().getTime();
            console.log("link wms: " + objIdDescricaoIri.iri);
            const res = await get(objIdDescricaoIri.iri, { timeout: 60000 });
            const xmlText = await res.text();
            wmsCapabilities = iWMSCapabilities(xmlText);
            const wmsLayers: IWMSLayer[] = wmsCapabilities.capability.layers;
            initializeVariablesOnMount(wmsLayers);
            counterWMS.totalLayers += qtdCamada;
            counterWMS.totalLayersWithoutMetadata += qtdCamadaSemMetadadosAssociado;
            counterWMS.countWMSProcessado = counterWMS.countWMSProcessado + 1
            tempoRequisicao = parseFloat(((new Date().getTime() - tempo) / 1000).toFixed(2));
            spinHidden = 'hidden'
            spinMessage = 'processado com sucesso'
        } catch (error: any) {
            console.log("Erro na chamada da requisição")
            console.log(error, error.statusText, error.status)
            requestGetRecordsTextOrError = `ERRO na requisição:  ${objIdDescricaoIri.iri} . ${error.status} - ${error.statusText}. Contate o responsável.`
            bgColor =  'bg-red-200'
            spinHidden = 'hidden'
            spinMessage = `processado com erro`
            showMaisDetalhesHidden = 'hidden'
            counterWMS.countWMSProcessado = counterWMS.countWMSProcessado + 1
        }
		
	});
    
</script>
<div class= "p-2 {bgColor} text-sm text-left text-gray-800  rounded-md shadow-sm hover:shadow-md flex flex-col"  transition:fade>
        <h2 class="font-semibold"> {requestGetRecordsTextOrError}</h2>
        <h2 class="font-semibold"> {objIdDescricaoIri.descricao}</h2>
        <h2> Tempo de requisição GetCapabilities: {tempoRequisicao} seg.</h2>
        <h2> Qtd de camadas: {qtdCamada}</h2>
        <h2> Qtd de camadas sem metadado associado: {qtdCamadaSemMetadadosAssociado}</h2>
        <h2> Qtd de camadas sem palavras chaves: {qtdCamadaSemPalavraChave}</h2>

        <button class="{showMaisDetalhesHidden} text-green-600 text-left font-semibold hover:bg-gray-200 hover:underline py-1"  
        onclick={linkClicked}>Mais detalhes</button>
        <!-- <a class="text-xs text-blue-500 underline underline-offset-4 uppercase" href="{metadadoAssociado()}">{metadadoText}</a> -->
        <div class="bg-slate-300 text-slate-600 rounded-md text-center p-1">
            <Spinner class="{spinHidden} mr-3" size="4" color="white" />
            {spinMessage}
            
        </div>
</div>