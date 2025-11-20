<script>
  import { onMount } from 'svelte';
  
  export let onReset = () => {};
  export let onDelete = () => {};
  export let onCreatePaper = () => {};
  
  let visible = false;

  onMount(() => {
    const handleScroll = () => {
      visible = window.scrollY > 400;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  });

  function handleCreatePaper(event) {
    event.preventDefault();
    onCreatePaper(event);
  }
</script>

<div 
  class="transition-all duration-300 {visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'} fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4"
>
  <div class="max-w-3xl mx-auto">
    <div class="flex justify-end space-x-4">
      <button
        type="button"
        class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        on:click={onReset}
      >
        Reset
      </button>
      
      <button
        type="button"
        class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
        on:click={onDelete}
      >
        Delete
      </button>
      
      <button
        type="button"
        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        on:click={handleCreatePaper}
      >
        Create Question Paper
      </button>
    </div>
  </div>
</div>