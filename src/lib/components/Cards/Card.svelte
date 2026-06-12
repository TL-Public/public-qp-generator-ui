<script>
  export let title = '';
  export let className = '';
</script>

<div class={`bg-white rounded-lg border border-gray-200 p-4 mb-6 ${className}`}>
  {#if title}
    <h2 class="text-base font-semibold mb-4">{title}</h2>
  {/if}
  <slot />
</div>