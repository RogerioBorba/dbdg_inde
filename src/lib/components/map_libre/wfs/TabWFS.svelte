<script lang="ts">
    import * as Tabs from '$lib/components/ui/tabs';
    import BaseWFS from './BaseWFS.svelte';
</script>
    
<Tabs.Root value="instituicao">
    <Tabs.List>
        <Tabs.Trigger value="instituicao">
            Por instituição
        </Tabs.Trigger>
    </Tabs.List>
    <Tabs.Content value="instituicao">
        <BaseWFS />
    </Tabs.Content>
</Tabs.Root>