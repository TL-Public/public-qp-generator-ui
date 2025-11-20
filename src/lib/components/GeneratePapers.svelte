<script>
  import Card from './Cards/Card.svelte';
  import { questionPaperStore } from '$lib/stores/questionPaperStore';

  // Props with default values
  export let examTitle = '';
  export let examClass = '';
  export let examMedium = '';
  export let examSubject = '';
  export let numberOfSets = 1;
  export let numberOfVersions = 1;
  export let questions = [];
  export let allocationData;
  export let isEdit  = false ; 

  // NEW: Add props for generated papers data
  export let generatedPapersData = null;

  // Add state for dropdown visibility
  let openDropdowns = {};

  // Access the store to get generated papers if not passed as prop
  $: displayData = generatedPapersData || $questionPaperStore.generatedPapers;


  $: papers = displayData?.questionPapers ? 
    displayData.questionPapers.map((paper, index) => ({
      questionPaperId: paper.id || `Paper-${index + 1}`,
      eventId: displayData.examInfo?.exam_code || 'N/A',
      eventName: displayData.examInfo?.exam_name || examTitle || 'Untitled Exam',
      subjectName: displayData.examInfo?.subject || examSubject || 'Not specified',
      standard: examClass || 'Not specified',
      medium: displayData.examInfo?.medium || examMedium || 'Not specified',
      questionsCount: paper.qns?.length || 0,
      rawPaper: paper // Keep reference to original paper data
    })) : [];

  // Toggle dropdown function
  function toggleDropdown(paperId) {
    openDropdowns[paperId] = !openDropdowns[paperId];
    // Close other dropdowns
    Object.keys(openDropdowns).forEach(id => {
      if (id !== paperId) {
        openDropdowns[id] = false;
      }
    });
  }

  // FIXED: Enhanced download functionality with JSON and PDF options
  function handleDownloadJSON(paperId) {
    console.log('Downloading JSON for paper:', paperId);
    
    // Close dropdown
    openDropdowns[paperId] = false;
    
    // Find the paper data
    const paper = papers.find(p => p.questionPaperId === paperId);
    if (!paper) {
      alert('Paper not found');
      return;
    }

    // Create JSON data structure using the correct format
    const jsonData = {
      paperInfo: {
        id: paper.questionPaperId,
        eventId: paper.eventId,
        eventName: paper.eventName,
        subject: paper.subjectName,
        standard: paper.standard,
        medium: paper.medium,
        questionsCount: paper.questionsCount,
        generatedAt: new Date().toISOString()
      },
      examInfo: displayData.examInfo,
      questions: paper.rawPaper.qns || [], // Use the correct path to questions
      metadata: {
        totalQuestions: paper.questionsCount,
        paperType: 'Generated Question Paper',
        format: 'JSON'
      }
    };

    // Create and download JSON file
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${paper.questionPaperId}_questions.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleDownloadPDF(paperId) {
    console.log('Downloading PDF for paper:', paperId);
    
    // Close dropdown
    openDropdowns[paperId] = false;
    
    // Find the paper data
    const paper = papers.find(p => p.questionPaperId === paperId);
    if (!paper) {
      alert('Paper not found');
      return;
    }

    // Create HTML content for PDF using the correct JSON structure
    const htmlContent = generatePDFContent(paper);
    
    // Create a new window for PDF generation
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Trigger print dialog (which can save as PDF)
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }

  function generatePDFContent(paper) {
    // Get questions from the correct path in the JSON structure
    const questions = paper.rawPaper.qns || [];
    
    console.log('Generating PDF for questions:', questions); // Debug log
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${paper.questionPaperId} - Question Paper</title>
          <style>
            body { 
              font-family: 'Times New Roman', serif; 
              margin: 40px; 
              line-height: 1.6; 
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .paper-info { 
              margin-bottom: 30px; 
            }
            .question { 
              margin-bottom: 25px; 
              page-break-inside: avoid;
            }
            .question-number { 
              font-weight: bold; 
              margin-bottom: 8px;
              font-size: 14px;
            }
            .question-text { 
              margin-left: 20px;
              margin-bottom: 10px;
              font-size: 13px;
              line-height: 1.5;
            }
            .options { 
              margin-left: 40px; 
              margin-top: 10px; 
            }
            .option { 
              margin-bottom: 6px;
              font-size: 12px;
            }
            @media print {
              body { margin: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${paper.eventName}</h1>
            <h2>Question Paper: ${paper.questionPaperId}</h2>
            <p><strong>Subject:</strong> ${paper.subjectName} | <strong>Standard:</strong> ${paper.standard} | <strong>Medium:</strong> ${paper.medium}</p>
            <p><strong>Total Questions:</strong> ${paper.questionsCount} | <strong>Event ID:</strong> ${paper.eventId}</p>
          </div>
          
          <div class="paper-info">
            <p><strong>Instructions:</strong></p>
            <ul>
              <li>Answer all questions</li>
              <li>Choose the most appropriate answer</li>
              <li>Total Questions: ${paper.questionsCount}</li>
            </ul>
          </div>

          <div class="questions">
            ${questions.map((question, index) => {
              // Handle the correct JSON structure
              const questionText = question.text || question.question || 'Question text not available';
              const questionOptions = question.options || [];
              
              return `
                <div class="question">
                  <div class="question-number">Question ${index + 1}:</div>
                  <div class="question-text">${questionText}</div>
                  ${questionOptions.length > 0 ? `
                    <div class="options">
                      ${questionOptions.map((option, optIndex) => {
                        // Handle the option structure correctly
                        const optionText = option.text || option.option || option;
                        return `
                          <div class="option">${String.fromCharCode(65 + optIndex)}. ${optionText}</div>
                        `;
                      }).join('')}
                    </div>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>

          <div style="margin-top: 50px; text-align: center; font-size: 12px; color: #666;">
            Generated on: ${new Date().toLocaleString()}
          </div>
        </body>
      </html>
    `;
  }

  function handlePrint(paperId) {
    console.log('Printing paper:', paperId);
    handleDownloadPDF(paperId);
  }

  function handleView(paperId) {
    console.log('Viewing paper:', paperId);
    
    // Find the paper data
    const paper = papers.find(p => p.questionPaperId === paperId);
    if (!paper) {
      alert('Paper not found');
      return;
    }

    // Create a modal or new window to view paper content
    const htmlContent = generatePDFContent(paper);
    const viewWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
    viewWindow.document.write(htmlContent);
    viewWindow.document.close();
  }
</script>

<Card title="Generated Question Papers">
  <!-- Show papers table only when we have actual generated data -->
  {#if displayData?.questionPapers?.length > 0}
    <div class="overflow-x-auto p-14">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Question Paper ID
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Event ID
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Event Name
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Subject Name
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Standard
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Medium
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Questions
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {#each papers as paper}
            <tr>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {paper.questionPaperId}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {paper.eventId}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {paper.eventName}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {paper.subjectName}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {paper.standard}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {paper.medium}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {paper.questionsCount}
              </td>
    
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex items-center space-x-2">
                  <!-- Download Dropdown -->
                  <div class="relative inline-block text-left">
                    <button
                      type="button"
                      class="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      on:click={() => toggleDropdown(paper.questionPaperId)}
                    >
                      Download
                      <svg class="-mr-1 ml-1 h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                      </svg>
                    </button>
                    
                    {#if openDropdowns[paper.questionPaperId]}
                      <div class="origin-top-right absolute right-0 mt-2 w-32 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                        <div class="py-1">
                          <button
                            on:click={() => handleDownloadJSON(paper.questionPaperId)}
                            class="block px-4 py-2 text-xs text-gray-700 hover:bg-gray-100 w-full text-left"
                          >
                            📄 JSON
                          </button>
                          <button
                            on:click={() => handleDownloadPDF(paper.questionPaperId)}
                            class="block px-4 py-2 text-xs text-gray-700 hover:bg-gray-100 w-full text-left"
                          >
                            📋 PDF
                          </button>
                        </div>
                      </div>
                    {/if}
                  </div>

                  <!-- Other Actions -->
                  <button
                    on:click={() => handlePrint(paper.questionPaperId)}
                    class="text-blue-600 hover:text-blue-800 text-xs"
                  >
                    Print
                  </button>
                  <button
                    on:click={() => handleView(paper.questionPaperId)}
                    class="text-green-600 hover:text-green-800 text-xs"
                  >
                    View
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}


</Card>