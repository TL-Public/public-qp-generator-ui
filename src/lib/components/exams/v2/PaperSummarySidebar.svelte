<script>
  import Button from "$lib/components/Button.svelte";
  import InlineNotification from "$lib/components/InlineNotification.svelte";
  import { ArrowRight, Loader2 } from "@lucide/svelte";
  import { createEventDispatcher } from "svelte";

  export let examTitle = "";
  export let questionCount = 40;
  export let marksPerQuestion = 1;
  export let isAutoAllocation = true;
  export let difficultyPreset = "balanced";
  export let easyPercent = 40;
  export let mediumPercent = 40;
  export let hardPercent = 20;
  export let setsCount = 1;
  export let versionsCount = 1;
  export let hasQuestionPoolExceededError = false;
  export let requiredTotalQuestions = 0;
  export let availableQuestionCount = 0;
  export let isGeneratingPaper = false;
  export let isSavingDraft = false;
  export let isFormValid = true;
  export let isEditMode = false;
  export let saveDraftError = "";

  const dispatch = createEventDispatcher();

  function handleConfigureManualAllocation() {
    dispatch("configureManualAllocation");
  }

  function handleGenerate() {
    dispatch("generate");
  }

  function handleSaveDraft() {
    dispatch("saveDraft");
  }
</script>

<div class="w-full lg:w-80 xl:w-96 lg:sticky lg:top-8 space-y-4">
  <!-- Primary Summary Card -->
  <div
    class="bg-white text-dark rounded-2xl p-6 shadow-sm border border-gray-200"
  >
    <div
      class="text-[10px] font-bold tracking-widest text-primary uppercase mb-2"
    >
      YOUR PAPER
    </div>

    <h3
      class={`text-lg leading-snug mb-6 ${examTitle ? "font-bold text-dark" : "font-bold text-subtext/80"}`}
    >
      {examTitle || "Untitled Paper"}
    </h3>

    <!-- Key Specs List -->
    <div class="space-y-3.5 text-xs">
      <div class="flex justify-between items-center">
        <span class="text-primary">Questions</span>
        <span class="font-semibold text-dark"
          >{questionCount} MCQs · {questionCount * marksPerQuestion} marks</span
        >
      </div>
      <div class="flex justify-between items-center">
        <span class="text-primary">Allocation</span>
        <div class="flex items-center gap-1.5 font-semibold text-dark">
          <span>{isAutoAllocation ? "Auto" : "Manual"}</span>
          {#if !isAutoAllocation}
            <button
              type="button"
              on:click={handleConfigureManualAllocation}
              class="text-[11px] font-bold text-blue-700 hover:underline cursor-pointer bg-transparent border-0 p-0 ml-1"
            >
              (Configure)
            </button>
          {/if}
        </div>
      </div>

      <div class="flex justify-between items-center">
        <span class="text-primary">Time</span>
        <span class="font-semibold text-dark"
          >~{Math.round(questionCount * 2)} min</span
        >
      </div>

      <div class="flex justify-between items-center">
        <span class="text-primary">Difficulty</span>
        <span class="font-semibold text-dark">
          {difficultyPreset === "custom"
            ? "Custom"
            : difficultyPreset.charAt(0).toUpperCase() +
              difficultyPreset.slice(1)} · {easyPercent}/{mediumPercent}/{hardPercent}
        </span>
      </div>

      <div class="flex justify-between items-center">
        <span class="text-primary">Papers to print</span>
        <span class="font-semibold text-dark"
          >{setsCount} sets × {versionsCount} version{versionsCount > 1
            ? "s"
            : ""}</span
        >
      </div>
    </div>

    {#if hasQuestionPoolExceededError}
      <div class="mt-4">
        <InlineNotification
          kind="error"
          title="Required questions exceed pool"
          subtitle={`Requires ${requiredTotalQuestions} questions (${setsCount} set${setsCount > 1 ? "s" : ""} × ${questionCount} qns), but only ${availableQuestionCount} are available in selected syllabus.`}
          hideCloseButton={true}
        />
      </div>
    {/if}

    <!-- Generate Action Button -->
    <Button
      btnType="primary"
      disabled={isGeneratingPaper || isSavingDraft || !isFormValid}
      customClass="w-full mt-6 py-3 px-4 font-bold rounded-xl shadow-xs text-sm group flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      on:click={handleGenerate}
    >
      {#if isGeneratingPaper}
        <Loader2 class="w-4 h-4 text-white animate-spin" />
        <span>Generating Paper...</span>
      {:else}
        <span>Generate paper</span>
        <ArrowRight
          class="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
        />
      {/if}
    </Button>

    <!-- Save / Update Draft Button -->
    <Button
      btnType="secondary"
      disabled={isSavingDraft || isGeneratingPaper}
      customClass="w-full mt-2.5 py-3 px-4 font-semibold rounded-xl text-sm border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      on:click={handleSaveDraft}
    >
      {#if isSavingDraft}
        <Loader2 class="w-4 h-4 text-slate-600 animate-spin" />
        <span>{isEditMode ? "Updating Draft..." : "Saving Draft..."}</span>
      {:else}
        <span>{isEditMode ? "Update Draft" : "Save as Draft"}</span>
      {/if}
    </Button>

    {#if saveDraftError}
      <p class="text-xs text-red-600 font-medium text-center mt-2.5">
        {saveDraftError}
      </p>
    {/if}
  </div>
</div>
