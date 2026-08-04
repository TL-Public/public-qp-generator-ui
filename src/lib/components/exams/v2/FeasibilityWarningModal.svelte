<script>
  import PortalModal from "$lib/components/PortalModal.svelte";
  import Button from "$lib/components/Button.svelte";
  import { X } from "@lucide/svelte";
  import { createEventDispatcher } from "svelte";

  export let open = false;
  export let warningData = null;
  export let isTotalInsufficient = false;

  const dispatch = createEventDispatcher();

  function handleClose() {
    dispatch("close");
  }

  function handleProceed() {
    dispatch("proceed");
  }
</script>

{#if open && warningData}
  <PortalModal>
    <div
      class="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-5 border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
    >
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div class="flex items-center gap-2 text-amber-600">
          <span class="text-xl">⚠️</span>
          <h3 class="text-base font-bold text-slate-900">
            {isTotalInsufficient
              ? "Insufficient Questions Available"
              : "Difficulty Distribution Requirement"}
          </h3>
        </div>
        <button
          type="button"
          on:click={handleClose}
          class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
        >
          <X class="w-4.5 h-4.5" />
        </button>
      </div>

      <!-- Description -->
      <div class="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-medium leading-relaxed">
        {#if isTotalInsufficient}
          There are not enough questions in the question bank for the selected syllabus to meet the required distribution requirement.
        {:else}
          The question bank does not have enough questions to meet your requested difficulty distribution requirement.
        {/if}
      </div>

      {#if !isTotalInsufficient}
        <!-- Comparison Table -->
        <div class="border border-slate-200 rounded-xl overflow-hidden text-xs">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th class="p-3">Difficulty</th>
                <th class="p-3">Required</th>
                <th class="p-3 text-blue-700">Suggested based on availability</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
              {#if warningData.requested?.Easy}
                <tr>
                  <td class="p-3 font-semibold text-slate-900">Easy</td>
                  <td class="p-3">
                    {warningData.requested.Easy.count} qns ({warningData.requested.Easy.pct}%)
                  </td>
                  <td class="p-3 font-semibold text-blue-700">
                    {warningData.proposed?.Easy?.count ?? '-'} qns ({warningData.proposed?.Easy?.pct ?? '-'}%)
                  </td>
                </tr>
              {/if}
              {#if warningData.requested?.Medium}
                <tr>
                  <td class="p-3 font-semibold text-slate-900">Medium</td>
                  <td class="p-3">
                    {warningData.requested.Medium.count} qns ({warningData.requested.Medium.pct}%)
                  </td>
                  <td class="p-3 font-semibold text-blue-700">
                    {warningData.proposed?.Medium?.count ?? '-'} qns ({warningData.proposed?.Medium?.pct ?? '-'}%)
                  </td>
                </tr>
              {/if}
              {#if warningData.requested?.Hard}
                <tr>
                  <td class="p-3 font-semibold text-slate-900">Hard</td>
                  <td class="p-3">
                    {warningData.requested.Hard.count} qns ({warningData.requested.Hard.pct}%)
                  </td>
                  <td class="p-3 font-semibold text-blue-700">
                    {warningData.proposed?.Hard?.count ?? '-'} qns ({warningData.proposed?.Hard?.pct ?? '-'}%)
                  </td>
                </tr>
              {/if}
            </tbody>
          </table>
        </div>

        <!-- Redistribution Notes -->
        {#if Array.isArray(warningData.redistribution_notes) && warningData.redistribution_notes.length > 0}
          <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
            <div class="font-bold text-slate-700 flex items-center gap-1.5">
              <span>📌</span>
              <span>Redistribution Notes</span>
            </div>
            <ul class="space-y-1 text-slate-600 pl-4 list-disc marker:text-slate-400">
              {#each warningData.redistribution_notes as note}
                <li class="leading-relaxed">{note}</li>
              {/each}
            </ul>
          </div>
        {/if}
      {/if}

      <!-- Actions -->
      <div class="flex items-center justify-end gap-3 pt-2">
        <Button
          btnType="secondary"
          customClass="!px-4 !py-2 rounded-xl text-xs font-semibold"
          on:click={handleClose}
        >
          Close & Edit
        </Button>

        {#if !isTotalInsufficient && warningData.proposed}
          <Button
            btnType="primary"
            customClass="!px-5 !py-2 rounded-xl font-bold text-xs"
            on:click={handleProceed}
          >
            Proceed with Suggested Distribution
          </Button>
        {/if}
      </div>
    </div>
  </PortalModal>
{/if}
