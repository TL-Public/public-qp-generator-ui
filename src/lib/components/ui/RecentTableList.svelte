<script>
  import { apiClient } from "$lib/utils/api.js";
  import { onMount, createEventDispatcher } from "svelte";
  import Modal from "$lib/components/Modal.svelte";
  import DataTable from "$lib/components/DataTable.svelte";
  import { goto } from "$app/navigation";
  import ExamLinkCell from "$lib/components/ui/ExamLinkCell.svelte";
  import ExamCodeCell from "$lib/components/ui/ExamCodeCell.svelte";
  import ExamPapersModal from "$lib/components/exams/ExamSummaryModal.svelte";
  import Portal from "$lib/components/Portal.svelte";
  import PortalBackdrop from "$lib/components/PortalBackdrop.svelte";

  const dispatch = createEventDispatcher();

  let exams = [];
  let isLoading = true;
  let showViewModal = false;
  let selectedPaper = null;
  let viewError = null;

  // Add these variables to match search page pattern
  let examPapers = [];
  let detailsLoading = false;
  let selectedPaperDetails = null;
  let errorMessage = "";
  let showExamSummaryModal = false;
  let examSummaryData = null;
  let summaryLoading = false;

  // DataTable configuration
  const tableHeadersDisplay = [
    // { key: 'exam_code', name: 'Code', width: 12 },
    { key: "exam_name", name: "Exam Title", width: 38 },
    { key: "subject_display", name: "Class & Subject", width: 22 },
    { key: "status", name: "Status", width: 10 },
    { key: "created_at_display", name: "Created On", width: 18 },
  ];

  const actionConfigObject = [
    {
      actionName: "view",
      label: "View Papers",
      isHidden: (data) => data.status === "draft",
    },
    {
      actionName: "edit",
      label: "Edit",
      isHidden: (data) => data.status !== "draft",
    },
    {
      actionName: "summary",
      label: "Summary",
    },
  ];

  $: tableData = exams.map((exam) => ({
    ...exam,
    subject_display:
      `${exam.subject || ""} ${exam.standard || ""} ${exam.medium || ""}`.trim() ||
      "N/A",
    created_at_display: formatDate(exam.created_at),
  }));

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
    status: (data) =>
      `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyling(data.status)}">${formatStatus(data.status)}</span>`,
  };

  function handleTableAction(event) {
    const { actionName, actionData } = event.detail;
    if (actionName === "view") {
      handleViewExam(actionData.exam_code);
    } else if (actionName === "edit") {
      handleEdit(actionData.exam_code);
    } else if (actionName === "summary") {
      handlePaperSummary(actionData.exam_code);
    }
  }

  function handleEdit(examCode) {
    if (examCode) {
      goto(`/questionPapers/${examCode}/edit`);
    }
  }

  onMount(async () => {
    try {
      const response = await apiClient({ 
        url: "/apis/exams?status=closed&limit=20" 
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      exams = data.exams || [];
    } catch (error) {
      console.error("Failed to fetch exams:", error);
      exams = [];
    } finally {
      isLoading = false;
    }
  });

  async function viewExamByCode(examCode) {
    try {
      const response = await apiClient({ 
        url: `/apis/exams/${examCode}` 
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('data from view paper details')
      // Normalization as per api.js
      if (data && data.design && !Array.isArray(data.design.papers)) {
        data.design.papers = [];
      }
      
      return { data, error: null };
    } catch (error) {
      console.error("Failed to fetch api", error);
      return { data: null, error: error.message };
    }
  }

  // Updated handleViewExam to match search page pattern exactly
  async function handleViewExam(examCode) {
    console.log("Viewing exam with code:", examCode);

    // Find the exam object from the current list
    const exam = exams.find((e) => e.exam_code === examCode);
    selectedPaper = exam;
    showViewModal = true;
    detailsLoading = true;
    errorMessage = "";

    try {
      const response = await viewExamByCode(examCode);
      if (response.error) throw new Error(response.error);

      if (response.data?.design?.papers) {
        examPapers = response.data.design.papers;
      } else {
        examPapers = [];
      }
    } catch (error) {
      errorMessage = error.message || "Failed to fetch exam design.";
      examPapers = [];
    } finally {
      detailsLoading = false;
    }
  }

  async function handlePaperSummary(examCode) {
    console.log(examCode);
    try {
      showExamSummaryModal = true;
      examSummaryData = null;
      summaryLoading = true;
      
      const response = await viewExamByCode(examCode);
      
      if (response.error) {
        throw new Error(response.error);
      }
      if (response.data?.design) {
        examSummaryData = response.data.design;
        console.log("the response data design", response.data.design);
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

  // Updated handleViewPaper function
  async function handleViewPaper(paper) {
    selectedPaper = paper;
    showViewModal = true;
    errorMessage = "";
    detailsLoading = true;

    try {
      const response = await viewExamByCode(paper.exam_code);
      
      if (response.error) throw new Error(response.error);

      if (response.data?.design?.papers) {
        examPapers = response.data.design.papers;
      } else {
        examPapers = [];
      }
    } catch (error) {
      errorMessage = error.message || "Failed to fetch exam design.";
      examPapers = [];
    } finally {
      detailsLoading = false;
    }
  }
  // Add handlePaperView function to match search page
  async function handlePaperView(event) {
    const { paperId, format, questionsOnly } = event.detail;
    console.log('paperId, format, questionsOnly', paperId, format, questionsOnly)
    try {
      // Include paper_id in query params as required by backend
      const queryParams = new URLSearchParams({
        paper_id: paperId
      });
      
      if (format === 'pdf') {
        queryParams.set('format', 'pdf');
      }
      
      if (questionsOnly) {
        queryParams.set('questions_only', 'true');
      }

      const url = `/apis/qn_papers/${paperId}?${queryParams.toString()}`;
        
      const response = await apiClient({ 
        url,
        options: {
          headers: {
            "Accept": format === 'pdf' ? "application/pdf" : "application/json"
          }
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      if (format === "pdf") {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `paper_${paperId}${questionsOnly ? "_questions_only" : ""}.pdf`;
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
      } else {
        selectedPaperDetails = await response.json();
      }
    } catch (error) {
      errorMessage = error.message || "Failed to fetch paper details";
    }
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
</script>

<div class=" py-2">
  <h3 class="text-sm font-medium text-gray-900">Recent Exams</h3>
</div>

<!-- Desktop Table View -->
<div class="hidden sm:block">
  <div class="">
    {#if isLoading}
      <div class="flex items-center justify-center py-12 text-sm text-gray-500">
        <div class="flex items-center space-x-2">
          <div
            class="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"
          ></div>
          <span>Loading exams...</span>
        </div>
      </div>
    {:else}
      <DataTable
        {tableHeadersDisplay}
        {tableData}
        {customRenderers}
        {actionConfigObject}
        showPagination={false}
        on:tableActionClick={handleTableAction}
      />
    {/if}
  </div>
</div>

<!-- Mobile Card View -->
<div class="sm:hidden">
  {#if isLoading}
    <div class="px-4 py-8 text-center text-sm text-gray-500">
      <div class="flex items-center justify-center space-x-2">
        <div
          class="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"
        ></div>
        <span>Loading...</span>
      </div>
    </div>
  {:else if exams.length > 0}
    <div class="max-h-96 overflow-y-auto">
      <div class="divide-y divide-gray-200">
        {#each exams as exam (exam.exam_code)}
          <div
            class="px-4 py-4 hover:bg-gray-50 transition-colors duration-150"
          >
            <div class="space-y-3">
              <!-- Exam Code -->
              <div class="flex items-start justify-between">
                <div class="flex-1 min-w-0">
                  <div
                    class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1"
                  >
                    Code
                  </div>
                  <div class="text-sm font-mono text-gray-900">
                    {exam.exam_code || "N/A"}
                  </div>
                </div>
              </div>

              <!-- Exam Title -->
              <div>
                <div
                  class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1"
                >
                  Exam Title
                </div>
                <div class="text-sm text-gray-900 font-medium">
                  {exam.exam_name || "Untitled Exam"}
                </div>
              </div>

              <!-- Action Button -->
              <div class="pt-2">
                <button
                  type="button"
                  class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150 w-full justify-center"
                  on:click={() => handleViewExam(exam.exam_code)}
                >
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
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
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
        <svg
          class="w-6 h-6 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          ></path>
        </svg>
        <span>No exams found</span>
      </div>
    </div>
  {/if}
</div>

<!-- Footer with count -->
{#if !isLoading && tableData.length > 0}
  <div class="px-4 py-2 bg-gray-50 border-t border-gray-200">
    <p class="text-xs text-gray-500 text-center sm:text-left">
      Showing {tableData.length} recent exams
    </p>
  </div>
{/if}

<!-- Modal using exact same pattern as search page -->
{#if showViewModal}
  <Portal>
    <PortalBackdrop>
      <ExamPapersModal
        loading={detailsLoading}
        error={errorMessage}
        papers={examPapers}
        paperDetails={selectedPaperDetails}
        on:close={() => {
          showViewModal = false;
          selectedPaperDetails = null;
        }}
        on:back={() => (selectedPaperDetails = null)}
        on:viewPaper={handlePaperView}
        examTitle={selectedPaper?.exam_name}
        numberOfQuestions={selectedPaper?.total_questions}
        subject={selectedPaper?.subject}
        standard={selectedPaper?.standard}
      />
    </PortalBackdrop>
  </Portal>
{/if}

{#if showExamSummaryModal}
  <Portal>
    <PortalBackdrop>
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh]">
        <!-- Modal Header -->
        <div
          class="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <svg
                class="w-6 h-6 text-blue-600 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <div>
                <h2 class="text-xl font-semibold text-gray-900">
                  Exam Design Summary
                </h2>
                <p class="text-sm text-gray-600 mt-1">
                  Complete exam details and configuration
                </p>
              </div>
            </div>
            <button
              type="button"
              class="text-gray-400 hover:text-gray-600 transition-colors duration-150"
              on:click={() => (showExamSummaryModal = false)}
            >
              <svg
                class="w-6 h-6"
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
            </button>
          </div>
        </div>

        <!-- Exam design summary Modal Content -->
        <div class="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {#if examSummaryData}
            <!-- Exam Basic Information -->
            <div class="mb-6">
              <h3
                class="text-lg font-medium text-gray-900 mb-4 flex items-center"
              >
                <svg
                  class="w-5 h-5 text-blue-600 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Basic Information
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-gray-50 rounded-lg p-4">
                  <div class="flex justify-between items-center">
                    <span class="text-sm font-medium text-gray-500"
                      >Exam Name</span
                    >
                    <span class="text-sm font-semibold text-gray-900"
                      >{examSummaryData.exam_name}</span
                    >
                  </div>
                </div>
                <div class="bg-gray-50 rounded-lg p-4">
                  <div class="flex justify-between items-center">
                    <span class="text-sm font-medium text-gray-500"
                      >Exam Code</span
                    >
                    <span class="text-sm font-semibold text-blue-600"
                      >{examSummaryData.exam_code}</span
                    >
                  </div>
                </div>
                <div class="bg-gray-50 rounded-lg p-4">
                  <div class="flex justify-between items-center">
                    <span class="text-sm font-medium text-gray-500"
                      >Subject</span
                    >
                    <span class="text-sm font-semibold text-gray-900"
                      >{examSummaryData.subject}</span
                    >
                  </div>
                </div>
                <div class="bg-gray-50 rounded-lg p-4">
                  <div class="flex justify-between items-center">
                    <span class="text-sm font-medium text-gray-500"
                      >Standard/Class</span
                    >
                    <span class="text-sm font-semibold text-gray-900"
                      >{examSummaryData.standard}</span
                    >
                  </div>
                </div>
                <div class="bg-gray-50 rounded-lg p-4">
                  <div class="flex justify-between items-center">
                    <span class="text-sm font-medium text-gray-500">Medium</span
                    >
                    <span class="text-sm font-semibold text-gray-900"
                      >{examSummaryData.medium}</span
                    >
                  </div>
                </div>
                <div class="bg-gray-50 rounded-lg p-4">
                  <div class="flex justify-between items-center">
                    <span class="text-sm font-medium text-gray-500">Status</span
                    >
                    <span
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusStyling(
                        examSummaryData.status,
                      )}"
                    >
                      {formatStatus(examSummaryData.status)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Exam Configuration -->
            <div class="mb-6">
              <h3
                class="text-lg font-medium text-gray-900 mb-4 flex items-center"
              >
                <svg
                  class="w-5 h-5 text-green-600 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Exam Configuration
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div class="text-center">
                    <div class="text-2xl font-bold text-blue-600">
                      {examSummaryData.exam_type}
                    </div>
                    <div class="text-sm text-blue-600 font-medium">
                      Exam Type
                    </div>
                  </div>
                </div>
                <div class="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div class="text-center">
                    <div class="text-2xl font-bold text-green-600 capitalize">
                      {examSummaryData.exam_mode}
                    </div>
                    <div class="text-sm text-green-600 font-medium">
                      Exam Mode
                    </div>
                  </div>
                </div>
                <div
                  class="bg-purple-50 rounded-lg p-4 border border-purple-200"
                >
                  <div class="text-center">
                    <div class="text-2xl font-bold text-purple-600">
                      {examSummaryData.total_questions}
                    </div>
                    <div class="text-sm text-purple-600 font-medium">
                      Total Questions
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Paper Structure -->
            <div class="mb-6">
              <h3
                class="text-lg font-medium text-gray-900 mb-4 flex items-center"
              >
                <svg
                  class="w-5 h-5 text-orange-600 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                Paper Structure
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  class="bg-orange-50 rounded-lg p-4 border border-orange-200"
                >
                  <div class="flex items-center justify-between">
                    <div>
                      <div class="text-lg font-semibold text-orange-600">
                        {examSummaryData.number_of_sets}
                      </div>
                      <div class="text-sm text-orange-600">Number of Sets</div>
                    </div>
                    <svg
                      class="w-8 h-8 text-orange-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                  </div>
                </div>
                <div
                  class="bg-indigo-50 rounded-lg p-4 border border-indigo-200"
                >
                  <div class="flex items-center justify-between">
                    <div>
                      <div class="text-lg font-semibold text-indigo-600">
                        {examSummaryData.number_of_versions}
                      </div>
                      <div class="text-sm text-indigo-600">
                        Versions per Set
                      </div>
                    </div>
                    <svg
                      class="w-8 h-8 text-indigo-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2v0a2 2 0 01-2-2V9.5L14 7H8z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <!-- Generated Papers -->
            {#if examSummaryData.papers && examSummaryData.papers.length > 0}
              <div class="mb-6">
                <h3
                  class="text-lg font-medium text-gray-900 mb-4 flex items-center"
                >
                  <svg
                    class="w-5 h-5 text-red-600 mr-2"
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
                  </svg>
                  Generated Papers ({examSummaryData.papers.length})
                </h3>
                <div class="bg-gray-50 rounded-lg p-4">
                  <div
                    class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"
                  >
                    {#each examSummaryData.papers as paper, index}
                      <div
                        class="bg-white rounded-md p-3 border border-gray-200 hover:border-blue-300 transition-colors duration-150"
                      >
                        <div class="flex items-center justify-between">
                          <div class="flex items-center">
                            <div
                              class="w-2 h-2 bg-green-500 rounded-full mr-2"
                            ></div>
                            <span class="text-sm font-medium text-gray-700"
                              >{paper}</span
                            >
                          </div>
                          <span class="text-xs text-gray-500">#{index + 1}</span
                          >
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
                <h3
                  class="text-lg font-medium text-gray-900 mb-4 flex items-center"
                >
                  <svg
                    class="w-5 h-5 text-indigo-600 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                  Content Selection
                </h3>

                <div
                  class="bg-white border border-gray-200 rounded-lg overflow-hidden"
                >
                  <div class="overflow-x-auto">
                    <table class="min-w-full">
                      <thead class="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th
                            class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/3"
                          >
                            Content Structure
                          </th>
                          <th
                            class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6"
                          >
                            Code
                          </th>
                          <th
                            class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6"
                          >
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
                                <svg
                                  class="w-4 h-4 text-blue-600 mr-2 flex-shrink-0"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                  />
                                </svg>
                                <span class="text-sm font-medium text-blue-700"
                                  >{item.chapter.name}</span
                                >
                              </div>
                            </td>
                            <td class="px-4 py-3">
                              <span
                                class="inline-flex items-center px-2 py-1 text-xs font-mono bg-blue-100 text-blue-800 rounded"
                              >
                                {item.chapter.code}
                              </span>
                            </td>
                            <td class="px-4 py-3">
                              <span
                                class="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded border border-blue-200"
                              >
                                Chapter
                              </span>
                            </td>
                          </tr>

                          <!-- Topics under this chapter -->
                          {#each item.topics as topic}
                            <tr class="border-b border-gray-50 bg-gray-25">
                              <td class="px-4 py-2">
                                <div class="flex items-center ml-6">
                                  <svg
                                    class="w-3 h-3 text-green-600 mr-2 flex-shrink-0"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      stroke-linecap="round"
                                      stroke-linejoin="round"
                                      stroke-width="3"
                                      d="M9 5l7 7-7 7"
                                    />
                                  </svg>
                                  <span class="text-sm text-green-700"
                                    >{topic.name}</span
                                  >
                                </div>
                              </td>
                              <td class="px-4 py-2">
                                <span
                                  class="inline-flex items-center px-2 py-1 text-xs font-mono bg-green-100 text-green-800 rounded"
                                >
                                  {topic.code}
                                </span>
                              </td>
                              <td class="px-4 py-2">
                                <span
                                  class="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-50 text-green-700 rounded border border-green-200"
                                >
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
              <svg
                class="animate-spin mx-auto h-8 w-8 text-blue-600"
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
              <p class="text-gray-500 mt-2">Loading exam details...</p>
            </div>
          {/if}
        </div>

        <!-- Modal Footer -->
        <div
          class="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end"
        >
          <button
            type="button"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-150"
            on:click={() => (showExamSummaryModal = false)}
          >
            Close
          </button>
        </div>
      </div>
    </PortalBackdrop>
  </Portal>
{/if}
