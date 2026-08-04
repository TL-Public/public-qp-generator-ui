<script>
  import { createEventDispatcher, getContext } from "svelte";
  import { api } from "$lib/utils/api.js";
  import AllocationPreviewModal from "./AllocationPreviewModal.svelte";
  import Toggle from "$lib/components/Toggle.svelte";
  import InlineNotification from "$lib/components/InlineNotification.svelte";
  import Input from "$lib/components/Input.svelte";
  import Button from "$lib/components/Button.svelte";
  // import { apiPayloadStore } from "$lib/stores/apiPayLoadStore.js";

  const selectedContentStore = getContext("selectedContentStore");
  const apiPayloadStore = getContext("apiPayloadStore");
  const dispatch = createEventDispatcher();

  export let totalQuestions;
  export let examData = null; // Receive exam data from parent
  export let savingDraft = false;
  export let draftSaveError = "";
  export let draftSaveSuccess = "";
  export let showErrors = false;

  // Subscribe to stores
  let storeData = {};
  selectedContentStore.subscribe((store) => {
    storeData = store;
  });

  let apiStoreData = {};
  apiPayloadStore.subscribe((store) => {
    apiStoreData = store;
  });

  // Toggle states - Start with manual allocation
  let allocationLevel = "chapter";

  // Make requiredQuestions reactive to totalQuestions
  $: requiredQuestions = totalQuestions || 40;

  // Modal state
  let showAllocationPreview = false;
  let previewData = null;

  // Draft saving state
  let allocationError = "";

  // Get hierarchical selections from store
  $: hierarchicalSelections = buildHierarchyFromStore(storeData);

  // Calculate allocation summary
  $: noOfSets = Number(examData?.no_of_sets) || 1;
  $: allocationSummary = calculateAllocationSummary(
    hierarchicalSelections,
    requiredQuestions,
    noOfSets,
  );

  // Validation for required fields
  $: examValidationError = getExamValidationError(examData);
  $: isMetadataValid = !examValidationError;
  $: isContentSelected = tableRows.length > 0;

  // Track validity for different actions
  $: isDraftValid = isMetadataValid && isContentSelected;
  $: isAllocationValid =
    !allocationSummary.hasError &&
    ($apiPayloadStore.is_ai_selected || allocationSummary.remaining === 0);
  $: isReleaseValid = isDraftValid && isAllocationValid;

  function getExamValidationError(examData) {
    if (!examData) return "Exam information not found.";

    const missingFields = [];

    // Map of field keys to their display labels
    const requiredFields = {
      exam_name: "Exam title",
      subject_code: "Subject",
      medium_code: "Medium",
      exam_mode: "Exam mode",
      total_time: "Duration",
      exam_class: "Class",
      no_of_versions: "Number of Versions",
      no_of_sets: "Number of Sets",
    };

    // Check each field
    for (const [key, label] of Object.entries(requiredFields)) {
      const value = examData[key];
      if (
        value === undefined ||
        value === null ||
        (typeof value === "string" &&
          (value.trim() === "" || value.trim() === "0")) ||
        (typeof value === "number" && value === 0)
      ) {
        missingFields.push(label);
      }
    }

    // Return the error message or null if everything is valid
    return missingFields.length > 0
      ? `To enable the buttons, please fill the required fields - ${missingFields.join(", ")}`
      : null;
  }

  /**
   * Universal validation for both saving drafts and final confirmation
   */
  function validateAllocationConfig({ isFinalConfirm = false }) {
    // 1. Check basic form validity (Metadata section)
    const metadataError = getExamValidationError(examData);
    if (metadataError) {
      return metadataError;
    }

    // 2. Check content selection
    if (tableRows.length === 0) {
      return "No content selected. Please go back and select chapters or topics.";
    }

    // THE FOLLOWING ARE ONLY FOR FINAL CONFIRMATION
    if (isFinalConfirm) {
      // 3. Check question availability (considering No. of Sets)
      if (allocationSummary.hasError) {
        const sets = allocationSummary.sets;
        const totalReq = allocationSummary.totalRequiredAcrossSets;
        if (sets > 1) {
          return `Insufficient questions available. You need ${totalReq} questions for ${sets} sets (${allocationSummary.required} per set), but only ${allocationSummary.available} are available.`;
        }
        return `Only ${allocationSummary.available} questions available, but ${allocationSummary.required} are required.`;
      }

      // 4. Check manual allocation balance
      if (
        !$apiPayloadStore.is_ai_selected &&
        allocationSummary.remaining !== 0
      ) {
        if (allocationSummary.remaining > 0) {
          return `You still have ${allocationSummary.remaining} questions left to allocate.`;
        } else {
          return `You have over-allocated by ${Math.abs(allocationSummary.remaining)} questions.`;
        }
      }
    }

    return null; // Valid
  }

  function countQuestionsForItem(itemCode, itemType) {
    if (!storeData || !storeData.questions || storeData.questions.length === 0)
      return 0;

    return storeData.questions.filter((q) => {
      if (q.parent?.code === itemCode) return true;

      // If it's a chapter, also count questions in its children topics/subtopics
      if (itemType === "chapter") {
        if (q.parent?.type === "topic") {
          const topicCode = q.parent.code;
          if (topicCode && topicCode.startsWith(itemCode + "_")) return true;
        }
        if (q.parent?.type === "subtopic") {
          const subtopicCode = q.parent.code;
          if (subtopicCode && subtopicCode.startsWith(itemCode + "_"))
            return true;
        }
      }

      // If it's a topic, also count questions in its children subtopics
      if (itemType === "topic") {
        if (q.parent?.type === "subtopic") {
          const subtopicCode = q.parent.code;
          if (subtopicCode && subtopicCode.startsWith(itemCode + "_"))
            return true;
        }
      }

      return false;
    }).length;
  }

  function buildHierarchyFromStore(storeData) {
    if (
      !storeData ||
      !storeData.hierarchy ||
      !(storeData.hierarchy instanceof Map)
    ) {
      return [];
    }

    const result = [];

    // Convert Map to array and process each chapter
    for (const [chapterCode, chapterData] of storeData.hierarchy) {
      // Use metadata if available for better chapter names
      const metadata = storeData.chapterMetadata?.get(chapterCode);

      const chapter = {
        code: chapterData.code,
        name: metadata ? metadata.name : chapterData.name,
        type: "chapter",
        questionAvailable:
          countQuestionsForItem(chapterData.code, "chapter") ||
          (metadata
            ? metadata.question_count
            : chapterData.question_count || 0),
        questionsToAdd:
          chapterData.questionsToAdd ||
          getDefaultQuestionsToAdd("chapter", chapterData.question_count || 0),
        isSelected: chapterData.isSelected || false,
        isPlaceholder: chapterData.isPlaceholder || false,
        children: [],
      };

      // Process topics within this chapter
      if (chapterData.children && chapterData.children.size > 0) {
        for (const [topicCode, topicData] of chapterData.children) {
          const topic = {
            code: topicData.code,
            name: topicData.name,
            type: "topic",
            questionAvailable:
              countQuestionsForItem(topicData.code, "topic") ||
              topicData.question_count ||
              0,
            questionsToAdd:
              topicData.questionsToAdd ||
              getDefaultQuestionsToAdd("topic", topicData.question_count || 0),
            isSelected: topicData.isSelected || false,
            isPlaceholder: topicData.isPlaceholder || false,
            parent_code: topicData.parent_code,
            children: [],
          };

          // Process subtopics within this topic
          if (topicData.children && topicData.children.size > 0) {
            for (const [subtopicCode, subtopicData] of topicData.children) {
              const subtopic = {
                code: subtopicData.code,
                name: subtopicData.name,
                type: "subtopic",
                questionAvailable:
                  countQuestionsForItem(subtopicData.code, "subtopic") ||
                  subtopicData.question_count ||
                  0,
                questionsToAdd:
                  subtopicData.questionsToAdd ||
                  getDefaultQuestionsToAdd(
                    "subtopic",
                    subtopicData.question_count || 0,
                  ),
                isSelected: subtopicData.isSelected || false,
                parent_code: subtopicData.parent_code,
              };

              topic.children.push(subtopic);
            }
          }

          chapter.children.push(topic);
        }
      }

      result.push(chapter);
    }
    return result;
  }

  function getDefaultQuestionsToAdd(type, questionCount) {
    return 0; // Default to 0 as per user request
  }

  function calculateAllocationSummary(
    hierarchicalSelections,
    required,
    sets = 1,
  ) {
    let totalAvailable = 0;
    let totalAllocated = 0;

    function processItem(item, level = 0) {
      if (item.isSelected) {
        totalAvailable += item.questionAvailable;

        // Always count allocations in manual mode
        if (!$apiPayloadStore.is_ai_selected) {
          // Always count allocations for selected items regardless of level
          totalAllocated += item.questionsToAdd || 0;
        }
      }

      // Process children recursively
      if (item.children && item.children.length > 0) {
        item.children.forEach((child) => processItem(child, level + 1));
      }
    }

    hierarchicalSelections.forEach((item) => processItem(item));

    const totalRequiredAcrossSets = required * sets;
    const remaining = required - totalAllocated;
    const hasError = totalAvailable < totalRequiredAcrossSets;

    return {
      required,
      sets,
      totalRequiredAcrossSets,
      available: totalAvailable,
      allocated: totalAllocated,
      remaining,
      hasError,
    };
  }

  //   Enhanced updateQuestionsToAdd with better reactivity
  function updateQuestionsToAdd(item, value) {
    const numValue = parseInt(value) || 0;
    const clampedValue = Math.max(
      0,
      Math.min(numValue, item.questionAvailable),
    );

    // Update the item directly
    item.questionsToAdd = clampedValue;

    //   Update in the selected content store using the correct method
    if (selectedContentStore.updateQuestionCount) {
      selectedContentStore.updateQuestionCount(item.code, clampedValue);
    }

    //   Force reactivity by reassigning the array
    hierarchicalSelections = [...hierarchicalSelections];

    //  NEW: Update API store with current allocation data
    // updateApiStoreFromCurrentData();
  }

  //   Enhanced increment function with validation
  function incrementQuestions(item) {
    if (item.questionsToAdd < item.questionAvailable) {
      const newValue = item.questionsToAdd + 1;

      updateQuestionsToAdd(item, newValue);
    } else {
    }
  }

  //   Enhanced decrement function with validation
  function decrementQuestions(item) {
    if (item.questionsToAdd > 0) {
      const newValue = item.questionsToAdd - 1;

      updateQuestionsToAdd(item, newValue);
    } else {
    }
  }

  //   Better input handling
  function handleInputChange(item, event) {
    allocationError = "";
    const value = event.target.value;
    updateQuestionsToAdd(item, value);
  }

  //  UPDATED: Enhanced toggle allocation
  function toggleAllocation() {
    allocationError = "";
    $apiPayloadStore.is_ai_selected = !$apiPayloadStore.is_ai_selected;
  }

  function setAllocationLevel(level) {
    allocationLevel = level;
  }

  function removeItem(itemCode) {
    selectedContentStore.removeSelection(itemCode);
  }

  // Generate table rows with proper hierarchy
  function generateTableRows(items, level = 0) {
    let rows = [];

    items.forEach((item) => {
      // Add the main item
      rows.push({
        item: item,
        level: level,
        isParent: item.children && item.children.length > 0,
      });

      // Add children recursively
      if (item.children && item.children.length > 0) {
        const childRows = generateTableRows(item.children, level + 1);
        rows = rows.concat(childRows);
      }
    });

    return rows;
  }

  $: tableRows = generateTableRows(hierarchicalSelections);

  //   Improved allocation preview generation
  function generateAllocationPreview() {
    //   Better filtering and data collection for ALL selected items
    const getAllSelectedItems = (items) => {
      let selectedItemsArr = [];

      const processItem = (item) => {
        if (item.isSelected) {
          if (!$apiPayloadStore.is_ai_selected && item.questionsToAdd <= 0) {
            // Skip items with no allocations in manual mode
            return;
          }
          selectedItemsArr.push(item);
        }

        // Process children
        if (item.children && item.children.length > 0) {
          item.children.forEach((child) => processItem(child));
        }
      };

      items.forEach((item) => processItem(item));
      return selectedItemsArr;
    };

    const selectedItemsWithAllocations = getAllSelectedItems(
      hierarchicalSelections,
    );

    if (
      selectedItemsWithAllocations.length === 0 &&
      !$apiPayloadStore.is_ai_selected
    ) {
      allocationError =
        "Please allocate questions to at least one selected item before proceeding.";
      return null;
    }

    // Calculate totals from actual data
    const totalAllocated = selectedItemsWithAllocations.reduce(
      (sum, item) => sum + (item.questionsToAdd || 0),
      0,
    );
    const totalAvailable = hierarchicalSelections.reduce(
      (sum, item) => sum + (item.questionAvailable || 0),
      0,
    );
    const remaining = requiredQuestions - totalAllocated;

    const preview = {
      allocationType: $apiPayloadStore.is_ai_selected ? "Auto" : "Manual",
      allocationLevel: allocationLevel,
      totalRequired: requiredQuestions,
      totalAllocated: totalAllocated,
      totalAvailable: totalAvailable,
      remaining: remaining,
      items: hierarchicalSelections.map((item) => ({
        ...item,
        questionsToAdd: item.questionsToAdd || 0,
      })),
      selectedItems: selectedItemsWithAllocations, //  Use filtered items with allocations
      autoAllocations: [],
    };

    return preview;
  }

  //   Renamed and improved function
  function handleApplyAllocation() {
    allocationError = "";
    showErrors = true;

    const validationError = validateAllocationConfig({ isFinalConfirm: true });
    if (validationError) {
      allocationError = validationError;
      return;
    }

    const preview = generateAllocationPreview();

    if (preview) {
      // NEW: Immediately update API store with allocation data forward directly to next step
      apiPayloadStore.updateFromAllocationData(preview);

      // Dispatch the event with the data as detail to navigate to review
      dispatch("allocationConfirmed", {
        allocationType:
          preview.allocationType ||
          ($apiPayloadStore.is_ai_selected ? "Auto" : "Manual"),
        allocationLevel: preview.allocationLevel || allocationLevel,
        totalRequired: preview.totalRequired || requiredQuestions,
        totalAllocated: preview.totalAllocated || 0,
        totalAvailable: preview.totalAvailable || 0,
        remaining: preview.remaining || 0,
        selectedItems: preview.selectedItems || [],
        timestamp: new Date().toISOString(),
      });
    }
  }

  //  UPDATED: Enhanced allocation confirmation
  // function handleConfirmAllocation(event) {
  //   const data = event.detail;

  //   //  NEW: Immediately update API store with allocation data
  //   apiPayloadStore.updateFromAllocationData(data);

  //   // Double-check that the API store has the data
  //   apiPayloadStore.debug();

  //   // Dispatch the event with the data as detail
  //   dispatch("allocationConfirmed", {
  //     allocationType: data.allocationType || "Manual",
  //     allocationLevel: data.allocationLevel || "chapter",
  //     totalRequired: data.totalRequired || 0,
  //     totalAllocated: data.totalAllocated || 0,
  //     totalAvailable: data.totalAvailable || 0,
  //     remaining: data.remaining || 0,
  //     selectedItems: data.selectedItems || [],
  //     timestamp: new Date().toISOString(),
  //   });

  //   // Close the modal
  //   showAllocationPreview = false;
  // }

  // //   Added missing cancel function
  // function handleCancelAllocation() {
  //   showAllocationPreview = false;
  //   previewData = null;
  // }

  // // Add this function to forward the allocation confirmed event
  // function handleAllocationConfirmed(event) {
  //   dispatch("allocationConfirmed", event.detail);
  // }

  /**
   * Save exam design as draft
   */
  async function handleSaveAsDraft() {
    savingDraft = true;
    showErrors = true;
    draftSaveError = "";
    draftSaveSuccess = "";
    try {
      const validationError = validateAllocationConfig({
        isFinalConfirm: false,
      });
      if (validationError) {
        throw new Error(validationError);
      }

      // Extract exam details from props
      const examName = examData.exam_name?.trim();
      const examTypeCode = examData.exam_type_code;
      const subjectCode = examData.subject_code;
      const mediumCode = examData.medium_code;
      const examMode = examData.exam_mode || "online";
      const totalTime = Number(examData.total_time) || 60;
      const standard = examData.standard || examData.exam_class;
      const noOfVersions = Number(examData.no_of_versions) || 1;
      const noOfSets = Number(examData.no_of_sets) || 1;

      // Build chapters_topics array from selected content using selectedContentStore
      const chaptersTopics = buildChaptersTopicsFromStore();

      if (!chaptersTopics || chaptersTopics.length === 0) {
        throw new Error(
          "No valid content selections found. Please ensure you have selected chapters or topics.",
        );
      }

      // Prepare the draft payload
      const draftPayload = {
        status: 1, // Draft mode
        is_ai_selected: $apiPayloadStore.is_ai_selected,
        exam_name: examName,
        exam_type_code: String(examTypeCode),
        subject_code: String(subjectCode),
        medium_code: String(mediumCode),
        exam_mode: examMode.toLowerCase(),
        total_time: totalTime,
        total_questions: Number(requiredQuestions),
        no_of_versions: noOfVersions,
        no_of_sets: noOfSets,
        chapters_topics: chaptersTopics,
      };

      // Add optional fields if available
      if (standard) {
        draftPayload.standard = String(standard);
      }

      // Check for excluded questions from selectedContentStore
      const excludedQuestionCodes = (
        $selectedContentStore.removedQuestions || []
      )
        .map((q) => q.id || q.code)
        .filter(Boolean);

      if (excludedQuestionCodes.length > 0) {
        draftPayload.qtn_codes_to_exclude = excludedQuestionCodes;
      }

      // Dispatch event to parent to handle the API call
      dispatch("draftSaved", {
        payload: draftPayload,
      });
    } catch (error) {
      draftSaveError =
        error.message || "Failed to save draft. Please try again.";
    }
  }

  /**
   * Build chapters_topics array from selectedContentStore
   */
  function buildChaptersTopicsFromStore() {
    const chaptersTopics = [];
    const chaptersMap = new Map();
    const topicsMap = new Map();

    if (!storeData.hierarchy || !(storeData.hierarchy instanceof Map)) {
      return [];
    }

    // Process hierarchy from selectedContentStore
    for (const [chapterCode, chapterData] of storeData.hierarchy) {
      // Process chapter-level selections
      if (chapterData.isSelected) {
        if (!chaptersMap.has("chapters")) {
          chaptersMap.set("chapters", {
            type: "chapter",
            codes: [],
          });
        }

        const chapterEntry = {
          code: chapterCode,
        };

        // Only add question count for manual allocation (NOT for AI)
        if (
          !$apiPayloadStore.is_ai_selected &&
          chapterData.questionsToAdd > 0
        ) {
          chapterEntry.qn_count = chapterData.questionsToAdd;
        }

        chaptersMap.get("chapters").codes.push(chapterEntry);
      }

      // Process topics within this chapter
      if (chapterData.children && chapterData.children instanceof Map) {
        for (const [topicCode, topicData] of chapterData.children) {
          if (topicData.isSelected) {
            if (!topicsMap.has("topics")) {
              topicsMap.set("topics", {
                type: "topic",
                codes: [],
              });
            }

            const topicEntry = {
              code: topicCode,
            };

            // Only add question count for manual allocation (NOT for AI)
            if (
              !$apiPayloadStore.is_ai_selected &&
              topicData.questionsToAdd > 0
            ) {
              topicEntry.qn_count = topicData.questionsToAdd;
            }

            topicsMap.get("topics").codes.push(topicEntry);
          }

          // Process subtopics within this topic
          if (topicData.children && topicData.children instanceof Map) {
            for (const [subtopicCode, subtopicData] of topicData.children) {
              if (subtopicData.isSelected) {
                if (!topicsMap.has("topics")) {
                  topicsMap.set("topics", {
                    type: "topic",
                    codes: [],
                  });
                }

                const subtopicEntry = {
                  code: subtopicCode,
                };

                // Only add question count for manual allocation (NOT for AI)
                if (
                  !$apiPayloadStore.is_ai_selected &&
                  subtopicData.questionsToAdd > 0
                ) {
                  subtopicEntry.qn_count = subtopicData.questionsToAdd;
                }

                topicsMap.get("topics").codes.push(subtopicEntry);
              }
            }
          }
        }
      }
    }

    // Convert maps to array
    chaptersMap.forEach((value) => {
      if (value.codes.length > 0) {
        chaptersTopics.push(value);
      }
    });

    topicsMap.forEach((value) => {
      if (value.codes.length > 0) {
        chaptersTopics.push(value);
      }
    });

    return chaptersTopics;
  }

  // Clear success message
  function clearDraftSuccess() {
    draftSaveSuccess = "";
  }

  // Clear error message
  function clearDraftError() {
    draftSaveError = "";
  }

  // Enhanced debug function
  function debugApiStore() {
    // Check localStorage
    if (typeof localStorage !== "undefined") {
    }

    // Check window object
    if (typeof window !== "undefined") {
    }
  }
