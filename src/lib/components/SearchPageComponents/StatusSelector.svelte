<script>
  import { createEventDispatcher } from 'svelte';
  
  export let selectedStatus = '';
  export let loading = false;
  export let statusError = null;
  
  const dispatch = createEventDispatcher();
  
  function handleSubmit() {
    dispatch('submit');
  }
</script>

<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
  <div class="flex items-center justify-between mb-6">
    <div>
      <h2 class="text-xl font-semibold text-gray-900">Search Question Papers</h2>
      <p class="text-sm text-gray-600 mt-1">Select a status to view and manage your question papers</p>
    </div>
    <div class="hidden sm:block">
      <div class="flex items-center space-x-2 text-sm text-gray-500">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span>Paper Management</span>
      </div>
    </div>
  </div>

  <div class="flex flex-col sm:flex-row sm:items-end gap-4">
    <div class="flex-1 max-w-xs">
      <label for="status-select" class="block text-sm font-medium text-gray-700 mb-2">
        Paper Status
      </label>
      <div class="relative">
        <select 
          id="status-select" 
          bind:value={selectedStatus} 
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 shadow-sm transition-colors duration-200"
        >
          <option value="" disabled>Choose paper status...</option>
          <option value="draft">📝 Draft Papers</option>
          <option value="closed">✅ Closed Papers</option>
        </select>
      </div>
    </div>

    <div class="flex-shrink-0">
      <button
        type="button" 
        on:click={handleSubmit}
        disabled={loading || !selectedStatus}
        class="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
      >
        {#if loading}
          <div class="flex items-center">
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </div>
        {:else}
          <div class="flex items-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search Papers
          </div>
        {/if}
      </button>
    </div>
  </div>

  {#if statusError}
    <div class="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Error</h3>
          <p class="text-sm text-red-700 mt-1">{statusError}</p>
        </div>
      </div>
    </div>
  {/if}
</div>