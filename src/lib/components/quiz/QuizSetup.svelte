<script>
  import { onMount, createEventDispatcher } from "svelte";
  import api from "$lib/utils/api.js";
  import NestedSelectionTable from "./NestedSelectionTable.svelte";

  const dispatch = createEventDispatcher();

  // Set default selection type to mixed and remove the radio button logic
  let selectedType = "mixed"; // Always mixed

  // Update the quizConfig to always use mixed
  export let quizConfig = {
    standard: "",
    subject_code: "",
    medium_code: "",
    chapter_topic_type: "mixed", // Always mixed
    selected_codes: [],
    exam_name: "",
    total_time: 15,
    total_questions: 5,
    no_of_sets: 1,
    no_of_versions: 1,
  };
  export let loading = false;

  // Form data
  let subjects = [];
  let mediums = [];
  let chaptersTopics = [];
  let availableItems = []; // chapters or topics based on selection

  // Form state
  let selectedStandard = quizConfig.standard || "";
  let selectedSubject = quizConfig.subject_code || "";
  let selectedMedium = quizConfig.medium_code || "";
  let selectedCodes = [...(quizConfig.selected_codes || [])];
  let customExamName = quizConfig.exam_name || "";

  // Loading states
  let loadingSubjects = false;
  let loadingMediums = false;
  let loadingChaptersTopics = false;
  let generating = false; // For quiz creation

  // Error states
  let errors = {};
  let generateError = "";

  // Quiz creation state
  let quizPaperResponse = null;

  // Dynamic subject cards - will be populated from API data
  let subjectCards = [];

  // Track selected card
  let selectedCard = null;

  // Add a variable to track the type of each selected code
  let selectedCodeTypes = {};

  // Exam papers state
  let isLoading = true;
  let exams = [];

  onMount(async () => {
    await loadInitialData();
    await loadPapers(); // Load exam papers
  });

  async function loadInitialData() {
    await loadMediums(); // Load mediums using existing API

    // If all required fields are selected, load chapters/topics
    if (selectedStandard && selectedSubject && selectedMedium) {
      await loadChaptersTopics();
    }
  }

  async function loadPapers() {
    try {
      const response = await api.viewPapers.getAll({
        status: "closed",
        limit: 20, // Increase limit to get more data
      });

      if (response.error || !response.data) {
        throw new Error("Api response error: " + response.error);
      }

      exams = response.data.exams || [];
      console.log("Successfully fetched data", exams);

      // Generate subject cards from the exam data
      generateSubjectCardsFromData(exams);
    } catch (error) {
      console.error("Failed to fetch exams:", error);
      exams = [];
      // Fallback to default cards if API fails
      setDefaultSubjectCards();
    } finally {
      isLoading = false;
    }
  }

  // Method to generate unique subject cards from exam data

  function generateSubjectCardsFromData(examData) {
    console.log("Generating subject cards from exam data:", examData);

    if (!examData || !Array.isArray(examData) || examData.length === 0) {
      console.warn("No exam data available, using default cards");
      setDefaultSubjectCards();
      return;
    }
    // Create a Set to track unique combinations
    // Create a Set to track unique combinations
    const uniqueCards = new Map();

    examData.forEach((exam, index) => {
      // Check multiple possible property names for subject code and medium code
      const subject = exam.subject;
      const standard = exam.standard;
      const medium = exam.medium;

      // Try different possible property names for subject_code
      const subjectCode =
        exam.subject_code || exam.subjectCode || exam.subject_id || exam.code;

      // Try different possible property names for medium_code
      const mediumCode = exam.medium_code || exam.mediumCode || exam.medium_id;

      console.log(`Exam ${index}:`, {
        subject,
        standard,
        medium,
        subjectCode,
        mediumCode,
      });
      console.log("Full exam object:", exam); // Log the full object to see all available properties

      // Create a unique key - if subjectCode is missing, use subject name as fallback
      const keySubject = subjectCode || subject;
      const uniqueKey = `${standard}-${subject}-${keySubject}`;

      // Only add if we have minimum required fields (subject, standard) and it's not already added
      if (subject && standard && !uniqueCards.has(uniqueKey)) {
        // Generate a fallback subject code if not available
        const finalSubjectCode = subjectCode || generateSubjectCode(subject);

        // Create the card object
        const card = {
          id: uniqueCards.size + 1, // Unique ID
          standard: standard.toString(),
          subject: subject,
          subject_code: finalSubjectCode,
          description: generateSubjectDescription(subject),
          icon: getSubjectIcon(subject),
          bgColor: getSubjectBgColor(subject),
          borderColor: getSubjectBorderColor(subject),
          textColor: getSubjectTextColor(subject),
          selectedBorderColor: getSubjectSelectedBorderColor(subject),
          // Store available mediums for this combination
          availableMediums: new Set(mediumCode ? [mediumCode] : []), // Only add if mediumCode exists
        };

        uniqueCards.set(uniqueKey, card);
        console.log(`Added new card: ${uniqueKey}`, card);
      } else if (uniqueCards.has(uniqueKey) && mediumCode) {
        // If card exists but we found a new medium, add it
        const existingCard = uniqueCards.get(uniqueKey);
        existingCard.availableMediums.add(mediumCode);
      }
    });

    // Convert Map values to array and process availableMediums
    subjectCards = Array.from(uniqueCards.values()).map((card) => ({
      ...card,
      availableMediums: Array.from(card.availableMediums), // Convert Set to Array
    }));

    console.log("Generated subject cards:", subjectCards);

    // If no cards were generated, use defaults
    if (subjectCards.length === 0) {
      console.warn("No valid cards generated, using defaults");
      setDefaultSubjectCards();
    }
  }

  // Helper function to generate subject description
  function generateSubjectDescription(subject) {
    const descriptions = {
      "Social Science": "History, Geography, Political Science & Economics",
      Science: "Physics, Chemistry & Biology",
      Mathematics: "Algebra, Geometry, Statistics & Trigonometry",
      English: "Grammar, Literature & Communication",
      Hindi: "व्याकरण, साहित्य और भाषा कौशल",
      "Computer Science": "Programming, Algorithms & Technology",
      Biology: "Life Sciences, Ecology & Human Body",
      Physics: "Mechanics, Thermodynamics & Electromagnetism",
      Chemistry: "Organic, Inorganic & Physical Chemistry",
      History: "Ancient, Medieval & Modern History",
      Geography: "Physical, Human & Economic Geography",
      Economics: "Micro, Macro & Development Economics",
      "Political Science":
        "Indian Polity, International Relations & Public Administration",
    };

    return descriptions[subject] || `${subject} curriculum and concepts`;
  }

  // Helper function to get subject icon
  function getSubjectIcon(subject) {
    const icons = {
      "Social Science": "🌍",
      Science: "🔬",
      Mathematics: "📐",
      English: "📚",
      Hindi: "📖",
      "Computer Science": "💻",
      Biology: "🧬",
      Physics: "⚛️",
      Chemistry: "🧪",
      History: "🏛️",
      Geography: "🗺️",
      Economics: "📊",
      "Political Science": "🏛️",
    };

    return icons[subject] || "📘";
  }

  // Helper function to get background color
  function getSubjectBgColor(subject) {
    const colors = {
      "Social Science": "bg-blue-50",
      Science: "bg-green-50",
      Mathematics: "bg-purple-50",
      English: "bg-indigo-50",
      Hindi: "bg-orange-50",
      "Computer Science": "bg-gray-50",
      Biology: "bg-emerald-50",
      Physics: "bg-cyan-50",
      Chemistry: "bg-yellow-50",
      History: "bg-amber-50",
      Geography: "bg-teal-50",
      Economics: "bg-pink-50",
      "Political Science": "bg-red-50",
    };

    return colors[subject] || "bg-gray-50";
  }

  // Helper function to get border color
  function getSubjectBorderColor(subject) {
    const colors = {
      "Social Science": "border-blue-200",
      Science: "border-green-200",
      Mathematics: "border-purple-200",
      English: "border-indigo-200",
      Hindi: "border-orange-200",
      "Computer Science": "border-gray-200",
      Biology: "border-emerald-200",
      Physics: "border-cyan-200",
      Chemistry: "border-yellow-200",
      History: "border-amber-200",
      Geography: "border-teal-200",
      Economics: "border-pink-200",
      "Political Science": "border-red-200",
    };

    return colors[subject] || "border-gray-200";
  }

  // Helper function to get text color
  function getSubjectTextColor(subject) {
    const colors = {
      "Social Science": "text-blue-700",
      Science: "text-green-700",
      Mathematics: "text-purple-700",
      English: "text-indigo-700",
      Hindi: "text-orange-700",
      "Computer Science": "text-gray-700",
      Biology: "text-emerald-700",
      Physics: "text-cyan-700",
      Chemistry: "text-yellow-700",
      History: "text-amber-700",
      Geography: "text-teal-700",
      Economics: "text-pink-700",
      "Political Science": "text-red-700",
    };

    return colors[subject] || "text-gray-700";
  }

  // Helper function to get selected border color
  function getSubjectSelectedBorderColor(subject) {
    const colors = {
      "Social Science": "border-blue-500",
      Science: "border-green-500",
      Mathematics: "border-purple-500",
      English: "border-indigo-500",
      Hindi: "border-orange-500",
      "Computer Science": "border-gray-500",
      Biology: "border-emerald-500",
      Physics: "border-cyan-500",
      Chemistry: "border-yellow-500",
      History: "border-amber-500",
      Geography: "border-teal-500",
      Economics: "border-pink-500",
      "Political Science": "border-red-500",
    };

    return colors[subject] || "border-gray-500";
  }

  // Fallback method to set default cards
  function setDefaultSubjectCards() {
    subjectCards = [
      {
        id: 1,
        standard: "10",
        subject: "Social Science",
        subject_code: "3000",
        description: "History, Geography, Political Science & Economics",
        icon: "🌍",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        textColor: "text-blue-700",
        selectedBorderColor: "border-blue-500",
      },
      {
        id: 2,
        standard: "10",
        subject: "Science",
        subject_code: "1000",
        description: "Physics, Chemistry & Biology",
        icon: "🔬",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        textColor: "text-green-700",
        selectedBorderColor: "border-green-500",
      },
    ];
  }

  // Handle card selection
  async function selectSubjectCard(card) {
    selectedCard = card;
    selectedStandard = card.standard;
    selectedSubject = card.subject_code;

    // Clear previous selections
    selectedCodes = [];
    chaptersTopics = [];
    errors = {};

    console.log("Selected card:", card);

    // Load chapters/topics if medium is also selected
    if (selectedMedium) {
      await loadChaptersTopics();
    }
  }

  // Rest of your existing methods remain the same...
  // [Keep all the existing methods: loadMediums, loadChaptersTopics, etc.]

  async function loadMediums() {
    try {
      loadingMediums = true;
      const response = await api.mediums.getAll();
      console.log("Mediums response:", response);

      if (response.error) {
        throw new Error(response.error);
      }

      // Handle the nested data structure: { data: { data: [...] } }
      if (
        response.data &&
        response.data.data &&
        Array.isArray(response.data.data)
      ) {
        mediums = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        mediums = response.data;
      } else {
        mediums = [];
        console.warn("Unexpected mediums response structure:", response);
      }
    } catch (error) {
      console.error("Error loading mediums:", error);
      errors.mediums = error.message;
    } finally {
      loadingMediums = false;
    }
  }

  // Use existing API method for chapters/topics
  async function loadChaptersTopics() {
    if (!selectedStandard || !selectedSubject || !selectedMedium) {
      return;
    }

    try {
      loadingChaptersTopics = true;
      chaptersTopics = [];
      availableItems = [];

      const response = await api.chapterTopics.getAll({
        standard: selectedStandard,
        medium_code: selectedMedium,
        subject_code: selectedSubject,
      });

      console.log("Chapters/Topics response:", response);

      if (response.error) {
        throw new Error(response.error);
      }

      // Handle nested data structure if it exists
      if (
        response.data &&
        response.data.data &&
        Array.isArray(response.data.data)
      ) {
        chaptersTopics = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        chaptersTopics = response.data;
      } else {
        chaptersTopics = [];
        console.warn(
          "Unexpected chapters/topics response structure:",
          response,
        );
      }

      updateAvailableItems();
    } catch (error) {
      console.error("Error loading chapters/topics:", error);
      errors.chaptersTopics = error.message;
    } finally {
      loadingChaptersTopics = false;
    }
  }

  function updateAvailableItems() {
    if (selectedType === "chapter") {
      availableItems = chaptersTopics.map((chapter) => ({
        code: chapter.code || chapter.chapter_code,
        name: chapter.name || chapter.chapter_name,
        question_count: chapter.question_count || 0,
      }));
    } else {
      // Flatten all topics from all chapters
      availableItems = [];
      chaptersTopics.forEach((chapter) => {
        if (chapter.topics && Array.isArray(chapter.topics)) {
          chapter.topics.forEach((topic) => {
            availableItems.push({
              code: topic.code || topic.topic_code,
              name: `${chapter.name || chapter.chapter_name} > ${topic.name || topic.topic_name}`,
              question_count: topic.question_count || 0,
            });
          });
        }
      });
    }

    // Reset selection if previously selected codes are not available
    selectedCodes = selectedCodes.filter((code) =>
      availableItems.some((item) => item.code === code),
    );
  }

  // Handle selection from the table
  function handleSelectionToggle(event) {
    const { code, type } = event.detail;
    toggleItemSelection(code);

    // Store the type information for each selected code
    if (!selectedCodeTypes) {
      selectedCodeTypes = {};
    }

    if (selectedCodes.includes(code)) {
      selectedCodeTypes[code] = type;
    } else {
      delete selectedCodeTypes[code];
    }
  }

  // Event handlers
  async function handleMediumChange() {
    selectedCodes = [];
    errors = {};
    if (selectedStandard && selectedSubject && selectedMedium) {
      await loadChaptersTopics();
    }
  }

  function toggleItemSelection(code) {
    if (selectedCodes.includes(code)) {
      selectedCodes = selectedCodes.filter((c) => c !== code);
    } else {
      selectedCodes = [...selectedCodes, code];
    }
  }

  function generateExamName() {
    if (!selectedCard || !selectedMedium) {
      return "";
    }

    const medium = mediums.find((m) => m.medium_code === selectedMedium);

    // Create a single Date object to use for both date and time
    const now = new Date();

    // Format the date as YYYY-MM-DD
    const date = now.toISOString().split("T")[0];

    // Format the time as HH:MM (24-hour format)
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const time = `${hours}:${minutes}`;

    // Combine everything into the final name
    return `Quiz - ${selectedCard.subject} - Class ${selectedCard.standard} - ${medium?.medium_name || "Medium"} - ${date} ${time}`;
  }

  function validateForm() {
    const newErrors = {};

    if (!selectedCard) {
      newErrors.card = "Please select a subject card";
    }

    if (!selectedMedium) {
      newErrors.medium = "Please select a medium";
    }

    if (selectedCodes.length === 0) {
      newErrors.selection = "Please select at least one chapter or topic";
    }

    errors = newErrors;
    return Object.keys(newErrors).length === 0;
  }

  // Function to separate chapter and topic codes (copied from QuizPreview)
  function separateChapterAndTopicCodes(selectedCodes, chaptersTopicsData) {
    const chapters = [];
    const topics = [];

    console.log("Input data for separation:", {
      selectedCodes,
      chaptersTopicsData,
    });

    if (!chaptersTopicsData || !Array.isArray(chaptersTopicsData)) {
      console.warn("chaptersTopicsData is not available or not an array");
      return { chapters, topics };
    }

    // Create lookup maps for faster searching
    const chapterCodeMap = new Map();
    const topicCodeMap = new Map();

    chaptersTopicsData.forEach((chapter) => {
      const chapterCode = chapter.code || chapter.chapter_code;
      if (chapterCode) {
        chapterCodeMap.set(chapterCode, chapter);
        console.log("Added chapter to map:", chapterCode);
      }

      if (chapter.topics && Array.isArray(chapter.topics)) {
        chapter.topics.forEach((topic) => {
          const topicCode = topic.code || topic.topic_code;
          if (topicCode) {
            topicCodeMap.set(topicCode, topic);
            console.log("Added topic to map:", topicCode);
          }
        });
      }
    });

    console.log("Chapter codes available:", Array.from(chapterCodeMap.keys()));
    console.log("Topic codes available:", Array.from(topicCodeMap.keys()));

    // Separate the selected codes
    selectedCodes.forEach((code) => {
      if (chapterCodeMap.has(code)) {
        chapters.push(code);
        console.log("Found chapter:", code);
      } else if (topicCodeMap.has(code)) {
        topics.push(code);
        console.log("Found topic:", code);
      } else {
        console.warn("Code not found in chapters or topics:", code);
      }
    });

    return { chapters, topics };
  }

  // Create quiz paper and start quiz directly
  async function createQuizAndStart() {
    if (!validateForm()) {
      return;
    }

    generating = true;
    generateError = "";
    quizPaperResponse = null;

    try {
      const finalExamName = customExamName || generateExamName();

      console.log("Creating quiz paper directly...");

      // Check if we have the required data
      if (!chaptersTopics || chaptersTopics.length === 0) {
        throw new Error(
          "Chapters/Topics data is missing. Please reselect your options.",
        );
      }

      // Separate chapter and topic codes
      const { chapters, topics } = separateChapterAndTopicCodes(
        selectedCodes || [],
        chaptersTopics || [],
      );

      console.log("Separated codes:", { chapters, topics });

      // Build chapters_topics array
      const chaptersTopicsArray = [];

      // Add chapters if any are selected
      if (chapters.length > 0) {
        chaptersTopicsArray.push({
          type: "chapter",
          codes: chapters.map((code) => ({
            code: code,
            // No qn_count needed since is_ai_selected = true
          })),
        });
      }

      // Add topics if any are selected
      if (topics.length > 0) {
        chaptersTopicsArray.push({
          type: "topic",
          codes: topics.map((code) => ({
            code: code,
            // No qn_count needed since is_ai_selected = true
          })),
        });
      }

      // Ensure we have at least one selection
      if (chaptersTopicsArray.length === 0) {
        throw new Error(
          "No chapters or topics selected. Please select some chapters or topics.",
        );
      }

      // Prepare the request payload for question paper creation
      const questionPaperPayload = {
        status: 2, // Finalized
        is_ai_selected: true, // AI will select questions automatically
        exam_name: finalExamName,
        exam_type_code: "1000",
        subject_code: selectedSubject,
        medium_code: selectedMedium,
        exam_mode: "online", // Fixed for quiz mode
        total_time: 15,
        total_questions: 5,
        no_of_versions: 1, // Fixed for quiz mode
        no_of_sets: 1, // Fixed for quiz mode
        standard: selectedStandard,
        chapters_topics: chaptersTopicsArray,
      };

      console.log("Question paper creation payload:", questionPaperPayload);

      // Call the question papers API to create the quiz
      const response = await api.questionPapers.create(questionPaperPayload);

      console.log("Question Paper API Response:", response);

      if (response.error) {
        throw new Error(response.error);
      }

      // Store the response for later use
      quizPaperResponse = response.data.data;

      console.log("Quiz paper created successfully:", quizPaperResponse);

      // Start the quiz immediately
      startQuizWithData();
    } catch (error) {
      console.error("Error creating quiz paper:", error);
      generateError = error.message || "Failed to create quiz paper";
      quizPaperResponse = null;
    } finally {
      generating = false;
    }
  }

  function startQuizWithData() {
    if (
      !quizPaperResponse ||
      !quizPaperResponse.question_papers ||
      quizPaperResponse.question_papers.length === 0
    ) {
      generateError = "No question papers found in response";
      return;
    }

    const questionPaper = quizPaperResponse.question_papers[0];
    const questions = questionPaper.qns;

    if (!questions || questions.length === 0) {
      generateError = "No questions found in question paper";
      return;
    }

    // Format the quiz data for QuizRunner
    const quizData = {
      metadata: {
        exam_name: quizPaperResponse.exam_name,
        exam_code: quizPaperResponse.exam_code,
        paper_code: questionPaper.id,
        total_questions: questions.length,
        total_time: 15,
        subject: quizPaperResponse.subject,
        medium: quizPaperResponse.medium,
        exam_type: quizPaperResponse.exam_type,
        status: quizPaperResponse.status,
      },
      questions: questions.map((question, index) => ({
        id: question.id,
        question_number: index + 1,
        text: question.text,
        options: question.options,
        correct_answer:
          question.options.find((opt) => opt.is_correct)?.id || null,
        difficulty: question.difficulty || "Medium",
        chapter: question.chapter || "",
        topic: question.topic || "",
        marks: 1,
        explanation: question.explanation || "",
        originalQuestion: question,
      })),
      config: {
        exam_code: quizPaperResponse.exam_code,
        paper_code: questionPaper.id,
        total_time: 15,
        total_questions: questions.length,
      },
    };

    console.log("Starting quiz with formatted data:", quizData);

    // Store exam code for reference
    localStorage.setItem("currentExamCode", quizPaperResponse.exam_code);
    localStorage.setItem("currentQuizData", JSON.stringify(quizData));

    // Dispatch to parent to start quiz runner directly
    dispatch("start", {
      quiz: quizData,
      config: quizData.config,
      originalResponse: quizPaperResponse,
    });
  }

  // Reactive statements
  $: if (selectedCard || selectedMedium) {
    customExamName = generateExamName();
  }

  $: if (selectedType) {
    updateAvailableItems();
  }
