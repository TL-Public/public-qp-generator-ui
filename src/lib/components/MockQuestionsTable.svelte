<script>
  import { createEventDispatcher } from 'svelte';
  import { selectedContentStore } from '$lib/stores/selectedContentStore.js';
  import { apiPayloadStore } from '$lib/stores/apiPayLoadStore.js';

  const dispatch = createEventDispatcher();
  
  export let questions = [];
  
  let searchTerm = '';
  let selectedDifficulty = '';
  let selectedType = '';
  let selectedMarks = '';
    // Add reactive logging to see when questions prop changes
  $: {
    // console.log('MockQuestionsTable received questions:', questions);
    // console.log('Questions count:', questions.length);
  }
  
  // Pagination variables
  let currentPage = 1;
  let questionsPerPage = 10;
  
  // Track originally fetched questions for exclusion tracking
  let originalQuestions = [];
  let excludedQuestions = [];
  
  // Initialize original questions when questions prop changes
  $: if (questions.length > 0 && originalQuestions.length === 0) {
    originalQuestions = [...questions];
  }

  // Filter questions based on search and filters
  $: filteredQuestions = questions.filter(question => {
    const matchesSearch = !searchTerm || 
      question.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.parent?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDifficulty = !selectedDifficulty || question.difficulty === selectedDifficulty;
    const matchesType = !selectedType || question.type === selectedType;
    const matchesMarks = !selectedMarks || question.marks?.toString() === selectedMarks;
    
    return matchesSearch && matchesDifficulty && matchesType && matchesMarks;
  });

  // Reactive calculations for pagination
  $: totalPages = Math.ceil(filteredQuestions.length / questionsPerPage);
  $: startIndex = (currentPage - 1) * questionsPerPage;
  $: endIndex = Math.min(startIndex + questionsPerPage, filteredQuestions.length);
  $: paginatedQuestions = filteredQuestions.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  $: if (searchTerm || selectedDifficulty || selectedType || selectedMarks) {
    currentPage = 1;
  }

  // Ensure currentPage is within valid range
  $: if (currentPage > totalPages && totalPages > 0) {
    currentPage = totalPages;
  }
  $: if (currentPage < 1 && totalPages > 0) {
    currentPage = 1;
  }

  // Get unique values for filters
  $: difficulties = [...new Set(questions.map(q => q.difficulty).filter(Boolean))];
  $: types = [...new Set(questions.map(q => q.type).filter(Boolean))];
  $: marks = [...new Set(questions.map(q => q.marks).filter(Boolean))];

  function removeQuestion(questionId) {
    if (!excludedQuestions.includes(questionId)) {
      excludedQuestions = [...excludedQuestions, questionId];
    }
    
    questions = questions.filter(q => q.id !== questionId);
    selectedContentStore.removeQuestion(questionId);
    updateApiPayloadExcludedQuestions();
    
    dispatch('questionRemoved', { 
      id: questionId, 
      removed: true,
      excludedQuestions: excludedQuestions,
      remainingCount: questions.length
    });
  }

  function updateApiPayloadExcludedQuestions() {
    apiPayloadStore.updateExcludedQuestions(excludedQuestions);
  }

  function restoreQuestion(questionId) {
    const questionToRestore = originalQuestions.find(q => q.id === questionId);
    if (questionToRestore) {
      questions = [...questions, questionToRestore];
      excludedQuestions = excludedQuestions.filter(id => id !== questionId);
      updateApiPayloadExcludedQuestions();
      
      dispatch('questionRemoved', { 
        id: questionId, 
        removed: false,
        excludedQuestions: excludedQuestions,
        remainingCount: questions.length
      });
    }
  }

  // Pagination functions
  function goToPage(page) {
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
    }
  }

  function nextPage() {
    if (currentPage < totalPages) {
      currentPage++;
    }
  }

  function previousPage() {
    if (currentPage > 1) {
      currentPage--;
    }
  }

  function handlePageInput(event) {
    const value = parseInt(event.target.value);
    if (!isNaN(value) && value >= 1 && value <= totalPages) {
      currentPage = value;
    } else if (event.target.value === '') {
      // Allow clearing the input without forcing a change
    } else {
      // Reset to current page if input is invalid
      event.target.value = currentPage;
    }
  }
</script>

