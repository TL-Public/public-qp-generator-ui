<script>
  import Card from "$lib/components/Cards/Card.svelte";
  import DifficultyDistribution from "$lib/components/DifficultyDistribution.svelte";
  import ToggleWithLabel from "$lib/components/ToggleWithLabel.svelte";
  import InfoCard from "$lib/components/quiz/InfoCard.svelte";
  import Button from "$lib/components/Button.svelte";

  // Props
  export let examData = {};
  export let groups = [];
  export let questions = [];
  export let isReviewPageEnabled = true;
  export let allocationData = null;
  export let generationInProgress = false;

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
  $: remaining = examData.totalQuestions - totalAllocated; //   Move const to reactive statement
</script>

<div class="space-y-8">
  <!-- Basic Configuration -->
  <!-- Exam Configuration Card -->
  <Card>
    <div class="space-y-6">
      <!-- Header -->
      <div
        class="flex items-center justify-between border-b border-stroke pb-4"
      >
        <h2 class="text-base font-semibold text-gray-700">
          Exam Configuration
        </h2>
        <span
          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-primary"
        >
          {examData.examMode}
        </span>
      </div>

      <!-- Content Grid -->
      <div class="space-y-6">
        <!-- Basic Details -->
        <div class="space-y-2">
          <h3 class="text-xs font-medium text-subtext uppercase tracking-wider">
            Basic Details
          </h3>
          <div class="space-y-3 flex w-full justify-between">
            <div class="flex flex-col">
              <span class="text-sm text-subtext">Title</span>
              <span class="text-sm font-medium text-dark"
                >{examData.examTitle}</span
              >
            </div>
            <div class="flex flex-col">
              <span class="text-sm text-subtext">Class</span>
              <span class="text-sm font-medium text-dark"
                >{examData.examClass}</span
              >
            </div>
            <div class="flex flex-col">
              <span class="text-sm text-subtext">Medium</span>
              <span class="text-sm font-medium text-dark"
                >{examData.examMediumName || examData.examMedium}</span
              >
            </div>
            <div class="flex flex-col">
              <span class="text-sm text-subtext">Subject</span>
              <span class="text-sm font-medium text-dark"
                >{examData.examSubjectName || examData.examSubject}</span
              >
            </div>
          </div>
        </div>

        <!-- Time & Questions -->
        <div class="space-y-2">
          <h3 class="text-xs font-medium text-subtext uppercase tracking-wider">
            Paper Details
          </h3>
          <div class="grid grid-cols-3 gap-8">
            <InfoCard label="Duration (mins)" count={examData.totalTime}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 text-subtext"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clip-rule="evenodd"
                />
              </svg>
            </InfoCard>
            <InfoCard label="Sets" count={examData.numberOfSets}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 text-subtext"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"
                />
              </svg>
            </InfoCard>
            <InfoCard label="Versions" count={examData.numberOfVersions}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 text-subtext"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z"
                />
                <path d="M3 8a2 2 0 012-2v10h8a2 2 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
            </InfoCard>
          </div>
        </div>
        <!-- Footer with total papers info -->
        <div class="mt-2">
          <div class="flex items-center justify-end">
            <span class="text-sm text-subtext"
              >Total papers to generate : {examData.numberOfSets *
                examData.numberOfVersions} paper(s)</span
            >
          </div>
        </div>
      </div>
    </div>
  </Card>

  <!-- Difficulty Distribution -->
  <Card title="Question Difficulty Distribution">
    <ToggleWithLabel
      bind:checked={examData.autoBalance}
      disabled={true}
      activeTitle="Auto Balance Difficulty"
      activeDescription="Automatically distribute questions across difficulty levels"
      inactiveTitle="Manually set difficulty levels"
      inactiveDescription="Manually set the percentage of questions for each difficulty level"
      class="mb-4"
    />

    {#if !examData.autoBalance}
      <DifficultyDistribution
        bind:examData
        bind:isValid={difficultyValid}
        {isReviewPageEnabled}
      />
    {/if}
  </Card>

  <!--  NEW: Allocation Breakdown Card -->
  <Card>
    <div class="space-y-4">
      <!-- Header with allocation mode -->
      <div
        class="flex items-center justify-between border-b border-stroke pb-3"
      >
        <div class="flex items-center gap-3">
          <h3 class="text-sm font-medium text-dark">
            Question Allocation Summary
          </h3>
          <span
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-primary"
          >
            {allocationMode} Allocation
          </span>
        </div>

        <div class="text-sm text-gray-600">
          Required Questions: <span class="font-medium text-dark"
            >{examData.totalQuestions}</span
          >
        </div>
      </div>

      {#if selectedItems && selectedItems.length > 0}
        <!-- Allocation Table -->
        <div class="overflow-hidden border border-gray-200 rounded-lg">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-canvas-muted">
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
                <tr class={index % 2 === 0 ? "bg-white" : "bg-canvas-muted"}>
                  <!-- Item Name -->
                  <td class="px-6 py-4">
                    <div class="flex items-start">
                      <div class="flex-1">
                        <div class="text-sm font-medium text-dark">
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
                    <span class="text-sm text-dark font-medium">
                      {item.questionAvailable || 0}
                    </span>
                  </td>

                  <!-- Questions to Add -->
                  <td class="px-6 py-4 text-center">
                    <div class="flex items-center justify-center">
                      <span
                        class="inline-flex items-center px-3 py-1 rounded-full text-xs bg-canvas-muted text-dark"
                      >
                        {allocationMode === "Auto"
                          ? "Auto Allocate"
                          : item.questionsToAdd}
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
            class="mx-auto h-12 w-12 text-subtext"
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
          <h3 class="mt-2 text-sm font-medium text-dark">No allocation data</h3>
          <p class="mt-1 text-sm text-subtext">
            Question allocation information is not available. Please go back and
            complete the allocation process.
          </p>
        </div>
      {/if}
    </div>
  </Card>

  <!-- Action Buttons -->
  <div class="flex items-center justify-end pt-6 border-t border-stroke">
    <!-- <div class="text-sm text-gray-600">
      {numberOfSets} sets × {numberOfVersions} versions = {numberOfSets *
        numberOfVersions} total papers
    </div> -->
    <div class="flex space-x-4">
      <Button
        btnType="secondary"
        on:click={() => dispatch("back")}
        disabled={generationInProgress}
      >
        Back
      </Button>
      <Button
        on:click={() => dispatch("generate")}
        disabled={generationInProgress}
        >{generationInProgress ? "Generating..." : "Generate Papers"}</Button
      >
    </div>
  </div>
</div>
