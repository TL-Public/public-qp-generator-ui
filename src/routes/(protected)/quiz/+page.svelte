<script>
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { authStore } from "$lib/stores/authStore.js";
  import api from "$lib/utils/api.js";

  // Import quiz components
  import QuizSetup from "$lib/components/quiz/QuizSetup.svelte";
  import QuizRunner from "$lib/components/quiz/QuizRunner.svelte";
  import QuizResults from "$lib/components/quiz/QuizResults.svelte";
  import FontSizeControl from "$lib/components/ui/FontSizeControl.svelte";

  // State management - Start directly with setup, skip preview
  let currentStep = "setup"; // Only 'setup', 'running', 'results'
  let loading = false;
  let error = "";

  // Quiz data
  let quizConfig = {
    standard: "",
    subject_code: "",
    medium_code: "",
    chapter_topic_type: "mixed",
    selected_codes: [],
    exam_name: "",
    total_time: 15,
    total_questions: 5,
    no_of_sets: 1,
    no_of_versions: 1,
  };

  let generatedQuiz = null;
  let quizSession = null;
  let quizResults = null;

  // User authentication check
  let isAuthenticated = false;
  let userRole = "";

  onMount(() => {
    const unsubscribe = authStore.subscribe((auth) => {
      isAuthenticated = auth.isAuthenticated;
      userRole = auth.role;

     
    });

    return unsubscribe;
  });

  // Step navigation functions
  function goToSetup() {
    currentStep = "setup";
    error = "";
  }

  // Direct quiz start from setup (skip preview)
  function goToRunner(eventDetail) {
    console.log("Quiz start event received:", eventDetail);

    if (eventDetail.quiz) {
      generatedQuiz = eventDetail.quiz;
      currentStep = "running";
      error = "";

      console.log("Starting quiz with data:", generatedQuiz);
    } else {
      handleError("No quiz data received from setup");
    }
  }

  function goToResults(results) {
    quizResults = results;
    currentStep = "results";
    error = "";
  }

  // Error handling
  function handleError(errorMessage) {
    error = errorMessage;
    loading = false;
  }

  // Reset quiz
  function resetQuiz() {
    currentStep = "setup";
    quizConfig = {
      standard: "",
      subject_code: "",
      medium_code: "",
      chapter_topic_type: "mixed",
      selected_codes: [],
      exam_name: "",
      total_time: 15,
      total_questions: 5,
      no_of_sets: 1,
      no_of_versions: 1,
    };
    generatedQuiz = null;
    quizSession = null;
    quizResults = null;
    error = "";
  }

  // Get current step name for display
  function getCurrentStepName() {
    switch (currentStep) {
      case "setup":
        return "Setup";
      case "running":
        return "Running";
      case "results":
        return "Results";
      default:
        return "Quiz";
    }
  }
</script>

<!-- Font Size Control - Always visible -->
<!-- <div class="font-size-control-container">
  <FontSizeControl />
</div> -->

<!-- Full viewport layout - no restrictions when quiz is running -->
{#if currentStep === "running"}
  <!-- Full screen quiz runner without any containers -->
  <QuizRunner
    quiz={generatedQuiz}
    showAnswers={true}
    on:complete={(e) => goToResults(e.detail)}
    on:back={goToSetup}
    on:error={(e) => handleError(e.detail)}
  />
{:else}
  <!-- Regular layout for setup and results -->
  <main class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-4">
      <!-- Header -->
      <div class="mb-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-xl font-bold text-gray-700">Quiz Generator</h1>
            <p class="text-gray-600 text-sm">
              Create and run interactive quizzes for your students
            </p>
          </div>

          <!-- Navigation and Reset -->
          <div class="flex items-center space-x-4">
            {#if currentStep !== "setup" || quizConfig.selected_codes.length > 0}
              <button
                on:click={resetQuiz}
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Start Over
              </button>
            {/if}
          </div>
        </div>

        <!-- Step indicator -->
        <div class="">
          <div class="flex items-center text-sm text-gray-600">
            <!-- <span class="font-medium text-blue-600">{getCurrentStepName()}</span
            > -->
            {#if quizConfig.standard && quizConfig.subject_code}
              <span class="mx-2">•</span>
              <span>Class {quizConfig.standard}</span>
              <span class="mx-2">•</span>
              <span
                >{quizConfig.subject_code === "3000"
                  ? "Social Science"
                  : "Science"}</span
              >
            {/if}
          </div>
        </div>
      </div>

      <!-- Error Display -->
      {#if error}
        <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <div>
              <h3 class="text-sm font-medium text-red-800">Error</h3>
              <p class="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      {/if}

      <!-- Loading Overlay -->
      {#if loading}
        <div
          class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <div class="bg-white rounded-lg p-6 flex items-center space-x-3">
            <div
              class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"
            ></div>
            <span class="text-gray-700">Processing...</span>
          </div>
        </div>
      {/if}

      <!-- Main Content -->
      <div class="bg-white rounded-lg shadow-sm">
        {#if currentStep === "setup"}
          <QuizSetup
            {quizConfig}
            bind:loading
            on:start={(e) => goToRunner(e.detail)}
            on:error={(e) => handleError(e.detail)}
          />
        {:else if currentStep === "results"}
          <QuizResults
            {quizResults}
            quiz={generatedQuiz}
            config={quizConfig}
            on:restart={resetQuiz}
            on:back={goToSetup}
          />
        {/if}
      </div>

      <!-- Footer -->
      <div class="mt-8 text-center text-sm text-gray-500">
        <p>Smart Question Paper - Quiz Generator</p>
      </div>
    </div>
  </main>
{/if}

<style>
  .container {
    max-width: 1200px;
  }

  .font-size-control-container {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 9999;
  }

  /* Ensure font size control is visible on quiz runner */
  :global(.quiz-fullscreen) .font-size-control-container {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 9999;
  }
</style>
