import { writable, derived } from 'svelte/store';
import { v4 as uuidv4 } from 'uuid';

export function createExamState() {
  // Basic exam details
  const examTitle = writable('');
  const examMode = writable('Online');
  const examClass = writable('');
  const examMedium = writable('');
  const examSubject = writable('');

  // Exam configuration
  const totalTime = writable(40);
  const totalQuestions = writable(40);
  const numberOfSets = writable(1);
  const numberOfVersions = writable(1);

  // Difficulty distribution
  const easy = writable(40);
  const medium = writable(40);
  const hard = writable(20);

  // Validation states
  const examDetailsValid = writable(true);
  const classSubjectValid = writable(true);
  const examConfigValid = writable(true);
  const difficultyValid = writable(true);

  // Navigation and allocation
  const currentView = writable('config');
  const currentStep = writable('examDetails');
  const isAllocationConfirmed = writable(false);
  const confirmedAllocationData = writable(null);
  const shouldNavigateToReview = writable(false);

  // Questions and selections
  const allQuestions = writable([]);
  const fetchedQuestions = writable([]);
  const paperId = writable(uuidv4());

  // Computed states
  const completedSteps = derived(
    [examTitle, examMode, examDetailsValid, examConfigValid, difficultyValid, examClass, examSubject, examMedium, classSubjectValid, isAllocationConfirmed, currentView],
    ([$examTitle, $examMode, $examDetailsValid, $examConfigValid, $difficultyValid, $examClass, $examSubject, $examMedium, $classSubjectValid, $isAllocationConfirmed, $currentView]) => ({
      examDetails: !!$examTitle && !!$examMode && $examDetailsValid,
      examConfig: $examConfigValid,
      difficulty: $difficultyValid,
      classSubject: !!$examClass && !!$examSubject && !!$examMedium && $classSubjectValid,
      allocation: $isAllocationConfirmed,
      review: $currentView === 'review'
    })
  );

  const isReviewPageEnabled = derived(currentView, $currentView => $currentView !== 'config');

  // Validation errors
  const validationErrors = writable({
    questions: null,
    versions: null,
    sets: null
  });

  return {
    // Basic exam details
    examTitle,
    examMode,
    examClass,
    examMedium,
    examSubject,
    
    // Exam configuration
    totalTime,
    totalQuestions,
    numberOfSets,
    numberOfVersions,
    
    // Difficulty distribution
    easy,
    medium,
    hard,
    
    // Validation states
    examDetailsValid,
    classSubjectValid,
    examConfigValid,
    difficultyValid,
    validationErrors,
    
    // Navigation and allocation
    currentView,
    currentStep,
    isAllocationConfirmed,
    confirmedAllocationData,
    shouldNavigateToReview,
    
    // Questions and selections
    allQuestions,
    fetchedQuestions,
    paperId,
    
    // Computed states
    completedSteps,
    isReviewPageEnabled
  };
}