</script>

<div class="space-y-4">
  <!-- Header with Configuration -->
  <div class="border border-stroke p-4 rounded-lg">
    <!-- AI/Manual Toggle -->
    <div class="flex items-center justify-between mb-4">
      {#if $apiPayloadStore.is_ai_selected}
        <p class="flex flex-col text-sm font-medium text-gray-700">
          Auto allocate questions
          <span class="text-xs text-gray-500 font-normal"
            >Automatically distribute questions across selected content</span
          >
        </p>
      {:else}
        <p class="flex flex-col text-sm font-medium text-gray-700">
          Manual allocation
          <span class="text-xs text-gray-500 font-normal"
            >Manually specify how many questions to allocate for each item</span
          >
        </p>
      {/if}
      <Toggle bind:checked={$apiPayloadStore.is_ai_selected} />
    </div>

    <!-- Allocation Summary -->
    <div class="sticky top-0 rounded-lg mt-4">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-center text-sm">
        <div class="flex items-center">
          <span class="text-gray-600 text-sm mr-2 whitespace-nowrap"
            >Required:</span
          >
          <div class="w-20">
            <Input
              type="number"
              value={totalQuestions}
              min="1"
              on:handleInputData={(e) =>
                (totalQuestions = parseInt(e.detail.value) || 0)}
            />
          </div>
        </div>
        <div>
          <span class="text-gray-600 text-sm">Available:</span>
          <span class="font-medium ml-1">{allocationSummary.available}</span>
        </div>
        {#if !$apiPayloadStore.is_ai_selected}
          <div>
            <span class="text-gray-600 text-sm">Allocated:</span>
            <span class="font-medium ml-1">{allocationSummary.allocated}</span>
          </div>
          <div>
            <span class="text-gray-600 text-sm">Remaining:</span>
            <span
              class="font-medium ml-1 {allocationSummary.remaining < 0
                ? 'text-red-600'
                : allocationSummary.remaining > 0
                  ? 'text-amber-600'
                  : 'text-green-600'}"
            >
              {allocationSummary.remaining}
            </span>
          </div>
        {/if}
      </div>

      {#if allocationSummary.hasError}
        <div
          class="mt-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-md p-2"
        >
          {#if allocationSummary.sets > 1}
            ⚠️ Only {allocationSummary.available} questions available. You need {allocationSummary.totalRequiredAcrossSets}
            questions for {allocationSummary.sets} sets ({allocationSummary.required}
            per set). Please reduce the number or add more content.
          {:else}
            ⚠️ Only {allocationSummary.available} questions available. Please reduce
            the number or add more content.
          {/if}
        </div>
      {:else if !$apiPayloadStore.is_ai_selected && allocationSummary.remaining > 0}
        <div
          class="mt-3 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-2"
        >
          📝 {allocationSummary.remaining} questions remaining to be allocated.
        </div>
      {:else if !$apiPayloadStore.is_ai_selected && allocationSummary.remaining === 0}
        <div
          class="mt-3 text-xs text-green-600 bg-green-50 border border-green-200 rounded-md p-2"
        >
          Perfect allocation! All {allocationSummary.required} questions are allocated.
        </div>
      {:else if $apiPayloadStore.is_ai_selected}
        <div
          class="mt-3 text-xs text-green-600 bg-green-50 border border-green-200 rounded-md p-2"
        >
          {#if allocationSummary.sets > 1}
            Sufficient questions available. Total {allocationSummary.totalRequiredAcrossSets}
            questions will be auto-allocated into {allocationSummary.sets}
            sets.
          {:else}
            Sufficient questions available. All {allocationSummary.required}
            questions will be auto-allocated.
          {/if}
        </div>
      {/if}
    </div>

    {#if !$apiPayloadStore.is_ai_selected}
      <div
        class="text-xs text-gray-700 bg-gray-100 border border-gray-200 rounded-md p-2 mt-4"
      >
        <strong>Tip:</strong> If you specify a number at the chapter level, it will
        override the topic-level selections.
      </div>
    {/if}
  </div>

  <!-- Draft Save Success Message -->
  {#if draftSaveSuccess}
    <div class="mb-4">
      <InlineNotification
        kind="success"
        title="Draft Saved"
        subtitle={draftSaveSuccess}
        on:close={clearDraftSuccess}
      />
    </div>
  {/if}

  <!-- Draft Save Error Message -->
  {#if draftSaveError}
    <div class="mb-4">
      <InlineNotification
        kind="error"
        title="Error Saving Draft"
        subtitle={draftSaveError}
        on:close={clearDraftError}
      />
    </div>
  {/if}

  <!-- Hierarchical Selected Content Table -->
  <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
    <!-- <div class="px-6 py-3 bg-gray-50 border-b border-gray-200">
      <h3 class="text-base font-medium text-gray-700">Selected Content</h3>
    </div> -->

    {#if tableRows.length === 0}
      <div class="px-6 py-8 text-center text-gray-500">
        <div class="text-lg mb-2">No content selected</div>
        <div class="text-sm">
          Go back to the content selection to choose chapters, topics, or
          subtopics.
        </div>
      </div>
    {:else}
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Selected Content
            </th>
            <th
              class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Questions Available
            </th>
            <!-- Always show Questions to Add column, regardless of AI/Manual mode -->
            <th
              class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Questions to Add
            </th>
            <th
              class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {#each tableRows as row}
            <tr
              class="{row.level === 0
                ? 'bg-white'
                : row.level === 1
                  ? 'bg-gray-25'
                  : 'bg-gray-50'} {row.item.isPlaceholder
                ? 'italic opacity-75'
                : ''}"
            >
              <!-- Content Name with Hierarchy -->
              <td
                class="px-6 py-4"
                style="padding-left: {24 + row.level * 24}px;"
              >
                <div class="flex items-center space-x-2">
                  <!-- Hierarchy indicator -->
                  {#if row.level > 0}
                    <span class="text-gray-400">
                      {#if row.level === 1}↳{:else if row.level === 2}↳↳{/if}
                    </span>
                  {/if}

                  <!-- Content info -->
                  <div>
                    <div
                      class="text-sm {row.level === 0
                        ? 'font-semibold text-gray-900'
                        : row.level === 1
                          ? 'font-medium text-gray-800'
                          : 'text-gray-700'} {!row.item.isSelected
                        ? 'text-gray-400'
                        : ''}"
                    >
                      {row.item.name}
                      {#if row.item.isPlaceholder}
                        <span class="text-xs text-gray-400 ml-1"
                          >(not individually selected)</span
                        >
                      {/if}
                    </div>

                    <!-- Type badge and selection status -->
                    <div class="mt-1 flex items-center space-x-2">
                      <span
                        class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                        {row.item.type === 'chapter'
                          ? 'bg-blue-100 text-blue-800'
                          : row.item.type === 'topic'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-purple-100 text-purple-800'}"
                      >
                        {row.item.type}
                      </span>

                      <!-- Selection status like in image -->
                      {#if row.item.isSelected}
                        <span class="text-xs text-green-600">Selected</span>
                      {:else if row.item.children && row.item.children.length > 0}
                        <span class="text-xs text-primary">
                          {row.item.children.filter((child) => child.isSelected)
                            .length} of {row.item.children.length}
                          {row.item.type === "chapter" ? "topics" : "subtopics"}
                          selected
                        </span>
                      {:else}
                        <span class="text-xs text-gray-400">-</span>
                      {/if}
                    </div>
                  </div>
                </div>
              </td>

              <!-- Questions Available -->
              <td
                class="px-6 py-4 text-sm text-gray-900 text-center font-medium"
              >
                {row.item.questionAvailable}
              </td>

              <!-- Questions to Add - Always show, but enable/disable based on mode and level -->
              <td class="px-6 py-4 text-center">
                {#if $apiPayloadStore.is_ai_selected}
                  <!-- AI Mode - Show disabled state -->
                  <div class="flex items-center justify-center">
                    <span
                      class="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full"
                    >
                      Auto Allocation
                    </span>
                  </div>
                {:else if row.item.isSelected}
                  <!--   Enhanced input for ALL selected items in manual mode -->
                  <div class="flex items-center justify-center">
                    <div
                      class="flex items-center border border-gray-300 rounded-md overflow-hidden bg-white shadow-sm"
                    >
                      <button
                        type="button"
                        class="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 text-sm font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                        on:click|preventDefault={() =>
                          decrementQuestions(row.item)}
                        disabled={row.item.questionsToAdd <= 0}
                        title="Decrease questions"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="0"
                        max={row.item.questionAvailable}
                        value={row.item.questionsToAdd}
                        class="w-16 px-3 py-2 text-sm text-center border-0 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        on:input={(e) => handleInputChange(row.item, e)}
                        on:blur={(e) => handleInputChange(row.item, e)}
                      />
                      <button
                        type="button"
                        class="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 text-sm font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                        on:click|preventDefault={() =>
                          incrementQuestions(row.item)}
                        disabled={row.item.questionsToAdd >=
                          row.item.questionAvailable}
                        title="Increase questions"
                      >
                        +
                      </button>
                    </div>

                    <!--  NEW: Show current value and limits for debugging -->
                    <div class="ml-2 text-xs text-gray-500">
                      <!-- {row.item.questionsToAdd}/{row.item.questionAvailable} -->
                    </div>
                  </div>
                {:else}
                  <!-- Not selected state -->
                  <div class="flex items-center justify-center">
                    <span
                      class="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full"
                    >
                      Not selected
                    </span>
                  </div>
                {/if}
              </td>

              <!-- Actions -->
              <td class="px-6 py-4 text-center">
                {#if row.item.isSelected}
                  <Button
                    btnType="dangerSecondary"
                    customClass="p-1 px-1.5 py-1 normal-case min-w-0"
                    on:click={() => removeItem(row.item.code)}
                    title="Remove {row.item.name}"
                  >
                    <svg
                      class="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </Button>
                {:else}
                  <span class="text-gray-300">−</span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>

  <!-- Action Buttons -->
  <div class="flex flex-col items-end gap-3 mt-4">
    <div class="flex flex-row justify-end gap-3 w-full">
      <!-- Save as Draft Button -->
      <div class="flex justify-end">
        <Button
          btnType="secondary"
          disabled={!isDraftValid || savingDraft}
          on:click={handleSaveAsDraft}
        >
          {#if savingDraft}
            <div class="flex items-center">
              <svg
                class="animate-spin -ml-1 mr-2 h-4 w-4 text-primary"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Saving Draft...
            </div>
          {:else}
            <div class="flex items-center">
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
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                />
              </svg>
              Save as Draft
            </div>
          {/if}
        </Button>
      </div>

      <!-- Confirm Allocation Button -->
      <div class="flex flex-col items-end gap-2">
        <Button
          disabled={!isReleaseValid || savingDraft}
          btnType="primary"
          on:click={handleApplyAllocation}
        >
          Confirm and Review Allocation
        </Button>
      </div>

      {#if allocationError}
        <div class="mt-3">
          <InlineNotification
            kind="error"
            title={allocationError}
            on:close={() => (allocationError = "")}
          />
        </div>
      {/if}
    </div>
    {#if !isMetadataValid}
      <p
        class="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md p-2 w-full md:w-auto"
      >
        ⚠️ {examValidationError}
      </p>
    {/if}
  </div>
</div>
