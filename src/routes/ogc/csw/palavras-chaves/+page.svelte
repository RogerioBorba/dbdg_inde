<script lang="ts">
    import { onMount } from 'svelte';
    import { FileCsvSolid, FilePdfSolid } from 'flowbite-svelte-icons';
    import { listToCSV } from '$lib/components/csv/gerarCSV';
    import Navbar from '$lib/components/navbar/navbar.svelte';
    import { dataToPdf } from '$lib/components/pdf/gerarPDF';
    import { preventDefault } from '$lib/components/svelte_util/util';
    import CSWCatalogSelector from '$lib/components/ogc/csw/CSWCatalogSelector.svelte';
    import type { CSWCatalog } from '$lib/ogc/csw/CSWCatalog';
    import { catalogos_csw, type ICatalogoCSW } from '$lib/inde/catalogos/ICatalogoGeoservico';
    import { get } from '$lib/request/get';

    const PAGE_SIZE = 30;

    let selectedItems: CSWCatalog[] = $state([]);
    let availableCatalogs = $state<CSWCatalog[]>([]);
    let checked = $state(false);
    let nameCatalog = $state('');
    let adressCatalog = $state('');
    let disableButtonAddNewCatalog = $derived(nameCatalog.length === 0 || adressCatalog.length === 0);
    let keywordCountByName = $state<Record<string, number>>({});
    let allKeywords: string[] = $state([]);
    let countCatalogsProcessed = $state(0);
    let countMetadataProcessed = $state(0);
    let isProcessing = $state(false);
    let nextCatalogId = 1;

    function toCSWCatalog(obj: ICatalogoCSW): CSWCatalog {
        return {
            id: nextCatalogId++,
            descricao: obj.descricao,
            iri: obj.cswGetCapabilities,
            noCentralCategoria: obj.noCentralCategoria
        };
    }

    function addNewCatalog() {
        const newCatalog: CSWCatalog = {
            id: availableCatalogs.length + 1,
            descricao: nameCatalog,
            iri: adressCatalog,
            noCentralCategoria: null
        };

        availableCatalogs = [...availableCatalogs, newCatalog];
        nameCatalog = '';
        adressCatalog = '';
    }

    function toggleAll() {
        checked = !checked;
        selectedItems = checked ? [...availableCatalogs] : [];
    }

    function buildGetRecordsUrl(catalog: CSWCatalog, startPosition: number): URL {
        const baseUrl = catalog.iri.split('?')[0];
        const url = new URL(baseUrl);

        url.searchParams.set('service', 'CSW');
        url.searchParams.set('version', '2.0.2');
        url.searchParams.set('request', 'GetRecords');
        url.searchParams.set('typeNames', 'gmd:MD_Metadata');
        url.searchParams.set('elementSetName', 'full');
        url.searchParams.set('resultType', 'results');
        url.searchParams.set('outputSchema', 'http://www.isotc211.org/2005/gmd');
        url.searchParams.set('maxRecords', String(PAGE_SIZE));
        url.searchParams.set('startPosition', String(startPosition));

        if (catalog.noCentralCategoria) {
            url.searchParams.set('constraintLanguage', 'CQL_TEXT');
            url.searchParams.set('CONSTRAINT_LANGUAGE_VERSION', '1.1.0');
            url.searchParams.set('constraint', `_cat = '${catalog.noCentralCategoria}'`);
        }

        return url;
    }


    function buildGetRecordByIdUrl(catalog: CSWCatalog, identifier: string): URL {
        const baseUrl = catalog.iri.split('?')[0];
        const url = new URL(baseUrl);

        url.searchParams.set('service', 'CSW');
        url.searchParams.set('version', '2.0.2');
        url.searchParams.set('request', 'GetRecordById');
        url.searchParams.set('elementSetName', 'full');
        url.searchParams.set('outputSchema', 'http://www.isotc211.org/2005/gmd');
        url.searchParams.set('id', identifier);

        return url;
    }

    function queryAllTexts(parent: ParentNode, selectors: string[]): string[] {
        const values = new Set<string>();

        for (const selector of selectors) {
            for (const element of parent.querySelectorAll(selector)) {
                const text = element.textContent?.trim();
                if (text) {
                    values.add(text);
                }
            }
        }

        return [...values];
    }


    function getChildElementsByLocalName(parent: Element, localName: string): Element[] {
        return Array.from(parent.children).filter((child) => child.localName === localName);
    }


    function getDescendantElementsByLocalName(parent: Element, localName: string): Element[] {
        return Array.from(parent.getElementsByTagName('*')).filter((element) => element.localName === localName);
    }

    function getFirstDescendantTextByLocalName(parent: Element, localName: string): string {
        for (const element of Array.from(parent.getElementsByTagName('*'))) {
            if (element.localName === localName) {
                const text = element.textContent?.trim();
                if (text) {
                    return text;
                }
            }
        }

        return '';
    }

    function extractMetadataKeywords(metadata: Element): string[] {
        const keywords: string[] = [];

        for (const descriptiveKeywords of getDescendantElementsByLocalName(metadata, 'descriptiveKeywords')) {
            for (const mdKeywords of getChildElementsByLocalName(descriptiveKeywords, 'MD_Keywords')) {
                for (const keyword of getChildElementsByLocalName(mdKeywords, 'keyword')) {
                    const text = getFirstDescendantTextByLocalName(keyword, 'CharacterString');
                    if (text) {
                        keywords.push(text);
                    }
                }
            }
        }

        return keywords;
    }

    function parseGetRecordsResponse(xmlText: string): { total: number; metadataCount: number; identifiers: string[] } {
        const parser = new DOMParser();
        const xml = parser.parseFromString(xmlText, 'application/xml');
        const searchResults = xml.querySelector('SearchResults, csw\\:SearchResults');
        const total = parseInt(searchResults?.getAttribute('numberOfRecordsMatched') || '0', 10);
        const metadataElements = Array.from(xml.querySelectorAll('gmd\\:MD_Metadata, MD_Metadata'));
        const identifiers = metadataElements
            .map((metadata) => queryAllTexts(metadata, ['gmd\\:fileIdentifier gco\\:CharacterString', 'fileIdentifier CharacterString'])[0] || '')
            .filter(Boolean);

        return { total, metadataCount: metadataElements.length, identifiers };
    }

    function parseGetRecordByIdKeywordsResponse(xmlText: string): string[] {
        const parser = new DOMParser();
        const xml = parser.parseFromString(xmlText, 'application/xml');
        const metadata = xml.querySelector('gmd\\:MD_Metadata, MD_Metadata');

        if (!metadata) {
            return [];
        }

        return extractMetadataKeywords(metadata);
    }

    function accumulateKeywords(keywords: string[]) {
        const newCounts = { ...keywordCountByName };

        for (const keyword of keywords) {
            newCounts[keyword] = (newCounts[keyword] || 0) + 1;
        }

        keywordCountByName = newCounts;
        allKeywords = [...allKeywords, ...keywords];
    }

    async function processCatalogKeywords(catalog: CSWCatalog) {
        let startPosition = 1;
        let total = 0;

        while (true) {
            const url = buildGetRecordsUrl(catalog, startPosition);
            const response = await get(url);
            const xmlText = await response.text();
            const parsed = parseGetRecordsResponse(xmlText);

            total = parsed.total;

            const keywords = (await Promise.all(
                parsed.identifiers.map(async (identifier) => {
                    const fullResponse = await get(buildGetRecordByIdUrl(catalog, identifier));
                    const fullXmlText = await fullResponse.text();
                    return parseGetRecordByIdKeywordsResponse(fullXmlText);
                })
            )).flat();

            accumulateKeywords(keywords);

            if (parsed.metadataCount === 0 || startPosition + parsed.metadataCount > total) {
                break;
            }

            startPosition += parsed.metadataCount;
            await new Promise((resolve) => setTimeout(resolve, 0));
        }

        countMetadataProcessed += total;
        countCatalogsProcessed += 1;
    }

    async function btnSearchClicked() {
        if (selectedItems.length === 0) {
            return alert('Escolha pelo menos uma instituição');
        }

        countCatalogsProcessed = 0;
        countMetadataProcessed = 0;
        keywordCountByName = {};
        allKeywords = [];
        isProcessing = true;

        try {
            await Promise.all(selectedItems.map((catalog) => processCatalogKeywords(catalog)));
        } finally {
            isProcessing = false;
        }
    }

    function btnPDFClicked() {
        const sortedKeywords = Object.entries(keywordCountByName)
            .sort((a, b) => b[1] - a[1])
            .map(([keyword, count]) => ({ keyword, count }));

        dataToPdf(sortedKeywords, 'palavras_chaves_csw.pdf');
    }

    function btnCSVClicked() {
        const keywordArray = Object.entries(keywordCountByName).map(([keyword, count]) => ({ keyword, count }));
        listToCSV(keywordArray, 'palavras_chaves_csw.csv');
    }

    onMount(() => {
        availableCatalogs = catalogos_csw.map((catalog) => toCSWCatalog(catalog));
    });
