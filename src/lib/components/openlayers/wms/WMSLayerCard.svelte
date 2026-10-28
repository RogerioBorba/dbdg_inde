<script lang="ts">
    import type { IWMSLayer, IWMSMetadataURL, IWMSStyle } from "#lib/ogc/wms/wmsCapabilities.js";

    interface Props {
        wmsLayer: IWMSLayer;
    }

    let { wmsLayer }: Props = $props();

    let metadados = $derived<IWMSMetadataURL[]>(
        (wmsLayer.metadataURLs || []).filter(
            (m) => Boolean(m && m.href && m.href.trim().length > 0)
        )
    );

    let hasMetadata = $derived(metadados.length > 0);

    let keywords = $derived(
        wmsLayer.keywords && wmsLayer.keywords.length > 0
            ? wmsLayer.keywords.filter((k) => k && k.trim().length > 0)
            : []
    );

    let stylesString = $derived(
        wmsLayer.styles && wmsLayer.styles.length > 0
            ? wmsLayer.styles.map((st: IWMSStyle) => st.title || st.name).filter(Boolean).join(', ')
            : ''
    );

    let crssString = $derived(
        wmsLayer.crs
            ? (Array.isArray(wmsLayer.crs) ? wmsLayer.crs.join(', ') : String(wmsLayer.crs))
            : ''
    );
</script>

<article class="flex flex-col justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800 text-sm">
    <div class="flex flex-col gap-2.5">
        <!-- Cabeçalho do Card: Título + Badge de Status -->
        <div class="flex items-start justify-between gap-2">
            <div class="min-w-0 flex-1">
                <h3 class="line-clamp-2 text-base font-bold text-gray-900 dark:text-white" title={wmsLayer.title || wmsLayer.name}>
                    {wmsLayer.title || wmsLayer.name || 'Sem título'}
                </h3>
                {#if wmsLayer.name && wmsLayer.name !== wmsLayer.title}
                    <p class="mt-0.5 truncate text-xs text-gray-500 font-mono dark:text-gray-400" title={`Nome técnico: ${wmsLayer.name}`}>
                        <span class="font-semibold text-gray-400">Nome:</span> {wmsLayer.name}
                    </p>
                {/if}
            </div>

            <!-- Badge de Status (Metadado) -->
            <div class="shrink-0">
                {#if hasMetadata}
                    <span class="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
                        Com metadado
                    </span>
                {:else}
                    <span class="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-800 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800">
                        Sem metadado
                    </span>
                {/if}
            </div>
        </div>

        <!-- Palavras-chave -->
        <div>
            <span class="text-xs font-semibold text-gray-600 dark:text-gray-300">Palavras-chave:</span>
            {#if keywords.length > 0}
                <div class="mt-1 flex flex-wrap gap-1">
                    {#each keywords.slice(0, 5) as kw}
                        <span class="inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                            {kw}
                        </span>
                    {/each}
                    {#if keywords.length > 5}
                        <span class="inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-500 dark:bg-gray-700 dark:text-gray-400" title={keywords.slice(5).join(', ')}>
                            +{keywords.length - 5}
                        </span>
                    {/if}
                </div>
            {:else}
                <p class="text-xs text-amber-600 dark:text-amber-400 italic">Não há palavras-chave</p>
            {/if}
        </div>

        <!-- Estilos e CRSs -->
        <div class="space-y-1 text-xs text-gray-600 dark:text-gray-400">
            {#if stylesString}
                <p class="truncate" title={`Estilo: ${stylesString}`}>
                    <strong class="font-semibold text-gray-700 dark:text-gray-300">Estilo:</strong> {stylesString}
                </p>
            {/if}
            {#if crssString}
                <p class="truncate" title={`CRSs: ${crssString}`}>
                    <strong class="font-semibold text-gray-700 dark:text-gray-300">CRSs:</strong> {crssString}
                </p>
            {/if}
        </div>
    </div>

    <!-- Rodapé: Links de Metadados -->
    <div class="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-700">
        {#if hasMetadata}
            <div class="flex flex-col gap-1.5">
                {#each metadados as metadata}
                    <div class="flex items-center justify-between text-xs">
                        <a 
                            class="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300 uppercase" 
                            href="/metadado?link={encodeURIComponent(metadata.href)}" 
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Metadado
                        </a>
                        {#if metadata.type}
                            <span class="text-[11px] text-gray-400 dark:text-gray-500">tipo: {metadata.type}</span>
                        {/if}
                    </div>
                {/each}
            </div>
        {:else}
            <span class="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase">
                Sem metadado associado
            </span>
        {/if}
    </div>
</article>

