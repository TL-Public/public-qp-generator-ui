<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import {api} from '$lib/utils/api.js';
  import { authStore } from '$lib/stores/authStore';
  import Modal from '$lib/components/Modal.svelte';

  // Search and sort state
  let sortField = 'created_at';
  let sortDirection = 'desc';
  let showAdvancedSearch = false;
  
  // Pagination state
  let currentPage = 1;
  let itemsPerPage = 10;
  let jumpToPage = '';

  // Status selection state
  let selectedStatus = '';
  let statusError = null;
  let hasSelectedStatus = false;

  // Advanced search filters - updated to match API parameters
  let searchFilters = {
    exam_name: '',
    subject: '',
    medium: '',
    standard: '',
    start_date: '',
    end_date: ''
  };

  let paperDetailsList = [];
  let detailsLoading = false;
  
  let showPaperDetailsModal = false;
  let selectedPaperDetails = null;

  // Add these state variables
  let showDeleteModal = false;
  let deleteConfirmText = '';
  let examToDelete = null;
  let successMessage = '';

  // New state variable for exam summary modal
  let showExamSummaryModal = false;

  // Updated headers to match the new API response
  const headers = [
    { key: 'exam_code', label: 'Exam Code' },
    { key: 'exam_name', label: 'Exam Title' },
    { key: 'subject', label: 'Class & Subject' },
  /*  { key: 'standard', label: 'Class' },
    { key: 'medium', label: 'Medium' },
    { key: 'created_at', label: 'Created At' },*/
    { key: 'status', label: 'Status' },
    { key: 'number_of_sets', label: 'Sets & Versions' },
  /*  { key: 'number_of_versions', label: 'Versions' },
    { key: 'total_questions', label: 'Questions' },*/
    { key: 'exam_type', label: 'Type' },
/*    { key: 'exam_mode', label: 'Mode' },*/
    { key: 'actions', label: 'Actions' },
  ];

  // Updated state variables to work with new API
  let loading = false;
  let exams = [];
  let errorMessage = '';
  let isAdmin = false;
  let showViewModal = false;
  let selectedPaper = null;
  let selectedFormat = 'json';
  let hideAnswers = false;

  // API pagination state
  let totalResults = 0;
  let totalPages = 0;
  let hasSearched = false;

  // Function to submit selected status
  async function submitSelectedStatus() {
    statusError = null;
    loading = true;
    errorMessage = '';
    hasSearched = false;

    if (!selectedStatus) {
      statusError = "Please select a status first.";
      loading = false;
      return;
    }

    try {
      hasSelectedStatus = true;
      hasSearched = true;
      
      // Reset search filters when status changes
      searchFilters = {
        exam_name: '',
        subject: '',
        medium: '',
        standard: '',
        start_date: '',
        end_date: ''
      };
      currentPage = 1;
      
      // Automatically search with just the status
      await searchPapers();
      
    } catch (err) {
      statusError = err.message || "An unexpected error occurred.";
      exams = [];
      totalResults = 0;
      totalPages = 0;
      hasSelectedStatus = false;
      hasSearched = false;
    } finally {
      loading = false;
    }
  }

  // Function to create nested structure for display
