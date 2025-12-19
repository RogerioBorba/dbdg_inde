<script>
  import { onMount } from "svelte";
  import {metadataLink} from '$lib/store/storeVisualizadorMetadata'
  import { textXml2Json } from "$lib/xml-json/xml2Json";
  import {MD_Metadata} from '$lib/ISO/19115/MdMetadata';
  import { identificationInfo } from "$lib/ISO/19115/IdentificationInfo";
  import WmsProtocol from "$lib/component/visualizador/WmsProtocol.svelte";
  import WmsContactAndIndentification from "$lib/component/visualizador/WmsContactAndIdentification.svelte";
  import WmsTechnicalInformation from "$lib/component/visualizador/WmsTechnicalInformation.svelte";
  import WmsLineage from "$lib/component/visualizador/WmsLineage.svelte";
  import WmsMetadata from "$lib/component/visualizador/WmsMetadata.svelte";
  import { NavLi, NavUl } from "flowbite-svelte";

  let link;
  let metadata;
  let protocols;
  let keywords
  let email;
  let processSteps;
  let outputSchema = 'outputschema=http%3A%2F%2Fwww.isotc211.org%2F2005%2Fgmd'

  const buildMetadata = (result) => {
    console.log("result" + JSON.stringify(result))
    let xml;


    if (result["csw:GetRecordByIdResponse"] && result["csw:GetRecordByIdResponse"]["gmd:MD_Metadata"]) {
      xml = result["csw:GetRecordByIdResponse"]["gmd:MD_Metadata"];
      console.log("Peguei a primeira condição");
    } else if (result["gmd:MD_Metadata"]) {
      xml = result["gmd:MD_Metadata"];
      console.log("Peguei a segunda condição");
}
     
    const attributes = new MD_Metadata(xml)
    

    return attributes;
  }
  
  onMount(async() => {

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 seconds timeout:

    
    const params = new URLSearchParams(window.location.search);
    link = params.get('link');
    
    console.log('Link recebido:', link);
    
    /*
    const unsubscribe = metadataLink.subscribe(element => {
      link = element;
    })
    */
    
    if (link.includes('outputschema=http%3A%2F%2Fwww.w3.org%2F2005%2FAtom')) {
    // Substitui "outputschema=http://www.w3.org/2005/Atom" por "outputschema=http://www.isotc211.org/2005/gmd"
      link = link.replace('outputschema=http%3A%2F%2Fwww.w3.org%2F2005%2FAtom', outputSchema);
    }

    if(link.includes('outputschema=http%3A%2F%2Fwww.opengis.net%2Fcat%2Fcsw%2Fcsdgm')){
      link = link.replace('outputschema=http%3A%2F%2Fwww.opengis.net%2Fcat%2Fcsw%2Fcsdgm', outputSchema)
    }
  

    try{
      console.log("o link é esse : " + link);
      const response = await fetch(link);
      const responseText = await response.text();

      const result = textXml2Json(responseText)
      
      metadata = buildMetadata(result);
      console.log("metadata" + JSON.stringify(metadata))

      
      // @ts-ignore
      protocols = metadata.getDistributionInfo().catchProtocols();
      // @ts-ignore
      keywords = metadata.getIdentificationInfo().keywords();
      console.log("KEYWORDS" + keywords)
      // @ts-ignore
      email = metadata.getEmail();
      processSteps = metadata.getDataQualityInfo()?.getProcessStep()
      
      
    }
    catch(error){
      console.log("Não foi possível fazer o fetch")
       try {
            console.log('Try fetching on server-proxy')
            console.log("o link é esse : " + link);
            let res = await fetch(`/api/get-xml/?url=${link}`, { signal: controller.signal })
            if(res.ok) {
                console.log('fetch ok')
                let textXML = await res.text()
                const result = textXml2Json(textXML);
                metadata = buildMetadata(result)
                console.log("metadata" + JSON.stringify(metadata))

                
                // @ts-ignore
                protocols = metadata.getDistributionInfo().catchProtocols();
                keywords = metadata.getIdentificationInfo().keywords();
                console.log("KEYWORDS" + keywords)
                processSteps = metadata.getDataQualityInfo()?.getProcessStep()
               
                // @ts-ignore
                email = metadata.getEmail();
                //email = metadata["gmd:contact"]["gmd:CI_ResponsibleParty"]["gmd:contactInfo"]["gmd:CI_Contact"]["gmd:address"]["gmd:CI_Address"]["gmd:electronicMailAddress"]["gco:CharacterString"]["#text"]
                
                
            } else {
                console.log(`Server Error in fetching`);
                return null
            }

        } catch (error) {
            console.log(`Error in fetching}`);
            return null
        }
    }

    return unsubscribe;
  })

</script>

{#if metadata}

<div>
  <div id="hideDiv" class="flex items-center">
      <div class="flex md:flex-row justify-start">
          <NavUl class="order-1">
              <NavLi href="/" active={true}>Home</NavLi>
          </NavUl>
      </div>
      <div class="flex items-center ml-5">
        <span>
          <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 7.205c4.418 0 8-1.165 8-2.602C20 3.165 16.418 2 12 2S4 3.165 4 4.603c0 1.437 3.582 2.602 8 2.602ZM12 22c4.963 0 8-1.686 8-2.603v-4.404c-.052.032-.112.06-.165.09a7.75 7.75 0 0 1-.745.387c-.193.088-.394.173-.6.253-.063.024-.124.05-.189.073a18.934 18.934 0 0 1-6.3.998c-2.135.027-4.26-.31-6.3-.998-.065-.024-.126-.05-.189-.073a10.143 10.143 0 0 1-.852-.373 7.75 7.75 0 0 1-.493-.267c-.053-.03-.113-.058-.165-.09v4.404C4 20.315 7.037 22 12 22Zm7.09-13.928a9.91 9.91 0 0 1-.6.253c-.063.025-.124.05-.189.074a18.935 18.935 0 0 1-6.3.998c-2.135.027-4.26-.31-6.3-.998-.065-.024-.126-.05-.189-.074a10.163 10.163 0 0 1-.852-.372 7.816 7.816 0 0 1-.493-.268c-.055-.03-.115-.058-.167-.09V12c0 .917 3.037 2.603 8 2.603s8-1.686 8-2.603V7.596c-.052.031-.112.059-.165.09a7.816 7.816 0 0 1-.745.386Z"/>
          </svg>
        </span>
        <p class="ml-2 font-semibold text-lg ">{metadata.getIdentificationInfo().title()}</p>
      </div>
  </div>
</div>
<hr class="border-b-2  border-gray-700 w-full ml-4">
<div class="flex items-center mt-4 ml-3">
  <p class="ml-2 pr-3 text-justify">{metadata.getIdentificationInfo().abstractInfo()}</p>
</div>

  <WmsProtocol {protocols}/>
  <WmsContactAndIndentification {email} {metadata} {keywords}/>
  <WmsTechnicalInformation {metadata} />
  <WmsLineage {metadata} {processSteps}/>
  <WmsMetadata {link}/>

{/if}
