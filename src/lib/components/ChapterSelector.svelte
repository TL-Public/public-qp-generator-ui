<script>
  import Card from './Cards/Card.svelte';
  import ChapterTable from './ChapterTable.svelte';
  import { createEventDispatcher } from 'svelte';

  // Add props for class and subject
  export let examClass = '';
  export let examSubject = '';
  export let examMedium = '';

  const dispatch = createEventDispatcher();
  let selectedItems = [];
  let selectionType = 'chapter';
  
  $: cardTitle = `${selectionType.charAt(0).toUpperCase() + selectionType.slice(1)}s Selection`;
  
  const selectionOptions = [
    { value: 'chapter', label: 'Chapters', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },
    { value: 'topic', label: 'Topics', icon: 'M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z' },
    { value: 'subtopic', label: 'Subtopics', icon: 'M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
  ];
  
export const mockData = {
  chapters: [
    { id: 1, type: 'Chapter', name: 'Algebra', questionCount: 25, class: 9, subject: 'Maths' },
    { id: 2, type: 'Chapter', name: 'Geometry', questionCount: 30, class: 8, subject: 'Maths' },
    { id: 3, type: 'Chapter', name: 'Trigonometry', questionCount: 20, class: 10, subject: 'Maths' },
    { id: 4, type: 'Chapter', name: 'Calculus', questionCount: 18, class: 12, subject: 'Maths' },
    { id: 5, type: 'Chapter', name: 'Statistics', questionCount: 22, class: 11, subject: 'Maths' },
    { id: 6, type: 'Chapter', name: 'Probability', questionCount: 16, class: 11, subject: 'Maths' },
    { id: 7, type: 'Chapter', name: 'Mensuration', questionCount: 12, class: 7, subject: 'Maths' },
    { id: 8, type: 'Chapter', name: 'Number Systems', questionCount: 28, class: 6, subject: 'Maths' },
    { id: 9, type: 'Chapter', name: 'Set Theory', questionCount: 14, class: 11, subject: 'Maths' },
    { id: 10, type: 'Chapter', name: 'Matrices', questionCount: 19, class: 12, subject: 'Maths' },
  ],
  topics: [
    { id: 11, type: 'Topic', name: 'Linear Equations', questionCount: 15, parentChapter: 'Algebra', class: 9, subject: 'Maths' },
    { id: 12, type: 'Topic', name: 'Quadratic Equations', questionCount: 10, parentChapter: 'Algebra', class: 10, subject: 'Maths' },
    { id: 13, type: 'Topic', name: 'Triangles', questionCount: 12, parentChapter: 'Geometry', class: 8, subject: 'Maths' },
    { id: 14, type: 'Topic', name: 'Circles', questionCount: 11, parentChapter: 'Geometry', class: 9, subject: 'Maths' },
    { id: 15, type: 'Topic', name: 'Derivatives', questionCount: 9, parentChapter: 'Calculus', class: 12, subject: 'Maths' },
    { id: 16, type: 'Topic', name: 'Integrals', questionCount: 10, parentChapter: 'Calculus', class: 12, subject: 'Maths' },
    { id: 17, type: 'Topic', name: 'Probability Distributions', questionCount: 8, parentChapter: 'Probability', class: 11, subject: 'Maths' },
    { id: 18, type: 'Topic', name: 'Bar Graphs', questionCount: 7, parentChapter: 'Statistics', class: 10, subject: 'Maths' },
    { id: 19, type: 'Topic', name: 'Venn Diagrams', questionCount: 6, parentChapter: 'Set Theory', class: 11, subject: 'Maths' },
    { id: 20, type: 'Topic', name: 'Matrix Operations', questionCount: 13, parentChapter: 'Matrices', class: 12, subject: 'Maths' },
  ],
  subtopics: [
    { id: 21, type: 'Subtopic', name: 'Solving Linear Equations', questionCount: 8, parentTopic: 'Linear Equations', class: 9, subject: 'Maths' },
    { id: 22, type: 'Subtopic', name: 'Word Problems', questionCount: 7, parentTopic: 'Linear Equations', class: 9, subject: 'Maths' },
    { id: 23, type: 'Subtopic', name: 'Completing the Square', questionCount: 6, parentTopic: 'Quadratic Equations', class: 10, subject: 'Maths' },
    { id: 24, type: 'Subtopic', name: 'Factorization', questionCount: 5, parentTopic: 'Quadratic Equations', class: 10, subject: 'Maths' },
    { id: 25, type: 'Subtopic', name: 'Area of Triangles', questionCount: 4, parentTopic: 'Triangles', class: 8, subject: 'Maths' },
    { id: 26, type: 'Subtopic', name: 'Properties of Circles', questionCount: 4, parentTopic: 'Circles', class: 9, subject: 'Maths' },
    { id: 27, type: 'Subtopic', name: 'Chain Rule', questionCount: 5, parentTopic: 'Derivatives', class: 12, subject: 'Maths' },
    { id: 28, type: 'Subtopic', name: 'Definite Integrals', questionCount: 5, parentTopic: 'Integrals', class: 12, subject: 'Maths' },
    { id: 29, type: 'Subtopic', name: 'Binomial Distribution', questionCount: 3, parentTopic: 'Probability Distributions', class: 11, subject: 'Maths' },
    { id: 30, type: 'Subtopic', name: 'Matrix Multiplication', questionCount: 6, parentTopic: 'Matrix Operations', class: 12, subject: 'Maths' },
  ]
};



  $: filteredData = {
    chapters: mockData.chapters.filter(chapter => {
      const matches = chapter.class === Number(examClass) && 
                     chapter.subject.toLowerCase() === examSubject.toLowerCase();
      return matches;
    }),
    topics: mockData.topics.filter(topic => {
      const matches = topic.class === Number(examClass) && 
                     topic.subject.toLowerCase() === examSubject.toLowerCase();
      return matches;
    }),
    subtopics: mockData.subtopics.filter(subtopic => {
      const matches = subtopic.class === Number(examClass) && 
                     subtopic.subject.toLowerCase() === examSubject.toLowerCase();
      return matches;
    })
  };

  // Update displayItems to use filteredData
  $: displayItems = examClass && examSubject ? 
    (filteredData[selectionType + 's'] || []) : [];

  // Add validation check
  $: isVisible = Boolean(examClass && examSubject);

  function handleCreateGroup(event) {
    if (selectedItems.length > 0) {
      dispatch('createGroup', {
        items: selectedItems,
        type: selectionType,
        totalQuestions: selectedItems.reduce((sum, item) => sum + item.questionCount, 0)
      });
      selectedItems = []; // Reset selection
    }
  }
  function handleSubmit(event) { 
    event.preventDefault() ; 
  }
   
</script>

{#if isVisible}
  <Card title={cardTitle}>
    <div class="space-y-6">
      <!-- Debug info -->
      <!-- <div class="text-sm text-gray-500 mb-4">
        <p>Selected Class: {examClass}</p>
        <p>Selected Subject: {examSubject}</p>
        <p>Items found: {displayItems.length}</p>
      </div> -->

      <!-- Selection options -->
      <div class="flex flex-wrap gap-4">
        {#each selectionOptions as option}
          <label 
            class="relative flex items-center justify-center px-6 py-3 rounded-lg cursor-pointer
                   transition-all duration-200 ease-in-out
                   {selectionType === option.value ? 
                     'bg-blue-50 border-2 border-blue-500 shadow-sm' : 
                     'bg-white border-2 border-gray-200 hover:border-blue-200'}"
          >
            <input
              type="radio"
              name="selectionType"
              value={option.value}
              bind:group={selectionType}
              class="absolute opacity-0"
            />
            <div class="flex items-center space-x-2">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                class="h-5 w-5 {selectionType === option.value ? 'text-blue-500' : 'text-gray-400'}"
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path fill-rule="evenodd" d={option.icon} clip-rule="evenodd" />
              </svg>
              <span class={selectionType === option.value ? 'font-medium text-blue-700' : 'text-gray-600'}>
                {option.label}
              </span>
              {#if selectionType === option.value}
                <div class="absolute right-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </div>
              {/if}
            </div>
          </label>
        {/each}
      </div>

      <!-- Table -->
      {#if displayItems.length > 0}
        <ChapterTable 
          items={displayItems}
          bind:selectedItems
          {selectionType}
        />
      {:else}
        <p class="text-center py-4 text-gray-500">
          No {selectionType}s available for class {examClass} and subject {examSubject}
        </p>
      {/if}

      <!-- Create group button -->
      {#if selectedItems.length > 0}
        <div class="flex justify-end">
          <button
            type="button"
            class="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-hover"
            on:click={handleCreateGroup}
          >
            Create Group
          </button>
        </div>
      {/if}
    </div>
  </Card>
{:else}
  <div class="text-center py-8 bg-gray-50 rounded-lg">
    <p class="text-gray-600">Please select both class and subject to view content</p>
  </div>
{/if}