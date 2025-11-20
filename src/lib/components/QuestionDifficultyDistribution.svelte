<script>
  import { onMount } from 'svelte';
  import Chart from 'chart.js/auto';

  export let easyPercentage = 40;
  export let mediumPercentage = 35;
  export let hardPercentage = 25;

  let chartCanvas;
  let chart;

  $: totalPercentage = easyPercentage + mediumPercentage + hardPercentage;
  $: isValid = totalPercentage === 100;

  onMount(() => {
    chart = new Chart(chartCanvas, {
      type: 'bar',
      data: {
        labels: ['Distribution'],
        datasets: [
          {
            label: 'Easy',
            data: [easyPercentage],
            backgroundColor: '#22c55e',
            barPercentage: 0.8
          },
          {
            label: 'Medium',
            data: [mediumPercentage],
            backgroundColor: '#fbbf24',
            barPercentage: 0.8
          },
          {
            label: 'Hard',
            data: [hardPercentage],
            backgroundColor: '#ef4444',
            barPercentage: 0.8
          }
        ]
      },
      options: {
        indexAxis: 'y', // Makes the bar chart horizontal
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            stacked: true,
            display: false, // Hides the x-axis
            max: 100
          },
          y: {
            stacked: true,
            display: false // Hides the y-axis
          }
        }
      }
    });

    return () => chart.destroy();
  });

  // Update chart when percentages change
  $: if (chart) {
    chart.data.datasets[0].data = [easyPercentage, mediumPercentage, hardPercentage];
    chart.update();
  }
</script>

<div class="bg-white rounded-lg p-6 border">
  <h2 class="text-xl font-semibold mb-6">Question Difficulty Distribution</h2>

  <div class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Easy -->
      <div class="space-y-2">
        <span class="block text-sm text-green-600">
          Easy (%) *
        </span>
        <span class="block text-base font-medium">
          {easyPercentage}
        </span>
      </div>

      <!-- Medium -->
      <div class="space-y-2">
        <span class="block text-sm text-orange-600">
          Medium (%) *
        </span>
        <span class="block text-base font-medium">
          {mediumPercentage}
        </span>
      </div>

      <!-- Hard -->
      <div class="space-y-2">
        <span class="block text-sm text-red-600">
          Hard (%) *
        </span>
        <span class="block text-base font-medium">
          {hardPercentage}
        </span>
      </div>
    </div>

    {#if isValid}
      <div class="bg-green-50 text-green-600 p-3 rounded-md flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <span>Difficulty distribution is valid (100%)</span>
      </div>
    {/if}

    <!-- Chart Preview -->
    <div class="h-12">
      <canvas bind:this={chartCanvas}></canvas>
    </div>

    <!-- Distribution Preview -->
    <div class="space-y-2">
      <div class="flex justify-between text-sm text-gray-600">
        <span>Easy: {easyPercentage}%</span>
        <span>Medium: {mediumPercentage}%</span>
        <span>Hard: {hardPercentage}%</span>
      </div>
    </div>
  </div>
</div>