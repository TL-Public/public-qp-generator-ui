<script>
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
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
  import {
    X,
    Plus,
    ArrowRight,
    BookOpen,
    Check,
    SlidersHorizontal,
    Loader2,
  } from "@lucide/svelte";

  // Reusability Props for Add / Edit Mode
  export let examId = null;
  export let examCode = null;

  $: activeExamCode = examId || examCode;
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

  let examLoading = false;
  let examError = null;

  let isSavingDraft = false;
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
      }
    } catch (err) {
      console.error("Error fetching mediums:", err);
    } finally {
      classSubjectLoading.mediums = false;
    }
  }

  // Fetch Subjects API
  async function fetchSubjects() {
    classSubjectLoading.subjects = true;
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
      }
    } catch (err) {
      console.error("Error fetching subjects:", err);
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
          errorData.detail || `HTTP error! status: ${res.status}`,
        );
      }
      const data = await res.json();
      const examData = data.data || data;

      examTitle = examData.exam_name || "";
      selectedClass = examData.standard || "";
      setsCount = examData.number_of_sets || 1;
      versionsCount = examData.number_of_versions || 1;

      const loadedCount = Number(examData.total_questions) || 40;
      questionCount = loadedCount;
      if (questionCountOptions.includes(loadedCount)) {
        isCustomQuestionCount = false;
      } else {
        isCustomQuestionCount = true;
      }

      if (typeof examData.is_ai_selected === "boolean") {
        isAutoAllocation = examData.is_ai_selected;
      } else if (typeof examData.ai_is_selected === "boolean") {
        isAutoAllocation = examData.ai_is_selected;
      }

      // Find and set medium
      if (examData.medium || examData.medium_code) {
        const foundMedium = mediumOptions.find(
          (m) =>
            m.label?.toLowerCase() === examData.medium?.toLowerCase() ||
            m.value === examData.medium_code,
        );
        selectedMedium =
          foundMedium?.value || examData.medium_code || examData.medium || "";
      }

      // Find and set subject
      if (examData.subject || examData.subject_code) {
        const foundSubject = allSubjects.find(
          (s) =>
            s.label?.toLowerCase() === examData.subject?.toLowerCase() ||
            s.value === examData.subject_code,
        );
        selectedSubject =
          foundSubject?.value ||
          examData.subject_code ||
          examData.subject ||
          "";
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
              qn_count: item.qn_count,
            });
          });
        });
        selections = loadedSelections;
        updateSelectedChaptersFromSelections();
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
        chaptersData = data.data || data || [];

        if (Array.isArray(chaptersData) && chaptersData.length > 0) {
          // Expand first chapter by default
          expandedChapters = new Set([chaptersData[0].code]);
          updateSelectedChaptersFromSelections();
        } else {
          chaptersData = [];
        }
      }
    } catch (err) {
      console.error("Error fetching chapters:", err);
      chaptersError = err.message || "Failed to load chapters";
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

  onMount(async () => {
    await Promise.all([fetchMediums(), fetchSubjects()]);
    if (activeExamCode) {
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
    const chapterSelections = selections.filter((s) => s.type === "chapter");
    selectedChapters = chapterSelections.map((s, idx) => ({
      id: s.code,
      code: s.code.startsWith("Ch") ? s.code : `Ch ${idx + 1}`,
      name: s.name,
    }));
  }

  function applyChapterSelections() {
    updateSelectedChaptersFromSelections();
    showChapterModal = false;
  }

  function removeChapter(chapterId) {
    selections = selections.filter((s) => s.code !== chapterId);
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
      ...(qtn_codes_to_exclude.length > 0 && { qtn_codes_to_exclude }),
      status: 1,
    };

    try {
      let response;
      if (activeExamCode) {
        response = await apiClient({
          url: `/apis/exams/${activeExamCode}`,
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

      // Navigate to /questionPapers page after successful save
      goto("/questionPapers");
    } catch (err) {
      console.error("Error saving draft:", err);
      saveDraftError = err.message || "Failed to save draft paper.";
    } finally {
      isSavingDraft = false;
    }
  }

  // Find names for active selections
  $: currentSubjectName =
    allSubjects.find((s) => s.value === selectedSubject)?.label ||
    selectedSubject ||
    "Mathematics";
  $: currentMediumName =
    mediumOptions.find((m) => m.value === selectedMedium)?.label || "English";

  // Auto-generate exam title dynamically if user has not customized it or when in add mode
  $: if (!isEditMode && selectedClass) {
    const chapPart =
      selectedChapters.length > 0
        ? ` · Ch ${selectedChapters.map((c) => (c.code || "").replace("Ch ", "")).join("–")}`
        : "";
    examTitle = `${currentSubjectName} · Class ${selectedClass}${chapPart} · Unit Test 1`;
  }

  // Calculate available question count
  $: availableQuestionCount = chaptersData.reduce((acc, ch) => {
    return acc + (ch.question_count || ch.qn_count || 0);
  }, 0);
</script>

<div class="min-h-screen text-slate-800">
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
  {:else}
    <div class="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 items-start">
      <!-- LEFT FORM COLUMN -->
      <div class="flex-1 w-full space-y-6">
        <!-- STEP 1: What are you testing? -->
        <div
          class="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-[#eee9dc] transition-all"
        >
          <!-- Step Header -->
          <div class="flex items-center gap-3 mb-6">
            <span
              class="w-8 h-8 rounded-full bg-primary/20 text-slate-700 font-bold text-sm flex items-center justify-center"
            >
              1
            </span>
            <h2 class="text-lg font-bold text-slate-900 tracking-tight">
              What are you testing?
            </h2>
          </div>

          <div class="space-y-6">
            <!-- Class, Medium & Subject Row -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label
                  class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2"
                >
                  CLASS
                </label>
                <Dropdown
                  options={classOptions}
                  bind:value={selectedClass}
                  placeholder="Select Class"
                />
              </div>

              <div>
                <label
                  class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2"
                >
                  MEDIUM
                </label>
                <Dropdown
                  options={mediumOptions}
                  bind:value={selectedMedium}
                  disabled={classSubjectLoading.mediums}
                  placeholder={classSubjectLoading.mediums
                    ? "Loading..."
                    : "Select Medium"}
                />
              </div>

              <div>
                <label
                  class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2"
                >
                  SUBJECT
                </label>
                <Dropdown
                  options={subjectOptions}
                  bind:value={selectedSubject}
                  disabled={classSubjectLoading.subjects ||
                    subjectOptions.length === 0}
                  placeholder={classSubjectLoading.subjects
                    ? "Loading..."
                    : "Select Subject"}
                />
              </div>
            </div>

            <!-- Chapters Container -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label
                  class="block text-xs font-bold text-slate-500 uppercase tracking-wider"
                >
                  CHAPTERS
                </label>
                <span
                  class="text-xs text-slate-500 font-medium flex items-center"
                >
                  {#if chaptersLoading}
                    Loading syllabus chapters...
                  {:else if !selectedClass || !selectedMedium || !selectedSubject}
                    Select Class, Medium & Subject to load chapters
                  {:else}
                    <span>
                      {selectedChapters.length} chapters selected · {availableQuestionCount}
                      questions available
                      {#if qtn_codes_to_exclude.length > 0}
                        · <span class="text-red-600 font-semibold"
                          >{qtn_codes_to_exclude.length} excluded</span
                        >
                      {/if}
                    </span>

                    <button
                      type="button"
                      on:click={openQuestionPoolModal}
                      class="font-bold text-blue-700 hover:underline cursor-pointer ml-2 bg-transparent border-0 p-0 text-xs inline-block"
                    >
                      Review question pool
                    </button>
                  {/if}
                </span>
              </div>

              <div
                class="bg-blue-100 border border-gray-200 rounded-xl p-4 sm:p-5"
              >
                <div class="flex flex-wrap items-center gap-2 mb-3">
                  {#if selectedChapters.length > 0}
                    {#each selectedChapters as chapter}
                      <span
                        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white text-slate-700 border border-slate-200 shadow-xs"
                      >
                        {chapter.code} · {chapter.name}
                        <button
                          type="button"
                          on:click={() => removeChapter(chapter.id)}
                          class="text-slate-400 hover:text-slate-600 transition cursor-pointer"
                          aria-label="Remove chapter"
                        >
                          <X class="w-3.5 h-3.5" />
                        </button>
                      </span>
                    {/each}
                  {:else}
                    <span class="text-xs text-slate-400 italic"
                      >No chapters selected yet</span
                    >
                  {/if}
                </div>

                <div class="flex flex-wrap items-center gap-2">
                  <!-- Add or Edit Chapters Button -->
                  <Button
                    btnType="secondary"
                    customClass="!rounded-full !px-4 !py-1.5 !text-xs text-blue-700 bg-white border border-blue-200 hover:border-blue-300 hover:bg-blue-50 transition shadow-2xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!selectedClass ||
                      !selectedMedium ||
                      !selectedSubject ||
                      chaptersLoading}
                    on:click={() => (showChapterModal = true)}
                  >
                    <Plus class="w-3.5 h-3.5 mr-1" />
                    Add or edit chapters
                  </Button>

                  <!-- {#if !isAutoAllocation}
                    <Button
                      btnType="secondary"
                      customClass="!rounded-full !px-4 !py-1.5 !text-xs text-amber-800  border transition shadow-2xs font-semibold"
                      on:click={() => (showManualAllocationModal = true)}
                    >
                      <SlidersHorizontal class="w-3.5 h-3.5 mr-1" />
                      Configure manual allocation ({selections.reduce(
                        (sum, s) => sum + (Number(s.qn_count) || 0),
                        0,
                      )} / {questionCount})
                    </Button>
                  {/if} -->
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- STEP 2: Set up the paper -->
        <div
          class="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-[#eee9dc] transition-all space-y-6"
        >
          <!-- Step Header -->
          <div class="flex items-center gap-3">
            <span
              class="w-8 h-8 rounded-full bg-primary/20 text-slate-700 font-bold text-sm flex items-center justify-center"
            >
              2
            </span>
            <h2 class="text-lg font-bold text-slate-900 tracking-tight">
              Set up the paper
            </h2>
          </div>

          <!-- Exam Title -->
          <div>
            <div class="flex items-center gap-2 mb-2">
              <label class="block text-xs font-bold text-slate-500 uppercase">
                EXAM TITLE
              </label>
              <span class="text-xs text-slate-400 font-normal italic">
                filled in for you — edit if you like
              </span>
            </div>
            <Input
              type="text"
              bind:value={examTitle}
              placeholder="Exam Title"
            />
          </div>

          <!-- Number of Questions -->
          <div>
            <label
              class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3"
            >
              NUMBER OF QUESTIONS
            </label>
            <div class="flex flex-wrap items-center gap-2.5">
              {#each questionCountOptions as count}
                <Button
                  btnType={!isCustomQuestionCount && questionCount === count
                    ? "dark"
                    : "secondary"}
                  customClass="!px-5 !py-2.5 rounded-xl text-sm font-bold min-w-[54px]"
                  on:click={() => selectPresetQuestionCount(count)}
                >
                  {count}
                </Button>
              {/each}

              <Button
                btnType={isCustomQuestionCount ? "dark" : "secondary"}
                customClass="!px-5 !py-2.5 rounded-xl text-sm font-semibold capitalize"
                on:click={selectCustomQuestionCount}
              >
                Custom...
              </Button>

              {#if isCustomQuestionCount}
                <div class="w-32">
                  <Input
                    type="number"
                    min="1"
                    max="500"
                    bind:value={questionCount}
                    placeholder="Questions"
                  />
                </div>
              {/if}
            </div>
            <p class="text-xs text-slate-500 mt-2 font-medium">
              {questionCount || 0} questions · {marksPerQuestion} mark each = {(questionCount ||
                0) * marksPerQuestion} marks · about {Math.round(
                (questionCount || 0) * 2,
              )} minutes
            </p>
          </div>

          <div class="border-t border-slate-100 my-4"></div>

          <!-- Question Allocation -->
          <div>
            <label
              class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3"
            >
              QUESTION ALLOCATION
            </label>

            <div class="flex flex-wrap items-center gap-2.5 mb-2.5">
              <Button
                btnType={isAutoAllocation ? "dark" : "secondary"}
                customClass="!px-5 !py-2.5 rounded-xl text-sm font-semibold"
                on:click={() => (isAutoAllocation = true)}
              >
                Auto (recommended)
              </Button>

              <Button
                btnType={!isAutoAllocation ? "dark" : "secondary"}
                customClass="!px-5 !py-2.5 rounded-xl text-sm font-semibold"
                on:click={() => {
                  isAutoAllocation = false;
                  showManualAllocationModal = true;
                }}
              >
                Manual
              </Button>
            </div>

            <p class="text-xs text-slate-500 font-medium leading-relaxed">
              {#if isAutoAllocation}
                Questions are spread across your selected chapters
                automatically, in proportion to their size.
              {:else}
                Manually set question count from each chapter/topic.
                <button
                  type="button"
                  on:click={() => (showManualAllocationModal = true)}
                  class="font-bold text-primary hover:underline cursor-pointer ml-1 bg-transparent border-0 p-0 text-xs inline-block"
                >
                  Configure allocation
                </button>
              {/if}
            </p>
          </div>

          <div class="border-t border-slate-100 my-4"></div>

          <!-- Difficulty -->
          <div>
            <label
              class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3"
            >
              DIFFICULTY
            </label>

            <!-- Difficulty Preset Pills -->
            <div class="flex flex-wrap items-center gap-2.5 mb-4">
              {#each ["balanced", "easier", "harder", "custom"] as preset}
                <Button
                  btnType={difficultyPreset === preset ? "dark" : "secondary"}
                  customClass="!px-5 !py-2 rounded-full text-sm font-semibold capitalize"
                  on:click={() => selectDifficultyPreset(preset)}
                >
                  {preset === "custom" ? "Custom..." : preset}
                </Button>
              {/each}
            </div>

            <!-- Difficulty Distribution Bar -->
            <div class="space-y-2">
              <div
                class="h-3 w-full rounded-full overflow-hidden flex bg-slate-100"
              >
                <div
                  style="width: {easyPercent}%"
                  class="bg-[#86efac] transition-all duration-300"
                  title="Easy: {easyPercent}%"
                ></div>
                <div
                  style="width: {mediumPercent}%"
                  class="bg-[#fde047] transition-all duration-300"
                  title="Medium: {mediumPercent}%"
                ></div>
                <div
                  style="width: {hardPercent}%"
                  class="bg-[#fca5a5] transition-all duration-300"
                  title="Hard: {hardPercent}%"
                ></div>
              </div>

              <!-- Legend Dots -->
              <div
                class="flex items-center gap-5 text-xs font-semibold text-slate-600"
              >
                <span class="inline-flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded-full bg-[#86efac]"></span>
                  Easy
                  <span class="text-slate-900 font-bold">{easyPercent} %</span>
                </span>
                <span class="inline-flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded-full bg-[#fde047]"></span>
                  Medium
                  <span class="text-slate-900 font-bold">{mediumPercent} %</span
                  >
                </span>
                <span class="inline-flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded-full bg-[#fca5a5]"></span>
                  Hard
                  <span class="text-slate-900 font-bold">{hardPercent} %</span>
                </span>
              </div>
            </div>

            <!-- Custom Sliders Box -->
            {#if difficultyPreset === "custom"}
              <div
                class="mt-4 bg-[#fdfcf7] border border-[#f2eae0] rounded-xl p-5 space-y-4"
              >
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <!-- Easy Slider -->
                  <div>
                    <div
                      class="flex justify-between items-center text-xs font-bold text-slate-800 mb-1.5"
                    >
                      <span>Easy — {easyPercent}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={easyPercent}
                      on:input={handleEasyChange}
                      class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#223972]"
                    />
                  </div>

                  <!-- Medium Slider -->
                  <div>
                    <div
                      class="flex justify-between items-center text-xs font-bold text-slate-800 mb-1.5"
                    >
                      <span>Medium — {mediumPercent}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={mediumPercent}
                      on:input={handleMediumChange}
                      class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#223972]"
                    />
                  </div>
                </div>

                <p class="text-xs text-slate-400 font-medium italic pt-1">
                  Hard fills in the rest automatically.
                </p>
              </div>
            {/if}
          </div>
        </div>

        <!-- STEP 3: How many papers? -->
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
                    btnType={setsCount === setNum ? "dark" : "secondary"}
                    customClass="!px-4 !py-2 rounded-xl text-sm font-bold min-w-[46px]"
                    on:click={() => (setsCount = setNum)}
                  >
                    {setNum}
                  </Button>
                {/each}
              </div>
              <p class="text-xs text-slate-500 mt-2.5 leading-relaxed">
                Each set has different questions — for different sections or
                rows.
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
                    btnType={versionsCount === verNum ? "dark" : "secondary"}
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
      </div>

      <!-- RIGHT STICKY PREVIEW COLUMN -->
      <div class="w-full lg:w-80 xl:w-96 lg:sticky lg:top-8 space-y-4">
        <!-- Primary Summary Card -->
        <div
          class="bg-white text-dark rounded-2xl p-6 shadow-sm border border-gray-200"
        >
          <div
            class="text-[10px] font-bold tracking-widest text-primary uppercase mb-2"
          >
            YOUR PAPER
          </div>

          <h3 class="text-lg font-bold leading-snug text-dark mb-6">
            {examTitle || "Untitled Paper"}
          </h3>

          <!-- Key Specs List -->
          <div class="space-y-3.5 text-xs">
            <div class="flex justify-between items-center">
              <span class="text-primary">Questions</span>
              <span class="font-semibold text-dark"
                >{questionCount} MCQs · {questionCount * marksPerQuestion} marks</span
              >
            </div>
            <div class="flex justify-between items-center">
              <span class="text-primary">Allocation</span>
              <div class="flex items-center gap-1.5 font-semibold text-dark">
                <span>{isAutoAllocation ? "Auto" : "Manual"}</span>
                {#if !isAutoAllocation}
                  <button
                    type="button"
                    on:click={() => (showManualAllocationModal = true)}
                    class="text-[11px] font-bold text-blue-700 hover:underline cursor-pointer bg-transparent border-0 p-0 ml-1"
                  >
                    (Configure)
                  </button>
                {/if}
              </div>
            </div>

            <div class="flex justify-between items-center">
              <span class="text-primary">Time</span>
              <span class="font-semibold text-dark"
                >~{Math.round(questionCount * 2)} min</span
              >
            </div>

            <div class="flex justify-between items-center">
              <span class="text-primary">Difficulty</span>
              <span class="font-semibold text-dark">
                {difficultyPreset === "custom"
                  ? "Custom"
                  : difficultyPreset.charAt(0).toUpperCase() +
                    difficultyPreset.slice(1)} · {easyPercent}/{mediumPercent}/{hardPercent}
              </span>
            </div>

            <div class="flex justify-between items-center">
              <span class="text-primary">Papers to print</span>
              <span class="font-semibold text-dark"
                >{setsCount} sets × {versionsCount} version{versionsCount > 1
                  ? "s"
                  : ""}</span
              >
            </div>
          </div>

          <!-- Generate Action Button -->
          <Button
            btnType="primary"
            customClass="w-full mt-6 py-3 px-4 font-bold rounded-xl shadow-xs text-sm group flex items-center justify-center gap-2"
          >
            <span>Generate paper</span>
            <ArrowRight
              class="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
            />
          </Button>

          <!-- Save as Draft Button (In ADD mode) -->
          {#if !isEditMode}
            <Button
              btnType="secondary"
              disabled={isSavingDraft}
              customClass="w-full mt-2.5 py-3 px-4 font-semibold rounded-xl text-sm border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition cursor-pointer flex items-center justify-center gap-2"
              on:click={handleSaveDraft}
            >
              {#if isSavingDraft}
                <Loader2 class="w-4 h-4 text-slate-600 animate-spin" />
                <span>Saving Draft...</span>
              {:else}
                <span>Save as Draft</span>
              {/if}
            </Button>
          {/if}

          {#if saveDraftError}
            <p class="text-xs text-red-600 font-medium text-center mt-2.5">
              {saveDraftError}
            </p>
          {/if}

          <!-- Subtext -->
        </div>

        <!-- Secondary Question Pool Card -->
        <div
          on:click={openQuestionPoolModal}
          class="bg-white border border-[#eee9dc] rounded-2xl p-5 shadow-xs text-xs text-slate-600 hover:border-slate-300 transition cursor-pointer"
        >
          <p class="leading-relaxed font-medium">
            <span class="font-bold text-blue-700 hover:underline"
              >Review question pool</span
            >
            — see the {availableQuestionCount} questions that match your syllabus
            (optional)
          </p>
        </div>
      </div>
    </div>
  {/if}
</div>

<!-- CHAPTERS & TOPICS SELECTION POPUP MODAL -->
{#if showChapterModal}
  <PortalModal>
    <div
      class="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
    >
      <!-- Modal Header -->
      <div
        class="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50"
      >
        <div>
          <h3 class="text-lg font-bold text-slate-900">
            Select Chapters & Topics
          </h3>
          <p class="text-xs text-slate-500 mt-0.5">
            Choose chapters and topics for {currentSubjectName} (Class {selectedClass}
            - {currentMediumName})
          </p>
        </div>
        <button
          type="button"
          on:click={() => (showChapterModal = false)}
          class="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-6 overflow-y-auto flex-1">
        {#if chaptersLoading}
          <div
            class="flex flex-col items-center justify-center py-12 space-y-3"
          >
            <Loader2 class="w-8 h-8 text-primary animate-spin" />
            <p class="text-sm font-medium text-slate-600">
              Loading syllabus chapters & topics...
            </p>
          </div>
        {:else if chaptersError}
          <div
            class="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-200"
          >
            {chaptersError}
          </div>
        {:else if !chaptersData || chaptersData.length === 0}
          <div class="text-center py-12 text-slate-500 text-sm">
            No content available for Class {selectedClass}, {currentSubjectName}
            ({currentMediumName}).
          </div>
        {:else}
          <ContentHierarchyTable
            {chaptersData}
            {selections}
            {expandedChapters}
            {expandedTopics}
            on:toggleChapter={(e) => handleToggleChapter(e.detail)}
            on:toggleTopic={(e) => handleToggleTopic(e.detail)}
            on:checkboxChange={(e) =>
              handleCheckboxChange(
                e.detail.event,
                e.detail.item,
                e.detail.type,
              )}
          />
        {/if}
      </div>

      <!-- Modal Footer -->
      <div
        class="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between"
      >
        <span class="text-xs font-semibold text-slate-600">
          {selections.filter((s) => s.type === "chapter").length} chapters, {selections.filter(
            (s) => s.type === "topic",
          ).length} topics selected
        </span>
        <Button
          btnType="primary"
          customClass="!px-6 !py-2.5 rounded-xl font-bold text-xs"
          on:click={applyChapterSelections}
        >
          Apply Selection
        </Button>
      </div>
    </div>
  </PortalModal>
{/if}

<!-- QUESTION POOL REVIEW MODAL -->
{#if showQuestionPoolModal}
  <PortalModal>
    <div
      class="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
    >
      <!-- Modal Header -->
      <div
        class="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50"
      >
        <div>
          <h3 class="text-lg font-bold text-slate-900">Review Question Pool</h3>
          <p class="text-xs text-slate-500 mt-0.5">
            Syllabus question pool for {currentSubjectName} (Class {selectedClass}
            - {currentMediumName})
          </p>
        </div>
        <button
          type="button"
          on:click={() => (showQuestionPoolModal = false)}
          class="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Modal Body with Tabs -->
      <div class="p-6 overflow-y-auto flex-1">
        {#if questionPoolLoading}
          <div
            class="flex flex-col items-center justify-center py-16 space-y-3"
          >
            <Loader2 class="w-8 h-8 text-primary animate-spin" />
            <p class="text-sm font-medium text-slate-600">
              Loading questions from selected chapters...
            </p>
          </div>
        {:else if questionPoolError}
          <div
            class="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-200"
          >
            {questionPoolError}
          </div>
        {:else}
          <Tabs bind:active={poolActiveTab}>
            <div class="border-b border-slate-200 bg-white">
              <nav class="flex space-x-0">
                <Tab
                  name="available"
                  title={`Available Questions (${availableQuestions.length})`}
                />
                <Tab
                  name="excluded"
                  title={`Excluded Questions (${qtn_codes_to_exclude.length})`}
                />
              </nav>
            </div>

            <TabPanel name="available">
              <DataTable
                tableHeadersDisplay={poolTableHeaders}
                tableData={paginatedAvailableQuestions}
                showPagination={false}
                serverSidePagination={true}
                apiCurrentPage={availableCurrentPage}
                apiTotalItems={availableQuestions.length}
                apiPageSize={poolItemsPerPage}
                actionConfigObject={availableActionConfig}
                customRenderers={questionCustomRenderers}
                notFoundMessage="No available questions remaining in pool."
                on:tableActionClick={handleQuestionTableAction}
              />

              {#if availableQuestions.length > poolItemsPerPage}
                <Pagination
                  currentPage={availableCurrentPage}
                  totalPages={availableTotalPages}
                  on:pageChange={(e) => (availableCurrentPage = e.detail)}
                />
              {/if}
            </TabPanel>

            <TabPanel name="excluded">
              <div class="space-y-4">
                {#if excludedQuestionsList.length > 0}
                  <div class="flex justify-between items-center mb-2">
                    <span class="text-xs text-slate-500 font-medium">
                      {excludedQuestionsList.length} question(s) excluded
                    </span>
                    <Button
                      btnType="secondary"
                      customClass="!px-3 !py-1.5 !text-xs rounded-lg"
                      on:click={restoreAllQuestions}
                    >
                      Restore All
                    </Button>
                  </div>
                {/if}

                <DataTable
                  tableHeadersDisplay={poolTableHeaders}
                  tableData={paginatedExcludedQuestions}
                  showPagination={false}
                  serverSidePagination={true}
                  apiCurrentPage={excludedCurrentPage}
                  apiTotalItems={excludedQuestionsList.length}
                  apiPageSize={poolItemsPerPage}
                  actionConfigObject={excludedActionConfig}
                  customRenderers={questionCustomRenderers}
                  notFoundMessage="No questions excluded yet."
                  on:tableActionClick={handleQuestionTableAction}
                />

                {#if excludedQuestionsList.length > poolItemsPerPage}
                  <Pagination
                    currentPage={excludedCurrentPage}
                    totalPages={excludedTotalPages}
                    on:pageChange={(e) => (excludedCurrentPage = e.detail)}
                  />
                {/if}
              </div>
            </TabPanel>
          </Tabs>
        {/if}
      </div>

      <!-- Modal Footer -->
      <div
        class="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between"
      >
        <span class="text-xs font-semibold text-slate-600">
          {availableQuestions.length} Available · {qtn_codes_to_exclude.length}
          Excluded
        </span>
        <Button
          btnType="primary"
          customClass="!px-6 !py-2.5 rounded-xl font-bold text-xs"
          on:click={() => (showQuestionPoolModal = false)}
        >
          Done
        </Button>
      </div>
    </div>
  </PortalModal>
{/if}

<!-- MANUAL QUESTION ALLOCATION POPUP MODAL -->
{#if showManualAllocationModal}
  <PortalModal>
    <div
      class="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
    >
      <!-- Modal Header -->
      <div
        class="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50"
      >
        <div>
          <h3 class="text-lg font-bold text-slate-900">
            Manual Question Allocation
          </h3>
          <p class="text-xs text-slate-500 mt-0.5">
            Specify question allocation across selected chapters and topics for {currentSubjectName}
            (Class {selectedClass} - {currentMediumName})
          </p>
        </div>
        <button
          type="button"
          on:click={() => (showManualAllocationModal = false)}
          class="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-6 overflow-y-auto flex-1">
        <ManualAllocationTable
          bind:selections
          {chaptersData}
          totalQuestions={questionCount}
          {isAutoAllocation}
          {setsCount}
          on:remove={(e) => removeChapter(e.detail.code)}
        />
      </div>

      <!-- Modal Footer -->
      <div
        class="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between"
      >
        <span class="text-xs font-semibold text-slate-600">
          Target: {questionCount} questions · Allocated: {selections.reduce(
            (sum, s) => sum + (Number(s.qn_count) || 0),
            0,
          )} / {questionCount}
        </span>
        <Button
          btnType="primary"
          customClass="!px-6 !py-2.5 rounded-xl font-bold text-xs"
          on:click={() => (showManualAllocationModal = false)}
        >
          Done
        </Button>
      </div>
    </div>
  </PortalModal>
{/if}
