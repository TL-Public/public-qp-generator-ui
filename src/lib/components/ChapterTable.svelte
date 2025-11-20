<script>
  export let items = [];
  export let selectedItems = [];
  export let selectionType = 'chapter';

  // Pagination
  let itemsPerPage = 5;
  let currentPage = 1;
  let searchQuery = '';
  let sortOrder = 'desc'; // 'asc' or 'desc'

  // Add sorting state
  let sortField = 'name';
  let sortDirection = 'asc';

  // Filter and sort items
  $: filteredItems = (() => {
    // First filter the items
    const filtered = items.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.parentChapter && item.parentChapter.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.parentTopic && item.parentTopic.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Then sort the filtered items
    return filtered.sort((a, b) => {
      const modifier = sortDirection === 'asc' ? 1 : -1;
      
      switch (sortField) {
        case 'questionCount':
          return (a.questionCount - b.questionCount) * modifier;
        case 'parentChapter':
          return (a.parentChapter || '').localeCompare(b.parentChapter || '') * modifier;
        case 'parentTopic':
          return (a.parentTopic || '').localeCompare(b.parentTopic || '') * modifier;
        default:
          return a.name.localeCompare(b.name) * modifier;
      }
    });
  })();

  // Calculate pagination
  $: totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  $: paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  function toggleSelection(event, item) {
    event.preventDefault();
    const index = selectedItems.findIndex(i => i.id === item.id);
    if (index === -1) {
      selectedItems = [...selectedItems, item];
    } else {
      selectedItems = selectedItems.filter(i => i.id !== item.id);
    }
  }

  function changePage(event, newPage) {
    event.preventDefault() ; 
    if (newPage >= 1 && newPage <= totalPages) {
      currentPage = newPage;
    }
  }

  function handleSort(field) {
    if (sortField === field) {
      // If clicking same field, toggle direction
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // If clicking new field, set it as sort field and default to ascending
      sortField = field;
      sortDirection = 'asc';
    }
  }

  // Helper function to show sort indicators
  function getSortIndicator(field) {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  }

  function handleSearch(event) {
    // Prevent default only for enter key press
    if (event.key === 'Enter') {
      event.preventDefault();
    }
  }
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <!-- Search input with keydown handler -->
    <div class="relative">
      <input
        type="search"
        placeholder="Search..."
        bind:value={searchQuery}
        on:keydown={handleSearch}
        class="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 absolute left-3 top-2.5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
      </svg>
    </div>

    <!-- Sort button with click handler -->
    <!-- <button
      on:click={handleSort}
      class="flex items-center px-4 py-2 border rounded-lg hover:bg-gray-50"
    >
      <span class="mr-2">Questions</span>
      {#if sortOrder === 'desc'}
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clip-rule="evenodd" />
        </svg>
      {:else}
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      {/if}
    </button> -->
    
  </div>

  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200">
      <thead>
        <tr class="bg-gray-50">
          <th 
            class="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
            on:click={() => handleSort('name')}
          >
            <div class="flex items-center space-x-1">
              <span>Name</span>
              <span class="text-gray-400">{getSortIndicator('name')}</span>
            </div>
          </th>
          {#if selectionType !== 'chapter'}
            <th 
              class="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
              on:click={() => handleSort(selectionType === 'topic' ? 'parentChapter' : 'parentTopic')}
            >
              <div class="flex items-center space-x-1">
                <span>{selectionType === 'topic' ? 'Chapter' : 'Topic'}</span>
                <span class="text-gray-400">
                  {getSortIndicator(selectionType === 'topic' ? 'parentChapter' : 'parentTopic')}
                </span>
              </div>
            </th>
          {/if}
          <th 
            class="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
            on:click={() => handleSort('questionCount')}
          >
            <div class="flex items-center space-x-1">
              <span>Questions</span>
              <span class="text-gray-400">{getSortIndicator('questionCount')}</span>
            </div>
          </th>
          <th class="w-24 px-4 py-3 text-sm font-medium text-left text-gray-700">Actions</th>
        </tr>
      </thead>
      
      <tbody class="divide-y divide-gray-200">
        {#each paginatedItems as item}
          <tr>
            <td class="px-4 py-3">{item.name}</td>
            {#if selectionType !== 'chapter'}
              <td class="px-4 py-3">
                {selectionType === 'topic' ? item.parentChapter : item.parentTopic}
              </td>
            {/if}
            <td class="px-4 py-3">{item.questionCount}</td>
            <td class="px-4 py-3">
              <button
                class={`p-1 rounded-full ${
                  selectedItems.some(i => i.id === item.id)
                    ? 'text-red-600 hover:text-red-800'
                    : 'text-green-600 hover:text-green-800'
                }`}
                on:click={(e) => toggleSelection(e, item)}
              >
                {#if selectedItems.some(i => i.id === item.id)}
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                  </svg>
                {:else}
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd" />
                  </svg>
                {/if}
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <!-- Pagination -->
  {#if totalPages > 1}
    <div class="flex items-center justify-between border-t pt-4">
      <div class="flex items-center space-x-2">
        <button
          class="px-3 py-1 border rounded-md {currentPage === 1 ? 'text-gray-400' : 'hover:bg-gray-50'}"
          disabled={currentPage === 1}
          on:click={(e) => changePage(e,currentPage - 1)}
        >
          Previous
        </button>
        
        {#each Array(totalPages) as _, i}
          <button
            class="px-3 py-1 border rounded-md {currentPage === i + 1 ? 'bg-blue-50 border-blue-500 text-blue-600' : 'hover:bg-gray-50'}"
            on:click={(e) => changePage(e,i + 1)}
          >
            {i + 1}
          </button>
        {/each}
        
        <button
          class="px-3 py-1 border rounded-md {currentPage === totalPages ? 'text-gray-400' : 'hover:bg-gray-50'}"
          disabled={currentPage === totalPages}
          on:click={(e) => changePage(e,currentPage + 1)}
        >
          Next
        </button>
      </div>
      
      <div class="text-sm text-gray-500">
        Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredItems.length)} of {filteredItems.length} items
      </div>
    </div>
  {/if}
</div>