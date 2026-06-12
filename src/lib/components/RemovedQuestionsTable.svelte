<script>
  import { createEventDispatcher } from "svelte";
  import { selectedContentStore } from "$lib/stores/selectedContentStore.js";

  const dispatch = createEventDispatcher();

  // Subscribe to removed questions from the store
  let removedQuestions = [];
  selectedContentStore.subscribe((store) => {
    removedQuestions = store.removedQuestions || [];
  });

  // Handle restore question
  function handleRestoreQuestion(questionId) {
    const question = removedQuestions.find((q) => q.id === questionId);
    if (question) {
      // Add back to active questions
      selectedContentStore.restoreQuestion(questionId);

      // Dispatch event to parent components
      dispatch("questionRestored", {
        id: questionId,
        question: question,
        restored: true,
      });
    }
  }

  // Handle permanent delete
  function handlePermanentDelete(questionId) {
    if (
      confirm(
        "Are you sure you want to permanently delete this question? This action cannot be undone.",
      )
    ) {
      selectedContentStore.permanentlyDeleteQuestion(questionId);

      dispatch("questionPermanentlyDeleted", {
        id: questionId,
        deleted: true,
      });
    }
  }

  // Clear all removed questions
  function handleClearAll() {
    if (
      confirm(
        "Are you sure you want to clear all removed questions? This action cannot be undone.",
      )
    ) {
      selectedContentStore.clearRemovedQuestions();

      dispatch("allRemovedQuestionsCleared", {
        cleared: true,
      });
    }
  }

  // Restore all questions
  function handleRestoreAll() {
    if (confirm("Are you sure you want to restore all removed questions?")) {
      selectedContentStore.restoreAllQuestions();

      dispatch("allQuestionsRestored", {
        restored: true,
      });
    }
  }

  // Format question text for display
  function formatQuestionText(text) {
    if (!text) return "No question text available";

    // Remove HTML tags and decode entities
    const cleanText = text.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ");

    // Limit length for display
    if (cleanText.length > 150) {
      return cleanText.substring(0, 150) + "...";
    }
    return cleanText;
  }

  // Get difficulty badge color
  function getDifficultyColor(difficulty) {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "hard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  // Get question type badge color
  function getTypeColor(type) {
    switch (type?.toLowerCase()) {
      case "mcq":
        return "bg-blue-100 text-blue-800";
      case "essay":
        return "bg-purple-100 text-purple-800";
      case "short":
        return "bg-indigo-100 text-indigo-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }
</script>

<div class="bg-white">
  <!-- Header Section -->
  <div class="flex items-center justify-between mb-6">
    {#if removedQuestions.length > 0}
      <div>
        <h3 class="text-base font-medium text-gray-700">Excluded Questions</h3>
        <p class="text-sm text-gray-500">
          {removedQuestions.length} question{removedQuestions.length !== 1
            ? "s"
            : ""} excluded from the paper
        </p>
      </div>

      <div class="flex space-x-2">
        <button
          type="button"
          class="inline-flex items-center px-3 py-2 border border-stroke shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          on:click={handleRestoreAll}
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
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Restore All
        </button>
        <!-- <button
          type="button"
          class="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          on:click={handleClearAll}
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
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Clear All
        </button> -->
      </div>
    {/if}
  </div>

  <!-- Questions Table -->
  {#if removedQuestions.length > 0}
    <div
      class="overflow-hidden border border-stroke ring-opacity-5 md:rounded-lg"
    >
      <table class="min-w-full divide-y divide-gray-300">
        <thead class="bg-gray-50">
          <tr>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Question
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Type
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Difficulty
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Marks
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Parent
            </th>
            <th scope="col" class="relative px-6 py-3">
              <span class="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {#each removedQuestions as question, index (question.id)}
            <tr class="hover:bg-gray-50">
              <!-- Question Text -->
              <td class="px-6 py-4">
                <div class="max-w-md">
                  <p class="text-sm text-gray-900 font-medium">
                    Question {index + 1}
                  </p>
                  <p class="text-sm text-gray-600 mt-1">
                    {formatQuestionText(question.text)}
                  </p>
                  <p class="text-xs text-gray-400 mt-1">
                    ID: {question.id}
                  </p>
                </div>
              </td>

              <!-- Type -->
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getTypeColor(
                    question.type,
                  )}"
                >
                  {question.type || "Unknown"}
                </span>
              </td>

              <!-- Difficulty -->
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getDifficultyColor(
                    question.difficulty,
                  )}"
                >
                  {question.difficulty || "Unknown"}
                </span>
              </td>

              <!-- Marks -->
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm text-gray-900">
                  {question.marks || 0} marks
                </span>
              </td>

              <!-- Source -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">
                  {question.parent?.name || "Unknown"}
                </div>
                <div class="text-xs text-gray-500">
                  {question.parent?.type || "Unknown"}
                </div>
              </td>

              <!-- Actions -->
              <td
                class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
              >
                <div class="flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    class="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    on:click={() => handleRestoreQuestion(question.id)}
                  >
                    <svg
                      class="w-3 h-3 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Restore
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Summary Footer -->
    <div class="mt-4 p-4 bg-gray-50 rounded-lg">
      <div class="flex items-center justify-between text-sm text-gray-600">
        <div>
          Total excluded questions: <span class="font-medium"
            >{removedQuestions.length}</span
          >
        </div>
      </div>
    </div>
  {:else}
    <!-- Empty State -->
    <div class="text-center py-12">
      <svg
        class="mx-auto h-12 w-12 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">
        No excluded questions
      </h3>
      <p class="mt-1 text-sm text-gray-500">
        Questions that you exclude from the paper will appear here.
      </p>
    </div>
  {/if}
</div>
