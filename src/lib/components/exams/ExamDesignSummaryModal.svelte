<script>
  import { createEventDispatcher } from "svelte";
  import Pill from "$lib/components/Pill.svelte";
  const dispatch = createEventDispatcher();

  export let examSummaryData = null;

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
  function handleDownloadPaper(paperId) {
    dispatch("downloadPaper", {
      paperId,
      format: "pdf",
      questionsOnly: false,
    });
  }
</script>

<div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh]">
  <!-- Modal Header -->
  <div
    class="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200 rounded-t-lg"
  >
    <div class="flex items-center justify-between">
      <div class="flex items-center">
        <svg
          class="w-6 h-6 text-primary mr-3"
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
        on:click={() => dispatch("close")}
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
      <!-- Exam Details Layout (Consistent with Question Paper Edit Step 2) -->
      <div class="space-y-2">
        <!-- Header -->
        <div class="flex w-full justify-between">
          <h3
            class="text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            Basic Details
          </h3>
          <div class="flex gap-2">
            <Pill size="sm">
              {examSummaryData.exam_mode} mode
            </Pill>
            <!-- <Pill size="sm">
              {examSummaryData.exam_type}
            </Pill> -->
            <Pill
              size="sm"
              variant={examSummaryData.status === "draft"
                ? "warning"
                : "success"}
            >
              {formatStatus(examSummaryData.status)}
            </Pill>
            <Pill size="sm">
              {examSummaryData.total_questions} Questions
            </Pill>
          </div>
        </div>
        <div class="flex items-center justify-between pb-2">
          <!-- <h2 class="text-lg font-semibold text-gray-900">Exam Details</h2> -->
          <div class="flex flex-col">
            <span class="text-xs text-gray-500">Exam Title</span>
            <span class="text-sm font-medium text-dark"
              >{examSummaryData.exam_name}</span
            >
          </div>
        </div>

        <!-- Content Grid -->
        <div class="space-y-6">
          <!-- Basic Details -->
          <div class="grid grid-cols-3 gap-4">
            <!-- <div class="flex gap-2 w-full text-sm text-dark">
              <span class="">Class {examSummaryData.standard}</span>
              <span>*</span>
              <span>{examSummaryData.medium} Medium</span>
              <span>*</span>
              <span> {examSummaryData.subject} Subject</span>
            </div> -->
            <div class="flex flex-col">
              <span class="text-xs text-gray-500">Class</span>
              <span class="text-sm font-medium text-dark"
                >{examSummaryData.standard}</span
              >
            </div>
            <div class="flex flex-col">
              <span class="text-xs text-gray-500">Medium</span>
              <span class="text-sm font-medium text-dark"
                >{examSummaryData.medium}</span
              >
            </div>
            <div class="flex flex-col">
              <span class="text-xs text-gray-500">Subject</span>
              <span class="text-sm font-medium text-dark"
                >{examSummaryData.subject}</span
              >
            </div>
          </div>

          <!-- Paper Configuration -->
          <div class="space-y-2">
            <h3
              class="text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Paper Details
            </h3>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div
                class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div class="flex flex-col">
                  <span class="text-xs text-gray-500">Duration (mins)</span>
                  <span class="text-sm font-semibold text-gray-900"
                    >{examSummaryData.total_time}</span
                  >
                </div>
              </div>

              <div
                class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div class="flex flex-col">
                  <span class="text-xs text-gray-500">Number of Sets</span>
                  <span class="text-sm font-semibold text-gray-900"
                    >{examSummaryData.number_of_sets}</span
                  >
                </div>
              </div>
              <div
                class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div class="flex flex-col">
                  <span class="text-xs text-gray-500">Versions per Set</span>
                  <span class="text-sm font-semibold text-gray-900"
                    >{examSummaryData.number_of_versions}</span
                  >
                </div>
              </div>
              <!-- <div
                class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div class="flex flex-col">
                  <span class="text-xs text-gray-500">Exam Type</span>
                  <span class="text-sm font-semibold text-gray-900"
                    >{examSummaryData.exam_type}</span
                  >
                </div>
              </div> -->
            </div>
          </div>

          <!-- Generated Papers Section -->
          {#if examSummaryData.papers && examSummaryData.papers.length > 0}
            <div class="space-y-2 pt-4 border-t border-gray-100">
              <div class="flex justify-between w-full">
                <h3
                  class="text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Generated Papers ({examSummaryData.papers.length})
                </h3>
                <!-- <span class="text-xs font-medium text-gray-500">
                  Total papers generated: <span
                    class="text-sm font-semibold text-gray-900"
                    >{examSummaryData.number_of_sets *
                      examSummaryData.number_of_versions} paper(s)</span
                  >
                </span> -->
              </div>
              <div class="">
                <div
                  class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2"
                >
                  {#each examSummaryData.papers as paper, index}
                    <div
                      class="bg-white rounded-md p-2 border border-gray-200 flex items-center justify-between border border-stroke"
                    >
                      <span class="text-xs font-medium text-gray-700"
                        >{paper}</span
                      >
                      <button
                        type="button"
                        aria-label="Download paper"
                        class="text-primary hover:text-blue-700 p-1 rounded hover:bg-gray-100 transition-colors duration-150"
                        on:click={() => handleDownloadPaper(paper)}
                        title="Download PDF"
                      >
                        <svg
                          class="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
                      </button>
                    </div>
                  {/each}
                </div>
              </div>
            </div>
          {/if}
        </div>
      </div>

      {#if examSummaryData.chapters_topics && examSummaryData.chapters_topics.length > 0}
        <!-- Content Selection -->
        <div class="mb-6 mt-4">
          <h3
            class="text-xs font-medium text-gray-500 uppercase tracking-wider flex gap-2 mb-2"
          >
            <!-- <svg
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
            </svg> -->
            Selected Content
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
                      Chapters & Topics
                    </th>
                    <!-- <th
                      class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6"
                    >
                    </th> -->
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
                            class="w-4 h-4 text-primary mr-2 flex-shrink-0"
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
                      <!-- <td class="px-4 py-3">
                        <span
                          class="inline-flex items-center px-2 py-1 text-xs font-mono bg-blue-100 text-blue-800 rounded"
                        >
                          {item.chapter.code}
                        </span>
                      </td> -->
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
                        <!-- <td class="px-4 py-2">
                          <span
                            class="inline-flex items-center px-2 py-1 text-xs font-mono bg-green-100 text-green-800 rounded"
                          >
                            {topic.code}
                          </span>
                        </td> -->
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
          class="animate-spin mx-auto h-8 w-8 text-primary"
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
    class="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end rounded-b-lg"
  >
    <button
      type="button"
      class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-150"
      on:click={() => dispatch("close")}
    >
      Close
    </button>
  </div>
</div>