</script>

<div class="p-4">
  <!-- <div class="mb-4">
    <h2 class="text-base font-semibold text-gray-700 ">Quiz Setup</h2>
    <p class="text-gray-600 text-sm">Configure your quiz by selecting the class, subject, medium, and topics.</p>
  </div> -->

  {#if isLoading}
    <div class="flex justify-center items-center py-12">
      <div
        class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
      ></div>
      <span class="ml-3 text-gray-600">Loading your subjects...</span>
    </div>
  {:else}
    <form on:submit|preventDefault={createQuizAndStart} class="space-y-6">
      <!-- Subject Card Selection (dynamic from API data) -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-3">
          Select Class & Subject <span class="text-red-500">*</span>
        </label>

        {#if subjectCards.length === 0}
          <div
            class="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg"
          >
            <div class="text-gray-400 text-4xl mb-2">📚</div>
            <h3 class="text-base font-medium text-gray-900 mb-1">
              No Subjects Available
            </h3>
            <p class="text-sm text-gray-500">
              No exam papers found for your account.
            </p>
          </div>
        {:else}
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {#each subjectCards as card}
              <div
                class="relative border-2 rounded-lg p-2 cursor-pointer transition-all duration-200 hover:shadow-md {selectedCard?.id ===
                card.id
                  ? `${card.selectedBorderColor} ${card.bgColor}`
                  : `${card.borderColor} bg-white hover:${card.bgColor}`}"
                on:click={() => selectSubjectCard(card)}
              >
                <!-- Card Content -->
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <!-- Icon and Class -->
                    <div class="flex items-center space-x-3 mb-3">
                      <span class="text-base">{card.icon}</span>
                      <div>
                        <div
                          class="text-xs text-gray-500 uppercase tracking-wide"
                        >
                          Class
                        </div>
                        <div class="text-sm font-bold text-gray-700">
                          {card.standard}
                        </div>
                      </div>
                    </div>

                    <!-- Subject -->
                    <div class="mb-2">
                      <h4 class="text-sm font-semibold text-gray-900">
                        {card.subject}
                      </h4>
                      <p class="text-xs text-gray-600 leading-relaxed">
                        {card.description}
                      </p>
                    </div>
                  </div>

                  <!-- Selection Indicator -->
                  <div class="ml-4 flex-shrink-0">
                    {#if selectedCard?.id === card.id}
                      <div
                        class="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center"
                      >
                        <svg
                          class="w-3 h-3 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    {:else}
                      <div
                        class="w-5 h-5 border-2 border-gray-300 rounded-full"
                      ></div>
                    {/if}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {/if}

        {#if errors.card}
          <p class="text-red-500 text-sm mt-2">{errors.card}</p>
        {/if}
      </div>

      <!-- Rest of the form remains the same -->
      <!-- Medium Selection (only show if card is selected) -->
      {#if selectedCard}
        <div>
          <label for="medium" class="input-label">
            Medium <span class="text-red-500">*</span>
          </label>
          <select
            id="medium"
            bind:value={selectedMedium}
            on:change={handleMediumChange}
            class="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              {errors.medium ? 'border-red-500' : ''}"
            disabled={loadingMediums}
            required
          >
            <option value="">Select Medium</option>
            {#each mediums as medium}
              <option value={medium.medium_code}>{medium.medium_name}</option>
            {/each}
          </select>
          {#if loadingMediums}
            <p class="text-gray-500 text-sm mt-1">Loading mediums...</p>
          {/if}
          {#if errors.medium}
            <p class="text-red-500 text-sm mt-1">{errors.medium}</p>
          {/if}
          {#if errors.mediums}
            <p class="text-red-500 text-sm mt-1">{errors.mediums}</p>
          {/if}
        </div>
      {/if}

      <!-- Chapters/Topics Selection (only show if card and medium are selected) -->
      {#if selectedCard && selectedMedium}
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-3">
            Select Chapters and Topics <span class="text-red-500">*</span>
            {#if selectedCodes.length > 0}
              <span class="text-primary">({selectedCodes.length} selected)</span
              >
            {/if}
          </label>

          <!-- Use the NestedSelectionTable component with mixed type -->
          <NestedSelectionTable
            data={chaptersTopics}
            {selectedCodes}
            selectionType="mixed"
            loading={loadingChaptersTopics}
            on:toggle={handleSelectionToggle}
          />

          {#if errors.selection}
            <p class="text-red-500 text-sm mt-2">{errors.selection}</p>
          {/if}
          {#if errors.chaptersTopics}
            <p class="text-red-500 text-sm mt-2">{errors.chaptersTopics}</p>
          {/if}
        </div>
      {/if}

      <!-- Quiz Configuration (only show if selections are made) -->
      {#if selectedCard && selectedMedium && selectedCodes.length > 0}
        <div class=" rounded-lg p-4 border border-gray-200">
          <h3 class="text-base font-medium text-gray-700 mb-4">
            Quiz Configuration
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Exam Name -->
            <div class="">
              <label for="examName" class="input-label"> Quiz Name </label>
              <input
                id="examName"
                type="text"
                bind:value={customExamName}
                placeholder={generateExamName()}
                class="input-field"
              />
              <p class="text-xs text-gray-500 mt-1">
                Leave blank to use auto-generated name
              </p>
            </div>
            <div class="">
              <label for="questionCount" class="input-label">
                Questions to add
              </label>
              <input
                id="questionCount"
                type="number"
                min="1"
                max="50"
                class="input-field"
                placeholder="5"
              />
              <p class="text-xs text-gray-500 mt-1">
                Insert number of questions
              </p>
            </div>
          </div>

          <!-- Selected Summary -->
          <div class="mt-4 p-3 bg-white rounded border border-gray-200">
            <div class="flex items-center justify-between text-sm">
              <div>
                <span class="font-medium text-sm text-gray-700">Selected:</span>
                <span class="text-primary ml-1 text-sm">
                  Class {selectedCard.standard} • {selectedCard.subject} • {selectedCodes.length}
                  items
                </span>
              </div>
              <div class="text-gray-700 text-sm">
                {mediums.find((m) => m.medium_code === selectedMedium)
                  ?.medium_name || "Medium"}
              </div>
            </div>
          </div>
        </div>
      {/if}

      <!-- Error Display -->
      {#if generateError}
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <div class="flex items-center">
            <svg
              class="w-5 h-5 text-red-500 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01M6 18h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <div class="flex-1">
              <h3 class="text-sm font-medium text-red-800">
                Quiz Creation Error
              </h3>
              <p class="text-sm text-red-700 mt-1">{generateError}</p>
            </div>
          </div>
        </div>
      {/if}

      <!-- Action Buttons -->
      <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={loading ||
            generating ||
            !selectedCard ||
            !selectedMedium ||
            selectedCodes.length === 0}
          class="px-6 py-2 text-sm bg-green-600 text-white font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {#if generating}
            <div
              class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"
            ></div>
            Creating Quiz...
          {:else}
            <svg
              class="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Start Quiz
          {/if}
        </button>
      </div>
    </form>
  {/if}
</div>
