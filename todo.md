{#if selectedExamData}
  <Modal 
    title="Exam Details - {selectedExamData.data?.design?.exam_name || 'Unknown'}"
    isOpen={true}
    on:close={closeModal}
    size="large"
  >
    <div class="space-y-6">
      <!-- Exam Design Information -->
      <div class="bg-gray-50 p-4 rounded-lg">
        <h4 class="text-sm font-medium text-gray-900 mb-3">Exam Design Information</h4>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-gray-500">Code:</span>
            <span class="font-medium ml-2">{selectedExamData.data?.design?.exam_code || 'N/A'}</span>
          </div>
          <div>
            <span class="text-gray-500">Type:</span>
            <span class="font-medium ml-2">{selectedExamData.data?.design?.exam_type || 'N/A'}</span>
          </div>
          <div>
            <span class="text-gray-500">Subject:</span>
            <span class="font-medium ml-2">{selectedExamData.data?.design?.subject || 'N/A'}</span>
          </div>
          <div>
            <span class="text-gray-500">Class:</span>
            <span class="font-medium ml-2">{selectedExamData.data?.design?.standard || 'N/A'}</span>
          </div>
          <div>
            <span class="text-gray-500">Medium:</span>
            <span class="font-medium ml-2">{selectedExamData.data?.design?.medium || 'N/A'}</span>
          </div>
          <div>
            <span class="text-gray-500">Mode:</span>
            <span class="font-medium ml-2 capitalize">{selectedExamData.data?.design?.exam_mode || 'N/A'}</span>
          </div>
          <div>
            <span class="text-gray-500">Total Questions:</span>
            <span class="font-medium ml-2">{selectedExamData.data?.design?.total_questions || 'N/A'}</span>
          </div>
          <div>
            <span class="text-gray-500">Status:</span>
            <span class="font-medium ml-2 capitalize {selectedExamData.data?.design?.status === 'closed' ? 'text-green-600' : 'text-yellow-600'}">
              {selectedExamData.data?.design?.status || 'N/A'}
            </span>
          </div>
          <div>
            <span class="text-gray-500">Sets:</span>
            <span class="font-medium ml-2">{selectedExamData.data?.design?.number_of_sets || 'N/A'}</span>
          </div>
          <div>
            <span class="text-gray-500">Versions:</span>
            <span class="font-medium ml-2">{selectedExamData.data?.design?.number_of_versions || 'N/A'}</span>
          </div>
        </div>
      </div>

      <!-- Generated Papers -->
      {#if selectedExamData.data?.design?.papers && selectedExamData.data.design.papers.length > 0}
        <div class="bg-blue-50 p-4 rounded-lg">
          <h4 class="text-sm font-medium text-gray-900 mb-3">Generated Papers</h4>
          <div class="flex flex-wrap gap-2">
            {#each selectedExamData.data.design.papers as paperCode}
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {paperCode}
              </span>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Question Paper Details -->
      {#if selectedQuestionPaper && selectedQuestionPaper.data}
        <div class="bg-green-50 p-4 rounded-lg">
          <h4 class="text-sm font-medium text-gray-900 mb-3">Question Paper Details</h4>
          <div class="grid grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <span class="text-gray-500">Paper Code:</span>
              <span class="font-medium ml-2">{selectedQuestionPaper.data.paper_code || 'N/A'}</span>
            </div>
            <div>
              <span class="text-gray-500">Set:</span>
              <span class="font-medium ml-2">{selectedQuestionPaper.data.set || 'N/A'}</span>
            </div>
            <div>
              <span class="text-gray-500">Version:</span>
              <span class="font-medium ml-2">{selectedQuestionPaper.data.version || 'N/A'}</span>
            </div>
            <div>
              <span class="text-gray-500">Number of Questions:</span>
              <span class="font-medium ml-2">{selectedQuestionPaper.data.no_of_qns || 'N/A'}</span>
            </div>
          </div>

          <!-- Questions Preview -->
          {#if selectedQuestionPaper.data.questions && selectedQuestionPaper.data.questions.length > 0}
            <div>
              <h5 class="text-sm font-medium text-gray-900 mb-2">Questions Preview</h5>
              <div class="max-h-64 overflow-y-auto space-y-3">
                {#each selectedQuestionPaper.data.questions.slice(0, 5) as question, index}
                  <div class="bg-white p-3 rounded border border-gray-200">
                    <div class="flex items-start justify-between mb-2">
                      <span class="text-xs font-medium text-gray-500">Question {index + 1}</span>
                      <span class="text-xs text-gray-400">ID: {question.id || 'N/A'}</span>
                    </div>
                    <p class="text-sm text-gray-700 mb-2">
                      {formatQuestionText(question.text)}
                    </p>
                    
                    <!-- Options (if available) -->
                    {#if question.options && question.options.length > 0}
                      <div class="space-y-1">
                        <span class="text-xs font-medium text-gray-500">Options:</span>
                        {#each question.options as option, optIndex}
                          <div class="text-xs text-gray-600 pl-2">
                            {String.fromCharCode(65 + optIndex)}. {option.text || 'Option text not available'}
                          </div>
                        {/each}
                      </div>
                    {/if}
                  </div>
                {/each}
                
                {#if selectedQuestionPaper.data.questions.length > 5}
                  <div class="text-center py-2">
                    <span class="text-xs text-gray-500">
                      ... and {selectedQuestionPaper.data.questions.length - 5} more questions
                    </span>
                  </div>
                {/if}
              </div>
            </div>
          {:else}
            <div class="text-center py-4 text-gray-500 text-sm">
              No questions data available
            </div>
          {/if}
        </div>
      {:else if selectedExamData.data?.design?.papers && selectedExamData.data.design.papers.length > 0}
        <div class="bg-yellow-50 p-4 rounded-lg">
          <div class="flex items-center space-x-2">
            <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span class="text-sm text-yellow-800">Question paper details could not be loaded</span>
          </div>
        </div>
      {/if}

      <!-- Chapters/Topics -->
      {#if selectedExamData.data?.design?.chapters_topics && selectedExamData.data.design.chapters_topics.length > 0}
        <div class="bg-purple-50 p-4 rounded-lg">
          <h4 class="text-sm font-medium text-gray-900 mb-3">Chapters & Topics</h4>
          <div class="space-y-2">
            {#each selectedExamData.data.design.chapters_topics as item}
              <div class="text-sm">
                <span class="font-medium capitalize text-purple-700">{item.type}:</span>
                <span class="text-gray-700 ml-1">{item.codes?.join(', ') || 'N/A'}</span>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Raw Data for Debug (collapsible) -->
      <details class="border border-gray-200 rounded-lg">
        <summary class="cursor-pointer p-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
          View Raw Data (Debug)
        </summary>
        <div class="p-3 border-t border-gray-200 bg-gray-50">
          <div class="space-y-4">
            <div>
              <h5 class="text-xs font-medium text-gray-600 mb-2">Exam Design Data:</h5>
              <pre class="text-xs text-gray-600 overflow-auto max-h-32 bg-white p-2 rounded">{JSON.stringify(selectedExamData, null, 2)}</pre>
            </div>
            {#if selectedQuestionPaper}
              <div>
                <h5 class="text-xs font-medium text-gray-600 mb-2">Question Paper Data:</h5>
                <pre class="text-xs text-gray-600 overflow-auto max-h-32 bg-white p-2 rounded">{JSON.stringify(selectedQuestionPaper, null, 2)}</pre>
              </div>
            {/if}
          </div>
        </div>
      </details>
    </div>

    <!-- Modal Footer -->
    <div slot="footer" class="flex justify-end space-x-3">
      <button
        type="button"
        class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        on:click={closeModal}
      >
        Close
      </button>
    </div>
  </Modal>
{/if}