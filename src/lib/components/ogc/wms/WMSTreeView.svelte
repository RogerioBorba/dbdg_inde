<script context="module">
	import {metadataLink} from '$lib/store/storeVisualizadorMetadata'
	
	
	// retain module scoped expansion state for each tree node
	const _expansionState = {
		/* treeNodeId: expanded <boolean> */
	}

	
</script>
<script>
	//import {facadeOL, selectedLayers, removedLayers} from '$lib/store/storeMap';	
	import { IWMSLayer } from "./WMSLayer";
//	import { slide } from 'svelte/transition';
	export let wmsLayer;
    export let onClick = null;
    export let capabilitiesUrl;
	let removed = [];
	let expanded = false;
    let display = '';
	let children = wmsLayer.layers();
	let source = null;
	const toggleExpansion = () => {
		expanded = !expanded;
		arrow = arrowStyle();
        //onClick(wmsLayer)
	}
	//$: arrowDown = expanded
    function childLayer(child) {		
		if (child instanceof WMSLayer)
			return child
		return new WMSLayer(child,null,null);
	}
	
	function arrowStyle() {
		let arStyle = '';
		if (children.length == 0)
			arStyle =''
		else 
			arStyle = expanded?'-':'+';
		return 	arStyle;
		
	}
	let arrow = arrowStyle();
	
	function url() {
        let size = capabilitiesUrl.indexOf('?') 
        if (size == -1)
            size = capabilitiesUrl.length;
        return capabilitiesUrl.substring(0, size);
    }

	function btnAddLayerClicked() {
        let z_index = $selectedLayers.length + 1
        if(!wmsLayer.name())
            return alert("Esta é uma camada de agrupamento. Apenas as camadas interiores podem ser exibidas!")
		wmsLayer.sourceLayer = url();
		$facadeOL.addWMSLayerFromCapability(wmsLayer);
		



        $selectedLayers = [...$selectedLayers, wmsLayer];
        display='hidden'
    }
	async function btnMetadadoClicked() {

		//console.log(JSON.stringify(wmsLayer))
		//console.log("Geographic Bounding box" + JSON.stringify(wmsLayer.exGeographicBoundingBox()))

        if (!wmsLayer.metadataURLs())
            return alert("A camada não está associada a metadados.")

		wmsLayer.metadataURLs().forEach(metadataURL => {
			let link = metadataURL.link() //wmsLayer.metadataURL().link()
			console.log("O link que esta vindo é esse: " + link);

			//Censipam não abre - condição para não quebrar o programa
			if(link.includes("http://panorama.sipam.gov.br")){
				window.open(link, "_blank");
			}else{
				$metadataLink = link;
				//goto("/visualizador/metadata")
				window.open(`/visualizador/metadata?link=${encodeURIComponent(link)}`, '_blank');
			}
		});     
        
    }
	function visiableBtnLayer() {
		return children.length > 0 ? 'invisible':'visible';
	}
	
	function visibilyBtnMetadata() {
		return (wmsLayer.metadataURLs())?'visiable':'invisible';
	}


	//lógica para voltar com os itens que sairam da lista e foram para a área de camadas selecionadas
	$: if($removedLayers){
        removed = $removedLayers;
        
        removed.forEach(element => {
            if (element.oid === wmsLayer.oid) {
               display = '';
            }
            removed = removed.filter(el => el.oid !== wmsLayer.oid);
            $removedLayers = removed; 
        });
	}

	
</script>
<div class="flex {display}">
	<p on:click={toggleExpansion} 
		class="flex-grow text-grey-darkest hover:bg-red truncate text-left text-xs" 
		title="{wmsLayer.description()}"><span class="p-1 text-xl font- cursor-pointer" >{arrow}</span>{wmsLayer.description()}
	</p>
	<button class="{visibilyBtnMetadata()} focus:outline-none bg-grey-light hover:bg-grey text-grey-darkest font-bold py-1 px-1 rounded inline-flex items-center hover:bg-gray-200 " on:click|preventDefault={btnMetadadoClicked} title="Metadados">
		<svg xmlns="http://www.w3.org/2000/svg" style="width:16px;height:16px" class="h-6 w-6" fill="#FCF3CF" viewBox="0 0 24 24" >
			<path stroke="#1C2833" stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
		</svg>
	</button>
	<button class="{visiableBtnLayer()} focus:outline-none bg-grey-light hover:bg-grey text-grey-darkest font-bold py-1 px-1 rounded inline-flex items-center hover:bg-gray-200"  on:click|preventDefault={btnAddLayerClicked} title="Adicionar camada">
		<svg xmlns="http://www.w3.org/2000/svg" style="width:16px;height:16px" viewBox="0 0 24 24" fill="#FEF9E7">
			<path stroke="#1C2833" fill-rule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z" clip-rule="evenodd" />
		</svg>   
	</button>
</div>
{#if children.length > 0  && expanded}
    <ul><!-- transition:slide -->
        {#each children as child}
            <li class="">
				<svelte:self wmsLayer={childLayer(child)} capabilitiesUrl= {capabilitiesUrl} onClick={onClick} />
				
			</li>    
        {/each}
    </ul>

{/if}
<style>
	ul {
		margin: 0;
		list-style: none;
		padding-left: 1.2rem; 
		user-select: none;
	}
	.no-arrow { padding-left: 1.0rem; }
	.arrow {
		cursor: pointer;
		display: inline-block;
		/* transition: transform 200ms; */
	}
	.arrowDown { transform: rotate(90deg); }
</style>
