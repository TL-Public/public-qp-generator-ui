<script>
  import { onMount } from 'svelte';
  import Card from './Cards/Card.svelte';
  import Dropdown from './Dropdown.svelte';
  import { api } from '$lib/utils/api';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let examClass = '';
  export let examMedium = '';
  export let examSubject = '';
  export let examMediumName = '';
  export let examSubjectName = '';
  export let isValid = false;

  // ✅ Hardcoded class options 1 to 12
  const classOptions = [
    { value: '1', label: 'Class 1' },
    { value: '2', label: 'Class 2' },
    { value: '3', label: 'Class 3' },
    { value: '4', label: 'Class 4' },
    { value: '5', label: 'Class 5' },
    { value: '6', label: 'Class 6' },
    { value: '7', label: 'Class 7' },
    { value: '8', label: 'Class 8' },
    { value: '9', label: 'Class 9' },
    { value: '10', label: 'Class 10' },
    { value: '11', label: 'Class 11' },
    { value: '12', label: 'Class 12' }
  ];

  let mediumOptions = [];
  let subjectOptions = [];
  let loading = {
    mediums: false,
    subjects: false
  };
  let error = null;

  // Watch for changes and dispatch selected values
  $: {
    if (examClass && examMedium && examSubject) {
      // Find the selected subject and medium's full data
      const selectedSubject = subjectOptions.find(s => s.value === examSubject);
      const selectedMedium = mediumOptions.find(m => m.value === examMedium);
      
      if (selectedSubject) examSubjectName = selectedSubject.label;
      if (selectedMedium) examMediumName = selectedMedium.label;

    

      // Dispatch the event with the codes
      const selectionData = {
        standard: examClass,
        medium_code: examMedium,
        subject_code: examSubject,
        subject_name: examSubjectName,
        medium_name: examMediumName
      };

      dispatch('selectionComplete', selectionData);
      dispatch('change', selectionData);
    }
    
    isValid = examClass !== '' && examMedium !== '' && examSubject !== '';
  }

  let mediumError = false;
  let subjectError = false;

  // Fetch mediums using the /mediums API
  async function fetchMediums() {
    try {
      loading.mediums = true;
      const response = await api.mediums.getAll();
      
      if (response.error) throw new Error(response.error);

      // Map the medium data to dropdown options
      const mediumsData = response.data?.data || [];
      mediumOptions = mediumsData.map(medium => ({
        value: medium.medium_code,  // Use medium_code as the value
        label: medium.medium_name
      }));

     

    } catch (err) {
      console.error('Error in fetchMediums:', err);
      error = 'Failed to load mediums';
      mediumOptions = [];
    } finally {
      loading.mediums = false;
    }
  }

  // Fetch subjects using the /subjects API when class and medium are selected
  async function fetchSubjects() {
    try {
      loading.subjects = true;
      const response = await api.subjects.getAll();
      
      if (response.error) throw new Error(response.error);

      const allSubjects = response.data?.data || [];
      subjectOptions = allSubjects.map(subject => ({
        value: subject.subject_code,    // Use subject_code as the value
        label: subject.subject_name,
        standard: subject.standard,
        mediumCode: subject.medium_code // Store medium_code for reference
      }));


    } catch (err) {
      console.error('Error fetching subjects:', err);
      error = 'Failed to load subjects';
      subjectOptions = [];
    } finally {
      loading.subjects = false;
    }
  }

  onMount(() => {
    fetchMediums();
    fetchSubjects();
  });
</script>


  <div class="grid grid-cols-3 gap-6">
    <div>
      <!-- ✅ Hardcoded dropdown for class 1 to 12 -->
      <Dropdown 
        label="Class"
        options={classOptions}
        required={true}
        bind:value={examClass}
      />
      {#if !examClass}
        <p class="text-xs text-red-600">Class is required</p>
      {/if}
    </div>

    <div>
      <Dropdown 
        label="Medium"
        options={mediumOptions}
        required={true}
        bind:value={examMedium}
        disabled={loading.mediums}
      />
      {#if !examMedium}
        <p class="text-xs text-red-600">Medium is required</p>
      {/if}
    </div>

    <div class="">
    {#if loading.subjects}
      <div class="text-sm text-gray-500">Loading subjects...</div>
    {:else if error}
      <div class="text-sm text-red-600">{error}</div>
      <button 
        class="mt-2 text-sm text-blue-600 hover:text-blue-800"
        on:click={fetchSubjects}
      >
        Try again
      </button>
    {:else}
      <Dropdown 
        label="Subject"
        options={subjectOptions}
        required={true}
        bind:value={examSubject}
        disabled={loading.subjects || subjectOptions.length === 0}
      />
      {#if !examSubject}
        <p class="text-xs text-red-600">Subject is required</p>
      {/if}
      {#if !loading.subjects && subjectOptions.length === 0}
        <p class="text-xs text-gray-500 mt-1">
          No subjects available
        </p>
      {/if}
    {/if}
  </div>
  </div>

  


