<script>
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import { apiClient } from "$lib/utils/api.js";
  import { authStore } from "$lib/stores/authStore";
  import Modal from "$lib/components/Modal.svelte";
  import DropDownSelector from "$lib/components/DropDownSelector.svelte";
  import Button from "$lib/components/Button.svelte";
  import DeletionModal from "$lib/components/DeletionModal.svelte";
  import Input from "$lib/components/Input.svelte";
  import Portal from "$lib/components/Portal.svelte";
  import PortalBackdrop from "$lib/components/PortalBackdrop.svelte";
  import ExamDesignSummaryModal from "$lib/components/exams/ExamDesignSummaryModal.svelte";
  import PortalModal from "$lib/components/PortalModal.svelte";
  import TablePagination from "$lib/components/TablePagination.svelte";
  import ExamLinkCell from "$lib/components/ui/ExamLinkCell.svelte";
  import ExamCodeCell from "$lib/components/ui/ExamCodeCell.svelte";
  import DataTable from "$lib/components/DataTable.svelte";
  import SpinnerWithText from "$lib/components/SpinnerWithText.svelte";
  import SearchableComboBox from "$lib/components/SearchableComboBox.svelte";
  import { Newspaper } from "@lucide/svelte";

  // Search and sort state
  let sortField = "created_at";
  let sortDirection = "desc";
  let showAdvancedSearch = false;

  // Pagination state
  let currentPage = 1;
  let itemsPerPage = 10;
  let jumpToPage = "";

  const statusOptions = [
    { name: "📝 Draft Papers", value: "draft" },
    { name: "✅ Released Papers", value: "closed" },
  ];

  // Status selection state
  let selectedStatus = null;
  let statusError = null;
  let hasSelectedStatus = false;

  async function updateStatusInUrl(statusValue) {
    const params = new URLSearchParams($page.url.searchParams);
    if (statusValue) {
      params.set("status", statusValue);
      params.set("page", "1");
    } else {
      params.delete("status");
      params.delete("page");
    }
    await goto(`${$page.url.pathname}?${params.toString()}`, {
      keepFocus: true,
      replaceState: true,
      noScroll: true,
    });
  }

  function handleStatusSelection(event) {
    const { selectedOption } = event.detail;
    selectedStatus = selectedOption;
    statusError = null;
    // updateStatusInUrl(selectedOption.value); // Prevent automatic fetch on dropdown selection
  }

  function handleStatusCancel() {
    selectedStatus = null;
    statusError = null;
    // updateStatusInUrl(null); // Prevent automatic fetch on cancel
  }

  // Sync status and page from URL using a reactive statement that only depends
  // on $page.url to prevent reactive loops.
  $: if (browser) handleUrlChange($page.url);

  async function handleUrlChange(url) {
    const statusParam = url.searchParams.get("status");
    const pageParam = url.searchParams.get("page");

    if (statusParam) {
      const option = statusOptions.find((opt) => opt.value === statusParam);
      if (option) {
        selectedStatus = option;
        hasSelectedStatus = true;

        const urlPage = parseInt(pageParam) || 1;
        currentPage = urlPage;
        hasSearched = true;
        await searchPapers();
      }
    } else {
      // Reset if status is removed from URL (e.g. back button to root)
      selectedStatus = null;
      hasSelectedStatus = false;
      hasSearched = false;
      exams = [];
      totalResults = 0;
      totalPages = 0;
      currentPage = 1;
    }
  }

  // Advanced search filters - updated to match API parameters
  let searchFilters = {
    exam_name: "",
    subject: "",
    medium: "",
    standard: "",
    start_date: "",
    end_date: "",
  };

  let paperDetailsList = [];
  let detailsLoading = false;

  let showPaperDetailsModal = false;
  let selectedPaperDetails = null;

  // Add these state variables
  let showDeleteModal = false;
  let deleteConfirmText = "";
  let examToDelete = null;
  let successMessage = "";

  // New state variable for exam summary modal
  let showExamSummaryModal = false;

  // Updated headers to match the new API response
  const headers = [
    { key: "exam_code", label: "Exam Code" },
    { key: "exam_name", label: "Exam Title" },
    { key: "subject", label: "Class & Subject" },
    /*  { key: 'standard', label: 'Class' },
    { key: 'medium', label: 'Medium' },
    { key: 'created_at', label: 'Created At' },*/
    { key: "status", label: "Status" },
    { key: "number_of_sets", label: "Sets & Versions" },
    /*  { key: 'number_of_versions', label: 'Versions' },
    { key: 'total_questions', label: 'Questions' },*/
    { key: "exam_type", label: "Type" },
    /*    { key: 'exam_mode', label: 'Mode' },*/
    { key: "actions", label: "Actions" },
  ];

  // Updated state variables to work with new API
  let loading = false;
  let exams = [];
  let errorMessage = "";
  let isAdmin = false;
  let showViewModal = false;
  let selectedPaper = null;
  let selectedFormat = "json";
  let hideAnswers = false;

  // API pagination state
  let totalResults = 0;
  let totalPages = 0;
  let hasSearched = false;

  // Function to submit selected status
  async function submitSelectedStatus(e) {
    if (e) e.preventDefault();
    statusError = null;
    errorMessage = "";

    if (!selectedStatus) {
      statusError = "Please select a status first.";
      return;
    }

    hasSearched = true;
    currentPage = 1;
    await updateStatusInUrl(selectedStatus.value);
  }

  // Function to create nested structure for display
  function createNestedStructure(chaptersTopics) {
    const result = [];
    const chapterMap = new Map();

    // First, collect all chapters
    chaptersTopics.forEach((group) => {
      if (group.type === "chapter") {
        group.codes.forEach((chapter) => {
          if (!chapterMap.has(chapter.code)) {
            chapterMap.set(chapter.code, {
              chapter: chapter,
              topics: [],
            });
          }
        });
      }
    });

    chaptersTopics.forEach((group) => {
      if (group.type === "topic") {
        group.codes.forEach((topic) => {
          const chapterCode = topic.chapter_details?.code;
          if (chapterCode && chapterMap.has(chapterCode)) {
            chapterMap.get(chapterCode).topics.push(topic);
          } else {
            // If chapter doesn't exist in the chapters list, create a placeholder
            if (chapterCode && !chapterMap.has(chapterCode)) {
              chapterMap.set(chapterCode, {
                chapter: {
                  code: chapterCode,
                  name: topic.chapter_details?.name || "Unknown Chapter",
                },
                topics: [topic],
              });
            }
          }
        });
      }
    });

    // Convert map to array and sort by chapter code
    return Array.from(chapterMap.values()).sort((a, b) =>
      a.chapter.code.localeCompare(b.chapter.code),
    );
  }

  // Updated search function using the new API
  async function searchPapers() {
    if (!hasSelectedStatus || !selectedStatus) {
      errorMessage = "Please select a status first.";
      return;
    }

    loading = true;
    errorMessage = "";
    successMessage = "";

    try {
      // Prepare query parameters
      const queryParams = {
        status: selectedStatus.value,
        page: currentPage,
        limit: itemsPerPage,
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

      const queryString = new URLSearchParams(queryParams).toString();
      const res = await apiClient({
        url: `/apis/exams?${queryString}`,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP error! status: ${res.status}`,
        );
      }

      const responseData = await res.json();
      // Update state with response data
      exams = (responseData.exams || []).map((item) => ({
        ...item,
        created_at: formatDate(item.created_at),
      }));
      totalResults = responseData.total || 0;
      totalPages = Math.ceil(totalResults / itemsPerPage);
    } catch (err) {
      console.error("Error in searchPapers:", err);
      errorMessage =
        err.message || "An unexpected error occurred during search.";
      exams = [];
      totalResults = 0;
      totalPages = 0;
    } finally {
      loading = false;
    }
  }

  let mediumOptions = [];
  let subjectOptions = [];
  let classOptions = Array.from({ length: 12 }, (_, i) => ({
    id: (i + 1).toString(),
    name: (i + 1).toString(),
  }));

  let selectedSubjectId = "";
  let selectedMediumId = "";
  let selectedClassId = "";

  async function fetchMediums() {
    try {
      const res = await apiClient({ url: "/apis/mediums" });
      if (res.ok) {
        const responseData = await res.json();
        const data = responseData.data || [];
        mediumOptions = data.map((item) => ({
          id: item.medium_code,
          name: item.medium_name,
        }));
      }
    } catch (err) {
      console.error("Failed to fetch mediums:", err);
    }
  }

  async function fetchSubjects() {
    try {
      const res = await apiClient({ url: "/apis/subjects" });
      if (res.ok) {
        const responseData = await res.json();
        const data = responseData.data || [];
        subjectOptions = data.map((item) => ({
          id: item.subject_code,
          name: item.subject_name,
        }));
      }
    } catch (err) {
      console.error("Failed to fetch subjects:", err);
    }
  }

  // Subscribe to auth store to check admin status
  onMount(async () => {
    const unsubscribe = authStore.subscribe((value) => {
      isAdmin = value?.roleCode === "100";
    });

    fetchMediums();
    fetchSubjects();

    return unsubscribe;
  });

  // Clear all filters
  function clearAllFilters() {
    searchFilters = {
      exam_name: "",
      subject: "",
      medium: "",
      standard: "",
      start_date: "",
      end_date: "",
    };

    // const params = new URLSearchParams($page.url.searchParams);
    // params.set("page", "1");
    // goto(`${$page.url.pathname}?${params.toString()}`, { replaceState: true });
  }

  function toggleAdvancedSearch() {
    showAdvancedSearch = !showAdvancedSearch;
  }
  // Reset everything (including status)
  function resetAll() {
    selectedStatus = null;
    hasSelectedStatus = false;
    hasSearched = false;
    searchFilters = {
      exam_name: "",
      subject: "",
      medium: "",
      standard: "",
      start_date: "",
      end_date: "",
    };
    currentPage = 1;
    exams = [];
    totalResults = 0;
    totalPages = 0;
    errorMessage = "";
    successMessage = "";
    statusError = null;

    // Clear URL query parameters
    goto($page.url.pathname, { replaceState: true });
  }

  // Pagination functions
  async function goToPage(pageNumber) {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      currentPage = pageNumber;
      const params = new URLSearchParams($page.url.searchParams);
      params.set("page", pageNumber.toString());
      await goto(`${$page.url.pathname}?${params.toString()}`, {
        replaceState: true,
        noScroll: true,
      });
    }
  }

  function handleEdit(paperId) {
    if (paperId) {
      goto(`/questionPapers/new/${paperId}/edit?step=1`);
    }
  }

  const actionConfigObject = [
    {
      actionName: "view",
      label: "View",
    },
    {
      actionName: "delete",
      label: "Delete",
      isHidden: (data) => !isAdmin,
    },
    {
      actionName: "edit",
      label: "Edit",
      isHidden: (data) => data.status !== "draft",
    },
  ];

  const customRenderers = {
    exam_code: (data) => ({
      component: ExamCodeCell,
      props: {
        data: data,
        onClick: (d) => handlePaperSummary(d.exam_code),
      },
    }),
    exam_name: (data) => ({
      component: ExamLinkCell,
      props: {
        data: data,
        onClick: handleViewPaper,
      },
    }),
    subject: (data) =>
      `<span class="text-sm text-gray-600">${data.subject || "N/A"}, ${data.standard || ""}, ${data.medium || ""}</span>`,
    status: (data) =>
      `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyling(data.status)}">${formatStatus(data.status)}</span>`,
    number_of_sets: (data) => `
      <div class="text-sm text-gray-600">Sets - ${data.number_of_sets || 1}</div>
      <div class="text-sm text-gray-600">Versions - ${data.number_of_versions || 1}</div>
    `,
  };

  function handleTableAction(event) {
    const { actionName, actionData } = event.detail;
    if (actionName === "view") {
      handleViewPaper(actionData);
    } else if (actionName === "delete") {
      handleDelete(actionData);
    } else if (actionName === "edit") {
      handleEdit(actionData.exam_code);
    }
  }

  function toggleSort(field) {
    if (sortField === field) {
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      sortField = field;
      sortDirection = "asc";
    }
    // Re-sort current results
    sortExams();
  }

  function sortExams() {
    exams = exams.sort((a, b) => {
      let comparison = 0;
      const aValue = a[sortField] || "";
      const bValue = b[sortField] || "";

      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;
      return sortDirection === "desc" ? -comparison : comparison;
    });
  }

  function getColumnWidth(key) {
    const widths = {
      exam_code: "8%",
      exam_name: "25%", // Increased width to prevent overlap
      subject: "12%",
      /*    'standard': '6%',
      'medium': '8%',*/
      created_at: "10%",
      status: "8%",
      number_of_sets: "10%",
      /*  'number_of_versions': '6%',
      'total_questions': '6%',*/
      exam_type: "6%",
      exam_mode: "6%",
      actions: "12%", // Increased width for actions to ensure visibility
    };
    return widths[key] || "auto";
  }

  let examPapers = [];

  // Updated handleViewPaper function
  async function handleViewPaper(paper) {
    selectedPaper = paper;
    showViewModal = true;
    detailsLoading = true;
    errorMessage = "";
    examSummaryData = null;

    try {
      const res = await apiClient({
        url: `/apis/exams/${paper.exam_code}`,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP error! status: ${res.status}`,
        );
      }

      const responseData = await res.json();
      if (responseData?.design) {
        examSummaryData = responseData.design;
      } else {
        throw new Error("No exam design data found");
      }
    } catch (error) {
      errorMessage = error.message || "Failed to fetch exam design.";
      examSummaryData = null;
    } finally {
      detailsLoading = false;
    }
  }

  // fetch paper summary by giving the exam code
  let examSummaryData = null;
  let summaryLoading = false;

  async function handlePaperSummary(examCode) {
    try {
      showExamSummaryModal = true;
      examSummaryData = null;
      summaryLoading = true;
      const res = await apiClient({
        url: `/apis/exams/${examCode}`,
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP error! status: ${res.status}`,
        );
      }
      const responseData = await res.json();
      if (responseData?.design) {
        examSummaryData = responseData.design;
      } else {
        throw new Error("No exam design data found");
      }
    } catch (error) {
      console.error(error);
      errorMessage = error.message || "Failed to fetch exam design";
      showExamSummaryModal = false;
    } finally {
      summaryLoading = false;
    }
  }

  async function fetchAllPaperDetails() {
    detailsLoading = true;
    try {
      const results = await Promise.all(
        examPapers.map(async (paperId) => {
          const queryParams = new URLSearchParams({
            paper_id: paperId,
          });
          if (selectedFormat === "pdf") {
            queryParams.set("format", "pdf");
          }
          if (hideAnswers) {
            queryParams.set("questions_only", "true");
          }
          const res = await apiClient({
            url: `/apis/qn_papers/${paperId}?${queryParams.toString()}`,
            options: {
              headers: {
                Accept:
                  selectedFormat === "pdf"
                    ? "application/pdf"
                    : "application/json",
              },
            },
          });

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(
              errorData.detail || `HTTP error! status: ${res.status}`,
            );
          }
          return await res.json();
        }),
      );
      paperDetailsList = results;
    } catch (error) {
      errorMessage = error.message || "Failed to fetch paper details";
      paperDetailsList = [];
    } finally {
      detailsLoading = false;
    }
  }

  async function handlePaperView(event) {
    const { paperId, format, questionsOnly } = event.detail;

    try {
      const queryParams = new URLSearchParams({
        paper_id: paperId,
      });
      if (format === "pdf") {
        queryParams.set("format", "pdf");
      }
      if (questionsOnly) {
        queryParams.set("questions_only", "true");
      }
      const res = await apiClient({
        url: `/apis/qn_papers/${paperId}?${queryParams.toString()}`,
        options: {
          headers: {
            Accept: format === "pdf" ? "application/pdf" : "application/json",
          },
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP error! status: ${res.status}`,
        );
      }

      if (format === "pdf") {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `paper_${paperId}${questionsOnly ? "_questions_only" : ""}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        selectedPaperDetails = await res.json();
      }
    } catch (error) {
      errorMessage = error.message || "Failed to fetch paper details";
    }
  }

  function handleDelete(paper) {
    examToDelete = paper;
    showDeleteModal = true;
  }

  function handleDeleteSuccess(event) {
    const { message } = event.detail;
    successMessage = message;
    errorMessage = "";
    showDeleteModal = false;
    examToDelete = null;

    // Refresh the search results
    searchPapers();

    setTimeout(() => {
      successMessage = "";
    }, 5000);
  }

  // Helper function to format date
  function formatDate(dateString) {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString();
    } catch (error) {
      return "Invalid Date";
    }
  }

  // Reset to first page when filters change
  function handleFilterChange() {
    currentPage = 1;
  }

  // Helper function to format status display
  function formatStatus(status) {
    const statusMap = {
      draft: "Draft",
      closed: "Released", // Alternative name for closed
    };
    return statusMap[status] || status;
  }

  // Helper function to get status styling
  function getStatusStyling(status) {
    const stylingMap = {
      draft: "bg-yellow-100 text-yellow-800",
      closed: "bg-green-100 text-green-800",
    };
    return stylingMap[status] || "bg-gray-100 text-gray-800";
  }
</script>

<div class="w-full py-4">
  <!-- Step 1: Status Selection -->
  <div class="bg-white rounded-lg border border-stroke p-6 mb-8">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-lg font-semibold text-dark">Search Question Papers</h2>
        <p class="text-sm text-gray-600">
          Select a status to view and manage your question papers
        </p>
      </div>
      <!-- <div class="hidden sm:block">
        <div class="flex items-center space-x-2 text-sm text-gray-500">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Paper Management</span>
        </div>
      </div> -->
    </div>

    <div class="flex flex-col sm:flex-row sm:items-end gap-4">
      <div class="flex-1 max-w-xs">
        <DropDownSelector
          title="Paper Status"
          options={statusOptions}
          selectedItemName={selectedStatus?.name || ""}
          on:handleDispatchFilterData={handleStatusSelection}
          on:handleCancelSelection={handleStatusCancel}
          placeholder="Choose paper status..."
        />
      </div>

      <div class="flex gap-2">
        <Button
          type="button"
          on:click={submitSelectedStatus}
          disabled={loading || selectedStatus === null}
          btnType="primary"
        >
          {#if loading}
            <div class="flex items-center">
              <svg
                class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Loading...
            </div>
          {:else}
            <div class="flex items-center">
              <svg
                class="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              Search Papers
            </div>
          {/if}
        </Button>

        {#if hasSelectedStatus}
          <Button type="button" btnType="tertiary" on:click={resetAll}>
            Reset All
          </Button>
          <Button
            type="button"
            btnType="tertiary"
            on:click={toggleAdvancedSearch}
          >
            {#if showAdvancedSearch}
              Hide Advanced Search
            {:else}
              Show Advanced Search
            {/if}
          </Button>
        {/if}
      </div>
    </div>

    {#if statusError}
      <div class="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg
              class="h-5 w-5 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
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
    <div class="bg-white rounded-lg border border-stroke p-6 mb-8">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-lg font-semibold text-dark">Advanced Search</h3>
          <p class="text-sm text-subtext">
            Refine your search with additional filters for {formatStatus(
              selectedStatus?.value,
            ).toLowerCase()} papers
          </p>
        </div>
        <div class="flex items-center space-x-2 text-sm text-subtext">
          <span
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
          >
            {formatStatus(selectedStatus?.value)} Papers
          </span>
        </div>
      </div>

      <!-- Search Filters -->
      <div class="bg-white py-6 border-t border-t-stroke">
        <!-- <div class="flex items-center mb-4">
          <svg
            class="w-5 h-5 text-gray-400 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z"
            />
          </svg>
          <h4 class="text-sm font-medium text-dark">Search Filters</h4>
        </div> -->

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <!-- Exam Name -->
          <Input
            type="text"
            label="Exam Name"
            placeholder="Search exam name..."
            bind:value={searchFilters.exam_name}
            on:handleInputData={handleFilterChange}
          />

          <!-- Subject -->
          <div class="relative">
            <SearchableComboBox
              options={subjectOptions}
              label="Subject"
              placeholder="Search subject..."
              bind:selectedItemName={searchFilters.subject}
              bind:selectedItemId={selectedSubjectId}
              on:handleDispatchComboBoxData={handleFilterChange}
              on:handleDispatchFilterData={handleFilterChange}
            />
          </div>

          <!-- Medium -->
          <div class="relative">
            <SearchableComboBox
              options={mediumOptions}
              label="Medium"
              placeholder="Search medium..."
              bind:selectedItemName={searchFilters.medium}
              bind:selectedItemId={selectedMediumId}
              on:handleDispatchComboBoxData={handleFilterChange}
              on:handleDispatchFilterData={handleFilterChange}
            />
          </div>

          <!-- Standard/Class -->
          <div class="relative">
            <SearchableComboBox
              options={classOptions}
              label="Standard/Class"
              placeholder="Search class..."
              bind:selectedItemName={searchFilters.standard}
              bind:selectedItemId={selectedClassId}
              on:handleDispatchComboBoxData={handleFilterChange}
              on:handleDispatchFilterData={handleFilterChange}
            />
          </div>

          <!-- Start Date -->
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-2"
              >Start Date</label
            >
            <input
              type="date"
              bind:value={searchFilters.start_date}
              on:change={handleFilterChange}
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <!-- End Date -->
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-2"
              >End Date</label
            >
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
          <Button type="button" btnType="tertiary" on:click={clearAllFilters}>
            <div class="flex items-center justify-center">
              <svg
                class="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Clear Filters
            </div>
          </Button>
          <Button type="button" disabled={loading} on:click={searchPapers}>
            {#if loading}
              <div class="flex items-center justify-center">
                <svg
                  class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Searching...
              </div>
            {:else}
              <div class="flex items-center justify-center">
                <svg
                  class="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                Search
              </div>
            {/if}
          </Button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Step 3: Results Section (Only shown after search) -->
  {#if hasSearched}
    <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <!-- Header Section -->
      <div
        class="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200"
      >
        <div
          class="flex flex-col sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h3 class="text-base font-semibold text-dark">
              Search Results ({formatStatus(selectedStatus?.value)} Papers)
            </h3>
            <p class="text-sm text-gray-600 mt-1">
              Found {totalResults}
              {totalResults === 1 ? "paper" : "papers"}
            </p>
          </div>
          <div class="mt-3 sm:mt-0">
            <span
              class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            >
              Page {currentPage} of {totalPages}
            </span>
          </div>
        </div>
      </div>

      <!-- Content Area -->
      <div>
        <!-- Success and Error Messages -->
        {#if errorMessage}
          <div class="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg
                  class="h-5 w-5 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
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
                <svg
                  class="h-5 w-5 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
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
          <SpinnerWithText
            size="md"
            variant="primary"
            message="Searching papers..."
          />
        {:else if exams.length === 0}
          <div class="flex flex-col items-center justify-center w-full py-12">
            <!-- <svg
              class="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg> -->
            <Newspaper class="h-12 w-12 text-gray-400" />
            <h3 class="mt-2 text-sm font-medium text-dark">No papers found</h3>
            <p class="mt-1 text-sm text-gray-500">
              No papers match your search criteria. Try adjusting your filters.
            </p>
          </div>
        {:else}
          <DataTable
            tableHeadersDisplay={[
              // { key: "exam_code", name: "Exam Code", width: "15%" },
              { key: "exam_name", name: "Exam Title", width: "25%" },
              { key: "subject", name: "Class & Subject", width: "20%" },
              { key: "status", name: "Status", width: "15%" },
              { key: "number_of_sets", name: "Sets & Versions", width: "15%" },
              { key: "created_at", name: "Created at", width: "15%" },
              { key: "created_by", name: "Created by", width: "15%" },
            ]}
            tableData={exams}
            showPagination={false}
            serverSidePagination={true}
            apiCurrentPage={currentPage}
            apiTotalItems={totalResults}
            apiPageSize={itemsPerPage}
            {actionConfigObject}
            {customRenderers}
            on:tableActionClick={handleTableAction}
          />

          <!-- Enhanced Pagination Controls -->
          {#if totalPages > 1}
            <TablePagination
              {currentPage}
              {totalPages}
              {totalResults}
              on:pageChange={(e) => goToPage(e.detail)}
            />
          {/if}
        {/if}
      </div>
    </div>
  {/if}
</div>

<!-- All existing modals remain the same -->
{#if showViewModal}
  <PortalModal>
    <ExamDesignSummaryModal
      {examSummaryData}
      on:close={() => {
        showViewModal = false;
        examSummaryData = null;
      }}
      on:downloadPaper={handlePaperView}
    />
  </PortalModal>
{/if}

{#if showPaperDetailsModal}
  <Modal on:close={() => (showPaperDetailsModal = false)}>
    <div class="space-y-4">
      <h2 class="text-xl font-semibold">Paper Details</h2>

      <div class="bg-gray-50 p-4 rounded-lg overflow-x-auto">
        <pre class="text-sm whitespace-pre-wrap">{JSON.stringify(
            selectedPaperDetails,
            null,
            2,
          )}</pre>
      </div>

      <div class="flex justify-end mt-6">
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          on:click={() => (showPaperDetailsModal = false)}
        >
          Close
        </button>
      </div>
    </div>
  </Modal>
{/if}

{#if showDeleteModal}
  <DeletionModal
    item={examToDelete}
    itemType="question paper"
    confirmText="confirm"
    deletionUrl={`/apis/exams/${examToDelete?.exam_code}`}
    details={[
      { label: "Name", value: examToDelete?.exam_name },
      { label: "Code", value: examToDelete?.exam_code },
      { label: "Status", value: examToDelete?.status },
      { label: "Subject", value: examToDelete?.subject },
    ]}
    on:cancel={() => {
      showDeleteModal = false;
      examToDelete = null;
    }}
    on:success={handleDeleteSuccess}
  />
{/if}

{#if showExamSummaryModal}
  <PortalModal>
    <ExamDesignSummaryModal
      {examSummaryData}
      on:close={() => {
        showExamSummaryModal = false;
        examSummaryData = null;
      }}
      on:downloadPaper={handlePaperView}
    />
  </PortalModal>
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
