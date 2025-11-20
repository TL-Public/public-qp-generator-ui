export const mockQuestionsData = {
  chapter: {
    questions: [
      {
        id: 'Q001',
        text: 'What is Newton\'s first law of motion?',
        type: 'Theory',
        marks: 5,
        difficulty: 'Medium',
        parent: null,
        chapter_code: 'CH001',
        chapter_name: 'Laws of Motion',
        subject_code: 'PHY01',
        type_codes: ['CH001']
      },
      {
        id: 'Q002',
        text: 'Define momentum with examples.',
        type: 'Theory',
        marks: 3,
        difficulty: 'Easy',
        parent: null,
        chapter_code: 'CH001',
        chapter_name: 'Laws of Motion',
        subject_code: 'PHY01',
        type_codes: ['CH001']
      }
    ],
    total_questions: 2
  },
  topic: {
    questions: [
      {
        id: 'Q003',
        text: 'Explain inertia with real-world examples.',
        type: 'Theory',
        marks: 4,
        difficulty: 'Medium',
        parent: {
          code: 'CH001',
          name: 'Laws of Motion',
          type: 'chapter'
        },
        topic_code: 'T001',
        topic_name: 'Inertia',
        subject_code: 'PHY01',
        type_codes: ['CH001', 'T001']
      }
    ],
    total_questions: 1
  },
  subtopic: {
    questions: [
      {
        id: 'Q004',
        text: 'Calculate the force needed for a 5kg object.',
        type: 'Numerical',
        marks: 5,
        difficulty: 'Hard',
        parent: {
          code: 'T001',
          name: 'Inertia',
          type: 'topic'
        },
        subtopic_code: 'ST001',
        subtopic_name: 'Force Calculations',
        subject_code: 'PHY01',
        type_codes: ['CH001', 'T001', 'ST001']
      }
    ],
    total_questions: 1
  }
};