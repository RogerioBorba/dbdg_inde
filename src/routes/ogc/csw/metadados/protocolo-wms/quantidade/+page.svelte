<script lang="ts">
    import Navbar from '$lib/components/navbar/navbar.svelte';
    import { preventDefault } from '$lib/components/svelte_util/util';
    import { get } from '$lib/request/get';

    const inputTitle = 'Link de metadados';
    const wmsProtocolFilter = '<Filter xmlns="http://www.opengis.net/ogc"><PropertyIsEqualTo><PropertyName>protocol</PropertyName><Literal>OGC:WMS</Literal></PropertyIsEqualTo></Filter>';

    let totalMetadataCount = $state(0);
    let wmsMetadataCount = $state(0);
    let urlCatalogo = $state('https://metadados.inde.gov.br/geonetwork/srv/eng/csw');
    let isLoading = $state(false);
    let errorMessage = $state('');

    function buildGetRecordsUrl(baseCatalogUrl: string, constraint?: string): URL {
        const baseUrl = baseCatalogUrl.split('?')[0];
        const url = new URL(baseUrl);

        url.searchParams.set('service', 'CSW');
        url.searchParams.set('version', '2.0.2');
        url.searchParams.set('request', 'GetRecords');
        url.searchParams.set('typeNames', 'gmd:MD_Metadata');
        url.searchParams.set('elementSetName', 'brief');
        url.searchParams.set('resultType', 'hits');

        if (constraint) {
            url.searchParams.set('constraintLanguage', 'FILTER');
            url.searchParams.set('CONSTRAINT_LANGUAGE_VERSION', '1.1.0');
            url.searchParams.set('constraint', constraint);
        }

        return url;
    }

    function parseMatchedRecords(xmlText: string): number {
        const parser = new DOMParser();
        const xml = parser.parseFromString(xmlText, 'application/xml');
        const searchResults = xml.querySelector('SearchResults, csw\\:SearchResults');
        return Number.parseInt(searchResults?.getAttribute('numberOfRecordsMatched') ?? '0', 10);
    }

    async function fetchMatchedRecords(url: URL): Promise<number> {
        const response = await get(url);
        const xmlText = await response.text();
        return parseMatchedRecords(xmlText);
    }

    async function btnCatalogoClicked() {
        isLoading = true;
        errorMessage = '';

        try {
            totalMetadataCount = await fetchMatchedRecords(buildGetRecordsUrl(urlCatalogo));
            wmsMetadataCount = await fetchMatchedRecords(buildGetRecordsUrl(urlCatalogo, wmsProtocolFilter));
        } catch (error) {
            console.error('Erro na requisição em protocolo-wms-quantidade', error);
            errorMessage = 'Não foi possível consultar o catálogo informado.';
        } finally {
            isLoading = false;
        }
    }
</script>

<Navbar brand="OGC/CSW Checker"></Navbar>

<div class="relative mt-4 flex text-gray-700">
    <input
        class="w-full rounded-lg border-gray-300 p-2 text-sm shadow-sm focus:outline-none"
        placeholder="URL CSW"
        type="text"
        bind:value={urlCatalogo}
        title={inputTitle}
    >
    <button
        class="inline-flex items-center rounded px-1 font-bold hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
        onclick={preventDefault(btnCatalogoClicked)}
        title="Buscar quantidade"
        disabled={isLoading}
    >
        <svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="20" height="20" viewBox="0 0 24 24"><path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z" /></svg>
    </button>
</div>

{#if errorMessage}
    <p class="mt-2 text-sm text-red-600">{errorMessage}</p>
{/if}

<p class="mt-2 text-lg text-blue-600">Quantidade de metadados: {totalMetadataCount}</p>
<p class="mt-2 text-lg text-blue-600">Quantidade de metadados com o protocolo WMS: {wmsMetadataCount}</p>
