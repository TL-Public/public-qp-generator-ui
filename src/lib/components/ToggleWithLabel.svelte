<script>
  import Toggle from "./Toggle.svelte";

  let {
    checked = $bindable(false),
    disabled = false,
    size = "sm",
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
    checked ? activeTitle || title : inactiveTitle || title,
  );

  // Compute description dynamically based on checked state
  const displayDescription = $derived(
    checked
      ? activeDescription || description
      : inactiveDescription || description,
  );

  // Compute font sizes dynamically based on size prop
  const textSizeConfig = $derived(
    {
      xs: {
        title: "text-xs font-semibold",
        description: "text-[10px]",
      },
      sm: {
        title: "text-sm font-medium",
        description: "text-xs",
      },
      md: {
        title: "text-base font-medium",
        description: "text-sm",
      },
    }[size] ?? {
      title: "text-sm font-medium",
      description: "text-xs",
    },
  );
</script>

<div class="flex items-center justify-between {className} gap-2">
  <p class="flex flex-col text-gray-700 {textSizeConfig.title}">
    {displayTitle}
    {#if displayDescription}
      <span class="text-gray-500 font-normal mt-0.5 {textSizeConfig.description}">
        {displayDescription}
      </span>
    {/if}
  </p>
  <Toggle bind:checked {disabled} {size} {...toggleProps} />
</div>
