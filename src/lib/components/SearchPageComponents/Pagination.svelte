<script>
  import { createEventDispatcher } from "svelte";

  export let currentPage = 1;
  export let totalPages = 1;
  export let jumpToPage = "";

  const dispatch = createEventDispatcher();

  function goToPage(page) {
    if (page >= 1 && page <= totalPages) {
      dispatch("pageChange", page);
    }
  }

  function handleJumpToPage(event) {
    event.preventDefault();
    const page = parseInt(jumpToPage);
    if (page && page >= 1 && page <= totalPages) {
      goToPage(page);
      jumpToPage = "";
    }
  }
</script>

{#if totalPages > 1}
  <div
    class="mt-6 flex items-center justify-between border-t border-gray-200 pt-6"
  >
    <div class="text-sm text-gray-700">
      Page <span class="font-medium">{currentPage}</span> of
      <span class="font-medium">{totalPages}</span>
    </div>

    <div class="flex items-center space-x-1">
      <button
        type="button"
        class="px-3 py-2 text-sm font-medium rounded-md {currentPage === 1
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'} transition-colors duration-150"
        disabled={currentPage === 1}
        on:click={() => goToPage(1)}
      >
        First
      </button>

      <button
        type="button"
        class="px-3 py-2 text-sm font-medium rounded-md {currentPage === 1
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'} transition-colors duration-150"
        disabled={currentPage === 1}
        on:click={() => goToPage(currentPage - 1)}
      >
        Previous
      </button>

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
          on:click={() => goToPage(page)}
        >
          {page}
        </button>
      {/each}

      <button
        type="button"
        class="px-3 py-2 text-sm font-medium rounded-md {currentPage ===
        totalPages
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'} transition-colors duration-150"
        disabled={currentPage === totalPages}
        on:click={() => goToPage(currentPage + 1)}
      >
        Next
      </button>

      <button
        type="button"
        class="px-3 py-2 text-sm font-medium rounded-md {currentPage ===
        totalPages
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'} transition-colors duration-150"
        disabled={currentPage === totalPages}
        on:click={() => goToPage(totalPages)}
      >
        Last
      </button>
    </div>

    <div class="flex items-center space-x-2">
      <span class="text-sm text-gray-700">Jump to:</span>
      <form
        on:submit|preventDefault={handleJumpToPage}
        class="flex items-center space-x-1"
      >
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
          class="px-3 py-1 text-sm font-medium bg-blue-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-150"
        >
          Go
        </button>
      </form>
    </div>
  </div>
{/if}
