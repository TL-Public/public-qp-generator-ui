<script>
  import Button from "$lib/components/Button.svelte";

  export let setsCount = 1;
  export let setsOptions = [1, 2, 3, 4];
  export let versionsCount = 1;
  export let versionsOptions = [1, 2, 3, 4];
</script>

<div
  class="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200 transition-all space-y-6"
>
  <!-- Step Header -->
  <div class="flex items-center gap-3">
    <span
      class="w-8 h-8 rounded-full bg-primary/20 text-slate-700 font-bold text-sm flex items-center justify-center"
    >
      3
    </span>
    <h2 class="text-lg font-bold text-slate-900 tracking-tight">
      How many papers?
    </h2>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 gap-8">
    <!-- SETS -->
    <div>
      <label
        class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3"
      >
        SETS
      </label>
      <div class="flex flex-wrap items-center gap-2">
        {#each setsOptions as setNum}
          <Button
            btnType={setsCount === setNum ? "primary" : "secondary"}
            customClass="!px-4 !py-2 rounded-xl text-sm font-bold min-w-[46px]"
            on:click={() => (setsCount = setNum)}
          >
            {setNum}
          </Button>
        {/each}
      </div>
      <p class="text-xs text-slate-500 mt-2.5 leading-relaxed">
        Each set has different questions — for different sections or rows.
      </p>
    </div>

    <!-- VERSIONS PER SET -->
    <div>
      <label
        class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3"
      >
        VERSIONS PER SET
      </label>
      <div class="flex flex-wrap items-center gap-2">
        {#each versionsOptions as verNum}
          <Button
            btnType={versionsCount === verNum ? "primary" : "secondary"}
            customClass="!px-4 !py-2 rounded-xl text-sm font-bold min-w-[46px]"
            on:click={() => (versionsCount = verNum)}
          >
            {verNum}
          </Button>
        {/each}
      </div>
      <p class="text-xs text-slate-500 mt-2.5 leading-relaxed">
        Same questions, shuffled order — helps prevent copying.
      </p>
    </div>
  </div>
</div>
