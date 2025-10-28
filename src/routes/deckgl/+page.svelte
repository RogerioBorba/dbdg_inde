<!-- CanvasDrawing.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';

  // Declare a variable to hold the canvas element
  let canvas: HTMLCanvasElement;

  onMount(() => {
    // The canvas variable is guaranteed to be assigned by the time onMount runs
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'blue';
      ctx.fillRect(10, 10, 150, 100);
    }
  });
</script>

<canvas bind:this={canvas} width="100%" height="100%"></canvas>
