<script lang="ts">
    import { onMount } from 'svelte';
	import type { PageProps } from './$types';
    import { toArray } from 'ol/DataTile';
	let { data }: PageProps = $props();
    let dom: Document | null = $state(null);
    onMount(() => {
        dom = new DOMParser().parseFromString(data.xmlContent, 'application/xml');
    });

    function xmlShow() {
      data.xmlContent   
    }
</script>

<div>{data.xmlContent}</div>

{#each dom?.querySelectorAll('book') as item}
     <!-- content here -->
      <p>{item.nodeName}</p>
      <p>{item.nodeType}</p>
      <p>{Array.from(item.childNodes).length}</p>
      {#each item.childNodes as nod }
         <!-- content here -->
          <span>
            Nome: {nod.nodeName} - tipo: {nod.nodeType} ,
           </span>
      {/each}
      
      

{/each}