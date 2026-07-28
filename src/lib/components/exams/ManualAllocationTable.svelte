<script>
  import { createEventDispatcher } from "svelte";
  import { Trash2 } from "@lucide/svelte";

  export let selections = []; // [{ code, name, type, qn_count }]
  export let chaptersData = []; // Full hierarchy tree from API
  export let totalQuestions = 40;
  export let isAutoAllocation = true;

  const dispatch = createEventDispatcher();

  // Helper map for quick lookup of available questions from chaptersData
  $: availableMap = buildAvailableMap(chaptersData);

  function buildAvailableMap(data) {
    const map = new Map();
    if (!Array.isArray(data)) return map;

    data.forEach((ch) => {
      const chCount = ch.question_count ?? 0;
      map.set(ch.code, chCount);

      if (Array.isArray(ch.topics)) {
        ch.topics.forEach((top) => {
          const topCount = top.question_count ?? 0;
          map.set(top.code, topCount);

          if (Array.isArray(top.subtopics)) {
            top.subtopics.forEach((sub) => {
              const subCount = sub.question_count ?? 0;
              map.set(sub.code, subCount);
            });
          }
        });
      }
    });

    return map;
  }

  // Build hierarchical rows matching SelectedContentTable pattern
  $: tableRows = buildTableRows(chaptersData, selections);

  function buildTableRows(data, sel) {
    if (!Array.isArray(sel) || sel.length === 0) {
      return [];
    }

    const selectedMap = new Map(sel.map((s) => [s.code, s]));

    if (!Array.isArray(data) || data.length === 0) {
      return sel.map((s) => ({
        code: s.code,
        name: s.name,
        type: s.type || "chapter",
        level: s.type === "topic" ? 1 : 0,
        isSelected: true,
        isPlaceholder: false,
        questionAvailable: availableMap.get(s.code) || s.questionAvailable || 0,
        qn_count: s.qn_count ?? 0,
        item: s,
        selectedTopicCount: 0,
        totalTopicCount: 0,
      }));
    }

    const rows = [];

    data.forEach((ch) => {
      const chSelection = selectedMap.get(ch.code);
      const chTopics = Array.isArray(ch.topics) ? ch.topics : [];

      const selectedTopics = chTopics.filter((t) => selectedMap.has(t.code));

      const isChapterSelected = !!chSelection;
      const hasSelectedTopic = selectedTopics.length > 0;

      if (isChapterSelected || hasSelectedTopic) {
        // Add Chapter Row (Level 0)
        rows.push({
          code: ch.code,
          name: ch.name,
          type: "chapter",
          level: 0,
          isSelected: isChapterSelected,
          isPlaceholder: !isChapterSelected,
          questionAvailable: ch.question_count ?? 0,
          qn_count: chSelection ? (chSelection.qn_count ?? 0) : 0,
          item: chSelection || {
            code: ch.code,
            name: ch.name,
            type: "chapter",
          },
          selectedTopicCount: selectedTopics.length,
          totalTopicCount: chTopics.length,
        });

        // Add Topic Rows (Level 1)
        chTopics.forEach((top) => {
          const topSelection = selectedMap.get(top.code);
          const isTopicSelected = !!topSelection;

          if (isTopicSelected) {
            rows.push({
              code: top.code,
              name: top.name,
              type: "topic",
              level: 1,
              isSelected: true,
              isPlaceholder: false,
              questionAvailable: top.question_count ?? 0,
              qn_count: topSelection.qn_count ?? 0,
              item: topSelection,
              selectedTopicCount: 0,
              totalTopicCount: 0,
            });
          }
        });
      }
    });

    // Fallback for any selected item not in chaptersData tree
    const processedCodes = new Set(rows.map((r) => r.code));
    sel.forEach((s) => {
      if (!processedCodes.has(s.code)) {
        rows.push({
          code: s.code,
          name: s.name,
          type: s.type || "chapter",
          level: s.type === "topic" ? 1 : 0,
          isSelected: true,
          isPlaceholder: false,
          questionAvailable:
            availableMap.get(s.code) || s.questionAvailable || 0,
          qn_count: s.qn_count ?? 0,
          item: s,
          selectedTopicCount: 0,
          totalTopicCount: 0,
        });
      }
    });

    return rows;
  }

  // Calculate allocation summary numbers
  $: totalRequired = Number(totalQuestions) || 0;

  $: totalAvailable = selections.reduce((sum, item) => {
    return sum + (availableMap.get(item.code) || item.questionAvailable || 0);
  }, 0);

  $: totalAllocated = selections.reduce((sum, item) => {
    return sum + (Number(item.qn_count) || 0);
  }, 0);

  $: remainingToAllocate = totalRequired - totalAllocated;
  $: hasAvailableError = totalAvailable < totalRequired;

  // Question count modification handlers
  function handleInputChange(item, event) {
    const val = parseInt(event.target.value, 10);
    const available =
      availableMap.get(item.code) || item.questionAvailable || 999;
    const sanitized = isNaN(val) ? 0 : Math.max(0, Math.min(val, available));

    selections = selections.map((s) =>
      s.code === item.code ? { ...s, qn_count: sanitized } : s,
    );

    dispatch("change", { selections });
  }

  function incrementQuestions(item) {
    const current = Number(item.qn_count) || 0;
    const available =
      availableMap.get(item.code) || item.questionAvailable || 999;
    if (current < available) {
      selections = selections.map((s) =>
        s.code === item.code ? { ...s, qn_count: current + 1 } : s,
      );
      dispatch("change", { selections });
    }
  }

  function decrementQuestions(item) {
    const current = Number(item.qn_count) || 0;
    if (current > 0) {
      selections = selections.map((s) =>
        s.code === item.code ? { ...s, qn_count: current - 1 } : s,
      );
      dispatch("change", { selections });
    }
  }

  function handleRemoveItem(itemCode) {
    selections = selections.filter((s) => s.code !== itemCode);
    dispatch("remove", { code: itemCode, selections });
    dispatch("change", { selections });
  }
