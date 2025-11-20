<script>
  export let totalSets = 4;
  export let totalVersions = 2;
  export let timePerPaper = 180;
  export let onCancel = () => {};
  export let onReset = () => {};
  export let onGenerate = () => {};
</script>

<div class="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
  <div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
    <div class="text-sm text-gray-600">
      <span class="inline-flex items-center gap-1">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        {totalSets} sets × {totalVersions} versions = {totalSets * totalVersions} total papers
      </span>
      <span class="ml-4 inline-flex items-center gap-1">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {timePerPaper} minutes each
      </span>
    </div>

    <div class="flex items-center gap-3">
      <button
        on:click={onCancel}
        class="px-4 py-2 text-gray-600 hover:text-gray-800"
      >
        Cancel
      </button>
      
      <button
        on:click={onReset}
        class="px-4 py-2 text-gray-600 hover:text-gray-800"
      >
        Reset
      </button>

      <button
        on:click={onGenerate}
        class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Generate Papers
      </button>
    </div>
  </div>
</div>
