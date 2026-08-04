<script>
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import Dropdown from "$lib/components/Dropdown.svelte";
  import Input from "$lib/components/Input.svelte";
  import Button from "$lib/components/Button.svelte";
  import PortalModal from "$lib/components/PortalModal.svelte";
  import ContentHierarchyTable from "$lib/components/ContentHierarchyTable.svelte";
  import ManualAllocationTable from "./ManualAllocationTable.svelte";
  import DataTable from "$lib/components/DataTable.svelte";
  import ToggleWithLabel from "$lib/components/ToggleWithLabel.svelte";
  import Pagination from "$lib/components/SearchPageComponents/Pagination.svelte";
  import Tabs from "$lib/components/TabTable/Tabs.svelte";
  import Tab from "$lib/components/TabTable/Tab.svelte";
  import TabPanel from "$lib/components/TabTable/TabPanel.svelte";
  import { apiClient } from "$lib/utils/api.js";
  import InlineNotification from "$lib/components/InlineNotification.svelte";
  import GeneratePapers from "$lib/components/GeneratePapers.svelte";
  import DraftSavedModal from "$lib/components/exams/v2/DraftSavedModal.svelte";
  import FeasibilityWarningModal from "$lib/components/exams/v2/FeasibilityWarningModal.svelte";
  import ChapterSelectionModal from "$lib/components/exams/v2/ChapterSelectionModal.svelte";
  import ManualAllocationModal from "$lib/components/exams/v2/ManualAllocationModal.svelte";
  import QuestionPoolModal from "$lib/components/exams/v2/QuestionPoolModal.svelte";
  import PaperSummarySidebar from "$lib/components/exams/v2/PaperSummarySidebar.svelte";
  import SyllabusSelectionStep from "$lib/components/exams/v2/SyllabusSelectionStep.svelte";
  import PaperSetupStep from "$lib/components/exams/v2/PaperSetupStep.svelte";
  import PaperQuantityStep from "$lib/components/exams/v2/PaperQuantityStep.svelte";
  import {
    X,
    Plus,
    Pencil,
    ArrowRight,
    BookOpen,
    Check,
    SlidersHorizontal,
    Loader2,
    AlertTriangle,
  } from "@lucide/svelte";

  // Reusability Props for Add / Edit Mode

  export let examCode = null;

  $: activeExamCode = examCode;
  $: isEditMode = !!activeExamCode;

  // Form State (Default ADD mode settings: empty class dropdown, default sets = 1)
  export let selectedClass = "";
  export let selectedMedium = "";
  export let selectedSubject = "";

  const classOptions = [
    { value: "1", label: "Class 1" },
    { value: "2", label: "Class 2" },
    { value: "3", label: "Class 3" },
    { value: "4", label: "Class 4" },
    { value: "5", label: "Class 5" },
    { value: "6", label: "Class 6" },
    { value: "7", label: "Class 7" },
    { value: "8", label: "Class 8" },
    { value: "9", label: "Class 9" },
    { value: "10", label: "Class 10" },
    { value: "11", label: "Class 11" },
    { value: "12", label: "Class 12" },
  ];

  let mediumOptions = [];
  let allSubjects = [];
  let classSubjectLoading = { mediums: false, subjects: false };
  let classSubjectError = { mediums: null, subjects: null };

  let examLoading = false;
  let examError = null;

  let isSavingDraft = false;
  let isGeneratingPaper = false;
  let isPaperGenerated = false;
  let generatedPapersData = null;
  let saveDraftError = "";

  let isAutoAllocation = true;

  let chaptersData = [];
  let chaptersLoading = false;
  let chaptersError = null;

  // Selection states for ContentHierarchyTable
  let selections = [];
  let expandedChapters = new Set();
  let expandedTopics = new Set();

  let showChapterModal = false;
  let showManualAllocationModal = false;

  let prevAutoAllocation = isAutoAllocation;
  $: if (!isAutoAllocation && prevAutoAllocation !== isAutoAllocation) {
    prevAutoAllocation = isAutoAllocation;
    showManualAllocationModal = true;
  } else if (isAutoAllocation) {
    prevAutoAllocation = isAutoAllocation;
  }

  // Question Pool Modal & Exclusion state
  let showQuestionPoolModal = false;
  let poolActiveTab = "available"; // "available" | "excluded"
  let questionPoolLoading = false;
  let questionPoolError = null;
  let allFetchedQuestions = [];
  let qtn_codes_to_exclude = [];

  // Feasibility check modal state
  let showFeasibilityModal = false;
  let feasibilityWarningMessage = "";
  let feasibilityWarningData = null;

  // Computed totals for feasibility requested vs proposed question counts
  $: requestedTotalCount = feasibilityWarningData
    ? (Number(feasibilityWarningData.requested?.Easy?.count) || 0) +
      (Number(feasibilityWarningData.requested?.Medium?.count) || 0) +
      (Number(feasibilityWarningData.requested?.Hard?.count) || 0)
    : 0;

  $: proposedTotalCount = feasibilityWarningData
    ? (Number(feasibilityWarningData.proposed?.Easy?.count) || 0) +
      (Number(feasibilityWarningData.proposed?.Medium?.count) || 0) +
      (Number(feasibilityWarningData.proposed?.Hard?.count) || 0)
    : 0;

  $: isTotalInsufficient =
    feasibilityWarningData &&
    proposedTotalCount < requestedTotalCount;

  // Save Draft Success modal state
  let showSaveDraftSuccessModal = false;

  // Question Pool Pagination State
  let availableCurrentPage = 1;
  let excludedCurrentPage = 1;
  const poolItemsPerPage = 10;

  // DataTable Configuration for Question Pool
  const poolTableHeaders = [
    { key: "text", name: "Question", width: "40%" },
    { key: "type", name: "Type", width: "12%" },
    { key: "difficulty", name: "Difficulty", width: "15%" },
    { key: "marks", name: "Marks", width: "12%" },
    { key: "parent_name", name: "Parent", width: "21%" },
  ];

  const availableActionConfig = [
    {
      actionName: "exclude",
      label: "Exclude",
    },
  ];

  const excludedActionConfig = [
    {
      actionName: "restore",
      label: "Restore",
    },
  ];

  const questionCustomRenderers = {
    text: (row) => `
      <div class="max-w-sm">
        <p class="font-medium text-slate-900 line-clamp-2">${row.text || ""}</p>
        <span class="text-[10px] text-slate-400">ID: ${row.id || ""}</span>
      </div>
    `,
    difficulty: (row) => `
      <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
        ${row.difficulty || "Medium"}
      </span>
    `,
    marks: (row) =>
      `<span class="font-semibold text-slate-700">${row.marks || 1} mark</span>`,
    parent_name: (row) => row.parent_name || row.parent?.name || "Chapter",
  };

  // Selected chapters array for summary display in the main card
  let selectedChapters = [];

  let examTitle = "";
  let isTitleUserEdited = false;

  // Question Count Options
  let questionCount = 40;
  const questionCountOptions = [10, 20, 30, 40, 50];
  let isCustomQuestionCount = false;
  let marksPerQuestion = 1;

  function selectPresetQuestionCount(count) {
    isCustomQuestionCount = false;
    questionCount = count;
  }

  function selectCustomQuestionCount() {
    isCustomQuestionCount = true;
  }

  // Difficulty Config (Default to "Balanced" in ADD mode)
  let difficultyPreset = "balanced"; // 'balanced', 'easier', 'harder', 'custom'
  let easyPercent = 40;
  let mediumPercent = 40;

  $: hardPercent = Math.max(
    0,
    100 - (Number(easyPercent) + Number(mediumPercent)),
  );

  // Paper Set Config (Default sets = 1, versions = 1 in ADD mode)
  let setsCount = 1;
  const setsOptions = [1, 2, 3, 4, 5];

  let versionsCount = 1;
  const versionsOptions = [1, 2, 3, 4];

  // Fetch Mediums API
  async function fetchMediums() {
    classSubjectLoading.mediums = true;
    classSubjectError.mediums = null;
    try {
      const res = await apiClient({ url: "/apis/mediums" });
      if (res.ok) {
        const responseData = await res.json();
        const mediums = responseData.data || [];
        mediumOptions = mediums.map((m) => ({
          value: m.medium_code,
          label: m.medium_name,
        }));

        if (!isEditMode && mediumOptions.length > 0 && !selectedMedium) {
          selectedMedium = mediumOptions[0].value;
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `Server error (${res.status}) loading mediums.`,
        );
      }
    } catch (err) {
      console.error("Error fetching mediums:", err);
      classSubjectError.mediums = err.message || "Failed to load mediums.";
    } finally {
      classSubjectLoading.mediums = false;
    }
  }

  // Fetch Subjects API
  async function fetchSubjects() {
    classSubjectLoading.subjects = true;
    classSubjectError.subjects = null;
    try {
      const res = await apiClient({ url: "/apis/subjects" });
      if (res.ok) {
        const responseData = await res.json();
        const subjects = responseData.data || [];
        allSubjects = subjects.map((s) => ({
          value: s.subject_code,
          label: s.subject_name,
          standard: s.standard,
          mediumCode: s.medium_code,
        }));
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `Server error (${res.status}) loading subjects.`,
        );
      }
    } catch (err) {
      console.error("Error fetching subjects:", err);
      classSubjectError.subjects = err.message || "Failed to load subjects.";
    } finally {
      classSubjectLoading.subjects = false;
    }
  }

  // Reactively filter subjects by selected Class and Medium
  $: subjectOptions = allSubjects
    .filter((s) => {
      const matchClass =
        !s.standard || String(s.standard) === String(selectedClass);
      const matchMedium =
        !s.mediumCode || String(s.mediumCode) === String(selectedMedium);
      return matchClass && matchMedium;
    })
    .map((s) => ({ value: s.value, label: s.label }));

  // Auto-select first subject if currently selected subject is invalid (only when NOT in edit mode)
  $: if (
    !isEditMode &&
    subjectOptions.length > 0 &&
    !subjectOptions.some((s) => s.value === selectedSubject)
  ) {
    selectedSubject = subjectOptions[0].value;
  } 

  // Fetch Exam Details in EDIT mode
  async function fetchExamDetails(code) {
    if (!code) return;
    examLoading = true;
    examError = null;
    try {
      const res = await apiClient({ url: `/apis/exams/${code}` });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.detail ||
            `Failed to load draft paper! status: ${res.status}`,
        );
      }
      const data = await res.json();
      const examData = data.design;

      if (!examData) {
        throw new Error("No exam design data found in API response.");
      }

      examTitle = examData.exam_name || "";
      selectedClass = String(examData.standard || "");
      setsCount = Number(examData.number_of_sets) || 1;
      versionsCount = Number(examData.number_of_versions) || 1;

      const loadedCount = Number(examData.total_questions) || 40;
      questionCount = loadedCount;
      if (questionCountOptions.includes(loadedCount)) {
        isCustomQuestionCount = false;
      } else {
        isCustomQuestionCount = true;
      }

      if (typeof examData.is_ai_selected === "boolean") {
        isAutoAllocation = examData.is_ai_selected;
      } 

      if (examData.medium_code) {
        selectedMedium = String(examData.medium_code);
      }

      if (examData.subject_code) {
        selectedSubject = String(examData.subject_code);
      }

      // Parse excluded question codes
      if (Array.isArray(examData.qtn_codes_to_exclude)) {
        qtn_codes_to_exclude = examData.qtn_codes_to_exclude.map((q) =>
          typeof q === "string" ? q : q.code || q.id,
        );
      }

      // Parse chapters_topics from API response
      if (Array.isArray(examData.chapters_topics)) {
        const loadedSelections = [];
        examData.chapters_topics.forEach((group) => {
          const groupType = group.type || "chapter";
          (group.codes || []).forEach((item) => {
            loadedSelections.push({
              code: item.code,
              name: item.name,
              type: groupType,
              qn_count: item.qn_count ?? null,
            });
          });
        });
        selections = loadedSelections;
        updateSelectedChaptersFromSelections();
      }

      // Parse question_papers if already generated
      if (
        (Array.isArray(examData.question_papers) &&
          examData.question_papers.length > 0) ||
        examData.status === 2
      ) {
        generatedPapersData = {
          examInfo: {
            exam_name: examData.exam_name || "",
            exam_code: activeExamCode,
            status: examData.status,
            number_of_sets: examData.number_of_sets,
            number_of_versions: examData.number_of_versions,
            no_of_qns: examData.total_questions,
            subject: examData.subject,
            medium: examData.medium,
          },
          questionPapers: examData.question_papers || [],
          generatedAt: new Date().toISOString(),
          apiResponse: data,
        };
        isPaperGenerated = true;
      }
    } catch (err) {
      console.error("Error fetching exam details:", err);
      examError = err.message || "Failed to load draft paper";
    } finally {
      examLoading = false;
    }
  }

  // Fetch Chapters & Topics ONLY when medium, class, and subject are ALL selected
  async function fetchChaptersTopics() {
    if (!selectedClass || !selectedSubject || !selectedMedium) return;

    chaptersLoading = true;
    chaptersError = null;
    try {
      const queryParams = new URLSearchParams({
        standard: selectedClass,
        subject_code: selectedSubject,
        medium_code: selectedMedium,
      }).toString();

      const res = await apiClient({
        url: `/apis/chapters_topics?${queryParams}`,
      });

      if (res.ok) {
        const data = await res.json();
        chaptersData = data.data || [];

        if (Array.isArray(chaptersData) && chaptersData.length > 0) {
          // Expand first chapter by default
          expandedChapters = new Set([chaptersData[0].code]);

          // By default, keep all chapters selected (unless custom draft selections exist)
          if (!isEditMode || selections.length === 0) {
            selections = chaptersData.map((ch) => ({
              code: ch.code,
              name: ch.name,
              type: "chapter",
            }));
          }
          updateSelectedChaptersFromSelections();
        } else {
          chaptersData = [];
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.detail ||
            `Server error (${res.status}) loading syllabus chapters.`,
        );
      }
    } catch (err) {
      console.error("Error fetching chapters:", err);
      chaptersError = err.message || "Failed to load syllabus chapters";
    } finally {
      chaptersLoading = false;
    }
  }

  // Reactive trigger for chapter topics fetch ONLY when all 3 required fields exist
  let lastFetchKey = "";
  $: {
    const key = `${selectedClass}-${selectedSubject}-${selectedMedium}`;
    if (
      selectedClass &&
      selectedSubject &&
      selectedMedium &&
      key !== lastFetchKey
    ) {
      lastFetchKey = key;
      fetchChaptersTopics();
    }
  }

  // Reactive watcher to hydrate exam details in Edit mode as soon as dropdown options are loaded
  let loadedExamCode = "";
  $: if (
    activeExamCode &&
    activeExamCode !== loadedExamCode &&
    mediumOptions.length > 0 &&
    allSubjects.length > 0
  ) {
    loadedExamCode = activeExamCode;
    fetchExamDetails(activeExamCode);
  }

  onMount(async () => {
    await Promise.all([fetchMediums(), fetchSubjects()]);
    if (activeExamCode && activeExamCode !== loadedExamCode) {
      loadedExamCode = activeExamCode;
      await fetchExamDetails(activeExamCode);
    }
  });

  // Table Tree Toggle & Checkbox Handlers
  function handleToggleChapter(detail) {
    const { chapterId } = detail;
    if (expandedChapters.has(chapterId)) {
      expandedChapters.delete(chapterId);
    } else {
      expandedChapters.add(chapterId);
    }
    expandedChapters = new Set(expandedChapters);
  }

  function handleToggleTopic(detail) {
    const { topicId } = detail;
    if (expandedTopics.has(topicId)) {
      expandedTopics.delete(topicId);
    } else {
      expandedTopics.add(topicId);
    }
    expandedTopics = new Set(expandedTopics);
  }

  function handleCheckboxChange(event, item, type) {
    const isChecked = event.target.checked;

    if (type === "chapter") {
      if (isChecked) {
        if (
          !selections.some((s) => s.code === item.code && s.type === "chapter")
        ) {
          selections = [
            ...selections,
            { code: item.code, name: item.name, type: "chapter" },
          ];
        }
        // if (item.topics) {
        //   item.topics.forEach((t) => {
        //     if (
        //       !selections.some((s) => s.code === t.code && s.type === "topic")
        //     ) {
        //       selections.push({ code: t.code, name: t.name, type: "topic" });
        //     }
        //   });
        //   selections = [...selections];
        // }
      } else {
        const topicCodes = new Set((item.topics || []).map((t) => t.code));
        selections = selections.filter(
          (s) => s.code !== item.code && !topicCodes.has(s.code),
        );
      }
    } else if (type === "topic") {
      if (isChecked) {
        if (
          !selections.some((s) => s.code === item.code && s.type === "topic")
        ) {
          selections = [
            ...selections,
            { code: item.code, name: item.name, type: "topic" },
          ];
        }
      } else {
        selections = selections.filter(
          (s) => !(s.code === item.code && s.type === "topic"),
        );
      }
    } else if (type === "subtopic") {
      if (isChecked) {
        if (
          !selections.some((s) => s.code === item.code && s.type === "subtopic")
        ) {
          selections = [
            ...selections,
            { code: item.code, name: item.name, type: "subtopic" },
          ];
        }
      } else {
        selections = selections.filter(
          (s) => !(s.code === item.code && s.type === "subtopic"),
        );
      }
    }
  }

  function updateSelectedChaptersFromSelections() {
    if (!chaptersData || chaptersData.length === 0) {
      selectedChapters = [];
      return;
    }

    const items = [];

    chaptersData.forEach((ch) => {
      const isFullChapterSelected = selections.some(
        (s) => s.code === ch.code && s.type === "chapter",
      );

      if (isFullChapterSelected) {
        items.push({
          id: ch.code,
          code: ch.code,
          name: ch.name,
          displayText: `Ch. ${ch.name}`,
          isFullChapter: true,
        });
      } else {
        const topicCodes = new Set((ch.topics || []).map((t) => t.code));
        const selectedTopicsCount = selections.filter(
          (s) =>
            (s.type === "topic" || s.type === "subtopic") &&
            topicCodes.has(s.code),
        ).length;

        if (selectedTopicsCount > 0) {
          items.push({
            id: ch.code,
            code: ch.code,
            name: ch.name,
            displayText: `Ch. ${ch.name} - ${selectedTopicsCount} topic${selectedTopicsCount > 1 ? "s" : ""}`,
            isFullChapter: false,
          });
        }
      }
    });

    selectedChapters = items;
  }

  $: areAllChaptersSelected =
    chaptersData.length > 0 &&
    chaptersData.length === selectedChapters.length &&
    selectedChapters.every((c) => c.isFullChapter);

  $: isAllModalChaptersSelected =
    chaptersData.length > 0 &&
    chaptersData.every((ch) =>
      selections.some((s) => s.code === ch.code && s.type === "chapter"),
    );

  function toggleSelectAllModalChapters() {
    if (isAllModalChaptersSelected) {
      selections = [];
    } else {
      selections = chaptersData.map((ch) => ({
        code: ch.code,
        name: ch.name,
        type: "chapter",
      }));
    }
  }

  function applyChapterSelections() {
    updateSelectedChaptersFromSelections();
    showChapterModal = false;
  }

  function removeChapter(chapterCode) {
    const targetCh = chaptersData.find((c) => c.code === chapterCode);
    const topicCodes = new Set((targetCh?.topics || []).map((t) => t.code));
    selections = selections.filter(
      (s) => s.code !== chapterCode && !topicCodes.has(s.code),
    );
    updateSelectedChaptersFromSelections();
  }

  function selectDifficultyPreset(preset) {
    difficultyPreset = preset;
    if (preset === "balanced") {
      easyPercent = 40;
      mediumPercent = 40;
    } else if (preset === "easier") {
      easyPercent = 60;
      mediumPercent = 30;
    } else if (preset === "harder") {
      easyPercent = 25;
      mediumPercent = 45;
    }
  }

  function handleEasyChange(e) {
    easyPercent = Number(e.target.value);
    if (easyPercent + mediumPercent > 100) {
      mediumPercent = 100 - easyPercent;
    }
  }

  function handleMediumChange(e) {
    mediumPercent = Number(e.target.value);
    if (easyPercent + mediumPercent > 100) {
      easyPercent = 100 - mediumPercent;
    }
  }

  // Question Pool Fetching & Exclusion Logic
  async function fetchQuestionsForSelections(selectionsList) {
    if (!selectionsList || selectionsList.length === 0) return [];

    const chapters = selectionsList.filter((s) => s.type === "chapter");
    const topics = selectionsList.filter(
      (s) => s.type === "topic" || s.type === "subtopic",
    );

    const apiCalls = [];
    if (chapters.length > 0) {
      const chapterCodes = chapters.map((c) => c.code).join(",");
      apiCalls.push(
        apiClient({
          url: `/apis/questions?type=chapter&codes=${chapterCodes}`,
        }),
      );
    }
    if (topics.length > 0) {
      const topicCodes = topics.map((t) => t.code).join(",");
      apiCalls.push(
        apiClient({ url: `/apis/questions?type=topic&codes=${topicCodes}` }),
      );
    }

    if (apiCalls.length === 0) return [];

    const responses = await Promise.all(apiCalls);
    let rawQuestions = [];

    for (const res of responses) {
      if (res.ok) {
        const resData = await res.json();
        const qList = resData?.qns || resData.data || resData || [];
        rawQuestions = [...rawQuestions, ...qList];
      }
    }

    const uniqueMap = new Map();
    rawQuestions.forEach((q) => {
      const id = q.code || q.id || q.qtn_code;
      const parentName =
        q.grp_type_name ||
        q.chapter_details?.name ||
        q.topic_details?.name ||
        "Chapter";

      if (id && !uniqueMap.has(id)) {
        uniqueMap.set(id, {
          id: id,
          text: q.question_text || q.txt || q.text || "Question Content",
          type: q.type || q.exam_type || "MCQ",
          marks: q.marks || 1,
          difficulty: q.difficulty_level || q.difficulty || "Medium",
          parent_name: parentName,
          parent: {
            name: parentName,
            type: q.grp_type || "chapter",
          },
        });
      }
    });

    return Array.from(uniqueMap.values());
  }

  async function openQuestionPoolModal() {
    showQuestionPoolModal = true;
    if (selections.length > 0) {
      await loadQuestionPool();
    }
  }

  async function loadQuestionPool() {
    questionPoolLoading = true;
    questionPoolError = null;
    try {
      allFetchedQuestions = await fetchQuestionsForSelections(selections);
    } catch (err) {
      console.error("Failed to load question pool:", err);
      questionPoolError = err.message || "Failed to load question pool";
    } finally {
      questionPoolLoading = false;
    }
  }

  function excludeQuestion(qId) {
    if (!qtn_codes_to_exclude.includes(qId)) {
      qtn_codes_to_exclude = [...qtn_codes_to_exclude, qId];
    }
  }

  function restoreQuestion(qId) {
    qtn_codes_to_exclude = qtn_codes_to_exclude.filter((id) => id !== qId);
  }

  function restoreAllQuestions() {
    qtn_codes_to_exclude = [];
  }

  function handleQuestionTableAction(event) {
    const { actionName, actionData } = event.detail;
    if (actionName === "exclude" && actionData?.id) {
      excludeQuestion(actionData.id);
    } else if (actionName === "restore" && actionData?.id) {
      restoreQuestion(actionData.id);
    }
  }

  $: availableQuestions = allFetchedQuestions.filter(
    (q) => !qtn_codes_to_exclude.includes(q.id),
  );
  $: excludedQuestionsList = allFetchedQuestions.filter((q) =>
    qtn_codes_to_exclude.includes(q.id),
  );

  // Available Questions Pagination Logic
  $: availableTotalPages =
    Math.ceil(availableQuestions.length / poolItemsPerPage) || 1;
  $: if (availableCurrentPage > availableTotalPages)
    availableCurrentPage = availableTotalPages;
  $: if (availableCurrentPage < 1) availableCurrentPage = 1;

  $: paginatedAvailableQuestions = availableQuestions.slice(
    (availableCurrentPage - 1) * poolItemsPerPage,
    availableCurrentPage * poolItemsPerPage,
  );

  // Excluded Questions Pagination Logic
  $: excludedTotalPages =
    Math.ceil(excludedQuestionsList.length / poolItemsPerPage) || 1;
  $: if (excludedCurrentPage > excludedTotalPages)
    excludedCurrentPage = excludedTotalPages;
  $: if (excludedCurrentPage < 1) excludedCurrentPage = 1;

  $: paginatedExcludedQuestions = excludedQuestionsList.slice(
    (excludedCurrentPage - 1) * poolItemsPerPage,
    excludedCurrentPage * poolItemsPerPage,
  );

  // Construct payload for API calls
  function buildChaptersTopicsPayload(selectionsArray) {
    // If all chapters are selected, chapters_topics payload should be []
    if (areAllChaptersSelected) {
      return [];
    }

    const chaptersMap = new Map();
    const topicsMap = new Map();

    (selectionsArray || []).forEach((item) => {
      if (item.type === "chapter") {
        if (!chaptersMap.has("chapter")) {
          chaptersMap.set("chapter", { type: "chapter", codes: [] });
        }
        chaptersMap.get("chapter").codes.push({
          code: item.code,
          qn_count: item.qn_count || null,
        });
      } else if (item.type === "topic" || item.type === "subtopic") {
        if (!topicsMap.has("topic")) {
          topicsMap.set("topic", { type: "topic", codes: [] });
        }
        topicsMap.get("topic").codes.push({
          code: item.code,
          qn_count: item.qn_count || null,
        });
      }
    });

    const result = [];
    if (chaptersMap.has("chapter")) result.push(chaptersMap.get("chapter"));
    if (topicsMap.has("topic")) result.push(topicsMap.get("topic"));
    return result;
  }

  // Save as Draft action handler
  async function handleSaveDraft() {
    if (!selectedClass || !selectedMedium || !selectedSubject) {
      saveDraftError =
        "Please select Class, Medium, and Subject before saving.";
      return;
    }

    isSavingDraft = true;
    saveDraftError = "";

    const payload = {
      is_ai_selected: isAutoAllocation,
      exam_name: examTitle.trim() || `Exam Paper - Class ${selectedClass}`,
      exam_type_code: "1000",
      subject_code: selectedSubject,
      medium_code: selectedMedium,
      exam_mode: "online",
      total_time: Math.round(questionCount * 2),
      total_questions: parseInt(questionCount),
      no_of_versions: parseInt(versionsCount),
      no_of_sets: parseInt(setsCount),
      standard: selectedClass,
      chapters_topics: buildChaptersTopicsPayload(selections),
      difficulty_distribution: {
        Easy: Number(easyPercent),
        Medium: Number(mediumPercent),
        Hard: Number(hardPercent),
      },
      ...(qtn_codes_to_exclude.length > 0 && { qtn_codes_to_exclude }),
      status: 1,
    };

    try {
      let response;
      if (activeExamCode) {
        response = await apiClient({
          url: `/apis/exams/v2/${activeExamCode}`,
          options: {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        });
      } else {
        response = await apiClient({
          url: "/apis/exams/v2",
          options: {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        });
      }

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error("An exam with this name already exists.");
        }
        if (response.status === 422) {
          throw new Error("Unprocessable request. Please contact support. HTTP Status: 422.");
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail ||
            errorData.message ||
            `Failed to save draft paper! status: ${response.status}`,
        );
      }

      const resDataRaw = await response.json().catch(() => ({}));
      const resData = resDataRaw.data ;
      if (resData?.exam_code && !activeExamCode) {
        activeExamCode = resData.exam_code;
      }

      showSaveDraftSuccessModal = true;
    } catch (err) {
      console.error("Error saving draft:", err);
      saveDraftError = err.message || "Failed to save draft paper.";
    } finally {
      isSavingDraft = false;
    }
  }

  // Separate helper function to execute design feasibility check
  async function checkDesignFeasibility() {
    const feasibilityPayload = {
      exam_name: examTitle.trim() || `Exam Paper - Class ${selectedClass}`,
      exam_type_code: "1000",
      subject_code: selectedSubject,
      medium_code: selectedMedium,
      exam_mode: "online",
      total_time: Math.round(questionCount * 2),
      total_questions: parseInt(questionCount),
      standard: selectedClass,
      qtn_codes_to_exclude: qtn_codes_to_exclude || [],
      chapters_topics: buildChaptersTopicsPayload(selections),
      difficulty_distribution: {
        Easy: Number(easyPercent),
        Medium: Number(mediumPercent),
        Hard: Number(hardPercent),
      },
    };

    const feasibilityRes = await apiClient({
      url: "/apis/exams/v2/designs/feasibility",
      options: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feasibilityPayload),
      },
    });

    if (!feasibilityRes.ok) {
      if (feasibilityRes.status === 409) {
        throw new Error("An exam with this name already exists.");
      }
      if (feasibilityRes.status === 422) {
        throw new Error("Unprocessable entity. Please contact support");
      }
      const errorData = await feasibilityRes.json().catch(() => ({}));
      throw new Error(
        errorData.detail ||
          errorData.message ||
          `Feasibility check failed with status: ${feasibilityRes.status}`,
      );
    }

    const feasibilityData = await feasibilityRes.json();
    return feasibilityData;
  }

  function applyProposedDistribution() {
    if (feasibilityWarningData?.proposed) {
      const p = feasibilityWarningData.proposed;
      if (p.Easy && typeof p.Easy.pct === "number") {
        easyPercent = Math.round(p.Easy.pct);
      }
      if (p.Medium && typeof p.Medium.pct === "number") {
        mediumPercent = Math.round(p.Medium.pct);
      }
      difficultyPreset = "custom";
    }
    showFeasibilityModal = false;
  }

  // Generate Paper action handler (status = 2)
  async function handleGeneratePapers() {
    if (!selectedClass || !selectedMedium || !selectedSubject) {
      saveDraftError =
        "Please select Class, Medium, and Subject before generating paper.";
      return;
    }

    if (selections.length === 0) {
      saveDraftError =
        "Please select at least one chapter or topic before generating paper.";
      return;
    }

    // If manual allocation mode, check if total allocated matches total required questions (setsCount * questionCount)
    if (!isAutoAllocation) {
      const targetTotal = parseInt(questionCount) * parseInt(setsCount);
      const totalAllocated = selections.reduce(
        (sum, item) => sum + (Number(item.qn_count) || 0),
        0,
      );
      if (totalAllocated !== targetTotal) {
        saveDraftError = `Manual allocation mismatch: Target is ${targetTotal} questions (${setsCount} set${setsCount > 1 ? "s" : ""} × ${questionCount} questions), but ${totalAllocated} are currently allocated. Click "Configure allocation" to balance.`;
        showManualAllocationModal = true;
        return;
      }
    }

    isGeneratingPaper = true;
    saveDraftError = "";

    // 1. Run separate feasibility check
    try {
      const feasibilityData = await checkDesignFeasibility();

      // Check name availability
      if (feasibilityData?.name_available === false) {
        saveDraftError = "An exam with this name already exists.";
        isGeneratingPaper = false;
        return;
      }

      // Check feasible and exact_match (only proceed to generate paper if feasible is true and exact_match is true)
      if (feasibilityData?.feasible === false || !feasibilityData?.exact_match) {
        feasibilityWarningData = feasibilityData;
        showFeasibilityModal = true;
        isGeneratingPaper = false;
        return;
      }
    } catch (err) {
      console.error("Feasibility check error:", err);
      saveDraftError = err.message || "Failed feasibility check.";
      isGeneratingPaper = false;
      return;
    }

    // 3. Proceed with paper generation if feasible
    const payload = {
      is_ai_selected: isAutoAllocation,
      exam_name: examTitle.trim() || `Exam Paper - Class ${selectedClass}`,
      exam_type_code: "1000",
      subject_code: selectedSubject,
      medium_code: selectedMedium,
      exam_mode: "online",
      total_time: Math.round(questionCount * 2),
      total_questions: parseInt(questionCount),
      no_of_versions: parseInt(versionsCount),
      no_of_sets: parseInt(setsCount),
      standard: selectedClass,
      chapters_topics: buildChaptersTopicsPayload(selections),
      difficulty_distribution: {
        Easy: Number(easyPercent),
        Medium: Number(mediumPercent),
        Hard: Number(hardPercent),
      },
      ...(qtn_codes_to_exclude.length > 0 && { qtn_codes_to_exclude }),
      status: 2,
    };

    try {
      let response;
      if (activeExamCode) {
        response = await apiClient({
          url: `/apis/exams/v2/${activeExamCode}`,
          options: {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        });
      } else {
        response = await apiClient({
          url: "/apis/exams/v2",
          options: {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        });
      }

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error("An exam with this name already exists.");
        }
        if (response.status === 422) {
          throw new Error("Unprocessable entity. Please contact support");
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail ||
            errorData.message ||
            `Failed to generate paper! status: ${response.status}`,
        );
      }

      const responseDataRaw = await response.json();
      const responseData = responseDataRaw.data || responseDataRaw;

      generatedPapersData = {
        examInfo: {
          exam_name: responseData.exam_name || examTitle,
          exam_code: responseData.exam_code || activeExamCode,
          status: responseData.status || 2,
          number_of_sets: responseData.number_of_sets || setsCount,
          number_of_versions: responseData.number_of_versions || versionsCount,
          no_of_qns: responseData.total_questions || questionCount,
          subject: currentSubjectName,
          medium: currentMediumName,
        },
        questionPapers:
          responseData.question_papers || responseData.questionPapers || [],
        shortfallInfo: responseData.shortfall_info || {},
        chapterTopics: responseData.chapter_topics || [],
        questionsToExclude: responseData.qtn_codes_to_exclude || [],
        generatedAt: new Date().toISOString(),
        apiResponse: responseDataRaw,
      };

      // Update apiPayloadStore with generated paper data if available
      if (
        typeof apiPayloadStore !== "undefined" &&
        apiPayloadStore?.updateGeneratedPapers
      ) {
        apiPayloadStore.updateGeneratedPapers(generatedPapersData);
      }

      // Display generated papers view and sync URL query parameter
      isPaperGenerated = true;
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.set("step", "2");
        goto(url.pathname + url.search, {
          replaceState: true,
          keepFocus: true,
          noScroll: true,
        });
      }
    } catch (err) {
      console.error("Error generating paper:", err);
      saveDraftError = err.message || "Failed to generate paper.";
    } finally {
      isGeneratingPaper = false;
    }
  }

  // Find names for active selections
  $: currentSubjectName =
    allSubjects.find((s) => s.value === selectedSubject)?.label ||
    selectedSubject ||
    "Mathematics";
  $: currentMediumName =
    mediumOptions.find((m) => m.value === selectedMedium)?.label || "English";

  // Helper function to format default dynamic exam title
  function generateDefaultExamTitle(subjectName, className) {
    if (!className) return "";
    return `${subjectName} · Class ${className} · Unit Test 1`;
  }

  // Auto-generate exam title dynamically when in add mode (unless user has typed custom title)
  $: if (!isEditMode && selectedClass && !isTitleUserEdited) {
    examTitle = generateDefaultExamTitle(currentSubjectName, selectedClass);
  }

  // Calculate available question count based on selected chapters/topics minus excluded questions
  $: availableQuestionCount = (() => {
    if (!chaptersData || chaptersData.length === 0 || !selections || selections.length === 0) {
      return 0;
    }

    const selectedCodes = new Set(selections.map((s) => s.code));
    let total = 0;

    for (const ch of chaptersData) {
      if (selectedCodes.has(ch.code)) {
        total += Number(ch.question_count || ch.qn_count || 0);
        continue;
      }

      if (Array.isArray(ch.topics)) {
        for (const t of ch.topics) {
          if (selectedCodes.has(t.code)) {
            total += Number(t.question_count || t.qn_count || t.count || 0);
            continue;
          }

          if (Array.isArray(t.subtopics)) {
            for (const st of t.subtopics) {
              if (selectedCodes.has(st.code)) {
                total += Number(st.question_count || st.qn_count || st.count || 0);
              }
            }
          }
        }
      }
    }

    const excludedCount = Array.isArray(qtn_codes_to_exclude) ? qtn_codes_to_exclude.length : 0;
    return Math.max(0, total - excludedCount);
  })();

  // Step state driven by URL search params or isPaperGenerated flag
  $: stepFromUrl = Number($page.url.searchParams.get("step")) || 1;
  $: currentStep = isPaperGenerated ? 2 : stepFromUrl;

  function getPageHeaderTitle(step, editMode) {
    if (step === 2) return "Generated Question Papers";
    return editMode ? "Edit Question Paper" : "Create Question Paper";
  }

  function getPageHeaderSubtitle(step, editMode) {
    if (step === 2) {
      return "Review, view, or print your generated question paper sets.";
    }
    return editMode
      ? "Update your question paper syllabus, setup, and allocation settings"
      : "Create the paper in 3 steps - choose the syllabus, set up the paper, and pick how many sets you need";
  }

  $: requiredTotalQuestions = (Number(setsCount) || 1) * (Number(questionCount) || 0);

  // Derived state: Show pool error only after syllabus finishes loading and selections exist
  $: hasQuestionPoolExceededError = Boolean(
    !chaptersLoading &&
      chaptersData?.length > 0 &&
      selections?.length > 0 &&
      requiredTotalQuestions > availableQuestionCount,
  );

  // Form validity check for disabling Generate Paper button
  $: isFormValid = Boolean(
    selectedSubject &&
      selectedMedium &&
      selectedClass &&
      examTitle &&
      examTitle.trim() &&
      !hasQuestionPoolExceededError,
  );

  $: pageTitle = getPageHeaderTitle(currentStep, isEditMode);
  $: pageSubtitle = getPageHeaderSubtitle(currentStep, isEditMode);
