<script>
  import Card from './Cards/Card.svelte';

  export let examDetails = {
    title: 'Final Assessment',
    mode: 'Online',
    date: '05/07/2025',
    time: '17:01 - 17:02'
  };

  export let participants = {
    school: 'Central High School',
    students: '125 participants'
  };

  export let selectedSubjects = {
    mathematics: ['Algebra', 'Geometry'],
    physics: ['Mechanics', 'Thermodynamics'],
    chemistry: ['Organic Chemistry']
  };
</script>

<div class="space-y-6">
  <h2 class="text-2xl font-bold">Configuration Summary</h2>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <!-- Exam Details -->
    <div class="bg-white rounded-lg p-6">
      <h3 class="text-lg font-semibold mb-4">Exam Details</h3>
      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-2">
          <span class="text-gray-600">Title:</span>
          <span class="font-medium text-right">{examDetails.title}</span>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <span class="text-gray-600">Mode:</span>
          <span class="font-medium text-right">{examDetails.mode}</span>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <span class="text-gray-600">Date:</span>
          <span class="font-medium text-right">{examDetails.date}</span>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <span class="text-gray-600">Time:</span>
          <span class="font-medium text-right">{examDetails.time}</span>
        </div>
      </div>
    </div>

    <!-- Participants -->
    <!-- <div class="bg-white rounded-lg p-6">
      <h3 class="text-lg font-semibold mb-4">Participants</h3>
      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-2">
          <span class="text-gray-600">School:</span>
          <span class="font-medium text-right">{participants.school}</span>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <span class="text-gray-600">Students:</span>
          <span class="font-medium text-right">{participants.students}</span>
        </div>
      </div>
    </div> -->

    <!-- Selected Subjects -->
    <div class="bg-white rounded-lg p-6">
      <h3 class="text-lg font-semibold mb-4">Selected Subjects</h3>
      <div class="space-y-4">
        {#if selectedSubjects.mathematics?.length}
          <div>
            <h4 class="font-medium mb-1">Mathematics</h4>
            <div class="text-gray-600">
              {selectedSubjects.mathematics.join(', ')}
            </div>
          </div>
        {/if}
        {#if selectedSubjects.physics?.length}
          <div>
            <h4 class="font-medium mb-1">Physics</h4>
            <div class="text-gray-600">
              {selectedSubjects.physics.join(', ')}
            </div>
          </div>
        {/if}
        {#if selectedSubjects.chemistry?.length}
          <div>
            <h4 class="font-medium mb-1">Chemistry</h4>
            <div class="text-gray-600">
              {selectedSubjects.chemistry.join(', ')}
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>