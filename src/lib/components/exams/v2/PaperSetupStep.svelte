<script>
  import Input from "$lib/components/Input.svelte";
  import Button from "$lib/components/Button.svelte";
  import { createEventDispatcher } from "svelte";

  export let examTitle = "";
  export let isTitleUserEdited = false;
  export let questionCount = 40;
  export let questionCountOptions = [10, 20, 30, 40, 50];
  export let isCustomQuestionCount = false;
  export let marksPerQuestion = 1;
  export let isAutoAllocation = true;
  export let difficultyPreset = "balanced";
  export let easyPercent = 40;
  export let mediumPercent = 40;
  export let hardPercent = 20;
  export let handleEasyChange = () => {};
  export let handleMediumChange = () => {};

  const dispatch = createEventDispatcher();

  function handleSelectPreset(count) {
    dispatch("selectPresetQuestionCount", count);
  }

  function handleSelectCustom() {
    dispatch("selectCustomQuestionCount");
  }

  function handleOpenManualAllocation() {
    dispatch("openManualAllocationModal");
  }

  function handleSelectDifficulty(preset) {
    dispatch("selectDifficultyPreset", preset);
  }
</script>

<div
  class="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200 transition-all space-y-6"
>
  <!-- Step Header -->
  <div class="flex items-center gap-3">
    <span
      class="w-8 h-8 rounded-full bg-primary/20 text-slate-700 font-bold text-sm flex items-center justify-center"
    >
      2
    </span>
    <h2 class="text-lg font-bold text-slate-900 tracking-tight">
      Set up the paper
    </h2>
  </div>

  <!-- Exam Title -->
  <div>
    <div class="flex items-center gap-2 mb-2">
      <label class="block text-xs font-bold text-slate-500 uppercase">
        EXAM TITLE
      </label>
      <span class="text-xs text-slate-400 font-normal italic">
        filled in for you — edit if you like
      </span>
    </div>
    <Input
      type="text"
      bind:value={examTitle}
      on:input={() => (isTitleUserEdited = true)}
      on:handleInputData={() => (isTitleUserEdited = true)}
      placeholder="Exam Title"
    />
  </div>

  <!-- Number of Questions -->
  <div>
    <label
      class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3"
    >
      NUMBER OF QUESTIONS
    </label>
    <div class="flex flex-wrap items-center gap-2.5">
      {#each questionCountOptions as count}
        <Button
          btnType={!isCustomQuestionCount && questionCount === count
            ? "primary"
            : "secondary"}
          customClass="!px-5 !py-2.5 rounded-xl text-sm font-bold min-w-[54px]"
          on:click={() => handleSelectPreset(count)}
        >
          {count}
        </Button>
      {/each}

      <Button
        btnType={isCustomQuestionCount ? "primary" : "secondary"}
        customClass="!px-5 !py-2.5 rounded-xl text-sm font-semibold capitalize"
        on:click={handleSelectCustom}
      >
        Custom...
      </Button>

      {#if isCustomQuestionCount}
        <div class="w-32">
          <Input
            type="number"
            min="1"
            max="500"
            bind:value={questionCount}
            placeholder="Questions"
          />
        </div>
      {/if}
    </div>
    <p class="text-xs text-slate-500 mt-2 font-medium">
      {questionCount || 0} questions · {marksPerQuestion} mark each = {(questionCount ||
        0) * marksPerQuestion} marks · about {Math.round(
        (questionCount || 0) * 2,
      )} minutes
    </p>
  </div>

  <div class="border-t border-slate-100 my-4"></div>

  <!-- Question Allocation -->
  <div>
    <label
      class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3"
    >
      QUESTION ALLOCATION
    </label>

    <div class="flex flex-wrap items-center gap-2.5 mb-2.5">
      <Button
        btnType={isAutoAllocation ? "primary" : "secondary"}
        customClass="!px-5 !py-2.5 rounded-xl text-sm font-semibold"
        on:click={() => (isAutoAllocation = true)}
      >
        Auto (recommended)
      </Button>

      <Button
        btnType={!isAutoAllocation ? "primary" : "secondary"}
        customClass="!px-5 !py-2.5 rounded-xl text-sm font-semibold"
        on:click={() => {
          isAutoAllocation = false;
          handleOpenManualAllocation();
        }}
      >
        Manual
      </Button>
    </div>

    <p class="text-xs text-slate-500 font-medium leading-relaxed">
      {#if isAutoAllocation}
        Questions are spread across your selected chapters and/or topics
        automatically.
      {:else}
        Manually set question count from each chapter/topic.
        <button
          type="button"
          on:click={handleOpenManualAllocation}
          class="font-bold text-primary hover:underline cursor-pointer ml-1 bg-transparent border-0 p-0 text-xs inline-block"
        >
          Configure allocation
        </button>
      {/if}
    </p>
  </div>

  <div class="border-t border-slate-100 my-4"></div>

  <!-- Difficulty -->
  <div>
    <label
      class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3"
    >
      DIFFICULTY
    </label>

    <!-- Difficulty Preset Pills -->
    <div class="flex flex-wrap items-center gap-2.5 mb-4">
      {#each ["balanced", "easier", "harder", "custom"] as preset}
        <Button
          btnType={difficultyPreset === preset ? "primary" : "secondary"}
          customClass="!px-5 !py-2 rounded-full text-sm font-semibold capitalize"
          on:click={() => handleSelectDifficulty(preset)}
        >
          {preset === "custom" ? "Custom..." : preset}
        </Button>
      {/each}
    </div>

    <!-- Difficulty Distribution Bar -->
    <div class="space-y-2">
      <div class="h-3 w-full rounded-full overflow-hidden flex bg-slate-100">
        <div
          style="width: {easyPercent}%"
          class="bg-[#86efac] transition-all duration-300"
          title="Easy: {easyPercent}%"
        ></div>
        <div
          style="width: {mediumPercent}%"
          class="bg-[#fde047] transition-all duration-300"
          title="Medium: {mediumPercent}%"
        ></div>
        <div
          style="width: {hardPercent}%"
          class="bg-[#fca5a5] transition-all duration-300"
          title="Hard: {hardPercent}%"
        ></div>
      </div>

      <!-- Legend Dots -->
      <div
        class="flex items-center gap-5 text-xs font-semibold text-slate-600"
      >
        <span class="inline-flex items-center gap-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-[#86efac]"></span>
          Easy
          <span class="text-slate-900 font-bold">{easyPercent} %</span>
        </span>
        <span class="inline-flex items-center gap-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-[#fde047]"></span>
          Medium
          <span class="text-slate-900 font-bold">{mediumPercent} %</span>
        </span>
        <span class="inline-flex items-center gap-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-[#fca5a5]"></span>
          Hard
          <span class="text-slate-900 font-bold">{hardPercent} %</span>
        </span>
      </div>
    </div>

    <!-- Custom Sliders Box -->
    {#if difficultyPreset === "custom"}
      <div
        class="mt-4 bg-[#fdfcf7] border border-[#f2eae0] rounded-xl p-5 space-y-4"
      >
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <!-- Easy Slider -->
          <div>
            <div
              class="flex justify-between items-center text-xs font-bold text-slate-800 mb-1.5"
            >
              <span>Easy — {easyPercent}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={easyPercent}
              on:input={handleEasyChange}
              class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#223972]"
            />
          </div>

          <!-- Medium Slider -->
          <div>
            <div
              class="flex justify-between items-center text-xs font-bold text-slate-800 mb-1.5"
            >
              <span>Medium — {mediumPercent}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={mediumPercent}
              on:input={handleMediumChange}
              class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#223972]"
            />
          </div>
        </div>

        <p class="text-xs text-slate-400 font-medium italic pt-1">
          Hard fills in the rest automatically.
        </p>
      </div>
    {/if}
  </div>
</div>
