<script>
  import { createEventDispatcher } from "svelte";

  export let headers = [];
  export let data = [];
  export let loading = false;
  export let sortField = "";
  export let sortDirection = "desc";
  export let isAdmin = false;

  const dispatch = createEventDispatcher();

  function handleSort(field) {
    if (!["actions"].includes(field)) {
      dispatch("sort", { field });
    }
  }

  function formatDate(dateString) {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString();
    } catch (error) {
      return "Invalid Date";
    }
  }

  function getColumnWidth(key) {
    const widths = {
      exam_code: "8%",
      exam_name: "15%",
      subject: "10%",
      standard: "6%",
      medium: "8%",
      created_at: "10%",
      status: "6%",
      number_of_sets: "6%",
      number_of_versions: "6%",
      total_questions: "6%",
      exam_type: "6%",
      exam_mode: "6%",
      created_by: "8%",
      actions: "9%",
    };
    return widths[key] || "auto";
  }
</script>

{#if loading}
  <div class="text-center py-12">
    <svg
      class="animate-spin mx-auto h-8 w-8 text-primary"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      ></circle>
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
    <p class="text-gray-500 mt-2">Loading papers...</p>
  </div>
{:else if data.length === 0}
  <div class="text-center py-12">
    <svg
      class="mx-auto h-12 w-12 text-gray-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
    <h3 class="mt-2 text-sm font-medium text-gray-900">No papers found</h3>
    <p class="mt-1 text-sm text-gray-500">
      No papers match your search criteria.
    </p>
  </div>
{:else}
  <div class="border border-gray-200 rounded-lg overflow-hidden">
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            {#each headers as header}
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-150"
                style="width: {getColumnWidth(header.key)};"
                on:click={() => handleSort(header.key)}
              >
                <div class="flex items-center space-x-1">
                  <span>{header.label}</span>
                  {#if !["actions"].includes(header.key)}
                    <span class="text-gray-400">
                      {sortField === header.key
                        ? sortDirection === "asc"
                          ? "↑"
                          : "↓"
                        : "↕"}
                    </span>
                  {/if}
                </div>
              </th>
            {/each}
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {#each data as paper}
            <tr class="hover:bg-gray-50 transition-colors duration-150">
              {#each headers as header}
                <td
                  class="px-4 py-4 whitespace-nowrap text-sm"
                  style="width: {getColumnWidth(header.key)};"
                >
                  {#if header.key === "exam_name"}
                    <button
                      type="button"
                      class="text-primary hover:text-blue-800 focus:outline-none focus:underline text-left font-medium transition-colors duration-150"
                      on:click={() => dispatch("viewPaper", paper)}
                    >
                      {paper[header.key]}
                    </button>
                  {:else if header.key === "exam_code"}
                    <button
                      type="button"
                      class="text-primary hover:text-blue-800 focus:outline-none focus:underline text-left font-medium transition-colors duration-150"
                      on:click={() =>
                        dispatch("paperSummary", paper[header.key])}
                    >
                      {paper[header.key]}
                    </button>
                  {:else if header.key === "actions"}
                    <div class="flex items-center space-x-2">
                      <button
                        type="button"
                        class="text-primary hover:text-blue-800 focus:outline-none focus:underline text-xs font-medium transition-colors duration-150"
                        on:click={() => dispatch("viewPaper", paper)}
                      >
                        View
                      </button>
                      {#if isAdmin}
                        <button
                          type="button"
                          class="text-red-600 hover:text-red-800 focus:outline-none focus:underline text-xs font-medium transition-colors duration-150"
                          on:click={() => dispatch("delete", paper.exam_code)}
                        >
                          Delete
                        </button>
                      {/if}
                      <button
                        type="button"
                        class="text-green-600 hover:text-green-800 focus:outline-none focus:underline text-xs font-medium transition-colors duration-150"
                        on:click={() => dispatch("edit", paper.exam_code)}
                      >
                        Edit
                      </button>
                    </div>
                  {:else if header.key === "created_at"}
                    <span
                      class="text-xs text-gray-600"
                      title={paper[header.key]}
                    >
                      {formatDate(paper[header.key])}
                    </span>
                  {:else if header.key === "status"}
                    <span
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {paper[
                        header.key
                      ] === 'closed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'}"
                    >
                      {paper[header.key]}
                    </span>
                  {:else}
                    <div class="text-gray-900" title={paper[header.key]}>
                      {paper[header.key] || "N/A"}
                    </div>
                  {/if}
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
{/if}