<!-- Add excluded questions summary at the top -->
{#if excludedQuestions.length > 0}
  <div class="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
    <div class="flex items-center justify-between">
      <div>
        <h4 class="text-sm font-medium text-yellow-800">
          {excludedQuestions.length} Question{excludedQuestions.length !== 1 ? 's' : ''} Excluded
        </h4>
        <p class="text-xs text-yellow-700">
          These questions will not be included in the generated paper.
        </p>
      </div>
      <button
        on:click={() => {
          excludedQuestions.forEach(id => restoreQuestion(id));
        }}
        class="text-xs text-yellow-800 hover:text-yellow-900 underline"
      >
        Restore All
      </button>
    </div>
  </div>
{/if}

<div class="space-y-4">
  <!-- Responsive Table Container -->
  <div class="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
    <table class="min-w-full divide-y divide-gray-300">
      <thead class="bg-gray-50">
        <tr>
          <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 sm:pl-6">
            Question
          </th>
          <th scope="col" class="hidden sm:table-cell px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
            Type
          </th>
          <th scope="col" class="hidden md:table-cell px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
            Marks
          </th>
          <th scope="col" class="hidden lg:table-cell px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
            Difficulty
          </th>
          <th scope="col" class="hidden xl:table-cell px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
            Parent
          </th>
          <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-6">
            <span class="sr-only">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-200 bg-white">
        <!-- **** FIX: Iterate over 'paginatedQuestions' instead of 'filteredQuestions' **** -->
        {#each paginatedQuestions as question (question.id)}
          <tr class="hover:bg-gray-50 {excludedQuestions.includes(question.id) ? 'opacity-50 bg-red-50' : ''}">
            <!-- Question Text -->
            <td class="py-4 pl-4 pr-3 sm:pl-6">
              <div class="flex flex-col">
                <div class="text-sm font-medium text-gray-900 break-words">
                  {@html question.text}
                </div>
                <!-- Mobile-only info -->
                <div class="sm:hidden mt-1 space-y-1">
                  <div class="text-xs text-gray-500">
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {question.type}
                    </span>
                    <span class="ml-2 text-gray-600">{question.marks} marks</span>
                  </div>
                  <div class="text-xs text-gray-500">
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium 
                      {question.difficulty === 'Easy' ? 'bg-green-100 text-green-800' : 
                        question.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'}">
                      {question.difficulty}
                    </span>
                  </div>
                </div>
              </div>
            </td>

            <!-- Type (Hidden on mobile) -->
            <td class="hidden sm:table-cell px-3 py-4 text-sm text-gray-500">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                {question.type === 'MCQ' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}">
                {question.type}
              </span>
            </td>

            <!-- Marks (Hidden on small screens) -->
            <td class="hidden md:table-cell px-3 py-4 text-sm text-gray-900 font-medium">
              {question.marks}
            </td>

            <!-- Difficulty (Hidden on medium screens and below) -->
            <td class="hidden lg:table-cell px-3 py-4 text-sm">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                {question.difficulty === 'Easy' ? 'bg-green-100 text-green-800' : 
                  question.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-red-100 text-red-800'}">
                {question.difficulty}
              </span>
            </td>

            <!-- Parent (Hidden on large screens and below) -->
            <td class="hidden xl:table-cell px-3 py-4 text-sm text-gray-500 max-w-xs">
              <div class="truncate" title={question.parent?.name}>
                {question.parent?.name}
              </div>
              <div class="text-xs text-gray-400 capitalize">
                ({question.parent?.type})
              </div>
            </td>

            <!-- Actions -->
            <td class="relative py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
              <button
                type="button"
                class="text-red-600 hover:text-red-900 transition-colors duration-200"
                on:click={() => excludedQuestions.includes(question.id) ? restoreQuestion(question.id) : removeQuestion(question.id)}
              >
                {excludedQuestions.includes(question.id) ? 'Restore' : 'Remove'}
              </button>
            </td>
          </tr>
        {:else}
          <tr>
            <td colspan="6" class="text-center py-10 text-gray-500">
              No questions found.
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <!-- Pagination -->
  {#if totalPages > 1}
  <div class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
    <div class="flex flex-1 justify-between sm:hidden">
      <button
        on:click={previousPage}
        disabled={currentPage === 1}
        class="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Previous
      </button>
      <button
        on:click={nextPage}
        disabled={currentPage === totalPages}
        class="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </div>
    
    <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
      <div>
        <p class="text-sm text-gray-700">
          Showing <span class="font-medium">{startIndex + 1}</span>
          to <span class="font-medium">{endIndex}</span>
          of <span class="font-medium">{filteredQuestions.length}</span> results
        </p>
      </div>
      <div>
        <nav class="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
          <button
            type="button"
            on:click={previousPage}
            disabled={currentPage === 1}
            class="relative inline-flex items-center rounded-l-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span class="sr-only">Previous</span>
            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clip-rule="evenodd" />
            </svg>
          </button>
          
          <!-- Page Input -->
          <div class="flex items-center px-4 border-t border-b border-gray-300">
            <span class="text-sm text-gray-700">Page</span>
            <input
              type="number"
              min="1"
              max={totalPages}
              bind:value={currentPage}
              on:change={handlePageInput}
              class="w-14 mx-2 rounded-md border border-gray-300 p-1.5 text-sm text-center focus:border-blue-500 focus:ring-blue-500"
            />
            <span class="text-sm text-gray-700">of {totalPages}</span>
          </div>
          
          <button
            on:click={nextPage}
            type="button"
            disabled={currentPage === totalPages}
            class="relative inline-flex items-center rounded-r-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-20 disabled:opacity-50 disabled:cursor-not-allowed"
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
  {/if}
</div>
