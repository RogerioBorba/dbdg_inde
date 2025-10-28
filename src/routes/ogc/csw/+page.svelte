<script lang="ts">
    import { onMount } from "svelte";
    import { get } from "$lib/request/get";
    import {parseCSWCapabilities} from "$lib/components/ogc/csw/cswCapabilities"
    onMount(async ()=> {
        
        const res = await get('https://metadados.inde.gov.br/geonetwork/srv/por/csw?service=CSW&version=2.0.2&request=GetCapabilities');
        console.log(parseCSWCapabilities(await res.text()))
    
    });
</script>
<p>Agueade</p>