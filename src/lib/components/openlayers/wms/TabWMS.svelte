<script lang="ts">
    import * as Tabs from '$lib/components/ui/tabs';
    import BaseWMS from './BaseWMS.svelte';
    import WMSBoundingBoxSearch from './WMSBoundingBoxSearch.svelte';
    import WMSKeywordSearch from './WMSKeywordSearch.svelte';
</script>

<Tabs.Root value="instituicao">
    <Tabs.List>
        <Tabs.Trigger value="instituicao">
            Por instituição
        </Tabs.Trigger>
        <Tabs.Trigger value="palavra-chave">
            Por palavra-chave
        </Tabs.Trigger>
        <Tabs.Trigger value="retangulo">
            Por retângulo
        </Tabs.Trigger>
    </Tabs.List>
    <Tabs.Content value="instituicao">
        <BaseWMS />
    </Tabs.Content>
    <Tabs.Content value="palavra-chave">
        <WMSKeywordSearch />
    </Tabs.Content>
    <Tabs.Content value="retangulo">
        <WMSBoundingBoxSearch />
    </Tabs.Content>
</Tabs.Root>
