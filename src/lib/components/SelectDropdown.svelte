<script>
  export let label = '';
  export let value = 'all';
  export let options = [];
  export let disabled = false;
  export let onChange = () => {};

  // Optional props
  export let placeholder = 'Select...';
  export let showQuestionCount = true;
</script>

<div class="space-y-2">
  <label class="block text-sm font-medium text-gray-700">
    {label}
  </label>
  <select
    class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 
           focus:outline-none focus:ring-blue-500 focus:border-blue-500 
           sm:text-sm rounded-md bg-white text-gray-900"
    bind:value
    on:change={onChange}
    {disabled}
  >
    <option value="all">{placeholder}</option>
    {#each options as option}
      <option value={option.id} class="text-gray-900">
        {option.name} {showQuestionCount ? `(${option.questionCount} questions)` : ''}
      </option>
    {/each}
  </select>
</div>