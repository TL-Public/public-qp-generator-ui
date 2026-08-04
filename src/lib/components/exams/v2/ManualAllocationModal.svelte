<script>
  import PortalModal from "$lib/components/PortalModal.svelte";
  import Button from "$lib/components/Button.svelte";
  import ManualAllocationTable from "../ManualAllocationTable.svelte";
  import { X } from "@lucide/svelte";
  import { createEventDispatcher } from "svelte";

  export let open = false;
  export let subjectName = "";
  export let selectedClass = "";
  export let mediumName = "";
  export let selections = [];
  export let chaptersData = [];
  export let questionCount = 0;
  export let isAutoAllocation = true;
  export let setsCount = 1;

  const dispatch = createEventDispatcher();

  function handleClose() {
    dispatch("close");
  }

  function handleRemove(detail) {
    dispatch("remove", detail);
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
            Manual Question Allocation
          </h3>
          <p class="text-xs text-slate-500 mt-0.5">
            Specify question allocation across selected chapters and topics for {subjectName}
            (Class {selectedClass} - {mediumName})
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
        <ManualAllocationTable
          bind:selections
          {chaptersData}
          totalQuestions={questionCount}
          {isAutoAllocation}
          {setsCount}
          on:remove={(e) => handleRemove(e.detail)}
        />
      </div>

      <!-- Modal Footer -->
      <div
        class="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between"
      >
        <span class="text-xs font-semibold text-slate-600">
          Target: {questionCount * setsCount} questions ({setsCount} set{setsCount >
          1
            ? "s"
            : ""} × {questionCount}) · Allocated: {selections.reduce(
            (sum, s) => sum + (Number(s.qn_count) || 0),
            0,
          )} / {questionCount * setsCount}
        </span>
        <Button
          btnType="primary"
          customClass="!px-6 !py-2.5 rounded-xl font-bold text-xs"
          on:click={handleClose}
        >
          Done
        </Button>
      </div>
    </div>
  </PortalModal>
{/if}
