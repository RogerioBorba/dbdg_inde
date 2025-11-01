<script lang="ts">
    import {mapper_ol} from '$lib/shared/openlayers/shared.svelte';
    import type { IFeatureType, IMetadataUrl} from '$lib/ogc/wfs/wfsCapabilities';
    import {preventDefault} from '$lib/components/svelte_util/util';
    import { get } from '$lib/request/get';
    //import {metadataLink} from '$lib/store/storeVisualizadorMetadata'
    
    import { Fill, Stroke, Style } from 'ol/style';
    import CircleStyle from 'ol/style/Circle';
    import { onMount } from 'svelte';
    import { onDestroy } from 'svelte';
    
    //import WfsModal from './WFSModal.svelte';
    
    //import {hiddenDraw} from '$lib/store/storeBoudingBox';
    import proj4 from 'proj4'
    import type { FacadeOL } from '../facade_openlayers';
    import { WFSLayer } from './wfsLayer';

    let { iWFSLayer, capabilitiesUrl, id, selectedColor  = '#FFFFFF'} = $props<{
        iWFSLayer: IFeatureType,
        capabilitiesUrl: string,
        id: number,
        selectedColor: string
    }>();
    let source = $state(null);
    let sourceLayer = $state(null);
    let display = $state('');
    let visibilytMetadata =$state('visible');
    let featureCount = $state(0);
    let color = $state(HTMLInputElement);
    let userColor = $state('');
    let colorInput = $state<HTMLInputElement>();
    let aleatoryColor = $state('');
    let loading = $state(false);
    let removed = $state([]);
    let unsubscribe = $state('');

    let wfsLayer = $state(new WFSLayer(iWFSLayer, capabilitiesUrl));
    //Lógica para coletar cor selecionada pelo usuário
   
    let facadeOL = $state<FacadeOL| null>(mapper_ol.facadeOL);
    
    onMount( async() =>{
        //facadeOL = mapper_ol.facadeOL;
        //wfsLayer = new WFSLayer(iWFSLayer, capabilitiesUrl)
        fetchFeatureCount();
    })
    //Variáveis modal
    onDestroy(async () => {
       // $hiddenDraw = 'hidden';
    })
    
    function btnSelectColorClicked() {
        colorInput?.click(); // Usa a referência direta ao input
    }

    
   
    /**Fim da lógica de cor selecionada pelo usuário/*/


    
    /**Lógica para o modal exibir as ações*/

    let isOpen = false;
    let attributes = [];
    let linkToModal;
    let wfsName;
    

    // exemplo - capabilitiesUrl =  https://geoservicos.inde.gov.br/geoserver/ANM/ows?service=wfs&version=2.0.0&request=GetCapabilities
    // retorna  https://geoservicos.inde.gov.br/geoserver/ANM/ows
    function url(): string {  return capabilitiesUrl.split('?')[0];}; 

    function urlGetFeatureBase():  string  
    {   // somente parâmetros obrigatórios
        const baseURL = url();
        const service='WFS';
        const version='2.0.0';
        const request='GetFeature';
        const typeNames = iWFSLayer.name;
        return `${baseURL}?service=${service}&version=${version}&request=${request}&typeNames=${typeNames}`;
    };

    function urlGetFeature() {
        const baseURL = urlGetFeatureBase();
        const outputFormat = 'application/json';
        return `${baseURL}&outputFormat=${outputFormat}`;
    };

    function urlGetFeatureCount(): string {
        // url para retornar a quanntidade de Features
        const baseURL = urlGetFeatureBase();
        const resultType = 'hits';
        const outputFormat = 'GML2'; 
        const url =  `${baseURL}&outputFormat=${outputFormat}&resultType=${resultType}`;
        return  url;
    };

    async function openModal() {
        //console.log(attributes.length);
        const link= url();
        //$currentModalLink = link;
        //let newAttributes = await getAttributes(wfsLayer.name(),link);
        //attributes = [...attributes, newAttributes];
        //console.log(attributes.length)
        if(link) {
            isOpen = true;
            linkToModal = link;
            wfsName = wfsLayer.name();
        }  
    }

    function closeModal(event) {
        event.preventDefault();
        isOpen = false;
    }

    //Criado para que o título do WFS volte a ser renderizado após ser removido do camadas selecionadas 
    //$: console.log("display atual" + display)
    
    //$: console.log("removed layers" + $removedLayers);
    /*
    $: if($removedLayers){
        removed = $removedLayers;
        
        removed.forEach(element => {
            if (element.oid === wfsLayer.oid) {
               display = '';
            }
            removed = removed.filter(el => el.oid !== wfsLayer.oid);
            $removedLayers = removed; 
        });
	}
    */
    /**-----------Fim------------------/*/
    
    //$: if (!wfsLayer.metadataURLs()) visibilytMetadata ='invisible'
      
    async function btnMetadadoClicked() {
        if (!iWFSLayer.metadataURLs){
            return alert("A camada não está associada a metadados.")
        }
        //console.log("wfsLayer.metadataURLs()>", wfsLayer.metadataURLs());
        //let link = wfsLayer.metadataURLs()[0].link() //wmsLayer.metadataURL().link()
        iWFSLayer.metadataURLs.forEach((metadataURL: IMetadataUrl) => {
            let link = metadataURL.href;
            console.log("LINK"  + link);
            if(link.includes("http://panorama.sipam.gov.br")){
				window.open(link, "_blank");
            }else{
				//$metadataLink = link;
				//goto("/visualizador/metadata")
                //console.log("teste")
                window.open(`/visualizador/metadata?link=${encodeURIComponent(link)}`, '_blank');
			}

        })
    };

     // Função para buscar o número de feições
     async function fetchFeatureCount() {
        const url: string = urlGetFeatureCount();
        try {
            let response = await get(url);
            let data = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(data, "text/xml");
            const numberMatched: number = parseInt(xmlDoc.documentElement.getAttribute("numberMatched") ?? '0', 10);
            featureCount = numberMatched;
            
        } catch (error) {
            const msg = `Erro ao buscar contagem de feições, url: ${url}`;
            console.error(msg, error);
            alert(msg);
            featureCount = 0;
        }
    }
    
    function visibilityBtnMetadata():  'visible'| 'invisible' {
        console.log(`${iWFSLayer.name}: ${iWFSLayer?.metadataURLs == null}`);
        return !iWFSLayer?.metadataURLs || iWFSLayer.metadataURLs.length === 0 ? 'invisible': 'visible';
    };
  
    
   
    // Mapa de cores para armazenar as cores de cada grupo de feições
    const mapaDeCores = new Map();


    function getRandomColor(): string {
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);
        const a = 0.7; // Transparência entre 0.1 e 1.0

        return `rgba(${r}, ${g}, ${b}, ${a})`;
    };

    function getColorForFeature(idDoGrupo) {
        if (!mapaDeCores.has(idDoGrupo)) {

            const novaCor = getRandomColor();
            // Gera uma nova cor para o grupo se ainda não estiver presente
            //mapaDeCores.set(idDoGrupo, gerarCorAleatoria());
            mapaDeCores.set(idDoGrupo, novaCor);
            
           
        }
        return mapaDeCores.get(idDoGrupo);
    }

   
    function isUTM(coord) {
    // Para a zona UTM 32723, as coordenadas X (leste-oeste) normalmente estão em torno de 350000 metros ou mais
        const x = coord[0]; // Coordenada X (leste-oeste)
        const y = coord[1]; // Coordenada Y (norte-sul)

        console.log("x: " + x + "e " + "y :" + y )
        // Considera-se que se a coordenada X for maior que 100000 e Y maior que 100000, provavelmente está em UTM
        return x > 100000 && y > 100000;
}
    
    async function btnAddLayerClicked() {
        loading = true;
       // let z_index = $selectedLayers.length + 1;
        if (!wfsLayer.name()) {
            return alert("Esta é uma camada de agrupamento. Apenas as camadas interiores podem ser exibidas!");
        }

        let urlFeature = urlGetFeature();
        let dados = await get(urlFeature);
        let dadosJson = await dados.json();
        console.log("dados json" + JSON.stringify(dadosJson));


        // Testando a conversão das coordenadas
        /*
        dadosJson.features.forEach(feature => {
            feature.geometry.coordinates = feature.geometry.coordinates.map(coord => {
            if (Array.isArray(coord[0])) {
                return coord.map(c => {
                    if (isUTM(c)) {
                        const [longitude, latitude] = proj4('EPSG:32723', 'EPSG:4326', [c[0], c[1]]);
                        return [longitude, latitude];
                    } else {
                        return c;
                    }
                });
            } else {
                // Para coordenadas individuais (não um conjunto de pares)
                if (isUTM(coord)) {
                    const [longitude, latitude] = proj4('EPSG:32723', 'EPSG:4326', [coord[0], coord[1]]);
                    return [longitude, latitude];
                } else {
                    return coord;
                }
            }
        });
    
            
        });
       */
        let geometria = dadosJson.features[0].geometry.type;
        
        
        // ID para feições do mesmo grupo 
        const novoIdDoGrupo = Date.now().toString(); 
    
        // Criando a cor da feição antes de definir o estilo padronizado
        color = getColorForFeature(novoIdDoGrupo);
        console.log("Cor gerada para o grupo: " + color);


        let estiloFeicao = (feicao) => {
            if (geometria === "LineString" || geometria === "MultiLineString") {
                return new Style({
                    stroke: new Stroke({
                        color: color,
                        width: 4,
                    }),
                });
            } else if (geometria === "Polygon" || geometria === "MultiPolygon") {
                return new Style({
                    stroke: new Stroke({
                        color: color,
                        width: 2,
                    }),
                    fill: new Fill({
                        color: 'rgba(0, 0, 255, 0.1)', 
                    }),
                });
            }

            return new Style({
                image: new CircleStyle({
                    radius: 5,
                    fill: new Fill({
                        color: color,
                    }),
                    stroke: new Stroke({
                        color: '#000',
                        width: 1,
                    }),
                }),
                fill: new Fill({
                    color: color,
                }),
                stroke: new Stroke({
                    color: '#000',
                    width: 1,
                }),
            });
        };
        
        let camada = await facadeOL?.addGeoJSONLayer(dadosJson, estiloFeicao);

        // Obtendo a extensão (bounding box) das feições adicionadas
        
        const extent = camada.getSource().getExtent();

        // Ajustando o mapa para centralizar e fazer zoom na extensão das feições
        facadeOL?.map.getView().fit(extent, { 
            size: facadeOL.map.getSize(), 
            padding: [50, 50, 50, 50], // Padding para ajustar margens
            maxZoom: 18 // Define um zoom máximo
        });
        
        
        //let camada = await $facadeOL.addGeoJSONLayer(dadosJson);
        wfsLayer.dadosJson = dadosJson;
        wfsLayer.geometria = geometria;
        
       // wfsLayer.color = color;
       // wfsLayer.layer = camada;
       // wfsLayer.feicoes = featureCount;
       // $selectedLayers = [...$selectedLayers, wfsLayer];
        display = 'hidden';
       // userColor = "#FFFFFF"
        aleatoryColor = "#FFFFFF"


       // $hiddenDraw = '';
        loading = false;
    }
    

    function btnFilterLayerClicked() {

    }
    
    
       
