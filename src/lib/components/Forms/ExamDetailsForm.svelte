<script>
  import Card from '../Cards/Card.svelte';
  import RadioGroup from '../RadioGroup.svelte';
  import { createEventDispatcher } from 'svelte';
  import { questionPaperStore } from '$lib/stores/questionPaperStore';

  export let examTitle = '';
  export let examMode = 'Online';
  export let isValid = false;

  const dispatch = createEventDispatcher();

  const examModes = ['Online', 'Offline', 'Hybrid'];

  $: {
    isValid = !!examTitle && !!examMode;
    if (isValid) {
      questionPaperStore.updateExamDetails({ examTitle, examMode });
    }
  }

  function handleInput() {
    dispatch('change', { examTitle, examMode, isValid });
  }
</script>

<Card title="Exam details">
  <!-- <div class="absolute right-4 top-4">
    <label class="block text-sm font-medium text-gray-700 mb-1 ">
      Exam type : <span class="text-blue-700 bg-blue-100 p-1 rounded-lg"> MCQ </span>
    </label>
  </div> -->

  <div class="flex gap-6 w-full justify-between">
    <div class="flex-1" >
      <label class="block  text-sm font-medium text-gray-700  mb-1">
        Exam title <span class="text-red-600">*</span>
      </label>
      <input
        type="text"
        required
        class="w-full p-2 text-sm border broder-gray-200 rounded-md focus:ring-blue-500 focus:border-blue-500 
        {!examTitle.trim() ? 'border-red-300' : 'border-gray-300'}"
        bind:value={examTitle}
        placeholder="Enter exam title"
        on:input={handleInput}
      />
      {#if !examTitle.trim()}
        <p class="mt-1 text-xs text-red-600">Exam title is required</p>
      {/if}
    </div>
  
    <div class="mb-2 py-1 flex-1">
      <label class="block  text-sm font-medium text-gray-700 mb-1">
        Exam mode
      </label>
      <RadioGroup options={examModes} bind:selected={examMode} on:change={handleInput} />
    </div>

  </div>

  
</Card>