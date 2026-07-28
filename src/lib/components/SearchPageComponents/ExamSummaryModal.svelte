<script>
  import { createEventDispatcher } from "svelte";

  export let show = false;
  export let examData = null;
  export let loading = false;

  const dispatch = createEventDispatcher();

  function close() {
    dispatch("close");
  }
</script>

{#if show}
  <div
    class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4"
  >
    <div
      class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
    >
      <!-- Modal Header -->
      <div
        class="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200"
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
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
            on:click={close}
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

      <!-- Modal Content -->
      <div class="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
        {#if loading}
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
        {:else if examData}
          <!-- Exam Basic Information -->
          <div class="mb-6">
            <h3
              class="text-lg font-medium text-gray-900 mb-4 flex items-center"
            >
              <svg
                class="w-5 h-5 text-primary mr-2"
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
                    >{examData.exam_name}</span
                  >
                </div>
              </div>
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="flex justify-between items-center">
                  <span class="text-sm font-medium text-gray-500"
                    >Exam Code</span
                  >
                  <span class="text-sm font-semibold text-primary"
                    >{examData.exam_code}</span
                  >
                </div>
              </div>
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="flex justify-between items-center">
                  <span class="text-sm font-medium text-gray-500">Subject</span>
                  <span class="text-sm font-semibold text-gray-900"
                    >{examData.subject}</span
                  >
                </div>
              </div>
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="flex justify-between items-center">
                  <span class="text-sm font-medium text-gray-500"
                    >Standard/Class</span
                  >
                  <span class="text-sm font-semibold text-gray-900"
                    >{examData.standard}</span
                  >
                </div>
              </div>
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="flex justify-between items-center">
                  <span class="text-sm font-medium text-gray-500">Medium</span>
                  <span class="text-sm font-semibold text-gray-900"
                    >{examData.medium}</span
                  >
                </div>
              </div>
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="flex justify-between items-center">
                  <span class="text-sm font-medium text-gray-500">Status</span>
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {examData.status ===
                    'closed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'}"
                  >
                    {examData.status}
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
                  <div class="text-2xl font-bold text-primary">
                    {examData.exam_type}
                  </div>
                  <div class="text-sm text-primary font-medium">Exam Type</div>
                </div>
              </div>
              <div class="bg-green-50 rounded-lg p-4 border border-green-200">
                <div class="text-center">
                  <div class="text-2xl font-bold text-green-600 capitalize">
                    {examData.exam_mode}
                  </div>
                  <div class="text-sm text-green-600 font-medium">
                    Exam Mode
                  </div>
                </div>
              </div>
              <div class="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div class="text-center">
                  <div class="text-2xl font-bold text-purple-600">
                    {examData.total_questions}
                  </div>
                  <div class="text-sm text-purple-600 font-medium">
                    Total Questions
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Generated Papers -->
          {#if examData.papers && examData.papers.length > 0}
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
                Generated Papers ({examData.papers.length})
              </h3>
              <div class="bg-gray-50 rounded-lg p-4">
                <div
                  class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"
                >
                  {#each examData.papers as paper, index}
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
                        <span class="text-xs text-gray-500">#{index + 1}</span>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            </div>
          {/if}
        {/if}
      </div>

      <!-- Modal Footer -->
      <div
        class="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end"
      >
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-150"
          on:click={close}
        >
          Close
        </button>
      </div>
    </div>
  </div>
{/if}
