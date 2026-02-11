<script lang="ts">
    import { goto } from '$app/navigation';
    import { capabilities, type IFeatureType, type IWFSGetCapabilities } from '$lib/ogc/wfs/wfsCapabilities';
    import { wfsFeatureTypesData } from '$lib/shared/ogc/wfs/shared.svelte';
    import { Spinner } from "flowbite-svelte";
    import { fade } from 'svelte/transition';
    import { onMount } from 'svelte';
    import { get } from "$lib/request/get";

    let ows_capabilities: IWFSGetCapabilities;
    let { objIdDescricaoIri }: { objIdDescricaoIri: { id: number; descricao: string; iri: string } } = $props();
    
    let tempoRequisicao = $state(0);
    let qtdFeatureTypes = $state(0);
    let qtdFeatureTypesSemMetadado = $state(0);
    let qtdFeatureTypesSemPalavraChave = $state(0);
    let bgColor = $state('bg-gray-200');
    let spinHidden = $state('');
    let spinMessage = $state('processando ...');
    let requestText = $state('Requisição GetCapabilities');
    let showMaisDetalhes = $state(false);
    let errorMessage = $state('');

    function calculateStats(featureTypes: IFeatureType[]) {
        qtdFeatureTypes = featureTypes.length;
        qtdFeatureTypesSemMetadado = featureTypes.filter(ft => !ft.metadataURLs || ft.metadataURLs.length === 0).length;
        qtdFeatureTypesSemPalavraChave = featureTypes.filter(ft => !ft.keywords || ft.keywords.length === 0).length;
    }

    function handleMaisDetalhes() {
        wfsFeatureTypesData.catalogName = objIdDescricaoIri.descricao;
        wfsFeatureTypesData.featureTypes = ows_capabilities.featureTypes;
        wfsFeatureTypesData.capabilitiesUrl = objIdDescricaoIri.iri;
        goto("/ogc/wfs/tipo-de-feicoes/schema-feature-type");
    }

    onMount(async () => {
        try {
            if (!objIdDescricaoIri.iri) {
                spinHidden = 'hidden';
                spinMessage = 'Sem catálogo WFS para processamento';
                return;
            }

            const tempo = new Date().getTime();
            console.log("link wfs: " + objIdDescricaoIri.iri);
            const res = await get(objIdDescricaoIri.iri, { timeout: 60000 });
            const xmlText = await res.text();
            ows_capabilities = capabilities(xmlText);
            const featureTypes: IFeatureType[] = ows_capabilities.featureTypes;
            console.log("Qtd de feature types WFS: " + featureTypes.length);
            
            calculateStats(featureTypes);
            tempoRequisicao = parseFloat(((new Date().getTime() - tempo) / 1000).toFixed(2));
            spinHidden = 'hidden';
            spinMessage = 'processado com sucesso';
            showMaisDetalhes = true;
            bgColor = 'bg-green-50';
        } catch (error: any) {
            console.log("Erro na chamada da requisição");
            console.log(error, error.statusText, error.status);
            errorMessage = `ERRO: ${error.status} - ${error.statusText}`;
            requestText = 'Erro na requisição GetCapabilities';
            bgColor = 'bg-red-100';
            spinHidden = 'hidden';
            spinMessage = 'processado com erro';
            showMaisDetalhes = false;
        }
    });
</script>

<div class="p-3 {bgColor} text-sm text-left text-gray-800 dark:text-gray-100 rounded-lg shadow-md hover:shadow-lg flex flex-col transition-all" transition:fade>
    <div class="flex justify-between items-start mb-2">
        <div class="flex-1">
            <h2 class="font-semibold text-base">Requisição GetCapabilities</h2>
            <h3 class="font-semibold text-gray-900 dark:text-white mt-1">{objIdDescricaoIri.descricao}</h3>
        </div>
        {#if spinHidden === ''}
            <Spinner size="4" color="blue" />
        {/if}
    </div>

    {#if errorMessage}
        <div class="text-red-600 dark:text-red-400 text-xs mb-2">
            <strong>Erro:</strong> {errorMessage}
        </div>
    {:else}
        <h2 class="text-xs">Tempo de requisição GetCapabilities: {tempoRequisicao} seg.</h2>
        <h2 class="text-xs">Qtd de tipos de feição: {qtdFeatureTypes}</h2>
        <h2 class="text-xs">Qtd de tipos de feição sem metadado associado: {qtdFeatureTypesSemMetadado}</h2>
        <h2 class="text-xs">Qtd de tipos de feição sem palavras chaves: {qtdFeatureTypesSemPalavraChave}</h2>
    {/if}

    <div class="mt-2 text-xs {spinHidden}">
        <p class="text-green-600 dark:text-green-400 font-semibold">{spinMessage}</p>
    </div>

    {#if showMaisDetalhes && !errorMessage}
        <button
            class="mt-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs font-medium hover:underline"
            onclick={handleMaisDetalhes}
        >
            Mais detalhes →
        </button>
    {/if}
</div>
