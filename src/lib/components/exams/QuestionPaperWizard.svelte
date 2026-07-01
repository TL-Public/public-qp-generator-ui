<script>
  import ExamDetailsForm from "$lib/components/Forms/ExamDetailsForm.svelte";
  import ExamConfig from "$lib/components/ExamConfig.svelte";
  import DifficultyConfigurator from "$lib/components/DifficultyConfigurator.svelte";
  import ClassSubjectSelector from "$lib/components/ClassSubjectSelector.svelte";
  import Card from "$lib/components/Cards/Card.svelte";
  import ReviewPage from "$lib/components/ReviewPage.svelte";
  import StepIndicator from "$lib/components/quiz/StepIndicator.svelte";

  import GeneratePapers from "$lib/components/GeneratePapers.svelte";
  import Portal from "$lib/components/Portal.svelte";
  import PortalBackdrop from "$lib/components/PortalBackdrop.svelte";
  import ResetConfirmationModal from "$lib/components/exams/ResetConfirmationModal.svelte";
  import InlineNotification from "$lib/components/InlineNotification.svelte";

  import { apiClient } from "$lib/utils/api";
  import { createApiPayloadStore } from "$lib/stores/apiPayLoadStore";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { browser } from "$app/environment";

  import NestedContentTable from "$lib/components/NestedContentTable.svelte";
  import { mockQuestionsData } from "$lib/utils/mockData.js";
  import { createSelectedContentStore } from "$lib/stores/selectedContentStore.js";

  import { onDestroy, onMount, tick, setContext } from "svelte";
  import { cleanQuestionText, normalizeExcludedQuestion } from "$lib/utils/textUtils.js";
  import SpinnerWithText from "$lib/components/SpinnerWithText.svelte";

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

  // Encapsulated Exam Config & Details State
  let examData = {
    examMode: "Online",
    examTitle: "",
    examClass: "",
    examMedium: "",
    examSubject: "",
    examMediumName: "",
    examSubjectName: "",
    examCode: examId || "",
    totalTime: 40,
    totalQuestions: 40,
    numberOfSets: 1,
    numberOfVersions: 1,
    easy: 40,
    medium: 40,
    hard: 20,
    autoBalance: true,
    isAllocationConfirmed: false,
    confirmedAllocationData: null,
  };

  // Loading state
  let isLoading = false;
  let loadError = null;

  // Initialize validation states
  let examDetailsValid = true;
  let classSubjectValid = true;
  let examConfigValid = true;
  let difficultyValid = true;
  let showErrors = false;

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
      if (view === "config" && examData.isAllocationConfirmed) {
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

  // Reference for nested content table
  let nestedContentTableRef;

  // API Options & States
  let mediumOptions = [];
  let subjectOptions = [];
  let classSubjectLoading = { mediums: false, subjects: false };
  let classSubjectError = null;

  let chaptersData = [];
  let chaptersLoading = false;
  let chaptersError = null;
  let questionIsLoading = false;

  async function fetchMediums() {
    try {
      classSubjectLoading.mediums = true;
      const res = await apiClient({ url: "/apis/mediums" });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP error! status: ${res.status}`,
        );
      }
      const responseData = await res.json();
      const mediumsData = responseData.data || [];
      mediumOptions = mediumsData.map((medium) => ({
        value: medium.medium_code,
        label: medium.medium_name,
      }));
    } catch (err) {
      console.error("Error in fetchMediums:", err);
      classSubjectError = "Failed to load mediums";
      mediumOptions = [];
    } finally {
      classSubjectLoading.mediums = false;
    }
  }

  async function fetchSubjects() {
    try {
      classSubjectLoading.subjects = true;
      const res = await apiClient({ url: "/apis/subjects" });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP error! status: ${res.status}`,
        );
      }
      const responseData = await res.json();
      const allSubjects = responseData.data || [];
      subjectOptions = allSubjects.map((subject) => ({
        value: subject.subject_code,
        label: subject.subject_name,
        standard: subject.standard,
        mediumCode: subject.medium_code,
      }));
    } catch (err) {
      console.error("Error fetching subjects:", err);
      classSubjectError = "Failed to load subjects";
      subjectOptions = [];
    } finally {
      classSubjectLoading.subjects = false;
    }
  }

  let lastFetchedKey = "";

  async function fetchChaptersTopics() {
    if (!examData.examClass || !examData.examSubject || !examData.examMedium)
      return;
    chaptersLoading = true;
    chaptersError = null;
    try {
      const queryParams = new URLSearchParams({
        standard: examData.examClass,
        subject_code: examData.examSubject,
        medium_code: examData.examMedium,
      }).toString();

      const res = await apiClient({
        url: `/apis/chapters_topics?${queryParams}`,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP error! status: ${res.status}`,
        );
      }

      const data = await res.json();
      chaptersData = data.data || data;
    } catch (err) {
      chaptersError = err.message;
    } finally {
      chaptersLoading = false;
    }
  }

  // Reactive trigger for loading chapters when selections change
  $: {
    const currentKey = `${examData.examClass}-${examData.examSubject}-${examData.examMedium}`;
    if (
      examData.examClass &&
      examData.examSubject &&
      examData.examMedium &&
      currentKey !== lastFetchedKey
    ) {
      lastFetchedKey = currentKey;
      fetchChaptersTopics();
    }
  }

  async function handleFetchQuestionsRequest(event) {
    const { chapters, topics, onSuccess } = event.detail;
    questionIsLoading = true;
    try {
      const apiCalls = [];
      if (chapters && chapters.length > 0) {
        const chapterCodes = chapters.map((c) => c.code).join(",");
        apiCalls.push(
          apiClient({
            url: `/apis/questions?type=chapter&codes=${chapterCodes}`,
          }),
        );
      }
      if (topics && topics.length > 0) {
        const topicCodes = topics.map((t) => t.code).join(",");
        apiCalls.push(
          apiClient({
            url: `/apis/questions?type=topic&codes=${topicCodes}`,
          }),
        );
      }
      if (apiCalls.length === 0) {
        fetchedQuestions = [];
        return;
      }
      const responses = await Promise.all(apiCalls);
      let allQuestionsData = [];
      for (const res of responses) {
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(
            errorData.detail || `HTTP error! status: ${res.status}`,
          );
        }
        const data = await res.json();
        if (data && data.qns) {
          const cleanedQuestions = data.qns.map(cleanQuestionText);
          allQuestionsData = [...allQuestionsData, ...cleanedQuestions];
        }
      }

      if (allQuestionsData.length > 0) {
        fetchedQuestions = allQuestionsData.map((allQuestion) => {
          return {
            id: allQuestion.code,
            text: allQuestion.text,
            type: allQuestion.type,
            marks: allQuestion.marks,
            difficulty: allQuestion.difficulty_level,
            parent: {
              name: allQuestion.grp_type_name,
              type: allQuestion.grp_type,
              code: allQuestion.grp_type_code,
            },
          };
        });

        selectedContentStore.setQuestions(fetchedQuestions);
        if (onSuccess) onSuccess();
      } else {
        fetchedQuestions = [];
      }
    } catch (err) {
      alert("Failed to load questions: " + err.message);
    } finally {
      questionIsLoading = false;
    }
  }

  function countQuestionsForItemInWizard(
    itemCode,
    itemType,
    questions,
    excludedCodes,
  ) {
    if (!questions || questions.length === 0) return 0;

    const activeQuestions = questions.filter(
      (q) => !excludedCodes.includes(q.id),
    );

    return activeQuestions.filter((q) => {
      if (q.parent?.code === itemCode) return true;

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

  /**
   * Fetches the dropdown options for mediums and subjects.
   */
  async function initializeDropdownOptions() {
    await Promise.all([fetchMediums(), fetchSubjects()]);
  }

  /**
   * Fetches exam details from the API using the current examCode.
   * @param {string} examCode - The code of the exam to fetch.
   * @returns {Promise<Object>} The parsed exam response containing design and status.
   */
  async function fetchExamDetails(examCode) {
    const examRes = await apiClient({
      url: `/apis/exams/${examCode}`,
    });

    if (!examRes.ok) {
      const errorData = await examRes.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `HTTP error! status: ${examRes.status}`,
      );
    }

    return await examRes.json();
  }

  /**
   * Populates the local state with values loaded from the exam design configuration.
   * @param {Object} design - The design details object from the exam API response.
   */
  async function populateExamFields(design) {
    examData.examTitle = design.exam_name || "";
    examData.examMode = design.exam_mode
      ? design.exam_mode.charAt(0).toUpperCase() + design.exam_mode.slice(1)
      : "Online";
    examData.examClass = design.standard || "";
    examData.examMediumName = design.medium || "";
    examData.examSubjectName = design.subject || "";

    // Map medium code
    let mediumCode = design.medium_code || "";
    if (!mediumCode && design.medium) {
      const foundMedium = mediumOptions.find(
        (m) =>
          m.label?.toLowerCase() === design.medium?.toLowerCase() ||
          m.label === design.medium,
      );
      mediumCode = foundMedium?.value || "";
    }
    examData.examMedium = mediumCode;

    // Map subject code
    let subjectCode = design.subject_code || "";
    if (!subjectCode && design.subject) {
      const foundSubject = subjectOptions.find(
        (s) =>
          (s.label?.toLowerCase() === design.subject?.toLowerCase() ||
            s.label === design.subject) &&
          (s.standard === design.standard || !design.standard),
      );
      subjectCode = foundSubject?.value || "";
    }
    examData.examSubject = subjectCode;

    const mappedMediumCode = mediumCode;
    const mappedSubjectCode = subjectCode;

    // Tick and delay to ensure select elements are completely mounted and populated
    await tick();

    examData.examMedium = mappedMediumCode;
    examData.examSubject = mappedSubjectCode;

    // Populate question count details
    examData.totalTime = design.total_time;
    examData.totalQuestions = design.total_questions || 40;
    examData.numberOfSets = design.number_of_sets || 1;
    examData.numberOfVersions = design.number_of_versions || 1;

    // Sync state values with apiPayloadStore
    apiPayloadStore.updatePayload({
      exam_name: examData.examTitle,
      exam_mode: examData.examMode,
      total_time: examData.totalTime,
      total_questions: examData.totalQuestions,
      no_of_versions: examData.numberOfVersions,
      no_of_sets: examData.numberOfSets,
      subject_code: examData.examSubject,
      medium_code: examData.examMedium,
      standard: examData.examClass,
    });
  }

  /**
   * Evaluates if all qn_count values in loaded chapters_topics are null to infer the allocation mode.
   * @param {Array} chaptersTopics - Selected chapters/topics array.
   * @returns {boolean} True if all qn_count values are null (signaling Auto allocation).
   */
  function determineAllocationMode(chaptersTopics) {
    let allQnCountNull = true;
    for (const group of chaptersTopics) {
      const codes = group.codes || [];
      for (const item of codes) {
        if (item.qn_count !== null && typeof item.qn_count !== "undefined") {
          allQnCountNull = false;
          break;
        }
      }
      if (!allQnCountNull) break;
    }
    return allQnCountNull;
  }

  /**
   * Pre-populates selectedContentStore and sets up initial allocation tracking.
   * @param {Array} chaptersTopics - Selected chapters/topics list.
   * @param {boolean} allQnCountNull - Allocation mode indicator.
   * @returns {Object} Lists of parsed chapters/topics and calculated totals.
   */
  function initializeAllocationState(chaptersTopics, allQnCountNull) {
    const chaptersList = [];
    const topicsList = [];
    const selectedItems = [];
    let totalAllocated = 0;

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

        const qCount = item.qn_count || item.question_count || 0;
        totalAllocated += qCount;
        selectedItems.push({
          code: item.code,
          name: item.name,
          type: type,
          questionAvailable: qCount || 0,
          questionsToAdd: qCount,
          isSelected: true,
        });

        if (type === "topic") {
          selectionData.parent_code =
            item.chapter_details?.code || item.parent_code;
          topicsList.push(item);
        } else if (type === "subtopic") {
          selectionData.parent_code =
            item.topic_details?.code || item.parent_code;
        } else if (type === "chapter") {
          selectionData.parent_code = null;
          chaptersList.push(item);
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

    // Set initial confirmed allocation details for review step navigation
    const initialAllocationData = {
      allocationType: allQnCountNull ? "Auto" : "Manual",
      allocationLevel: "chapter",
      totalRequired: examData.totalQuestions,
      totalAllocated: totalAllocated,
      totalAvailable: 0,
      remaining: examData.totalQuestions - totalAllocated,
      selectedItems: selectedItems,
    };
    examData.confirmedAllocationData = initialAllocationData;
    examData.isAllocationConfirmed = true;
    apiPayloadStore.updateFromAllocationData(initialAllocationData);

    return { chaptersList, topicsList, selectedItems, totalAllocated };
  }

  /**
   * Queries APIs for question counts and populates active/excluded store lists.
   * @param {Array} chaptersList - Selected chapters.
   * @param {Array} topicsList - Selected topics.
   * @param {Object} design - The design object containing exclusions.
   */
  async function preFetchQuestionsForEdit(chaptersList, topicsList, design) {
    if (chaptersList.length === 0 && topicsList.length === 0) return;

    questionIsLoading = true;
    try {
      const apiCalls = [];
      if (chaptersList.length > 0) {
        const chapterCodes = chaptersList.map((c) => c.code).join(",");
        apiCalls.push(
          apiClient({
            url: `/apis/questions?type=chapter&codes=${chapterCodes}`,
          }),
        );
      }
      if (topicsList.length > 0) {
        const topicCodes = topicsList.map((t) => t.code).join(",");
        apiCalls.push(
          apiClient({
            url: `/apis/questions?type=topic&codes=${topicCodes}`,
          }),
        );
      }

      const responses = await Promise.all(apiCalls);
      let allQuestionsData = [];
      for (const res of responses) {
        if (res.ok) {
          const data = await res.json();
          if (data && data.qns) {
            const cleanedQuestions = data.qns.map(cleanQuestionText);
            allQuestionsData = [...allQuestionsData, ...cleanedQuestions];
          }
        }
      }

      if (allQuestionsData.length > 0) {
        fetchedQuestions = allQuestionsData.map((allQuestion) => {
          return {
            id: allQuestion.code,
            text: allQuestion.text,
            type: allQuestion.type,
            marks: allQuestion.marks,
            difficulty: allQuestion.difficulty_level,
            parent: {
              name: allQuestion.grp_type_name,
              type: allQuestion.grp_type,
              code: allQuestion.grp_type_code,
            },
          };
        });

        selectedContentStore.setQuestions(fetchedQuestions);

        // Remove initially excluded questions in store
        const excludedCodes = (design.qtn_codes_to_exclude || [])
          .map((q) => (typeof q === "object" ? q.code : q))
          .filter(Boolean);
        for (const code of excludedCodes) {
          selectedContentStore.removeQuestion(code);
        }

        // Tally available questions and update confirmedAllocationData
        if (examData.confirmedAllocationData) {
          let updatedTotalAvailable = 0;
          const updatedSelectedItems =
            examData.confirmedAllocationData.selectedItems.map((item) => {
              const availableCount = countQuestionsForItemInWizard(
                item.code,
                item.type,
                fetchedQuestions,
                excludedCodes,
              );
              updatedTotalAvailable += availableCount;
              return {
                ...item,
                questionAvailable: availableCount,
              };
            });

          examData.confirmedAllocationData = {
            ...examData.confirmedAllocationData,
            totalAvailable: updatedTotalAvailable,
            selectedItems: updatedSelectedItems,
          };
          apiPayloadStore.updateFromAllocationData(
            examData.confirmedAllocationData,
          );
        }
      }
    } catch (err) {
      console.error("Failed to pre-fetch questions in edit mode:", err);
    } finally {
      questionIsLoading = false;
    }
  }

  async function loadWizardData() {
    isLoading = true;
    loadError = null;

    try {
      // Always fetch mediums and subjects dropdown options first
      await initializeDropdownOptions();

      if (!isEditMode) {
        return;
      }

      // Fetch active exam config details
      const examResponse = await fetchExamDetails(examData.examCode);
      if (!examResponse || !examResponse.design) {
        throw new Error("Invalid response: missing design data");
      }

      const design = examResponse.design;

      // Populate input configuration fields
      await populateExamFields(design);

      // Initialize selected content and question listings if any exist
      const chaptersTopics = design.chapters_topics;
      if (
        chaptersTopics &&
        Array.isArray(chaptersTopics) &&
        chaptersTopics.length > 0
      ) {
        const allQnCountNull = determineAllocationMode(chaptersTopics);

        apiPayloadStore.update((currentStore) => ({
          ...currentStore,
          chapters_topics: chaptersTopics,
          is_ai_selected: allQnCountNull,
        }));

        const { chaptersList, topicsList } = initializeAllocationState(
          chaptersTopics,
          allQnCountNull,
        );

        // Fetch question pools and handle exclusion lists in edit mode
        await preFetchQuestionsForEdit(chaptersList, topicsList, design);
      }

      // Sync overall exclusions list
      if (
        design.qtn_codes_to_exclude &&
        Array.isArray(design.qtn_codes_to_exclude) &&
        design.qtn_codes_to_exclude.length > 0
      ) {
        const normalizedExclusions = design.qtn_codes_to_exclude
          .map(normalizeExcludedQuestion)
          .filter(Boolean);

        selectedContentStore.setRemovedQuestions(normalizedExclusions);

        const excludedCodes = normalizedExclusions.map((q) => q.id);
        apiPayloadStore.updateExcludedQuestions(excludedCodes);
      }
    } catch (error) {
      console.error("Failed to load exam data:", error);
      loadError = error.message || "Failed to load exam details";
    } finally {
      isLoading = false;
    }
  }

  // Fetch exam data on mount if in edit mode
  onMount(async () => {
    await loadWizardData();
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

  let showResetConfirm = false;

  function handleReset() {
    showResetConfirm = true;
  }

  function confirmReset() {
    allQuestions = [];
    fetchedQuestions = [];
    examData = {
      examMode: "Online",
      examTitle: "",
      examClass: "",
      examMedium: "",
      examSubject: "",
      examMediumName: "",
      examSubjectName: "",
      examCode: examId || "",
      totalTime: 40,
      totalQuestions: 40,
      numberOfSets: 1,
      numberOfVersions: 1,
      easy: 40,
      medium: 40,
      hard: 20,
      autoBalance: true,
      isAllocationConfirmed: false,
      confirmedAllocationData: null,
    };
    selectedContentStore.clearAll();

    // Clear validation states
    examDetailsValid = true;
    classSubjectValid = true;
    examConfigValid = true;
    difficultyValid = true;

    // Reset wizard view/tabs
    currentView = "config";
    showQuestions = false;
    nestedContentActiveTab = "selected-content";

    // Reset notifications/results
    allocationResult = {
      message: "",
      type: "success",
    };
    generatedPapersData = {};
    generationResult = {
      message: "",
      type: "success",
    };
    generationInProgress = false;
    draftSaveError = "";
    draftSaveSuccess = "";

    showResetConfirm = false;
  }

  function handleExamConfigValidation(event) {
    examConfigValid = event.detail.isValid;
    if (examConfigValid) {
      apiPayloadStore.updateExamConfig({
        total_time: examData.totalTime,
        total_questions: examData.totalQuestions,
        no_of_versions: examData.numberOfVersions,
        no_of_sets: examData.numberOfSets,
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

    examData.isAllocationConfirmed = true;
    examData.confirmedAllocationData = allocationData;

    apiPayloadStore.updateFromAllocationData(allocationData);

    apiPayloadStore.updatePayload({
      exam_name: examData.examTitle,
      exam_mode: examData.examMode,
      total_time: examData.totalTime,
      total_questions: examData.totalQuestions,
      no_of_versions: examData.numberOfVersions,
      no_of_sets: examData.numberOfSets,
      subject_code: examData.examSubject,
      medium_code: examData.examMedium,
      standard: examData.examClass,
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
      if (examData.examCode) {
        response = await apiClient({
          url: `/apis/exams/${examData.examCode}`,
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
        examData.examCode = responseData.exam_code;
      }

      draftSaveSuccess = isEditMode
        ? `Draft "${payload.exam_name}" updated successfully!`
        : `Draft "${payload.exam_name}" saved successfully! Exam Code: ${examData.examCode || "N/A"}`;
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

      if (
        examData.confirmedAllocationData &&
        examData.confirmedAllocationData.selectedItems
      ) {
        apiPayloadStore.updateFromAllocationData(
          examData.confirmedAllocationData,
        );
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
      if (examData.examCode) {
        response = await apiClient({
          url: `/apis/exams/${examData.examCode}`,
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
        questionsToExclude: responseData.qtn_codes_to_exclude || [],
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
    showErrors = true;
    if (
      examDetailsValid &&
      classSubjectValid &&
      examConfigValid &&
      difficultyValid &&
      examData.isAllocationConfirmed
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
      if (!examData.isAllocationConfirmed)
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
    if (standard) examData.examClass = standard;
    if (subject_code) examData.examSubject = subject_code;
    if (medium_code) examData.examMedium = medium_code;

    apiPayloadStore.updateClassSubject({
      subject_code: subject_code || examData.examSubject,
      medium_code: medium_code || examData.examMedium,
      examClass: standard || examData.examClass,
    });
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
            <!-- <div class="text-center">
              <div
                class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"
              ></div>
              <p class="text-gray-600">Loading exam details...</p>
            </div> -->
            <SpinnerWithText message="Loading exam details..." />
          </div>
        {:else if loadError}
          <div class="mb-6">
            <InlineNotification
              kind="error"
              title="Error loading exam details"
              subtitle={loadError}
              hideCloseButton={true}
              action={{
                text: "Retry Loading",
                handler: loadWizardData,
              }}
            />
          </div>
        {:else if currentView === "config"}
          <form on:submit|preventDefault={handleSubmit}>
            <Card className="!p-8">
              <div class="space-y-8">
                <div class="space-y-6">
                  <ExamDetailsForm
                    bind:examData
                    bind:isValid={examDetailsValid}
                    bind:showErrors
                  />
                  <ClassSubjectSelector
                    bind:examData
                    bind:isValid={classSubjectValid}
                    {mediumOptions}
                    {subjectOptions}
                    loading={classSubjectLoading}
                    error={classSubjectError}
                    on:change={handleClassSubjectSelect}
                    on:retrySubjects={fetchSubjects}
                    bind:showErrors
                  />
                </div>
                <hr class="divider-line" />
                <ExamConfig
                  bind:examData
                  on:validate={handleExamConfigValidation}
                  bind:showErrors
                />
                <hr class="divider-line" />
                <DifficultyConfigurator
                  bind:examData
                  bind:isValid={difficultyValid}
                  isReviewPageEnabled={false}
                  bind:autoBalance={examData.autoBalance}
                />
              </div>
            </Card>

            {#if examData.examClass && examData.examSubject && examData.examMedium}
              <div class="space-y-6 mt-8 w-full">
                <Card
                  title="Content Selection & Question Allocation"
                  className="!p-8"
                >
                  <NestedContentTable
                    bind:this={nestedContentTableRef}
                    bind:examData
                    bind:showQuestions
                    bind:fetchedQuestions
                    bind:activeTab={nestedContentActiveTab}
                    {chaptersData}
                    isLoading={chaptersLoading}
                    error={chaptersError}
                    {questionIsLoading}
                    on:select={handleQuestionSelect}
                    on:fetchQuestionsRequest={handleFetchQuestionsRequest}
                    on:allocationConfirmed={handleAllocationConfirmed}
                    on:draftSaved={handleSaveDraft}
                    bind:savingDraft={isSavingDraft}
                    bind:draftSaveError
                    bind:draftSaveSuccess
                    bind:showErrors
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
              bind:examData
              allocationData={examData.confirmedAllocationData}
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
              bind:examData
              questions={allQuestions}
              allocationData={examData.confirmedAllocationData}
              {generationResult}
              {generatedPapersData}
            />
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

{#if showResetConfirm}
  <Portal>
    <PortalBackdrop>
      <ResetConfirmationModal
        on:close={() => (showResetConfirm = false)}
        on:confirm={confirmReset}
      />
    </PortalBackdrop>
  </Portal>
{/if}
