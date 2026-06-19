<script>
  let { totalSteps, currentStep, stepTitle } = $props();
</script>

<div class="flex w-full items-center justify-between py-2">
  <span class="text-dark font-semibold text-lg capitalize">
    {stepTitle}
  </span>
  <div class="flex-grow mx-4 h-px bg-gray-200"></div>
  <span class="font-medium text-subtext text-sm">
    Step {currentStep} of {totalSteps}
  </span>
</div>
