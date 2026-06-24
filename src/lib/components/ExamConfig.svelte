<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  export let examData = {};

  // Validation state
  $: isValid = examData.numberOfSets <= 10 && examData.numberOfVersions <= 5 && 
               examData.numberOfSets > 0 && examData.numberOfVersions > 0;

  // Dispatch validation state
  $: {
    dispatch('validate', { isValid });
  }

  // Show/hide tooltip state
  let activeTooltip = null;
</script>

<div >
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <!-- Total Time Field -->
    <div class="relative">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Duration (minutes)
        <button 
          class="ml-1 text-gray-400 hover:text-gray-600"
          on:mouseenter={() => activeTooltip = 'time'}
          on:mouseleave={() => activeTooltip = null}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
          </svg>
        </button>
      </label>
      {#if activeTooltip === 'time'}
        <div class="absolute z-10 w-64 p-2 bg-black text-white text-sm rounded-lg shadow-lg -mt-1">
          Total duration of the exam in minutes. This time will be same for all sets and versions.
        </div>
      {/if}
      <input
        type="number"
        bind:value={examData.totalTime}
        min="1"
      class="mt-1 text-sm block w-full p-2  border-gray-300 rounded-md  border focus:border-blue-500 focus:ring-blue-500"
      />
    </div>

    <!-- Number of Sets Field -->
    <div class="relative">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Number of Sets <span class="text-xs text-gray-500">(max 10)</span>
      </label>
      <div class="relative group">
        <input
          type="number"
          min="1"
          max="10"
          bind:value={examData.numberOfSets}
          class="w-full p-2  text-sm   border-gray-300 rounded-md  border
            {examData.numberOfSets > 10 || examData.numberOfSets < 1 ? 
              'border-red-300 focus:ring-red-500 focus:border-red-500' : 
              'focus:ring-blue-500 focus:border-blue-500'}"
        />
        
        <div class="hidden group-hover:block absolute -top-1 left-full ml-2 z-10">
          <div class="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
            Sets help create different question papers with same format
          </div>
          <div class="absolute w-2 h-2 bg-gray-900 transform rotate-45 -left-1 top-2"></div>
        </div>
        {#if examData.numberOfSets > 10}
          <p class="mt-1 text-xs text-red-600">Maximum 10 sets allowed</p>
        {:else if examData.numberOfSets < 1}
          <p class="mt-1 text-xs text-red-600">Minimum 1 set required</p>
        {/if}
        
      </div>
    </div>

    <!-- Number of Versions Field -->
    <div class="relative">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Number of Versions <span class="text-xs text-gray-500">(max 5)</span>
      </label>
      <div class="relative group">
        <input
          type="number"
          min="1"
          max="5"
          bind:value={examData.numberOfVersions}
          class="w-full text-sm   p-2 border border-gray-300 rounded-md
            {examData.numberOfVersions > 5 || examData.numberOfVersions < 1 ? 
              'border-red-300 focus:ring-red-500 focus:border-red-500' : 
              'focus:ring-blue-500 focus:border-blue-500'}"
        />
        <div class="hidden group-hover:block absolute -top-1 left-full ml-2 z-10">
          <div class="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
            Versions create variations of questions within each set
          </div>
          <div class="absolute w-2 h-2 bg-gray-900 transform rotate-45 -left-1 top-2"></div>
        </div>
        {#if examData.numberOfVersions > 5}
          <p class="mt-1 text-sm text-red-600">Maximum 5 versions allowed</p>
        {:else if examData.numberOfVersions < 1}
          <p class="mt-1 input-error-msg">Minimum 1 version required</p>
        {/if}
      </div>
    </div>
  </div>

  <div class="bg-gray-50 border-l-4 border-gray-400 p-2 mt-2">
    <div class="flex">
      <div class="ml-3">
        <p class="text-sm text-gray-700">
          Total paper(s) to be generated : {examData.numberOfSets * examData.numberOfVersions} paper(s)
        </p>
      </div>
    </div>
  </div>
</div>