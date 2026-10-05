<!-- src/lib/components/ogc/csw/MGBAIEvaluationModal.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import type { MGBSemanticEvaluation, MGBAIEvaluationRequest, MGBAIEvaluationResponse } from '$lib/ai/types';
    import type { MGBQuadroId } from '$lib/ogc/csw/mgb/mgbConformance';
    import { downloadMGBSemanticPdfReport } from '$lib/ai/mgbPdfReport';

    interface Props {
        isOpen: boolean;
        metadataId: string;
        metadataTitle: string;
        catalogIri?: string;
        metadataUrl?: string;
        rawXml?: string;
        quadroId?: MGBQuadroId;
        onClose: () => void;
    }

    let {
        isOpen,
        metadataId,
        metadataTitle,
        catalogIri = '',
        metadataUrl = '',
        rawXml = '',
        quadroId = 'AUTO',
        onClose
    }: Props = $props();

    let loading = $state(false);
    let errorMessage = $state('');
    let evaluation = $state<MGBSemanticEvaluation | null>(null);

    // Configurações de Provedor
    let showSettings = $state(false);
    let selectedProvider = $state<'heuristic' | 'gemini' | 'openai'>('heuristic');
    let customApiKey = $state('');
    let copiedElementId = $state<number | null>(null);

    let ratingBadge = $derived(evaluation ? getRatingBadgeClasses(evaluation.rating) : null);

    onMount(() => {
        if (typeof window !== 'undefined') {
            const savedKey = localStorage.getItem('dbdg_ai_api_key');
            const savedProv = localStorage.getItem('dbdg_ai_provider') as 'heuristic' | 'gemini' | 'openai';
            if (savedKey) customApiKey = savedKey;
            if (savedProv) selectedProvider = savedProv;
        }
    });

    // Dispara a avaliação quando a modal abre e ainda não tem avaliação
    $effect(() => {
        if (isOpen && !evaluation && !loading && !errorMessage) {
            runEvaluation();
        }
    });

    async function runEvaluation() {
        loading = true;
        errorMessage = '';

        try {
            const payload: MGBAIEvaluationRequest = {
                metadataId,
                catalogIri,
                metadataUrl,
                metadataXml: rawXml || undefined,
                quadroId,
                provider: selectedProvider,
                apiKey: customApiKey || undefined
            };

            const response = await fetch('/api/ai/avaliar-metadado', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data: MGBAIEvaluationResponse = await response.json();
            if (!response.ok || !data.success || !data.evaluation) {
                throw new Error(data.error || `Erro ${response.status} ao avaliar metadado.`);
            }

            evaluation = data.evaluation;
        } catch (err) {
            console.error('Erro na avaliação:', err);
            errorMessage = err instanceof Error ? err.message : 'Falha ao executar avaliação semântica.';
        } finally {
            loading = false;
        }
    }

    function saveSettingsAndReevaluate() {
        if (typeof window !== 'undefined') {
            localStorage.setItem('dbdg_ai_api_key', customApiKey.trim());
            localStorage.setItem('dbdg_ai_provider', selectedProvider);
        }
        showSettings = false;
        evaluation = null;
        runEvaluation();
    }

    async function copySuggestion(text: string, elementId: number) {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            copiedElementId = elementId;
            setTimeout(() => {
                copiedElementId = null;
            }, 2500);
        } catch (err) {
            console.error('Falha ao copiar:', err);
        }
    }

    function exportPdf() {
        if (!evaluation) return;
        downloadMGBSemanticPdfReport(evaluation, metadataId, metadataTitle);
    }

    function getRatingBadgeClasses(rating: string): { bg: string; text: string; ring: string } {
        switch (rating) {
            case 'Excelente':
                return {
                    bg: 'bg-emerald-100 dark:bg-emerald-950/70',
                    text: 'text-emerald-800 dark:text-emerald-300',
                    ring: 'ring-emerald-500/30'
                };
            case 'Bom':
                return {
                    bg: 'bg-sky-100 dark:bg-sky-950/70',
                    text: 'text-sky-800 dark:text-sky-300',
                    ring: 'ring-sky-500/30'
                };
            case 'Regular':
                return {
                    bg: 'bg-amber-100 dark:bg-amber-950/70',
                    text: 'text-amber-800 dark:text-amber-300',
                    ring: 'ring-amber-500/30'
                };
            default:
                return {
                    bg: 'bg-rose-100 dark:bg-rose-950/70',
                    text: 'text-rose-800 dark:text-rose-300',
                    ring: 'ring-rose-500/30'
                };
        }
    }

    function getScoreColorClass(score: number): string {
        if (score >= 90) return 'text-emerald-600 dark:text-emerald-400';
        if (score >= 75) return 'text-sky-600 dark:text-sky-400';
        if (score >= 50) return 'text-amber-600 dark:text-amber-400';
        return 'text-rose-600 dark:text-rose-400';
    }

    function getDimensionBarColor(score: number): string {
        if (score >= 85) return 'bg-emerald-500';
        if (score >= 70) return 'bg-sky-500';
        if (score >= 50) return 'bg-amber-500';
        return 'bg-rose-500';
    }

    function handleKeyDown(e: KeyboardEvent) {
        if (e.key === 'Escape' && isOpen) {
            onClose();
        }
    }
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if isOpen}
    <!-- Backdrop -->
    <div
        class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm transition-opacity"
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
    >
        <!-- Card do Modal -->
        <div class="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900">
            <!-- Cabeçalho -->
            <div class="flex items-start justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
                <div class="min-w-0 flex-1 pr-4">
                    <div class="flex items-center gap-2">
                        <span class="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                            <svg class="h-3.5 w-3.5 animate-pulse" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                            </svg>
                            Agente de IA Especialista MGB
                        </span>
                        {#if evaluation}
                            <span class="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                {evaluation.quadroTitle}
                            </span>
                        {/if}
                    </div>
                    <h2 id="modal-title" class="mt-1 line-clamp-1 text-lg font-bold text-slate-900 dark:text-white" title={metadataTitle}>
                        {metadataTitle || 'Avaliação de Metadado'}
                    </h2>
                    {#if metadataId}
                        <p class="truncate text-xs text-slate-500 dark:text-slate-400">
                            ID: {metadataId}
                        </p>
                    {/if}
                </div>

                <!-- Botões de Ação do Topo -->
                <div class="flex items-center gap-2">
                    {#if evaluation}
                        <button
                            onclick={exportPdf}
                            class="rounded-lg p-2 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50"
                            title="Gerar e Baixar Relatório em PDF"
                        >
                            <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </button>
                    {/if}
                    <button
                        onclick={() => (showSettings = !showSettings)}
                        class="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                        title="Configurações do Provedor de IA"
                    >
                        <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                    <button
                        onclick={onClose}
                        class="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                        title="Fechar janela"
                    >
                        <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            <!-- Painel de Configurações (Expansível) -->
            {#if showSettings}
                <div class="border-b border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/60">
                    <div class="flex items-center justify-between">
                        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Configurações de Inteligência Artificial
                        </h3>
                        <span class="text-[11px] text-slate-500">Privacidade: chaves são salvas apenas localmente no navegador</span>
                    </div>
                    <div class="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label class="block text-xs font-medium text-slate-700 dark:text-slate-300" for="provider-select">
                                Motor de Análise:
                            </label>
                            <select
                                id="provider-select"
                                bind:value={selectedProvider}
                                class="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                            >
                                <option value="heuristic">Especialista MGB Heurístico (Integrado, sem necessidade de chave)</option>
                                <option value="gemini">Google Gemini API (gemini-1.5-flash / gemini-2.0)</option>
                                <option value="openai">OpenAI / Compatível (GPT-4o mini)</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-medium text-slate-700 dark:text-slate-300" for="api-key-input">
                                Chave de API (Opcional):
                            </label>
                            <input
                                id="api-key-input"
                                type="password"
                                bind:value={customApiKey}
                                placeholder={selectedProvider === 'heuristic' ? 'Não necessária para motor heurístico' : 'Cole sua chave de API'}
                                disabled={selectedProvider === 'heuristic'}
                                class="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 disabled:bg-slate-100 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                            />
                        </div>
                    </div>
                    <div class="mt-3 flex justify-end gap-2">
                        <button
                            onclick={() => (showSettings = false)}
                            class="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                            Cancelar
                        </button>
                        <button
                            onclick={saveSettingsAndReevaluate}
                            class="rounded-md bg-indigo-600 px-3 py-1 text-xs font-medium text-white shadow-sm hover:bg-indigo-700"
                        >
                            Salvar e Reavaliar
                        </button>
                    </div>
                </div>
            {/if}

            <!-- Conteúdo Principal -->
            <div class="flex-1 overflow-y-auto px-6 py-5">
                {#if loading}
                    <div class="flex flex-col items-center justify-center py-16 text-center">
                        <div class="relative">
                            <div class="h-16 w-16 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600 dark:border-indigo-900 dark:border-t-indigo-400"></div>
                            <div class="absolute inset-0 flex items-center justify-center">
                                <svg class="h-6 w-6 text-indigo-600 dark:text-indigo-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                        </div>
                        <h3 class="mt-4 text-base font-semibold text-slate-800 dark:text-slate-200">
                            Auditoria Semântica MGB em Andamento...
                        </h3>
                        <p class="mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">
                            O agente está analisando a clareza textual, rastreabilidade de linhagem, coerência temático-espacial e vocabulários de acordo com o Perfil MGB 2.0.
                        </p>
                    </div>
                {:else if errorMessage}
                    <div class="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900/60 dark:bg-rose-950/40">
                        <svg class="mx-auto h-10 w-10 text-rose-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <h3 class="mt-2 text-sm font-bold text-rose-800 dark:text-rose-300">Não foi possível avaliar o metadado</h3>
                        <p class="mt-1 text-xs text-rose-600 dark:text-rose-400">{errorMessage}</p>
                        <button
                            onclick={runEvaluation}
                            class="mt-4 rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                        >
                            Tentar novamente
                        </button>
                    </div>
                {:else if evaluation}
                    <!-- Parecer Geral e Nota -->
                    <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
                        <!-- Card do Indicador de Nota Principal -->
                        <div class="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-5 text-center shadow-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
                            <span class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Nota de Avaliação Semântica
                            </span>
                            <div class="mt-3 flex items-baseline justify-center gap-1">
                                <span class="text-5xl font-black tracking-tight {getScoreColorClass(evaluation.score)}">
                                    {evaluation.score}
                                </span>
                                <span class="text-sm font-semibold text-slate-400">/100</span>
                            </div>

                            {#if ratingBadge}
                                <div class="mt-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-extrabold ring-1 {ratingBadge.bg} {ratingBadge.text} {ratingBadge.ring}">
                                    Conceito: {evaluation.rating}
                                </div>
                            {/if}

                            <p class="mt-3 text-[11px] text-slate-500 dark:text-slate-400">
                                Motor: <span class="font-semibold text-slate-700 dark:text-slate-300 capitalize">{evaluation.provider === 'heuristic' ? 'Especialista MGB Heurístico' : evaluation.provider}</span>
                            </p>
                        </div>

                        <!-- Card de Síntese Crítica Executiva -->
                        <div class="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
                            <div>
                                <div class="flex items-center gap-2">
                                    <div class="rounded-lg bg-indigo-100 p-1.5 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                        <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                        </svg>
                                    </div>
                                    <h3 class="text-sm font-bold text-slate-900 dark:text-white">
                                        Diagnóstico do Auditor de IA
                                    </h3>
                                </div>
                                <p class="mt-2.5 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                                    {evaluation.summaryFeedback}
                                </p>
                            </div>

                            <div class="mt-4 flex flex-wrap gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <span class="text-[11px] font-medium text-slate-500">Auditoria INDE MGB 2.0</span>
                                <span class="text-[11px] text-slate-400">•</span>
                                <span class="text-[11px] font-medium text-slate-500">Data: {new Date(evaluation.evaluatedAt).toLocaleDateString('pt-BR')}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Dimensões de Avaliação (Barras de Progresso) -->
                    <div class="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Desempenho por Dimensão Semântica
                        </h3>
                        <div class="mt-4 space-y-3.5">
                            {#each evaluation.dimensions as dim (dim.id)}
                                <div>
                                    <div class="flex items-center justify-between text-xs">
                                        <span class="font-semibold text-slate-800 dark:text-slate-200">
                                            {dim.name} <span class="font-normal text-slate-400">({dim.weight}%)</span>
                                        </span>
                                        <span class="font-bold {getScoreColorClass(dim.score)}">
                                            {dim.score} / 100
                                        </span>
                                    </div>
                                    <div class="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                        <div
                                            class="h-full rounded-full transition-all duration-500 {getDimensionBarColor(dim.score)}"
                                            style="width: {dim.score}%"
                                        ></div>
                                    </div>
                                    <p class="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                        {dim.feedback}
                                    </p>
                                </div>
                            {/each}
                        </div>
                    </div>

                    <!-- Pontos Fortes e Ações Prioritárias -->
                    <div class="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <!-- Pontos Fortes -->
                        <div class="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                            <div class="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                                <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                                </svg>
                                <h4 class="text-xs font-bold uppercase tracking-wider">Pontos Fortes</h4>
                            </div>
                            <ul class="mt-2.5 space-y-1.5">
                                {#each evaluation.strengths as str}
                                    <li class="flex items-start gap-1.5 text-xs text-emerald-900 dark:text-emerald-200">
                                        <span class="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500"></span>
                                        <span>{str}</span>
                                    </li>
                                {/each}
                            </ul>
                        </div>

                        <!-- Ações Prioritárias -->
                        <div class="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
                            <div class="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                                <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                                </svg>
                                <h4 class="text-xs font-bold uppercase tracking-wider">Ações Prioritárias de Melhoria</h4>
                            </div>
                            <ul class="mt-2.5 space-y-1.5">
                                {#each evaluation.priorityImprovements as imp}
                                    <li class="flex items-start gap-1.5 text-xs text-amber-900 dark:text-amber-200">
                                        <span class="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"></span>
                                        <span>{imp}</span>
                                    </li>
                                {/each}
                            </ul>
                        </div>
                    </div>

                    <!-- Avaliação Detalhada por Elemento do Quadro MGB com Sugestões -->
                    <div class="mt-6">
                        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Análise Semântica de Elementos & Sugestões de Melhoria
                        </h3>
                        <div class="mt-3 space-y-3">
                            {#each evaluation.elementEvaluations as el (el.elementId)}
                                <div class="rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/80">
                                    <div class="flex items-start justify-between gap-3">
                                        <div class="flex items-center gap-2">
                                            <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                {el.elementId}
                                            </span>
                                            <div>
                                                <h4 class="text-xs font-bold text-slate-900 dark:text-white">
                                                    {el.elementName}
                                                </h4>
                                                {#if el.currentSnippet}
                                                    <p class="mt-0.5 line-clamp-1 text-[11px] text-slate-500 dark:text-slate-400" title={el.currentSnippet}>
                                                        Atual: <span class="italic">"{el.currentSnippet}"</span>
                                                    </p>
                                                {/if}
                                            </div>
                                        </div>

                                        <span class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase {el.status === 'adequado' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : el.status === 'parcial' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'}">
                                            {el.status}
                                        </span>
                                    </div>

                                    <!-- Crítica Semântica -->
                                    <p class="mt-2 text-xs text-slate-600 dark:text-slate-300">
                                        {el.critique}
                                    </p>

                                    <!-- Sugestão Acionável de Melhoria -->
                                    {#if el.suggestedImprovement}
                                        <div class="mt-3 rounded-lg border border-indigo-100 bg-indigo-50/60 p-3 dark:border-indigo-900/60 dark:bg-indigo-950/30">
                                            <div class="flex items-center justify-between gap-2">
                                                <span class="flex items-center gap-1.5 text-[11px] font-bold text-indigo-900 dark:text-indigo-300">
                                                    <svg class="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                    </svg>
                                                    Sugestão de Aprimoramento da IA:
                                                </span>
                                                <button
                                                    onclick={() => copySuggestion(el.suggestedImprovement!, el.elementId)}
                                                    class="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 text-[11px] font-medium text-indigo-700 shadow-sm transition hover:bg-indigo-50 dark:bg-slate-800 dark:text-indigo-300 dark:hover:bg-slate-700"
                                                >
                                                    {#if copiedElementId === el.elementId}
                                                        <span class="text-emerald-600 font-bold">Copiado!</span>
                                                    {:else}
                                                        <svg class="h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                                        </svg>
                                                        <span>Copiar sugestão</span>
                                                    {/if}
                                                </button>
                                            </div>
                                            <p class="mt-1 text-xs text-indigo-950 dark:text-indigo-200">
                                                {el.suggestedImprovement}
                                            </p>
                                        </div>
                                    {/if}
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}
            </div>

            <!-- Rodapé do Modal -->
            <div class="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3.5 dark:border-slate-800 dark:bg-slate-900/60">
                <span class="text-xs text-slate-500 dark:text-slate-400">
                    Baseado no Perfil MGB 2.0 (IBGE / INDE liv101802.pdf)
                </span>
                <div class="flex items-center gap-2">
                    {#if evaluation}
                        <button
                            type="button"
                            onclick={exportPdf}
                            class="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-1 dark:bg-rose-600 dark:hover:bg-rose-500"
                            title="Gerar e baixar relatório de análise em formato PDF"
                        >
                            <svg class="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Gerar Relatório PDF
                        </button>
                        <button
                            onclick={runEvaluation}
                            disabled={loading}
                            class="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                            <svg class="h-3.5 w-3.5 {loading ? 'animate-spin' : ''}" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Reavaliar
                        </button>
                    {/if}
                    <button
                        onclick={onClose}
                        class="rounded-lg bg-slate-800 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-900 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}
