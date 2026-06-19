<script>
  import { createEventDispatcher } from 'svelte';
  import { quizStore } from '$lib/stores/quizStore.js';
  import { decodeHTMLEntities, cleanQuestionText } from '$lib/utils/textUtils.js';
  import QuestionRemarks from '$lib/components/quiz/QuestionRemarks.svelte';

  const dispatch = createEventDispatcher();

  export let quizResults = null;
  export let quiz = null;
  export let config = {};

  // Calculated results
  let calculatedResults = null;
  let questions = [];
  let detailedResults = [];
  
  // Display options
  let showCorrectAnswersOnly = false;
  let showIncorrectAnswersOnly = false;
  let showUnansweredOnly = false;
  let selectedQuestionIndex = null;
  let showExplanations = true;

  // Initialize results when component loads
  $: if (quizResults && quiz) {
    processResults();
  }

  function processResults() {
    
    // Clean the quiz data before processing
    const cleanedQuiz = {
      ...quiz,
      metadata: {
        ...quiz.metadata,
        exam_name: decodeHTMLEntities(quiz.metadata?.exam_name || 'Quiz'),
        subject_name: decodeHTMLEntities(quiz.metadata?.subject_name || ''),
        standard_name: decodeHTMLEntities(quiz.metadata?.standard_name || '')
      },
      questions: quiz.questions?.map(question => {
        // Clean the question using textUtils
        const cleanedQuestion = cleanQuestionText(question);
        
        // Clean options
        if (cleanedQuestion.options && Array.isArray(cleanedQuestion.options)) {
          cleanedQuestion.options = cleanedQuestion.options.map(option => ({
            ...option,
            text: decodeHTMLEntities(option.text || option.option_text || ''),
            description: option.description ? decodeHTMLEntities(option.description) : ''
          }));
        }
        
        // Clean other fields
        if (cleanedQuestion.explanation) {
          cleanedQuestion.explanation = decodeHTMLEntities(cleanedQuestion.explanation);
        }
        
        if (cleanedQuestion.chapter) {
          cleanedQuestion.chapter = decodeHTMLEntities(cleanedQuestion.chapter);
        }
        
        if (cleanedQuestion.topic) {
          cleanedQuestion.topic = decodeHTMLEntities(cleanedQuestion.topic);
        }

        return cleanedQuestion;
      }) || []
    };

   
    
    // Calculate detailed results using the cleaned quiz data
    calculatedResults = quizStore.calculateResults(cleanedQuiz, quizResults.session);
    questions = cleanedQuiz.questions || [];
    
    
    // Create detailed results for each question
    detailedResults = questions.map((question, index) => {
      const userAnswer = quizResults.session.answers[question.id];
      
      // Find correct option using both is_correct flag and correct_answer field
      let correctOption = question.options?.find(opt => opt.is_correct);
      if (!correctOption && question.correct_answer) {
        correctOption = question.options?.find(opt => opt.id === question.correct_answer);
      }
      
      const selectedOption = question.options?.find(opt => opt.id === userAnswer);
      const isCorrect = userAnswer === (question.correct_answer || correctOption?.id);
      const isAttempted = userAnswer !== undefined && userAnswer !== null;

     

      // Get remarks for this question
      const questionRemark = quizResults.session.remarks?.[question.id];

      return {
        questionNumber: index + 1,
        question: {
          ...question,
          // Ensure text is clean for display
          text: decodeHTMLEntities(question.text || ''),
          chapter: question.chapter ? decodeHTMLEntities(question.chapter) : '',
          topic: question.topic ? decodeHTMLEntities(question.topic) : '',
          explanation: question.explanation ? decodeHTMLEntities(question.explanation) : '',
          options: question.options?.map(opt => ({
            ...opt,
            text: decodeHTMLEntities(opt.text || '')
          })) || []
        },
        userAnswer,
        selectedOption: selectedOption ? {
          ...selectedOption,
          text: decodeHTMLEntities(selectedOption.text || '')
        } : null,
        correctOption: correctOption ? {
          ...correctOption,
          text: decodeHTMLEntities(correctOption.text || '')
        } : null,
        isCorrect,
        isAttempted,
        status: isAttempted ? (isCorrect ? 'correct' : 'incorrect') : 'unanswered',
        remark: questionRemark || null
      };
    });

   
  }

  function getOptionLabel(index) {
    return String.fromCharCode(65 + index); // A, B, C, D
  }

  function formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  }

  function formatDate(date) {
    return new Date(date).toLocaleString();
  }

  function toggleQuestionDetails(index) {
    selectedQuestionIndex = selectedQuestionIndex === index ? null : index;
  }

  function getFilteredResults() {
    let filtered = detailedResults;

    if (showCorrectAnswersOnly) {
      filtered = filtered.filter(result => result.status === 'correct');
    } else if (showIncorrectAnswersOnly) {
      filtered = filtered.filter(result => result.status === 'incorrect');
    } else if (showUnansweredOnly) {
      filtered = filtered.filter(result => result.status === 'unanswered');
    }

    return filtered;
  }

  function handleRestart() {
    dispatch('restart');
  }

  function handleBackToSetup() {
    dispatch('back');
  }

  function downloadResults() {
    // Create a downloadable report with cleaned text
    const reportData = {
      quizName: decodeHTMLEntities(quiz?.metadata?.exam_name || 'Quiz'),
      completedAt: formatDate(calculatedResults.completedAt),
      results: calculatedResults,
      remarks: quizResults.session.remarks || {},
      questions: detailedResults.map(result => ({
        questionNumber: result.questionNumber,
        questionText: result.question.text,
        userAnswer: result.selectedOption?.text || 'Not answered',
        correctAnswer: result.correctOption?.text || '',
        isCorrect: result.isCorrect,
        status: result.status,
        explanation: result.question.explanation || '',
        chapter: result.question.chapter || '',
        topic: result.question.topic || '',
        remark: result.remark?.text || ''
      }))
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `quiz-results-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  function printResults() {
    window.print();
  }

  // Clear all filters
  function clearFilters() {
    showCorrectAnswersOnly = false;
    showIncorrectAnswersOnly = false;
    showUnansweredOnly = false;
  }

  // Helper function to safely display text
  function safeDisplayText(text, maxLength = null) {
    if (!text) return '';
    const cleaned = decodeHTMLEntities(text);
    return maxLength ? (cleaned.length > maxLength ? cleaned.substring(0, maxLength) + '...' : cleaned) : cleaned;
  }

  // Reactive statements
  $: filteredResults = getFilteredResults();
  $: hasFilters = showCorrectAnswersOnly || showIncorrectAnswersOnly || showUnansweredOnly;
</script>

<div class="min-h-screen bg-gray-50 py-8">
  <div class="max-w-6xl mx-auto px-4">
    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-lg font-bold text-gray-700 mb-2">Quiz Results</h1>
      <p class="text-gray-600 text-sm ">{safeDisplayText(quiz?.metadata?.exam_name || 'Quiz')}</p>
      <p class="text-sm text-gray-500">Completed on {formatDate(calculatedResults?.completedAt)}</p>
    </div>

    {#if calculatedResults}
      <!-- Score Overview -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <!-- Score Display -->
        <!-- <div class="text-center mb-6">
          <div class="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-4xl font-bold mb-4">
            {calculatedResults.percentage}%
          </div>
          <h2 class="text-2xl font-bold text-gray-900">
            {calculatedResults.correct} out of {calculatedResults.totalQuestions}
          </h2>
          <p class="text-gray-600">
            {calculatedResults.passed ? 'Passed' : 'Failed'} • 
            {calculatedResults.attempted} attempted • 
            {calculatedResults.unanswered} unanswered
          </p>
        </div> -->

        <!-- Detailed Stats -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center p-4 bg-blue-50 rounded-lg">
            <div class="text-xl font-bold text-blue-600">{calculatedResults.totalQuestions}</div>
            <div class="text-sm text-blue-700">Total Questions</div>
          </div>
          <div class="text-center p-4 bg-green-50 rounded-lg">
            <div class="text-xl font-bold text-green-600">{calculatedResults.correct}</div>
            <div class="text-sm text-green-700">Correct</div>
          </div>
          <div class="text-center p-4 bg-red-50 rounded-lg">
            <div class="text-xl font-bold text-red-600">{calculatedResults.incorrect}</div>
            <div class="text-sm text-red-700">Incorrect</div>
          </div>
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <div class="text-xl font-bold text-gray-600">{calculatedResults.unanswered}</div>
            <div class="text-sm text-gray-700">Unanswered</div>
          </div>
        </div> 
      </div>

      <!-- Questions List -->
      <div class="space-y-4 mb-8">
        {#each filteredResults as result, index}
          <div class="bg-white rounded-lg shadow-sm border border-gray-200">
            <!-- Question Header -->
            <div 
              class="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              on:click={() => toggleQuestionDetails(result.questionNumber - 1)}
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                  <!-- Status Icon -->
                  <div class="flex-shrink-0">
                    {#if result.status === 'correct'}
                      <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    {:else if result.status === 'incorrect'}
                      <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    {:else}
                      <div class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    {/if}
                  </div>

                  <!-- Question Info -->
                  <div class="flex-1 min-w-0">
                    <h4 class="text-sm font-medium text-gray-900">
                      Question {result.questionNumber}
                    </h4>
                    <p class="text-sm text-gray-600 truncate">
                      {safeDisplayText(result.question.text, 100)}
                    </p>
                  </div>

                  <!-- Status Badge -->
                  <div class="flex-shrink-0">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      {result.status === 'correct' ? 'bg-green-100 text-green-800' :
                        result.status === 'incorrect' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'}">
                      {result.status === 'correct' ? 'Correct' :
                        result.status === 'incorrect' ? 'Incorrect' :
                        'Unanswered'}
                    </span>
                  </div>
                </div>

                <!-- Expand Arrow -->
                <div class="ml-4">
                  <svg 
                    class="w-5 h-5 text-gray-400 transform transition-transform 
                      {selectedQuestionIndex === result.questionNumber - 1 ? 'rotate-180' : ''}"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <!-- Question Details (Expandable) -->
            {#if selectedQuestionIndex === result.questionNumber - 1}
              <div class="border-t border-gray-200 p-6">
                <!-- Question Text -->
                <div class="mb-6">
                  <h5 class="text-lg font-medium text-gray-900 mb-2">
                    {safeDisplayText(result.question.text)}
                  </h5>
                  {#if result.question.chapter || result.question.topic}
                    <div class="flex items-center space-x-4 text-sm text-gray-500">
                      {#if result.question.chapter}
                        <span>📚 {safeDisplayText(result.question.chapter)}</span>
                      {/if}
                      {#if result.question.topic}
                        <span>📝 {safeDisplayText(result.question.topic)}</span>
                      {/if}
                      <span class="capitalize">{result.question.difficulty}</span>
                    </div>
                  {/if}
                </div>

                <!-- Options -->
                <div class="space-y-3 mb-6">
                  {#each result.question.options as option, optIndex}
                    <div class="flex items-center p-3 rounded-lg border-2 transition-colors
                      {option.is_correct ? 'border-green-300 bg-green-50' :
                        result.selectedOption?.id === option.id && !option.is_correct ? 'border-red-300 bg-red-50' :
                        'border-gray-200 bg-white'}">
                      
                      <div class="flex items-center space-x-3 w-full">
                        <!-- Option Indicator -->
                        <div class="w-6 h-6 border-2 rounded-full flex items-center justify-center
                          {option.is_correct ? 'border-green-500 bg-green-500' :
                            result.selectedOption?.id === option.id ? 'border-red-500 bg-red-500' :
                            'border-gray-300'}">
                          {#if option.is_correct}
                            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                            </svg>
                          {:else if result.selectedOption?.id === option.id}
                            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          {/if}
                        </div>
                        
                        <!-- Option Label and Text -->
                        <span class="font-medium text-gray-600 min-w-0">
                          {getOptionLabel(optIndex)}.
                        </span>
                        <span class="flex-1 text-gray-900">
                          {safeDisplayText(option.text)}
                        </span>

                        <!-- Status Labels -->
                        <div class="flex space-x-2">
                          {#if option.is_correct}
                            <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              Correct Answer
                            </span>
                          {/if}
                          {#if result.selectedOption?.id === option.id}
                            <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              Your Answer
                            </span>
                          {/if}
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>

                <!-- Answer Summary -->
                <div class="bg-gray-50 rounded-lg p-4 mb-4">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span class="font-medium text-gray-700">Your Answer:</span>
                      <span class="ml-2 {result.isCorrect ? 'text-green-600' : result.isAttempted ? 'text-red-600' : 'text-gray-600'}">
                        {result.isAttempted ? `${getOptionLabel(result.question.options.findIndex(opt => opt.id === result.userAnswer))} - ${safeDisplayText(result.selectedOption?.text)}` : 'Not answered'}
                      </span>
                    </div>
                    <div>
                      <span class="font-medium text-gray-700">Correct Answer:</span>
                      <span class="ml-2 text-green-600">
                        {getOptionLabel(result.question.options.findIndex(opt => opt.is_correct))} - {safeDisplayText(result.correctOption?.text)}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Explanation -->
                {#if showExplanations && result.question.explanation}
                  <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h6 class="font-medium text-blue-900 mb-2">💡 Explanation</h6>
                    <p class="text-blue-800 text-sm leading-relaxed">
                      {safeDisplayText(result.question.explanation)}
                    </p>
                  </div>
                {/if}

                <!-- Teacher Remarks -->
                {#if result.remark}
                  <div class="remarks-display-section">
                    <QuestionRemarks
                      questionId={result.question.id}
                      remarks={result.remark.text || ''}
                      readonly={true}
                    />
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        {/each}

        <!-- No Results Message -->
        {#if filteredResults.length === 0}
          <div class="text-center py-8 bg-white rounded-lg border border-gray-200">
            <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No Questions Found</h3>
            <p class="text-gray-600">No questions match the current filter criteria.</p>
            <button
              on:click={clearFilters}
              class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Clear Filters
            </button>
          </div>
        {/if}
      </div>

      <!-- Action Buttons -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex flex-wrap gap-3">
            <button
              on:click={handleRestart}
              class="primary-btn"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Take Another Quiz
            </button>
            
            <button
              on:click={handleBackToSetup}
              class="secondary-btn"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Setup
            </button>
          </div>

          <div class="flex flex-wrap gap-3">
            <button
              on:click={downloadResults}
              class="secondary-btn"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Report
            </button>
            
            <button
              on:click={printResults}
              class="secondary-btn"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Results
            </button>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  @media print {
    .no-print {
      display: none !important;
    }
    
    body {
      font-size: 12px;
    }
    
    .page-break {
      page-break-before: always;
    }
  }

  .score-circle {
    animation: score-reveal 2s ease-out;
  }

  @keyframes score-reveal {
    from {
      stroke-dasharray: 0 339.292;
    }
    to {
      stroke-dasharray: var(--score-dash) 339.292;
    }
  }

  .question-expand {
    animation: expand 0.3s ease-out;
  }

  @keyframes expand {
    from {
      opacity: 0;
      max-height: 0;
    }
    to {
      opacity: 1;
      max-height: 1000px;
    }
  }

  .remarks-display-section {
    margin-top: 1rem;
  }
</style>