<script>
  import ExamDetailsForm from "$lib/components/Forms/ExamDetailsForm.svelte";
  import ExamConfig from "$lib/components/ExamConfig.svelte";
  import DifficultyDistribution from "$lib/components/DifficultyDistribution.svelte";
  import ClassSubjectSelector from "$lib/components/ClassSubjectSelector.svelte";
  import Card from "$lib/components/Cards/Card.svelte";
  import ReviewPage from "$lib/components/ReviewPage.svelte";
  import StepIndicator from "$lib/components/quiz/StepIndicator.svelte";

  import GeneratePapers from "$lib/components/GeneratePapers.svelte";

  import { apiClient } from "$lib/utils/api";
  import { createApiPayloadStore } from "$lib/stores/apiPayLoadStore";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { browser } from "$app/environment";

  import NestedContentTable from "$lib/components/NestedContentTable.svelte";
  import { mockQuestionsData } from "$lib/utils/mockData.js";
  import { createSelectedContentStore } from "$lib/stores/selectedContentStore.js";

  import { onDestroy, onMount, tick, setContext } from "svelte";
  import InlineNotification from "$lib/components/InlineNotification.svelte";

  // Props
  export let examId = null;

  // Determine edit mode reactive state
  $: isEditMode = !!examId;

  // Initialize stores for this wizard instance
  const selectedContentStore = createSelectedContentStore();
  const apiPayloadStore = createApiPayloadStore();
  setContext("selectedContentStore", selectedContentStore);
  setContext("apiPayloadStore", apiPayloadStore);

  // Wizard state variables
  let allQuestions = [];
  let fetchedQuestions = [];

  // Exam details state
  let examMode = "Online";
  let examTitle = "";
  let examClass = "";
  let examMedium = "";
  let examSubject = "";
  let examMediumName = "";
  let examSubjectName = "";
  let examCode = examId || ""; // Tracks current exam code (keeps track of draft ID in create mode)

  // Loading state
  let isLoading = false;
  let loadError = null;

  // Initialize validation states
  let examDetailsValid = true;
  let classSubjectValid = true;
  let examConfigValid = true;
  let difficultyValid = true;

  // Subscribe to API store for debugging
  let apiStoreData = {};
  apiPayloadStore.subscribe((store) => {
    apiStoreData = store;
  });

  // Exam configuration state
  let totalTime = 40;
  let totalQuestions = 40;
  let numberOfSets = 1;
  let numberOfVersions = 1;

  // Allocation confirmation state
  let isAllocationConfirmed = false;
  let confirmedAllocationData = null;

  // Draft saving state
  let isSavingDraft = false;
  let draftSaveError = "";
  let draftSaveSuccess = "";

  // Navigation state
  let currentView = "config";

  let showQuestions = false;
  let nestedContentActiveTab = "selected-content";

  let allocationResult = {
    message: "",
    type: "success",
  };

  let generatedPapersData = {};
  let generationResult = {
    message: "",
    type: "success",
  };
  let generationInProgress = false;

  // Step Configuration
  $: STEPS = {
    config: {
      index: 1,
      title: isEditMode ? "Edit Exam Details" : "Add Exam Details",
    },
    review: { index: 2, title: "Review Configuration" },
    generate: { index: 3, title: "Generated Papers" },
  };

  $: stepTitle = STEPS[currentView]?.title || "Exam Details";

  function getStepByView(view) {
    return STEPS[view]?.index || 1;
  }

  function getViewByStep(step) {
    const stepNum = parseInt(step);
    const entry = Object.entries(STEPS).find(
      ([_, data]) => data.index === stepNum,
    );
    return entry ? entry[0] : "config";
  }

  function syncViewWithStep(step) {
    const view = getViewByStep(step);
    if (currentView !== view) {
      currentView = view;

      // Restore allocation view state if going back to config
      if (view === "config" && isAllocationConfirmed) {
        showQuestions = true;
        nestedContentActiveTab = "selected-content";
      }
    }
  }

  function syncUrlWithView(view) {
    if (!browser) return;
    const step = getStepByView(view).toString();
    const currentStepParam = $page.url.searchParams.get("step");

    if (currentStepParam !== step) {
      const url = new URL(window.location.href);
      url.searchParams.set("step", step);
      goto(url.toString(), { keepFocus: true, noScroll: true });
    }
  }

  // Reactive Navigation Logic
  $: syncViewWithStep($page.url.searchParams.get("step"));
  $: syncUrlWithView(currentView);

  $: currentStepIndex = STEPS[currentView]?.index || 1;

  // Difficulty distribution
  let easy = 40;
  let medium = 40;
  let hard = 20;

  // Reference for nested content table
  let nestedContentTableRef;

  // Fetch exam data on mount if in edit mode
  onMount(async () => {
    if (!isEditMode) {
      return;
    }

    isLoading = true;
    loadError = null;

    try {
      // Fetch mediums and subjects first to map names to codes
      const [examRes, mediumsRes, subjectsRes] = await Promise.all([
        apiClient({ url: `/apis/exams/${examCode}` }),
        apiClient({ url: "/apis/mediums" }),
        apiClient({ url: "/apis/subjects" }),
      ]);

      if (!examRes.ok) {
        const errorData = await examRes.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP error! status: ${examRes.status}`,
        );
      }
      if (!mediumsRes.ok) {
        const errorData = await mediumsRes.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP error! status: ${mediumsRes.status}`,
        );
      }
      if (!subjectsRes.ok) {
        const errorData = await subjectsRes.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP error! status: ${subjectsRes.status}`,
        );
      }

      const examResponse = await examRes.json();
      const mediumsResponse = await mediumsRes.json();
      const subjectsResponse = await subjectsRes.json();

      if (!examResponse || !examResponse.design) {
        throw new Error("Invalid response: missing design data");
      }

      const design = examResponse.design;

      // Get mediums and subjects data for mapping
      const mediumsData = mediumsResponse.data || [];
      const subjectsData = subjectsResponse.data || [];

      // Populate form fields from design data
      examTitle = design.exam_name || "";
      examMode = design.exam_mode
        ? design.exam_mode.charAt(0).toUpperCase() + design.exam_mode.slice(1)
        : "Online";
      examClass = design.standard || "";
      examMediumName = design.medium || "";
      examSubjectName = design.subject || "";

      // Map medium - try code first, then find code by name
      let mediumCode = design.medium_code || "";
      if (!mediumCode && design.medium) {
        const foundMedium = mediumsData.find(
          (m) =>
            m.medium_name?.toLowerCase() === design.medium?.toLowerCase() ||
            m.medium_name === design.medium,
        );
        mediumCode = foundMedium?.medium_code || "";
      }
      examMedium = mediumCode;

      // Map subject - try code first, then find code by name
      let subjectCode = design.subject_code || "";
      if (!subjectCode && design.subject) {
        const foundSubject = subjectsData.find(
          (s) =>
            (s.subject_name?.toLowerCase() === design.subject?.toLowerCase() ||
              s.subject_name === design.subject) &&
            (s.standard === design.standard || !design.standard),
        );
        subjectCode = foundSubject?.subject_code || "";
      }
      const mappedMediumCode = mediumCode;
      const mappedSubjectCode = subjectCode;

      // Wait for next tick to ensure ClassSubjectSelector component has mounted
      await tick();

      // Wait a bit more for the dropdowns to load their options
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Now set the values - this ensures the dropdowns have their options loaded
      examMedium = mappedMediumCode;
      examSubject = mappedSubjectCode;

      // Populate exam configuration
      totalTime = design.total_time || 40;
      totalQuestions = design.total_questions || design.no_of_qns || 40;
      numberOfSets = design.number_of_sets || design.no_of_sets || 1;
      numberOfVersions =
        design.number_of_versions || design.no_of_versions || 1;

      // Update API store with fetched data
      apiPayloadStore.updateExamDetails({
        examTitle: examTitle,
        examMode: examMode,
      });

      apiPayloadStore.updateExamConfig({
        totalTime: totalTime,
        totalQuestions: totalQuestions,
        numberOfVersions: numberOfVersions,
        numberOfSets: numberOfSets,
      });

      apiPayloadStore.updateClassSubject({
        subject_code: examSubject,
        medium_code: examMedium,
        examClass: examClass,
      });

      // If there are chapters_topics in the design, update the store and pre-select them in selectedContentStore
      const chaptersTopics =
        design.chapters_topics || examResponse.chapters_topics || [];
      if (
        chaptersTopics &&
        Array.isArray(chaptersTopics) &&
        chaptersTopics.length > 0
      ) {
        apiPayloadStore.update((currentStore) => ({
          ...currentStore,
          chapters_topics: chaptersTopics,
        }));

        // Pre-populate the selectedContentStore hierarchy/selections
        for (const group of chaptersTopics) {
          const type = group.type;
          const codes = group.codes || [];
          for (const item of codes) {
            const selectionData = {
              type: type,
              code: item.code,
              name: item.name,
              question_count: item.qn_count || item.question_count || 0,
              parent_code: item.parent_code || null,
            };

            if (type === "topic") {
              selectionData.parent_code =
                item.chapter_details?.code || item.parent_code;
            } else if (type === "subtopic") {
              selectionData.parent_code =
                item.topic_details?.code || item.parent_code;
            }

            selectedContentStore.addSelection(selectionData);

            if (selectionData.question_count > 0) {
              selectedContentStore.updateQuestionCount(
                item.code,
                selectionData.question_count,
              );
            }
          }
        }
      }

      // Update excluded questions if any
      if (
        design.qtn_codes_to_exclude &&
        Array.isArray(design.qtn_codes_to_exclude) &&
        design.qtn_codes_to_exclude.length > 0
      ) {
        apiPayloadStore.updateExcludedQuestions(design.qtn_codes_to_exclude);
      }
    } catch (error) {
      console.error("Failed to load exam data:", error);
      loadError = error.message || "Failed to load exam details";
    } finally {
      isLoading = false;
    }
  });

  // Update the back handler in ReviewPage
  function handleBackFromReview() {
    currentView = "config";

    showQuestions = true;
    nestedContentActiveTab = "selected-content";

    if (browser) {
      goto("#selected-content", { replaceState: true, noScroll: true });
    }
  }

  function handleReset() {
    allQuestions = [];
    isAllocationConfirmed = false;
    confirmedAllocationData = null;
    if (!isEditMode) {
      examCode = "";
    }
    selectedContentStore.clearAll();
  }

  function handleExamConfigValidation(event) {
    examConfigValid = event.detail.isValid;
    if (examConfigValid) {
      apiPayloadStore.updateExamConfig({
        total_time: totalTime,
        total_questions: totalQuestions,
        no_of_versions: numberOfVersions,
        no_of_sets: numberOfSets,
      });
    }
  }

  function handleAllocationConfirmed(event) {
    allocationResult.message = "";
    allocationResult.type = "success";
    const data = event.detail || event;
    if (!data) {
      allocationResult.message =
        "Invalid allocation data received. Please try again.";
      allocationResult.type = "error";
      return;
    }

    const allocationData = data;

    if (
      !allocationData.selectedItems ||
      !Array.isArray(allocationData.selectedItems)
    ) {
      allocationResult.message =
        "Invalid allocation data format. Please try again.";
      allocationResult.type = "error";
      return;
    }

    isAllocationConfirmed = true;
    confirmedAllocationData = allocationData;

    apiPayloadStore.updateFromAllocationData(allocationData);

    apiPayloadStore.updateExamDetails({
      examTitle,
      examMode,
    });

    apiPayloadStore.updateExamConfig({
      totalTime,
      totalQuestions,
      numberOfVersions,
      numberOfSets,
    });

    apiPayloadStore.updateClassSubject({
      subject_code: examSubject,
      medium_code: examMedium,
      examClass,
    });

    if (allQuestions?.length > 0) {
      const excludedQuestions = allQuestions
        .filter((q) => q.isRemoved === true)
        .map((q) => q.id || q.code)
        .filter(Boolean);

      if (excludedQuestions.length > 0) {
        apiPayloadStore.updateExcludedQuestions(excludedQuestions);
      }
    }

    currentView = "review";
  }

  async function handleSaveDraft(event) {
    const { payload } = event.detail;
    isSavingDraft = true;
    draftSaveError = "";
    draftSaveSuccess = "";
    try {
      let response;
      if (examCode) {
        response = await apiClient({
          url: `/apis/exams/${examCode}`,
          options: {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        });
      } else {
        response = await apiClient({
          url: "/apis/exams",
          options: {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`,
        );
      }

      const responseDataRaw = await response.json();
      const responseData = responseDataRaw.data || responseDataRaw;
      if (responseData?.exam_code && !isEditMode) {
        examCode = responseData.exam_code;
      }

      draftSaveSuccess = isEditMode
        ? `Draft "${payload.exam_name}" updated successfully!`
        : `Draft "${payload.exam_name}" saved successfully! Exam Code: ${examCode || "N/A"}`;
    } catch (error) {
      draftSaveError =
        error.message || "Failed to save draft. Please try again.";
    } finally {
      isSavingDraft = false;
    }
  }

  async function handleGeneratePapers() {
    try {
      generationInProgress = true;
      generatedPapersData = {};
      generationResult.message = "";
      generationResult.type = "success";

      if (confirmedAllocationData && confirmedAllocationData.selectedItems) {
        apiPayloadStore.updateFromAllocationData(confirmedAllocationData);
      }

      const payloadResult = apiPayloadStore.getApiPayload();

      if (!payloadResult.isValid) {
        throw new Error("Invalid data: " + payloadResult.errors.join(", "));
      }

      let apiPayload = payloadResult.payload;
      apiPayload = {
        ...apiPayload,
        status: 2,
      };

      let response;
      if (examCode) {
        response = await apiClient({
          url: `/apis/exams/${examCode}`,
          options: {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(apiPayload),
          },
        });
      } else {
        response = await apiClient({
          url: "/apis/exams",
          options: {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(apiPayload),
          },
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`,
        );
      }

      const responseDataRaw = await response.json();
      const responseData = responseDataRaw.data || responseDataRaw;
      generatedPapersData = {
        examInfo: {
          exam_name: responseData.exam_name,
          exam_code: responseData.exam_code,
          status: responseData.status,
          number_of_sets: responseData.number_of_sets,
          number_of_versions: responseData.number_of_versions,
          no_of_qns: responseData.no_of_qns || responseData.total_questions,
          subject: responseData.subject,
          medium: responseData.medium,
          exam_type: responseData.exam_type,
        },
        questionPapers: responseData.question_papers || [],
        shortfallInfo: responseData.shortfall_info || {},
        chapterTopics: responseData.chapter_topics || [],
        questionsToExclude: responseData.questions_to_exclude || [],
        generatedAt: new Date().toISOString(),
        originalPayload: apiPayload,
        apiResponse: responseDataRaw,
      };

      if (typeof apiPayloadStore.updateGeneratedPapers === "function") {
        apiPayloadStore.updateGeneratedPapers(generatedPapersData);
      }

      currentView = "generate";
      generationResult.message = `Successfully generated question papers for "${responseData.exam_name}"!\n\nSets: ${responseData.number_of_sets}\nVersions: ${responseData.number_of_versions}`;
      generationResult.type = "success";
    } catch (error) {
      let errorMessage = "Failed to generate question papers.\n\n";
      errorMessage += error.message;

      if (error.message.includes("Chapter/topic selections are required")) {
        errorMessage +=
          '\n\nTry clicking "Force API Store Update" button and then try again.';
      }

      generationResult.message = errorMessage;
      generationResult.type = "error";
    } finally {
      generationInProgress = false;
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (
      examDetailsValid &&
      classSubjectValid &&
      examConfigValid &&
      difficultyValid &&
      isAllocationConfirmed
    ) {
      currentView = "review";
    } else {
      const errors = [];
      if (!examDetailsValid) errors.push("Exam details are incomplete");
      if (!classSubjectValid)
        errors.push("Class and subject selection is required");
      if (!examConfigValid) errors.push("Exam configuration is invalid");
      if (!difficultyValid)
        errors.push("Difficulty distribution must total 100%");
      if (!isAllocationConfirmed)
        errors.push("Question allocation must be confirmed");
      alert(errors.join("\n"));
    }
  }

  async function handleQuestionSelect(event) {
    const { item, type } = event.detail;
    try {
      const mockData = mockQuestionsData[type.toLowerCase()];
      if (!mockData) {
        throw new Error("Invalid selection type");
      }

      const fetchedQuestions = mockData.questions.map((q) => ({
        id: q.id,
        text: q.text,
        type: q.type,
        marks: q.marks,
        difficulty: q.difficulty,
        parent: q.parent,
        subject_code: q.subject_code,
        type_codes: q.type_codes,
        isRemoved: false,
      }));

      allQuestions = [...allQuestions, ...fetchedQuestions];
    } catch (err) {
      alert("Failed to load questions: " + err.message);
    }
  }

  async function handleClassSubjectSelect(event) {
    const { standard, subject_code, medium_code } = event.detail;
    if (standard) examClass = standard;
    if (subject_code) examSubject = subject_code;
    if (medium_code) examMedium = medium_code;

    apiPayloadStore.updateClassSubject({
      subject_code: subject_code || examSubject,
      medium_code: medium_code || examMedium,
      examClass: standard || examClass,
    });
  }

  function handleFetchQuestions(event) {
    fetchedQuestions = event.detail.questions;
  }

  onDestroy(() => {
    selectedContentStore.clearAll();
  });
</script>

<div class="mb-4">
  <StepIndicator totalSteps={3} currentStep={currentStepIndex} {stepTitle} />
</div>

<div class="flex">
  <div class="flex-1 mx-auto w-full">
    <div class="rounded-lg">
      <div class="">
        {#if isLoading}
          <div class="flex items-center justify-center py-12">
            <div class="text-center">
              <div
                class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"
              ></div>
              <p class="text-gray-600">Loading exam details...</p>
            </div>
          </div>
        {:else if loadError}
          <div class="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg
                  class="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800">
                  Error loading exam details
                </h3>
                <div class="mt-2 text-sm text-red-700">
                  <p>{loadError}</p>
                </div>
              </div>
            </div>
          </div>
        {:else if currentView === "config"}
          <form on:submit|preventDefault={handleSubmit}>
            <Card className="!p-8">
              <div class="space-y-8">
                <div class="space-y-6">
                  <ExamDetailsForm
                    bind:examTitle
                    bind:examMode
                    bind:isValid={examDetailsValid}
                  />
                  <ClassSubjectSelector
                    bind:examClass
                    bind:examMedium
                    bind:examSubject
                    bind:examMediumName
                    bind:examSubjectName
                    bind:isValid={classSubjectValid}
                    on:change={handleClassSubjectSelect}
                  />
                </div>
                <hr class="divider-line" />
                <ExamConfig
                  bind:totalTime
                  bind:numberOfSets
                  bind:numberOfVersions
                  on:validate={handleExamConfigValidation}
                />
                <hr class="divider-line" />
                <DifficultyDistribution
                  bind:easy
                  bind:medium
                  bind:hard
                  bind:isValid={difficultyValid}
                  isReviewPageEnabled={false}
                />
              </div>
            </Card>

            {#if examClass && examSubject && examMedium}
              <div class="space-y-6 mt-8 w-full">
                <Card title="Content Selection & Question Allocation">
                  <NestedContentTable
                    bind:this={nestedContentTableRef}
                    {examClass}
                    {examSubject}
                    {examMedium}
                    bind:totalQuestions
                    {examTitle}
                    bind:examMode
                    bind:totalTime
                    bind:numberOfVersions
                    bind:numberOfSets
                    bind:showQuestions
                    bind:fetchedQuestions
                    bind:activeTab={nestedContentActiveTab}
                    on:select={handleQuestionSelect}
                    on:fetchQuestions={handleFetchQuestions}
                    on:allocationConfirmed={handleAllocationConfirmed}
                    on:draftSaved={handleSaveDraft}
                    bind:savingDraft={isSavingDraft}
                    bind:draftSaveError
                    bind:draftSaveSuccess
                  />
                </Card>
                {#if allocationResult.message}
                  <InlineNotification
                    title={`Allocation ${allocationResult.type === "error" ? "Error" : "Successful"}`}
                    subtitle={allocationResult.message}
                    kind={allocationResult.type}
                  />
                {/if}
              </div>
            {/if}

            <div
              class="flex justify-between mt-8 pt-6 divider-line w-full px-4"
            >
              <button
                type="button"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                on:click={handleReset}
              >
                Reset
              </button>
            </div>
          </form>
        {:else if currentView === "review"}
          <div class="w-full">
            <ReviewPage
              {examTitle}
              {examMode}
              {examClass}
              examMedium={examMediumName}
              examSubject={examSubjectName}
              {totalTime}
              {totalQuestions}
              {numberOfSets}
              {numberOfVersions}
              allocationData={confirmedAllocationData}
              {easy}
              {medium}
              {hard}
              {generationInProgress}
              isReviewPageEnabled={true}
              questions={allQuestions}
              on:back={handleBackFromReview}
              on:generate={handleGeneratePapers}
            />
          </div>
          {#if generationResult.type === "error"}
            <div class="mt-2">
              <InlineNotification
                title={"Question paper generation failed"}
                subtitle={generationResult.message}
                kind={generationResult.type}
              />
            </div>
          {/if}
        {:else if currentView === "generate"}
          <div class="w-full">
            <GeneratePapers
              {examTitle}
              {examClass}
              examMedium={examMediumName}
              examSubject={examSubjectName}
              {numberOfSets}
              {numberOfVersions}
              questions={allQuestions}
              allocationData={confirmedAllocationData}
              {generationResult}
              {generatedPapersData}
            />
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
