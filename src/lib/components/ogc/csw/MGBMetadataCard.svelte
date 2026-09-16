<script lang="ts">
    import type { MGBEvaluationResult } from '$lib/ogc/csw/mgb/mgbConformance';

    interface Props {
        identifier: string;
        title: string;
        summary?: string;
        evaluation: MGBEvaluationResult;
        catalogIri?: string;
        metadataUrl?: string;
    }

    let {
        identifier,
        title,
        summary = '',
        evaluation,
        catalogIri = 'https://metadados.inde.gov.br/geonetwork/srv/por/csw',
        metadataUrl = ''
    }: Props = $props();

    let showDetails = $state(false);

    function toggleDetails() {
        showDetails = !showDetails;
    }

    function buildGetRecordByIdUrl(baseIri: string, id: string): string {
        const baseUrl = baseIri.split('?')[0];
        return `${baseUrl}?service=CSW&version=2.0.2&request=GetRecordById&elementSetName=full&outputSchema=csw:IsoRecord&id=${encodeURIComponent(id)}`;
    }

    let recordUrl = $derived.by(() => {
        if (metadataUrl) return metadataUrl;
        if (catalogIri && identifier) {
            return buildGetRecordByIdUrl(catalogIri, identifier);
        }
        return '';
    });

    let viewMetadataHref = $derived(
        recordUrl ? `/metadado?link=${encodeURIComponent(recordUrl)}` : ''
    );

    function getScoreBadgeClass(percentage: number): { bg: string; text: string; bar: string } {
        if (percentage >= 90) {
            return {
                bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800',
                text: 'text-emerald-700 dark:text-emerald-400',
                bar: 'bg-emerald-500'
            };
        }
        if (percentage >= 60) {
            return {
                bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800',
                text: 'text-amber-700 dark:text-amber-400',
                bar: 'bg-amber-500'
            };
        }
        return {
            bg: 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800',
            text: 'text-rose-700 dark:text-rose-400',
            bar: 'bg-rose-500'
        };
    }

    function getScopeBadgeClass(type: string): string {
        if (type === 'service') {
            return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300';
        }
        if (type === 'dataset' || type === 'series') {
            return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300';
        }
        return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
    }

    let badgeColors = $derived(getScoreBadgeClass(evaluation.percentage));
</script>

<article class="flex flex-col justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
    <div>
        <!-- Cabeçalho do Card -->
        <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 flex-1">
                {#if viewMetadataHref}
                    <a
                        href={viewMetadataHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="line-clamp-2 text-base font-bold text-gray-900 transition hover:text-blue-600 hover:underline dark:text-white dark:hover:text-blue-400"
                        title={`Visualizar metadado: ${title || 'Sem título'}`}
                    >
                        {title || 'Sem título'}
                    </a>
                {:else}
                    <h3 class="line-clamp-2 text-base font-bold text-gray-900 dark:text-white" title={title}>
                        {title || 'Sem título'}
                    </h3>
                {/if}
                {#if identifier}
                    <p class="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400" title={identifier}>
                        ID: {identifier}
                    </p>
                {/if}
                <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span class="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold {getScopeBadgeClass(evaluation.scopeInfo.scopeType)}">
                        {evaluation.scopeInfo.scopeLabel}
                    </span>
                    <span class="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                        Quadro {evaluation.quadroId} ({evaluation.totalElements} itens)
                    </span>
                </div>
            </div>

            <!-- Badge de Percentual -->
            <div class="flex shrink-0 flex-col items-end">
                <span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold {badgeColors.bg} {badgeColors.text}">
                    {evaluation.percentage}% MGB
                </span>
                <span class="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                    {evaluation.compliantElements}/{evaluation.totalElements} itens
                </span>
            </div>
        </div>

        <!-- Barra de Progresso Individual -->
        <div class="mt-3">
            <div class="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                <div
                    class="h-full rounded-full transition-all duration-300 {badgeColors.bar}"
                    style="width: {evaluation.percentage}%"
                ></div>
            </div>
        </div>

        <!-- Resumo do Metadado -->
        {#if summary && summary !== 'Não informado.'}
            <p class="mt-3 line-clamp-2 text-xs text-gray-600 dark:text-gray-300">
                {summary}
            </p>
        {/if}
    </div>

    <!-- Rodapé e Detalhes Expansíveis -->
    <div class="mt-4 border-t border-gray-100 pt-3 dark:border-gray-700/60">
        <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="text-xs font-medium {evaluation.isFullyCompliant ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}">
                {evaluation.isFullyCompliant ? '100% Conforme' : `${evaluation.totalElements - evaluation.compliantElements} pendências`}
            </span>
            <div class="flex flex-wrap items-center gap-2">
                {#if viewMetadataHref}
                    <a
                        href={viewMetadataHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:bg-blue-600 dark:hover:bg-blue-500"
                        title="Visualizar metadado completo em outra página"
                    >
                        <svg class="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Ver metadado
                    </a>
                {/if}
                <button
                    class="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    onclick={toggleDetails}
                    aria-expanded={showDetails}
                >
                    {showDetails ? 'Ocultar elementos' : 'Ver conformidade'}
                    <svg
                        class="h-3.5 w-3.5 transition-transform duration-200 {showDetails ? 'rotate-180' : ''}"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>
        </div>

        {#if showDetails}
            <div class="mt-3 max-h-80 space-y-2 overflow-y-auto rounded-md border border-gray-100 bg-gray-50 p-2.5 text-xs dark:border-gray-700 dark:bg-gray-900/50">
                <p class="font-semibold text-gray-700 dark:text-gray-300">
                    Elementos avaliados ({evaluation.quadroTitle}):
                </p>
                {#each evaluation.elements as el (el.id)}
                    <div class="flex items-start justify-between gap-2 border-b border-gray-100 pb-1.5 last:border-0 dark:border-gray-800">
                        <div class="min-w-0 flex-1">
                            <div class="flex items-center gap-1.5">
                                {#if el.compliant}
                                    <svg class="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                    </svg>
                                {:else}
                                    <svg class="h-3.5 w-3.5 shrink-0 text-rose-500 dark:text-rose-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                                    </svg>
                                {/if}
                                <span class="font-medium text-gray-800 dark:text-gray-200">
                                    {el.id}. {el.name}
                                </span>
                            </div>
                            <p class="mt-0.5 truncate pl-5 text-[11px] text-gray-500 dark:text-gray-400" title={el.value}>
                                {el.compliant ? `Valor: ${el.value}` : 'Não preenchido'}
                            </p>
                        </div>
                        <span class="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold {el.compliant ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'}">
                            {el.compliant ? 'OK' : 'Ausente'}
                        </span>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</article>
