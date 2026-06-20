<script>
  import { createEventDispatcher } from "svelte";
  import { browser } from "$app/environment";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";

  import { api } from "$lib/utils/api.js";
  import { selectedContentStore } from "$lib/stores/selectedContentStore.js";
  // import SelectionSidebar from "./SelectionSidebar.svelte";
  import SelectionSidebar from "$lib/components/SelectionSideBar.svelte";
  import SelectionSummaryModal from "./SelectionSummaryModal.svelte";

  import Tabs from "./TabTable/Tabs.svelte";
  import Tab from "./TabTable/Tab.svelte";
  import TabPanel from "./TabTable/TabPanel.svelte";
  import MockQuestionsTable from "./MockQuestionsTable.svelte";
  import SelectedContentTable from "./SelectedContentTable.svelte";
  import ContentHierarchyTable from "./ContentHierarchyTable.svelte";
  import {
    decodeHTMLEntities,
    cleanQuestionText,
  } from "$lib/utils/textUtils.js";
  import RemovedQuestionsTable from "./RemovedQuestionsTable.svelte";

  export let examClass = "";
  export let examSubject = ""; // exam subject code
  export let examMedium = ""; // same as examMedium
  export let totalQuestions = "";
  export let examTitle = "";

  export let examMode = "";
  export let totalTime = "";

  export let numberOfVersions = "";
  export let numberOfSets = "";

  export let showQuestions = false;
  export let activeTab = "selected-content";
  export let fetchedQuestions = [];

  // Draft saving props (forwarded to SelectedContentTable)
  export let savingDraft = false;
  export let draftSaveError = "";
  export let draftSaveSuccess = "";

  let navigationHistory = [];

  $: if (browser && $page.url.hash) {
    handleNavigation($page.url.hash);
  }
  function handleNavigation(hash) {
    switch (hash) {
      case "#content-selection":
        showQuestions = false;
        activeTab = "questions";
        break;
      case "#questions":
        if (selections.length > 0 && fetchedQuestions.length > 0) {
          showQuestions = true;
          activeTab = "questions";
        }
        break;
      case "#selected-content":
        if (selections.length > 0 && fetchedQuestions.length > 0) {
          showQuestions = true;
          activeTab = "selected-content";
        }
        break;
    }
  }
  function handleBackToContentSelection() {
    showQuestions = false;
    activeTab = "questions";
    // update hash
    if (browser) {
      goto("#content-selection", { replaceState: true, noScroll: true });
    }
    dispatch("backToContentSelection");
  }
  //  NEW: Add prop for navigation control
  export let navigateToReview = false;

  const dispatch = createEventDispatcher();

  let isLoading = false;
  let error = null;
  let chaptersData = [];
  let expandedChapters = new Set();
  let expandedTopics = new Set();

  // For summary modal
  let showSummaryModal = false;
  let summaryModalContent = { chapterName: "", items: [] };

  // Add store subscription to track selections
  let selections = [];
  let lastFetchedSelections = null;
  selectedContentStore.subscribe((store) => {
    selections = store.selections;
  });

  $: hasContentChanged =
    JSON.stringify(selections) !== JSON.stringify(lastFetchedSelections);

  $: {
    if (examClass && examSubject && examMedium) {
      loadChapters();
    }
  }

  // get the questions from the api
  let selectionTypeForChapterOrCode = "";
  let selectionCodes = [];
  let questionIsLoading = true;

  async function getSelectedChaptersAndTopics() {
    // get the chapters list
    const allSelections = selectedContentStore.getSelections();

    const chapterSelections = allSelections.filter((item) => {
      return item.type === "chapter";
    });
    const topicSelections = allSelections.filter((item) => {
      return item.type === "topic";
    });

    return {
      getChapters: chapterSelections,
      getTopics: topicSelections,
    };
  }



  // this function will load take the chapters and topics
  // fetched from the store and then will be used in api calls
  // the response we will recieve will be of an aray with all questions
  // this function will be used in handleFetchQuestions.
  async function loadQuestions(chapters, topics) {
    error = null;
    questionIsLoading = true;

    try {
      const apiCalls = [];
      if (chapters && chapters.length > 0) {
        const chapterCodes = chapters.map((c) => c.code).join(",");
        apiCalls.push(
          api.questions.getByGroupCodes({
            type: "chapter",
            codes: chapterCodes,
          }),
        );
      }
      if (topics && topics.length > 0) {
        const topicCodes = topics.map((t) => t.code).join(",");
        apiCalls.push(
          api.questions.getByGroupCodes({
            type: "topic",
            codes: topicCodes,
          }),
        );
      }
      if (apiCalls.length === 0) {
        // Clear previous questions if needed, e.g., questions = [];
        return;
      }
      const responses = await Promise.all(apiCalls);
      let allQuestions = [];
      for (const response of responses) {
        if (response.error) throw new Error(response.error) || "API ERROR";
        if (response.data && response.data.qns) {
          // Clean each question's text fields
          const cleanedQuestions = response.data.qns.map(cleanQuestionText);
          allQuestions = [...allQuestions, ...cleanedQuestions];
        }
      }
      return allQuestions;
    } catch (err) {
      error = err.message;
    } finally {
      questionIsLoading = false;
    }
  }

  // get the chapters from the api
  async function loadChapters() {
    isLoading = true;
    error = null;
    try {
      const response = await api.chapterTopics.getAll({
        standard: examClass,
        subject_code: examSubject,
        medium_code: examMedium,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      chaptersData = response.data.data;
    } catch (err) {
      error = err.message;
    } finally {
      isLoading = false;
    }
  }

  function toggleChapter(event, chapterId) {
    event.preventDefault();
    if (expandedChapters.has(chapterId)) {
      expandedChapters.delete(chapterId);
    } else {
      expandedChapters.add(chapterId);
    }
    expandedChapters = expandedChapters;
  }

  function toggleTopic(event, topicId) {
    event.preventDefault();
    if (expandedTopics.has(topicId)) {
      expandedTopics.delete(topicId);
    } else {
      expandedTopics.add(topicId);
    }
    expandedTopics = expandedTopics;
  }


  // function to fetch the questions and map with table
  async function handleFetchQuestions(event) {
    event.preventDefault();

    const response = await getSelectedChaptersAndTopics(); // fetch the selected chapters and topics from store

    const { getChapters, getTopics } = response;
    const allQuestions = await loadQuestions(getChapters, getTopics);

    if (allQuestions && allQuestions.length > 0) {
      fetchedQuestions = allQuestions.map((allQuestion) => {
        return {
          id: allQuestion.code,
          text: allQuestion.text,
          type: allQuestion.type,
          marks: allQuestion.marks,
          difficulty: allQuestion.difficulty_level,
          parent: {
            name: allQuestion.grp_type_name,
            type: allQuestion.grp_type,
          },
        };
      });

      selectedContentStore.setQuestions(fetchedQuestions);
      lastFetchedSelections = JSON.parse(JSON.stringify(selections));
      showQuestions = true;

      activeTab = "selected-content";

      //  Set hash for questions view
      // if (browser) {
      //   goto("#questions", { replaceState: true, noScroll: true });
      // }
      dispatch("fetchQuestions", { questions: fetchedQuestions });
    } else {
      fetchedQuestions = [];
    }
  }

  function handleQuestionRemoved(event) {
    const { id, removed, remainingQuestions } = event.detail;

    // Update the fetched questions array
    if (removed) {
      fetchedQuestions = fetchedQuestions.filter((q) => q.id !== id);
    }

    // Update the selectedContentStore
    selectedContentStore.setQuestions(remainingQuestions || fetchedQuestions);

    // Force reactivity
    fetchedQuestions = [...fetchedQuestions];
  }

  // Forward allocation confirmation event
  function handleAllocationConfirmed(event) {
    dispatch("allocationConfirmed", event.detail);
  }

  // scrollpsy implementation
  let highlightedItem = null;
  function handleHighlightItem(event) {
    const { code, type } = event.detail;
    highlightedItem = { code, type };

    // Auto-expand to show the highlighted item
    if (type === "topic") {
      // Find parent chapter and expand it
      const parentChapter = chaptersData.find((ch) =>
        ch.topics?.some((t) => t.code === code),
      );
      if (parentChapter) {
        expandedChapters.add(parentChapter.code);
        expandedChapters = expandedChapters;
      }
    } else if (type === "subtopic") {
      // Find parent topic and chapter, expand both
      chaptersData.forEach((chapter) => {
        chapter.topics?.forEach((topic) => {
          if (topic.subtopics?.some((st) => st.code === code)) {
            expandedChapters.add(chapter.code);
            expandedTopics.add(topic.code);
          }
        });
      });
      expandedChapters = expandedChapters;
      expandedTopics = expandedTopics;
    }

    // Clear highlight after 5 seconds (increased from 3)
    setTimeout(() => {
      highlightedItem = null;
    }, 5000);
  }

  function getSelectedItemsForChapter(chapter) {
    const allTopics = chapter.topics || [];
    const allSubtopics = allTopics.flatMap((t) => t.subtopics || []);
    const selectedCodesInStore = new Set(selections.map((s) => s.code));

    const selectedTopics = allTopics.filter((t) =>
      selectedCodesInStore.has(t.code),
    );
    const selectedSubtopics = allSubtopics.filter((st) =>
      selectedCodesInStore.has(st.code),
    );

    return [...selectedTopics, ...selectedSubtopics];
  }

  function openSummaryModal(chapter) {
    const items = getSelectedItemsForChapter(chapter);
    summaryModalContent = { chapterName: chapter.name, items };
    showSummaryModal = true;
  }

  function handleCheckboxChange(event, item, type) {
    event.stopPropagation();


    const isChecked = event.target.checked;

    // Find complete parent information with context
    let contextData = null;
    if (type === "topic") {
      // Find parent chapter with full information
      const parentChapter = chaptersData.find(
        (ch) => ch.topics && ch.topics.some((t) => t.code === item.code),
      );

      if (parentChapter) {
        contextData = {
          parentChapter: {
            code: parentChapter.code,
            name: parentChapter.name,
            question_count: parentChapter.question_count,
          },
        };

        // Store chapter metadata in store
        selectedContentStore.storeChapterMetadata(parentChapter);
      }
    } else if (type === "subtopic") {
      // Find parent topic and chapter with full information
      let parentChapter = null;
      let parentTopic = null;

      chaptersData.forEach((chapter) => {
        if (chapter.topics) {
          chapter.topics.forEach((topic) => {
            if (
              topic.subtopics &&
              topic.subtopics.some((st) => st.code === item.code)
            ) {
              parentChapter = chapter;
              parentTopic = topic;
            }
          });
        }
      });

      if (parentChapter && parentTopic) {
        contextData = {
          parentChapter: {
            code: parentChapter.code,
            name: parentChapter.name,
            question_count: parentChapter.question_count,
          },
          parentTopic: {
            code: parentTopic.code,
            name: parentTopic.name,
            question_count: parentTopic.question_count,
          },
        };

        // Store chapter metadata in store
        selectedContentStore.storeChapterMetadata(parentChapter);
      }
    }

    const selectionData = {
      code: item.code,
      name: item.name,
      question_count: item.question_count || 0,
      type: type,
      parent_code: contextData
        ? type === "topic"
          ? contextData.parentChapter.code
          : contextData.parentTopic.code
        : null,
    };

    if (isChecked) {
      // Handle chapter selection cleanup
      if (type === "chapter") {
        const chapter = chaptersData.find((ch) => ch.code === item.code);
        if (chapter && chapter.topics) {
          chapter.topics.forEach((topic) => {
            selectedContentStore.removeSelection(topic.code);
            if (topic.subtopics) {
              topic.subtopics.forEach((subtopic) => {
                selectedContentStore.removeSelection(subtopic.code);
              });
            }
          });
        }
      }

      // Handle topic selection cleanup
      if (type === "topic") {
        const parentChapter = chaptersData.find((ch) =>
          ch.topics?.some((t) => t.code === item.code),
        );
        if (parentChapter) {
          const topic = parentChapter.topics.find((t) => t.code === item.code);
          if (topic && topic.subtopics) {
            topic.subtopics.forEach((subtopic) => {
              selectedContentStore.removeSelection(subtopic.code);
            });
          }
        }
      }

      // Use the new method with context
      selectedContentStore.addSelectionWithContext(selectionData, contextData);
    } else {
      selectedContentStore.removeSelection(item.code);
    }

    dispatch("select", { item: selectionData, type });
  }

  // Add these helper functions for better checkbox state management
  function isChapterSelected(chapterCode) {
    return selectedContentStore.isSelected(chapterCode, "chapter");
  }

  function isTopicSelected(topicCode) {
    return selections.some((s) => s.code === topicCode && s.type === "topic");
  }

  function isSubtopicSelected(subtopicCode) {
    return selections.some(
      (s) => s.code === subtopicCode && s.type === "subtopic",
    );
  }

  function hasSelectedTopicsInChapter(chapter) {
    if (!chapter.topics) return false;
    return chapter.topics.some(
      (topic) =>
        isTopicSelected(topic.code) ||
        (topic.subtopics &&
          topic.subtopics.some((subtopic) =>
            isSubtopicSelected(subtopic.code),
          )),
    );
  }

  function hasSelectedSubtopicsInTopic(topic) {
    if (!topic.subtopics) return false;
    return topic.subtopics.some((subtopic) =>
      isSubtopicSelected(subtopic.code),
    );
  }

  $: {
    // Re-calculate derived states if selections change
    chaptersData = chaptersData.map((chapter) => ({
      ...chapter,
      selected: isChapterSelected(chapter.code),
      hasSelectedTopics: hasSelectedTopicsInChapter(chapter),
    }));

    // Update expanded chapters based on selection state
    if (expandedChapters.size === 0 && chaptersData.length > 0) {
      // Expand the first chapter by default if none are expanded
      expandedChapters.add(chaptersData[0].code);
    }
  }

  // method to handle reset from parent
  export function resetToContentSelection() {
    showQuestions = false;
    activeTab = "questions";
    fetchedQuestions = [];

    // update hash
    if (browser) {
      goto("#content-selection", { replaceState: true, noScroll: true });
    }
  }
</script>

<div class="w-full">
  <!-- Table Section: Shared between selection and review -->
  {#if isLoading}
    <div class="flex justify-center py-4">
      <div
        class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"
      ></div>
      <p>Loading content...</p>
    </div>
  {:else if error}
    <div class="text-red-600 p-4">{error}</div>
  {:else if chaptersData.length === 0}
    <div class="flex justify-center py-8 w-full border border-stroke rounded-lg text-subtext">No content available for the selected Class, Subject and Medium combination</div>
  {:else}
    <div
      id={showQuestions ? "questions-table" : "content-selection"}
      class={""}
    >
      <ContentHierarchyTable
        {chaptersData}
        {selections}
        {expandedChapters}
        {expandedTopics}
        selectionSidebar={SelectionSidebar}
        on:toggleChapter={(e) => toggleChapter(e, e.detail.chapterId)}
        on:toggleTopic={(e) => toggleTopic(e, e.detail.topicId)}
        on:checkboxChange={(e) =>
          handleCheckboxChange(e.detail.event, e.detail.item, e.detail.type)}
        on:openSummary={(e) => openSummaryModal(e.detail.chapter)}
        on:highlightItem={handleHighlightItem}
      />
    </div>
  {/if}

  <!-- Selection Mode Footer -->
  {#if selections.length >0}
    <div class="mt-4">
      {#if selections.length > 0}
        <div class="flex justify-end">
          <button
            type="button"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            on:click={handleFetchQuestions}
            disabled={!hasContentChanged || selections.length === 0}
          >
            Fetch Questions ({selections.length} items)
          </button>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Review Mode Section (Tabs & Configuration) -->
  {#if showQuestions}
    <div id="questions-section" class="mt-8 border-t border-t-gray-200">
      <div class=" pt-4 pb-4 flex items-center justify-between">
        <h2 class="text-base font-medium text-gray-700">
          Question Configuration & Filtering
        </h2>
        <!-- <button
          type="button"
          class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          on:click={handleBackToContentSelection}
        >
          <svg
            class="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Content Selection
        </button> -->
      </div>

      <Tabs bind:active={activeTab}>
        <!-- Tab Navigation -->
        <div class="border-b border-gray-200">
          <nav class="flex space-x-0">
            <Tab
              name="selected-content"
              title="Selected Content"
              on:click={() =>
                browser &&
                goto("#selected-content", {
                  replaceState: true,
                  noScroll: true,
                })}
            />

            <Tab
              name="questions"
              title="Questions"
              on:click={() =>
                browser &&
                goto("#questions", { replaceState: true, noScroll: true })}
            />

            <Tab name="questions-removed" title="Excluded Questions" />
          </nav>
        </div>

        <!-- Tab Content -->
        <TabPanel name="questions">
          <div class="mt-4" id="questions">
            <MockQuestionsTable
              questions={fetchedQuestions}
              on:questionRemoved={handleQuestionRemoved}
            />
          </div>
        </TabPanel>

        <TabPanel name="selected-content">
          <div class="mt-4" id="selected-content">
            <SelectedContentTable
              bind:totalQuestions
              examData={{
                exam_name: examTitle,
                exam_type_code: "1000",
                subject_code: examSubject,
                medium_code: examMedium,
                exam_mode: examMode,
                total_time: totalTime,
                no_of_versions: numberOfVersions,
                no_of_sets: numberOfSets,
                exam_class: examClass,
              }}
              on:allocationConfirmed={handleAllocationConfirmed}
              on:draftSaved
              bind:savingDraft
              bind:draftSaveError
              bind:draftSaveSuccess
            />
          </div>
        </TabPanel>
        <TabPanel name="questions-removed">
          <div class="mt-4">
            <RemovedQuestionsTable />
          </div>
        </TabPanel>
      </Tabs>
    </div>
  {/if}

  <!-- Summary Modal -->
  {#if showSummaryModal}
    <SelectionSummaryModal
      chapterName={summaryModalContent.chapterName}
      items={summaryModalContent.items}
      on:close={() => (showSummaryModal = false)}
    />
  {/if}
</div>
