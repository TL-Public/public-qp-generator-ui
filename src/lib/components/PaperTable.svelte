<script>
  import { createEventDispatcher } from 'svelte';
  import Card from './Cards/Card.svelte';
  
  // Props
  export let papers = [];
  export let title = "Question Papers";
  export let itemsPerPage = 5;
  
  // Internal state
  let selectedPaperId = null;
  let currentPage = 1;
  let searchQuery = '';
  
  const dispatch = createEventDispatcher();
  
  // Table headers configuration
  const headers = [
    { key: 'questionPaperId', label: 'Paper ID' },
    { key: 'eventName', label: 'Exam Title' },
    { key: 'subjectName', label: 'Subject' },
    { key: 'standard', label: 'Class' },
    { key: 'medium', label: 'Medium' },
    { key: 'createdAt', label: 'Created' },
    { key: 'status', label: 'Status' }
  ];

  // Reactive declarations
  $: filteredPapers = papers.filter(paper => 
    Object.values(paper)
      .some(value => 
        String(value).toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  $: paginatedPapers = filteredPapers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  $: totalPages = Math.ceil(filteredPapers.length / itemsPerPage);

  // Helper functions
  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
  }

  function getStatusStyle(status) {
    switch(status) {
      case 'Draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'Published':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  function handleSelect(paperId) {
    selectedPaperId = selectedPaperId === paperId ? null : paperId;
    dispatch('select', { paperId: selectedPaperId });
  }

  function handleEdit() {
    if (selectedPaperId) {
      dispatch('edit', { paperId: selectedPaperId });
    }
  }
</script>

<Card {title}>
  <div class="space-y-4">
    <!-- Search and Edit Button Row -->
    <div class="flex justify-between items-center mb-4">
      <div class="w-64">
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Search papers..."
          class="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {#if selectedPaperId}
        <button
          on:click={handleEdit}
          class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center space-x-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
          <span>Edit Selected Paper</span>
        </button>
      {/if}
    </div>

    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th scope="col" class="w-12 px-6 py-3"></th>
            {#each headers as header}
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {header.label}
              </th>
            {/each}
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {#each paginatedPapers as paper}
            <tr class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={selectedPaperId === paper.questionPaperId}
                  on:change={() => handleSelect(paper.questionPaperId)}
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </td>
              {#each headers as header}
                <td class="px-6 py-4 whitespace-nowrap">
                  {#if header.key === 'status'}
                    <span class="px-2 py-1 text-xs font-medium rounded-full {getStatusStyle(paper.status)}">
                      {paper.status}
                    </span>
                  {:else if header.key === 'createdAt'}
                    {formatDate(paper[header.key])}
                  {:else}
                    {paper[header.key]}
                  {/if}
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    {#if totalPages > 1}
      <div class="flex justify-between items-center mt-4">
        <div class="text-sm text-gray-700">
          Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredPapers.length)} of {filteredPapers.length} papers
        </div>
        <div class="flex space-x-2">
          <button
            on:click={() => currentPage--}
            disabled={currentPage === 1}
            class="px-3 py-1 rounded border {currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'hover:bg-gray-50'}"
          >
            Previous
          </button>
          <button
            on:click={() => currentPage++}
            disabled={currentPage === totalPages}
            class="px-3 py-1 rounded border {currentPage === totalPages ? 'bg-gray-100 text-gray-400' : 'hover:bg-gray-50'}"
          >
            Next
          </button>
        </div>
      </div>
    {/if}
  </div>
</Card>