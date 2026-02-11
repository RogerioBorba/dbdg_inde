<script lang="ts">
    import type { IWCSCoverageDescription } from "$lib/ogc/wcs/wcsCapabilities";

    let { coverage } = $props();
    let metadados = $state(coverage.metadataURLs || []);

    function keywordsString() {
        return (coverage.keywords) ? coverage.keywords.join(', ') : 'Não há palavras chaves'
    }
    
    function crsAsString() {
        if (!coverage.nativeCRS)
            return ''
        return coverage.nativeCRS
    }
    
</script>
<div class="font-semibold p-3 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg shadow-sm hover:shadow-md hover:bg-gray-100 dark:hover:bg-gray-600 flex flex-col break-words text-sm text-left transition-shadow">
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
