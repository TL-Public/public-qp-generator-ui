<script>
  import api from "$lib/utils/api.js";
  import { onMount } from "svelte";
  import Modal from "$lib/components/Modal.svelte";

  let exams = [];
  let isLoading = true;
  let showViewModal = false;
  let selectedPaper = null;
  let viewError = null;
  
  // Add these variables to match search page pattern
  let examPapers = [];
  let paperDetailsList = [];
  let detailsLoading = false;
  let selectedPaperDetails = null;
  let errorMessage = '';

  onMount(async() => { 
    try {
        const response = await api.viewPapers.getAll({
            status: 'closed', 
            limit: 20,
        });
        if(response.error || !response.data) { 
            throw new Error('Api response error', response.error);
        }
        exams = response.data.exams || [];
        console.log('Successfully fetched data', exams);
    } catch (error) {
        console.error('Failed to fetch exams:', error);
        exams = [];
    } finally {
        isLoading = false;
    }
  });

  let sortKey = 'exam_code';
  let sortOrder = 1;

  $: sortedData = [...exams].sort((a, b) => {
    const valA = a[sortKey];
    const valB = b[sortKey];

    if (valA < valB) {
        return -1 * sortOrder;
    }
    if (valA > valB) {
        return 1 * sortOrder;
    }
    return 0;
  });

  function sortBy(key) {
    if (key === sortKey) {
        sortOrder *= -1;
    } else {
        sortKey = key;
        sortOrder = 1;
    }
  }

  async function viewExamByCode(examCode) {
    try {
      const response = await api.viewPapers.getByCode(examCode);
      if (!response || response.error) {
        console.log('Failed to fetch the exam papers', response.error);
        throw new Error(response.error);
      }
      console.log('View paper at recentlist table', response);
      return response;
    } catch (error) {
        console.error('Failed to fetch api', error);
        throw new Error(error);
    }
  }

  // Updated handleViewExam to match search page pattern exactly
  async function handleViewExam(examCode) {
    console.log('Viewing exam with code:', examCode);
    
    // Find the exam object from the current list
    const exam = exams.find(e => e.exam_code === examCode);
    selectedPaper = exam;
    showViewModal = true;
    paperDetailsList = [];
    detailsLoading = false;
    errorMessage = '';

    try {
      const response = await api.viewPapers.getByCode(examCode);
      if (response.error) throw new Error(response.error);

      if (response.data?.design?.papers) {
        examPapers = response.data.design.papers;
        await fetchAllPaperDetails();
      } else {
        examPapers = [];
        paperDetailsList = [];
      }
    } catch (error) {
      errorMessage = error.message || 'Failed to fetch exam design.';
      examPapers = [];
      paperDetailsList = [];
    }
  }

  // Add fetchAllPaperDetails function to match search page
  async function fetchAllPaperDetails() {
    detailsLoading = true;
    try {
      const results = await Promise.all(
        examPapers.map(async (paperId) => {
          // Using userQuestionPaper instead of adminPapers as per your request
          const response = await api.userQuestionPaper.getByCode(paperId);
          
          if (response.error) {
            throw new Error(response.error);
          }
          return response.data;
        })
      );
      paperDetailsList = results;
    } catch (error) {
      errorMessage = error.message || 'Failed to fetch paper details';
      paperDetailsList = [];
    } finally {
      detailsLoading = false;
    }
  }

  // Add handlePaperView function to match search page
  async function handlePaperView(event) {
    const { paperId, format, questionsOnly } = event.detail;
    
    try {
      const response = await api.userQuestionPaper.getByCode(paperId, { format });

      if (response.error) {
        throw new Error(response.error);
      }

      if (format === 'pdf') {
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `paper_${paperId}${questionsOnly ? '_questions_only' : ''}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        selectedPaperDetails = response.data;
      }
    } catch (error) {
      errorMessage = error.message || 'Failed to fetch paper details';
    }
  }
</script>

<div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
  <!-- Widget Header -->
  <div class="px-4 py-3 bg-gray-50 border-b border-gray-200">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <h3 class="text-sm font-medium text-gray-900">Recent Exams</h3>
      
      <!-- Sort Controls - Hidden on mobile -->
      <div class="hidden sm:flex items-center space-x-2 mt-2 sm:mt-0">
        <span class="text-xs text-gray-500">Sort by:</span>
        <button
          on:click={() => sortBy('exam_code')}
          class="text-xs px-2 py-1 rounded border hover:bg-gray-100 {sortKey === 'exam_code' ? 'bg-blue-50 border-blue-200' : 'border-gray-300'}"
        >
          Code {sortKey === 'exam_code' ? (sortOrder === 1 ? '↑' : '↓') : ''}
        </button>
        <button
          on:click={() => sortBy('exam_name')}
          class="text-xs px-2 py-1 rounded border hover:bg-gray-100 {sortKey === 'exam_name' ? 'bg-blue-50 border-blue-200' : 'border-gray-300'}"
        >
          Title {sortKey === 'exam_name' ? (sortOrder === 1 ? '↑' : '↓') : ''}
        </button>
      </div>
    </div>
  </div>

  <!-- Desktop Table View -->
  <div class="hidden sm:block">
    <div class="max-h-96 overflow-y-auto">
      <table class="w-full">
        <thead class="bg-gray-50 sticky top-0">
          <tr>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" 
                on:click={() => sortBy('exam_code')}>
              Code
              {#if sortKey === 'exam_code'}
                <span class="ml-1 text-gray-400">{sortOrder === 1 ? '↑' : '↓'}</span>
              {/if}
            </th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" 
                on:click={() => sortBy('exam_name')}>
              Exam Title
              {#if sortKey === 'exam_name'}
                <span class="ml-1 text-gray-400">{sortOrder === 1 ? '↑' : '↓'}</span>
              {/if}
            </th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          {#if isLoading}
            <tr>
              <td colspan="3" class="px-4 py-8 text-center text-sm text-gray-500">
                <div class="flex items-center justify-center space-x-2">
                  <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                  <span>Loading...</span>
                </div>
              </td>
            </tr>
          {:else if sortedData.length > 0}
            {#each sortedData as exam (exam.exam_code)}
              <tr class="hover:bg-gray-50 transition-colors duration-150">
                <td class="px-4 py-3 text-sm font-mono text-gray-900">
                  {exam.exam_code || 'N/A'}
                </td>
                <td class="px-4 py-3 text-sm text-gray-900">
                  <div class="truncate max-w-xs" title={exam.exam_name}>
                    {exam.exam_name || 'Untitled Exam'}
                  </div>
                </td>
                <td class="px-4 py-3 text-sm text-gray-900">
                  <button
                    type="button"
                    class="text-blue-600 hover:text-blue-800 focus:outline-none focus:underline text-left font-medium transition-colors duration-150"
                    on:click={() => handleViewExam(exam.exam_code)}
                  >
                    View
                  </button>
                </td>
              </tr>
            {/each}
          {:else}
            <tr>
              <td colspan="3" class="px-4 py-8 text-center text-sm text-gray-500">
                <div class="flex flex-col items-center space-y-2">
                  <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  <span>No exams found</span>
                </div>
              </td>
            </tr>
          {/if}
        </tbody>
      </table>
    </div>
  </div>

  <!-- Mobile Card View -->
  <div class="sm:hidden">
    {#if isLoading}
      <div class="px-4 py-8 text-center text-sm text-gray-500">
        <div class="flex items-center justify-center space-x-2">
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
          <span>Loading...</span>
        </div>
      </div>
    {:else if sortedData.length > 0}
      <div class="max-h-96 overflow-y-auto">
        <div class="divide-y divide-gray-200">
          {#each sortedData as exam (exam.exam_code)}
            <div class="px-4 py-4 hover:bg-gray-50 transition-colors duration-150">
              <div class="space-y-3">
                <!-- Exam Code -->
                <div class="flex items-start justify-between">
                  <div class="flex-1 min-w-0">
                    <div class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                      Code
                    </div>
                    <div class="text-sm font-mono text-gray-900">
                      {exam.exam_code || 'N/A'}
                    </div>
                  </div>
                </div>

                <!-- Exam Title -->
                <div>
                  <div class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                    Exam Title
                  </div>
                  <div class="text-sm text-gray-900 font-medium">
                    {exam.exam_name || 'Untitled Exam'}
                  </div>
                </div>

                <!-- Action Button -->
                <div class="pt-2">
                  <button
                    type="button"
                    class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150 w-full justify-center"
                    on:click={() => handleViewExam(exam.exam_code)}
                  >
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Exam
                  </button>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {:else}
      <div class="px-4 py-8 text-center text-sm text-gray-500">
        <div class="flex flex-col items-center space-y-2">
          <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <span>No exams found</span>
        </div>
      </div>
    {/if}
  </div>

  <!-- Footer with count -->
  {#if !isLoading && sortedData.length > 0}
    <div class="px-4 py-2 bg-gray-50 border-t border-gray-200">
      <p class="text-xs text-gray-500 text-center sm:text-left">
        Showing {sortedData.length} recent exams
      </p>
    </div>
  {/if}
</div>

<!-- Modal using exact same pattern as search page -->
{#if showViewModal}
  <Modal 
    loading={detailsLoading}
    error={errorMessage}
    papers={examPapers}
    paperDetails={selectedPaperDetails}
    on:close={() => {
      showViewModal = false;
      selectedPaperDetails = null;
    }}
    on:back={() => selectedPaperDetails = null}
    on:viewPaper={handlePaperView}
    examTitle={selectedPaper?.exam_name}
    numberOfQuestions={selectedPaper?.total_questions}
    subject={selectedPaper?.subject}
    standard={selectedPaper?.standard}
  />
{/if}