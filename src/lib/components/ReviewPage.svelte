<script>
  import Card from "./Cards/Card.svelte";
  import DifficultyDistribution from "./DifficultyDistribution.svelte";

  // Props
  export let examTitle = "";
  export let examMode = "";
  export let examClass = "";
  export let examMedium = "";
  export let examSubject = "";
  export let totalTime = 0;
  export let totalQuestions = 0;
  export let numberOfSets = 1;
  export let numberOfVersions = 1;
  export let groups = [];
  export let questions = [];
  export let easy = "";
  export let medium = "";
  export let hard = "";
  export let isReviewPageEnabled = true;
  export let allocationData = null;

  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();

  let difficultyValid = true;

  //   Computed properties for allocation summary
  $: selectedItems = allocationData?.selectedItems || [];
  $: totalAllocated = selectedItems.reduce(
    (sum, item) => sum + (item.questionsToAdd || 0),
    0,
  );
  $: allocationMode = allocationData?.allocationType || "Manual";
  $: remaining = totalQuestions - totalAllocated; //   Move const to reactive statement
</script>

<div class="space-y-8">
  <!-- Basic Configuration -->
  <!-- Exam Configuration Card -->
  <Card>
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between border-b pb-4">
        <h2 class="text-base font-semibold text-gray-700">
          Exam Configuration
        </h2>
        <span
          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-primary"
        >
          {examMode}
        </span>
      </div>

      <!-- Content Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Basic Details -->
        <div class="space-y-4">
          <h3
            class="text-xs font-medium text-subtext uppercase tracking-wider"
          >
            Basic Details
          </h3>
          <div class="space-y-3">
            <div class="flex flex-col">
              <span class="text-sm text-subtext">Title</span>
              <span class="text-sm font-medium text-gray-900">{examTitle}</span>
            </div>
            <div class="flex flex-col">
              <span class="text-sm text-subtext">Class</span>
              <span class="text-sm font-medium text-gray-900">{examClass}</span>
            </div>
            <div class="flex flex-col">
              <span class="text-sm text-subtext">Medium</span>
              <span class="text-sm font-medium text-gray-900">{examMedium}</span>
            </div>
            <div class="flex flex-col">
              <span class="text-sm text-subtext">Subject</span>
              <span class="text-sm font-medium text-gray-900"
                >{examSubject}</span
              >
            </div>
          </div>
        </div>

        <!-- Time & Questions -->
        <div class="space-y-4">
          <h3
            class="text-xs font-medium text-subtext uppercase tracking-wider"
          >
            Paper Details
          </h3>
          <div class="space-y-3">
            <div
              class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div class="flex flex-col">
                <span class="text-sm text-subtext">Duration</span>
                <span class="text-sm font-medium text-gray-900"
                  >{totalTime} mins</span
                >
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 text-gray-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <div
              class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div class="flex flex-col">
                <span class="text-sm text-subtext">Questions</span>
                <span class="text-sm font-medium text-gray-900"
                  >{totalQuestions}</span
                >
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 text-gray-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>

        <!-- Version Details -->
        <div class="space-y-4">
          <h3
            class="text-xs font-medium text-subtext uppercase tracking-wider"
          >
            Version Details
          </h3>
          <div class="space-y-3">
            <div
              class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div class="flex flex-col">
                <span class="text-sm text-subtext">Sets</span>
                <span class="text-sm font-medium text-gray-900"
                  >{numberOfSets}</span
                >
              </div>
              <div class="flex items-center gap-1">
                <span class="text-xs text-gray-400">max 10</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 text-gray-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"
                  />
                </svg>
              </div>
            </div>
            <div
              class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div class="flex flex-col">
                <span class="text-sm text-subtext">Versions</span>
                <span class="text-sm font-medium text-gray-900"
                  >{numberOfVersions}</span
                >
              </div>
              <div class="flex items-center gap-1">
                <span class="text-xs text-gray-400">max 5</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 text-gray-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z"
                  />
                  <path
                    d="M3 8a2 2 0 012-2v10h8a2 2 01-2 2H5a2 2 0 01-2-2V8z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer with total papers info -->
      <div class="pt-4 border-t">
        <div class="flex items-center justify-between">
          <span class="text-sm text-subtext">Total papers to generate</span>
          <span
            class="inline-flex items-center px-3 py-1 rounded-full text-sm text-subtext"
          >
            {numberOfSets * numberOfVersions} papers
          </span>
        </div>
      </div>
    </div>
  </Card>

  <!-- Difficulty Distribution -->
  <Card title="Question Difficulty Distribution">
   
      <DifficultyDistribution
        bind:easy
        bind:medium
        bind:hard
        bind:isValid={difficultyValid}
        {isReviewPageEnabled}
      />
   
  </Card>

  <!--  NEW: Allocation Breakdown Card -->
  <Card>
    <div class="space-y-4">
      <!-- Header with allocation mode -->
      <div class="flex items-center justify-between border-b pb-3">
        <div class="flex items-center gap-3">
          <h3 class="text-sm font-medium text-gray-900">
            Question Allocation Summary
          </h3>
          <span
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-primary"
          >
            {allocationMode} Allocation
          </span>
        </div>

        <div class="text-sm text-gray-600">
          Required Questions: <span class="font-medium text-gray-900"
            >{totalQuestions}</span
          >
        </div>
      </div>

      {#if selectedItems && selectedItems.length > 0}
        <!-- Allocation Table -->
        <div class="overflow-hidden border border-gray-200 rounded-lg">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-subtext uppercase tracking-wider"
                >
                  Content
                </th>
                <th
                  class="px-6 py-3 text-center text-xs font-medium text-subtext uppercase tracking-wider"
                >
                  Type
                </th>
                <th
                  class="px-6 py-3 text-center text-xs font-medium text-subtext uppercase tracking-wider"
                >
                  Available
                </th>
                <th
                  class="px-6 py-3 text-center text-xs font-medium text-subtext uppercase tracking-wider"
                >
                  Questions to Add
                </th>
                <!-- <th class="px-6 py-3 text-center text-xs font-medium text-subtext uppercase tracking-wider">
                  Utilization
                </th> -->
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {#each selectedItems as item, index}
                <tr class={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <!-- Item Name -->
                  <td class="px-6 py-4">
                    <div class="flex items-start">
                      <div class="flex-1">
                        <div class="text-sm font-medium text-gray-900">
                          {item.name}
                        </div>
                      </div>
                    </div>
                  </td>

                  <!-- Item Type -->
                  <td class="px-6 py-4 text-center">
                    <span
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      {item.type === 'chapter'
                        ? 'bg-blue-100 text-blue-800'
                        : item.type === 'topic'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-800'}"
                    >
                      {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                    </span>
                  </td>

                  <!-- Available Questions -->
                  <td class="px-6 py-4 text-center">
                    <span class="text-sm text-gray-900 font-medium">
                      {item.questionAvailable || 0}
                    </span>
                  </td>

                  <!-- Questions to Add -->
                  <td class="px-6 py-4 text-center">
                    <div class="flex items-center justify-center">
                      <span
                        class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-green-800"
                      >
                        {allocationMode === "Auto" ? "-" : item.questionsToAdd}
                      </span>
                    </div>
                  </td>

                  <!--   Utilization Percentage with proper {@const} placement -->
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <!--   Summary Footer with proper reactive statement -->
      {:else}
        <!-- No allocation data -->
        <div class="text-center py-8">
          <svg
            class="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M8 14v20c0 4.418 7.163 8 16 8 1.381 0 2.721-.087 4-.252M8 14c0 4.418 7.163 8 16 8s16-3.582 16-8M8 14c0-4.418 7.163-8 16-8s16 3.582 16 8m0 0v14m-16-4c1.381 0 2.721-.087 4-.252"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">
            No allocation data
          </h3>
          <p class="mt-1 text-sm text-subtext">
            Question allocation information is not available. Please go back and
            complete the allocation process.
          </p>
        </div>
      {/if}
    </div>
  </Card>

  <!-- Action Buttons -->
  <div class="flex items-center justify-end pt-6 border-t">
    <!-- <div class="text-sm text-gray-600">
      {numberOfSets} sets × {numberOfVersions} versions = {numberOfSets *
        numberOfVersions} total papers
    </div> -->
    <div class="flex space-x-4">
      <button
        class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        on:click={() => dispatch("back")}
      >
        Back
      </button>
      <button
        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        on:click={() => dispatch("generate")}
      >
        Generate Papers
      </button>
    </div>
  </div>
</div>
