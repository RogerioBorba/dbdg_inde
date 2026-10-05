<script lang="ts">
    import * as Tabs from '$lib/components/ui/tabs';
    import BaseWMS from './BaseWMS.svelte';
</script>
    
<Tabs.Root value="instituicao">
    <Tabs.List>
        <Tabs.Trigger value="instituicao">
            Por instituição
        </Tabs.Trigger>
    </Tabs.List>
    <Tabs.Content value="instituicao">
        <BaseWMS />
    </Tabs.Content>
</Tabs.Root>