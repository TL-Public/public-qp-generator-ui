<script>
  export let steps = [
    { id: 'examDetails', label: 'Exam Details', completed: false },
    { id: 'examConfig', label: 'Exam Configuration', completed: false },
    { id: 'difficulty', label: 'Difficulty Distribution', completed: false },
    { id: 'classSubject', label: 'Class & Subject', completed: false },
    { id: 'questions', label: 'Select Questions', completed: false },
    { id: 'groups', label: 'Create Groups', completed: false },
    { id: 'review', label: 'Review', completed: false }
  ];

  export let currentStep;
</script>

<div class="ml-4 relative flex items-center h-full min-h-[500px]">
  <!-- Vertical line -->
  <div class="absolute left-4 inset-y-0 w-0.5 bg-gray-200"></div>

  <!-- Steps - Centered vertically -->
  <div class="space-y-6 relative my-auto">
    {#each steps as step, index}
      <div class="relative flex items-center group">
        <!-- Circle indicator -->
        <div 
          class={`
            w-9 h-9 rounded-full border-2 flex items-center justify-center
            ${step.completed 
              ? 'bg-green-500 border-green-500' 
              : currentStep === step.id 
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 bg-white'}
          `}
        >
          {#if step.completed}
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          {:else}
            <span class={`text-sm font-medium ${
              currentStep === step.id ? 'text-blue-500' : 'text-gray-500'
            }`}>
              {index + 1}
            </span>
          {/if}
        </div>

        <!-- Step label -->
        <div class="ml-4 min-w-0 flex flex-col">
          <span class={`text-sm font-medium ${
            step.completed ? 'text-green-500' : 
            currentStep === step.id ? 'text-blue-500' : 'text-gray-500'
          }`}>
            {step.label}
          </span>
        </div>
      </div>
    {/each}
  </div>
</div>