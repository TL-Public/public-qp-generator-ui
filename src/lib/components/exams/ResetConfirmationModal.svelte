<script>
  import { createEventDispatcher } from "svelte";
  import Button from "$lib/components/Button.svelte";

  const dispatch = createEventDispatcher();

  function handleCancel() {
    dispatch("close");
  }

  function handleConfirm() {
    dispatch("confirm");
  }
</script>

<div
  class="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all duration-300 scale-100 border border-gray-100"
>
  <!-- Modal Header / Icon Banner -->
  <div
    class="bg-red-50 px-4 py-4 border-b border-gray-100 flex items-start gap-4"
  >
    <div>
      <h2 class="text-base font-bold text-dark leading-tight">
        Reset form data?
      </h2>
      <p class="text-sm text-gray-500 mt-1">This action cannot be undone.</p>
    </div>
  </div>

  <!-- Modal Body -->
  <div class="px-6 py-5">
    <p class="text-subtext text-sm leading-relaxed">
      Are you sure you want to reset the form data?
      <br />This will clear all configuration details, selected chapters,
      question allocations, difficulty levels, and fetched questions.
    </p>
  </div>

  <!-- Modal Actions -->
  <div
    class="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-100"
  >
    <Button type="button" btnType="secondary" on:click={handleCancel}>
      Cancel
    </Button>
    <Button type="button" btnType="danger" on:click={handleConfirm}>
      Reset All
    </Button>
  </div>
</div>
