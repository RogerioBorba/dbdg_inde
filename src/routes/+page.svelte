<script lang="ts">
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  import { buttonVariants } from "$lib/components/ui/button";
  import { ChevronDown, Menu, X } from "lucide-svelte";

  let mobileMenuOpen = $state(false);

  const menuWMS = [
    { name: 'Catálogos', href: '/ogc/wms/catalogos' },
    { name: 'Palavras Chaves', href: '/ogc/wms/palavras-chaves' },
  ];
  const menuWFS = [
    { name: 'Catálogos', href: '/ogc/wfs/catalogos' },
    { name: 'Palavras Chaves', href: '/ogc/wfs/palavras-chaves' },
    { name: 'Tipo de Feições', href: '/ogc/wfs/tipo-de-feicoes' },
  ];
  const menuWCS = [
    { name: 'Catálogos', href: '/ogc/wcs/catalogos' },
    { name: 'Palavras Chaves', href: '/ogc/wcs/palavras-chaves' },
  ];
  const menuCSW = [
    { name: 'Catálogos', href: '/ogc/csw/catalogos' },
    { name: 'Conformidade Perfil MGB', href: '/ogc/csw/conformidade-mgb' },
    { name: 'Palavras Chaves', href: '/ogc/csw/palavras-chaves' },
    { name: 'Quantidade WMS', href: '/ogc/csw/metadados/protocolo-wms/quantidade' },
    { name: 'Quantidade WFS', href: '/ogc/csw/metadados/protocolo-wfs/quantidade' },
    { name: 'Links Quebrados', href: '/ogc/csw/links-quebrados' }
  ];
</script>

<nav class="border-b bg-gray-100 dark:bg-gray-800">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between h-16">
      <div class="flex items-center gap-8">
        <a href="/" class="flex items-center gap-2">
          <span class="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Monitora DBDG</span>
        </a>

        <!-- Desktop Navigation -->
        <div class="hidden md:flex items-center gap-1">
          <a href="/" class={buttonVariants({ variant: "ghost" })}>Home</a>

          <!-- WMS Dropdown -->
          <DropdownMenu.Root>
            <DropdownMenu.Trigger class={buttonVariants({ variant: "ghost", class: "gap-1 cursor-pointer" })}>
              WMS
              <ChevronDown class="h-4 w-4 opacity-70" />
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="start">
              {#each menuWMS as item}
                <DropdownMenu.Item>
                  <a href={item.href} class="w-full">{item.name}</a>
                </DropdownMenu.Item>
              {/each}
            </DropdownMenu.Content>
          </DropdownMenu.Root>

          <!-- WFS Dropdown -->
          <DropdownMenu.Root>
            <DropdownMenu.Trigger class={buttonVariants({ variant: "ghost", class: "gap-1 cursor-pointer" })}>
              WFS
              <ChevronDown class="h-4 w-4 opacity-70" />
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="start">
              {#each menuWFS as item}
                <DropdownMenu.Item>
                  <a href={item.href} class="w-full">{item.name}</a>
                </DropdownMenu.Item>
              {/each}
            </DropdownMenu.Content>
          </DropdownMenu.Root>

          <!-- WCS Dropdown -->
          <DropdownMenu.Root>
            <DropdownMenu.Trigger class={buttonVariants({ variant: "ghost", class: "gap-1 cursor-pointer" })}>
              WCS
              <ChevronDown class="h-4 w-4 opacity-70" />
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="start">
              {#each menuWCS as item}
                <DropdownMenu.Item>
                  <a href={item.href} class="w-full">{item.name}</a>
                </DropdownMenu.Item>
              {/each}
            </DropdownMenu.Content>
          </DropdownMenu.Root>

          <!-- CSW Dropdown -->
          <DropdownMenu.Root>
            <DropdownMenu.Trigger class={buttonVariants({ variant: "ghost", class: "gap-1 cursor-pointer" })}>
              CSW
              <ChevronDown class="h-4 w-4 opacity-70" />
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="start">
              {#each menuCSW as item}
                <DropdownMenu.Item>
                  <a href={item.href} class="w-full">{item.name}</a>
                </DropdownMenu.Item>
              {/each}
            </DropdownMenu.Content>
          </DropdownMenu.Root>

          <a href="/visualizador/ol" class={buttonVariants({ variant: "ghost" })}>Visualizador</a>
        </div>
      </div>

      <!-- Mobile Hamburger Button -->
      <div class="flex md:hidden">
        <button
          type="button"
          class="p-2 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
          aria-label="Toggle menu"
          onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
        >
          {#if mobileMenuOpen}
            <X class="h-6 w-6" />
          {:else}
            <Menu class="h-6 w-6" />
          {/if}
        </button>
      </div>
    </div>
  </div>

  <!-- Mobile Menu -->
  {#if mobileMenuOpen}
    <div class="md:hidden border-t px-4 pt-2 pb-4 space-y-3 bg-white dark:bg-gray-800">
      <a href="/" class="block font-medium py-1.5 text-gray-800 dark:text-gray-100 hover:text-blue-600">Home</a>
      
      <div>
        <p class="font-semibold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">WMS</p>
        <div class="pl-2 space-y-1">
          {#each menuWMS as item}
            <a href={item.href} class="block py-1 text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600">{item.name}</a>
          {/each}
        </div>
      </div>

      <div>
        <p class="font-semibold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">WFS</p>
        <div class="pl-2 space-y-1">
          {#each menuWFS as item}
            <a href={item.href} class="block py-1 text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600">{item.name}</a>
          {/each}
        </div>
      </div>

      <div>
        <p class="font-semibold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">WCS</p>
        <div class="pl-2 space-y-1">
          {#each menuWCS as item}
            <a href={item.href} class="block py-1 text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600">{item.name}</a>
          {/each}
        </div>
      </div>

      <div>
        <p class="font-semibold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">CSW</p>
        <div class="pl-2 space-y-1">
          {#each menuCSW as item}
            <a href={item.href} class="block py-1 text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600">{item.name}</a>
          {/each}
        </div>
      </div>

      <a href="/visualizador/ol" class="block font-medium py-1.5 text-gray-800 dark:text-gray-100 hover:text-blue-600">Visualizador</a>
    </div>
  {/if}
</nav>