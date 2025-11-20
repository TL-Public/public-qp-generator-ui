<script>
  import { createEventDispatcher } from 'svelte';
  
  export let searchQuery = '';
  export let searchFilters = {};
  export let showAdvancedSearch = false;
  
  const dispatch = createEventDispatcher();
  
  function toggleAdvancedSearch() {
    showAdvancedSearch = !showAdvancedSearch;
  }
  
  function clearAllFilters() {
    dispatch('clearFilters');
  }
</script>

<div class="mb-6 space-y-4">
  <div class="flex flex-col sm:flex-row gap-3">
    <div class="flex-1">
      <div class="relative">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Search within current results..."
          class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
        />
      </div>
    </div>
    <div class="flex gap-2">
      <button
        type="button"
        class="px-4 py-3 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
        on:click={toggleAdvancedSearch}
      >
        <div class="flex items-center">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
          </svg>
          {showAdvancedSearch ? 'Hide' : 'Show'} Filters
        </div>
      </button>
      <button
        type="button"
        class="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200"
        on:click={clearAllFilters}
      >
        <div class="flex items-center">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Clear
        </div>
      </button>
    </div>
  </div>

  {#if showAdvancedSearch}
    <div class="bg-gray-50 border border-gray-200 rounded-lg p-6">
      <div class="flex items-center mb-4">
        <svg class="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
        </svg>
        <h4 class="text-sm font-medium text-gray-900">Advanced Filters</h4>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-2">Paper ID</label>
          <input
            type="text"
            bind:value={searchFilters.paperId}
            placeholder="Search paper ID..."
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-2">Exam Title</label>
          <input
            type="text"
            bind:value={searchFilters.examTitle}
            placeholder="Search exam title..."
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-2">Subject</label>
          <input
            type="text"
            bind:value={searchFilters.subject}
            placeholder="Search subject..."
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-2">Class</label>
          <input
            type="text"
            bind:value={searchFilters.class}
            placeholder="Search class..."
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-2">Medium</label>
          <input
            type="text"
            bind:value={searchFilters.medium}
            placeholder="Search medium..."
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  {/if}
</div>