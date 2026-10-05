<script lang="ts">
    import MetadataViewer from '$lib/components/metadata/MetadataViewer.svelte';
</script>

<<<<<<< HEAD
<MetadataViewer backUrl="/ogc/csw/conformidade-mgb" backLabel="Voltar" />
=======
<<<<<<<< HEAD:src/routes/visualizador/metadata/+page.svelte
<MetadataViewer backUrl="/visualizador/ol" backLabel="Voltar ao visualizador" />
========
<svelte:head>
    <title>{metadata ? `${metadata.title} | Metadado` : 'Visualizador de Metadado'}</title>
</svelte:head>

{#if loading}
    <div class="min-h-screen bg-slate-100 px-4 py-10">
        <div class="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p class="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">Metadado</p>
            <h1 class="mt-2 text-3xl font-semibold text-slate-900">Carregando registro</h1>
            <p class="mt-3 animate-pulse text-slate-600">Buscando e interpretando o XML do metadado...</p>
        </div>
    </div>
{:else if errorMessage}
    <div class="min-h-screen bg-slate-100 px-4 py-10">
        <div class="mx-auto max-w-4xl rounded-3xl border border-rose-200 bg-white p-8 shadow-sm">
            <p class="text-sm font-semibold uppercase tracking-[0.2em] text-rose-700">Falha</p>
            <h1 class="mt-2 text-3xl font-semibold text-slate-900">Nao foi possivel abrir o metadado</h1>
            <p class="mt-4 text-slate-700">{errorMessage}</p>
            {#if sourceUrl}
                <a
                    class="mt-6 inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                    href={sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Abrir XML original
                </a>
            {/if}
        </div>
    </div>
{:else if metadata}
    <div class="min-h-screen bg-[linear-gradient(180deg,#e0f2fe_0%,#f8fafc_22%,#f8fafc_100%)] px-4 py-8 text-slate-800">
        <div class="mx-auto max-w-6xl">
            <div class="rounded-[2rem] border border-sky-100 bg-white/95 p-6 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur">
                <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div class="max-w-4xl">
                        <p class="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">Registro de metadado</p>
                        <h1 class="mt-3 text-3xl font-semibold leading-tight text-slate-950 md:text-4xl">
                            {metadata.title}
                        </h1>
                        {#if metadata.abstractText}
                            <p class="mt-4 max-w-4xl text-sm leading-7 text-slate-600 md:text-base">
                                {metadata.abstractText}
                            </p>
                        {/if}
                    </div>

                    <div class="flex flex-wrap gap-2 md:justify-end">
                        <a
                            class="inline-flex rounded-full bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
                            href={metadata.rawUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            XML original
                        </a>
                        
                    </div>
                </div>

                <div class="mt-6 grid gap-3 md:grid-cols-4">
                    {#if metadata.keywords.length > 0}
                        <div class="rounded-2xl bg-slate-50 p-4">
                            <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Palavras-chave</p>
                            <p class="mt-2 text-2xl font-semibold text-slate-900">{metadata.keywords.length}</p>
                        </div>
                    {/if}
                    {#if metadata.links.length > 0}
                        <div class="rounded-2xl bg-slate-50 p-4">
                            <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Recursos online</p>
                            <p class="mt-2 text-2xl font-semibold text-slate-900">{metadata.links.length}</p>
                        </div>
                    {/if}
                    {#if metadata.contacts.length > 0}
                        <div class="rounded-2xl bg-slate-50 p-4">
                            <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Contatos</p>
                            <p class="mt-2 text-2xl font-semibold text-slate-900">{metadata.contacts.length}</p>
                        </div>
                    {/if}
                    {#if metadata.extents.length > 0}
                        <div class="rounded-2xl bg-slate-50 p-4">
                            <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Extensoes geograficas</p>
                            <p class="mt-2 text-2xl font-semibold text-slate-900">{metadata.extents.length}</p>
                        </div>
                    {/if}
                </div>
            </div>

            <div class="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <section class="space-y-6">
                    <article class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 class="text-lg font-semibold text-slate-900">Informações do metadado</h2>
                        <div class="mt-4 grid gap-4 md:grid-cols-2">
                            {#if metadata.purpose}
                                <div>
                                    <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Finalidade</p>
                                    <p class="mt-2 text-sm leading-6 text-slate-700">{metadata.purpose}</p>
                                </div>
                            {/if}
                            {#if metadata.metadataDate}
                                <div>
                                    <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Data do metadado</p>
                                    <p class="mt-2 text-sm text-slate-700">{metadata.metadataDate}</p>
                                </div>
                            {/if}
                            {#if metadata.metadataStandard}
                                <div>
                                    <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Padrao</p>
                                    <p class="mt-2 text-sm text-slate-700">{metadata.metadataStandard}</p>
                                </div>
                            {/if}
                            {#if metadata.languages.length > 0}
                                <div>
                                    <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Idiomas</p>
                                    <p class="mt-2 text-sm text-slate-700">{metadata.languages.join(', ')}</p>
                                </div>
                            {/if}
                            {#if metadata.status.length > 0}
                                <div>
                                    <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Situacao</p>
                                    <p class="mt-2 text-sm text-slate-700">{metadata.status.join(', ')}</p>
                                </div>
                            {/if}
                            {#if metadata.topicCategories.length > 0}
                                <div>
                                    <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Categorias tematicas</p>
                                    <p class="mt-2 text-sm text-slate-700">{metadata.topicCategories.join(', ')}</p>
                                </div>
                            {/if}
                        </div>
                    </article>

                    {#if metadata.links.length > 0}
                        <article class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 class="text-lg font-semibold text-slate-900">Recursos online</h2>
                            <div class="mt-4 grid gap-3">
                                {#each metadata.links as link}
                                    <a
                                        class="rounded-2xl border border-slate-200 p-4 transition hover:border-sky-300 hover:bg-sky-50"
                                        href={link.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <div class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                                            <div class="min-w-0">
                                                <p class="font-medium text-slate-900">{link.title}</p>
                                                {#if link.description}
                                                    <p class="mt-1 text-sm leading-6 text-slate-600">{link.description}</p>
                                                {/if}
                                                <p class="mt-2 break-all text-xs text-slate-500">{link.href}</p>
                                            </div>
                                            <div class="flex shrink-0 flex-wrap gap-2">
                                                {#if link.protocol}
                                                    <span class="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                                                        {link.protocol}
                                                    </span>
                                                {/if}
                                                {#if link.functionLabel}
                                                    <span class="rounded-full bg-sky-100 px-3 py-1 text-xs text-sky-800">
                                                        {link.functionLabel}
                                                    </span>
                                                {/if}
                                            </div>
                                        </div>
                                    </a>
                                {/each}
                            </div>
                        </article>
                    {/if}

                    {#if metadata.lineage.length > 0}
                        <article class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 class="text-lg font-semibold text-slate-900">Linhagem e processamento</h2>
                            <div class="mt-4 space-y-3">
                                {#each metadata.lineage as item}
                                    <div class="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                                        {item}
                                    </div>
                                {/each}
                            </div>
                        </article>
                    {/if}
                </section>

                <aside class="space-y-6">
                    {#if metadata.keywords.length > 0}
                        <article class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 class="text-lg font-semibold text-slate-900">Palavras-chave</h2>
                            <div class="mt-4 flex flex-wrap gap-2">
                                {#each metadata.keywords as keyword}
                                    <span class="rounded-full bg-sky-50 px-3 py-2 text-sm text-sky-800 ring-1 ring-sky-100">
                                        {keyword}
                                    </span>
                                {/each}
                            </div>
                        </article>
                    {/if}

                    {#if metadata.dates.length > 0}
                        <article class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 class="text-lg font-semibold text-slate-900">Datas relevantes do recurso</h2>
                            <div class="mt-4 space-y-3">
                                {#each metadata.dates as date}
                                    <div class="rounded-2xl bg-slate-50 p-4">
                                        <p class="text-xs uppercase tracking-[0.2em] text-slate-500">{date.type}</p>
                                        <p class="mt-2 text-sm text-slate-800">{date.value}</p>
                                    </div>
                                {/each}
                            </div>
                        </article>
                    {/if}

                    {#if metadata.identifiers.length > 0}
                        <article class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 class="text-lg font-semibold text-slate-900">Identificadores</h2>
                            <ul class="mt-4 space-y-3 text-sm text-slate-700">
                                {#each metadata.identifiers as identifier}
                                    <li class="break-all rounded-2xl bg-slate-50 p-4">{identifier}</li>
                                {/each}
                            </ul>
                        </article>
                    {/if}

                    {#if metadata.contacts.length > 0}
                        <article class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 class="text-lg font-semibold text-slate-900">Contatos</h2>
                            <div class="mt-4 space-y-3">
                                {#each metadata.contacts as contact}
                                    <div class="rounded-2xl bg-slate-50 p-4">
                                        <p class="font-medium text-slate-900">{contact.name}</p>
                                        {#if contact.organization}
                                            <p class="mt-1 text-sm text-slate-600">{contact.organization}</p>
                                        {/if}
                                        <div class="mt-2 flex flex-wrap gap-2">
                                            {#if contact.role}
                                                <span class="rounded-full bg-slate-200 px-3 py-1 text-xs text-slate-700">
                                                    {contact.role}
                                                </span>
                                            {/if}
                                            {#if contact.email}
                                                <a
                                                    class="rounded-full bg-sky-100 px-3 py-1 text-xs text-sky-800 hover:bg-sky-200"
                                                    href={`mailto:${contact.email}`}
                                                >
                                                    {contact.email}
                                                </a>
                                            {/if}
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        </article>
                    {/if}

                    {#if metadata.extents.length > 0}
                        <article class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 class="text-lg font-semibold text-slate-900">Extensao geografica</h2>
                            <div class="mt-4 space-y-3">
                                {#each metadata.extents as extent}
                                    <div class="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                                        <p>Oeste: {extent.west || '-'}</p>
                                        <p>Sul: {extent.south || '-'}</p>
                                        <p>Leste: {extent.east || '-'}</p>
                                        <p>Norte: {extent.north || '-'}</p>
                                    </div>
                                {/each}
                            </div>
                        </article>
                    {/if}
                </aside>
            </div>
        </div>
    </div>
{/if}
>>>>>>>> 049489398e5e86a05609f21ec4400f9605ffe0a9:src/routes/metadado/+page.svelte
>>>>>>> 049489398e5e86a05609f21ec4400f9605ffe0a9
