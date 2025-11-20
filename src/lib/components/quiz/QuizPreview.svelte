<script>
  import { createEventDispatcher } from 'svelte';
  import api from '$lib/utils/api.js';
  import ChapterTopicTable from './ChapterTopicTable.svelte';
  
  const dispatch = createEventDispatcher();

  export let quizConfig = {};
  export let loading = false;

  // Generated quiz data
  let quizPaperResponse = null;
  let generateError = '';
  let generating = false;

  // Preview state
  let showDetails = false;

  // Auto-generate quiz when component loads
  import { onMount } from 'svelte';
  
  onMount(() => {
    // Don't auto-generate on mount, only when user clicks Start Quiz
    console.log('QuizPreview loaded with config:', quizConfig);
  });

  // Function to separate chapter and topic codes
  function separateChapterAndTopicCodes(selectedCodes, chaptersTopicsData) {
    const chapters = [];
    const topics = [];
    
    console.log('Input data for separation:', { selectedCodes, chaptersTopicsData });
    
    if (!chaptersTopicsData || !Array.isArray(chaptersTopicsData)) {
      console.warn('chaptersTopicsData is not available or not an array');
      return { chapters, topics };
    }
    
    // Create lookup maps for faster searching
    const chapterCodeMap = new Map();
    const topicCodeMap = new Map();
    
    chaptersTopicsData.forEach(chapter => {
      const chapterCode = chapter.code || chapter.chapter_code;
      if (chapterCode) {
        chapterCodeMap.set(chapterCode, chapter);
        console.log('Added chapter to map:', chapterCode);
      }
      
      if (chapter.topics && Array.isArray(chapter.topics)) {
        chapter.topics.forEach(topic => {
          const topicCode = topic.code || topic.topic_code;
          if (topicCode) {
            topicCodeMap.set(topicCode, topic);
            console.log('Added topic to map:', topicCode);
          }
        });
      }
    });
    
    console.log('Chapter codes available:', Array.from(chapterCodeMap.keys()));
    console.log('Topic codes available:', Array.from(topicCodeMap.keys()));
    
    // Separate the selected codes
    selectedCodes.forEach(code => {
      if (chapterCodeMap.has(code)) {
        chapters.push(code);
        console.log('Found chapter:', code);
      } else if (topicCodeMap.has(code)) {
        topics.push(code);
        console.log('Found topic:', code);
      } else {
        console.warn('Code not found in chapters or topics:', code);
      }
    });
    
    return { chapters, topics };
  }

  async function createQuizPaper() {
    generating = true;
    generateError = '';
    quizPaperResponse = null;
    
    try {
      console.log('Creating quiz paper with config:', quizConfig);
      
      // Check if we have the required data
      if (!quizConfig.chaptersTopicsData) {
        throw new Error('Chapters/Topics data is missing. Please go back and reselect your options.');
      }
      
      // Separate chapter and topic codes
      const { chapters, topics } = separateChapterAndTopicCodes(
        quizConfig.selected_codes || [], 
        quizConfig.chaptersTopicsData || []
      );
      
      console.log('Separated codes:', { chapters, topics });
      
      // Build chapters_topics array
      const chaptersTopicsArray = [];
      
      // Add chapters if any are selected
      if (chapters.length > 0) {
        chaptersTopicsArray.push({
          type: "chapter",
          codes: chapters.map(code => ({
            code: code
            // No qn_count needed since is_ai_selected = true
          }))
        });
      }
      
      // Add topics if any are selected
      if (topics.length > 0) {
        chaptersTopicsArray.push({
          type: "topic",
          codes: topics.map(code => ({
            code: code
            // No qn_count needed since is_ai_selected = true
          }))
        });
      }
      
      // Ensure we have at least one selection
      if (chaptersTopicsArray.length === 0) {
        throw new Error('No chapters or topics selected. Please go back and select some chapters or topics.');
      }
      
      // Prepare the request payload for question paper creation
      const questionPaperPayload = {
        status: 2, // Finalized
        is_ai_selected: true, // AI will select questions automatically
        exam_name: quizConfig.exam_name,
        exam_type_code: "1000",
        subject_code: quizConfig.subject_code,
        medium_code: quizConfig.medium_code,
        exam_mode: 'online', // Fixed for quiz mode
        total_time: quizConfig.total_time || 15,
        total_questions: quizConfig.total_questions || 5,
        no_of_versions: 1, // Fixed for quiz mode
        no_of_sets: 1, // Fixed for quiz mode
        standard: quizConfig.standard,
        chapters_topics: chaptersTopicsArray
      };
      
      console.log('Question paper creation payload:', questionPaperPayload);

      // Call the question papers API to create the quiz
      const response = await api.questionPapers.create(questionPaperPayload);
      
      console.log('Question Paper API Response:', response);
      
      if (response.error) {
        throw new Error(response.error);
      }

      // Store the response for later use
      quizPaperResponse = response.data.data;

      console.log('Quiz paper created successfully:', quizPaperResponse);

    } catch (error) {
      console.error('Error creating quiz paper:', error);
      generateError = error.message || 'Failed to create quiz paper';
      quizPaperResponse = null;
    } finally {
      generating = false;
    }
  }

  function handleBack() {
    dispatch('back');
  }

  function handleStartQuiz() {
    if (!quizPaperResponse) {
      // Create the quiz paper first
      createQuizPaper().then(() => {
        if (quizPaperResponse && !generateError) {
          startQuizWithData();
        }
      });
    } else {
      // Paper already created, just start the quiz
      startQuizWithData();
    }
  }

  function startQuizWithData() {
    if (!quizPaperResponse || !quizPaperResponse.question_papers || quizPaperResponse.question_papers.length === 0) {
      generateError = 'No question papers found in response';
      return;
    }

    const questionPaper = quizPaperResponse.question_papers[0];
    const questions = questionPaper.qns;

    if (!questions || questions.length === 0) {
      generateError = 'No questions found in question paper';
      return;
    }

    // Format the quiz data for QuizRunner
    const quizData = {
      metadata: {
        exam_name: quizPaperResponse.exam_name,
        exam_code: quizPaperResponse.exam_code,
        paper_code: questionPaper.id,
        total_questions: questions.length,
        total_time: quizConfig.total_time || 15,
        subject: quizPaperResponse.subject,
        medium: quizPaperResponse.medium,
        exam_type: quizPaperResponse.exam_type,
        status: quizPaperResponse.status
      },
      questions: questions.map((question, index) => ({
        id: question.id,
        question_number: index + 1,
        text: question.text,
        options: question.options,
        correct_answer: question.options.find(opt => opt.is_correct)?.id || null,
        difficulty: question.difficulty || 'Medium',
        chapter: question.chapter || '',
        topic: question.topic || '',
        marks: 1,
        explanation: question.explanation || '',
        originalQuestion: question
      })),
      config: {
        exam_code: quizPaperResponse.exam_code,
        paper_code: questionPaper.id,
        total_time: quizConfig.total_time || 15,
        total_questions: questions.length
      }
    };

    console.log('Starting quiz with formatted data:', quizData);

    // Store exam code for reference
    localStorage.setItem('currentExamCode', quizPaperResponse.exam_code);
    localStorage.setItem('currentQuizData', JSON.stringify(quizData));

    // Dispatch to parent with formatted quiz data
    dispatch('start', {
      quiz: quizData,
      config: quizData.config,
      originalResponse: quizPaperResponse
    });
  }

  function toggleDetails() {
    showDetails = !showDetails;
  }

  // Helper function to format time
  function formatTime(minutes) {
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  // Helper function to get chapter/topic count
  function getSelectionCount() {
    return quizConfig.selected_codes?.length || 0;
  }

  // Get questions from the response for preview
  function getQuestionsFromResponse() {
    if (quizPaperResponse && quizPaperResponse.question_papers && quizPaperResponse.question_papers[0]) {
      return quizPaperResponse.question_papers[0].qns || [];
    }
    return [];
  }
</script>

<!-- The template remains mostly the same, just update the Type display -->
<div class="p-6">
  <div class="mb-6">
    <h2 class="text-2xl font-semibold text-gray-900 mb-2">Quiz Preview</h2>
    <p class="text-gray-600">Review your quiz configuration before starting.</p>
  </div>

  <!-- Quiz Configuration Summary -->
  <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
    <h3 class="text-lg font-medium text-blue-900 mb-3">Quiz Configuration</h3>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
      <div>
        <span class="font-medium text-blue-800">Class:</span>
        <span class="text-blue-700 ml-1">{quizConfig.standard}</span>
      </div>
      <div>
        <span class="font-medium text-blue-800">Subject:</span>
        <span class="text-blue-700 ml-1">{quizConfig.subject_code}</span>
      </div>
      <div>
        <span class="font-medium text-blue-800">Medium:</span>
        <span class="text-blue-700 ml-1">{quizConfig.medium_code}</span>
      </div>
      <!-- <div>
        <span class="font-medium text-blue-800">Type:</span>
        <span class="text-blue-700 ml-1">Mixed Selection</span>
      </div> -->
      <!-- <div>
        <span class="font-medium text-blue-800">Questions:</span>
        <span class="text-blue-700 ml-1">{quizConfig.total_questions}</span>
      </div> -->
      <div>
        <span class="font-medium text-blue-800">Time:</span>
        <span class="text-blue-700 ml-1">{formatTime(quizConfig.total_time)}</span>
      </div>
      <div>
        <span class="font-medium text-blue-800">Selected:</span>
        <span class="text-blue-700 ml-1">{getSelectionCount()} items</span>
      </div>
      <div>
        <span class="font-medium text-blue-800">Quiz Name:</span>
        <span class="text-blue-700 ml-1 truncate" title={quizConfig.exam_name}>{quizConfig.exam_name}</span>
      </div>
    </div>
    
    <!-- Additional quiz info -->
    <div class="mt-3 pt-3 border-t border-blue-200">
      <div class="flex items-center justify-between">
        <div class="text-sm text-blue-700">
          <span class="font-medium">Mode:</span> Online Quiz | 
          <span class="font-medium">Sets:</span> 1 | 
          <span class="font-medium">Versions:</span> 1 |
          <span class="font-medium">AI Selected:</span> Yes
        </div>
        <button
          on:click={toggleDetails}
          class="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          {showDetails ? 'Hide' : 'Show'} Selection Details
        </button>
      </div>
    </div>
  </div>

  <!-- Chapter/Topic Selection Details -->
  {#if showDetails}
    <div class="mb-6">
      <ChapterTopicTable 
        {quizConfig}
        title="Selected Chapters and Topics"
      />
    </div>
  {/if}

  <!-- Generation Status -->
  {#if generating}
    <div class="bg-white border border-gray-200 rounded-lg p-8 mb-6">
      <div class="flex items-center justify-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
        <div>
          <h3 class="text-lg font-medium text-gray-900">Creating Quiz Paper</h3>
          <p class="text-gray-600">Please wait while we generate your quiz...</p>
        </div>
      </div>
    </div>
  {:else if generateError}
    <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <div class="flex items-center">
        <svg class="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M6 18h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <div class="flex-1">
          <h3 class="text-sm font-medium text-red-800">Quiz Creation Error</h3>
          <p class="text-sm text-red-700 mt-1">{generateError}</p>
        </div>
        <button
          on:click={createQuizPaper}
          class="ml-4 px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200"
        >
          Retry
        </button>
      </div>
    </div>
  {:else if quizPaperResponse}
    <!-- Quiz Paper Created Successfully -->
    <div class="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
      <div class="flex items-center mb-4">
        <svg class="w-6 h-6 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <h3 class="text-lg font-medium text-green-800">Quiz Paper Ready!</h3>
          <p class="text-sm text-green-700 mt-1">Your quiz has been generated successfully with {getQuestionsFromResponse().length} questions.</p>
        </div>
      </div>

      <!-- Quiz Details -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div class="bg-white rounded-lg p-4 border border-green-200">
          <div class="text-center">
            <div class="text-2xl font-bold text-green-600 mb-1">
              {quizPaperResponse.exam_code}
            </div>
            <div class="text-sm text-green-700">Exam Code</div>
          </div>
        </div>
        <div class="bg-white rounded-lg p-4 border border-green-200">
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600 mb-1">
              {getQuestionsFromResponse().length}
            </div>
            <div class="text-sm text-blue-700">Questions</div>
          </div>
        </div>
        <div class="bg-white rounded-lg p-4 border border-green-200">
          <div class="text-center">
            <div class="text-2xl font-bold text-purple-600 mb-1 capitalize">
              {quizPaperResponse.status}
            </div>
            <div class="text-sm text-purple-700">Status</div>
          </div>
        </div>
      </div>

      <!-- Questions Preview -->
      {#if getQuestionsFromResponse().length > 0}
        <div class="mt-4 p-4 bg-white rounded-lg border border-green-200">
          <h4 class="font-medium text-gray-900 mb-3">Questions Preview:</h4>
          <div class="space-y-3">
            {#each getQuestionsFromResponse().slice(0, 2) as question, index}
              <div class="p-3 border border-gray-200 rounded-md">
                <div class="font-medium text-gray-900 text-sm mb-2">
                  {index + 1}. {question.text}
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600">
                  {#each question.options as option, optIndex}
                    <div class="flex items-center space-x-1">
                      <span class="font-medium">{String.fromCharCode(65 + optIndex)}.</span>
                      <span class="truncate">{option.text}</span>
                      {#if option.is_correct}
                        <span class="text-green-600 text-xs ml-1">(✓)</span>
                      {/if}
                    </div>
                  {/each}
                </div>
              </div>
            {/each}
            {#if getQuestionsFromResponse().length > 2}
              <p class="text-center text-sm text-gray-500">
                ... and {getQuestionsFromResponse().length - 2} more questions
              </p>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  {:else}
    <!-- 23 -->
   
  {/if}

  <!-- Action Buttons -->
  <div class="flex justify-between items-center pt-6 border-t border-gray-200 mt-8">
    <button
      on:click={handleBack}
      class="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
    >
      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      Back to Setup
    </button>

    <div class="flex space-x-3">
      {#if quizPaperResponse}
        <button
          on:click={createQuizPaper}
          disabled={generating}
          class="px-6 py-2 text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 disabled:opacity-50"
        >
          {#if generating}
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2 inline-block"></div>
          {/if}
          Regenerate Quiz
        </button>
      {/if}
      
     <button
  on:click={handleStartQuiz}
  disabled={generating || loading}
  class="px-8 py-3 bg-green-600 text-white text-lg font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
>
  {#if generating}
    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
    Creating Quiz...
  {:else if quizPaperResponse}
    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    Start Quiz
  {:else}
    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
    </svg>
    Create & Start Quiz
  {/if}
</button>
    </div>
  </div>
</div>

<style>
  /* Custom styles for the quiz preview */
  .config-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .stat-card {
    transition: transform 0.2s ease-in-out;
  }

  .stat-card:hover {
    transform: translateY(-2px);
  }
</style>