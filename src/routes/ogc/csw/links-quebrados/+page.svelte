<script lang="ts">
    import Navbar from '$lib/components/navbar/navbar.svelte';
    import { preventDefault } from '$lib/components/svelte_util/util';
    import CSWCatalogSelector from '$lib/components/ogc/csw/CSWCatalogSelector.svelte';
    import { catalogos_csw, type ICatalogoCSW } from '$lib/inde/catalogos/ICatalogoGeoservico';
    import type { CSWCatalog } from '$lib/ogc/csw/CSWCatalog';

    let selectedItems: CSWCatalog[] = $state([]);
    let selectedCatalogs: CSWCatalog[] = $state([]);
    let availableCatalogs = $state<CSWCatalog[]>([]);
    let checked = $state(false);
    let nameCatalog = $state('');
    let adressCatalog = $state('');
    let disableButtonAddNewCatalog = $derived(nameCatalog.length === 0 || adressCatalog.length === 0);
    let nextCatalogId = 1;

    function toCSWCatalog(obj: ICatalogoCSW): CSWCatalog {
        return {
            id: nextCatalogId++,
            descricao: obj.descricao,
            iri: obj.cswGetCapabilities,
            noCentralCategoria: obj.noCentralCategoria
        };
    }

    function addNewCatalog() {
        const newCatalog: CSWCatalog = {
            id: availableCatalogs.length + 1,
            descricao: nameCatalog,
            iri: adressCatalog,
            noCentralCategoria: null
        };

        availableCatalogs = [...availableCatalogs, newCatalog];
        nameCatalog = '';
        adressCatalog = '';
    }

    function toggleAll() {
        checked = !checked;
        selectedItems = checked ? [...availableCatalogs] : [];
    }

    function btnSearchClicked() {
        if (selectedItems.length === 0) {
            return alert('Escolha pelo menos uma instituição');
        }

        const selectedIds = new Set(selectedItems.map((item) => item.id));
        const kept = selectedCatalogs.filter((catalog) => !selectedIds.has(catalog.id));
        selectedCatalogs = [...kept, ...selectedItems];
    }

    function buildResultUrl(catalog: CSWCatalog): string {
        const params = new URLSearchParams({
            descricao: catalog.descricao,
            iri: catalog.iri
        });

        if (catalog.noCentralCategoria) {
            params.set('noCentralCategoria', catalog.noCentralCategoria);
        }

        return `/ogc/csw/links-quebrados/result?${params.toString()}`;
    }

    availableCatalogs = catalogos_csw
        .filter((catalog) => Boolean(catalog.noCentralCategoria) || catalog.descricao.includes('IBGE'))
        .map((catalog) => toCSWCatalog(catalog));
</script>

<Navbar brand="OGC/CSW Links Quebrados"></Navbar>

<form class="m-2">
    <CSWCatalogSelector
        items={availableCatalogs}
        {selectedItems}
        {checked}
        {nameCatalog}
        {adressCatalog}
        {disableButtonAddNewCatalog}
        onToggleAll={toggleAll}
        onSelectedItemsChange={(items) => selectedItems = items}
        onNameCatalogChange={(value) => nameCatalog = value}
        onAdressCatalogChange={(value) => adressCatalog = value}
        onAddCatalog={addNewCatalog}
    />

    <div class="m-2 flex flex-col gap-2 text-sm font-medium text-gray-900 sm:flex-row sm:items-center">
        <button
            class="mr-4 inline-flex items-center rounded font-bold hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            onclick={preventDefault(btnSearchClicked)}
            disabled={selectedItems.length === 0}
            title="Preparar análise"
        >
            <svg class="fill-current text-indigo-500" xmlns="http://www.w3.org/2000/svg" version="1.1" width="20" height="20" viewBox="0 0 24 24"><path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z" /></svg>
        </button>
        <p>Catálogos selecionados: {selectedItems.length}</p>
        <p>Catálogos prontos para análise: {selectedCatalogs.length}</p>
    </div>
</form>

<div class="m-2 grid grid-cols-1 gap-3 md:grid-cols-3">
    {#each selectedCatalogs as catalog (catalog.id)}
        <article class="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
            <h2 class="font-semibold text-gray-900">{catalog.descricao}</h2>
            <p class="mt-1 break-all text-sm text-gray-600">{catalog.iri}</p>
            {#if catalog.noCentralCategoria}
                <p class="mt-1 text-sm text-gray-600">Categoria central: {catalog.noCentralCategoria}</p>
            {/if}
            <a
                class="mt-3 inline-flex rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                href={buildResultUrl(catalog)}
            >
                Ver links quebrados
            </a>
        </article>
    {/each}
</div>
