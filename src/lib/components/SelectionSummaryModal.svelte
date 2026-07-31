<script>
  import { createEventDispatcher } from 'svelte';

  export let chapterName = '';
  export let items = [];

  const dispatch = createEventDispatcher();

  function closeModal() {
    dispatch('close');
  }
</script>

<div 
  class="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50" 
  on:click={closeModal}
  role="dialog"
  aria-modal="true"
  aria-labelledby="summary-modal-title"
>
  <div class="bg-white rounded-lg p-6 max-w-md w-full shadow-xl" on:click|stopPropagation>
    <div class="flex justify-between items-center border-b pb-3 mb-4">
      <h2 class="text-lg font-semibold text-gray-900" id="summary-modal-title">
        Selections for: <span class="font-bold">{chapterName}</span>
      </h2>
      <button on:click={closeModal} class="text-gray-400 hover:text-gray-800 text-2xl leading-none">&times;</button>
    </div>
    
    {#if items.length > 0}
      <ul class="space-y-2 max-h-80 overflow-y-auto pr-2">
        {#each items as item}
          <li class="flex items-center space-x-3 p-2 rounded-md bg-gray-50 border border-gray-200">
            <div class={`w-2 h-2 rounded-full flex-shrink-0 ${item.type === 'topic' ? 'bg-blue-500' : 'bg-purple-500'}`}></div>
            <div>
              <p class="font-medium text-sm text-gray-800">{item.name}</p>
              <p class="text-xs text-gray-500 capitalize">{item.type}</p>
            </div>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="text-gray-600">No specific topics or subtopics selected for this chapter.</p>
    {/if}

    <div class="flex justify-end mt-6">
      <button class="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" on:click={closeModal}>
        Close
      </button>
    </div>
  </div>
</div>