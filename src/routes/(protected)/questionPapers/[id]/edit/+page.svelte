<script>
  import QuestionPaperWizard from "$lib/components/QuestionPaperWizard.svelte";
  import { page } from "$app/stores";

  $: examId = $page.params.id;
</script>

{#if examId}
  <QuestionPaperWizard {examId} />
{/if}
