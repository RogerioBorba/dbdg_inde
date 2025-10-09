<script lang="ts">
import {get } from '$lib/request/get'
import { onMount } from 'svelte';

onMount(async() => {
    const url =  "/api/inde/catalogos-servicos";
    try {
        const url1 = 'https://inde.gov.br/api/catalogo/get';
        const resp = await get('https://geoservicos.ibge.gov.br/geoserverIBGE/ows?service=WMS&version=1.3.0&request=GetCapabilities');
        console.log(await resp.text());
    } catch (error) {
        console.error(`Failed to fetch catalogos_servicos: ${url}`, error);
    }
})
</script>
<h1>Olá</h1>