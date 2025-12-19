<script lang="ts">
    interface Props { brand: string};
    let { brand = 'OGC Services'} : Props = $props();
    const hidden = 'hidden'
    const block = 'inline-flex'
    let show_mobile_menu = $state(hidden);
    
    function btnMenuClicked()  {
        show_mobile_menu = (show_mobile_menu == hidden)?block: hidden
    }

</script>

<nav class="flex items-center flex-wrap p-1 bg-gray-700 text-white">
    
        <!--brand-->
        <div class="flex items-center rounded  p-2">
            <a class="mr-2" href="/" aria-label="Home">
                <svg class=" h-6 w-6 ml-2  text-blue-300" xmlns="http://www.w3.org/2000/svg"  fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
            </a>
            <span class="font-bold uppercase tracking-wider">{brand}</span>
            
        </div>
        <!--btn-->
        
        <button class="inline-flex p-2 text-white rounded hover:bg-blue-800 ml-auto md:hidden" 
        onclick="{btnMenuClicked}" aria-label="Toggle mobile menu">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
        </button>
        
         <!--links-->
        <div class="{show_mobile_menu} flex flex-col md:inline-flex md:flex-row md:ml-auto md:w-auto w-full">
                <a class="mx-1 p-2 font-bold text-white hover:bg-blue-800  hover:rounded transition duration-300" href="#">
                    <svg class=" text-gray-100 fill-current h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path d="M10 20a10 10 0 1 1 0-20 10 10 0 0 1 0 20zM7 6v2a3 3 0 1 0 6 0V6a3 3 0 1 0-6 0zm-3.65 8.44a8 8 0 0 0 13.3 0 15.94 15.94 0 0 0-13.3 0z"/>
                    </svg>
                </a>
        </div>
</nav>