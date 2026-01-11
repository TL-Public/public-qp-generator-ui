<script>
  import ExamDetailsForm from '$lib/components/Forms/ExamDetailsForm.svelte';
  import ExamConfig from '$lib/components/ExamConfig.svelte';
  import DifficultyDistribution from '$lib/components/DifficultyDistribution.svelte';
  import ClassSubjectSelector from '$lib/components/ClassSubjectSelector.svelte';
  import Card from '$lib/components/Cards/Card.svelte';
  import ReviewPage from '$lib/components/ReviewPage.svelte';

  import GeneratePapers from '$lib/components/GeneratePapers.svelte';

  import { api } from '$lib/utils/api';
  import { questionPaperStore } from '$lib/stores/questionPaperStore';

  import VerticalStepper from '$lib/components/VerticalStepper.svelte';
  
  import { onMount, tick } from 'svelte';
  import NestedContentTable from '$lib/components/NestedContentTable.svelte';
  import { mockQuestionsData } from '$lib/utils/mockData.js';
  import { selectedContentStore } from '$lib/stores/selectedContentStore.js';
  import { apiPayloadStore } from '$lib/stores/apiPayLoadStore.js';
  import { page } from '$app/stores';

  // Initialize state variables
  let allQuestions = [];
  
  
  // Exam details state
  let examTitle = '';
  let examMode = 'Online';
  let examClass = '';
  let examMedium = '';
  let examSubject = '';

  // Initialize validation states
  let examDetailsValid = true;
  let classSubjectValid = true;
  let examConfigValid = true;
  let difficultyValid = true;
  let isEdit = true ; 


  
  // Initialize validation errors object
  let validationErrors = {
    questions: null,
    versions: null,
    sets: null
  }

  // caputer the exam id 
  const examId = $page.params.id ; 
  
  // Loading state
  let isLoading = false;
  let loadError = null;

  // Subscribe to API store for debugging
  let apiStoreData = {};
  apiPayloadStore.subscribe(store => {
    apiStoreData = store;
  });

  // Fetch exam data on mount
  onMount(async () => {
    if (!examId) {
      console.error('No exam ID provided');
      loadError = 'No exam ID provided';
      return;
    }

    isLoading = true;
    loadError = null;

    try {
      console.log('Fetching exam data for:', examId);
      
      // Fetch mediums and subjects first to map names to codes
      const [examResponse, mediumsResponse, subjectsResponse] = await Promise.all([
        api.viewPapers.getByCode(examId),
        api.mediums.getAll(),
        api.subjects.getAll()
      ]);

      if (examResponse.error) {
        throw new Error(examResponse.error);
      }

      if (!examResponse.data || !examResponse.data.design) {
        throw new Error('Invalid response: missing design data');
      }

      const design = examResponse.data.design;
      console.log('Fetched exam design:', design);

      // Get mediums and subjects data for mapping
      const mediumsData = mediumsResponse.data?.data || [];
      const subjectsData = subjectsResponse.data?.data || [];
      
      console.log('Mediums data:', mediumsData);
      console.log('Subjects data:', subjectsData);

      // Populate form fields from design data
      examTitle = design.exam_name || '';
      examMode = design.exam_mode ? design.exam_mode.charAt(0).toUpperCase() + design.exam_mode.slice(1) : 'Online';
      examClass = design.standard || '';
      
      // Map medium - try code first, then find code by name
      let mediumCode = design.medium_code || '';
      if (!mediumCode && design.medium) {
        // Find medium code by name
        const foundMedium = mediumsData.find(m => 
          m.medium_name?.toLowerCase() === design.medium?.toLowerCase() ||
          m.medium_name === design.medium
        );
        mediumCode = foundMedium?.medium_code || '';
        console.log('Mapped medium:', { name: design.medium, code: mediumCode });
      }
      examMedium = mediumCode;
      
      // Map subject - try code first, then find code by name
      let subjectCode = design.subject_code || '';
      if (!subjectCode && design.subject) {
        // Find subject code by name, matching also with standard
        const foundSubject = subjectsData.find(s => 
          (s.subject_name?.toLowerCase() === design.subject?.toLowerCase() ||
           s.subject_name === design.subject) &&
          (s.standard === design.standard || !design.standard)
        );
        subjectCode = foundSubject?.subject_code || '';
        console.log('Mapped subject:', { name: design.subject, code: subjectCode, standard: design.standard });
      }
      // Store the mapped codes
      const mappedMediumCode = mediumCode;
      const mappedSubjectCode = subjectCode;
      
      console.log('Mapped values:', {
        examClass,
        mappedMediumCode,
        mappedSubjectCode,
        designMedium: design.medium,
        designMediumCode: design.medium_code,
        designSubject: design.subject,
        designSubjectCode: design.subject_code,
        availableMediums: mediumsData.length,
        availableSubjects: subjectsData.length
      });
      
      // Wait for next tick to ensure ClassSubjectSelector component has mounted
      await tick();
      
      // Wait a bit more for the dropdowns to load their options
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Now set the values - this ensures the dropdowns have their options loaded
      examMedium = mappedMediumCode;
      examSubject = mappedSubjectCode;
      
      console.log('Values set after delay:', {
        examClass,
        examMedium,
        examSubject
      });

      // Populate exam configuration
      totalTime = design.total_time || 40;
      totalQuestions = design.total_questions || design.no_of_qns || 40;
      numberOfSets = design.number_of_sets || design.no_of_sets || 1;
      numberOfVersions = design.number_of_versions || design.no_of_versions || 1;

      // Update API store with fetched data
      apiPayloadStore.updateExamDetails({
        examTitle: examTitle,
        examMode: examMode
      });

      apiPayloadStore.updateExamConfig({
        totalTime: totalTime,
        totalQuestions: totalQuestions,
        numberOfVersions: numberOfVersions,
        numberOfSets: numberOfSets
      });

      apiPayloadStore.updateClassSubject({
        subject_code: examSubject,
        medium_code: examMedium,
        examClass: examClass
      });

      // If there are chapters_topics in the design, update the store
      if (design.chapters_topics && Array.isArray(design.chapters_topics) && design.chapters_topics.length > 0) {
        // The chapters_topics structure should match what the store expects
        apiPayloadStore.update(currentStore => ({
          ...currentStore,
          chapters_topics: design.chapters_topics
        }));
      }

      // Update excluded questions if any
      if (design.qtn_codes_to_exclude && Array.isArray(design.qtn_codes_to_exclude) && design.qtn_codes_to_exclude.length > 0) {
        apiPayloadStore.updateExcludedQuestions(design.qtn_codes_to_exclude);
      }

      console.log('Exam data loaded successfully');
    } catch (error) {
      console.error('Failed to load exam data:', error);
      loadError = error.message || 'Failed to load exam details';
    } finally {
      isLoading = false;
    }
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
  let currentView = 'config';
  let shouldNavigateToReview = false;
  
  // Difficulty distribution
  let easy = 40;
  let medium = 40;
  let hard = 20;


  // Reference for nested content table 
  let nestedContentTableRef  ; 
  
   // Update the back handler in ReviewPage
  function handleBackFromReview() {
    console.log('Handling back from review page');
    
    // Reset to content selection view
    currentView = 'config';
    currentStep = 'allocation';
    
    // Reset the NestedContentTable to content selection
    if (nestedContentTableRef && typeof nestedContentTableRef.resetToContentSelection === 'function') {
      nestedContentTableRef.resetToContentSelection();
    }
    
    // Update hash to content selection
    if (browser) {
      goto('#content-selection', { replaceState: true, noScroll: true });
    }
  }


  // Step tracking
  let completedSteps = {
    examDetails: false,
    examConfig: false,
    difficulty: false,
    classSubject: false,
    allocation: false,
    review: false
  };

  let currentStep = 'examDetails';

  // Reactive statements
  $: {
    completedSteps = {
      examDetails: !!examTitle && !!examMode && examDetailsValid,
      examConfig: examConfigValid,
      difficulty: difficultyValid,
      classSubject: !!examClass && !!examSubject && !!examMedium && classSubjectValid,
      allocation: isAllocationConfirmed,
      review: currentView === 'review'
    };
  }

  // Navigation reactive statement
  $: {
    console.log('🔍 Reactive check:', {
      shouldNavigateToReview,
      isAllocationConfirmed,
      confirmedAllocationData: !!confirmedAllocationData,
      currentView
    });
    
    if (shouldNavigateToReview && isAllocationConfirmed && confirmedAllocationData) {
      console.log('🚀 REACTIVE: Navigating to review page via prop change');
      currentView = 'review';
      currentStep = 'review';
      shouldNavigateToReview = false; // Reset the flag
      console.log('🚀 REACTIVE: Navigation complete, currentView is now:', currentView);
    }
  }

  let isReviewPageEnabled = false;
  $: isReviewPageEnabled = currentView !== 'config';

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
      sets: null
    };

    if (examConfigValid) {
      questionPaperStore.updateExamConfig({
        total_time: totalTime,
        total_questions: totalQuestions,
        no_of_versions: numberOfVersions,
        no_of_sets: numberOfSets
      });
    }
    completedSteps.examConfig = examConfigValid;
    if (examConfigValid) currentStep = 'difficulty';
  }

  
