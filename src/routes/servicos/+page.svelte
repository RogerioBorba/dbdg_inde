<script lang="ts">
    import type { CatalogoINDE } from '$lib/types/inde'; // ou caminho que preferir

    let { data }: { data: { catalogos_inde: CatalogoINDE[] } } = $props();
    
</script>

<div class="text-2xl text-center bg-gray-100 hover:bg-gray-200 p-2" >Serviços disponibilizados pelas institruições na INDE, conforme padrões do OGC</div>
<br>
<!-- GRID GLOBAL -->
<div class="grid grid-cols-[max-content_1fr] gap-y-2 text-sm">

    {#each data.catalogos_inde.sort((a, b) => a.descricao.localeCompare(b.descricao, 'pt-BR')) as catalogo}

        <!-- LINHA (usa contents pra manter o grid alinhado) -->
        <div class="contents group">

            <!-- COLUNA 1: DESCRIÇÃO -->
            <span
                class="px-2 py-1 rounded-md
                       group-hover:bg-gray-100 transition"
            >
                {catalogo.descricao}
            </span>

            <!-- COLUNA 2: BADGES -->
            <div
                class="flex gap-2 flex-wrap px-2 py-1 rounded-md
                       group-hover:bg-gray-100 transition"
            >

                {#if catalogo.wmsAvailable && catalogo.wmsGetCapabilities}
                    <a
                        href={catalogo.wmsGetCapabilities}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="px-2 py-1 text-xs font-medium rounded-full
                               bg-blue-100 text-blue-700 border border-blue-300
                               hover:bg-blue-200 hover:scale-105 active:scale-95
                               transition"
                    >
                        WMS
                    </a>
                {/if}

                {#if catalogo.wfsAvailable && catalogo.wfsGetCapabilities}
                    <a
                        href={catalogo.wfsGetCapabilities}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="px-2 py-1 text-xs font-medium rounded-full
                               bg-green-100 text-green-700 border border-green-300
                               hover:bg-green-200 hover:scale-105 active:scale-95
                               transition"
                    >
                        WFS
                    </a>
                {/if}

                {#if catalogo.wcsAvailable && catalogo.wcsGetCapabilities}
                    <a
                        href={catalogo.wcsGetCapabilities}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="px-2 py-1 text-xs font-medium rounded-full
                               bg-purple-100 text-purple-700 border border-purple-300
                               hover:bg-purple-200 hover:scale-105 active:scale-95
                               transition"
                    >
                        WCS
                    </a>
                {/if}

            </div>

        </div>

    {/each}

</div>