</script>

<div class="space-y-4">
  <!-- Header with Allocation Summary Card -->
  <div
    class="border border-slate-200 bg-white p-5 rounded-2xl shadow-xs space-y-3"
  >
    <!--<div class="flex items-center justify-between">
     <div class="space-y-0.5">
         <p class="text-sm font-bold text-slate-900">
          {isAutoAllocation
            ? "Auto Allocation Summary"
            : "Manual Question Allocation"}
        </p> 
        <p class="text-xs text-slate-500">
          {isAutoAllocation
            ? "Questions are automatically distributed by the backend logic across selected content."
            : "Specify how many questions to allocate for each selected chapter or topic."}
        </p>
      </div> 
    </div>-->

    <!-- Allocation Summary Numbers -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
      <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
        <span class="text-slate-500 font-medium block">Required</span>
        <span class="text-sm font-bold text-slate-900">{totalRequired}</span>
      </div>

      <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
        <span class="text-slate-500 font-medium block">Available</span>
        <span class="text-sm font-bold text-slate-900">{totalAvailable}</span>
      </div>

      {#if !isAutoAllocation}
        <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <span class="text-slate-500 font-medium block">Allocated</span>
          <span class="text-sm font-bold text-slate-900">{totalAllocated}</span>
        </div>

        <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <span class="text-slate-500 font-medium block">Remaining</span>
          <span
            class="text-sm font-bold {remainingToAllocate < 0
              ? 'text-red-600'
              : remainingToAllocate > 0
                ? 'text-amber-600'
                : 'text-green-600'}"
          >
            {remainingToAllocate}
          </span>
        </div>
      {/if}
    </div>

    <!-- Status Alert Banners -->
    {#if hasAvailableError}
      <div
        class="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-3 font-medium"
      >
        ⚠️ Only {totalAvailable} questions available in selected content. You need
        {totalRequired} questions. Please select more chapters/topics.
      </div>
    {:else if !isAutoAllocation && remainingToAllocate > 0}
      <div
        class="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3 font-medium"
      >
        📝 {remainingToAllocate} question(s) remaining to be allocated across selected
        items.
      </div>
    {:else if !isAutoAllocation && remainingToAllocate === 0}
      <div
        class="text-xs text-green-700 bg-green-50 border border-green-200 rounded-xl p-3 font-medium"
      >
        ✓ Perfect allocation! All {totalRequired} questions are allocated.
      </div>
    {:else if !isAutoAllocation && remainingToAllocate < 0}
      <div
        class="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-3 font-medium"
      >
        ⚠️ Overallocated by {Math.abs(remainingToAllocate)} question(s). Please reduce
        numbers.
      </div>
    {/if}
  </div>

  <!-- Selected Content Table -->
  <div
    class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs"
  >
    {#if tableRows.length === 0}
      <div class="px-6 py-8 text-center text-slate-500 text-xs">
        No content selected yet. Click "Add or edit chapters" to select syllabus
        content.
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200 text-xs">
          <thead class="bg-slate-50">
            <tr>
              <th
                class="px-5 py-3 text-left font-bold text-slate-600 uppercase tracking-wider"
              >
                Selected Content
              </th>
              <th
                class="px-4 py-3 text-center font-bold text-slate-600 uppercase tracking-wider"
              >
                Questions Available
              </th>
              <th
                class="px-4 py-3 text-center font-bold text-slate-600 uppercase tracking-wider"
              >
                Questions to Add
              </th>
              <th
                class="px-4 py-3 text-center font-bold text-slate-600 uppercase tracking-wider w-16"
              >
                Action
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 bg-white">
            {#each tableRows as row (row.code)}
              {@const availCount = row.questionAvailable}
              {@const currentAllocated = Number(row.qn_count) || 0}
              <tr
                class="{row.level === 0
                  ? 'bg-white'
                  : 'bg-slate-50/50'} {row.isPlaceholder
                  ? 'italic opacity-80'
                  : ''} hover:bg-slate-50 transition-colors"
              >
                <!-- Content Name & Badge with Hierarchy Indentation -->
                <td
                  class="px-5 py-3.5"
                  style="padding-left: {20 + row.level * 24}px;"
                >
                  <div class="flex items-center gap-2">
                    {#if row.level > 0}
                      <span class="text-slate-400 font-mono text-xs">↳</span>
                    {/if}
                    <div>
                      <div class="flex items-center gap-1.5">
                        <span
                          class={row.isSelected
                            ? "font-semibold text-slate-900"
                            : "font-medium text-slate-500"}
                        >
                          {row.name}
                        </span>
                        {#if row.isPlaceholder}
                          <span
                            class="text-xs text-slate-400 font-normal italic"
                          >
                            (not individually selected)
                          </span>
                        {/if}
                      </div>

                      <!-- Type badge & selection status -->
                      <div class="mt-1 flex items-center gap-2">
                        <span
                          class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider {row.type ===
                          'chapter'
                            ? 'bg-blue-100 text-blue-800'
                            : row.type === 'topic'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-purple-100 text-purple-800'}"
                        >
                          {row.type}
                        </span>

                        {#if row.isSelected}
                          <span class="text-[11px] text-green-600 font-medium"
                            >Selected</span
                          >
                        {:else if row.selectedTopicCount > 0}
                          <span class="text-[11px] text-blue-600 font-medium">
                            {row.selectedTopicCount} of {row.totalTopicCount} topics
                            selected
                          </span>
                        {/if}
                      </div>
                    </div>
                  </div>
                </td>

                <!-- Questions Available -->
                <td
                  class="px-4 py-3.5 text-center font-semibold text-slate-700"
                >
                  {availCount}
                </td>

                <!-- Questions to Add -->
                <td class="px-4 py-3.5 text-center">
                  {#if isAutoAllocation}
                    <span
                      class="text-[11px] text-slate-400 bg-slate-100 px-3 py-1 rounded-full font-medium"
                    >
                      Auto Allocated
                    </span>
                  {:else if row.isSelected}
                    <div class="flex items-center justify-center">
                      <div
                        class="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white shadow-2xs"
                      >
                        <button
                          type="button"
                          class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                          on:click={() => decrementQuestions(row.item)}
                          disabled={currentAllocated <= 0}
                          title="Decrease questions"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min="0"
                          max={availCount}
                          value={currentAllocated}
                          class="w-14 px-2 py-1 text-xs text-center font-semibold border-0 focus:ring-1 focus:ring-primary focus:outline-none"
                          on:input={(e) => handleInputChange(row.item, e)}
                        />
                        <button
                          type="button"
                          class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                          on:click={() => incrementQuestions(row.item)}
                          disabled={currentAllocated >= availCount}
                          title="Increase questions"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  {:else}
                    <span
                      class="text-xs text-slate-400 font-normal italic bg-slate-100 px-3 py-1 rounded-full"
                    >
                      -
                    </span>
                  {/if}
                </td>

                <!-- Remove Action -->
                <td class="px-4 py-3.5 text-center">
                  {#if row.isSelected}
                    <button
                      type="button"
                      class="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition cursor-pointer"
                      on:click={() => handleRemoveItem(row.code)}
                      title="Remove {row.name}"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  {:else}
                    <span class="text-slate-300">−</span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>
