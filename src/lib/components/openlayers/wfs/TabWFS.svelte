<script lang="ts">
    import * as Tabs from '$lib/components/ui/tabs';
    import BaseWFS from './BaseWFS.svelte';
    import WFSKeywordSearch from './WFSKeywordSearch.svelte';
    import WFSBoundingBoxSearch from './WFSBoundingBoxSearch.svelte';
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
        <BaseWFS />
    </Tabs.Content>
    <Tabs.Content value="palavra-chave">
        <WFSKeywordSearch />
    </Tabs.Content>
    <Tabs.Content value="retangulo">
        <WFSBoundingBoxSearch />
    </Tabs.Content>
</Tabs.Root>
