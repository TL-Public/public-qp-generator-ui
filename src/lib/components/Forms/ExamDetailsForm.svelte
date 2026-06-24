<script>
  import Card from "$lib/components/Cards/Card.svelte";
  import SelectableCardGroup from "$lib/components/SelectableCardGroup.svelte";
  import { createEventDispatcher, getContext } from "svelte";
  // import {apiPayloadStore} from "$lib/stores/apiPayLoadStore";
  const apiPayloadStore = getContext('apiPayloadStore');

  export let examTitle = "";
  export let examMode = "Online";
  export let isValid = false;

  const dispatch = createEventDispatcher();

  const examModes = [
    { value: "Offline", label: "Offline", description: "Pen & paper", icon: "menu_book" },
    { value: "Online", label: "Online", description: "Digital test", icon: "computer" },
    { value: "Hybrid", label: "Hybrid", description: "Both formats", icon: "wifi" }
  ];

  $: {
    isValid = !!examTitle && !!examMode;
    if (isValid) {
      apiPayloadStore.updateExamDetails({ examTitle, examMode });
    }
  }

  function handleInput() {
    dispatch("change", { examTitle, examMode, isValid });
  }
</script>


  <div class="grid grid-cols-12 gap-6 w-full ">
    <div class="col-span-6">
      <label class="block text-sm font-medium text-gray-700 mb-1">
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

    <div class="col-span-6">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Exam mode
      </label>
      <SelectableCardGroup
        options={examModes}
        bind:selected={examMode}
        on:change={handleInput}
      />
    </div>
  </div>
