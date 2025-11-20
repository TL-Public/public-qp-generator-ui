<script>
  export let groups = [];
  export let onUpdateGroup;
  export let onDeleteGroup;

  let selectedRows = [];

  function toggleSelectAll(event) {
    if (event.target.checked) {
      selectedRows = [...Array(groups.length).keys()];
    } else {
      selectedRows = [];
    }
  }

  function toggleSelectRow(index) {
    const position = selectedRows.indexOf(index);
    if (position === -1) {
      selectedRows = [...selectedRows, index];
    } else {
      selectedRows = selectedRows.filter(i => i !== index);
    }
  }

  $: {
    console.log('Groups in table:', groups); // Debug log
  }
</script>

<div class="overflow-x-auto">
  <table class="min-w-full">
    <thead class="border-b">
      <tr class="bg-gray-50">
        <th class="w-12 px-4 py-3">
          <input 
            type="checkbox" 
            class="h-4 w-4 rounded border-gray-300"
            on:change={toggleSelectAll}
            checked={selectedRows.length === groups.length && groups.length > 0}
          >
        </th>
        <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">Group number</th>
        <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">Group description</th>
        <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">Available questions</th>
        <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">Questions to insert</th>
        <th class="w-24 px-4 py-3"></th>
      </tr>
    </thead>
    <tbody class="divide-y divide-gray-200">
      {#each groups as group, index}
        <tr>
          <td class="px-4 py-3">
            <input 
              type="checkbox" 
              class="h-4 w-4 rounded border-gray-300"
              checked={selectedRows.includes(index)}
              on:change={() => toggleSelectRow(index)}
            >
          </td>
          <td class="px-4 py-3">{index + 1}</td>
          <td class="px-4 py-3">
            <input
              type="text"
              class="w-full px-2 py-1 border rounded"
              value={group.description}
              on:input={(e) => onUpdateGroup(index, 'description', e.target.value)}
            />
          </td>
          <td class="px-4 py-3">{group.availableQuestions}</td>
          <td class="px-4 py-3">
            <input
              type="number"
              class="w-full px-2 py-1 border rounded"
              value={group.questionsToInsert}
              min="1"
              max={group.availableQuestions}
              on:input={(e) => onUpdateGroup(index, 'questionsToInsert', parseInt(e.target.value))}
            />
          </td>
          <td class="px-4 py-3">
            <button 
              class="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
              on:click={() => onDeleteGroup(index)}
            >
              Add
            </button>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>