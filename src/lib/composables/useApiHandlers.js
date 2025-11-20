import { get } from 'svelte/store';
import { apiPayloadStore } from '$lib/stores/apiPayLoadStore.js';
import { questionPaperStore } from '$lib/stores/questionPaperStore';
import { api } from '$lib/utils/api';

export function createApiHandlers(examState) {
  const {
    examTitle, examMode, examClass, examMedium, examSubject,
    totalTime, totalQuestions, numberOfSets, numberOfVersions,
    currentView, confirmedAllocationData, allQuestions
  } = examState;

  async function handleGeneratePapers() {
    try {
      console.log('=== GENERATE PAPERS WITH API STORE ===');
      
      // Try to update API store one more time before generating
      const currentAllocationData = get(confirmedAllocationData);
      if (currentAllocationData && currentAllocationData.selectedItems) {
        console.log('Ensuring API store is updated with allocation data...');
        apiPayloadStore.updateFromAllocationData(currentAllocationData);
      }
      
      // Get the API payload from the store
      const payloadResult = apiPayloadStore.getApiPayload();
      
      console.log('API Payload validation result:', payloadResult);
      
      if (!payloadResult.isValid) {
        console.error('API Payload validation failed:');
        console.error('- Errors:', payloadResult.errors);
        throw new Error('Invalid data: ' + payloadResult.errors.join(', '));
      }

      const apiPayload = payloadResult.payload;
      console.log('API Payload from store:', apiPayload);

      // Validate with the API's validatePayload method
      const validation = api.questionPapers.validatePayload(apiPayload);
      if (!validation.isValid) {
        console.error('API validation failed:', validation.errors);
        throw new Error(`API validation failed: ${validation.errors.join(', ')}`);
      }

      console.log('Making API call with payload:', apiPayload);

      // Make the API call
      const response = await api.questionPapers.create(apiPayload);

      if (response.error) {
        throw new Error(response.error);
      }

      if (!response.data) {
        throw new Error('No data received from server');
      }

      console.log('Question papers generated successfully:', response.data);

      // Store the generated data
      const generatedPapersData = {
        examInfo: {
          exam_name: response.data.exam_name,
          exam_code: response.data.exam_code,
          number_of_sets: response.data.number_of_sets,
          number_of_versions: response.data.number_of_versions,
          subject: response.data.subject,
          medium: response.data.medium,
          exam_type: response.data.exam_type
        },
        questionPapers: response.data.question_papers || [],
        shortfallInfo: response.data.shortfall_info || {},
        generatedAt: new Date().toISOString(),
        originalPayload: apiPayload
      };

      // Update the store
      if (typeof questionPaperStore.updateGeneratedPapers === 'function') {
        questionPaperStore.updateGeneratedPapers(generatedPapersData);
      }

      // Navigate to the generate view
      currentView.set('generate');

      // Show success message
      const paperCount = response.data.question_papers?.length || 0;
      alert(`Successfully generated ${paperCount} question papers for "${response.data.exam_name}"`);

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

  function handleForceApiStoreUpdate() {
    console.log('=== FORCE API STORE UPDATE ===');
    
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

    console.log('API store updated with current data');
  }

  return {
    handleGeneratePapers,
    handleForceApiStoreUpdate
  };
}