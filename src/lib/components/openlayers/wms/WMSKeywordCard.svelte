<script lang="ts">
    import { goto } from '$app/navigation';
    import { Spinner} from 'flowbite-svelte';
    import { fade } from 'svelte/transition'
    import { onMount } from 'svelte';
    import { get } from "$lib/request/get";
    import type { IWMSLayer, IWMSKeywordStats, IWMSCapabilities, iWMSCapabilities } from '$lib/ogc/wms/wmsCapabilities';
    let objIdDescricaoIri = $props<{id: number, descricao: string, iri: string}>();
    let wmsCapabilities = $state<IWMSCapabilities | null>(null);
    const wmsKeywordsStat: IWMSKeywordStats = {
        countTotalLayer: 0,
        countWMSProcessado: 0, 
        allKeywords: [],
        keywordCountByName: {}
    };
    let qtdSelectedItem = 0;
    let tempoRequisicao = 0;
    let qtdCamada = 0;
    let qtdCamadaSemMetadadosAssociado = 0;
    let qtdCamadaSemPalavraChave = 0;
    let palavrasChave = [];
    let requestGetRecordsTextOrError = '';
    let allKeys = []
    let allKeysSemRepeticao = []
    
    function initializeVariablesOnMount() {
        if (!wmsCapabilities) return ;
        const wmsKeywordsStat: IWMSKeywordStats = {
            countTotalLayer: 0,
            countWMSProcessado: 0, 
            allKeywords: [],
            keywordCountByName: {}
        };
    }

    function keyCountByName(aWMSCapabilities: IWMSCapabilities) {
        const allKeys = aWMSCapabilities?.capability.layers.reduce((acc: string[], layer: IWMSLayer) => {
            if (layer.keywords && layer.keywords.length > 0) {
                acc.push(...layer.keywords);
            }
            return acc;
        }, []);
        const allKeysSemRepeticao = [...new Set(allKeys)];
        wmsKeywordsStat.allKeywords = wmsKeywordsStat.allKeywords.concat(allKeys)
        for (let i = 0; i < allKeys.length; i++) {
            let keyword = allKeys[i]
            let value = $keywordCountByName[keyword]
            if (value) 
                $keywordCountByName[keyword] = value + 1 
            else 
                $keywordCountByName[keyword] = 1
            //$keywordCountByName = $keywordCountByName
        }
        console.log($keywordCountByName)
    }
   
    onMount(async () => {
        try {
            if(!objIdDescricaoIri.iri) {
            
                return 
            }
            const res = await get(objIdDescricaoIri.iri, { timeout: 60000 });
            const xmlText = await res.text();
            wmsCapabilities = iWMSCapabilities(xmlText);
            const wmsLayers: IWMSLayer[] = wmsCapabilities.capability.layers;
            initializeVariablesOnMount(wmsLayers);
            initializeVariablesOnMount()
            keyCountByName(wmsCapabilities)
            $countTotalLayer += qtdCamada
            tempoRequisicao = parseFloat(((new Date().getTime()) - tempo)/1000).toFixed(2)
            $countWMSProcessado = $countWMSProcessado + 1
            
        } catch (error) {
            console.log("Erro na chamada da requisição")
            console.log(error, error.statusText, error.status)
            requestGetRecordsTextOrError = `ERRO na requisição. ${error.status} - ${error.statusText}. Contate o responsável.`
            $countWMSProcessado = $countWMSProcessado + 1
        }
	});
    
</script>