function createNestedStructure(chaptersTopics) {
  const result = [];
  const chapterMap = new Map();
  
  // First, collect all chapters
  chaptersTopics.forEach(group => {
    if (group.type === 'chapter') {
      group.codes.forEach(chapter => {
        if (!chapterMap.has(chapter.code)) {
          chapterMap.set(chapter.code, {
            chapter: chapter,
            topics: []
          });
        }
      });
    }
  });
  

  chaptersTopics.forEach(group => {
    if (group.type === 'topic') {
      group.codes.forEach(topic => {
        const chapterCode = topic.chapter_details?.code;
        if (chapterCode && chapterMap.has(chapterCode)) {
          chapterMap.get(chapterCode).topics.push(topic);
        } else {
          // If chapter doesn't exist in the chapters list, create a placeholder
          if (chapterCode && !chapterMap.has(chapterCode)) {
            chapterMap.set(chapterCode, {
              chapter: {
                code: chapterCode,
                name: topic.chapter_details?.name || 'Unknown Chapter'
              },
              topics: [topic]
            });
          }
        }
      });
    }
  });
  
  // Convert map to array and sort by chapter code
  return Array.from(chapterMap.values()).sort((a, b) => 
    a.chapter.code.localeCompare(b.chapter.code)
  );
}

  // Updated search function using the new API
  async function searchPapers() {
    if (!hasSelectedStatus) {
      errorMessage = "Please select a status first.";
      return;
    }

    loading = true;
    errorMessage = '';
    successMessage = '';

    try {
      // Prepare query parameters
      const queryParams = {
        status: selectedStatus,
        page: currentPage,
        limit: itemsPerPage
      };

      // Add optional filters if they have values
      if (searchFilters.exam_name.trim()) {
        queryParams.exam_name = searchFilters.exam_name.trim();
      }
      if (searchFilters.subject.trim()) {
        queryParams.subject = searchFilters.subject.trim();
      }
      if (searchFilters.medium.trim()) {
        queryParams.medium = searchFilters.medium.trim();
      }
      if (searchFilters.standard.trim()) {
        queryParams.standard = searchFilters.standard.trim();
      }
      if (searchFilters.start_date) {
        queryParams.start_date = searchFilters.start_date;
      }
      if (searchFilters.end_date) {
        queryParams.end_date = searchFilters.end_date;
      }

      console.log('Search query parameters:', queryParams);

      const response = await api.viewPapers.getAll(queryParams);

      if (response.error) {
        throw new Error(response.error);
      }

      console.log('Search API Response:', response.data);
      
      // Update state with response data
      exams = response.data.exams || [];
      totalResults = response.data.total || 0;
      totalPages = Math.ceil(totalResults / itemsPerPage);
      
      console.log('Updated exams:', exams, 'Total:', totalResults);

    } catch (err) {
      console.error('Error in searchPapers:', err);
      errorMessage = err.message || "An unexpected error occurred during search.";
      exams = [];
      totalResults = 0;
      totalPages = 0;
    } finally {
      loading = false;
    }
  }

  // Subscribe to auth store to check admin status
  onMount(async () => {
    const unsubscribe = authStore.subscribe(value => {
      isAdmin = value.roleCode === '100';
    });
    return unsubscribe;
  });

  // Clear all filters
  function clearAllFilters() {
    searchFilters = {
      exam_name: '',
      subject: '',
      medium: '',
      standard: '',
      start_date: '',
      end_date: ''
    };
    currentPage = 1;
    // Re-search with cleared filters
    searchPapers();
  }

  function toggleAdvancedSearch() {
    showAdvancedSearch = !showAdvancedSearch;
  }
  // Reset everything (including status)
  function resetAll() {
    selectedStatus = '';
    hasSelectedStatus = false;
    hasSearched = false;
    searchFilters = {
      exam_name: '',
      subject: '',
      medium: '',
      standard: '',
      start_date: '',
      end_date: ''
    };
    currentPage = 1;
    exams = [];
    totalResults = 0;
    totalPages = 0;
    errorMessage = '';
    successMessage = '';
    statusError = null;
  }

  // Pagination functions
  function goToPage(page) {
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
      searchPapers(); // Re-search with new page
    }
  }

  function handleJumpToPage(event) {
    event.preventDefault();
    const page = parseInt(jumpToPage);
    if (page && page >= 1 && page <= totalPages) {
      goToPage(page);
      jumpToPage = '';
    }
  }

  function handleEdit(paperId) {
    console.log('Editing paper:', paperId);
    if (paperId) {
      goto(`/edit/${paperId}`);
    }
  }

  function toggleSort(field) {
    console.log('Toggling sort:', { currentField: sortField, newField: field, currentDirection: sortDirection });
    if (sortField === field) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortField = field;
      sortDirection = 'asc';
    }
    // Re-sort current results
    sortExams();
  }

  function sortExams() {
    exams = exams.sort((a, b) => {
      let comparison = 0;
      const aValue = a[sortField] || '';
      const bValue = b[sortField] || '';
      
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;
      return sortDirection === 'desc' ? -comparison : comparison;
    });
  }

  function getColumnWidth(key) {
    const widths = {
      'exam_code': '8%',
      'exam_name': '25%', // Increased width to prevent overlap
      'subject': '12%',
  /*    'standard': '6%',
      'medium': '8%',*/
      'created_at': '10%',
      'status': '8%',
      'number_of_sets': '10%',
    /*  'number_of_versions': '6%',
      'total_questions': '6%',*/
      'exam_type': '6%',
      'exam_mode': '6%',
      'actions': '12%', // Increased width for actions to ensure visibility
    };
    return widths[key] || 'auto';
  }

  let examPapers = [];

  // Updated handleViewPaper function
  async function handleViewPaper(paper) {
    selectedPaper = paper;
    showViewModal = true;
    paperDetailsList = [];
    detailsLoading = false;

    try {
      const response = await api.viewPapers.getByCode(paper.exam_code);
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

  // fetch paper summary by giving the exam code
  let examSummaryData = null ; 
  let summaryLoading = false ; 
  
  async function handlePaperSummary(examCode) {
    console.log(examCode);
    try {
      showExamSummaryModal = true ; 
      examSummaryData = null ; 
      summaryLoading = true ; 
      const response = await api.viewPapers.getByCode(examCode) ; 
      if(response.error) { 
        throw new Error(response.error) ; 
      }
      if(response.data?.design){
        examSummaryData = response.data.design ; 
        console.log("the response data design",response.data.design) ; 
      } else {
        throw new Error('No exam design data found') ; 
      }
    } catch (error) {
      console.error(error);
      errorMessage = error.message || 'Failed to fetch exam design' ;                   
      showExamSummaryModal = false ; 
    } finally{
      summaryLoading = false ; 
    }
  }

  async function fetchAllPaperDetails() {
    detailsLoading = true;
    try {
      const results = await Promise.all(
        examPapers.map(async (paperId) => {
          const response = await api.adminPapers.getDetails({
            paperCode: selectedPaper.exam_code,
            paperId,
            format: selectedFormat,
            questionsOnly: hideAnswers
          });
          
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

  async function handlePaperView(event) {
    const { paperId, format, questionsOnly } = event.detail;
    
    try {
      const response = await api.adminPapers.getDetails({
        paperCode: selectedPaper.exam_code,
        paperId,
        format,
        questionsOnly
      });

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

  function handleDelete(examCode) {
    examToDelete = examCode;
    showDeleteModal = true;
  }

  async function confirmDelete() {
    if (deleteConfirmText.toLowerCase() !== 'confirm') {
      errorMessage = 'Please type "confirm" to delete the exam';
      return;
    }

    try {
      const response = await api.viewPapers.delete(examToDelete);
      if (response.error) {
        throw new Error(response.error);
      }
      
      successMessage = `Question paper with exam code '${examToDelete}' deleted successfully.`;
      errorMessage = '';
      showDeleteModal = false;
      deleteConfirmText = '';
      examToDelete = null;
      
      // Refresh the search results
      await searchPapers();
      
      setTimeout(() => {
        successMessage = '';
      }, 5000);
      
    } catch (error) {
      errorMessage = error.message || 'Failed to delete exam';
      console.error('Delete error:', error);
    }
  }

  // Helper function to format date
  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch (error) {
      return 'Invalid Date';
    }
  }

  // Reset to first page when filters change
  function handleFilterChange() {
    currentPage = 1;
  }

  // Helper function to format status display
  function formatStatus(status) {
    const statusMap = {
      'draft': 'Draft',
      'closed': 'Released'  // Alternative name for closed
    };
    return statusMap[status] || status;
  }

  // Helper function to get status styling
  function getStatusStyling(status) {
    const stylingMap = {
      'draft': 'bg-yellow-100 text-yellow-800',
      'closed': 'bg-green-100 text-green-800'
    };
    return stylingMap[status] || 'bg-gray-100 text-gray-800';
  }
</script>

<main class="min-h-screen bg-gray-50">
  <div class="w-full px-4 sm:px-6 lg:px-8 py-8">
    
    <!-- Step 1: Status Selection -->
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
              class="w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 shadow-sm transition-colors duration-200"
            >
              <option value="" disabled>Choose paper status...</option>
              <option value="draft">📝 Draft Papers</option>
              <option value="closed">✅ Released Papers</option>
            </select>
          </div>
        </div>

        <div class="flex gap-2">
          <button
            type="button" 
            on:click={submitSelectedStatus}
            disabled={loading || !selectedStatus}
            class="px-2 py-1 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
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

          {#if hasSelectedStatus}
            <button
              type="button"
              class="px-2 py-1 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200"
              on:click={resetAll}
            >
              Reset All
            </button>
            <button
              type="button"
              class="px-2 py-1 text-sm font-medium text-blue-700 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200"
              on:click={toggleAdvancedSearch}
            >
              {#if showAdvancedSearch}
                Hide Advanced Search
              {:else}
                Show Advanced Search
              {/if}
            </button>
          {/if}
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

    <!-- Step 2: Search Filters (Only shown after status is selected) -->
    {#if showAdvancedSearch}
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Advanced Search</h3>
            <p class="text-sm text-gray-600 mt-1">
              Refine your search with additional filters for {formatStatus(selectedStatus).toLowerCase()} papers
            </p>
          </div>
          <div class="flex items-center space-x-2 text-sm text-gray-500">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {formatStatus(selectedStatus)} Papers
            </span>
          </div>
        </div>

        <!-- Search Filters -->
        <div class="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <div class="flex items-center mb-4">
            <svg class="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
            </svg>
            <h4 class="text-sm font-medium text-gray-900">Search Filters</h4>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <!-- Exam Name -->
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-2">Exam Name</label>
              <input
                type="text"
                bind:value={searchFilters.exam_name}
                on:input={handleFilterChange}
                placeholder="Search exam name..."
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <!-- Subject -->
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-2">Subject</label>
              <input
                type="text"
                bind:value={searchFilters.subject}
                on:input={handleFilterChange}
                placeholder="Search subject..."
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <!-- Medium -->
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-2">Medium</label>
              <input
                type="text"
                bind:value={searchFilters.medium}
                on:input={handleFilterChange}
                placeholder="Search medium..."
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <!-- Standard/Class -->
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-2">Standard/Class</label>
              <input
                type="text"
                bind:value={searchFilters.standard}
                on:input={handleFilterChange}
                placeholder="Search class..."
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <!-- Start Date -->
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                bind:value={searchFilters.start_date}
                on:change={handleFilterChange}
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <!-- End Date -->
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                bind:value={searchFilters.end_date}
                on:change={handleFilterChange}
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              type="button"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200"
              on:click={clearAllFilters}
            >
              <div class="flex items-center justify-center">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear Filters
              </div>
            </button>
            <button
              type="button"
              class="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
              on:click={searchPapers}
            >
              {#if loading}
                <div class="flex items-center justify-center">
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Searching...
                </div>
              {:else}
                <div class="flex items-center justify-center">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search
                </div>
              {/if}
            </button>
          </div>
        </div>
      </div>
    {/if}

    <!-- Step 3: Results Section (Only shown after search) -->
    {#if hasSearched}
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <!-- Header Section -->
        <div class="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 class="text-lg font-semibold text-gray-900">
                Search Results ({formatStatus(selectedStatus)} Papers)
              </h3>
              <p class="text-sm text-gray-600 mt-1">
                Found {totalResults} {totalResults === 1 ? 'paper' : 'papers'}
              </p>
            </div>
            <div class="mt-3 sm:mt-0">
              <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Page {currentPage} of {totalPages}
              </span>
            </div>
          </div>
        </div>

        <!-- Content Area -->
        <div class="p-6">
          <!-- Success and Error Messages -->
          {#if errorMessage}
            <div class="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div class="ml-3">
                  <p class="text-sm text-red-700">{errorMessage}</p>
                </div>
              </div>
            </div>
          {/if}

          {#if successMessage}
            <div class="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div class="ml-3">
                  <p class="text-sm text-green-700">{successMessage}</p>
                </div>
              </div>
            </div>
          {/if}

          <!-- Results table -->
          {#if loading}
            <div class="text-center py-12">
              <svg class="animate-spin mx-auto h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p class="text-gray-500 mt-2">Searching papers...</p>
            </div>
          {:else if exams.length === 0}
            <div class="text-center py-12">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900">No papers found</h3>
              <p class="mt-1 text-sm text-gray-500">
                No papers match your search criteria. Try adjusting your filters.
              </p>
            </div>
          {:else}
            <div class="border border-gray-200 rounded-lg overflow-hidden">
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200" style="table-layout: fixed; width: 100%;">
                  <thead class="bg-gray-50">
                    <tr>
                      {#each headers as header}
                        <th
                          class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-150"
                          style="width: {getColumnWidth(header.key)}; min-width: {header.key === 'actions' ? '120px' : 'auto'};"
                          on:click={() => !['actions'].includes(header.key) && toggleSort(header.key)}
                        >
                          <div class="flex items-center space-x-1">
                            <span class="text-xs">{header.label}</span>
                            {#if !['actions'].includes(header.key)}
                              <span class="text-gray-400">
                                {sortField === header.key ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                              </span>
                            {/if}
                          </div>
                        </th>
                      {/each}
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    {#each exams as paper}
                      <tr class="hover:bg-gray-50 transition-colors duration-150">
                        {#each headers as header}
                          <td 
                            class="px-4 py-4 text-xs {header.key === 'actions' || header.key === 'exam_name' ? '' : 'whitespace-nowrap'}"
                            style="width: {getColumnWidth(header.key)}; {header.key === 'actions' ? 'min-width: 120px;' : ''} {header.key === 'exam_name' ? 'word-wrap: break-word; overflow-wrap: break-word;' : ''}"
                          >
                            {#if header.key === 'exam_name'}
                              <div class="w-full">
                                <button
                                  type="button" 
                                  class="text-blue-600 hover:text-blue-800 focus:outline-none focus:underline text-left font-medium transition-colors duration-150 w-full"
                                  title="Click to view paper details: {paper[header.key]}"
                                  on:click={() => handleViewPaper(paper)}
                                >
                                  <div class="break-words" style="word-wrap: break-word; overflow-wrap: break-word;">
                                    {paper[header.key]}
                                  </div>
                                  <div class="text-xs text-red-600 mt-1">({paper['total_questions']} Questions)</div>
                                </button>
                              </div>
                            {:else if header.key === 'exam_code'} 
                             <button
                             type = "button"
                             class="text-blue-600 hover:text-blue-800 focus:outline-none focus:underline text-left font-medium transition-colors duration-150"
                             on:click={() => handlePaperSummary(paper[header.key])}
                             >
                              {paper[header.key]}  
                             </button>
                            {:else if header.key === 'actions'}
                              <div class="flex items-center space-x-2">
                                <button
                                  type="button"
                                  class="text-blue-600 hover:text-blue-800 focus:outline-none focus:underline text-xs font-medium transition-colors duration-150"
                                  on:click={() => handleViewPaper(paper)}
                                >
                                  View
                                </button>
                                {#if isAdmin}
                                  <button
                                    type="button"
                                    class="text-red-600 hover:text-red-800 focus:outline-none focus:underline text-xs font-medium transition-colors duration-150"
                                    on:click={() => handleDelete(paper.exam_code)}
                                  >
                                    Delete
                                  </button>
                                {/if}
                                <!-- Only show Edit button for draft status -->
                                {#if paper.status === 'draft'}
                                  <button
                                    type="button"
                                    class="text-green-600 hover:text-green-800 focus:outline-none focus:underline text-xs font-medium transition-colors duration-150"
                                    on:click={() => handleEdit(paper.exam_code)}
                                  >
                                    Edit
                                  </button>
                                {/if}
                              </div>
                            {:else if header.key === 'created_at'}
                              <span class="text-xs text-gray-600" title={paper[header.key]}>
                                {formatDate(paper[header.key])}
                              </span>
                            {:else if header.key === 'status'}
                              <!-- Use alternative name for status display -->
                              <span class="inline-flex word-wrap items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusStyling(paper[header.key])}">
                                {formatStatus(paper[header.key])}
                              </span>
                            {:else if header.key === 'subject'}
                              <span class="text-xs text-gray-600" title={paper[header.key]}>
                                {paper['subject']},  {paper['standard']}, {paper['medium']}
                              </span>
                            {:else if header.key === 'number_of_sets'}
                              <div class="text-xs text-gray-600" title={paper[header.key]}>
                                No Of Sets - {paper['number_of_sets']}
                              </div>
                              <div class="text-xs text-gray-600" title={paper[header.key]}>
                                No Of Versions - {paper['number_of_versions']}
                              </div>
                            {:else if header.key === 'exam_type'}
                              <div class="text-xs text-gray-600" title={paper[header.key]}>
                                {paper['exam_type']}, {paper['exam_mode']}
                              </div>
                            {:else}
                              <div class="text-gray-900" title={paper[header.key]}>
                                <span class="word-wrap">{paper[header.key] || 'N/A'}</span>
                              </div>
                            {/if}
                          </td>
                        {/each}
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Enhanced Pagination Controls -->
            {#if totalPages > 1}
              <div class="mt-6 flex items-center justify-between border-t border-gray-200 pt-6">
                <!-- Left side: Page info -->
                <div class="text-sm text-gray-700">
                  Page <span class="font-medium">{currentPage}</span> of <span class="font-medium">{totalPages}</span>
                  <span class="text-gray-500 ml-2">({totalResults} total results)</span>
                </div>

                <!-- Center: Page navigation -->
                <div class="flex items-center space-x-1">
                  <!-- First page -->
                  <button
                    type="button"
                    class="px-3 py-2 text-sm font-medium rounded-md {currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'} transition-colors duration-150"
                    disabled={currentPage === 1}
                    on:click={() => goToPage(1)}
                  >
                    First
                  </button>

                  <!-- Previous page -->
                  <button
                    type="button"
                    class="px-3 py-2 text-sm font-medium rounded-md {currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'} transition-colors duration-150"
                    disabled={currentPage === 1}
                    on:click={() => goToPage(currentPage - 1)}
                  >
                    Previous
                  </button>

                  <!-- Page numbers -->
                  {#each Array.from({length: Math.min(5, totalPages)}, (_, i) => {
                    const start = Math.max(1, currentPage - 2);
                    const end = Math.min(totalPages, start + 4);
                    const adjustedStart = Math.max(1, end - 4);
                    return adjustedStart + i;
                  }).filter(page => page <= totalPages) as page}
                    <button
                      type="button"
                      class="px-3 py-2 text-sm font-medium rounded-md {currentPage === page ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'} transition-colors duration-150"
                      on:click={() => goToPage(page)}
                    >
                      {page}
                    </button>
                  {/each}

                  <!-- Next page -->
                  <button
                    type="button"
                    class="px-3 py-2 text-sm font-medium rounded-md {currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'} transition-colors duration-150"
                    disabled={currentPage === totalPages}
                    on:click={() => goToPage(currentPage + 1)}
                  >
                    Next
                  </button>

                  <!-- Last page -->
                  <button
                    type="button"
                    class="px-3 py-2 text-sm font-medium rounded-md {currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'} transition-colors duration-150"
                    disabled={currentPage === totalPages}
                    on:click={() => goToPage(totalPages)}
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
                      class="px-3 py-1 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-150"
                    >
                      Go
                    </button>
                  </form>
                </div>
              </div>
            {/if}
          {/if}
        </div>
      </div>
    {/if}
  </div>
</main>

<!-- All existing modals remain the same -->
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

{#if showPaperDetailsModal}
  <Modal 
    on:close={() => showPaperDetailsModal = false}
  >
    <div class="space-y-4">
      <h2 class="text-xl font-semibold">Paper Details</h2>
      
      <div class="bg-gray-50 p-4 rounded-lg overflow-x-auto">
        <pre class="text-sm whitespace-pre-wrap">{JSON.stringify(selectedPaperDetails, null, 2)}</pre>
      </div>

      <div class="flex justify-end mt-6">
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          on:click={() => showPaperDetailsModal = false}
        >
          Close
        </button>
      </div>
    </div>
  </Modal>
{/if}

{#if showDeleteModal}
  <div class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
      <div class="flex items-center mb-4">
        <div class="flex-shrink-0">
          <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-lg font-medium text-gray-900">Confirm Delete</h3>
        </div>
      </div>
      
      <div class="mb-4">
        <p class="text-sm text-gray-600">
          Are you sure you want to delete exam <span class="font-semibold text-gray-900">{examToDelete}</span>? 
          This action cannot be undone.
        </p>
      </div>
      
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Type "confirm" to delete:
        </label>
        <input
          type="text"
          bind:value={deleteConfirmText}
          placeholder="Type 'confirm'"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
        />
      </div>
      
      <div class="flex justify-end space-x-3">
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-150"
          on:click={() => {
            showDeleteModal = false;
            deleteConfirmText = '';
            examToDelete = null;
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-150"
          on:click={confirmDelete}
        >
          Delete
        </button>
      </div>
    </div>
  </div>
{/if}


<!-- TODO FIX WIDTH  -->
{#if showExamSummaryModal}
  <div class="fixed inset-0 bg-gray-500 opacity-98 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] ">
      <!-- Modal Header -->
      <div class="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <svg class="w-6 h-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div>
              <h2 class="text-xl font-semibold text-gray-900">Exam Design Summary</h2>
              <p class="text-sm text-gray-600 mt-1">Complete exam details and configuration</p>
            </div>
          </div>
          <button
            type="button"
            class="text-gray-400 hover:text-gray-600 transition-colors duration-150"
            on:click={() => showExamSummaryModal = false}
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Exam design summary Modal Content -->
      <div class="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
        {#if examSummaryData}
          <!-- Exam Basic Information -->
          <div class="mb-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <svg class="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Basic Information
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="flex justify-between items-center">
                  <span class="text-sm font-medium text-gray-500">Exam Name</span>
                  <span class="text-sm font-semibold text-gray-900">{examSummaryData.exam_name}</span>
                </div>
              </div>
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="flex justify-between items-center">
                  <span class="text-sm font-medium text-gray-500">Exam Code</span>
                  <span class="text-sm font-semibold text-blue-600">{examSummaryData.exam_code}</span>
                </div>
              </div>
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="flex justify-between items-center">
                  <span class="text-sm font-medium text-gray-500">Subject</span>
                  <span class="text-sm font-semibold text-gray-900">{examSummaryData.subject}</span>
                </div>
              </div>
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="flex justify-between items-center">
                  <span class="text-sm font-medium text-gray-500">Standard/Class</span>
                  <span class="text-sm font-semibold text-gray-900">{examSummaryData.standard}</span>
                </div>
              </div>
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="flex justify-between items-center">
                  <span class="text-sm font-medium text-gray-500">Medium</span>
                  <span class="text-sm font-semibold text-gray-900">{examSummaryData.medium}</span>
                </div>
              </div>
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="flex justify-between items-center">
                  <span class="text-sm font-medium text-gray-500">Status</span>
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusStyling(examSummaryData.status)}">
                    {formatStatus(examSummaryData.status)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Exam Configuration -->
          <div class="mb-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <svg class="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Exam Configuration
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div class="text-center">
                  <div class="text-2xl font-bold text-blue-600">{examSummaryData.exam_type}</div>
                  <div class="text-sm text-blue-600 font-medium">Exam Type</div>
                </div>
              </div>
              <div class="bg-green-50 rounded-lg p-4 border border-green-200">
                <div class="text-center">
                  <div class="text-2xl font-bold text-green-600 capitalize">{examSummaryData.exam_mode}</div>
                  <div class="text-sm text-green-600 font-medium">Exam Mode</div>
                </div>
              </div>
              <div class="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div class="text-center">
                  <div class="text-2xl font-bold text-purple-600">{examSummaryData.total_questions}</div>
                  <div class="text-sm text-purple-600 font-medium">Total Questions</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Paper Structure -->
          <div class="mb-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <svg class="w-5 h-5 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Paper Structure
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="text-lg font-semibold text-orange-600">{examSummaryData.number_of_sets}</div>
                    <div class="text-sm text-orange-600">Number of Sets</div>
                  </div>
                  <svg class="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
              <div class="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="text-lg font-semibold text-indigo-600">{examSummaryData.number_of_versions}</div>
                    <div class="text-sm text-indigo-600">Versions per Set</div>
                  </div>
                  <svg class="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2v0a2 2 0 01-2-2V9.5L14 7H8z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <!-- Generated Papers -->
          {#if examSummaryData.papers && examSummaryData.papers.length > 0}
            <div class="mb-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <svg class="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Generated Papers ({examSummaryData.papers.length})
              </h3>
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {#each examSummaryData.papers as paper, index}
                    <div class="bg-white rounded-md p-3 border border-gray-200 hover:border-blue-300 transition-colors duration-150">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center">
                          <div class="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          <span class="text-sm font-medium text-gray-700">{paper}</span>
                        </div>
                        <span class="text-xs text-gray-500">#{index + 1}</span>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            </div>

          {/if}

          <!-- TODO FIX STYLING FOR NESTED TABLE  -->
      {#if examSummaryData.chapters_topics && examSummaryData.chapters_topics.length > 0}
  <!-- Nested Content Table -->
  <div class="mb-6">
    <h3 class="text-lg font-medium text-gray-900 mb-4 flex items-center">
      <svg class="w-5 h-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
      Content Selection
    </h3>
    
    <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/3">
                Content Structure
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                Code
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                Type
              </th>
            </tr>
          </thead>
          <tbody class="bg-white">
            {#each createNestedStructure(examSummaryData.chapters_topics) as item}
              <!-- Chapter Row -->
              <tr class="border-b border-gray-100">
                <td class="px-4 py-3">
                  <div class="flex items-center">
                    <svg class="w-4 h-4 text-blue-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <span class="text-sm font-medium text-blue-700">{item.chapter.name}</span>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <span class="inline-flex items-center px-2 py-1 text-xs font-mono bg-blue-100 text-blue-800 rounded">
                    {item.chapter.code}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <span class="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded border border-blue-200">
                    Chapter
                  </span>
                </td>
              </tr>
              
              <!-- Topics under this chapter -->
              {#each item.topics as topic}
                <tr class="border-b border-gray-50 bg-gray-25">
                  <td class="px-4 py-2">
                    <div class="flex items-center ml-6">
                      <svg class="w-3 h-3 text-green-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7" />
                      </svg>
                      <span class="text-sm text-green-700">{topic.name}</span>
                    </div>
                  </td>
                  <td class="px-4 py-2">
                    <span class="inline-flex items-center px-2 py-1 text-xs font-mono bg-green-100 text-green-800 rounded">
                      {topic.code}
                    </span>
                  </td>
                  <td class="px-4 py-2">
                    <span class="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-50 text-green-700 rounded border border-green-200">
                      Topic
                    </span>
                  </td>
                </tr>
              {/each}
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </div>
{/if}


        {:else}
          <!-- Loading State -->
          <div class="text-center py-12">
            <svg class="animate-spin mx-auto h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="text-gray-500 mt-2">Loading exam details...</p>
          </div>
        {/if}
      </div>

      <!-- Modal Footer -->
      <div class="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-150"
          on:click={() => showExamSummaryModal = false}
        >
          Close
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  main {
    min-height: 100vh;
  }

  .truncate {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Custom scrollbar for tables */
  .overflow-x-auto::-webkit-scrollbar {
    height: 8px;
  }

  .overflow-x-auto::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
  }

  .overflow-x-auto::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
  }

  .overflow-x-auto::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }

  
.bg-gray-25 {
  background-color: #fafafa;
}

/* Ensure proper table spacing */
table td {
  vertical-align: top;
}

/* Fix table layout to enforce column widths */
table {
  table-layout: fixed;
  width: 100%;
}

/* Ensure action column content doesn't overflow */
table td:last-child {
  overflow: visible;
  white-space: normal;
}

/* Ensure exam_name column (2nd column) wraps properly and doesn't overlap */
table thead th:nth-child(2),
table tbody td:nth-child(2) {
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: normal;
  max-width: 0; /* Force column to respect width */
}

/* Ensure exam_name button content wraps */
table tbody td:nth-child(2) button {
  width: 100%;
  text-align: left;
}

table tbody td:nth-child(2) button div {
  word-break: break-word;
  overflow-wrap: break-word;
}

/* Chapter rows styling */
tr:has(.text-blue-700) {
  background-color: #f8fafc;
}

/* Topic rows styling with subtle background */
tr.bg-gray-25:hover {
  background-color: #f1f5f9;
}

/* Better visual hierarchy for nested items */
.ml-6 {
  margin-left: 1.5rem;
}

/* Compact spacing for topics */
.py-2 {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

/* Ensure badges have consistent sizing */
.inline-flex.items-center {
  min-height: 1.5rem;
}
</style>