import { get } from 'svelte/store';
import { selectedContentStore } from '$lib/stores/selectedContentStore.js';
import { apiPayloadStore } from '$lib/stores/apiPayLoadStore.js';
import { questionPaperStore } from '$lib/stores/questionPaperStore';
import { mockQuestionsData } from '$lib/utils/mockData.js';
import { api } from '$lib/utils/api';

export function createExamEventHandlers(examState) {
  const {
    examTitle, examMode, examClass, examMedium, examSubject,
    totalTime, totalQuestions, numberOfSets, numberOfVersions,
    easy, medium, hard,
    examDetailsValid, classSubjectValid, examConfigValid, difficultyValid,
    currentView, currentStep, isAllocationConfirmed, confirmedAllocationData,
    shouldNavigateToReview, allQuestions, fetchedQuestions, validationErrors
  } = examState;

  function handleReset() {
    allQuestions.set([]);
    isAllocationConfirmed.set(false);
    confirmedAllocationData.set(null);
    selectedContentStore.clearAll();
  }

  function handleDelete() {
    allQuestions.set([]);
    isAllocationConfirmed.set(false);
    confirmedAllocationData.set(null);
  }

  function handleExamConfigValidation(event) {
    examConfigValid.set(event.detail.isValid);
    validationErrors.set(event.detail.errors || {
      questions: null,
      versions: null,
      sets: null
    });

    if (get(examConfigValid)) {
      questionPaperStore.updateExamConfig({
        total_time: get(totalTime),
        total_questions: get(totalQuestions),
        no_of_versions: get(numberOfVersions),
        no_of_sets: get(numberOfSets)
      });
      currentStep.set('difficulty');
    }
  }

  function handleAllocationConfirmed(event) {
  
    if (!event.detail) {
      console.error('No detail in allocation confirmation event');
      alert('Invalid allocation data received. Please try again.');
      return;
    }
    
    const allocationData = event.detail;
    
    if (!allocationData.selectedItems || !Array.isArray(allocationData.selectedItems)) {
      console.error('Invalid selectedItems in allocation data:', allocationData);
      alert('Invalid allocation data format. Please try again.');
      return;
    }
    
  
    
    // Update state
    isAllocationConfirmed.set(true);
    confirmedAllocationData.set(allocationData);
    
    // Update API store with allocation data
    apiPayloadStore.updateFromAllocationData(allocationData);
    
    // Update API store with current exam details
    apiPayloadStore.updateExamDetails({
      examTitle: get(examTitle),
      examMode: get(examMode)
    });

    apiPayloadStore.updateExamConfig({
      totalTime: get(totalTime),
      totalQuestions: get(totalQuestions),
      numberOfVersions: get(numberOfVersions),
      numberOfSets: get(numberOfSets)
    });

    apiPayloadStore.updateClassSubject({
      subject_code: get(examSubject),
      medium_code: get(examMedium),
      examClass: get(examClass)
    });

    // Update excluded questions if any
    const currentQuestions = get(allQuestions);
    if (currentQuestions?.length > 0) {
      const excludedQuestions = currentQuestions
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
      shouldNavigateToReview.set(true);
    } else {
      currentStep.set('allocation');
    }
    
  }

  async function handleClassSubjectSelect(event) {
    const { examClass: newClass, examSubject: newSubject, examMedium: newMedium } = event.detail;
    
    

    if (get(allQuestions).length > 0) {
      currentStep.set('allocation');
    }

    questionPaperStore.updateClassSubject({
      subject_code: newSubject,
      medium_code: newMedium,
      examClass: newClass
    });
  }

  async function handleQuestionSelect(event) {
    const { item, type } = event.detail;

    try {
      const mockData = mockQuestionsData[type.toLowerCase()];
      
      if (!mockData) {
        throw new Error('Invalid selection type');
      }

      const newQuestions = mockData.questions.map(q => ({
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

      allQuestions.update(current => [...current, ...newQuestions]);
      

    } catch (err) {
      console.error('Error processing questions:', err);
      alert('Failed to load questions: ' + err.message);
    }
  }

  function handleFetchQuestions(event) {
    fetchedQuestions.set(event.detail.questions);
  }

  function handleSubmit(event) {
    event.preventDefault();
    
    const isFormValid = get(examDetailsValid) && get(classSubjectValid) && 
                       get(examConfigValid) && get(difficultyValid) && 
                       get(isAllocationConfirmed);
    
    if (isFormValid) {
      currentView.set('review');
    } else {
      const errors = [];
      if (!get(examDetailsValid)) errors.push('Exam details are incomplete');
      if (!get(classSubjectValid)) errors.push('Class and subject selection is required');
      if (!get(examConfigValid)) errors.push('Exam configuration is invalid');
      if (!get(difficultyValid)) errors.push('Difficulty distribution must total 100%');
      if (!get(isAllocationConfirmed)) errors.push('Question allocation must be confirmed');
      
      alert(errors.join('\n'));
    }
  }

  return {
    handleReset,
    handleDelete,
    handleExamConfigValidation,
    handleAllocationConfirmed,
    handleClassSubjectSelect,
    handleQuestionSelect,
    handleFetchQuestions,
    handleSubmit
  };
}