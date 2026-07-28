<script>
  import Card from "./Cards/Card.svelte";
  import Dropdown from "./Dropdown.svelte";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  export let examData = {};
  export let isValid = false;
  export let showErrors = false;

  export let mediumOptions = [];
  export let subjectOptions = [];
  export let loading = {
    mediums: false,
    subjects: false,
  };
  export let error = null;

  let touchedFields = {
    class: false,
    medium: false,
    subject: false,
  };

  // ✅ Hardcoded class options 1 to 12
  const classOptions = [
    { value: "1", label: "Class 1" },
    { value: "2", label: "Class 2" },
    { value: "3", label: "Class 3" },
    { value: "4", label: "Class 4" },
    { value: "5", label: "Class 5" },
    { value: "6", label: "Class 6" },
    { value: "7", label: "Class 7" },
    { value: "8", label: "Class 8" },
    { value: "9", label: "Class 9" },
    { value: "10", label: "Class 10" },
    { value: "11", label: "Class 11" },
    { value: "12", label: "Class 12" },
  ];

  // Watch for changes and dispatch selected values
  $: {
    if (examData.examClass) touchedFields.class = true;
    if (examData.examMedium) touchedFields.medium = true;
    if (examData.examSubject) touchedFields.subject = true;

    if (examData.examClass && examData.examMedium && examData.examSubject) {
      // Find the selected subject and medium's full data
      const selectedSubject = subjectOptions.find(
        (s) => s.value === examData.examSubject,
      );
      const selectedMedium = mediumOptions.find(
        (m) => m.value === examData.examMedium,
      );

      if (selectedSubject) examData.examSubjectName = selectedSubject.label;
      if (selectedMedium) examData.examMediumName = selectedMedium.label;

      // Dispatch the event with the codes
      const selectionData = {
        standard: examData.examClass,
        medium_code: examData.examMedium,
        subject_code: examData.examSubject,
        subject_name: examData.examSubjectName,
        medium_name: examData.examMediumName,
      };

      dispatch("selectionComplete", selectionData);
      dispatch("change", selectionData);
    }

    isValid =
      examData.examClass !== "" &&
      examData.examMedium !== "" &&
      examData.examSubject !== "";
  }

  function handleRetrySubjects() {
    dispatch("retrySubjects");
  }
</script>

<div class="grid grid-cols-3 gap-6">
  <div>
    <!-- ✅ Hardcoded dropdown for class 1 to 12 -->
    <Dropdown
      label="Class"
      options={classOptions}
      required={true}
      bind:value={examData.examClass}
    />
    {#if (touchedFields.class || showErrors) && !examData.examClass}
      <p class="text-xs text-red-600">Class is required</p>
    {/if}
  </div>

  <div>
    <Dropdown
      label="Medium"
      options={mediumOptions}
      required={true}
      bind:value={examData.examMedium}
      disabled={loading.mediums}
    />
    {#if (touchedFields.medium || showErrors) && !examData.examMedium}
      <p class="text-xs text-red-600">Medium is required</p>
    {/if}
  </div>

  <div class="">
    {#if loading.subjects}
      <div class="text-sm text-gray-500">Loading subjects...</div>
    {:else if error}
      <div class="text-sm text-red-600">{error}</div>
      <button
        class="mt-2 text-sm text-primary hover:text-blue-800"
        on:click={handleRetrySubjects}
      >
        Try again
      </button>
    {:else}
      <Dropdown
        label="Subject"
        options={subjectOptions}
        required={true}
        bind:value={examData.examSubject}
        disabled={loading.subjects || subjectOptions.length === 0}
      />
      {#if (touchedFields.subject || showErrors) && !examData.examSubject}
        <p class="text-xs text-red-600">Subject is required</p>
      {/if}
      {#if !loading.subjects && subjectOptions.length === 0}
        <p class="text-xs text-gray-500 mt-1">No subjects available</p>
      {/if}
    {/if}
  </div>
</div>
