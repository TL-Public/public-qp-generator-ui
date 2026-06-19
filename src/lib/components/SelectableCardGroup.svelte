<script>
  /**
   * @typedef {Object} Option
   * @property {string} value - The unique identifier for the option
   * @property {string} label - The main title text
   * @property {string} description - The secondary description text
   * @property {string} icon - The material icon name
   */

  /** @type {Option[]} */
  export let options = [];
  export let selected = "";
  export let disabled = false;

 
  function handleSelect(value) {
    if (disabled) return;
    selected = value;
  }
</script>

<div class="flex gap-3 w-full h-[38px]">
  {#each options as option}
    <button
      type="button"
      class="flex-1 flex gap-2 items-center  rounded-md border transition-all duration-200 focus:outline-none px-2 
      {selected === option.value 
        ? 'bg-dark border-dark text-white' 
        : 'bg-white border-gray-200 text-dark hover:border-gray-300'}"
      on:click={() => handleSelect(option.value)}
      {disabled}
    >
    <span class="border-2 border-stroke rounded-full h-4 w-4 flex items-center justify-center">
        <span class={`block h-2 w-2 rounded-full  ${selected === option.value ? 'bg-white' : 'bg-transparent'}`}></span>
    </span>
      <span class="text-sm font-medium">{option.label}</span>
    </button>
  {/each}
</div>

<style>
</style>
