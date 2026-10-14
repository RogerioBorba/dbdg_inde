<script lang="ts">
    import { onMount } from 'svelte';
    import Navbar from '#lib/components/navbar/navbar.svelte';
    import { listToCSV } from '#lib/components/csv/gerarCSV.js';
    import { dataToPdf } from '#lib/components/pdf/gerarPDF.js';
    import { get } from '#lib/request/get.js';
    import { verificarLink } from '#lib/request/verificarLink.js';
    import type { CSWCatalog } from '#lib/ogc/csw/CSWCatalog.js';

    const PAGE_SIZE = 20;
    const LINK_TIMEOUT_MS = 15000;

    interface MetadataResource {
        protocol: string;
        name: string;
        url: string;
    }

    interface MetadataSummary {
        identifier: string;
        title: string;
        summary: string;
        resources: MetadataResource[];
    }

    interface BrokenLinkRecord {
        catalogDescription: string;
        metadataIdentifier: string;
        metadataTitle: string;
        metadataSummary: string;
        resourceProtocol: string;
        resourceName: string;
        resourceUrl: string;
        error: string;
    }

    let catalog = $state<CSWCatalog | null>(null);
    let brokenLinks = $state<BrokenLinkRecord[]>([]);
    let totalMetadata = $state(0);
    let processedMetadata = $state(0);
    let totalLinksChecked = $state(0);
    let isLoading = $state(true);
    let isCanceled = $state(false);
    let startFromRecord = $state(1);
    let maxRecordsToEvaluate = $state<number | null>(null);
    let statusMessage = $state('Preparando consulta...');
    let errorMessage = $state('');

    let targetMetadataCount = $derived(
        totalMetadata === 0
            ? 0
            : maxRecordsToEvaluate !== null
                ? Math.min(maxRecordsToEvaluate, Math.max(0, totalMetadata - startFromRecord + 1))
                : Math.max(0, totalMetadata - startFromRecord + 1)
    );
    let canExport = $derived(brokenLinks.length > 0);
    let progressValue = $derived(targetMetadataCount === 0 ? 0 : Math.min(100, Math.round((processedMetadata / targetMetadataCount) * 100)));

    function readCatalogFromQuery(): CSWCatalog | null {
        const params = new URLSearchParams(window.location.search);
        const descricao = params.get('descricao');
        const iri = params.get('iri');
        const noCentralCategoria = params.get('noCentralCategoria');
        const startStr = params.get('startPosition');
        const maxStr = params.get('maxRecords');

        if (!descricao || !iri) {
            return null;
        }

        if (startStr) {
            const parsedStart = Number.parseInt(startStr, 10);
            if (!Number.isNaN(parsedStart) && parsedStart >= 1) {
                startFromRecord = parsedStart;
            }
        }

        if (maxStr) {
            const parsedMax = Number.parseInt(maxStr, 10);
            if (!Number.isNaN(parsedMax) && parsedMax >= 1) {
                maxRecordsToEvaluate = parsedMax;
            }
        }

        return {
            id: 0,
            descricao,
            iri,
            noCentralCategoria
        };
    }

    function buildGetRecordsUrl(currentCatalog: CSWCatalog, startPosition: number, batchSize = PAGE_SIZE): URL {
        const baseUrl = currentCatalog.iri.split('?')[0];
        const url = new URL(baseUrl);

        url.searchParams.set('service', 'CSW');
        url.searchParams.set('version', '2.0.2');
        url.searchParams.set('request', 'GetRecords');
        url.searchParams.set('typeNames', 'gmd:MD_Metadata');
        url.searchParams.set('elementSetName', 'full');
        url.searchParams.set('resultType', 'results');
        url.searchParams.set('outputSchema', 'http://www.isotc211.org/2005/gmd');
        url.searchParams.set('maxRecords', String(batchSize));
        url.searchParams.set('startPosition', String(startPosition));

        if (currentCatalog.noCentralCategoria) {
            url.searchParams.set('constraintLanguage', 'CQL_TEXT');
            url.searchParams.set('CONSTRAINT_LANGUAGE_VERSION', '1.1.0');
            url.searchParams.set('constraint', `_cat = '${currentCatalog.noCentralCategoria}'`);
        }

        return url;
    }

    function queryFirstText(parent: ParentNode, selectors: string[]): string {
        for (const selector of selectors) {
            const element = parent.querySelector(selector);
            const text = element?.textContent?.trim();

            if (text) {
                return text;
            }
        }

        return '';
    }

    function normalizeText(value: string | null | undefined, fallback = 'Não informado.'): string {
        const text = value?.trim();
        return text ? text : fallback;
    }

    function getDescendantElementsByLocalName(parent: ParentNode, localName: string): Element[] {
        const root = parent as Element | Document;
        return Array.from(root.getElementsByTagName('*')).filter((element) => element.localName === localName);
    }

    function getFirstDescendantElementByLocalName(parent: ParentNode, localName: string): Element | null {
        for (const element of getDescendantElementsByLocalName(parent, localName)) {
            return element;
        }

        return null;
    }

    function parseOnlineResources(metadata: Element): MetadataResource[] {
        const resources: MetadataResource[] = [];

        for (const element of getDescendantElementsByLocalName(metadata, 'CI_OnlineResource')) {
            const url = queryFirstText(element, [
                'gmd\\:linkage gmd\\:URL',
                'linkage URL',
                'gmd\\:linkage gco\\:CharacterString',
                'linkage CharacterString',
                'gmd\\:URL',
                'URL'
            ]).trim();

            if (!url) {
                continue;
            }

            resources.push({
                protocol: queryFirstText(element, ['gmd\\:protocol gco\\:CharacterString', 'protocol CharacterString']).trim(),
                name: queryFirstText(element, ['gmd\\:name gco\\:CharacterString', 'name CharacterString']).trim(),
                url
            });
        }

        return resources;
    }

    function parseMetadataBatch(xmlText: string): { total: number; items: MetadataSummary[] } {
        const parser = new DOMParser();
        const xml = parser.parseFromString(xmlText, 'application/xml');
        const searchResults = getFirstDescendantElementByLocalName(xml, 'SearchResults');
        const total = Number.parseInt(searchResults?.getAttribute('numberOfRecordsMatched') ?? '0', 10);
        const metadataElements = getDescendantElementsByLocalName(xml, 'MD_Metadata');

        const items = metadataElements.map((metadata): MetadataSummary => ({
            identifier: queryFirstText(metadata, ['gmd\\:fileIdentifier gco\\:CharacterString', 'fileIdentifier CharacterString']),
            title: normalizeText(queryFirstText(metadata, [
                'gmd\\:identificationInfo gmd\\:citation gmd\\:title gco\\:CharacterString',
                'identificationInfo citation title CharacterString'
            ]), 'Sem título'),
            summary: normalizeText(queryFirstText(metadata, [
                'gmd\\:identificationInfo gmd\\:abstract gco\\:CharacterString',
                'identificationInfo abstract CharacterString'
            ])),
            resources: parseOnlineResources(metadata)
        }));

        return { total, items };
    }

    async function checkResource(currentCatalog: CSWCatalog, metadata: MetadataSummary, resource: MetadataResource): Promise<BrokenLinkRecord | null> {
        try {
            await verificarLink(resource.url, { getTimeout: LINK_TIMEOUT_MS });
            return null;
        } catch (error: any) {
            return {
                catalogDescription: currentCatalog.descricao,
                metadataIdentifier: metadata.identifier || 'Não informado.',
                metadataTitle: metadata.title,
                metadataSummary: metadata.summary,
                resourceProtocol: resource.protocol || 'Não informado.',
                resourceName: resource.name || 'Não informado.',
                resourceUrl: resource.url,
                error: error?.message ?? 'Falha desconhecida.'
            };
        }
    }

    async function processMetadataBatch(currentCatalog: CSWCatalog, items: MetadataSummary[]): Promise<BrokenLinkRecord[]> {
        const brokenBatch: BrokenLinkRecord[] = [];

        for (const metadata of items) {
            if (isCanceled) break;

            const checks = await Promise.all(
                metadata.resources.map(async (resource) => {
                    if (isCanceled) return null;
                    const result = await checkResource(currentCatalog, metadata, resource);
                    totalLinksChecked += 1;
                    return result;
                })
            );

            if (isCanceled) break;

            brokenBatch.push(...checks.filter((item): item is BrokenLinkRecord => item !== null));
            processedMetadata += 1;
            statusMessage = `Processando metadados ${processedMetadata} de ${targetMetadataCount || '?'} (${totalLinksChecked} links avaliados)...`;
        }

        return brokenBatch;
    }

    function cancelProcessing() {
        isCanceled = true;
        isLoading = false;
        statusMessage = `Processamento cancelado pelo usuário. ${processedMetadata} metadados avaliados (${totalLinksChecked} links verificados, ${brokenLinks.length} com falha).`;
    }

    async function loadBrokenLinks(currentCatalog: CSWCatalog) {
        brokenLinks = [];
        totalMetadata = 0;
        processedMetadata = 0;
        totalLinksChecked = 0;
        errorMessage = '';
        isLoading = true;
        isCanceled = false;

        let currentPosition = startFromRecord;

        try {
            while (!isCanceled) {
                if (maxRecordsToEvaluate !== null && processedMetadata >= maxRecordsToEvaluate) {
                    break;
                }

                const remaining = maxRecordsToEvaluate !== null
                    ? maxRecordsToEvaluate - processedMetadata
                    : PAGE_SIZE;

                const currentBatchSize = Math.min(PAGE_SIZE, remaining);
                if (currentBatchSize <= 0) {
                    break;
                }

                statusMessage = `Carregando registros ${currentPosition} a ${currentPosition + currentBatchSize - 1}...`;
                const url = buildGetRecordsUrl(currentCatalog, currentPosition, currentBatchSize);
                const response = await get(url);
                const xmlText = await response.text();
                const parsed = parseMetadataBatch(xmlText);

                totalMetadata = parsed.total;

                if (parsed.items.length === 0 || isCanceled) {
                    break;
                }

                const brokenBatch = await processMetadataBatch(currentCatalog, parsed.items);
                brokenLinks = [...brokenLinks, ...brokenBatch];

                if (isCanceled) {
                    break;
                }

                if (currentPosition + parsed.items.length > parsed.total) {
                    break;
                }

                currentPosition += parsed.items.length;
                await new Promise((resolve) => setTimeout(resolve, 0));
            }

            if (!isCanceled) {
                statusMessage = brokenLinks.length === 0
                    ? `Todos os ${totalLinksChecked} links avaliados nos ${processedMetadata} metadados estão funcionando corretamente.`
                    : `Carregamento concluído: ${brokenLinks.length} links com falha encontrados (de ${totalLinksChecked} links avaliados).`;
            }
        } catch (error: any) {
            if (!isCanceled) {
                errorMessage = `Erro ao processar links. ${error?.message ?? 'Falha desconhecida.'}`;
                statusMessage = 'Falha no carregamento.';
            }
        } finally {
            isLoading = false;
        }
    }

    function exportCSV() {
        if (!brokenLinks.length) {
            return;
        }

        listToCSV(brokenLinks, 'csw_links_quebrados.csv');
    }

    function exportPDF() {
        if (!brokenLinks.length) {
            return;
        }

        dataToPdf(brokenLinks, 'csw_links_quebrados.pdf');
    }

    onMount(async () => {
        catalog = readCatalogFromQuery();

        if (!catalog) {
            errorMessage = 'Catálogo não informado na URL.';
            statusMessage = 'Não foi possível iniciar a consulta.';
            isLoading = false;
            return;
        }

        await loadBrokenLinks(catalog);
    });
