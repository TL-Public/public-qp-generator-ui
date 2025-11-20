<script>
  import { onMount } from 'svelte';
  
  export let questions = [];
  
  // Pagination
  let currentPage = 1;
  let itemsPerPage = 10;
  let totalPages = Math.ceil(questions.length / itemsPerPage);
  
  // Sorting
  let sortField = 'text';
  let sortDirection = 'asc';
  
  // Search
  let searchQuery = '';
  
  // Filtered and sorted questions
  $: filteredQuestions = questions
    .filter(q => !q.isBlacklisted)
    .filter(q => 
      q.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.chapter.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.difficulty.toLowerCase().includes(searchQuery.toLowerCase())
    );

  $: sortedQuestions = [...filteredQuestions].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    const direction = sortDirection === 'asc' ? 1 : -1;
    return aValue > bValue ? direction : -direction;
  });

  $: paginatedQuestions = sortedQuestions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  $: totalPages = Math.ceil(filteredQuestions.length / itemsPerPage);

  function handleSort(field) {
    if (sortField === field) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortField = field;
      sortDirection = 'asc';
    }
  }
</script>

<div class="space-y-4">
  <!-- Search Bar -->
  <div class="flex justify-between items-center">
    <div class="relative w-64">
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="Search questions..."
        class="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
      />
      <div class="absolute inset-y-0 right-0 flex items-center pr-3">
        <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
    </div>
  </div>

  <!-- Questions Table -->
  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          {#each ['Question', 'Type', 'Marks', 'Difficulty', 'Chapter'] as header, i}
            <th 
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              on:click={() => handleSort(['text', 'type', 'marks', 'difficulty', 'chapter'][i])}
            >
              <div class="flex items-center space-x-1">
                <span>{header}</span>
                {#if sortField === ['text', 'type', 'marks', 'difficulty', 'chapter'][i]}
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d={sortDirection === 'asc' ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} 
                    />
                  </svg>
                {/if}
              </div>
            </th>
          {/each}
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        {#each paginatedQuestions as question}
          <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 text-sm text-gray-900">{question.text}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{question.type}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{question.marks}</td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                ${question.difficulty === 'Easy' ? 'bg-green-100 text-green-800' : 
                  question.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-red-100 text-red-800'}`}>
                {question.difficulty}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{question.chapter}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <!-- Pagination -->
  <div class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
    <div class="flex flex-1 justify-between sm:hidden">
      <button
        class="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        on:click={() => currentPage = Math.max(1, currentPage - 1)}
        disabled={currentPage === 1}
      >
        Previous
      </button>
      <button
        class="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        on:click={() => currentPage = Math.min(totalPages, currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
      </button>
    </div>
    <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
      <div>
        <p class="text-sm text-gray-700">
          Showing <span class="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span class="font-medium">
            {Math.min(currentPage * itemsPerPage, filteredQuestions.length)}
          </span> of <span class="font-medium">{filteredQuestions.length}</span> results
        </p>
      </div>
      <div>
        <nav class="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
          <button
            class="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
            on:click={() => currentPage = Math.max(1, currentPage - 1)}
            disabled={currentPage === 1}
          >
            <span class="sr-only">Previous</span>
            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clip-rule="evenodd" />
            </svg>
          </button>
          <button
            class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
            on:click={() => currentPage = Math.min(totalPages, currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <span class="sr-only">Next</span>
            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
            </svg>
          </button>
        </nav>
      </div>
    </div>
  </div>
</div>