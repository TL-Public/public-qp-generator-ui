<script>
  import ExamDetailsForm from "$lib/components/Forms/ExamDetailsForm.svelte";
  import ExamConfig from "$lib/components/ExamConfig.svelte";
  import DifficultyDistribution from "$lib/components/DifficultyDistribution.svelte";
  import ClassSubjectSelector from "$lib/components/ClassSubjectSelector.svelte";
  import Card from "$lib/components/Cards/Card.svelte";
  import ReviewPage from "$lib/components/ReviewPage.svelte";
  import StepIndicator from "$lib/components/quiz/StepIndicator.svelte";

  import GeneratePapers from "$lib/components/GeneratePapers.svelte";

  import { api } from "$lib/utils/api";
  import { questionPaperStore } from "$lib/stores/questionPaperStore";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { browser } from "$app/environment";

  import VerticalStepper from "$lib/components/VerticalStepper.svelte";
  import { v4 as uuidv4 } from "uuid";

  import NestedContentTable from "$lib/components/NestedContentTable.svelte";
  import { mockQuestionsData } from "$lib/utils/mockData.js";
  import { selectedContentStore } from "$lib/stores/selectedContentStore.js";
  import { apiPayloadStore } from "$lib/stores/apiPayLoadStore.js";
  import { onDestroy } from "svelte";
  import InlineNotification from "$lib/components/InlineNotification.svelte";

  // Initialize state variables
  let allQuestions = [];
  let activeTab = "groups";
  let paperId = uuidv4();
  let fetchedQuestions = [];

  // Exam details state
  let examMode = "Online";
  let examTitle = "";
   let examClass = "";
  let examMedium = "";
  let examSubject = "";
  // let examTitle = "New title";
  // let examClass = "10";
  // let examMedium = "2000";
  // let examSubject = "3000";
  let examMediumName = "";
  let examSubjectName = "";

  // Initialize validation states
  let examDetailsValid = true;
  let classSubjectValid = true;
  let examConfigValid = true;
  let difficultyValid = true;

  // Initialize validation errors object
  let validationErrors = {
    questions: null,
    versions: null,
    sets: null,
  };

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

  // Navigation state
  let currentView = "config";
  let shouldNavigateToReview = false;
  let showQuestions = false;
  let nestedContentActiveTab = "selected-content";

  let allocationResult = {
  message: "",
  type: "success", // or "error"
};

