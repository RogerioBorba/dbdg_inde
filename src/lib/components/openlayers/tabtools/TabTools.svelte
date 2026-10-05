<script lang="ts">
    import * as Tabs from '$lib/components/ui/tabs';
    import BoundingBoxCoordinates from "$lib/components/openlayers/boundingBox/BoundingBoxCoordinates.svelte";
    import FeatureInfo from '$lib/components/openlayers/featureInfo/FeatureInfo.svelte';
</script>
    
<Tabs.Root value="bbox">
    <Tabs.List>
        <Tabs.Trigger value="bbox">
            Retângulo envolvente
        </Tabs.Trigger>
        <Tabs.Trigger value="info">
            Informação da camada
        </Tabs.Trigger>
    </Tabs.List>
    <Tabs.Content value="bbox">
        <BoundingBoxCoordinates />
    </Tabs.Content>
    <Tabs.Content value="info">
        <FeatureInfo />
    </Tabs.Content>
</Tabs.Root>
