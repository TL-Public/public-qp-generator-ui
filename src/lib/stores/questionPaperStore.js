import { writable, get } from 'svelte/store';

export const createQuestionPaperStore = () => {
  const store = writable({
    exam_name: '',
    exam_type_code: 'MCQ',
    exam_mode: '',
    total_time: 0,
    total_questions: 0,
    no_of_versions: 0,
    no_of_sets: 0,
    subject_code: '',
    medium_code: '',
    standard: '',
    qns: {
      type: 'chapter',
      codes: [],
      qtn_codes_to_exclude: []
    },
    generatedPapers: [],
    generationTimestamp: ''
  });

  const { subscribe, set, update } = store;

  const validateData = (data) => {
    // Basic validation
    if (!data.exam_name) throw new Error('Exam name is required');
    if (!data.exam_mode) throw new Error('Exam mode is required');
    if (!data.subject_code) throw new Error('Subject code is required');
    if (!data.medium_code) throw new Error('Medium code is required');
    if (!data.standard) throw new Error('Standard is required');
    
    // Numeric validations
    if (data.total_time <= 0) throw new Error('Total time must be greater than 0');
    if (data.total_questions <= 0) throw new Error('Total questions must be greater than 0');
    if (data.no_of_versions <= 0) throw new Error('Number of versions must be greater than 0');
    if (data.no_of_sets <= 0) throw new Error('Number of sets must be greater than 0');

    // Question group validations
    if (!['chapter', 'topic', 'subtopic'].includes(data.qns.type)) {
      throw new Error('Invalid question type. Must be chapter, topic, or subtopic');
    }
    if (!data.qns.codes.length) throw new Error('At least one question code is required');

    return data;
  };

  return {
    subscribe,
    updateExamDetails: (examDetails) => {
      if (!examDetails?.examTitle) {
        console.warn('Exam title is missing in updateExamDetails');
      }
      
      update(store => ({
        ...store,
        exam_name: examDetails?.examTitle?.trim() || '',
        exam_mode: examDetails?.examMode?.trim() || ''
      }));

      // Debug log
      const currentState = get(store);
    },
    updateExamConfig: (config) => update(store => ({
      ...store,
      total_time: parseInt(config.totalTime) || 0,
      total_questions: parseInt(config.totalQuestions) || 0,
      no_of_versions: parseInt(config.numberOfVersions) || 0,
      no_of_sets: parseInt(config.numberOfSets) || 0
    })),
    updateClassSubject: (details) => update(store => {
      return {
        ...store,
        subject_code: details.subject_code || '',
        medium_code: details.medium_code || '',
        standard: details.examClass?.toString() || ''
      };
    }),
    updateQuestionGroups: (groupData) => update(store => ({
      ...store,
      qns: {
        ...store.qns,
        type: groupData.type?.toLowerCase() || 'chapter',
        codes: (groupData.items || []).map(item => item.id?.toString() || '').filter(Boolean)
      }
    })),
    updateExcludedQuestions: (excludedCodes) => update(store => ({
      ...store,
      qns: {
        ...store.qns,
        qtn_codes_to_exclude: (excludedCodes || []).map(code => code.toString())
      }
    })),
    getValidatedData: () => {
      const currentData = get(store);
      return validateData(currentData);
    },
    reset: () => set({
      exam_name: '',
      exam_type_code: 'MCQ',
      exam_mode: '',
      total_time: 0,
      total_questions: 0,
      no_of_versions: 0,
      no_of_sets: 0,
      subject_code: '',
      medium_code: '',
      standard: '',
      qns: {
        type: 'chapter',
        codes: [],
        qtn_codes_to_exclude: []
      },
      generatedPapers: [],
      generationTimestamp: ''
    }),
    updateGeneratedPapers: (generatedData) => {
      update(state => ({
        ...state,
        generatedPapers: generatedData,
        generationTimestamp: new Date().toISOString()
      }));
    }
  };
};

export const questionPaperStore = createQuestionPaperStore();

