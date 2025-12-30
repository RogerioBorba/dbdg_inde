<script lang="ts">
  import { Navbar, NavBrand, NavHamburger, NavUl, NavLi, MegaMenu } from "flowbite-svelte";
  import { ChevronDownOutline } from "flowbite-svelte-icons";
  let menuWMS = [
      {name: 'Catálogos', href: '/ogc/wms/catalogos'},
      {name: 'Palavras Chaves', href: '/ogc/wms/palavras-chaves'}, 
    ];
</script>

<Navbar>
  <NavBrand href="/">
    <!--<img src="/images/flowbite-svelte-icon-logo.svg" class="me-3 h-6 sm:h-9" alt="Flowbite Logo" />-->
    <span class="self-center text-xl font-semibold whitespace-nowrap dark:text-white">Monitora DBDG</span>
  </NavBrand>
  <NavHamburger />
  <NavUl>
    <NavLi href="/">Home</NavLi>
    <NavLi class="cursor-pointer">
      WMS <ChevronDownOutline class="text-primary-800 ms-2 inline h-6 w-6 dark:text-white" />
    </NavLi>
    <MegaMenu items={menuWMS}>
      {#snippet children({ item })}
        <a href={item.href} class="hover:text-primary-600 dark:hover:text-primary-500">{item.name}</a>
      {/snippet}
    </MegaMenu>
    <NavLi href="/visualizador/ol">visualizador</NavLi>
  </NavUl>
</Navbar>