<script>
  import PortalModal from "$lib/components/PortalModal.svelte";
  import Button from "$lib/components/Button.svelte";
  import ContentHierarchyTable from "$lib/components/ContentHierarchyTable.svelte";
  import { X, Loader2 } from "@lucide/svelte";
  import { createEventDispatcher } from "svelte";

  export let open = false;
  export let subjectName = "";
  export let selectedClass = "";
  export let mediumName = "";
  export let loading = false;
  export let error = null;
  export let chaptersData = [];
  export let selections = [];
  export let expandedChapters = new Set();
  export let expandedTopics = new Set();
  export let isAllModalChaptersSelected = false;

  const dispatch = createEventDispatcher();

  function handleClose() {
    dispatch("close");
  }

  function handleToggleChapter(detail) {
    dispatch("toggleChapter", detail);
  }

  function handleToggleTopic(detail) {
    dispatch("toggleTopic", detail);
  }

  function handleCheckboxChange(detail) {
    dispatch("checkboxChange", detail);
  }

  function handleToggleSelectAll() {
    dispatch("toggleSelectAll");
  }

  function handleApply() {
    dispatch("apply");
  }
</script>

{#if open}
  <PortalModal>
    <div
      class="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
    >
      <!-- Modal Header -->
      <div
        class="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50"
      >
        <div>
          <h3 class="text-lg font-bold text-slate-900">
            Select Chapters & Topics
          </h3>
          <p class="text-xs text-slate-500 mt-0.5">
            Choose chapters and topics for {subjectName} (Class {selectedClass}
            - {mediumName})
          </p>
        </div>
        <button
          type="button"
          on:click={handleClose}
          class="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-6 overflow-y-auto flex-1">
        {#if loading}
          <div
            class="flex flex-col items-center justify-center py-12 space-y-3"
          >
            <Loader2 class="w-8 h-8 text-primary animate-spin" />
            <p class="text-sm font-medium text-slate-600">
              Loading syllabus chapters & topics...
            </p>
          </div>
        {:else if error}
          <div
            class="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-200"
          >
            {error}
          </div>
        {:else if !chaptersData || chaptersData.length === 0}
          <div class="text-center py-12 text-slate-500 text-sm">
            No content available for Class {selectedClass}, {subjectName}
            ({mediumName}).
          </div>
        {:else}
          <ContentHierarchyTable
            {chaptersData}
            {selections}
            {expandedChapters}
            {expandedTopics}
            on:toggleChapter={(e) => handleToggleChapter(e.detail)}
            on:toggleTopic={(e) => handleToggleTopic(e.detail)}
            on:checkboxChange={(e) => handleCheckboxChange(e.detail)}
          />
        {/if}
      </div>

      <!-- Modal Footer -->
      <div
        class="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between"
      >
        <span class="text-xs font-semibold text-slate-600">
          {selections.filter((s) => s.type === "chapter").length} chapters, {selections.filter(
            (s) => s.type === "topic",
          ).length} topics selected
        </span>
        <div class="flex items-center gap-3">
          <Button
            btnType="secondary"
            customClass="!px-4 !py-2.5 rounded-xl font-semibold text-xs"
            on:click={handleToggleSelectAll}
          >
            {isAllModalChaptersSelected ? "Clear all" : "Select all"}
          </Button>
          <Button
            btnType="primary"
            customClass="!px-6 !py-2.5 rounded-xl font-bold text-xs"
            on:click={handleApply}
          >
            Apply Selection
          </Button>
        </div>
      </div>
    </div>
  </PortalModal>
{/if}
