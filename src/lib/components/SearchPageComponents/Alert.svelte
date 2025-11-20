<script>
  export let type = 'info'; // 'success', 'error', 'warning', 'info'
  export let message = '';
  export let show = false;
  
  $: alertClasses = {
    success: 'bg-green-50 border-green-200 text-green-700',
    error: 'bg-red-50 border-red-200 text-red-700',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700'
  };
  
  $: iconClasses = {
    success: 'text-green-400',
    error: 'text-red-400',
    warning: 'text-yellow-400',
    info: 'text-blue-400'
  };
</script>

{#if show && message}
  <div class="mb-6 {alertClasses[type]} border rounded-lg p-4">
    <div class="flex">
      <div class="flex-shrink-0">
        {#if type === 'success'}
          <svg class="h-5 w-5 {iconClasses[type]}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        {:else if type === 'error'}
          <svg class="h-5 w-5 {iconClasses[type]}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        {:else}
          <svg class="h-5 w-5 {iconClasses[type]}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        {/if}
      </div>
      <div class="ml-3">
        <p class="text-sm">{message}</p>
      </div>
    </div>
  </div>
{/if}