// Simplify - use one handler that checks for the navigateToReview flag
function handleAllocationConfirmed(event) {
  console.log('=== ALLOCATION CONFIRMATION HANDLER ===');
  console.log('Raw event received:', event);
  console.log('Event detail:', event.detail);
  
  if (!event.detail) {
    console.error('No detail in allocation confirmation event');
    alert('Invalid allocation data received. Please try again.');
    return;
  }
  
  const allocationData = event.detail;
  
  // Validate the allocation data structure
  if (!allocationData.selectedItems || !Array.isArray(allocationData.selectedItems)) {
    console.error('Invalid selectedItems in allocation data:', allocationData);
    alert('Invalid allocation data format. Please try again.');
    return;
  }
  
  console.log('Allocation data received:', allocationData);
  console.log('Selected items count:', allocationData.selectedItems.length);
  console.log('Navigate to review flag:', allocationData.navigateToReview);
  
  // Update state
  isAllocationConfirmed = true;
  confirmedAllocationData = allocationData;
  
  // Update API store with allocation data immediately
  apiPayloadStore.updateFromAllocationData(allocationData);
  
  // Also update API store with current exam details to ensure everything is in sync
  apiPayloadStore.updateExamDetails({
    examTitle,
    examMode
  });

  apiPayloadStore.updateExamConfig({
    totalTime,
    totalQuestions,
    numberOfVersions,
    numberOfSets
  });

  apiPayloadStore.updateClassSubject({
    subject_code: examSubject,
    medium_code: examMedium,
    examClass
  });

  // Update excluded questions if any
  if (allQuestions?.length > 0) {
    const excludedQuestions = allQuestions
      .filter(q => q.isRemoved === true)
      .map(q => q.id || q.code)
      .filter(Boolean);
    
    if (excludedQuestions.length > 0) {
      apiPayloadStore.updateExcludedQuestions(excludedQuestions);
    }
  }
  
  // Update the legacy store for backward compatibility
  if (typeof questionPaperStore.updateAllocationData === 'function') {
    questionPaperStore.updateAllocationData(allocationData);
  }
  
  // Check if we should navigate to review
  if (allocationData.navigateToReview === true) {
    console.log('🚀 NAVIGATING TO REVIEW - Setting shouldNavigateToReview = true');
    shouldNavigateToReview = true;
  } else {
    // Move to next step
    currentStep = 'allocation';
  }
  
  console.log('✅ Allocation confirmed and API store updated');
  console.log('   - isAllocationConfirmed:', isAllocationConfirmed);
  console.log('   - confirmedAllocationData:', confirmedAllocationData);
  console.log('   - shouldNavigateToReview:', shouldNavigateToReview);
  
  // Debug the API store state
  const payloadResult = apiPayloadStore.getApiPayload();
  console.log('API Payload after allocation confirmation:', payloadResult);
}

  // ✅ SINGLE: Allocation confirmation with direct review navigation
  function handleAllocationConfirmedAndReview(event) {
    console.log('=== ALLOCATION CONFIRMATION WITH REVIEW HANDLER ===');
    console.log('Raw event received:', event);
    console.log('Event detail:', event.detail);
    
    if (!event.detail) {
      console.error('No detail in allocation confirmation event');
      alert('Invalid allocation data received. Please try again.');
      return;
    }
    
    const allocationData = event.detail;
    
    // Validate the allocation data structure
    if (!allocationData.selectedItems || !Array.isArray(allocationData.selectedItems)) {
      console.error('Invalid selectedItems in allocation data:', allocationData);
      alert('Invalid allocation data format. Please try again.');
      return;
    }
    
    console.log('Allocation data received:', allocationData);
    console.log('Selected items count:', allocationData.selectedItems.length);
    
    // Update state
    isAllocationConfirmed = true;
    confirmedAllocationData = allocationData;
    
    // Update API store with allocation data immediately
    apiPayloadStore.updateFromAllocationData(allocationData);
    
    // Also update API store with current exam details to ensure everything is in sync
    apiPayloadStore.updateExamDetails({
      examTitle,
      examMode
    });

    apiPayloadStore.updateExamConfig({
      totalTime,
      totalQuestions,
      numberOfVersions,
      numberOfSets
    });

    apiPayloadStore.updateClassSubject({
      subject_code: examSubject,
      medium_code: examMedium,
      examClass
    });

    // Update excluded questions if any
    if (allQuestions?.length > 0) {
      const excludedQuestions = allQuestions
        .filter(q => q.isRemoved === true)
        .map(q => q.id || q.code)
        .filter(Boolean);
      
      if (excludedQuestions.length > 0) {
        apiPayloadStore.updateExcludedQuestions(excludedQuestions);
      }
    }
    
    // Update the legacy store for backward compatibility
    if (typeof questionPaperStore.updateAllocationData === 'function') {
      questionPaperStore.updateAllocationData(allocationData);
    }
    
    // Trigger navigation via prop
    shouldNavigateToReview = true;
    
    console.log('✅ Allocation confirmed, navigation flag set to true');
    console.log('   - isAllocationConfirmed:', isAllocationConfirmed);
    console.log('   - shouldNavigateToReview:', shouldNavigateToReview);
    
    // Debug the API store state
    const payloadResult = apiPayloadStore.getApiPayload();
    console.log('API Payload after allocation confirmation:', payloadResult);
  }

  function handleCreatePaper(event) {
    event.preventDefault();
    
    if (!isAllocationConfirmed) {
      alert('Please confirm your question allocation first.');
      return;
    }
    
    // Update API store with all current data
    apiPayloadStore.updateExamDetails({
      examTitle,
      examMode
    });

    apiPayloadStore.updateExamConfig({
      totalTime,
      totalQuestions,
      numberOfVersions,
      numberOfSets
    });

    apiPayloadStore.updateClassSubject({
      subject_code: examSubject,
      medium_code: examMedium,
      examClass
    });

    // Update excluded questions if any
    if (allQuestions?.length > 0) {
      const excludedQuestions = allQuestions
        .filter(q => q.isRemoved === true)
        .map(q => q.id || q.code)
        .filter(Boolean);
      
      if (excludedQuestions.length > 0) {
        apiPayloadStore.updateExcludedQuestions(excludedQuestions);
      }
    }

    if (difficultyValid) {
      console.log('Moving to review view');
      currentView = 'review';
    }
  }

  function handleQuestionsUpdate(event) { 
    allQuestions = event.detail;
    console.log('Updated all questions:', allQuestions);
  }

  function handleExamConfigUpdate(event) {
    totalTime = event.detail.totalTime;
    totalQuestions = event.detail.totalQuestions;
    numberOfSets = event.detail.numberOfSets;
    numberOfVersions = event.detail.numberOfVersions;
  }

  async function handleGeneratePapers() {
    try {
      console.log('=== GENERATE PAPERS WITH API STORE ===');
      
      // Try to update API store one more time before generating
      if (confirmedAllocationData && confirmedAllocationData.selectedItems) {
        console.log('Ensuring API store is updated with allocation data...');
        apiPayloadStore.updateFromAllocationData(confirmedAllocationData);
      }
      
      // Get the API payload from the store
      const payloadResult = apiPayloadStore.getApiPayload();
      
      console.log('API Payload validation result:', payloadResult);
      
      if (!payloadResult.isValid) {
        // Provide more detailed error information
        console.error('API Payload validation failed:');
        console.error('- Errors:', payloadResult.errors);
        console.error('- Current API store state:', apiStoreData);
        console.error('- Confirmed allocation data:', confirmedAllocationData);
        
        throw new Error('Invalid data: ' + payloadResult.errors.join(', '));
      }

      let apiPayload = payloadResult.payload;
      apiPayload = {
        ...apiPayload, 
        status:  2 , 
      } ; 
      console.log('API Payload from store:', apiPayload);


      // Make the API call
      const response = await api.questionPapers.update(examId,apiPayload);

      if (response.error) {
        throw new Error(response.error);
      }

      if (!response.data) {
        throw new Error('No data received from server');
      }

      console.log('Question papers updated successfully:', response.data);
      const responseData = response.data.data  || response.data ; 
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
        exam_type: responseData.exam_type
      },
      questionPapers: responseData.question_papers || [],
      shortfallInfo: responseData.shortfall_info || {},
      chapterTopics: responseData.chapter_topics || [],
      questionsToExclude: responseData.questions_to_exclude || [],
      generatedAt: new Date().toISOString(),
      originalPayload: apiPayload,
      apiResponse: response.data // Store full API response for reference
    };
      // Update the store
      if (typeof questionPaperStore.updateGeneratedPapers === 'function') {
        questionPaperStore.updateGeneratedPapers(generatedPapersData);
      }

      // Navigate to the generate view
      currentView = 'generate';

      // Show success message
      const paperCount = response.data.question_papers?.length || 0;
          // alert(`Successfully generated ${paperCount} question papers for "${responseData.exam_name}"!\n\nExam Code: ${responseData.exam_code}\nSets: ${responseData.number_of_sets}\nVersions: ${responseData.number_of_versions}`);


    } catch (error) {
      console.error('Failed to generate papers:', error);
      
      let errorMessage = 'Failed to generate question papers.\n\n';
      errorMessage += error.message;
      
      // Add suggestion for debugging
      if (error.message.includes('Chapter/topic selections are required')) {
        errorMessage += '\n\nTry clicking "Force API Store Update" button and then try again.';
      }
      
      alert(errorMessage);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    // Add any form submission logic here
    if (examDetailsValid && classSubjectValid && examConfigValid && difficultyValid && isAllocationConfirmed) {
      currentView = 'review';
    } else {
      const errors = [];
      if (!examDetailsValid) errors.push('Exam details are incomplete');
      if (!classSubjectValid) errors.push('Class and subject selection is required');
      if (!examConfigValid) errors.push('Exam configuration is invalid');
      if (!difficultyValid) errors.push('Difficulty distribution must total 100%');
      if (!isAllocationConfirmed) errors.push('Question allocation must be confirmed');
      
      alert(errors.join('\n'));
    }
  }

  function handleSelectionUpdate(event) {
    const { chapter, topic, subtopic, selections } = event.detail;
    console.log('Selection updated:', {
      chapter: chapter?.name,
      topic: topic?.name,
      subtopic: subtopic?.name,
      selections
    });
    
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
    console.log('Selected item for questions:', item, type);

    try {
      // Get mock data based on selection type
      const mockData = mockQuestionsData[type.toLowerCase()];
      
      if (!mockData) {
        throw new Error('Invalid selection type');
      }

      // Process questions from mock data
      const fetchedQuestions = mockData.questions.map(q => ({
        id: q.id,
        text: q.text,
        type: q.type,
        marks: q.marks,
        difficulty: q.difficulty,
        parent: q.parent,
        subject_code: q.subject_code,
        type_codes: q.type_codes,
        isRemoved: false
      }));

      // Update allQuestions with new questions
      allQuestions = [...allQuestions, ...fetchedQuestions];
      
      console.log('Fetched questions:', fetchedQuestions);

    } catch (err) {
      console.error('Error processing questions:', err);
      alert('Failed to load questions: ' + err.message);
    }
  }

  function handleQuestionRemoval(event) {
    const questionId = event.detail;
    allQuestions = allQuestions.map(q => 
      q.id === questionId 
        ? { ...q, isRemoved: !q.isRemoved }
        : q
    );
  }

  function handleExamDetailsSubmit(event) {
    const { examTitle, examMode } = event.detail;
    questionPaperStore.updateExamDetails({ examTitle, examMode });
    if (examDetailsValid) {
      currentStep = 'examConfig';
    }
  }

  function handleExamConfigSubmit(event) {
    const { totalTime, totalQuestions, numberOfVersions, numberOfSets } = event.detail;
    questionPaperStore.updateExamConfig({
      totalTime,
      totalQuestions,
      numberOfVersions,
      numberOfSets
    });

    if (examConfigValid) {
      currentStep = 'difficulty';
    }
  }

  async function handleClassSubjectSelect(event) {
    const { examClass, examSubject, examMedium } = event.detail;
    
    console.log('Updating class/subject with:', {
      subject_code: examSubject,
      medium_code: examMedium,
      examClass
    });

    if (allQuestions.length > 0) {
      currentStep = 'allocation';
    }

    questionPaperStore.updateClassSubject({
      subject_code: examSubject,
      medium_code: examMedium,
      examClass
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
    console.log('=== FORCE API STORE UPDATE ===');
    
    // Update API store with current exam details
    apiPayloadStore.updateExamDetails({
      examTitle,
      examMode
    });

    apiPayloadStore.updateExamConfig({
      totalTime,
      totalQuestions,
      numberOfVersions,
      numberOfSets
    });

    apiPayloadStore.updateClassSubject({
      subject_code: examSubject,
      medium_code: examMedium,
      examClass
    });

    // Update excluded questions if any
    if (allQuestions?.length > 0) {
      const excludedQuestions = allQuestions
        .filter(q => q.isRemoved === true)
        .map(q => q.id || q.code)
        .filter(Boolean);
      
      if (excludedQuestions.length > 0) {
        apiPayloadStore.updateExcludedQuestions(excludedQuestions);
      }
    }

    console.log('API store updated with current data');
  }

  // Debug reactive statements
  $: {
    if (allQuestions.length > 0) {
      console.log('Questions changed:', allQuestions.length);
    }
  }

  $: {
    if (examClass && examSubject && examMedium) {
      console.log('Selection props updated:', { examClass, examSubject, examMedium });
    }
  }

  $: {
    if (classSubjectValid) {
      console.log('Valid class/subject selection:', {
        class: examClass,
        subject: examSubject,
        medium: examMedium
      });
    }
  }

  $: {
    console.log('=== Allocation State Debug ===');
    console.log('Allocation confirmed:', isAllocationConfirmed);
    console.log('Confirmed data:', confirmedAllocationData);
    console.log('Questions array length:', allQuestions?.length);
  }

  $: console.log('Current paper data:', $questionPaperStore);
</script>

<!-- Template remains the same as before -->
<div class="flex min-h-screen bg-white">
  <!-- Stepper -->
  <div class="w-56 flex-shrink-0 p-3 bg-white border-r border-gray-200 sticky top-0 h-screen overflow-y-auto">
    <VerticalStepper
      steps={[
        { id: 'examDetails', label: 'Exam Details', completed: completedSteps.examDetails },
        { id: 'examConfig', label: 'Paper Configuration', completed: completedSteps.examConfig },
        { id: 'difficulty', label: 'Difficulty Distribution', completed: completedSteps.difficulty },
        { id: 'classSubject', label: 'Class & Subject', completed: completedSteps.classSubject },
        { id: 'allocation', label: 'Question Allocation', completed: completedSteps.allocation }, 
        { id: 'review', label: 'Review', completed: completedSteps.review }
      ]}
      {currentStep}
    />
  </div>

  <!-- Main content -->
  <div class="flex-1 mx-auto  w-full max-w-7xl"> 
    <div class="bg-white rounded-lg shadow">
      
      <div class="px-8 py-4 border-b border-gray-200">
        <h1 class="text-2xl font-bold text-gray-900">Edit exam event</h1>
      </div>

      <div class="p-8">
        {#if isLoading}
          <div class="flex items-center justify-center py-12">
            <div class="text-center">
              <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
              <p class="text-gray-600">Loading exam details...</p>
            </div>
          </div>
        {:else if loadError}
          <div class="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800">Error loading exam details</h3>
                <div class="mt-2 text-sm text-red-700">
                  <p>{loadError}</p>
                </div>
              </div>
            </div>
          </div>
        {/if}
        
        {#if currentView === 'config' && !isLoading && !loadError}
          <form on:submit|preventDefault={handleSubmit}>
            <!-- Exam Details -->
            <div class="space-y-6 w-full">
              <ExamDetailsForm 
                bind:examTitle 
                bind:examMode
                bind:isValid={examDetailsValid}
              />
            </div>

            <!-- Exam Config -->
            <div class="space-y-6 mt-8 w-full">
              <Card title="Exam paper configuration" class="w-full">
                <ExamConfig
                  bind:totalTime
                  bind:totalQuestions
                  bind:numberOfSets
                  bind:numberOfVersions
                  on:validate={handleExamConfigValidation}
                />
              </Card>
            </div>

            <!-- Difficulty Distribution -->
            <div class="space-y-6 mt-8 w-full">
              <Card title="Define Difficulty Level Distribution" class="w-full">
                <DifficultyDistribution
                  bind:easy
                  bind:medium
                  bind:hard
                  bind:isValid={difficultyValid}
                  isReviewPageEnabled={false}
                />
              </Card>
            </div>

            <!-- Class & Subject Selection -->
            <div class="space-y-6 mt-8">
              <ClassSubjectSelector 
                bind:examClass
                bind:examMedium
                bind:examSubject
                bind:isValid={classSubjectValid}
                on:change={handleClassSubjectSelect}
              />
            </div>

            <!-- Content Selection & Allocation -->
            {#if examClass && examSubject && examMedium}
              <div class="space-y-6 mt-8 w-full">
                <Card title="Content Selection & Question Allocation">
                  <NestedContentTable
                  bind:this={nestedContentTableRef}
                    {examClass}
                    {examSubject}
                    {examMedium}
                    {totalQuestions}
                    {examTitle}
                    bind:examMode
                    bind:totalTime
                    bind:numberOfVersions
                    bind:numberOfSets
                    navigateToReview={shouldNavigateToReview}
                    on:select={handleQuestionSelect}
                    on:fetchQuestions={handleFetchQuestions}
                    on:allocationConfirmed={(e) => { 
                      console.log('Main page recieved allocation confirmed event',e.detail);
                      handleAllocationConfirmed(e) ;                       
                    }}
                    
                  />
                </Card>
              </div>
            {/if}

            <!-- Action buttons -->
            <div class="flex justify-between mt-8 pt-6 border-t w-full px-4">
              <button 
                type="button"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                on:click={handleReset}
              >
                Reset
              </button>
            </div>
          </form>
          
        {:else if currentView === 'review'}
          <div class="w-full">
            <ReviewPage 
              {examTitle}
              {examMode}
              {examClass}
              {examMedium}
              {examSubject}
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
              on:back={() => currentView = 'config'}
              on:generate={handleGeneratePapers}
            />
          </div>
          
        {:else if currentView === 'generate'}
          <div class="w-full">
            <GeneratePapers
              {isEdit}
              {examTitle}
              {examClass}
              {examMedium}
              {examSubject}
              {numberOfSets}
              {numberOfVersions}
              questions={allQuestions}
              allocationData={confirmedAllocationData}
            />
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

