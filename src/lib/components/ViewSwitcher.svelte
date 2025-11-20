<script>
  export let activeView = 'chapters'; // 'chapters' or 'questions'
</script>

<div class="flex border-b mb-6">
  <button
    class={`px-4 py-2 font-medium text-sm ${
      activeView === 'chapters' 
        ? 'border-b-2 border-blue-500 text-blue-600' 
        : 'text-gray-500 hover:text-gray-700'
    }`}
    on:click={() => activeView = 'chapters'}
  >
    Chapters
  </button>
  <button
    class={`px-4 py-2 font-medium text-sm ${
      activeView === 'questions' 
        ? 'border-b-2 border-blue-500 text-blue-600' 
        : 'text-gray-500 hover:text-gray-700'
    }`}
    on:click={() => activeView = 'questions'}
  >
    Questions selected
  </button>
</div>