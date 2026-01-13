<script lang="ts">
    import { goto } from '$app/navigation';
    import { capabilities, layerStats, type IFeatureType, type ILayerStats, type IWFSGetCapabilities}from '$lib/ogc/wfs/wfsCapabilities';
    import type { OGCProcessRecord } from '$lib/ogc/commom/OGCRecord';
    import { Spinner } from "flowbite-svelte";
    import { fade } from 'svelte/transition'
    import { onMount } from 'svelte';
    import { get } from "$lib/request/get";
    import { counterWFS } from '$lib/shared/ogc/wfs/shared.svelte';
    let ows_capabilities: IWFSGetCapabilities;
    let { objIdDescricaoIri, onRecordCreated }: {objIdDescricaoIri: {id: number, descricao: string, iri: string}, onRecordCreated?: (record: OGCProcessRecord) => void} = $props();
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
        counterWFS.currentCapability = ows_capabilities;
        goto("/ogc/wfs/capabilities")
    }
    function initializeVariablesOnMount(layers: IFeatureType[]) {
        const stats: ILayerStats = layerStats(layers);
        qtdCamada = stats.withName || 0;
        qtdCamadaSemMetadadosAssociado = stats.withNameWithoutMetadata || 0 ;
        qtdCamadaSemPalavraChave = stats.withNameWithoutKeywords || 0 ;
    }
   
    onMount(async () => {
        try {
            if(!objIdDescricaoIri.iri) {
                spinHidden = 'hidden'
                spinMessage = 'Sem catálogo WFS para processamento'
                return 
            }
            
            const tempo = new Date().getTime();
            console.log("link wfs: " + objIdDescricaoIri.iri);
            const res = await get(objIdDescricaoIri.iri, { timeout: 60000 });
            const xmlText = await res.text();
            ows_capabilities = capabilities(xmlText);
            const layers: IFeatureType[] = ows_capabilities.featureTypes;
            console.log("Qtd de camadas WFS: " + layers.length);
            initializeVariablesOnMount(layers);
            tempoRequisicao = parseFloat(((new Date().getTime() - tempo) / 1000).toFixed(2));
            spinHidden = 'hidden'
            spinMessage = 'processado com sucesso'
                // cria registro tipado e atualiza store global csvRecords
                const record: OGCProcessRecord = {
                    id: objIdDescricaoIri.id,
                    serviceType: 'WFS',
                    operation: 'GetCapabilities',
                    datetime: new Date().toISOString(),
                    requestTimeSeconds: tempoRequisicao,
                    name: objIdDescricaoIri.descricao,
                    numLayers: qtdCamada,
                    numLayersWithoutMetadata: qtdCamadaSemMetadadosAssociado,
                    numLayersWithoutKeywords: qtdCamadaSemPalavraChave,
                    url: objIdDescricaoIri.iri,
                    processadoSemErro: true
                };
                //upsertRecord(record);
                onRecordCreated?.(record);
        } catch (error: any) {
            console.log("Erro na chamada da requisição")
            console.log(error, error.statusText, error.status)
            requestGetRecordsTextOrError = `ERRO na requisição:  ${objIdDescricaoIri.iri} . ${error.status} - ${error.statusText}. Contate o responsável.`
            bgColor =  'bg-red-200'
            spinHidden = 'hidden'
            spinMessage = `processado com erro`
            showMaisDetalhesHidden = 'hidden'
            // envia evento DOM mesmo em caso de erro
                // cria registro tipado e atualiza store global mesmo em caso de erro
                const recordErr: OGCProcessRecord = {
                    id: objIdDescricaoIri.id,
                    serviceType: 'WMS',
                    operation: 'GetCapabilities',
                    datetime: new Date().toISOString(),
                    requestTimeSeconds: tempoRequisicao,
                    name: objIdDescricaoIri.descricao,
                    numLayers: qtdCamada,
                    numLayersWithoutMetadata: qtdCamadaSemMetadadosAssociado,
                    numLayersWithoutKeywords: qtdCamadaSemPalavraChave,
                    url: objIdDescricaoIri.iri,
                    processadoSemErro: false
                };
                //upsertRecord(recordErr);
                onRecordCreated?.(recordErr);
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

        <button class="{showMaisDetalhesHidden} text-green-600 text-left font-semibold hover:bg-gray-200 hover:underline py-1 hover:cursor-pointer"  
        onclick ={linkClicked}>Mais detalhes</button>
        <!-- <a class="text-xs text-blue-500 underline underline-offset-4 uppercase" href="{metadadoAssociado()}">{metadadoText}</a> -->
        <div class="bg-slate-300 text-slate-600 rounded-md text-center p-1">
            <Spinner class="{spinHidden} mr-3" size="4" color="red" />
            {spinMessage}
            
        </div>
</div>