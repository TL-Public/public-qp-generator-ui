<script>
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();

  export let currentPage = 1;
  export let totalPages = 1;
  export let totalResults = 0;

  let jumpToPage = "";

  function handleGoToPage(pageNumber) {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      dispatch("pageChange", pageNumber);
    }
  }

  function handleJumpToPage(event) {
    event.preventDefault();
    const page = parseInt(jumpToPage);
    if (page && page >= 1 && page <= totalPages) {
      handleGoToPage(page);
      jumpToPage = "";
    }
  }
</script>

<div class="mt-6 flex items-center justify-between border-t border-gray-200 p-4">
  <!-- Left side: Page info -->
  <div class="text-sm text-gray-700">
    Page <span class="font-medium">{currentPage}</span> of
    <span class="font-medium">{totalPages}</span>
    <span class="text-gray-500 ml-2">({totalResults} total results)</span>
  </div>

  <!-- Center: Page navigation -->
  <div class="flex items-center space-x-1">
    <!-- First page -->
    <button
      type="button"
      class="px-3 py-2 text-sm font-medium rounded-md {currentPage === 1
        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'} transition-colors duration-150"
      disabled={currentPage === 1}
      on:click={() => handleGoToPage(1)}
    >
      First
    </button>

    <!-- Previous page -->
    <button
      type="button"
      class="px-3 py-2 text-sm font-medium rounded-md {currentPage === 1
        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'} transition-colors duration-150"
      disabled={currentPage === 1}
      on:click={() => handleGoToPage(currentPage - 1)}
    >
      Previous
    </button>

    <!-- Page numbers -->
    {#each Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
        const start = Math.max(1, currentPage - 2);
        const end = Math.min(totalPages, start + 4);
        const adjustedStart = Math.max(1, end - 4);
        return adjustedStart + i;
      }).filter((page) => page <= totalPages) as page}
      <button
        type="button"
        class="px-3 py-2 text-sm font-medium rounded-md {currentPage === page
          ? 'bg-primary text-white'
          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'} transition-colors duration-150"
        on:click={() => handleGoToPage(page)}
      >
        {page}
      </button>
    {/each}

    <!-- Next page -->
    <button
      type="button"
      class="px-3 py-2 text-sm font-medium rounded-md {currentPage === totalPages
        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'} transition-colors duration-150"
      disabled={currentPage === totalPages}
      on:click={() => handleGoToPage(currentPage + 1)}
    >
      Next
    </button>

    <!-- Last page -->
    <button
      type="button"
      class="px-3 py-2 text-sm font-medium rounded-md {currentPage === totalPages
        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'} transition-colors duration-150"
      disabled={currentPage === totalPages}
      on:click={() => handleGoToPage(totalPages)}
    >
      Last
    </button>
  </div>

  <!-- Right side: Jump to page -->
  <div class="flex items-center space-x-2">
    <span class="text-sm text-gray-700">Jump to:</span>
    <form on:submit|preventDefault={handleJumpToPage} class="flex items-center space-x-1">
      <input
        type="number"
        bind:value={jumpToPage}
        min="1"
        max={totalPages}
        placeholder="Page"
        class="w-16 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
      />
      <button
        type="submit"
        class="px-3 py-1 text-sm font-medium bg-primary text-white rounded-md hover:bg-primary-hover focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-150"
      >
        Go
      </button>
    </form>
  </div>
</div>
