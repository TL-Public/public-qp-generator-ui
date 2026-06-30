<script>
  import Toggle from "./Toggle.svelte";

  let {
    checked = $bindable(false),
    disabled = false,
    title = "",
    description = "",
    activeTitle = "",
    activeDescription = "",
    inactiveTitle = "",
    inactiveDescription = "",
    class: className = "",
    ...toggleProps
  } = $props();

  // Compute title dynamically based on checked state
  const displayTitle = $derived(
    checked 
      ? (activeTitle || title) 
      : (inactiveTitle || title)
  );

  // Compute description dynamically based on checked state
  const displayDescription = $derived(
    checked 
      ? (activeDescription || description) 
      : (inactiveDescription || description)
  );
</script>

<div class="flex items-center justify-between {className}">
  <p class="flex flex-col text-sm font-medium text-gray-700">
    {displayTitle}
    {#if displayDescription}
      <span class="text-xs text-gray-500 font-normal mt-0.5">
        {displayDescription}
      </span>
    {/if}
  </p>
  <Toggle bind:checked={checked} {disabled} {...toggleProps} />
</div>
