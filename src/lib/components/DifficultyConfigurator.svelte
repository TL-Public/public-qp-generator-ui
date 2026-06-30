<script>
  import ToggleWithLabel from "$lib/components/ToggleWithLabel.svelte";
  import DifficultyDistribution from "./DifficultyDistribution.svelte";

  export let examData = {};
  export let isValid = true;
  export let isReviewPageEnabled = false;
  export let disabled = false;
  export let autoBalance = true;

  // Reactively enforce standard distribution if auto-balanced
  $: if (autoBalance) {
    examData.easy = 40;
    examData.medium = 40;
    examData.hard = 20;
    isValid = true;
  }
</script>

<div class="w-full">
  <ToggleWithLabel
    bind:checked={autoBalance}
    {disabled}
    activeTitle="Auto Balance Difficulty"
    activeDescription="Automatically distribute questions across difficulty levels"
    inactiveTitle="Manually set difficulty levels"
    inactiveDescription="Manually set the percentage of questions for each difficulty level"
    class="mb-4"
  />

  {#if !autoBalance}
    <DifficultyDistribution
      bind:examData
      bind:isValid
      {isReviewPageEnabled}
      {disabled}
    />
  {/if}
</div>