</script>

<div class="flex mt-1 relative {display} text-gray-700 ">
        {@render descricao_com_quantidade()}
        {@render botao_metadados()}
        {@render botao_cor_feature()}
        {@render botao_add_feature()}
        {@render botao_filter_feature()}
</div>
<!--
{#if linkToModal}
    <WfsModal {isOpen} {wfsName}  link={linkToModal} {closeModal} />
{/if}
-->
{#snippet descricao_com_quantidade()}
        <p class=" mt-1 flex-grow text-grey-darkest hover:bg-red truncate text-left text-xs" 
        title="{`${wfsLayer.description()} - ${featureCount} ${featureCount > 1 ? 'feições' : 'feição'}`}">
        {`${wfsLayer.description()} - ${featureCount} ${featureCount > 1 ? 'feições' : 'feição'}`}</p>
{/snippet}

{#snippet botao_metadados()}
<button  class="{visibilityBtnMetadata()} focus:outline-none bg-grey-light hover:bg-grey text-grey-darkest font-bold py-1 px-1 rounded inline-flex items-center hover:bg-gray-200" 
        onclick={preventDefault(btnMetadadoClicked)} title="Metadados">
            <svg xmlns="http://www.w3.org/2000/svg" style="width:16px;height:16px" class="h-6 w-6" fill="#FCF3CF" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke="#1C2833" stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
        </button>
{/snippet}

{#snippet botao_cor_feature()}
    <input type="color" class="hidden" bind:this={colorInput} bind:value={userColor}/>
    <button class="focus:outline-none bg-grey-light hover:bg-grey text-grey-darkest font-bold py-1 px-1 rounded inline-flex items-center hover:bg-gray-200" 
        onclick={preventDefault(btnSelectColorClicked)} disabled={featureCount === 0} title="Escolha a cor das feições a serem renderizadas">
            <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill={userColor ? userColor+'80' :  (aleatoryColor ? aleatoryColor : '#FFFFFF')} viewBox="0 0 24 24">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 7h.01m3.486 1.513h.01m-6.978 0h.01M6.99 12H7m9 4h2.706a1.957 1.957 0 0 0 1.883-1.325A9 9 0 1 0 3.043 12.89 9.1 9.1 0 0 0 8.2 20.1a8.62 8.62 0 0 0 3.769.9 2.013 2.013 0 0 0 2.03-2v-.857A2.036 2.036 0 0 1 16 16Z"/>
            </svg>
    </button>
{/snippet}

{#snippet botao_add_feature()}
{#if loading}
            <div  role="status">
                <svg aria-hidden="true" class="inline w-5 h-5 mb-2 ml-2 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                    <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                </svg>
                <span class="sr-only">Loading...</span>
            </div>
        {:else}
            <button class="focus:outline-none bg-grey-light hover:bg-grey text-grey-darkest font-bold py-1 px-1 rounded inline-flex items-center hover:bg-gray-200" 
            onclick={preventDefault(btnAddLayerClicked)}   disabled={featureCount === 0} title="Adicionar feições" id="addLayer">
                <svg xmlns="http://www.w3.org/2000/svg" style="width:16px;height:16px" viewBox="0 0 24 24" fill="#FEF9E7">
                    <path stroke="#1C2833" fill-rule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z" clip-rule="evenodd" />
                </svg>   
            </button>
        {/if}
{/snippet}

{#snippet botao_filter_feature()}
    <button class="focus:outline-none bg-grey-light hover:bg-grey text-grey-darkest font-bold py-1 px-1 rounded inline-flex items-center hover:bg-gray-200" 
        onclick={preventDefault(openModal)}  disabled={featureCount === 0} title="Filtrar feições" >
            <svg xmlns="http://www.w3.org/2000/svg" style="width:16px;height:16px" viewBox="0 0 24 24" fill="#FFCC80">
                <path fill-rule="evenodd" d="M12 12l8-8V0H0v4l8 8v8l4-4v-4z" clip-rule="evenodd" />
            </svg>   
    </button>
{/snippet}