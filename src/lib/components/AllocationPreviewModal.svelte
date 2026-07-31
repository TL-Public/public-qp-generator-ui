<script>
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  // Props to match your console data structure
  export let showModal = false;
  export let allocationType = "";
  export let allocationLevel = "";
  export let totalRequired = 0;
  export let totalAllocated = 0;
  export let totalAvailable = 0;
  export let remaining = 0;
  export let items = [];
  export let selectedItems = [];
  export let autoAllocations = [];
  export let allocateWithAI = false;

  // Calculate percentages for progress bars
  $: allocationPercentage =
    totalRequired > 0 ? Math.round((totalAllocated / totalRequired) * 100) : 0;
  $: availabilityPercentage =
    totalRequired > 0 ? Math.round((totalAvailable / totalRequired) * 100) : 0;

  // Get only selected items for detailed breakdown
  $: selectedItemsWithQuestions = selectedItems.filter(
    (item) => item.isSelected && item.questionsToAdd > 0,
  );

  let shouldNavigateToReview = false;
  function handleConfirmAndReview() {
    const confirmData = {
      allocationType,
      allocationLevel,
      totalRequired,
      totalAllocated,
      totalAvailable,
      remaining,
      selectedItems: selectedItemsWithQuestions,
      timestamp: new Date().toISOString(),
      navigateToReview: true, // This flag tells the main page to navigate
    };

    // Dispatch as allocationConfirmed so it gets forwarded properly
    dispatch("allocationConfirmed", confirmData);
    closeModal();
  }

  function handleCancel() {
    dispatch("cancel");
    closeModal();
  }

  function closeModal() {
    showModal = false;
  }

  // Close modal when clicking outside
  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  }

  // Close modal on Escape key
  function handleKeydown(event) {
    if (event.key === "Escape") {
      closeModal();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if showModal}
  <!-- Modal Backdrop -->
  <div
    class="fixed inset-0 backdrop-blur-xs z-50 flex bg-gray-500/50 items-center justify-center p-4"
    on:click={handleBackdropClick}
    on:keydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
  >
    <!-- Modal Content -->
    <div
      class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
    >
      <!-- Modal Header -->
      <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div class="flex items-center justify-between">
          <h2 id="modal-title" class="text-lg font-semibold text-gray-900">
            Allocation Preview & Confirmation
          </h2>
          <button
            type="button"
            class="text-gray-400 hover:text-gray-600 transition-colors"
            on:click={closeModal}
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

      <!-- Modal Body -->
      <div class="px-6 py-4 overflow-y-auto max-h-[60vh]">
        <!-- Allocation Summary Section -->
        <div class="mb-6">
          <h3 class="text-base font-medium text-gray-900 mb-4">
            Allocation Summary
          </h3>

          <!-- Summary Cards -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div
              class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center"
            >
              <div class="text-xl font-bold text-primary">{totalRequired}</div>
              <div class="text-sm text-blue-800">Required</div>
            </div>
            <div
              class="bg-green-50 border border-green-200 rounded-lg p-3 text-center"
            >
              <div class="text-xl font-bold text-green-600">
                {totalAllocated}
              </div>
              <div class="text-sm text-green-800">Allocated</div>
            </div>
            <div
              class="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center"
            >
              <div class="text-xl font-bold text-purple-600">
                {totalAvailable}
              </div>
              <div class="text-sm text-purple-800">Available</div>
            </div>
            {#if !allocateWithAI}
              <div
                class="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center"
              >
                <div
                  class="text-xl font-bold {remaining === 0
                    ? 'text-green-600'
                    : remaining > 0
                      ? 'text-amber-600'
                      : 'text-red-600'}"
                >
                  {remaining}
                </div>
                <div class="text-sm text-gray-800">Remaining</div>
              </div>
            {/if}
          </div>

          <!-- Progress Bars -->
          {#if !allocateWithAI}
            <div class="space-y-3">
              <!-- Allocation Progress -->
              <div>
                <div class="flex justify-between text-sm text-gray-600 mb-1">
                  <span class="text-sm">Allocation Progress</span>
                  <span class="text-sm">{allocationPercentage}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div
                    class="bg-primary h-2 rounded-full transition-all duration-300"
                    style="width: {Math.min(allocationPercentage, 100)}%"
                  ></div>
                </div>
              </div>
            </div>

            <!-- Status Message -->
            <div class="mt-4">
              {#if remaining === 0}
                <div
                  class="bg-green-50 border border-green-200 rounded-md p-3 text-sm text-green-800"
                >
                  ✅ Perfect allocation! All {totalRequired} questions are properly
                  allocated.
                </div>
              {:else if remaining > 0}
                <div
                  class="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-800"
                >
                  ⚠️ {remaining} questions remaining. These will be auto-allocated
                  from available content.
                </div>
              {:else}
                <div
                  class="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-800"
                >
                  ❌ Over-allocated by {Math.abs(remaining)} questions. Please adjust
                  your allocation.
                </div>
              {/if}
            </div>
          {/if}
        </div>
        <!-- Allocation Mode Info -->
        <div class="mb-6">
          <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div class="flex items-center space-x-4 text-sm">
              <div>
                <span class="font-medium text-gray-700">Mode:</span>
                <span
                  class="ml-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-medium"
                >
                  {allocationType}
                </span>
              </div>
              <div>
                <span class="font-medium text-gray-700">Level:</span>
                <span
                  class="ml-1 px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs font-medium"
                >
                  {allocationLevel}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Detailed Allocation Breakdown -->
        <div class="mb-6">
          <h3 class="text-base font-medium text-gray-700 mb-4">
            Detailed Allocation Breakdown
          </h3>

          {#if selectedItemsWithQuestions.length === 0}
            <div class="text-center text-gray-500 py-4">
              <div class="text-sm">
                No items with question allocations found.
              </div>
            </div>
          {:else}
            <div class="space-y-3">
              {#each selectedItemsWithQuestions as item}
                <div
                  class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div class="flex-1">
                    <div class="font-medium text-sm text-gray-700">
                      {item.name}
                    </div>
                    <div class="flex items-center space-x-2 mt-1">
                      <span
                        class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                        {item.type === 'chapter'
                          ? 'bg-blue-100 text-blue-800'
                          : item.type === 'topic'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-purple-100 text-purple-800'}"
                      >
                        {item.type}
                      </span>
                      <span class="text-xs text-gray-500"
                        >Code: {item.code}</span
                      >
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-sm font-bold text-primary">
                      {item.questionsToAdd}
                    </div>
                    <div class="text-xs text-gray-500">questions</div>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Additional Info -->
        {#if autoAllocations.length > 0}
          <div class="mb-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">
              Auto Allocations
            </h3>
            <div class="space-y-2">
              {#each autoAllocations as allocation}
                <div class="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div class="text-sm text-blue-800">
                    {allocation.description}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <div class="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div class="flex items-center justify-end space-x-3">
          <button
            type="button"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            on:click={handleCancel}
          >
            Cancel
          </button>
          {#if !allocateWithAI}
            <button
              type="button"
              class="px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={remaining < 0}
              on:click={handleConfirmAndReview}
            >
              {remaining < 0 ? "Fix Allocation" : "Confirm & Review Paper"}
            </button>
          {:else if allocateWithAI}
            <div>
              <button
                type="button"
                class="px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                on:click={handleConfirmAndReview}
              >
                Confirm & Review Paper
              </button>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Custom scrollbar for better UX */
  .overflow-y-auto {
    scrollbar-width: thin;
    scrollbar-color: #cbd5e0 #f7fafc;
  }

  .overflow-y-auto::-webkit-scrollbar {
    width: 6px;
  }

  .overflow-y-auto::-webkit-scrollbar-track {
    background: #f7fafc;
  }

  .overflow-y-auto::-webkit-scrollbar-thumb {
    background-color: #cbd5e0;
    border-radius: 3px;
  }

  .overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background-color: #a0aec0;
  }
</style>
