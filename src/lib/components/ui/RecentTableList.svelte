<script>
  import { apiClient } from "$lib/utils/api.js";
  import { onMount, createEventDispatcher } from "svelte";
  import Modal from "$lib/components/Modal.svelte";
  import DataTable from "$lib/components/DataTable.svelte";
  import { goto } from "$app/navigation";
  import ExamLinkCell from "$lib/components/ui/ExamLinkCell.svelte";
  import ExamCodeCell from "$lib/components/ui/ExamCodeCell.svelte";
  import ExamPapersModal from "$lib/components/exams/ExamSummaryModal.svelte";
  import ExamDesignSummaryModal from "$lib/components/exams/ExamDesignSummaryModal.svelte";
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
        url: "/apis/exams?status=closed&limit=10",
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
        url: `/apis/exams/${examCode}`,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`,
        );
      }

      const data = await response.json();
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

    try {
      // Include paper_id in query params as required by backend
      const queryParams = new URLSearchParams({
        paper_id: paperId,
      });

      if (format === "pdf") {
        queryParams.set("format", "pdf");
      }

      if (questionsOnly) {
        queryParams.set("questions_only", "true");
      }

      const url = `/apis/qn_papers/${paperId}?${queryParams.toString()}`;

      const response = await apiClient({
        url,
        options: {
          headers: {
            Accept: format === "pdf" ? "application/pdf" : "application/json",
          },
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`,
        );
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
                  class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150 w-full justify-center"
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
      <ExamDesignSummaryModal
        {examSummaryData}
        on:close={() => (showExamSummaryModal = false)}
        on:downloadPaper={handlePaperView}
      />
    </PortalBackdrop>
  </Portal>
{/if}
