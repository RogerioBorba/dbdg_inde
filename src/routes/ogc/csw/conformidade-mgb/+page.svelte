<script lang="ts">
    import { onMount } from 'svelte';
    import Navbar from '$lib/components/navbar/navbar.svelte';
    import CSWCatalogSelector from '$lib/components/ogc/csw/CSWCatalogSelector.svelte';
    import MGBMetadataCard from '$lib/components/ogc/csw/MGBMetadataCard.svelte';
    import { catalogos_csw, type ICatalogoCSW } from '$lib/inde/catalogos/ICatalogoGeoservico';
    import type { CSWCatalog } from '$lib/ogc/csw/CSWCatalog';
    import { get } from '$lib/request/get';
    import {
        evaluateMGBRecord,
        MGB_QUADROS_INFO,
        type MGBQuadroId,
        type MGBEvaluationResult
    } from '$lib/ogc/csw/mgb/mgbConformance';

    const PAGE_SIZE = 20;

    interface RawMetadataItem {
        identifier: string;
        title: string;
        summary: string;
        xmlElement: Element;
    }

    // Catálogos e Seleção
    let availableCatalogs = $state<CSWCatalog[]>([]);
    let selectedCatalogs = $state<CSWCatalog[]>([]);
    let activeCatalog = $state<CSWCatalog | null>(null);
    let checkedAll = $state(false);
    let newCatalogName = $state('');
    let newCatalogAddress = $state('');
    let disableButtonAddNewCatalog = $derived(newCatalogName.trim().length === 0 || newCatalogAddress.trim().length === 0);

    // Quadro Selecionado (AUTO = detecta escopo automaticamente; ou 84, 85, 86, 87)
    let selectedQuadro = $state<MGBQuadroId>('AUTO');

    // Estado do Processamento
    let rawRecords = $state<RawMetadataItem[]>([]);
    let totalRecordsInCatalog = $state(0);
    let loadedCount = $state(0);
    let isLoading = $state(false);
    let statusMessage = $state('Selecione uma instituição e clique em "Analisar Conformidade".');
    let errorMessage = $state('');

    // Filtros
    let searchTerm = $state('');
    let complianceFilter = $state<'ALL' | 'FULL' | 'PARTIAL' | 'LOW'>('ALL');

    // -----------------------------------------------------------------------
    // Avaliação Reativa com base no Quadro Selecionado
    // -----------------------------------------------------------------------
    interface EvaluatedMetadataItem {
        identifier: string;
        title: string;
        summary: string;
        evaluation: MGBEvaluationResult;
    }

    let evaluatedRecords = $derived<EvaluatedMetadataItem[]>(
        rawRecords.map((item) => ({
            identifier: item.identifier,
            title: item.title,
            summary: item.summary,
            evaluation: evaluateMGBRecord(item.xmlElement, selectedQuadro)
        }))
    );

    // Estatísticas Globais da Instituição
    let institutionStats = $derived.by(() => {
        const total = evaluatedRecords.length;
        if (total === 0) {
            return {
                total: 0,
                averagePercentage: 0,
                fullCount: 0,
                partialCount: 0,
                lowCount: 0,
                servicesCount: 0,
                datasetsCount: 0,
                nonGeoCount: 0
            };
        }

        let sumPercentage = 0;
        let full = 0;
        let partial = 0;
        let low = 0;
        let services = 0;
        let datasets = 0;
        let nonGeo = 0;

        for (const item of evaluatedRecords) {
            const p = item.evaluation.percentage;
            sumPercentage += p;
            if (p === 100) {
                full++;
            } else if (p >= 60) {
                partial++;
            } else {
                low++;
            }

            const scopeType = item.evaluation.scopeInfo.scopeType;
            if (scopeType === 'service') {
                services++;
            } else if (scopeType === 'dataset' || scopeType === 'series') {
                datasets++;
            } else {
                nonGeo++;
            }
        }

        return {
            total,
            averagePercentage: Math.round(sumPercentage / total),
            fullCount: full,
            partialCount: partial,
            lowCount: low,
            servicesCount: services,
            datasetsCount: datasets,
            nonGeoCount: nonGeo
        };
    });

    // Registros Filtrados para Exibição
    let filteredRecords = $derived.by(() => {
        let list = evaluatedRecords;

        if (searchTerm.trim().length > 0) {
            const term = searchTerm.toLowerCase();
            list = list.filter(
                (r) => r.title.toLowerCase().includes(term) || r.identifier.toLowerCase().includes(term)
            );
        }

        if (complianceFilter === 'FULL') {
            list = list.filter((r) => r.evaluation.percentage === 100);
        } else if (complianceFilter === 'PARTIAL') {
            list = list.filter((r) => r.evaluation.percentage >= 60 && r.evaluation.percentage < 100);
        } else if (complianceFilter === 'LOW') {
            list = list.filter((r) => r.evaluation.percentage < 60);
        }

        return list;
    });

    // -----------------------------------------------------------------------
    // Funções de Inicialização e Catálogos
    // -----------------------------------------------------------------------
    let seqId = 1;
    function toCSWCatalog(obj: ICatalogoCSW): CSWCatalog {
        return {
            id: seqId++,
            descricao: obj.descricao,
            iri: obj.cswGetCapabilities,
            noCentralCategoria: obj.noCentralCategoria
        };
    }

    function toggleAllCatalogs() {
        if (!checkedAll) {
            selectedCatalogs = [...availableCatalogs];
        } else {
            selectedCatalogs = [];
        }
        checkedAll = !checkedAll;
    }

    function addNewCatalog() {
        const item: CSWCatalog = {
            id: availableCatalogs.length + 1,
            descricao: newCatalogName.trim(),
            iri: newCatalogAddress.trim(),
            noCentralCategoria: null
        };
        availableCatalogs = [...availableCatalogs, item];
        selectedCatalogs = [item];
        newCatalogName = '';
        newCatalogAddress = '';
    }

    function readCatalogFromQuery(): CSWCatalog | null {
        if (typeof window === 'undefined') return null;
        const params = new URLSearchParams(window.location.search);
        const descricao = params.get('descricao');
        const iri = params.get('iri');
        const noCentralCategoria = params.get('noCentralCategoria');

        if (!descricao || !iri) return null;

        return {
            id: 0,
            descricao,
            iri,
            noCentralCategoria
        };
    }

    // -----------------------------------------------------------------------
    // Extração e Requisição CSW
    // -----------------------------------------------------------------------
    function queryFirstText(parent: ParentNode, selectors: string[]): string {
        for (const selector of selectors) {
            try {
                const element = parent.querySelector(selector);
                const text = element?.textContent?.trim();
                if (text) return text;
            } catch {
                // Ignore
            }
        }
        return '';
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

    function parseMetadataElementToRaw(metadataEl: Element): RawMetadataItem {
        const identifier = queryFirstText(metadataEl, [
            'gmd\\:fileIdentifier gco\\:CharacterString',
            'fileIdentifier CharacterString',
            'metadataIdentifier code CharacterString'
        ]);

        const title = queryFirstText(metadataEl, [
            'gmd\\:identificationInfo gmd\\:citation gmd\\:title gco\\:CharacterString',
            'identificationInfo citation title CharacterString'
        ]) || 'Sem título';

        const summary = queryFirstText(metadataEl, [
            'gmd\\:identificationInfo gmd\\:abstract gco\\:CharacterString',
            'identificationInfo abstract CharacterString'
        ]) || 'Não informado.';

        return {
            identifier,
            title,
            summary,
            xmlElement: metadataEl
        };
    }

    async function analyzeCatalog(targetCatalog: CSWCatalog) {
        activeCatalog = targetCatalog;
        rawRecords = [];
        totalRecordsInCatalog = 0;
        loadedCount = 0;
        errorMessage = '';
        isLoading = true;

        let startPosition = 1;

        try {
            while (true) {
                statusMessage = `Consultando registros ${loadedCount + 1} a ${loadedCount + PAGE_SIZE} de ${targetCatalog.descricao}...`;

                const url = buildGetRecordsUrl(targetCatalog, startPosition);
                const response = await get(url);
                const xmlText = await response.text();

                const parser = new DOMParser();
                const xml = parser.parseFromString(xmlText, 'application/xml');

                const searchResults = xml.querySelector('SearchResults, csw\\:SearchResults');
                const total = parseInt(searchResults?.getAttribute('numberOfRecordsMatched') || '0', 10);
                totalRecordsInCatalog = total;

                // Extrai os elementos de metadados retornados
                const metadataNodes = Array.from(xml.querySelectorAll('gmd\\:MD_Metadata, MD_Metadata'));

                if (metadataNodes.length > 0) {
                    // O servidor já devolveu os registros completos em GetRecords
                    for (const node of metadataNodes) {
                        rawRecords = [...rawRecords, parseMetadataElementToRaw(node)];
                    }
                    loadedCount = rawRecords.length;
                    startPosition += metadataNodes.length;

                    if (rawRecords.length >= total || metadataNodes.length < PAGE_SIZE) {
                        break;
                    }
                } else {
                    // Fallback para caso retorne apenas identificadores sintéticos
                    const idNodes = Array.from(xml.querySelectorAll('identifier, dc\\:identifier, gmd\\:fileIdentifier'));
                    const identifiers = idNodes.map((n) => n.textContent?.trim()).filter((id): id is string => !!id);

                    if (identifiers.length === 0) {
                        break;
                    }

                    const fetchedList = await Promise.all(
                        identifiers.map(async (id) => {
                            try {
                                const singleResp = await get(buildGetRecordByIdUrl(targetCatalog, id));
                                const singleText = await singleResp.text();
                                const singleDoc = new DOMParser().parseFromString(singleText, 'application/xml');
                                const singleEl = singleDoc.querySelector('gmd\\:MD_Metadata, MD_Metadata');
                                if (singleEl) {
                                    return parseMetadataElementToRaw(singleEl);
                                }
                            } catch {
                                // Ignore
                            }
                            return null;
                        })
                    );

                    for (const item of fetchedList) {
                        if (item) {
                            rawRecords = [...rawRecords, item];
                        }
                    }

                    loadedCount = rawRecords.length;
                    startPosition += identifiers.length;

                    if (rawRecords.length >= total || identifiers.length < PAGE_SIZE) {
                        break;
                    }
                }

                // Evita travamento da thread da interface
                await new Promise((resolve) => setTimeout(resolve, 10));
            }

            const currentQuadroTitle = MGB_QUADROS_INFO[selectedQuadro]?.title || 'Perfil MGB';
            statusMessage = rawRecords.length === 0
                ? 'Nenhum registro de metadado localizado para este catálogo.'
                : `Análise concluída: ${rawRecords.length} metadados avaliados contra o ${currentQuadroTitle}.`;
        } catch (err: any) {
            errorMessage = `Falha ao carregar metadados do catálogo. ${err?.message || 'Verifique o endpoint e tente novamente.'}`;
            statusMessage = 'Erro na requisição.';
        } finally {
            isLoading = false;
        }
    }

    function handleCatalogSelectAndRun() {
        if (selectedCatalogs.length === 0) {
            alert('Por favor, escolha pelo menos uma instituição na lista.');
            return;
        }
        analyzeCatalog(selectedCatalogs[0]);
    }

    // -----------------------------------------------------------------------
    // Exportação em CSV
    // -----------------------------------------------------------------------
    function escapeCsvValue(val: unknown): string {
        if (val === null || val === undefined) return '""';
        const str = String(val);
        return '"' + str.replace(/"/g, '""') + '"';
    }

    function exportToCSV() {
        if (evaluatedRecords.length === 0) return;

        const rules = evaluatedRecords[0].evaluation.elements;
        const headers = [
            'Identificador',
            'Título',
            'Percentual Conformidade (%)',
            'Status Geral',
            ...rules.map((r) => `Elemento ${r.id} - ${r.name}`)
        ];

        const rows = evaluatedRecords.map((item) => {
            return [
                escapeCsvValue(item.identifier),
                escapeCsvValue(item.title),
                escapeCsvValue(`${item.evaluation.percentage}%`),
                escapeCsvValue(item.evaluation.isFullyCompliant ? '100% Conforme' : 'Não Conforme'),
                ...item.evaluation.elements.map((el) =>
                    escapeCsvValue(el.compliant ? `OK (${el.value})` : 'AUSENTE')
                )
            ].join(',');
        });

        const csvContent = [headers.map(escapeCsvValue).join(','), ...rows].join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `conformidade_mgb_quadro${selectedQuadro}_${activeCatalog?.descricao || 'catalogo'}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    onMount(async () => {
        availableCatalogs = catalogos_csw.map((obj: any) => toCSWCatalog(obj));

        const queryCatalog = readCatalogFromQuery();
        if (queryCatalog) {
            selectedCatalogs = [queryCatalog];
            await analyzeCatalog(queryCatalog);
        } else if (availableCatalogs.length > 0) {
            selectedCatalogs = [availableCatalogs[0]];
        }
    });
</script>

<Navbar brand="OGC/CSW — Avaliação Perfil MGB"></Navbar>

<main class="mx-auto max-w-7xl p-3 space-y-4">
    <!-- Seção de Seleção de Catálogo -->
    <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h1 class="text-lg font-bold text-gray-900 dark:text-white">
            Avaliação de Conformidade com o Perfil MGB 2.0 (INDE)
        </h1>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Selecione uma instituição para verificar a conformidade dos seus metadados de acordo com os conjuntos mínimos de elementos dos <strong>Quadros 84, 85 e 86</strong>.
        </p>

        <div class="mt-4">
            <CSWCatalogSelector
                items={availableCatalogs}
                {selectedCatalogs}
                checked={checkedAll}
                nameCatalog={newCatalogName}
                adressCatalog={newCatalogAddress}
                {disableButtonAddNewCatalog}
                label="Escolha a instituição para avaliação:"
                onToggleAll={toggleAllCatalogs}
                onSelectedItemsChange={(items) => (selectedCatalogs = items)}
                onNameCatalogChange={(val) => (newCatalogName = val)}
                onAdressCatalogChange={(val) => (newCatalogAddress = val)}
                onAddCatalog={addNewCatalog}
            />
        </div>

        <div class="mt-4 flex flex-wrap items-center gap-3">
            <button
                class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300 dark:bg-blue-500 dark:hover:bg-blue-600"
                onclick={handleCatalogSelectAndRun}
                disabled={isLoading || selectedCatalogs.length === 0}
            >
                {#if isLoading}
                    <svg class="h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span>Carregando Metadados...</span>
                {:else}
                    <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Analisar Conformidade MGB</span>
                {/if}
            </button>

            {#if activeCatalog}
                <span class="text-xs text-gray-500 dark:text-gray-400">
                    Instituição ativa: <strong>{activeCatalog.descricao}</strong>
                </span>
            {/if}
        </div>
    </div>

    <!-- Barra de Progresso e Notificações -->
    {#if isLoading || statusMessage}
        <div class="rounded-lg border border-gray-200 bg-white p-3.5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div class="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
                <span>{statusMessage}</span>
                {#if totalRecordsInCatalog > 0}
                    <span class="font-bold">{loadedCount} / {totalRecordsInCatalog}</span>
                {/if}
            </div>
            {#if isLoading && totalRecordsInCatalog > 0}
                <div class="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                    <div
                        class="h-full bg-blue-600 transition-all duration-200"
                        style="width: {Math.min(100, Math.round((loadedCount / totalRecordsInCatalog) * 100))}%"
                    ></div>
                </div>
            {/if}
            {#if errorMessage}
                <p class="mt-2 text-xs font-semibold text-rose-600 dark:text-rose-400">{errorMessage}</p>
            {/if}
        </div>
    {/if}

    <!-- Seletor de Quadro MGB -->
    <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h2 class="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Seletor de Perfil / Quadro MGB para Avaliação:
            </h2>
            <span class="text-xs text-gray-500 dark:text-gray-400">
                Regra ativa: {selectedQuadro === 'AUTO' ? 'Automática por Escopo' : `Forçada (Quadro ${selectedQuadro})`}
            </span>
        </div>

        <div class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <!-- Modo Automático -->
            <button
                class="flex flex-col items-start rounded-lg border p-3 text-left transition {selectedQuadro === 'AUTO' ? 'border-emerald-600 bg-emerald-50/70 dark:border-emerald-500 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20' : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800'}"
                onclick={() => (selectedQuadro = 'AUTO')}
            >
                <div class="flex w-full items-center justify-between">
                    <span class="font-bold text-gray-900 dark:text-white">Automático</span>
                    <span class="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">Recomendado</span>
                </div>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Aplica Q87 para geosserviços, Q85 para CDG/séries e Q84 para não-geoespaciais.
                </p>
            </button>

            <!-- Quadro 84 -->
            <button
                class="flex flex-col items-start rounded-lg border p-3 text-left transition {selectedQuadro === '84' ? 'border-blue-600 bg-blue-50/70 dark:border-blue-500 dark:bg-blue-950/40 ring-2 ring-blue-500/20' : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800'}"
                onclick={() => (selectedQuadro = '84')}
            >
                <div class="flex w-full items-center justify-between">
                    <span class="font-bold text-gray-900 dark:text-white">Quadro 84</span>
                    <span class="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-800 dark:bg-blue-900 dark:text-blue-200">15 itens</span>
                </div>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Recursos em geral e não-geoespaciais.
                </p>
            </button>

            <!-- Quadro 85 -->
            <button
                class="flex flex-col items-start rounded-lg border p-3 text-left transition {selectedQuadro === '85' ? 'border-indigo-600 bg-indigo-50/70 dark:border-indigo-500 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20' : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800'}"
                onclick={() => (selectedQuadro = '85')}
            >
                <div class="flex w-full items-center justify-between">
                    <span class="font-bold text-gray-900 dark:text-white">Quadro 85</span>
                    <span class="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">20 itens</span>
                </div>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Produtos geoespaciais (CDG ou séries).
                </p>
            </button>

            <!-- Quadro 86 -->
            <button
                class="flex flex-col items-start rounded-lg border p-3 text-left transition {selectedQuadro === '86' ? 'border-purple-600 bg-purple-50/70 dark:border-purple-500 dark:bg-purple-950/40 ring-2 ring-purple-500/20' : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800'}"
                onclick={() => (selectedQuadro = '86')}
            >
                <div class="flex w-full items-center justify-between">
                    <span class="font-bold text-gray-900 dark:text-white">Quadro 86</span>
                    <span class="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-800 dark:bg-purple-900 dark:text-purple-200">21 itens</span>
                </div>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    CDG / séries do Sistema Cartográfico (SCN).
                </p>
            </button>

            <!-- Quadro 87 -->
            <button
                class="flex flex-col items-start rounded-lg border p-3 text-left transition {selectedQuadro === '87' ? 'border-cyan-600 bg-cyan-50/70 dark:border-cyan-500 dark:bg-cyan-950/40 ring-2 ring-cyan-500/20' : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800'}"
                onclick={() => (selectedQuadro = '87')}
            >
                <div class="flex w-full items-center justify-between">
                    <span class="font-bold text-gray-900 dark:text-white">Quadro 87</span>
                    <span class="rounded bg-cyan-100 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200">16 itens</span>
                </div>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Geosserviços web (WMS, WFS, WCS, CSW).
                </p>
            </button>
        </div>
    </div>

    <!-- Indicador de Conformidade Global da Instituição -->
    {#if activeCatalog && rawRecords.length > 0}
        <div class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <span class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Indicador de Conformidade Global da Instituição
                    </span>
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                        {activeCatalog.descricao}
                    </h2>
                    <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        {selectedQuadro === 'AUTO' ? 'Modo Automático: Validação adaptativa conforme o escopo de cada metadado' : MGB_QUADROS_INFO[selectedQuadro].title}
                    </p>
                </div>

                <!-- Percentual Total em Destaque -->
                <div class="flex items-center gap-4">
                    <div class="text-right">
                        <div class="text-3xl font-extrabold text-blue-600 dark:text-blue-400">
                            {institutionStats.averagePercentage}%
                        </div>
                        <div class="text-xs font-medium text-gray-500 dark:text-gray-400">
                            Média Global de Conformidade
                        </div>
                    </div>
                    <button
                        class="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                        onclick={exportToCSV}
                        title="Exportar planilha de conformidade MGB em formato CSV"
                    >
                        <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Exportar CSV</span>
                    </button>
                </div>
            </div>

            <!-- Barra de Progresso Global -->
            <div class="mt-4">
                <div class="h-3.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                    <div
                        class="h-full rounded-full transition-all duration-500 {institutionStats.averagePercentage >= 90 ? 'bg-emerald-500' : institutionStats.averagePercentage >= 60 ? 'bg-amber-500' : 'bg-rose-500'}"
                        style="width: {institutionStats.averagePercentage}%"
                    ></div>
                </div>
            </div>

            <!-- Cartões de Métricas -->
            <div class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div class="rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-900/50">
                    <p class="text-xs text-gray-500 dark:text-gray-400">Total Analisado</p>
                    <p class="mt-1 text-lg font-bold text-gray-900 dark:text-white">{institutionStats.total}</p>
                </div>
                <div class="rounded-lg bg-emerald-50 p-3 text-center dark:bg-emerald-950/30">
                    <p class="text-xs text-emerald-700 dark:text-emerald-400">100% Conforme</p>
                    <p class="mt-1 text-lg font-bold text-emerald-800 dark:text-emerald-300">{institutionStats.fullCount}</p>
                </div>
                <div class="rounded-lg bg-amber-50 p-3 text-center dark:bg-amber-950/30">
                    <p class="text-xs text-amber-700 dark:text-amber-400">Parcial (60-99%)</p>
                    <p class="mt-1 text-lg font-bold text-amber-800 dark:text-amber-300">{institutionStats.partialCount}</p>
                </div>
                <div class="rounded-lg bg-rose-50 p-3 text-center dark:bg-rose-950/30">
                    <p class="text-xs text-rose-700 dark:text-rose-400">Crítico (&lt;60%)</p>
                    <p class="mt-1 text-lg font-bold text-rose-800 dark:text-rose-300">{institutionStats.lowCount}</p>
                </div>
            </div>

            <!-- Distribuição por Escopo de Produto -->
            <div class="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-100 bg-gray-50/70 px-4 py-2.5 text-xs dark:border-gray-700/60 dark:bg-gray-900/40">
                <span class="font-semibold text-gray-700 dark:text-gray-300">Distribuição por Tipo de Recurso:</span>
                <div class="flex flex-wrap items-center gap-3">
                    <span class="inline-flex items-center gap-1.5 text-cyan-800 dark:text-cyan-300">
                        <span class="h-2 w-2 rounded-full bg-cyan-500"></span>
                        Geosserviços (Q87): <strong>{institutionStats.servicesCount}</strong>
                    </span>
                    <span class="inline-flex items-center gap-1.5 text-indigo-800 dark:text-indigo-300">
                        <span class="h-2 w-2 rounded-full bg-indigo-500"></span>
                        Produtos Geoespaciais CDG/Séries (Q85): <strong>{institutionStats.datasetsCount}</strong>
                    </span>
                    <span class="inline-flex items-center gap-1.5 text-slate-800 dark:text-slate-300">
                        <span class="h-2 w-2 rounded-full bg-slate-500"></span>
                        Não Geoespaciais / Geral (Q84): <strong>{institutionStats.nonGeoCount}</strong>
                    </span>
                </div>
            </div>
        </div>

        <!-- Filtros e Barra de Busca dos Metadados -->
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div class="relative flex-1">
                <input
                    type="text"
                    bind:value={searchTerm}
                    placeholder="Filtrar metadados por título ou identificador..."
                    class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
            </div>

            <!-- Filtro de Status -->
            <div class="flex flex-wrap gap-1.5">
                <button
                    class="rounded-lg px-3 py-1.5 text-xs font-semibold transition {complianceFilter === 'ALL' ? 'bg-gray-800 text-white dark:bg-white dark:text-gray-900' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'}"
                    onclick={() => (complianceFilter = 'ALL')}
                >
                    Todos ({evaluatedRecords.length})
                </button>
                <button
                    class="rounded-lg px-3 py-1.5 text-xs font-semibold transition {complianceFilter === 'FULL' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300'}"
                    onclick={() => (complianceFilter = 'FULL')}
                >
                    100% Conformes ({institutionStats.fullCount})
                </button>
                <button
                    class="rounded-lg px-3 py-1.5 text-xs font-semibold transition {complianceFilter === 'PARTIAL' ? 'bg-amber-700 text-white' : 'bg-amber-50 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300'}"
                    onclick={() => (complianceFilter = 'PARTIAL')}
                >
                    Parciais ({institutionStats.partialCount})
                </button>
                <button
                    class="rounded-lg px-3 py-1.5 text-xs font-semibold transition {complianceFilter === 'LOW' ? 'bg-rose-700 text-white' : 'bg-rose-50 text-rose-800 hover:bg-rose-100 dark:bg-rose-950/50 dark:text-rose-300'}"
                    onclick={() => (complianceFilter = 'LOW')}
                >
                    Críticos ({institutionStats.lowCount})
                </button>
            </div>
        </div>

        <!-- Grade de Cards Individuais de Metadados -->
        {#if filteredRecords.length === 0}
            <div class="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                Nenhum registro de metadado corresponde aos filtros selecionados.
            </div>
        {:else}
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {#each filteredRecords as item (item.identifier || item.title)}
                    <MGBMetadataCard
                        identifier={item.identifier}
                        title={item.title}
                        summary={item.summary}
                        evaluation={item.evaluation}
                    />
                {/each}
            </div>
        {/if}
    {/if}
</main>
