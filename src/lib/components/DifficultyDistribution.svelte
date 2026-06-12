<script>
  import { onMount } from "svelte";
  import Chart from "chart.js/auto";
  import Card from "./Cards/Card.svelte";
  import Toggle from "./Toggle.svelte";

  // Add new props while keeping existing ones
  export let easy = 40;
  export let medium = 40;
  export let hard = 20;
  export let isValid = true;
  export let isReviewPageEnabled = false;
  export let disabled = false; // Add this line
  export let autoBalance = false;

  // Rename existing percentage variables to match the chart functionality
  $: easyPercentage = easy;
  $: mediumPercentage = medium;
  $: hardPercentage = hard;

  let chartCanvas;
  let chart;

  let easyValid = true;
  let mediumValid = true;
  let totalValid = true;
  let hardValid = true;

  $: {
    const total = easyPercentage + mediumPercentage + hardPercentage;
    isValid = total === 100;
  }

  onMount(() => {
    chart = new Chart(chartCanvas, {
      type: "bar",
      data: {
        labels: ["Distribution"],
        datasets: [
          {
            label: "Easy",
            data: [easyPercentage],
            backgroundColor: "#22c55e",
            barPercentage: 0.8,
          },
          {
            label: "Medium",
            data: [mediumPercentage],
            backgroundColor: "#fbbf24",
            barPercentage: 0.8,
          },
          {
            label: "Hard",
            data: [hardPercentage],
            backgroundColor: "#ef4444",
            barPercentage: 0.8,
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            stacked: true,
            display: false,
            max: 100,
          },
          y: {
            stacked: true,
            display: false,
          },
        },
      },
    });

    return () => chart.destroy();
  });

  $: if (chart) {
    chart.data.datasets[0].data = [easyPercentage];
    chart.data.datasets[1].data = [mediumPercentage];
    chart.data.datasets[2].data = [hardPercentage];
    chart.update();
  }
</script>

<div>
  <div class="flex items-center justify-between mb-4">
    <p class="block text-sm font-medium text-gray-700">
      Auto Balance Difficulty
    </p>
    <Toggle bind:checked={autoBalance} {disabled} />
  </div>

  {#if !autoBalance}
    <div class="grid grid-cols-3 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Easy %*
        </label>
      {#if isReviewPageEnabled}
        <div
          class="flex items-center justify-between w-full px-4 py-2.5 bg-green-50 border border-green-100 rounded-lg"
        >
          <span class="text-sm font-medium text-gray-900">{easy}%</span>
          <span class="h-2 w-2 rounded-full bg-green-400"></span>
        </div>
      {:else}
        <input
          type="number"
          min="0"
          max="100"
          bind:value={easy}
          class="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 {disabled
            ? 'bg-gray-50 cursor-not-allowed'
            : ''}"
          {disabled}
        />
      {/if}
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Medium %*
      </label>
      {#if isReviewPageEnabled}
        <div
          class="flex items-center justify-between w-full px-4 py-2.5 bg-yellow-50 border border-yellow-100 rounded-lg"
        >
          <span class="text-sm font-medium text-gray-900">{medium}%</span>
          <span class="h-2 w-2 rounded-full bg-yellow-400"></span>
        </div>
      {:else}
        <input
          type="number"
          min="0"
          max="100"
          bind:value={medium}
          class="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 {disabled
            ? 'bg-gray-50 cursor-not-allowed'
            : ''}"
          {disabled}
        />
      {/if}
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Hard %*
      </label>
      {#if isReviewPageEnabled}
        <div
          class="flex items-center justify-between w-full px-4 py-2.5 bg-red-50 border border-red-100 rounded-lg"
        >
          <span class="text-sm font-medium text-gray-700">{hard}%</span>
          <span class="h-2 w-2 rounded-full bg-red-400"></span>
        </div>
      {:else}
        <input
          type="number"
          min="0"
          max="100"
          bind:value={hard}
          class="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 {disabled
            ? 'bg-gray-50 cursor-not-allowed'
            : ''}"
          {disabled}
        />
      {/if}
    </div>
  </div>

  <div>
    <p class="text-sm text-gray-700 mb-1 flex w-full justify-between">
      <span class="font-medium"> Distribution preview </span>
      <span
        class="text-center text-sm {isValid
          ? 'text-green-600'
          : 'text-red-600'}"
      >
        Total: {easyPercentage + mediumPercentage + hardPercentage}%
        {isValid ? "Valid distribution" : "Distribution must equal 100%"}
      </span>
    </p>
    <canvas bind:this={chartCanvas} class="max-h-4"></canvas>
  </div>
  {/if}
</div>
