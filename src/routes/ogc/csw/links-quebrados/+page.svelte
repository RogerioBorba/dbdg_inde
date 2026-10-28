<script lang="ts">
    import { onMount } from 'svelte';
    import Navbar from '#lib/components/navbar/navbar.svelte';
    import { preventDefault } from '#lib/components/svelte_util/util.js';
    import CSWCatalogSelector from '#lib/components/ogc/csw/CSWCatalogSelector.svelte';
    import LinksQuebradosCard from '#lib/components/ogc/csw/LinksQuebradosCard.svelte';
    import { catalogos_csw } from '#lib/inde/catalogos/ICatalogoGeoservico.js';
    import type { CSWCatalog } from '#lib/ogc/csw/CSWCatalog.js';

    let selectedItems: CSWCatalog[] = $state([]);
    let selectedCatalogs: CSWCatalog[] = $state([]);
    let availableCatalogs = $state<CSWCatalog[]>([]);
    let checked = $state(false);
    let nameCatalog = $state('');
    let adressCatalog = $state('');
    let disableButtonAddNewCatalog = $derived(nameCatalog.length === 0 || adressCatalog.length === 0);
    let nextCatalogId = 1;

    function toCSWCatalog(obj: { descricao: string; cswGetCapabilities: string; noCentralCategoria?: string | null }): CSWCatalog {
        return {
            id: nextCatalogId++,
            descricao: obj.descricao,
            iri: obj.cswGetCapabilities,
            noCentralCategoria: obj.noCentralCategoria ?? null
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

    onMount(async () => {
        availableCatalogs = catalogos_csw.map((catalog) => toCSWCatalog(catalog));

        const queryCatalog = readCatalogFromQuery();
        if (queryCatalog) {
            selectedItems = [queryCatalog];
            selectedCatalogs = [queryCatalog];
        }
    });
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

<div class="m-2 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
    {#each selectedCatalogs as catalog (catalog.id)}
        <LinksQuebradosCard {catalog} />
    {/each}
</div>
