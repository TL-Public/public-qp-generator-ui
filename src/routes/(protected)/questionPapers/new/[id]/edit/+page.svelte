<script>
    import NewQuestionPaperWorkflow from "$lib/components/exams/NewQuestionPaperWorkflow.svelte";
    import { page } from "$app/stores";

    $: examId = $page.params.id;
</script>

{#if examId}
    <NewQuestionPaperWorkflow examCode={examId} />
{/if}
