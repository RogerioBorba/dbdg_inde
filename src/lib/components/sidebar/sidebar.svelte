<script lang="ts">
    let { home, children } = $props();
    let width = $state('w-1/3');
    let displayOpenNav = $state('hidden');
    
    function closeNav() {
        width = 'w-0'
        displayOpenNav = 'block'
    }
    function openNav() {
        width = 'w-1/3'
        displayOpenNav = 'hidden'
    }

</script>

<div class = "relative">
    <div class="ml-2 text-2xl text-left cursor-pointer fixed z-20 top-0 left-0 w-6 {displayOpenNav}" role="button" tabindex="0" onclick={openNav} onkeydown={openNav} aria-label="Open navigation">{@html '&#9776;'}</div>    
    <div class=" bg-white border-gray-300 border-2 h-full {width} fixed z-10 top-0 left-0 overflow-x-hidden pt-10">
        <div>
            {#if home?.length > 0}
            <a class="inline absolute px-1 top-1 ml-2 mr-2 text-base hover:text-white hover:hover:bg-sky-700" href="/">{home}</a>   
            {/if}
            <span class="text-2xl cursor-pointer ml-auto text-right top-0 right-2 absolute" role="button" tabindex="0" onclick={closeNav} onkeydown={closeNav} aria-label="Close navigation"> {@html '&times;'}</span>
        </div>
        {@render children?.()}
    </div>
    
</div>
<style style lang="postcss">
</style>