</script>

<Navbar brand="OGC/CSW Links Quebrados"></Navbar>

<section class="m-2 space-y-3">
    <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        {#if catalog}
            <div class="flex-1 rounded-md border border-gray-200 bg-white p-4 shadow-sm">
                <div class="flex flex-wrap items-center justify-between gap-2">
                    <h1 class="text-lg font-semibold text-gray-900">{catalog.descricao}</h1>
                    {#if startFromRecord > 1 || maxRecordsToEvaluate !== null}
                        <span class="rounded bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 border border-indigo-200">
                            Amostragem: a partir de #{startFromRecord}
                            {maxRecordsToEvaluate !== null ? `(máx: ${maxRecordsToEvaluate} metadados)` : '(até o final)'}
                        </span>
                    {/if}
                </div>
                <p class="mt-1 break-all text-sm text-gray-600">{catalog.iri}</p>
                {#if catalog.noCentralCategoria}
                    <p class="mt-1 text-sm text-gray-600">Categoria central: {catalog.noCentralCategoria}</p>
                {/if}
            </div>
        {/if}

        <div class="flex shrink-0 gap-2 self-start md:justify-end">
            <button
                class="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                onclick={exportCSV}
                disabled={!canExport}
            >
                Exportar CSV
            </button>
            <button
                class="rounded bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
                onclick={exportPDF}
                disabled={!canExport}
            >
                Exportar PDF
            </button>
        </div>
    </div>

    <div class="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
        <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
                <div class="flex items-center gap-3">
                    <h2 class="font-semibold text-gray-900">Progresso da verificação</h2>
                    {#if isLoading}
                        <button
                            type="button"
                            class="cursor-pointer rounded border border-rose-300 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors shadow-xs"
                            onclick={cancelProcessing}
                        >
                            Cancelar processamento
                        </button>
                    {/if}
                </div>
                <p class="text-sm text-gray-600">{statusMessage}</p>
                {#if errorMessage}
                    <p class="text-sm text-red-600">{errorMessage}</p>
                {/if}
            </div>
            <div class="text-right text-sm">
                <span class="font-bold text-gray-800">{processedMetadata}/{targetMetadataCount || '?'}</span> metadados avaliados
                <p class="text-xs text-gray-500 font-normal">
                    {totalLinksChecked} links verificados ({brokenLinks.length} com falha)
                </p>
            </div>
        </div>

        <progress class="mt-3 h-3 w-full" max="100" value={progressValue}></progress>
        <p class="mt-2 text-sm text-gray-600">{progressValue}% concluído</p>
    </div>

    {#if !isLoading && brokenLinks.length === 0 && !errorMessage}
        <div class="rounded-md border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">
            Nenhum link quebrado foi encontrado para este catálogo ({totalLinksChecked} links verificados em {processedMetadata} metadados).
        </div>
    {/if}

    <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
        {#each brokenLinks as item, index (`${item.resourceUrl}-${index}`)}
            <article class="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
                <div class="flex items-center justify-between gap-2">
                    <span class="rounded bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700">Link Quebrado</span>
                    {#if item.resourceProtocol && item.resourceProtocol !== 'Não informado.'}
                        <span class="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">{item.resourceProtocol}</span>
                    {/if}
                </div>
                <h2 class="mt-2 font-semibold text-gray-900">{item.metadataTitle}</h2>
                <p class="mt-1 break-all text-xs text-gray-500">{item.metadataIdentifier}</p>
                <div class="mt-3 space-y-2 text-sm text-gray-700">
                    {#if item.resourceName && item.resourceName !== 'Não informado.'}
                        <p><span class="font-semibold">Nome do recurso:</span> {item.resourceName}</p>
                    {/if}
                    <p><span class="font-semibold">URL:</span> <span class="break-all text-blue-600">{item.resourceUrl}</span></p>
                    <p class="text-red-600"><span class="font-semibold">Erro:</span> {item.error}</p>
                </div>
            </article>
        {/each}
    </div>
</section>
