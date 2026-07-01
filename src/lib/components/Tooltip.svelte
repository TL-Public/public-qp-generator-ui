<script>
  import { onMount, onDestroy, tick } from 'svelte';
  import Portal from '$lib/components/Portal.svelte';
  
  export let text = "";
  export let position = "top"; // top, bottom, left, right
  export let maxWidth = 200;

  let trigger;
  let tooltipElement;
  let visible = false;
  let coords = { x: 0, y: 0 };

  function updatePosition() {
    if (!trigger || !tooltipElement) return;
    
    const triggerRect = trigger.getBoundingClientRect();
    const tooltipRect = tooltipElement.getBoundingClientRect();
    
    let x = 0;
    let y = 0;
    const padding = 8;

    // Scroll offset adjustment
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    switch (position) {
      case 'top':
        x = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
        y = triggerRect.top - tooltipRect.height - padding;
        break;
      case 'bottom':
        x = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
        y = triggerRect.bottom + padding;
        break;
      case 'left':
        x = triggerRect.left - tooltipRect.width - padding;
        y = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
        break;
      case 'right':
        x = triggerRect.right + padding;
        y = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
        break;
    }

    // Convert to absolute position including scroll
    x += scrollX;
    y += scrollY;

    // Viewport containment
    const margin = 10;
    if (x < margin + scrollX) x = margin + scrollX;
    if (x + tooltipRect.width > window.innerWidth + scrollX - margin) {
      x = window.innerWidth + scrollX - tooltipRect.width - margin;
    }

    coords = { x, y };
  }

  $: if (visible) {
    // tick() ensures the DOM has updated before we measure it
    tick().then(updatePosition);
  }

  // Also update on scroll/resize
  function handleScrollResize() {
    if (visible) updatePosition();
  }

  onMount(() => {
    window.addEventListener('scroll', handleScrollResize, true);
    window.addEventListener('resize', handleScrollResize);
  });

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', handleScrollResize, true);
      window.removeEventListener('resize', handleScrollResize);
    }
  });

  function show() { visible = true; }
  function hide() { visible = false; }
</script>

<div 
  class="inline-block" 
  bind:this={trigger}
  on:mouseenter={show}
  on:mouseleave={hide}
  on:focusin={show}
  on:focusout={hide}
>
  <slot />
</div>

{#if visible}
  <Portal>
    <div 
      bind:this={tooltipElement}
      class="absolute z-[9999] p-2 bg-dark text-white text-xs rounded shadow-lg pointer-events-none transition-opacity duration-200"
      style="left: {coords.x}px; top: {coords.y}px; max-width: {maxWidth}px;"
    >
      {#if text}
        {text}
      {:else}
        <slot name="content" />
      {/if}
      
      <!-- Arrow -->
      <div 
        class="absolute w-2 h-2 bg-gray-900 transform rotate-45"
        style="
          {position === 'top' ? 'bottom: -4px; left: 50%; margin-left: -4px;' : ''}
          {position === 'bottom' ? 'top: -4px; left: 50%; margin-left: -4px;' : ''}
          {position === 'left' ? 'right: -4px; top: 50%; margin-top: -4px;' : ''}
          {position === 'right' ? 'left: -4px; top: 50%; margin-top: -4px;' : ''}
        "
      ></div>
    </div>
  </Portal>
{/if}
