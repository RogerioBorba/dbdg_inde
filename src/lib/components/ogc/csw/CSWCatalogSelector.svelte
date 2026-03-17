<script lang="ts">
    import type { CSWCatalog } from '$lib/ogc/csw/CSWCatalog';

    let {
        items = [],
        selectedItems = [],
        checked = false,
        nameCatalog = '',
        adressCatalog = '',
        disableButtonAddNewCatalog = true,
        selectId = 'instituicoes_multiple',
        label = 'Escolha as instituições',
        onToggleAll,
        onSelectedItemsChange,
        onNameCatalogChange,
        onAdressCatalogChange,
        onAddCatalog
    }: {
        items?: CSWCatalog[];
        selectedItems?: CSWCatalog[];
        checked?: boolean;
        nameCatalog?: string;
        adressCatalog?: string;
        disableButtonAddNewCatalog?: boolean;
        selectId?: string;
        label?: string;
        onToggleAll?: () => void;
        onSelectedItemsChange?: (items: CSWCatalog[]) => void;
        onNameCatalogChange?: (value: string) => void;
        onAdressCatalogChange?: (value: string) => void;
        onAddCatalog?: () => void;
    } = $props();

    let currentSelection = $state<CSWCatalog[]>(selectedItems);

    $effect(() => {
        currentSelection = selectedItems;
    });

    function handleSelectionChange() {
        onSelectedItemsChange?.(currentSelection);
    }
</script>

<div>
    <div class="flex items-center flex-col sm:flex-row mb-1 text-sm font-medium text-gray-900 dark:text-gray-400">
        <label for={selectId} class="mr-4">{label}</label>
        <div>
            <input
                class="mr-1 rounded w-4 h-4 focus:outline-none border-gray-300"
                type="checkbox"
                checked={checked}
                onclick={() => onToggleAll?.()}
            >
            <span class="mr-2">selecione todos</span>
        </div>
    </div>

    <select
        size={6}
        multiple
        id={selectId}
        class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
        bind:value={currentSelection}
        onchange={handleSelectionChange}
    >
        {#each items as item}
            <option value={item}>
                {item.descricao}
            </option>
        {/each}
    </select>

    <div class="mt-2 w-full p1 flex flex-col md:flex-row">
        <input
            class="border-gray-300 focus:outline-none w-full rounded md:w-2/5 mr-1"
            type="text"
            value={nameCatalog}
            oninput={(event) => onNameCatalogChange?.((event.currentTarget as HTMLInputElement).value)}
            placeholder="Informe o nome do catalogo"
        >
        <input
            class="border-gray-300 focus:outline-none rounded w-full md:w-2/5 mr-1"
            type="text"
            value={adressCatalog}
            oninput={(event) => onAdressCatalogChange?.((event.currentTarget as HTMLInputElement).value)}
            placeholder="Informe o endereco CSW do GetCapabilities"
        >
        <button
            class="md:w-1/5 shadow-sm rounded bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 disabled:opacity-25"
            onclick={() => onAddCatalog?.()}
            disabled={disableButtonAddNewCatalog}
        >
            Adicionar novo catalogo
        </button>
    </div>
</div>
