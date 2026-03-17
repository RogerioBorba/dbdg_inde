<script lang="ts">
    import { onMount } from 'svelte';
    import { jsPDF } from 'jspdf';
    import Navbar from '$lib/components/navbar/navbar.svelte';
    import { get } from '$lib/request/get';
    import type { CSWCatalog } from '$lib/ogc/csw/CSWCatalog';

    const PAGE_SIZE = 30;

    interface CSWMetadataCard {
        identifier: string;
        title: string;
        summary: string;
        keywords: string[];
        organizations: string[];
        emails: string[];
        referenceDates: string[];
        bbox: {
            west: string;
            east: string;
            south: string;
            north: string;
        } | null;
        restrictions: string[];
        lineage: string;
        onlineResources: Array<{
            protocol: string;
            name: string;
            url: string;
        }>;
    }

    let catalog = $state<CSWCatalog | null>(null);
    let records = $state<CSWMetadataCard[]>([]);
    let totalRecords = $state(0);
    let loadedRecords = $state(0);
    let isLoading = $state(true);
    let progressValue = $derived(totalRecords === 0 ? 0 : Math.min(100, Math.round((loadedRecords / totalRecords) * 100)));
    let statusMessage = $state('Preparando consulta...');
    let errorMessage = $state('');
    let canExport = $derived(records.length > 0);

    function readCatalogFromQuery(): CSWCatalog | null {
        const params = new URLSearchParams(window.location.search);
        const descricao = params.get('descricao');
        const iri = params.get('iri');
        const noCentralCategoria = params.get('noCentralCategoria');

        if (!descricao || !iri) {
            return null;
        }

        return {
            id: 0,
            descricao,
            iri,
            noCentralCategoria
        };
    }

    function buildGetRecordsUrl(currentCatalog: CSWCatalog, startPosition: number): URL {
        const baseUrl = currentCatalog.iri.split('?')[0];
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

        if (currentCatalog.noCentralCategoria) {
            url.searchParams.set('constraintLanguage', 'CQL_TEXT');
            url.searchParams.set('CONSTRAINT_LANGUAGE_VERSION', '1.1.0');
            url.searchParams.set('constraint', `_cat = '${currentCatalog.noCentralCategoria}'`);
        }

        return url;
    }

    function normalizeText(value: string | null | undefined, fallback = 'Não informado.'): string {
        const text = value?.trim();
        return text ? text : fallback;
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
        const keywords = new Set<string>();

        for (const descriptiveKeywords of getDescendantElementsByLocalName(metadata, 'descriptiveKeywords')) {
            for (const mdKeywords of getChildElementsByLocalName(descriptiveKeywords, 'MD_Keywords')) {
                for (const keyword of getChildElementsByLocalName(mdKeywords, 'keyword')) {
                    const text = getFirstDescendantTextByLocalName(keyword, 'CharacterString');
                    if (text) {
                        keywords.add(text);
                    }
                }
            }
        }

        return [...keywords];
    }

    function parseBbox(metadata: Element): CSWMetadataCard['bbox'] {
        const bboxElement = metadata.querySelector('gmd\\:EX_GeographicBoundingBox, EX_GeographicBoundingBox');

        if (!bboxElement) {
            return null;
        }

        const west = queryFirstText(bboxElement, ['gmd\\:westBoundLongitude gco\\:Decimal', 'westBoundLongitude Decimal']);
        const east = queryFirstText(bboxElement, ['gmd\\:eastBoundLongitude gco\\:Decimal', 'eastBoundLongitude Decimal']);
        const south = queryFirstText(bboxElement, ['gmd\\:southBoundLatitude gco\\:Decimal', 'southBoundLatitude Decimal']);
        const north = queryFirstText(bboxElement, ['gmd\\:northBoundLatitude gco\\:Decimal', 'northBoundLatitude Decimal']);

        if (!west && !east && !south && !north) {
            return null;
        }

        return { west, east, south, north };
    }

    function parseOnlineResources(metadata: Element): CSWMetadataCard['onlineResources'] {
        const resources: CSWMetadataCard['onlineResources'] = [];
        const elements = metadata.querySelectorAll('gmd\\:CI_OnlineResource, CI_OnlineResource');

        for (const element of elements) {
            const url = queryFirstText(element, ['gmd\\:linkage gmd\\:URL', 'linkage URL']);

            if (!url) {
                continue;
            }

            resources.push({
                protocol: queryFirstText(element, ['gmd\\:protocol gco\\:CharacterString', 'protocol CharacterString']),
                name: queryFirstText(element, ['gmd\\:name gco\\:CharacterString', 'name CharacterString']),
                url
            });
        }

        return resources;
    }

    function buildGetRecordByIdUrl(currentCatalog: CSWCatalog, identifier: string): URL {
        const baseUrl = currentCatalog.iri.split('?')[0];
        const url = new URL(baseUrl);

        url.searchParams.set('service', 'CSW');
        url.searchParams.set('version', '2.0.2');
        url.searchParams.set('request', 'GetRecordById');
        url.searchParams.set('elementSetName', 'full');
        url.searchParams.set('outputSchema', 'http://www.isotc211.org/2005/gmd');
        url.searchParams.set('id', identifier);

        return url;
    }

    function parseMetadataElement(metadata: Element): CSWMetadataCard {
        const identifier = queryFirstText(metadata, ['gmd\\:fileIdentifier gco\\:CharacterString', 'fileIdentifier CharacterString']);
        const title = normalizeText(queryFirstText(metadata, [
            'gmd\\:identificationInfo gmd\\:citation gmd\\:title gco\\:CharacterString',
            'identificationInfo citation title CharacterString'
        ]), 'Sem t?tulo');
        const summary = normalizeText(queryFirstText(metadata, [
            'gmd\\:identificationInfo gmd\\:abstract gco\\:CharacterString',
            'identificationInfo abstract CharacterString'
        ]));
        const keywords = extractMetadataKeywords(metadata);
        const organizations = queryAllTexts(metadata, [
            'gmd\\:contact gmd\\:organisationName gco\\:CharacterString',
            'gmd\\:pointOfContact gmd\\:organisationName gco\\:CharacterString',
            'contact organisationName CharacterString',
            'pointOfContact organisationName CharacterString'
        ]);
        const emails = queryAllTexts(metadata, ['gmd\\:electronicMailAddress gco\\:CharacterString', 'electronicMailAddress CharacterString']);
        const referenceDates = queryAllTexts(metadata, [
            'gmd\\:CI_Date gmd\\:date gco\\:Date',
            'gmd\\:CI_Date gmd\\:date gco\\:DateTime',
            'CI_Date date Date',
            'CI_Date date DateTime'
        ]);
        const restrictions = queryAllTexts(metadata, [
            'gmd\\:resourceConstraints gmd\\:useLimitation gco\\:CharacterString',
            'gmd\\:resourceConstraints gmd\\:otherConstraints gco\\:CharacterString',
            'resourceConstraints useLimitation CharacterString',
            'resourceConstraints otherConstraints CharacterString'
        ]);
        const lineage = normalizeText(queryFirstText(metadata, [
            'gmd\\:dataQualityInfo gmd\\:statement gco\\:CharacterString',
            'dataQualityInfo statement CharacterString'
        ]));

        return {
            identifier,
            title,
            summary,
            keywords,
            organizations,
            emails,
            referenceDates,
            bbox: parseBbox(metadata),
            restrictions,
            lineage,
            onlineResources: parseOnlineResources(metadata)
        };
    }

    function parseGetRecordsResponse(xmlText: string): { total: number; identifiers: string[] } {
        const parser = new DOMParser();
        const xml = parser.parseFromString(xmlText, 'application/xml');
        const searchResults = xml.querySelector('SearchResults, csw\\:SearchResults');
        const total = parseInt(searchResults?.getAttribute('numberOfRecordsMatched') || '0', 10);
        const metadataElements = Array.from(xml.querySelectorAll('gmd\\:MD_Metadata, MD_Metadata'));
        const identifiers = metadataElements
            .map((metadata) => queryFirstText(metadata, ['gmd\\:fileIdentifier gco\\:CharacterString', 'fileIdentifier CharacterString']))
            .filter(Boolean);

        return { total, identifiers };
    }

    function parseGetRecordByIdResponse(xmlText: string): CSWMetadataCard | null {
        const parser = new DOMParser();
        const xml = parser.parseFromString(xmlText, 'application/xml');
        const metadata = xml.querySelector('gmd\\:MD_Metadata, MD_Metadata');

        if (!metadata) {
            return null;
        }

        return parseMetadataElement(metadata);
    }

    function dateTimeNowAsString(): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
    }

    function escapeCSV(value: unknown): string {
        if (value === null || value === undefined) {
            return '""';
        }

        const text = String(value);
        return '"' + text.replace(/"/g, '""') + '"';
    }

    function metadataRecordToExport(record: CSWMetadataCard) {
        return {
            identificador: record.identifier,
            titulo: record.title,
            resumo: record.summary,
            palavras_chave: record.keywords.join(' | '),
            organizacoes: record.organizations.join(' | '),
            emails: record.emails.join(' | '),
            datas_de_referencia: record.referenceDates.join(' | '),
            bbox_oeste: record.bbox?.west ?? '',
            bbox_leste: record.bbox?.east ?? '',
            bbox_sul: record.bbox?.south ?? '',
            bbox_norte: record.bbox?.north ?? '',
            restricoes: record.restrictions.join(' | '),
            linhagem: record.lineage,
            recursos_online: record.onlineResources
                .map((resource) => [resource.protocol, resource.name, resource.url].filter(Boolean).join(' | '))
                .join(' || ')
        };
    }

    function downloadCSV() {
        if (!records.length) {
            return;
        }

        const exportRecords = records.map(metadataRecordToExport);
        const header = Object.keys(exportRecords[0]);
        const rows = exportRecords.map((record) =>
            header.map((key) => escapeCSV(record[key as keyof typeof record])).join(',')
        );
        const csv = [header.map(escapeCSV).join(','), ...rows].join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = `csw_metadados_${dateTimeNowAsString()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    function addPdfText(doc: jsPDF, text: string, x: number, y: number): number {
        const lines = doc.splitTextToSize(text, 520);
        const pageHeight = doc.internal.pageSize.getHeight();
        let currentY = y;

        for (const line of lines) {
            if (currentY > pageHeight - 30) {
                doc.addPage();
                currentY = 30;
            }

            doc.text(line, x, currentY);
            currentY += 14;
        }

        return currentY;
    }

    function downloadPDF() {
        if (!records.length) {
            return;
        }

        const doc = new jsPDF({ unit: 'pt', format: 'a4' });
        let y = 30;

        doc.setFontSize(16);
        y = addPdfText(doc, `Catálogo: ${catalog?.descricao ?? 'Metadados CSW'}`, 30, y);
        doc.setFontSize(10);
        y += 10;

        for (const [index, record] of records.entries()) {
            y = addPdfText(doc, `Registro ${index + 1}`, 30, y);
            y = addPdfText(doc, `Título: ${record.title}`, 30, y);
            y = addPdfText(doc, `Identificador: ${record.identifier || 'Não informado.'}`, 30, y);
            y = addPdfText(doc, `Resumo: ${record.summary}`, 30, y);
            y = addPdfText(doc, `Palavras-chave: ${record.keywords.join(', ') || 'Não informado.'}`, 30, y);
            y = addPdfText(doc, `Organizações: ${record.organizations.join(', ') || 'Não informado.'}`, 30, y);
            y = addPdfText(doc, `E-mails: ${record.emails.join(', ') || 'Não informado.'}`, 30, y);
            y = addPdfText(doc, `Datas de referência: ${record.referenceDates.join(', ') || 'Não informado.'}`, 30, y);
            y = addPdfText(
                doc,
                `BBOX: ${record.bbox ? `Oeste ${record.bbox.west}, Leste ${record.bbox.east}, Sul ${record.bbox.south}, Norte ${record.bbox.north}` : 'Não informado.'}`,
                30,
                y
            );
            y = addPdfText(doc, `Restrições: ${record.restrictions.join(', ') || 'Não informado.'}`, 30, y);
            y = addPdfText(doc, `Linhagem: ${record.lineage}`, 30, y);
            y = addPdfText(
                doc,
                `Recursos online: ${record.onlineResources.map((resource) => [resource.protocol, resource.name, resource.url].filter(Boolean).join(' | ')).join(' ; ') || 'Não informado.'}`,
                30,
                y
            );
            y += 16;
        }

        doc.save(`csw_metadados_${dateTimeNowAsString()}.pdf`);
    }

    async function loadAllMetadata(currentCatalog: CSWCatalog) {
        records = [];
        totalRecords = 0;
        loadedRecords = 0;
        errorMessage = '';
        isLoading = true;

        let startPosition = 1;

        try {
            while (true) {
                statusMessage = `Carregando registros ${loadedRecords + 1} a ${loadedRecords + PAGE_SIZE}...`;
                const url = buildGetRecordsUrl(currentCatalog, startPosition);
                const response = await get(url);
                const xmlText = await response.text();
                const { total, identifiers } = parseGetRecordsResponse(xmlText);

                totalRecords = total;

                if (identifiers.length === 0) {
                    loadedRecords = records.length;
                    break;
                }

                const fullRecords = (await Promise.all(
                    identifiers.map(async (identifier) => {
                        const fullResponse = await get(buildGetRecordByIdUrl(currentCatalog, identifier));
                        const fullXmlText = await fullResponse.text();
                        return parseGetRecordByIdResponse(fullXmlText);
                    })
                )).filter((item): item is CSWMetadataCard => item !== null);

                records = [...records, ...fullRecords];
                loadedRecords = records.length;

                if (records.length >= total || identifiers.length < PAGE_SIZE) {
                    break;
                }

                startPosition += identifiers.length;
                await new Promise((resolve) => setTimeout(resolve, 0));
            }

            statusMessage = totalRecords === 0
                ? 'Nenhum metadado encontrado para este catálogo.'
                : `Carregamento concluído: ${loadedRecords} de ${totalRecords} registros.`;
        } catch (error: any) {
            errorMessage = `Erro ao carregar metadados. ${error?.message ?? 'Falha desconhecida.'}`;
            statusMessage = 'Falha no carregamento.';
        } finally {
            isLoading = false;
        }
    }

    onMount(async () => {
        catalog = readCatalogFromQuery();

        if (!catalog) {
            errorMessage = 'Catálogo não informado na URL.';
            statusMessage = 'Não foi possível iniciar a consulta.';
            isLoading = false;
            return;
        }

        await loadAllMetadata(catalog);
    });
</script>

<Navbar brand="OGC/CSW Metadados"></Navbar>

<section class="m-2 space-y-3">
    <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        {#if catalog}
            <div class="flex-1 rounded-md border border-gray-200 bg-white p-4 shadow-sm">
                <h1 class="text-lg font-semibold text-gray-900">{catalog.descricao}</h1>
                <p class="mt-1 break-all text-sm text-gray-600">{catalog.iri}</p>
                {#if catalog.noCentralCategoria}
                    <p class="mt-1 text-sm text-gray-600">Categoria central: {catalog.noCentralCategoria}</p>
                {/if}
            </div>
        {/if}

        <div class="flex shrink-0 gap-2 self-start md:justify-end">
            <button
                class="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                onclick={downloadCSV}
                disabled={!canExport}
                title="Exportar os registros carregados em CSV"
            >
                Exportar CSV
            </button>
            <button
                class="rounded bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
                onclick={downloadPDF}
                disabled={!canExport}
                title="Exportar os registros carregados em PDF"
            >
                Exportar PDF
            </button>
        </div>
    </div>

    <div class="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
        <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
                <h2 class="font-semibold text-gray-900">Progresso do carregamento</h2>
                <p class="text-sm text-gray-600">{statusMessage}</p>
                {#if errorMessage}
                    <p class="text-sm text-red-600">{errorMessage}</p>
                {/if}
            </div>
            <div class="text-sm font-medium text-gray-700">
                {loadedRecords}/{totalRecords || '?'} registros
            </div>
        </div>

        <progress class="mt-3 h-3 w-full" max="100" value={progressValue}></progress>
        <p class="mt-2 text-sm text-gray-600">{progressValue}% concluído</p>
    </div>

    {#if !isLoading && records.length === 0 && !errorMessage}
        <div class="rounded-md border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">
            Nenhum registro de metadado foi encontrado.
        </div>
    {/if}

    <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
        {#each records as record, index (record.identifier || `${record.title}-${index}`)}
            <article class="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
                <h2 class="font-semibold text-gray-900">{record.title}</h2>
                {#if record.identifier}
                    <p class="mt-1 break-all text-xs text-gray-500">{record.identifier}</p>
                {/if}

                <div class="mt-3 space-y-3 text-sm text-gray-700">
                    <div>
                        <h3 class="font-semibold text-gray-900">Resumo</h3>
                        <p>{record.summary}</p>
                    </div>

                    <div>
                        <h3 class="font-semibold text-gray-900">Palavras-chave</h3>
                        {#if record.keywords.length > 0}
                            <div class="mt-1 flex flex-wrap gap-2">
                                {#each record.keywords as keyword}
                                    <span class="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700">{keyword}</span>
                                {/each}
                            </div>
                        {:else}
                            <p>Não informado.</p>
                        {/if}
                    </div>

                    <div>
                        <h3 class="font-semibold text-gray-900">Contatos</h3>
                        <p class="font-medium">Organizações</p>
                        {#if record.organizations.length > 0}
                            {#each record.organizations as organization}
                                <p>{organization}</p>
                            {/each}
                        {:else}
                            <p>Não informado.</p>
                        {/if}

                        <p class="mt-2 font-medium">E-mails</p>
                        {#if record.emails.length > 0}
                            {#each record.emails as email}
                                <p>{email}</p>
                            {/each}
                        {:else}
                            <p>Não informado.</p>
                        {/if}
                    </div>

                    <div>
                        <h3 class="font-semibold text-gray-900">Datas de referência</h3>
                        {#if record.referenceDates.length > 0}
                            {#each record.referenceDates as date}
                                <p>{date}</p>
                            {/each}
                        {:else}
                            <p>Não informado.</p>
                        {/if}
                    </div>

                    <div>
                        <h3 class="font-semibold text-gray-900">Extensão geográfica (BBOX)</h3>
                        {#if record.bbox}
                            <p>Oeste: {record.bbox.west || 'Não informado.'}</p>
                            <p>Leste: {record.bbox.east || 'Não informado.'}</p>
                            <p>Sul: {record.bbox.south || 'Não informado.'}</p>
                            <p>Norte: {record.bbox.north || 'Não informado.'}</p>
                        {:else}
                            <p>Não informado.</p>
                        {/if}
                    </div>

                    <div>
                        <h3 class="font-semibold text-gray-900">Restrições</h3>
                        {#if record.restrictions.length > 0}
                            {#each record.restrictions as restriction}
                                <p>{restriction}</p>
                            {/each}
                        {:else}
                            <p>Não informado.</p>
                        {/if}
                    </div>

                    <div>
                        <h3 class="font-semibold text-gray-900">Linhagem</h3>
                        <p>{record.lineage}</p>
                    </div>

                    <div>
                        <h3 class="font-semibold text-gray-900">Recursos online</h3>
                        {#if record.onlineResources.length > 0}
                            <div class="space-y-2">
                                {#each record.onlineResources as resource}
                                    <div class="rounded border border-gray-100 p-2">
                                        <p>{resource.protocol || 'Sem protocolo informado'}</p>
                                        {#if resource.name}
                                            <p>{resource.name}</p>
                                        {/if}
                                        <a class="break-all text-blue-600 hover:underline" href={resource.url} target="_blank" rel="noreferrer">{resource.url}</a>
                                    </div>
                                {/each}
                            </div>
                        {:else}
                            <p>Não informado.</p>
                        {/if}
                    </div>
                </div>
            </article>
        {/each}
    </div>
</section>
