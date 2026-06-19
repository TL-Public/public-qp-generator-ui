<script>
  import { createEventDispatcher } from "svelte";

  export let chaptersData = [];
  export let selections = [];
  export let expandedChapters = new Set();
  export let expandedTopics = new Set();
  export let selectionSidebar = null; // Optional: component to render above the table

  const dispatch = createEventDispatcher();

  // Helper functions for selection state (mirrored from parent)
  function isChapterSelected(chapterCode) {
    return selections.some((s) => s.code === chapterCode && s.type === "chapter");
  }

  function isTopicSelected(topicCode) {
    return selections.some((s) => s.code === topicCode && s.type === "topic");
  }

  function isSubtopicSelected(subtopicCode) {
    return selections.some((s) => s.code === subtopicCode && s.type === "subtopic");
  }

  function hasSelectedTopicsInChapter(chapter) {
    if (!chapter.topics) return false;
    return chapter.topics.some(
      (topic) =>
        isTopicSelected(topic.code) ||
        (topic.subtopics && topic.subtopics.some((st) => isSubtopicSelected(st.code)))
    );
  }

  function hasSelectedSubtopicsInTopic(topic) {
    if (!topic.subtopics) return false;
    return topic.subtopics.some((subtopic) => isSubtopicSelected(subtopic.code));
  }

  function getSelectedItemsForChapter(chapter) {
    const allTopics = chapter.topics || [];
    const allSubtopics = allTopics.flatMap((t) => t.subtopics || []);
    const selectedCodesInStore = new Set(selections.map((s) => s.code));

    const selectedTopics = allTopics.filter((t) => selectedCodesInStore.has(t.code));
    const selectedSubtopics = allSubtopics.filter((st) => selectedCodesInStore.has(st.code));

    return [...selectedTopics, ...selectedSubtopics];
  }

  // Event handlers
  function toggleChapter(event, chapterId) {
    event.preventDefault();
    dispatch("toggleChapter", { chapterId });
  }

  function toggleTopic(event, topicId) {
    event.preventDefault();
    dispatch("toggleTopic", { topicId });
  }

  function handleCheckboxChange(event, item, type) {
    dispatch("checkboxChange", { event, item, type });
  }

  function openSummaryModal(chapter) {
    dispatch("openSummary", { chapter });
  }
</script>

