<script lang="ts">
    import type { IWCSCoverageDescription } from "$lib/ogc/wcs/wcsCapabilities";
    import { loadCoverageDetails, type IWCSCoverageDetails } from "$lib/ogc/wcs/wcsDescribeCoverage";
    import { onMount } from "svelte";

    let {
        coverage,
        serviceUrl,
        operationUrl,
        version
    }: {
        coverage: IWCSCoverageDescription;
        serviceUrl?: string;
        operationUrl?: string;
        version?: string;
    } = $props();
    let metadados = $state(coverage.metadataURLs || []);
    let details = $state<IWCSCoverageDetails>();
    let detailsStatus = $state<'loading' | 'success' | 'error' | 'unavailable'>('loading');
    let detailsError = $state('');
    let cardElement: HTMLDivElement;

    async function loadDetails() {
        if (!serviceUrl || !version) {
            detailsStatus = 'unavailable';
            return;
        }
        try {
            details = await loadCoverageDetails(serviceUrl, operationUrl, version, coverage.identifier);
            detailsStatus = 'success';
        } catch (error) {
            detailsError = error instanceof Error ? error.message : 'Falha desconhecida';
            detailsStatus = 'error';
        }
    }

    onMount(() => {
        if (!('IntersectionObserver' in window)) {
            void loadDetails();
            return;
        }
        const observer = new IntersectionObserver((entries) => {
            if (!entries.some((entry) => entry.isIntersecting)) return;
            observer.disconnect();
            void loadDetails();
        }, { rootMargin: '300px' });
        observer.observe(cardElement);
        return () => observer.disconnect();
    });

    function keywordsString() {
        return (coverage.keywords) ? coverage.keywords.join(', ') : 'Não há palavras chaves'
    }
    
    function crsAsString() {
        if (!coverage.nativeCRS)
            return ''
        return coverage.nativeCRS
    }

    function coordinates(values?: number[]) {
        return values?.map((value) => Number.isInteger(value) ? value : Number(value.toPrecision(8))).join(', ') || '';
    }

    function megabytes(value: number) {
        return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: value < 10 ? 2 : 1 }).format(value);
    }
    
</script>
<div bind:this={cardElement} class="font-semibold p-3 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg shadow-sm hover:shadow-md hover:bg-gray-100 dark:hover:bg-gray-600 flex flex-col break-words text-sm text-left transition-shadow">
    <h2 class="font-bold text-base mb-2 text-gray-900 dark:text-white">{coverage.identifier}</h2>
    {#if coverage.title}
        <h3 class="text-gray-700 dark:text-gray-300 mb-1"><span class="font-semibold">Título:</span> {coverage.title}</h3>
    {/if}
    {#if coverage.abstract}
        <p class="text-xs text-gray-600 dark:text-gray-400 mb-1 italic">{coverage.abstract}</p>
    {/if}
    <h3 class="text-gray-700 dark:text-gray-300 mb-1"><span class="font-semibold">Palavras chaves:</span> {keywordsString()}</h3>
    {#if coverage.nativeCRS}
        <h3 class="text-gray-700 dark:text-gray-300 mb-2"><span class="font-semibold">CRS Nativo:</span> {crsAsString()}</h3>
    {/if}
    {#if coverage.formats && coverage.formats.length > 0}
        <h3 class="text-gray-700 dark:text-gray-300 mb-2"><span class="font-semibold">Formatos:</span> {coverage.formats.join(', ')}</h3>
    {/if}

    <div class="my-2 border-t border-gray-200 pt-2 dark:border-gray-600">
        <h3 class="mb-1 font-bold text-gray-800 dark:text-gray-100">DescribeCoverage</h3>
        {#if detailsStatus === 'loading'}
            <p class="text-xs text-blue-600 dark:text-blue-300">Consultando detalhes da cobertura...</p>
        {:else if detailsStatus === 'error'}
            <p class="text-xs text-red-600 dark:text-red-300" title={detailsError}>Não foi possível obter os detalhes: {detailsError}</p>
        {:else if detailsStatus === 'unavailable'}
            <p class="text-xs text-gray-500">URL do serviço indisponível.</p>
        {:else if details}
            {#if details.dimensions}
                <p><span class="font-semibold">Dimensões da grade:</span> {details.dimensions.join(' × ')} células</p>
            {/if}
            {#if details.axisLabels?.length}
                <p><span class="font-semibold">Eixos:</span> {details.axisLabels.join(', ')}</p>
            {/if}
            {#if details.boundingBox}
                <p><span class="font-semibold">Envelope:</span> [{coordinates(details.boundingBox.lowerCorner)}] a [{coordinates(details.boundingBox.upperCorner)}]</p>
            {/if}
            {#if details.nativeCRS || details.supportedCRSs.length}
                <p><span class="font-semibold">CRS:</span> {details.nativeCRS || details.supportedCRSs.join(', ')}</p>
            {/if}
            {#if details.fields.length}
                <p><span class="font-semibold">Campos/bandas:</span> {details.fields.join(', ')}</p>
            {/if}
            {#if details.dataType}
                <p><span class="font-semibold">Tipo de dado:</span> {details.dataType}{details.bytesPerSample ? ` (${details.bytesPerSample} byte(s)/amostra)` : ''}</p>
            {/if}
            {#if details.formats.length}
                <p><span class="font-semibold">Formatos suportados:</span> {details.formats.join(', ')}</p>
            {/if}
            {#if details.estimatedSizeMB !== undefined}
                <p class="mt-1 text-blue-700 dark:text-blue-300"><span class="font-bold">Tamanho estimado:</span> {megabytes(details.estimatedSizeMB)} MB <span class="text-xs">(sem compressão)</span></p>
                <p class="text-xs text-gray-500 dark:text-gray-400">Base do cálculo: {details.sizeEstimateAssumption}.</p>
            {:else}
                <p class="mt-1 text-xs text-amber-700 dark:text-amber-300"><span class="font-semibold">Tamanho estimado:</span> indisponível ({details.estimateUnavailableReason}).</p>
            {/if}
        {/if}
    </div>
    
    {#if metadados && metadados.length > 0}
        {#each metadados as metadata}
            <p class="text-xs mb-1">
                <a class="text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:text-blue-800 dark:hover:text-blue-300" 
                   href="{metadata.href}" 
                   target="_blank"
                   rel="noreferrer">
                   Link metadado
                </a>
                {#if metadata.type}
                    <span class="text-gray-600 dark:text-gray-400"> (tipo: {metadata.type})</span>
                {/if}
            </p>
        {/each}
    {:else}
        <span class="text-xs text-yellow-600 dark:text-yellow-400 uppercase font-medium">Sem metadado associado</span>
    {/if}
</div>