</script>

<div class="min-h-screen text-slate-800">
  <div class="mb-6">
    <h1 class="text-xl font-bold text-dark">{pageTitle}</h1>
    <p class="text-sm text-slate-500">{pageSubtitle}</p>
  </div>

  {#if examLoading}
    <div class="flex flex-col items-center justify-center py-20 space-y-3">
      <Loader2 class="w-10 h-10 text-primary animate-spin" />
      <p class="text-sm font-medium text-slate-600">Loading exam details...</p>
    </div>
  {:else if examError}
    <div
      class="max-w-xl mx-auto my-12 p-6 bg-red-50 text-red-700 rounded-2xl border border-red-200 text-center space-y-4"
    >
      <p class="font-semibold text-lg">Error loading exam details</p>
      <p class="text-sm">{examError}</p>
      <Button
        btnType="secondary"
        customClass="mx-auto"
        on:click={() => fetchExamDetails(activeExamCode)}
      >
        Retry Loading
      </Button>
    </div>
  {:else if currentStep === 2}
    <div class="max-w-6xl mx-auto space-y-6">
      <div
        class="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200"
      >
        <GeneratePapers
          examData={{
            examTitle: examTitle,
            examClass: selectedClass,
            examMediumName: currentMediumName,
            examSubjectName: currentSubjectName,
          }}
          {generatedPapersData}
          generationResult={{
            message: `Successfully generated question papers for "${examTitle}"!`,
            type: "success",
          }}
        />
      </div>
    </div>
  {:else}
    <div class="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 items-start">
      <!-- LEFT FORM COLUMN -->
      <div class="flex-1 w-full space-y-6">
        <!-- STEP 1: Choose Syllabus -->
        <SyllabusSelectionStep
          {classOptions}
          bind:selectedClass
          {mediumOptions}
          bind:selectedMedium
          {subjectOptions}
          bind:selectedSubject
          {classSubjectLoading}
          {classSubjectError}
          {chaptersLoading}
          {chaptersError}
          {selectedChapters}
          {areAllChaptersSelected}
          {availableQuestionCount}
          {qtn_codes_to_exclude}
          retryMediumsHandler={fetchMediums}
          retrySubjectsHandler={fetchSubjects}
          retryChaptersHandler={fetchChaptersTopics}
          on:openQuestionPoolModal={openQuestionPoolModal}
          on:openChapterModal={() => (showChapterModal = true)}
          on:removeChapter={(e) => removeChapter(e.detail)}
        />

        <!-- STEP 2: Set up the paper -->
        <PaperSetupStep
          bind:examTitle
          bind:isTitleUserEdited
          bind:questionCount
          {questionCountOptions}
          bind:isCustomQuestionCount
          {marksPerQuestion}
          bind:isAutoAllocation
          {difficultyPreset}
          {easyPercent}
          {mediumPercent}
          {hardPercent}
          {handleEasyChange}
          {handleMediumChange}
          on:selectPresetQuestionCount={(e) => selectPresetQuestionCount(e.detail)}
          on:selectCustomQuestionCount={selectCustomQuestionCount}
          on:openManualAllocationModal={() => (showManualAllocationModal = true)}
          on:selectDifficultyPreset={(e) => selectDifficultyPreset(e.detail)}
        />

        <!-- STEP 3: How many papers? -->
        <PaperQuantityStep
          bind:setsCount
          {setsOptions}
          bind:versionsCount
          {versionsOptions}
        />
      </div>

      <!-- RIGHT STICKY PREVIEW COLUMN -->
      <PaperSummarySidebar
        {examTitle}
        {questionCount}
        {marksPerQuestion}
        {isAutoAllocation}
        {difficultyPreset}
        {easyPercent}
        {mediumPercent}
        {hardPercent}
        {setsCount}
        {versionsCount}
        {hasQuestionPoolExceededError}
        {requiredTotalQuestions}
        {availableQuestionCount}
        {isGeneratingPaper}
        {isSavingDraft}
        {isFormValid}
        {isEditMode}
        {saveDraftError}
        on:configureManualAllocation={() => (showManualAllocationModal = true)}
        on:generate={handleGeneratePapers}
        on:saveDraft={handleSaveDraft}
      />
    </div>
  {/if}
</div>

<!-- CHAPTERS & TOPICS SELECTION POPUP MODAL -->
<ChapterSelectionModal
  bind:open={showChapterModal}
  subjectName={currentSubjectName}
  {selectedClass}
  mediumName={currentMediumName}
  loading={chaptersLoading}
  error={chaptersError}
  {chaptersData}
  {selections}
  {expandedChapters}
  {expandedTopics}
  {isAllModalChaptersSelected}
  on:close={() => (showChapterModal = false)}
  on:toggleChapter={(e) => handleToggleChapter(e.detail)}
  on:toggleTopic={(e) => handleToggleTopic(e.detail)}
  on:checkboxChange={(e) =>
    handleCheckboxChange(e.detail.event, e.detail.item, e.detail.type)}
  on:toggleSelectAll={toggleSelectAllModalChapters}
  on:apply={applyChapterSelections}
/>

<!-- QUESTION POOL REVIEW MODAL -->
<QuestionPoolModal
  bind:open={showQuestionPoolModal}
  subjectName={currentSubjectName}
  {selectedClass}
  mediumName={currentMediumName}
  {questionPoolLoading}
  {questionPoolError}
  bind:poolActiveTab
  {availableQuestions}
  {qtn_codes_to_exclude}
  {excludedQuestionsList}
  {paginatedAvailableQuestions}
  {paginatedExcludedQuestions}
  {availableCurrentPage}
  {availableTotalPages}
  {excludedCurrentPage}
  {excludedTotalPages}
  {poolItemsPerPage}
  {poolTableHeaders}
  {availableActionConfig}
  {excludedActionConfig}
  {questionCustomRenderers}
  retryHandler={loadQuestionPool}
  on:close={() => (showQuestionPoolModal = false)}
  on:restoreAll={restoreAllQuestions}
  on:tableActionClick={(e) => handleQuestionTableAction(e.detail)}
  on:availablePageChange={(e) => (availableCurrentPage = e.detail)}
  on:excludedPageChange={(e) => (excludedCurrentPage = e.detail)}
/>

<!-- MANUAL QUESTION ALLOCATION POPUP MODAL -->
<ManualAllocationModal
  bind:open={showManualAllocationModal}
  subjectName={currentSubjectName}
  {selectedClass}
  mediumName={currentMediumName}
  bind:selections
  {chaptersData}
  questionCount={questionCount}
  {isAutoAllocation}
  {setsCount}
  on:close={() => (showManualAllocationModal = false)}
  on:remove={(e) => removeChapter(e.detail.code)}
/>

<!-- FEASIBILITY WARNING POPUP MODAL -->
<FeasibilityWarningModal
  bind:open={showFeasibilityModal}
  warningData={feasibilityWarningData}
  {isTotalInsufficient}
  on:close={() => (showFeasibilityModal = false)}
  on:proceed={applyProposedDistribution}
/>

<!-- SAVE DRAFT SUCCESS POPUP MODAL -->
<DraftSavedModal
  bind:open={showSaveDraftSuccessModal}
  on:close={() => {
    showSaveDraftSuccessModal = false;
    if (activeExamCode) {
      goto(`/questionPapers/${activeExamCode}/edit?step=1`);
    }
  }}
  on:leave={() => goto("/questionPapers")}
/>