<div class="w-full">
  {#if selectionSidebar}
    <svelte:component this={selectionSidebar} on:highlightItem />
  {/if}

  <table class="min-w-full divide-y divide-gray-200">
    <thead class="bg-gray-50 sticky top-0 z-10">
      <tr>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Name
        </th>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Questions
        </th>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
          Selection Summary
        </th>
      </tr>
    </thead>
    <tbody class="bg-white divide-y divide-gray-200">
      {#each chaptersData as chapter}
        {@const chapterSelected = isChapterSelected(chapter.code)}
        {@const hasSelectedTopics = hasSelectedTopicsInChapter(chapter)}

        <!-- Chapter row -->
        <tr class="hover:bg-gray-50" data-item-code={chapter.code}>
          <td class="px-6 py-4">
            <div class="flex items-center space-x-2">
              <input
                type="checkbox"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={chapterSelected}
                disabled={hasSelectedTopics}
                on:change={(e) => handleCheckboxChange(e, chapter, "chapter")}
              />

              <button class="flex items-center space-x-2" on:click={(e) => toggleChapter(e, chapter.code)}>
                <svg
                  class="h-4 w-4 transition-transform duration-200 {expandedChapters.has(chapter.code) ? 'transform rotate-90' : ''}"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M6 6L14 10L6 14V6Z" />
                </svg>
                <span class="font-medium text-sm! text-gray-700">{chapter.name}</span>
              </button>

              {#if chapterSelected}
                <span class="text-sm text-gray-600">✓ Chapter Selected</span>
              {:else if hasSelectedTopics}
                <span class="text-sm text-gray-600">Partial Selection</span>
              {/if}
            </div>
          </td>
          <td class="px-6 py-4 text-sm text-gray-500">
            {chapter.question_count || 0}
          </td>
          <td class="px-6 py-4 text-sm text-gray-600">
            {#if chapterSelected}
              <span class="italic">Entire chapter selected</span>
            {:else if hasSelectedTopics}
              {@const selectedItems = getSelectedItemsForChapter(chapter)}
              {@const totalSelectable = (chapter.topics?.length || 0) + (chapter.topics?.flatMap((t) => t.subtopics || []).length || 0)}
              <button class="text-blue-600 hover:underline italic text-sm" on:click|preventDefault={() => openSummaryModal(chapter)}>
                {selectedItems.length} of {totalSelectable} items selected
              </button>
            {:else}
              <span class="italic text-gray-400">No selection</span>
            {/if}
          </td>
        </tr>

        {#if expandedChapters.has(chapter.code) && chapter.topics}
          {#each chapter.topics as topic}
            {@const topicSelected = isTopicSelected(topic.code)}
            {@const hasSelectedSubtopics = hasSelectedSubtopicsInTopic(topic)}

            <!-- Topic row -->
            <tr class="bg-gray-50" data-item-code={topic.code}>
              <td class="px-6 py-4 pl-12">
                <div class="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={topicSelected}
                    disabled={chapterSelected || hasSelectedSubtopics}
                    on:change={(e) => handleCheckboxChange(e, topic, "topic")}
                  />

                  <button class="flex items-center space-x-2" on:click={(e) => toggleTopic(e, topic.code)}>
                    {#if topic.subtopics && topic.subtopics.length > 0}
                      <svg
                        class="h-4 w-4 transition-transform duration-200 {expandedTopics.has(topic.code) ? 'transform rotate-90' : ''}"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M6 6L14 10L6 14V6Z" />
                      </svg>
                    {:else}
                      <div class="w-4"></div>
                    {/if}
                    <span class="text-sm text-gray-700">{topic.name}</span>
                  </button>

                  {#if chapterSelected}
                    <span class="text-xs text-gray-500 italic">(included in chapter)</span>
                  {:else if topicSelected}
                    <span class="text-sm text-gray-600">✓ Selected</span>
                  {:else if hasSelectedSubtopics}
                    <span class="text-sm text-gray-600">Partial</span>
                  {/if}
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-gray-500">
                {topic.question_count || 0}
              </td>
              <td class="px-6 py-4 text-sm text-gray-600">
                {#if chapterSelected}
                  <span class="italic text-gray-500">Included</span>
                {:else if topicSelected}
                  <span class="italic text-sm">Topic selected</span>
                {:else if hasSelectedSubtopics}
                  {@const selectedSubtopics = topic.subtopics?.filter((st) => isSubtopicSelected(st.code)) || []}
                  <span class="italic text-sm">
                    {selectedSubtopics.length} subtopic{selectedSubtopics.length !== 1 ? "s" : ""} selected
                  </span>
                {:else}
                  <span class="italic text-gray-400">-</span>
                {/if}
              </td>
            </tr>

            {#if expandedTopics.has(topic.code) && topic.subtopics}
              {#each topic.subtopics as subtopic}
                {@const subtopicSelected = isSubtopicSelected(subtopic.code)}

                <!-- Subtopic row -->
                <tr class="bg-gray-100" data-item-code={subtopic.code}>
                  <td class="px-6 py-4 pl-20">
                    <div class="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={subtopicSelected}
                        disabled={chapterSelected || topicSelected}
                        on:change={(e) => handleCheckboxChange(e, subtopic, "subtopic")}
                      />

                      <span class="text-sm text-gray-700">{subtopic.name}</span>

                      {#if chapterSelected}
                        <span class="text-xs text-gray-500 italic">(included in chapter)</span>
                      {:else if topicSelected}
                        <span class="text-xs text-gray-500 italic">(included in topic)</span>
                      {:else if subtopicSelected}
                        <span class="text-sm text-gray-600">✓ Selected</span>
                      {/if}
                    </div>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-500">
                    {subtopic.question_count || 0}
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-600">
                    {#if chapterSelected || topicSelected}
                      <span class="italic text-gray-500">Included</span>
                    {:else if subtopicSelected}
                      <span class="italic">Selected</span>
                    {:else}
                      <span class="italic text-gray-400">-</span>
                    {/if}
                  </td>
                </tr>
              {/each}
            {/if}
          {/each}
        {/if}
      {/each}
    </tbody>
  </table>
</div>