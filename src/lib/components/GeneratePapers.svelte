<script>
  import Card from "$lib/components/Cards/Card.svelte";
  import { getContext } from "svelte";
  import DataTable from "$lib/components/DataTable.svelte";

  // const questionPaperStore = getContext('questionPaperStore');

  // Props with default values
  import { FileText, FileJson, Printer, Eye } from "@lucide/svelte";
  import InlineNotification from "$lib/components/InlineNotification.svelte";
  import Button from "$lib/components/Button.svelte";
  import { goto } from "$app/navigation";
  import { apiPayloadStore } from "$lib/stores/apiPayLoadStore.js";

  export let examData = {};
  export let questions = [];
  export let isEdit = false;
  export let generationResult = { message: "", type: "success" }; // New prop for generation result

  // NEW: Add props for generated papers data
  export let generatedPapersData = null;

  // Access the store to get generated papers if not passed as prop
  $: displayData = generatedPapersData;

  $: papers = displayData?.questionPapers
    ? displayData.questionPapers.map((paper, index) => ({
        questionPaperId: paper.id || `Paper-${index + 1}`,
        eventId: displayData.examInfo?.exam_code || "N/A",
        eventName:
          displayData.examInfo?.exam_name || examData.examTitle || "Untitled Exam",
        subjectName:
          displayData.examInfo?.subject || examData.examSubjectName || "Not specified",
        standard: examData.examClass || "Not specified",
        medium: displayData.examInfo?.medium || examData.examMediumName || "Not specified",
        questionsCount: paper.qns?.length || 0,
        rawPaper: paper, // Keep reference to original paper data
      }))
    : [];

  const tableHeadersDisplay = [
    { key: "questionPaperId", name: "Paper ID", width: "15%" },
    // { key: 'eventId', name: 'Event ID', width: '10%' },
    { key: "eventName", name: "Exam Title", width: "20%" },
    { key: "subjectName", name: "Subject", width: "15%" },
    { key: "standard", name: "Class", width: "10%" },
    { key: "medium", name: "Medium", width: "10%" },
    { key: "questionsCount", name: "Questions", width: "10%" },
  ];

  const actionConfigObject = [
    // { actionName: "PDF", label: "PDF", icon: FileText },
    // { actionName: "JSON", label: "JSON", icon: FileJson },
    { actionName: "Print", label: "Print", icon: Printer },
    { actionName: "View", label: "View", icon: Eye },
  ];

  function handleTableAction(event) {
    const { actionName, actionData } = event.detail;
    const paperId = actionData.questionPaperId;

    if (actionName === "PDF") handleDownloadPDF(paperId);
    if (actionName === "JSON") handleDownloadJSON(paperId);
    if (actionName === "Print") handlePrint(paperId);
    if (actionName === "View") handleView(paperId);
  }

  // FIXED: Enhanced download functionality with JSON and PDF options
  function handleDownloadJSON(paperId) {
    // Find the paper data
    const paper = papers.find((p) => p.questionPaperId === paperId);
    if (!paper) {
      alert("Paper not found");
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
        generatedAt: new Date().toISOString(),
      },
      examInfo: displayData.examInfo,
      questions: paper.rawPaper.qns || [], // Use the correct path to questions
      metadata: {
        totalQuestions: paper.questionsCount,
        paperType: "Generated Question Paper",
        format: "JSON",
      },
    };

    // Create and download JSON file
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${paper.questionPaperId}_questions.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleDownloadPDF(paperId) {
    // Find the paper data
    const paper = papers.find((p) => p.questionPaperId === paperId);
    if (!paper) {
      alert("Paper not found");
      return;
    }

    // Create HTML content for PDF (with printing enabled)
    const htmlContent = generatePDFContent(paper, true);

    // Create a blob URL of the HTML content
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    // Open in a separate window/tab with noopener/noreferrer to isolate process
    window.open(url, "_blank", "noopener,noreferrer");

    // Revoke the Object URL after a timeout to free resources
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 10000);
  }

  function generatePDFContent(paper, shouldPrint = false) {
    // Get questions from the correct path in the JSON structure
    const questions = paper.rawPaper.qns || [];

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
            ${questions
              .map((question, index) => {
                // Handle the correct JSON structure
                const questionText =
                  question.text ||
                  question.question ||
                  "Question text not available";
                const questionOptions = question.options || [];

                return `
                <div class="question">
                  <div class="question-number">Question ${index + 1}:</div>
                  <div class="question-text">${questionText}</div>
                  ${
                    questionOptions.length > 0
                      ? `
                    <div class="options">
                      ${questionOptions
                        .map((option, optIndex) => {
                          // Handle the option structure correctly
                          const optionText =
                            option.text || option.option || option;
                          return `
                          <div class="option">${String.fromCharCode(65 + optIndex)}. ${optionText}</div>
                        `;
                        })
                        .join("")}
                    </div>
                  `
                      : ""
                  }
                </div>
              `;
              })
              .join("")}
          </div>

          <div style="margin-top: 50px; text-align: center; font-size: 12px; color: #666;">
            Generated on: ${new Date().toLocaleString()}
          </div>

          ${
            shouldPrint
              ? `<script>
            window.addEventListener('load', () => {
              window.focus();
              setTimeout(() => {
                window.print();
              }, 500);
            });
          <\/script>`
              : ""
          }
        </body>
      </html>
    `;
  }

  function handlePrint(paperId) {
    handleDownloadPDF(paperId);
  }

  function handleView(paperId) {
    // Find the paper data
    const paper = papers.find((p) => p.questionPaperId === paperId);
    if (!paper) {
      alert("Paper not found");
      return;
    }

    // Create a modal or new window to view paper content
    const htmlContent = generatePDFContent(paper);
    const viewWindow = window.open(
      "",
      "_blank",
      "width=800,height=600,scrollbars=yes",
    );
    viewWindow.document.write(htmlContent);
    viewWindow.document.close();
  }

  function handleFinish() {
    goto("/home");
  }
  function handleBack() {
    goto("/create-paper?step=2");
  }
</script>

<!-- <Card>
</Card> -->
{#if generationResult.message}
  <div class="mb-3">
    <InlineNotification
      title={generationResult.message}
      kind={generationResult.type}
    />
  </div>
{/if}

{#if papers.length > 0}
  <DataTable
    tableData={papers}
    {tableHeadersDisplay}
    {actionConfigObject}
    on:tableActionClick={handleTableAction}
    showPagination={papers.length > 10}
  />
{/if}

<div class="w-full justify-end flex mt-4">
  <div class="flex gap-4">
    <!-- <Button on:click={handleBack} btnType="secondary" >Back</Button> -->
    <Button on:click={handleFinish}>Finish</Button>
  </div>
</div>
