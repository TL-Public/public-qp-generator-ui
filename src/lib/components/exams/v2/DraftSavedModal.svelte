<script>
  import PortalModal from "$lib/components/PortalModal.svelte";
  import Button from "$lib/components/Button.svelte";
  import { X } from "@lucide/svelte";
  import { createEventDispatcher } from "svelte";

  export let open = false;

  const dispatch = createEventDispatcher();

  function handleClose() {
    dispatch("close");
  }

  function handleLeave() {
    dispatch("leave");
  }
</script>

{#if open}
  <PortalModal>
    <div
      class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5 border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
    >
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div class="flex items-center gap-2 text-emerald-600">
          <span class="text-xl font-bold">✓</span>
          <h3 class="text-base font-bold text-slate-900">
            Draft Saved Successfully
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

      <div class="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
        Your question paper draft has been saved. Would you like to continue drafting?
      </div>

      <div class="flex items-center justify-end gap-3 pt-2">
        <Button
          btnType="secondary"
          customClass="!px-4 !py-2 rounded-xl text-xs font-semibold"
          on:click={handleLeave}
        >
          Leave
        </Button>
        <Button
          btnType="primary"
          customClass="!px-5 !py-2 rounded-xl font-bold text-xs"
          on:click={handleClose}
        >
          Continue editing
        </Button>
      </div>
    </div>
  </PortalModal>
{/if}