</script>

<Navbar brand="OGC/CSW Palavras-chave"></Navbar>
<form class="m-2">
    <CSWCatalogSelector
        items={availableCatalogs}
        {selectedItems}
        {checked}
        {nameCatalog}
        {adressCatalog}
        {disableButtonAddNewCatalog}
        onToggleAll={toggleAll}
        onSelectedItemsChange={(items) => selectedItems = items}
        onNameCatalogChange={(value) => nameCatalog = value}
        onAdressCatalogChange={(value) => adressCatalog = value}
        onAddCatalog={addNewCatalog}
    />

    <div class="flex flex-col md:flex-row items-center m-2 text-sm font-medium text-gray-900 dark:text-gray-400">
        <button
            class="mr-4 focus:outline-none bg-grey-light hover:bg-grey font-bold rounded inline-flex items-center hover:bg-gray-100 disabled:cursor-not-allowed disabled:bg-gray-200"
            disabled={selectedItems.length === 0 || isProcessing}
            onclick={preventDefault(btnSearchClicked)}
            title="Realizar requisição"
        >
            <svg class="text-indigo-500 fill-current border rounded border-gray-400" xmlns="http://www.w3.org/2000/svg" version="1.1" width="20" height="20" color="green" viewBox="0 0 24 24"><path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z" /></svg>
        </button>

        <p class="mr-2">Quantidade de catálogos processados: {countCatalogsProcessed}/{selectedItems.length}</p>
        {#if isProcessing}
            <div class="animate-pulse mr-2 text-blue-600 font-semibold">Processando catálogos...</div>
        {/if}
        <p class="ml-auto text-sm">Qtd de metadados: {countMetadataProcessed}</p>
        <p class="ml-auto text-sm">Qtd de palavras-chave: {allKeywords.length}</p>

        <div class="flex gap-0">
            <button
                class="ml-2 focus:outline-none bg-grey-light hover:bg-grey font-bold rounded inline-flex items-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-200"
                disabled={allKeywords.length === 0}
                onclick={preventDefault(btnPDFClicked)}
                title="Gerar PDF com todas as palavras-chave"
            >
                <FilePdfSolid class="h-6 w-6 text-red-500 shrink-0" />
            </button>
            <button
                class="ml-2 focus:outline-none bg-grey-light hover:bg-grey font-bold rounded inline-flex items-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-200"
                disabled={allKeywords.length === 0}
                onclick={preventDefault(btnCSVClicked)}
                title="Gerar CSV com todas as palavras-chave"
            >
                <FileCsvSolid class="h-6 w-6 text-green-500 shrink-0" />
            </button>
        </div>
    </div>
</form>

<div class="m-2 grid gap-2 md:grid-cols-4 grid-cols-2">
    {#each Object.entries(keywordCountByName).sort((a, b) => b[1] - a[1]) as keyCount, i (i)}
        <div class="p-2 bg-gray-200 text-gray-800 rounded-md shadow-sm hover:shadow-md flex flex-col break-words text-sm text-left">
            <h2><span class="font-semibold">{keyCount[0]}:</span> {keyCount[1]}</h2>
        </div>
    {/each}
</div>
