<script>
  export let title = '';
</script>

<div class="bg-white rounded-lg border border-gray-200 p-4 mb-6 ">
  {#if title}
    <h2 class="text-base font-semibold mb-4">{title}</h2>
  {/if}
  <slot />
</div>