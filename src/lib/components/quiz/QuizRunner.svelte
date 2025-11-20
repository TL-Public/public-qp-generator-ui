<script>
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { quizSessionStore, quizRemarksStore, remarksHelpers } from '$lib/stores/quizStore.js';
  import FontSizeControl from '$lib/components/ui/FontSizeControl.svelte';
  import QuestionRemarks from '$lib/components/quiz/QuestionRemarks.svelte';
  import { decodeHTMLEntities, cleanQuestionText } from '$lib/utils/textUtils.js';

  const dispatch = createEventDispatcher();

  export let quiz = null;
  export let showAnswers = false;

  // Quiz state
  let questions = [];
  let currentQuestionIndex = 0;
  let selectedAnswer = null;
  let answers = {};
  let questionRemarks = {};
  let revealedAnswers = {};
  let showExplanations = {};
  let timeRemaining = 900;
  let startTime = null;
let isCompleted = false;
  let isPaused = false;
  let submitting = false;

  // UI state
  let questionNavigationOpen = false;
  let showSubmitConfirmation = false;
  let timeDisplay = '15:00';
  let timeCritical = false;
  let timeWarning = false;

  // Timer reference
  let timer = null;
  let autoSaveTimer = null;

  // Configuration
  $: config = quiz?.metadata || {
    total_time: 15,
    total_questions: 5
  };

  // Current question
  $: currentQuestion = questions[currentQuestionIndex];
  $: selectedAnswer = currentQuestion ? answers[currentQuestion.id] : null;

  // Subscribe to remarks store
  $: quizRemarksStore.subscribe(remarks => {
    questionRemarks = remarks || {};
  });

  // Initialize quiz when component loads
  onMount(() => {
    initializeQuiz();
  });

  // Cleanup on destroy
  onDestroy(() => {
    clearTimer();
    clearAutoSave();
  });

  function initializeQuiz() {
    if (!quiz || !quiz.questions) {
      dispatch('error', 'Invalid quiz data');
      return;
    }

    // Clean all question data when initializing
    questions = quiz.questions.map(question => {
      const cleaned = cleanQuestionText(question);
      
      // Also clean options
      if (cleaned.options && Array.isArray(cleaned.options)) {
        cleaned.options = cleaned.options.map(option => ({
          ...option,
          text: decodeHTMLEntities(option.text || option.option_text || '')
        }));
      }
      
      // Clean explanation
      if (cleaned.explanation) {
        cleaned.explanation = decodeHTMLEntities(cleaned.explanation);
      }

      return cleaned;
    });

    startTime = new Date();
    timeRemaining = (config.total_time || 15) * 60;
    currentQuestionIndex = 0;
    answers = {};
    questionRemarks = {};
    revealedAnswers = {};
    showExplanations = {};
    isCompleted = false;
    isPaused = false;

    // Initialize session store
    quizSessionStore.set({
      startTime,
      currentQuestionIndex,
      answers,
      remarks: questionRemarks,
      timeRemaining,
      isCompleted,
      isPaused
    });

    loadCurrentAnswer();
    startTimer();
    startAutoSave();
    
    console.log('Quiz initialized with cleaned data:', {
      questions: questions.length,
      timeRemaining,
      startTime,
      showAnswers,
      sampleQuestionText: questions[0]?.text?.substring(0, 100)
    });
  }

  function startTimer() {
    clearTimer();
    timer = setInterval(() => {
      if (!isPaused && !isCompleted) {
        timeRemaining--;
        updateTimeDisplay();
        
        if (timeRemaining <= 0) {
          handleTimeUp();
        }
      }
    }, 1000);
  }

  function clearTimer() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function startAutoSave() {
    clearAutoSave();
    autoSaveTimer = setInterval(() => {
      if (!isPaused && !isCompleted) {
        saveSession();
      }
    }, 5000);
  }

  function clearAutoSave() {
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer);
      autoSaveTimer = null;
    }
  }

  function updateTimeDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Update warning states
    timeWarning = timeRemaining <= 300 && timeRemaining > 60; // Last 5 minutes
    timeCritical = timeRemaining <= 60; // Last minute
  }

  function handleTimeUp() {
    clearTimer();
    clearAutoSave();
    submitQuiz();
  }

  function saveSession() {
    quizSessionStore.update(session => ({
      ...session,
      currentQuestionIndex,
      answers,
      remarks: questionRemarks,
      timeRemaining,
      isPaused,
      isCompleted
    }));
  }

  function loadCurrentAnswer() {
    if (currentQuestion) {
      selectedAnswer = answers[currentQuestion.id] || null;
    }
  }

  function handleAnswerSelect(optionId) {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    selectedAnswer = optionId;
    answers[currentQuestion.id] = optionId;
    
    // REMOVED: Automatic answer revealing
    // No longer automatically reveal answers when selected
    
    // Update session store
    quizSessionStore.update(session => ({
      ...session,
      answers: { ...answers }
    }));

    console.log('Answer selected:', {
      questionId: currentQuestion.id,
      selectedAnswer: optionId,
      correctAnswer: currentQuestion.correct_answer,
      revealedState: revealedAnswers[currentQuestion.id]
    });
  }

  function handleRemarkSave(event) {
    const { questionId, remarks } = event.detail;
    remarksHelpers.saveRemark(questionId, remarks);
    console.log('Remark saved for question:', questionId, remarks);
  }

  function revealAnswer(questionId) {
    revealedAnswers[questionId] = true;
    // Force reactivity by reassigning the object
    revealedAnswers = { ...revealedAnswers };
    console.log('Answer revealed for question:', questionId);
  }

  function getOptionStatus(questionId, optionId) {
    const question = questions.find(q => q.id === questionId);
    if (!question) return '';

    const isSelected = answers[questionId] === optionId;
    const isCorrect = question.correct_answer === optionId;
    const isRevealed = revealedAnswers[questionId] === true;

    console.log('Option status check:', {
      questionId,
      optionId,
      isSelected,
      isCorrect,
      isRevealed,
      correctAnswer: question.correct_answer,
      revealedAnswersState: revealedAnswers
    });

    if (!isRevealed) {
      return isSelected ? 'selected' : '';
    }

    // Answer is revealed
    if (isCorrect && isSelected) {
      return 'correct-selected';
    } else if (isCorrect) {
      return 'correct';
    } else if (isSelected) {
      return 'incorrect-selected';
    }
    
    return 'revealed';
  }

  function getOptionLabel(index) {
    return String.fromCharCode(65 + index); // A, B, C, D
  }

  function getQuestionStatus(index) {
    const question = questions[index];
    if (!question) return 'unanswered';
    
    return answers[question.id] ? 'answered' : 'unanswered';
  }

  function goToQuestion(index) {
    if (index >= 0 && index < questions.length) {
      currentQuestionIndex = index;
      loadCurrentAnswer();
      questionNavigationOpen = false;
    }
  }

  function nextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
      currentQuestionIndex++;
      loadCurrentAnswer();
    }
  }

  function previousQuestion() {
    if (currentQuestionIndex > 0) {
      currentQuestionIndex--;
      loadCurrentAnswer();
    }
  }

  function pauseQuiz() {
    isPaused = true;
    clearTimer();
    clearAutoSave();
    saveSession();
  }

  function resumeQuiz() {
    isPaused = false;
    startTimer();
    startAutoSave();
  }

  function handleSubmitClick() {
    showSubmitConfirmation = true;
  }

  function confirmSubmit() {
    showSubmitConfirmation = false;
    submitQuiz();
  }

  function cancelSubmit() {
    showSubmitConfirmation = false;
  }

  async function submitQuiz() {
    submitting = true;
    isCompleted = true;
    clearTimer();
    clearAutoSave();

    try {
      const endTime = new Date();
      const timeTaken = endTime - startTime;

      const quizResults = {
        quiz,
        config,
        session: {
          startTime,
          endTime,
          timeTaken,
          answers,
          remarks: questionRemarks,
          totalQuestions: questions.length,
          attemptedQuestions: Object.keys(answers).length
        }
      };

      console.log('Submitting quiz with remarks:', quizResults);
      
      quizSessionStore.update(session => ({
        ...session,
        isCompleted: true,
        answers,
        remarks: questionRemarks
      }));

      dispatch('complete', quizResults);

    } catch (error) {
      console.error('Error submitting quiz:', error);
      dispatch('error', 'Failed to submit quiz. Please try again.');
      submitting = false;
      isCompleted = false;
      startTimer();
    }
  }

  function toggleExplanation(questionId) {
    showExplanations[questionId] = !showExplanations[questionId];
    showExplanations = { ...showExplanations };
  }

  function handleKeydown(event) {
    if (isPaused || isCompleted) return;
    
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        previousQuestion();
        break;
      case 'ArrowRight':
        event.preventDefault();
        nextQuestion();
        break;
      case '1':
      case '2':
      case '3':
      case '4':
        if (currentQuestion && currentQuestion.options) {
          const optionIndex = parseInt(event.key) - 1;
          if (optionIndex < currentQuestion.options.length) {
            handleAnswerSelect(currentQuestion.options[optionIndex].id);
          }
        }
        break;
    }
  }

  // Reactive statements
  $: currentQuestionStatus = currentQuestion ? revealedAnswers[currentQuestion.id] === true : false;
  $: answeredCount = Object.keys(answers).length;
  $: unansweredCount = questions.length - answeredCount;
  $: currentQuestionRevealed = currentQuestion && revealedAnswers[currentQuestion.id] === true;
  $: currentQuestionAnswered = currentQuestion && answers[currentQuestion.id] !== undefined;
  
  // Initialize time display
  $: if (timeRemaining >= 0) {
    updateTimeDisplay();
  }

  // Add this reactive statement to force re-rendering when revealedAnswers changes
  $: if (revealedAnswers && currentQuestion) {
    console.log('Revealed answers updated:', revealedAnswers);
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- Full viewport quiz interface with Tailwind CSS -->
<div class="h-screen w-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-200 font-sans">
  <!-- Compact Header with Timer and Controls -->
  <div class="bg-white border-b-2 border-slate-200 px-6 py-4 shadow-lg">
    <div class="flex items-start justify-between gap-8 max-w-full">
      <!-- Quiz Info -->
      <div class="flex-none min-w-[200px]">
        <h1 class="text-xl font-semibold text-slate-900 mb-1">
          {quiz?.metadata?.exam_name || 'Quiz'}
        </h1>
        <p class="text-sm text-slate-600">
          Question {currentQuestionIndex + 1} of {questions.length}
          {#if showAnswers}
            <span class="bg-emerald-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ml-2">
              Practice Mode
            </span>
          {/if}
        </p>
      </div>

      <!-- Center Navigation -->
      <div class="flex-1 flex flex-col items-center gap-3 max-w-2xl">
        <div class="flex items-center gap-4">
          <h3 class="text-sm font-semibold text-slate-900">Questions</h3>
          <div class="flex items-center gap-1 text-xs">
            <span class="font-semibold text-emerald-600">{answeredCount}</span>
            <span class="text-slate-400">/</span>
            <span class="font-medium text-slate-600">{questions.length}</span>
          </div>
        </div>
        
        <div class="flex flex-wrap justify-center gap-2 max-w-full">
          {#each questions as question, index}
            <button
              on:click={() => goToQuestion(index)}
              class="w-9 h-9 border-2 rounded-lg font-medium text-xs cursor-pointer transition-all duration-200 flex items-center justify-center relative
                {index === currentQuestionIndex 
                  ? 'border-blue-500 bg-blue-100 text-blue-700 shadow-md shadow-blue-200' 
                  : getQuestionStatus(index) === 'answered'
                    ? 'border-emerald-500 bg-emerald-100 text-emerald-700'
                    : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50'}"
              title="Question {index + 1}"
            >
              {index + 1}
              {#if revealedAnswers[question.id]}
                <span class="absolute -top-1 -right-1 text-xs">👁️</span>
              {/if}
            </button>
          {/each}
        </div>
      </div>

      <!-- Timer and Controls -->
      <div class="flex items-center gap-4 flex-none">
        <!-- Timer Display -->
        <div class="flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all duration-200
          {timeCritical 
            ? 'bg-red-100 border-red-400 animate-pulse' 
            : timeWarning 
              ? 'bg-yellow-100 border-yellow-400' 
              : 'bg-slate-100 border-slate-300'}">
          <svg class="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="font-mono text-lg font-semibold text-slate-900">{timeDisplay}</span>
        </div>

        <!-- Font Size Control -->
        <!-- <FontSizeControl /> -->

        <!-- Pause/Resume Button -->
        <button
          on:click={isPaused ? resumeQuiz : pauseQuiz}
          disabled={isCompleted}
          class="p-2 bg-white border-2 border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 disabled:opacity-50"
          title={isPaused ? 'Resume Quiz' : 'Pause Quiz'}
        >
          {#if isPaused}
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          {:else}
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          {/if}
        </button>
      </div>
    </div>
  </div>

  <!-- Main Quiz Content -->
  <div class="flex-1 flex overflow-hidden">
    <!-- Question Content Area -->
    <div class="flex-1 flex flex-col overflow-y-auto">
      {#if isPaused}
        <!-- Paused State -->
        <div class="flex-1 flex items-center justify-center bg-slate-100">
          <div class="text-center p-12">
            <svg class="w-16 h-16 text-slate-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 class="text-2xl font-semibold text-slate-900 mb-2">Quiz Paused</h3>
            <p class="text-slate-600 mb-6">Take a break and resume when you're ready</p>
            <button 
              on:click={resumeQuiz} 
              class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
            >
              Resume Quiz
            </button>
          </div>
        </div>
      {:else if currentQuestion}
        <!-- Active Question -->
        <div class="flex-1 p-8 max-w-4xl mx-auto w-full">
          <div class="bg-white rounded-2xl p-8 shadow-lg border border-slate-200 mb-8">
            <!-- Question Header -->
            <div class="flex justify-between items-start mb-6 flex-wrap gap-4">
              <div class="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold">
                Question {currentQuestion.question_number}
              </div>
              <div class="flex gap-4 flex-wrap">
                {#if currentQuestion.chapter}
                  <span class="text-xs text-slate-600 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                    📚 {currentQuestion.chapter}
                  </span>
                {/if}
                {#if currentQuestion.topic}
                  <span class="text-xs text-slate-600 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                    📝 {currentQuestion.topic}
                  </span>
                {/if}
                <span class="text-xs px-3 py-1 rounded-lg border font-medium
                  {(currentQuestion.difficulty || 'medium').toLowerCase() === 'easy' 
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                    : (currentQuestion.difficulty || 'medium').toLowerCase() === 'medium'
                      ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                      : 'bg-red-100 text-red-700 border-red-200'}">
                  {currentQuestion.difficulty || 'Medium'}
                </span>
              </div>
            </div>

            <!-- Question Text -->
            <div class="text-lg leading-relaxed text-slate-900 mb-8 font-medium">
              {currentQuestion.text}
            </div>

            <!-- Options -->
            <div class="space-y-4">
              {#each currentQuestion.options as option, index (option.id + '-' + (revealedAnswers[currentQuestion.id] || false))}
                <label class="block border-2 rounded-xl p-4 cursor-pointer transition-all duration-200
                  {getOptionStatus(currentQuestion.id, option.id) === 'selected' 
                    ? 'border-blue-500 bg-blue-50'
                    : getOptionStatus(currentQuestion.id, option.id) === 'correct'
                      ? 'border-emerald-500 bg-emerald-50'
                      : getOptionStatus(currentQuestion.id, option.id) === 'correct-selected'
                        ? 'border-emerald-500 bg-emerald-100 shadow-lg shadow-emerald-200'
                        : getOptionStatus(currentQuestion.id, option.id) === 'incorrect-selected'
                          ? 'border-red-500 bg-red-50 shadow-lg shadow-red-200'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}">
                  <input
                    type="radio"
                    name="question-{currentQuestion.id}"
                    value={option.id}
                    checked={selectedAnswer === option.id}
                    on:change={() => handleAnswerSelect(option.id)}
                    class="sr-only"
                    disabled={currentQuestionRevealed && !showAnswers}
                  />
                  <div class="flex items-center gap-4">
                    <div class="flex-shrink-0">
                      <div class="w-5 h-5 border-2 rounded-full flex items-center justify-center transition-all duration-200
                        {getOptionStatus(currentQuestion.id, option.id) === 'selected'
                          ? 'border-blue-500 bg-blue-500'
                          : getOptionStatus(currentQuestion.id, option.id) === 'correct' || getOptionStatus(currentQuestion.id, option.id) === 'correct-selected'
                            ? 'border-emerald-500 bg-emerald-500'
                            : getOptionStatus(currentQuestion.id, option.id) === 'incorrect-selected'
                              ? 'border-red-500 bg-red-500'
                              : 'border-slate-300'}">
                        {#if selectedAnswer === option.id || (getOptionStatus(currentQuestion.id, option.id) === 'correct' || getOptionStatus(currentQuestion.id, option.id) === 'correct-selected')}
                          {#if getOptionStatus(currentQuestion.id, option.id) === 'correct' || getOptionStatus(currentQuestion.id, option.id) === 'correct-selected'}
                            <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                            </svg>
                          {:else if getOptionStatus(currentQuestion.id, option.id) === 'incorrect-selected'}
                            <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          {:else}
                            <div class="w-2 h-2 bg-white rounded-full"></div>
                          {/if}
                        {/if}
                      </div>
                    </div>
                    <span class="font-semibold text-slate-600 min-w-[1.5rem]">
                      {getOptionLabel(index)}.
                    </span>
                    <span class="flex-1 text-slate-900">
                      {option.text}
                    </span>
                    
                    <!-- Answer status indicators -->
                    <div class="flex gap-2">
                      {#if currentQuestionRevealed}
                        {#if currentQuestion.correct_answer === option.id}
                          <span class="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md font-medium">
                            ✓ Correct
                          </span>
                        {:else if selectedAnswer === option.id}
                          <span class="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-md font-medium">
                            ✗ Your Answer
                          </span>
                        {/if}
                      {/if}
                    </div>
                  </div>
                </label>
              {/each}
            </div>

            <!-- UPDATED: Reveal Answer Button Section -->
            {#if showAnswers && currentQuestionAnswered && !currentQuestionRevealed}
              <div class="mt-6 pt-6 border-t border-slate-200">
                <div class="flex items-center justify-center">
                  <button
                    on:click={() => revealAnswer(currentQuestion.id)}
                    class="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
                    title="Click to reveal the correct answer"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Reveal Correct Answer
                  </button>
                </div>
                <p class="text-center text-sm text-slate-500 mt-2">
                  You have selected an answer. Click to see if it's correct.
                </p>
              </div>
            {/if}

            <!-- Explanation Section -->
            {#if currentQuestionRevealed && currentQuestion.explanation}
              <div class="mt-6 pt-6 border-t border-slate-200">
                <button
                  on:click={() => toggleExplanation(currentQuestion.id)}
                  class="flex items-center justify-center gap-2 w-full p-3 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-200 hover:border-slate-300 transition-all duration-200 font-medium"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {showExplanations[currentQuestion.id] ? 'Hide' : 'Show'} Explanation
                  <svg class="w-4 h-4 transition-transform duration-200 {showExplanations[currentQuestion.id] ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {#if showExplanations[currentQuestion.id]}
                  <div class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div class="text-blue-800 leading-relaxed">
                      {currentQuestion.explanation}
                    </div>
                  </div>
                {/if}
              </div>
            {/if}

            <!-- Teacher Remarks Section -->
            <QuestionRemarks
              questionId={currentQuestion.id}
              remarks={questionRemarks[currentQuestion.id]?.text || ''}
              placeholder="Add notes about student responses, common mistakes, or teaching points..."
              on:save={handleRemarkSave}
            />
          </div>

          <!-- Navigation Controls -->
          <div class="flex justify-between items-center">
            <div class="flex gap-4">
              <button
                on:click={previousQuestion}
                disabled={currentQuestionIndex === 0}
                class="flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>

              {#if currentQuestionIndex === questions.length - 1}
                <button
                  on:click={handleSubmitClick}
                  disabled={submitting}
                  class="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all duration-200 disabled:opacity-50 font-medium"
                >
                  {#if submitting}
                    <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {/if}
                  Submit Quiz
                </button>
              {:else}
                <button
                  on:click={nextQuestion}
                  class="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium"
                >
                  Next
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              {/if}
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<!-- Submit Confirmation Modal -->
{#if showSubmitConfirmation}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
      <div class="text-center">
        <svg class="w-16 h-16 text-yellow-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.1 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <h3 class="text-xl font-semibold text-slate-900 mb-2">Submit Quiz?</h3>
        <p class="text-slate-600 mb-2">
          You have answered {answeredCount} out of {questions.length} questions.
        </p>
        {#if unansweredCount > 0}
          <p class="text-red-600 text-sm mb-6">
            {unansweredCount} question{unansweredCount > 1 ? 's' : ''} will be marked as unanswered.
          </p>
        {:else}
          <p class="text-emerald-600 text-sm mb-6">
            All questions have been answered.
          </p>
        {/if}
        <div class="flex gap-3 justify-center">
          <button
            on:click={cancelSubmit}
            class="px-6 py-3 text-slate-700 bg-white border-2 border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 font-medium"
          >
            Continue Quiz
          </button>
          <button
            on:click={confirmSubmit}
            class="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all duration-200 font-medium"
          >
            Submit Now
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}