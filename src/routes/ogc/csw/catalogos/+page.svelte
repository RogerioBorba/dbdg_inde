<script lang="ts">

    import {catalogos_csw, type ICatalogoCSW} from '$lib/inde/catalogos/ICatalogoGeoservico';
    import Navbar from '$lib/components/navbar/navbar.svelte';
    import { onMount } from 'svelte';
    import { preventDefault } from '$lib/components/svelte_util/util';
    import CSWCatalogCard from '$lib/components/ogc/csw/CSWCatalogCard.svelte';
    import CSWCatalogSelector from '$lib/components/ogc/csw/CSWCatalogSelector.svelte';
    import type { CSWCatalog } from '$lib/ogc/csw/CSWCatalog';

    let countMetadata =$state(0);
    let countProcessado = $state(0);

    let selectedItems: CSWCatalog[] = $state([]);
    let selectedCatalogs: CSWCatalog[]= $state([]);
    let checked = $state(false);
    let i = 1;
    let nameCatalog = $state('');
    let adressCatalog =$state('');
    let disableButtonAddNewCatalog = $derived(nameCatalog.length === 0 || adressCatalog.length === 0);
    let qtdCatalog = $derived(selectedItems.length);
    let availableCatalogs = $state<CSWCatalog[]>([]);

    function toCSWCatalog(obj: ICatalogoCSW): CSWCatalog {
        return {
            id: i++,
            descricao: obj.descricao,
            iri: obj.cswGetCapabilities,
            noCentralCategoria: obj.noCentralCategoria
        };
    }

    function addNewCatalog()  {
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

    function isChecking() {
        if (!checked) {
            selectedItems = [...availableCatalogs];
        } else {
            i = 1;
            selectedItems = [];
        }

        checked = !checked;
    }

    async function btnSearchClicked() {
        if (selectedItems.length == 0) {
            return alert('Escolha pelo menos uma instituicao');
        }

        selectedCatalogs = selectedCatalogs.concat(selectedItems);
    }

    function handleMetadadoProcessado(record: any) {
        countProcessado = countProcessado + 1;
        countMetadata = countMetadata + record.qtdMetadados;
    }

    onMount(async() => {
        availableCatalogs = catalogos_csw.map((obj: any) =>
            toCSWCatalog(obj));
    });
</script>

<Navbar brand="OGC/CSW Checker"></Navbar>
<form class="m-2">
    {@render selecionarCatalogos()}
    {@render counterWMSGlobal()}
</form>
{@render exibirCards()}

{#snippet selecionarCatalogos()}
    <CSWCatalogSelector
        items={availableCatalogs}
        {selectedItems}
        {checked}
        {nameCatalog}
        {adressCatalog}
        {disableButtonAddNewCatalog}
        onToggleAll={isChecking}
        onSelectedItemsChange={(items) => selectedItems = items}
        onNameCatalogChange={(value) => nameCatalog = value}
        onAdressCatalogChange={(value) => adressCatalog = value}
        onAddCatalog={addNewCatalog}
    />
{/snippet}

{#snippet counterWMSGlobal()}
    <div class="flex items-center flex-col sm:flex-row m-2 text-sm font-medium text-gray-900 dark:text-gray-400">
        <button
            class="mr-4 focus:outline-none bg-grey-light hover:bg-grey font-bold rounded inline-flex items-center hover:bg-gray-100"
            onclick={preventDefault(btnSearchClicked)}
            title="Realizar requisicao"
        >
            <svg class="text-indigo-500 fill-current border rounded border-gray-400" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="20" height="20" color="green" viewBox="0 0 24 24"><path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z" /></svg>
        </button>
        <p class="mr-2">Quantidade de catalogos processados por selecionados: {countProcessado}/{qtdCatalog}</p>
        <p>Quantidade de metadados: {countMetadata}</p>
    </div>
{/snippet}

{#snippet exibirCards()}
    <div class="m-2 grid gap-2 md:grid-cols-3 grid-cols-1">
        {#each selectedCatalogs as catalog}
            <CSWCatalogCard {catalog} onMetadaddoProcessado={handleMetadadoProcessado}></CSWCatalogCard>
        {/each}
    </div>
{/snippet}
