<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  export let totalTime = 40;
  export let totalQuestions = 40;
  export let numberOfSets = 1;
  export let numberOfVersions = 1;

  // Validation state
  $: isValid = numberOfSets <= 10 && numberOfVersions <= 5 && 
               numberOfSets > 0 && numberOfVersions > 0;

  // Dispatch validation state
  $: {
    dispatch('validate', { isValid });
  }

  // Show/hide tooltip state
  let activeTooltip = null;
</script>

<div class="space-y-6">
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <!-- Total Time Field -->
    <div class="relative">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Total Time (minutes)
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
        bind:value={totalTime}
        min="1"
      class="mt-1 block w-full px-3 py-2 rounded-md border shadow-sm focus:border-blue-500 focus:ring-blue-500"
      />
    </div>

    <!-- Total Questions Field -->
    <div class="relative">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Total Questions
        <button 
          class="ml-1 text-gray-400 hover:text-gray-600"
          on:mouseenter={() => activeTooltip = 'questions'}
          on:mouseleave={() => activeTooltip = null}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
          </svg>
        </button>
      </label>
      {#if activeTooltip === 'questions'}
        <div class="absolute z-10 w-64 p-2 bg-black text-white text-sm rounded-lg shadow-lg -mt-1">
          Number of questions in each exam paper. This will be consistent across all sets and versions.
        </div>
      {/if}
      <input
        type="number"
        bind:value={totalQuestions}
        min="1"
        class="mt-1 block w-full px-3 py-2 rounded-md border shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
          bind:value={numberOfSets}
          class="w-full px-3 py-2 border rounded-md
            {numberOfSets > 10 || numberOfSets < 1 ? 
              'border-red-300 focus:ring-red-500 focus:border-red-500' : 
              'focus:ring-blue-500 focus:border-blue-500'}"
        />
        
        <div class="hidden group-hover:block absolute -top-1 left-full ml-2 z-10">
          <div class="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
            Sets help create different question papers with same format
          </div>
          <div class="absolute w-2 h-2 bg-gray-900 transform rotate-45 -left-1 top-2"></div>
        </div>
        {#if numberOfSets > 10}
          <p class="mt-1 text-sm text-red-600">Maximum 10 sets allowed</p>
        {:else if numberOfSets < 1}
          <p class="mt-1 text-sm text-red-600">Minimum 1 set required</p>
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
          bind:value={numberOfVersions}
          class="w-full px-3 py-2 border rounded-md
            {numberOfVersions > 5 || numberOfVersions < 1 ? 
              'border-red-300 focus:ring-red-500 focus:border-red-500' : 
              'focus:ring-blue-500 focus:border-blue-500'}"
        />
        <div class="hidden group-hover:block absolute -top-1 left-full ml-2 z-10">
          <div class="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
            Versions create variations of questions within each set
          </div>
          <div class="absolute w-2 h-2 bg-gray-900 transform rotate-45 -left-1 top-2"></div>
        </div>
        {#if numberOfVersions > 5}
          <p class="mt-1 text-sm text-red-600">Maximum 5 versions allowed</p>
        {:else if numberOfVersions < 1}
          <p class="mt-1 text-sm text-red-600">Minimum 1 version required</p>
        {/if}
      </div>
    </div>
  </div>

  <div class="bg-blue-50 border-l-4 border-blue-400 p-4 mt-4">
    <div class="flex">
      <div class="flex-shrink-0">
        <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
        </svg>
      </div>
      <div class="ml-3">
        <p class="text-sm text-blue-700">
          You will generate {numberOfSets} different question paper(s) with {numberOfVersions} version(s) each. 
          Each paper will contain {totalQuestions} questions and should be completed in {totalTime} minutes.
        </p>
      </div>
    </div>
  </div>
</div>