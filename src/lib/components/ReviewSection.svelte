<script>
  import Card from './Cards/Card.svelte';
  import ConfigurationSummary from './ConfigurationSummary.svelte';
  import QuestionGroupsPreview from './QuestionGroupsPreview.svelte';
  import ActionBar from './ActionBar.svelte';

  export let examConfig;
  export let groups;
  export let onBack;
  export let onGenerate;
</script>

<div class="space-y-8">
  <Card title="Review Configuration">
    <ConfigurationSummary {examConfig} />
  </Card>

  <Card title="Question Groups">
    <QuestionGroupsPreview {groups} />
  </Card>

  <ActionBar
    totalSets={examConfig.numberOfSets}
    totalVersions={examConfig.numberOfVersions}
    timePerPaper={examConfig.totalTime}
    {onBack}
    {onGenerate}
  />
</div>