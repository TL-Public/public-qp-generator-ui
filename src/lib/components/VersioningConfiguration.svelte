<script>
  export let totalTime = 180;
  export let totalQuestions = 69;
  export let numberOfSets = 4;
  export let numberOfVersions = 2;
</script>

<div class="bg-white rounded-lg p-6 border">
  <h2 class="text-xl font-semibold mb-6">Exam  Configuration</h2>

  <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
    <!-- Total Time -->
    <div class="space-y-2">
      <span class="block text-sm text-gray-600">
        Total Time (minutes) *
      </span>
      <span class="block text-base font-medium">
        {totalTime}
      </span>
    </div>

    <!-- Total Questions -->
    <div class="space-y-2">
      <span class="block text-sm text-gray-600">
        Total Questions *
      </span>
      <span class="block text-base font-medium">
        {totalQuestions}
      </span>
    </div>

    <!-- Number of Sets -->
    <div class="space-y-2">
      <span class="block text-sm text-gray-600">
        Number of Sets (max 10) *
      </span>
      <span class="block text-base font-medium">
        {numberOfSets}
      </span>
    </div>

    <!-- Number of Versions -->
    <div class="space-y-2">
      <span class="block text-sm text-gray-600">
        Number of Versions (max 5) *
      </span>
      <span class="block text-base font-medium">
        {numberOfVersions}
      </span>
    </div>
  </div>
</div>