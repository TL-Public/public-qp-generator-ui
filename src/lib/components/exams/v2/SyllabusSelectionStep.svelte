<script>
  import Dropdown from "$lib/components/Dropdown.svelte";
  import Button from "$lib/components/Button.svelte";
  import InlineNotification from "$lib/components/InlineNotification.svelte";
  import { Check, Pencil, X } from "@lucide/svelte";
  import { createEventDispatcher } from "svelte";

  export let classOptions = [];
  export let selectedClass = "";
  export let mediumOptions = [];
  export let selectedMedium = "";
  export let subjectOptions = [];
  export let selectedSubject = "";
  export let classSubjectLoading = { mediums: false, subjects: false };
  export let classSubjectError = { mediums: null, subjects: null };
  export let chaptersLoading = false;
  export let chaptersError = null;
  export let selectedChapters = [];
  export let areAllChaptersSelected = false;
  export let availableQuestionCount = 0;
  export let qtn_codes_to_exclude = [];
  export let retryMediumsHandler = () => {};
  export let retrySubjectsHandler = () => {};
  export let retryChaptersHandler = () => {};

  const dispatch = createEventDispatcher();

  function handleOpenQuestionPool() {
    dispatch("openQuestionPoolModal");
  }

  function handleOpenChapterModal() {
    dispatch("openChapterModal");
  }

  function handleRemoveChapter(chapterId) {
    dispatch("removeChapter", chapterId);
  }
</script>

<div
  class="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200 transition-all space-y-6"
>
  <!-- Step Header -->
  <div class="flex items-center justify-between border-b border-gray-100 pb-4">
    <div class="flex items-center gap-3">
      <span
        class="w-8 h-8 rounded-full bg-primary/20 text-slate-700 font-bold text-sm flex items-center justify-center"
      >
        1
      </span>
      <h2 class="text-lg font-bold text-slate-900 tracking-tight">
        Choose Syllabus
      </h2>
    </div>
  </div>

  <div class="space-y-6">
    {#if classSubjectError.mediums}
      <InlineNotification
        kind="error"
        title="Failed to load mediums"
        subtitle={classSubjectError.mediums}
        action={{
          text: "Retry",
          handler: retryMediumsHandler,
        }}
        hideCloseButton={true}
      />
    {/if}

    {#if classSubjectError.subjects}
      <InlineNotification
        kind="error"
        title="Failed to load subjects"
        subtitle={classSubjectError.subjects}
        action={{
          text: "Retry",
          handler: retrySubjectsHandler,
        }}
        hideCloseButton={true}
      />
    {/if}

    <!-- Class, Medium & Subject Row -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div>
        <label
          class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2"
        >
          CLASS
        </label>
        <Dropdown
          options={classOptions}
          bind:value={selectedClass}
          placeholder="Select Class"
        />
      </div>

      <div>
        <label
          class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2"
        >
          MEDIUM
        </label>
        <Dropdown
          options={mediumOptions}
          bind:value={selectedMedium}
          disabled={classSubjectLoading.mediums}
          placeholder={classSubjectLoading.mediums
            ? "Loading..."
            : classSubjectError.mediums
              ? "Error loading mediums"
              : "Select Medium"}
        />
      </div>

      <div>
        <label
          class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2"
        >
          SUBJECT
        </label>
        <Dropdown
          options={subjectOptions}
          bind:value={selectedSubject}
          disabled={classSubjectLoading.subjects ||
            subjectOptions.length === 0}
          placeholder={classSubjectLoading.subjects
            ? "Loading..."
            : classSubjectError.subjects
              ? "Error loading subjects"
              : "Select Subject"}
        />
      </div>
    </div>

    <!-- Chapters Container -->
    <div>
      <div class="flex items-center justify-between mb-2">
        <label
          class="block text-xs font-bold text-slate-500 uppercase tracking-wider"
        >
          EXAM SYLLABUS
        </label>
        <span
          class="text-xs text-slate-500 font-medium flex items-center"
        >
          {#if chaptersLoading}
            Loading syllabus chapters...
          {:else if chaptersError}
            <span
              class="text-red-600 font-semibold flex items-center gap-1.5"
            >
              Failed to load chapters
            </span>
          {:else if !selectedClass || !selectedMedium || !selectedSubject}
            Select Class, Medium & Subject to load chapters
          {:else}
            <span>
              {selectedChapters.length} chapters selected · {availableQuestionCount}
              questions available
              {#if qtn_codes_to_exclude.length > 0}
                · <span class="text-red-600 font-semibold"
                  >{qtn_codes_to_exclude.length} excluded</span
                >
              {/if}
            </span>

            <button
              type="button"
              on:click={handleOpenQuestionPool}
              class="font-bold text-blue-700 hover:underline cursor-pointer ml-2 bg-transparent border-0 p-0 text-xs inline-block"
            >
              Review question pool
            </button>
          {/if}
        </span>
      </div>

      {#if chaptersError}
        <div class="mb-3">
          <InlineNotification
            kind="error"
            title="Failed to load syllabus chapters"
            subtitle={chaptersError}
            action={{ text: "Retry", handler: retryChaptersHandler }}
            hideCloseButton={true}
          />
        </div>
      {/if}

      <div
        class="bg-blue-100 border border-gray-200 rounded-xl p-4 sm:p-5"
      >
        <div class="flex flex-wrap items-center gap-2 mb-3">
          {#if areAllChaptersSelected}
            <span
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-slate-800 border border-slate-200 shadow-xs"
            >
              <Check class="w-3.5 h-3.5 text-emerald-600 font-bold" />
              All chapters selected
            </span>
          {:else if selectedChapters.length > 0}
            {#each selectedChapters as chapter}
              <span
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white text-slate-700 border border-slate-200 shadow-xs"
              >
                {chapter.displayText}
                <button
                  type="button"
                  on:click={() => handleRemoveChapter(chapter.id)}
                  class="text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  aria-label="Remove chapter"
                >
                  <X class="w-3.5 h-3.5" />
                </button>
              </span>
            {/each}
          {:else}
            <span class="text-xs text-slate-400 italic"
              >No chapters selected yet</span
            >
          {/if}
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <!-- Edit Chapters Button -->
          <Button
            btnType="secondary"
            customClass="!rounded-full !px-4 !py-1.5 !text-xs text-blue-700 bg-white border border-blue-200 hover:border-blue-300 hover:bg-blue-50 transition shadow-2xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!selectedClass ||
              !selectedMedium ||
              !selectedSubject ||
              chaptersLoading}
            on:click={handleOpenChapterModal}
          >
            <Pencil class="w-3.5 h-3.5 mr-1" />
            Edit
          </Button>
        </div>
      </div>
    </div>
  </div>
</div>