let generationResult = {
  message: "",
  type: "success", // or "error"
}

  // Step Configuration
  const STEPS = {
    config: { index: 1, title: "Add Exam Details" },
    review: { index: 2, title: "Review Configuration" },
    generate: { index: 3, title: "Generated Papers" },
  };

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

  $: currentStepIndex = STEPS[currentView].index;
  $: stepTitle = STEPS[currentView].title;

  // Difficulty distribution
  let easy = 40;
  let medium = 40;
  let hard = 20;

  // Reference for nested content table
  let nestedContentTableRef;

  // Update the back handler in ReviewPage
  function handleBackFromReview() {
    // Reset to content selection view
    currentView = "config";
    currentStep = "allocation";

    // Set showQuestions to true to ensure selected questions are shown
    showQuestions = true;
    nestedContentActiveTab = "selected-content";

    // Update hash to content selection
    if (browser) {
      goto("#selected-content", { replaceState: true, noScroll: true });
    }
  }

  // Step tracking
  let completedSteps = {
    examDetails: false,
    examConfig: false,
    difficulty: false,
    classSubject: false,
    allocation: false,
    review: false,
  };

  let currentStep = "examDetails";

  // Reactive statements
  $: {
    completedSteps = {
      examDetails: !!examTitle && !!examMode && examDetailsValid,
      examConfig: examConfigValid,
      difficulty: difficultyValid,
      classSubject:
        !!examClass && !!examSubject && !!examMedium && classSubjectValid,
      allocation: isAllocationConfirmed,
      review: currentView === "review",
    };
  }

  // Navigation reactive statement
  $: {
    if (
      shouldNavigateToReview &&
      isAllocationConfirmed &&
      confirmedAllocationData
    ) {
      currentView = "review";
      currentStep = "review";
      shouldNavigateToReview = false; // Reset the flag
    }
  }

  let isReviewPageEnabled = false;
  $: isReviewPageEnabled = currentView !== "config";

  // Add state for selected items
  let selectedChapter = null;
  let selectedTopic = null;
  let selectedSubtopic = null;

  // Event Handlers
  function handleReset() {
    allQuestions = [];
    isAllocationConfirmed = false;
    confirmedAllocationData = null;
    selectedContentStore.clearAll();
  }

  function handleDelete() {
    allQuestions = [];
    isAllocationConfirmed = false;
    confirmedAllocationData = null;
  }

  function handleExamConfigValidation(event) {
    examConfigValid = event.detail.isValid;
    validationErrors = event.detail.errors || {
      questions: null,
      versions: null,
      sets: null,
    };

    if (examConfigValid) {
      questionPaperStore.updateExamConfig({
        total_time: totalTime,
        total_questions: totalQuestions,
        no_of_versions: numberOfVersions,
        no_of_sets: numberOfSets,
      });
    }
    completedSteps.examConfig = examConfigValid;
    if (examConfigValid) currentStep = "difficulty";
  }


  // Simplify - use one handler that checks for the navigateToReview flag
  function handleAllocationConfirmed(event) {
    allocationResult.message = "";
    allocationResult.type = "success";
    const data = event.detail || event;
   
    if (!data) {
      allocationResult.message = "Invalid allocation data received. Please try again.";
      allocationResult.type = "error";
      return;
    }

    const allocationData = data;

    // Validate the allocation data structure
    if (
      !allocationData.selectedItems ||
      !Array.isArray(allocationData.selectedItems)
    ) {
      allocationResult.message = "Invalid allocation data format. Please try again.";
      allocationResult.type = "error";
      return;
    }

    // Update state
    isAllocationConfirmed = true;
    confirmedAllocationData = allocationData;
    // console.log("confirmedAllocationData", confirmedAllocationData);
    // Update API store with allocation data immediately
    apiPayloadStore.updateFromAllocationData(allocationData);

    // Also update API store with current exam details to ensure everything is in sync
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

    // Update excluded questions if any
    if (allQuestions?.length > 0) {
      const excludedQuestions = allQuestions
        .filter((q) => q.isRemoved === true)
        .map((q) => q.id || q.code)
        .filter(Boolean);

      if (excludedQuestions.length > 0) {
        apiPayloadStore.updateExcludedQuestions(excludedQuestions);
      }
    }

    // Update the legacy store for backward compatibility
    if (typeof questionPaperStore.updateAllocationData === "function") {
      questionPaperStore.updateAllocationData(allocationData);
    }

    // Trigger navigation to review
    shouldNavigateToReview = true;

    // Debug the API store state
    const payloadResult = apiPayloadStore.getApiPayload();
  }

  function handleCreatePaper(event) {
    event.preventDefault();

    if (!isAllocationConfirmed) {
      allocationResult.message = "Please confirm your question allocation first.";
      allocationResult.type = "error";
      return;
    }

    // Update API store with all current data
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

    // Update excluded questions if any
    if (allQuestions?.length > 0) {
      const excludedQuestions = allQuestions
        .filter((q) => q.isRemoved === true)
        .map((q) => q.id || q.code)
        .filter(Boolean);

      if (excludedQuestions.length > 0) {
        apiPayloadStore.updateExcludedQuestions(excludedQuestions);
      }
    }

    if (difficultyValid) {
      currentView = "review";
    }
  }

  function handleQuestionsUpdate(event) {
    allQuestions = event.detail;
  }

  function handleExamConfigUpdate(event) {
    totalTime = event.detail.totalTime;
    totalQuestions = event.detail.totalQuestions;
    numberOfSets = event.detail.numberOfSets;
    numberOfVersions = event.detail.numberOfVersions;
  }

  async function handleGeneratePapers() {
    try {
      generationResult.message = "";
      generationResult.type = "success";
      // Try to update API store one more time before generating
      if (confirmedAllocationData && confirmedAllocationData.selectedItems) {
        apiPayloadStore.updateFromAllocationData(confirmedAllocationData);
      }

      // Get the API payload from the store
      const payloadResult = apiPayloadStore.getApiPayload();

      if (!payloadResult.isValid) {
        // Provide more detailed error information

        throw new Error("Invalid data: " + payloadResult.errors.join(", "));
      }

      let apiPayload = payloadResult.payload;
      apiPayload = {
        ...apiPayload,
        status: 2,
      };

      // Make the API call
      const response = await api.questionPapers.create(apiPayload);

      if (response.error) {
        throw new Error(response.error);
      }

      if (!response.data) {
        throw new Error("No data received from server");
      }

      const responseData = response.data.data || response.data;
      // Store the generated data with updated structure
      const generatedPapersData = {
        examInfo: {
          exam_name: responseData.exam_name,
          exam_code: responseData.exam_code,
          status: responseData.status, // Will be "closed"
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
        apiResponse: response.data, // Store full API response for reference
      };
      // Update the store
      if (typeof questionPaperStore.updateGeneratedPapers === "function") {
        questionPaperStore.updateGeneratedPapers(generatedPapersData);
      }

      // Navigate to the generate view
      currentView = "generate";

      // Show success message
      const paperCount = response.data.question_papers?.length || 0;
      generationResult.message = `Successfully generated question papers for "${responseData.exam_name}"!\n\nSets: ${responseData.number_of_sets}\nVersions: ${responseData.number_of_versions}`;
      generationResult.type = "success";
    } catch (error) {
      let errorMessage = "Failed to generate question papers.\n\n";
      errorMessage += error.message;

      // Add suggestion for debugging
      if (error.message.includes("Chapter/topic selections are required")) {
        errorMessage +=
          '\n\nTry clicking "Force API Store Update" button and then try again.';
      }

      generationResult.message = errorMessage;
      generationResult.type = "error";
    }
  }



  function handleSubmit(event) {
    event.preventDefault();
    // Add any form submission logic here
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

  function handleSelectionUpdate(event) {
    const { chapter, topic, subtopic, selections } = event.detail;

    if (selectedChapter !== chapter?.id) {
      allQuestions = [];
      isAllocationConfirmed = false;
    }

    selectedChapter = chapter?.id;
    selectedTopic = topic?.id;
    selectedSubtopic = subtopic?.id;
  }

  async function handleQuestionSelect(event) {
    const { item, type } = event.detail;

    try {
      // Get mock data based on selection type
      const mockData = mockQuestionsData[type.toLowerCase()];

      if (!mockData) {
        throw new Error("Invalid selection type");
      }

      // Process questions from mock data
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

      // Update allQuestions with new questions
      allQuestions = [...allQuestions, ...fetchedQuestions];
    } catch (err) {
      alert("Failed to load questions: " + err.message);
    }
  }

  function handleQuestionRemoval(event) {
    const questionId = event.detail;
    allQuestions = allQuestions.map((q) =>
      q.id === questionId ? { ...q, isRemoved: !q.isRemoved } : q,
    );
  }

  function handleExamDetailsSubmit(event) {
    const { examTitle, examMode } = event.detail;
    questionPaperStore.updateExamDetails({ examTitle, examMode });
    if (examDetailsValid) {
      currentStep = "examConfig";
    }
  }

  function handleExamConfigSubmit(event) {
    const { totalTime, totalQuestions, numberOfVersions, numberOfSets } =
      event.detail;
    questionPaperStore.updateExamConfig({
      totalTime,
      totalQuestions,
      numberOfVersions,
      numberOfSets,
    });

    if (examConfigValid) {
      currentStep = "difficulty";
    }
  }

  async function handleClassSubjectSelect(event) {
    const { standard, subject_code, medium_code } = event.detail;
console.log('standard',standard, 'subject_code', subject_code, 'medium_code', medium_code);
    if (allQuestions.length > 0) {
      currentStep = "allocation";
    }

    // Also update the local state to ensure it's in sync if variables aren't bound correctly
    if (standard) examClass = standard;
    if (subject_code) examSubject = subject_code;
    if (medium_code) examMedium = medium_code;

    questionPaperStore.updateClassSubject({
      subject_code: subject_code || examSubject,
      medium_code: medium_code || examMedium,
      examClass: standard || examClass,
    });
  }

  function handleQuestionsRemoved(event) {
    const removedIds = event.detail;
    questionPaperStore.updateExcludedQuestions(removedIds);
  }

  function handleFetchQuestions(event) {
    fetchedQuestions = event.detail.questions;
  }

  function handleForceApiStoreUpdate() {
    // Update API store with current exam details
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

    // Update excluded questions if any
    if (allQuestions?.length > 0) {
      const excludedQuestions = allQuestions
        .filter((q) => q.isRemoved === true)
        .map((q) => q.id || q.code)
        .filter(Boolean);

      if (excludedQuestions.length > 0) {
        apiPayloadStore.updateExcludedQuestions(excludedQuestions);
      }
    }
  }

  onDestroy(() => {
    // Clean up API store when component is destroyed
    selectedContentStore.clearAll();
  });
</script>


<div class="mb-4 max-w-5xl mx-auto">
<StepIndicator
  totalSteps={3}
  currentStep={currentStepIndex}
  {stepTitle}
/>

</div>
<!-- Template remains the same as before -->
<div class="flex min-h-screen max-w-5xl mx-auto">
  <!-- Stepper -->
  <!-- <div
    class="w-48 flex-shrink-0 p-2 bg-white sticky top-0 h-screen overflow-y-auto"
  >
    <VerticalStepper
      steps={[
        {
          id: "examDetails",
          label: "Exam Details",
          completed: completedSteps.examDetails,
        },
        {
          id: "examConfig",
          label: "Paper Configuration",
          completed: completedSteps.examConfig,
        },
        {
          id: "difficulty",
          label: "Difficulty Distribution",
          completed: completedSteps.difficulty,
        },
        {
          id: "classSubject",
          label: "Class & Subject",
          completed: completedSteps.classSubject,
        },
        {
          id: "allocation",
          label: "Question Allocation",
          completed: completedSteps.allocation,
        },
        { id: "review", label: "Review", completed: completedSteps.review },
      ]}
      {currentStep}
    />
  </div> -->

  <!-- Main content -->
   
  <div class="flex-1 mx-auto w-full max-w-7xl">
    <div class=" rounded-lg">
      <!-- <div class="px-8 py-4 border-b border-gray-200">
        <h1 class="text-2xl font-bold text-gray-900">Create exam event</h1>
      </div> -->

      <div class="">
        {#if currentView === "config"}
          <form on:submit|preventDefault={handleSubmit}>
            <!-- Exam Details -->
            <Card className="!p-8" >
              <div class=" space-y-8">
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
                <!-- Exam Config -->
                <hr class="divider-line" />
                <ExamConfig
                  bind:totalTime
                  bind:numberOfSets
                  bind:numberOfVersions
                  on:validate={handleExamConfigValidation}
                />
                <hr class="divider-line" />
                <!-- Difficulty Distribution -->

                <DifficultyDistribution
                  bind:easy
                  bind:medium
                  bind:hard
                  bind:isValid={difficultyValid}
                  isReviewPageEnabled={false}
                />
              </div>
            </Card>
            <!-- Class & Subject Selection -->

            <!-- Content Selection & Allocation -->
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
                    navigateToReview={shouldNavigateToReview}
                    on:select={handleQuestionSelect}
                    on:fetchQuestions={handleFetchQuestions}
                    on:allocationConfirmed={(data) => {
                      handleAllocationConfirmed(data);
                    }}
                  />
                </Card>
                {#if allocationResult.message}
                  <InlineNotification  title={`Allocation ${allocationResult.type === "error" ? "Error" : "Successful"}`} subtitle={allocationResult.message} kind={allocationResult.type} />
                {/if}
              </div>
            {/if}

            <!-- Action buttons -->
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
              isReviewPageEnabled={true}
              questions={allQuestions}
              on:back={handleBackFromReview}
              on:generate={handleGeneratePapers}
            />
          </div>
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
              generationResult={generationResult}
            />
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
