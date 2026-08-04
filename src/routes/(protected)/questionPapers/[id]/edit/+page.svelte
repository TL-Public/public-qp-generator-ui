<!-- <script>
    import QuestionPaperWizard from "$lib/components/exams/QuestionPaperWizard.svelte";
    import { page } from "$app/stores";

    $: examId = $page.params.id;
</script>

{#if examId}
    <QuestionPaperWizard {examId} />
{/if} -->


<script>
    import NewQuestionPaperWorkflow from "$lib/components/exams/NewQuestionPaperWorkflow.svelte";
    import { page } from "$app/stores";

    $: examId = $page.params.id;
</script>

{#if examId}
    <NewQuestionPaperWorkflow examCode={examId} />
{/if}
