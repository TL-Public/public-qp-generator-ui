<script>
  let { label, count, children } = $props();
</script>

<div class="flex items-center justify-between p-3 bg-canvas-muted rounded-lg">
  <div class="flex flex-col">
    <span class="text-sm text-subtext">{label}</span>
    <span class="text-sm font-medium text-dark">{count}</span>
  </div>

  <!-- Render the children (the icon) passed from the parent -->
  {#if children}
    <div class="h-5 w-5 text-subtext">
      {@render children()}
    </div>
  {/if}
</div>