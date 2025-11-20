import { get } from 'svelte/store';

export function createNavigationReactive(examState) {
  const { shouldNavigateToReview, isAllocationConfirmed, confirmedAllocationData, currentView, currentStep } = examState;

  // This will be called in a reactive statement
  function handleNavigation() {
    console.log('Reactive check:', {
      shouldNavigateToReview: get(shouldNavigateToReview),
      isAllocationConfirmed: get(isAllocationConfirmed),
      confirmedAllocationData: !!get(confirmedAllocationData),
      currentView: get(currentView)
    });
    
    if (get(shouldNavigateToReview) && get(isAllocationConfirmed) && get(confirmedAllocationData)) {
      console.log('REACTIVE: Navigating to review page via prop change');
      currentView.set('review');
      currentStep.set('review');
      shouldNavigateToReview.set(false); // Reset the flag
      console.log('REACTIVE: Navigation complete, currentView is now:', get(currentView));
    }
  }

  return {
    handleNavigation
  };
}