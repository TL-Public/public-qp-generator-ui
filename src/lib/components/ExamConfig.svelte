<script>
  import { createEventDispatcher } from 'svelte';
  import Tooltip from '$lib/components/Tooltip.svelte';
  import Input from '$lib/components/Input.svelte';
  import { Info } from '@lucide/svelte';
  const dispatch = createEventDispatcher();

  export let examData = {};

  // Validation state
  $: isValid = examData.numberOfSets <= 10 && examData.numberOfVersions <= 5 && 
               examData.numberOfSets > 0 && examData.numberOfVersions > 0;

  // Dispatch validation state
  $: {
    dispatch('validate', { isValid });
  }

  // Pre-calculate validation errors for Input components
  $: setsError = examData.numberOfSets > 10 ? 'Maximum 10 sets allowed' : 
                 examData.numberOfSets < 1 ? 'Minimum 1 set required' : '';
  
  $: versionsError = examData.numberOfVersions > 5 ? 'Maximum 5 versions allowed' : 
                     examData.numberOfVersions < 1 ? 'Minimum 1 version required' : '';
</script>

<div >
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <!-- Total Time Field -->
    <div class="relative">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Duration (minutes)
        <Tooltip text="Total duration of the exam in minutes. This time will be same for all sets and versions." maxWidth={250}>
          <button class="ml-1 text-gray-400 hover:text-gray-600 focus:outline-none align-middle">
            <Info size={14} />
          </button>
        </Tooltip>
      </label>
      <Input
        type="number"
        bind:value={examData.totalTime}
        min="1"
        placeholder="Enter duration"
      />
    </div>

    <!-- Number of Sets Field -->
    <div class="relative">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Number of Sets <span class="text-xs text-gray-500">(max 10)</span>
        <Tooltip text="Sets create question papers with unique questions for each set" position="top" maxWidth={250}>
          <button class="ml-1 text-gray-400 hover:text-gray-600 focus:outline-none align-middle">
            <Info size={14} class="text-primary/70"/>
          </button>
        </Tooltip>
      </label>
      <Input
        type="number"
        min="1"
        max="10"
        bind:value={examData.numberOfSets}
        validationErrors={setsError}
        placeholder="e.g. 2"
      />
    </div>

    <!-- Number of Versions Field -->
    <div class="relative">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Number of Versions <span class="text-xs text-gray-500">(max 5)</span>
        <Tooltip text="Versions put the questions in a different order within a set" position="top" maxWidth={250}>
          <button class="ml-1 text-gray-400 hover:text-gray-600 focus:outline-none align-middle">
            <Info size={14} class="text-primary/70"/>
          </button>
        </Tooltip>
      </label>
      <Input
        type="number"
        min="1"
        max="5"
        bind:value={examData.numberOfVersions}
        validationErrors={versionsError}
        placeholder="e.g. 1"
      />
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