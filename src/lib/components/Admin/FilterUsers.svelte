<script>
  import { createEventDispatcher } from "svelte";
  import Input from "$lib/components/Input.svelte";
  import SearchableComboBox from "$lib/components/SearchableComboBox.svelte";

  const dispatch = createEventDispatcher();

  // Filter state
  let filters = {
    name: "",
    username: "",
    roles: [],
    // Teacher-specific filters
    blocks: [],
    schools: [],
    subjects: [],
    classes: [],
  };

  // Show/hide advanced filters
  let showAdvancedFilters = false;

  // Show/hide dropdowns
  let showRoleDropdown = false;
  let showBlockDropdown = false;
  let showSchoolDropdown = false;
  let showSubjectDropdown = false;
  let showClassDropdown = false;

  export let roleOptions = [];
  export let rolesLoading = false;
  export let rolesError = "";
  export let retryLoadRoles = () => {};

  $: searchableRoleOptions = Array.isArray(roleOptions)
    ? roleOptions.map((role) => {
        const name = role.name || role.role_name || role.label || "";
        const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
        return {
          id: role.code || role.role_code || role.id,
          name: capitalizedName,
          value: (role.role_name || role.name || "").toLowerCase(),
        };
      })
    : [];

  const blockOptions = [
    { id: 1, name: "Block A", value: "block-a" },
    { id: 2, name: "Block B", value: "block-b" },
    { id: 3, name: "Block C", value: "block-c" },
    { id: 4, name: "Block D", value: "block-d" },
  ];

  const schoolOptions = [
    { id: 1, name: "Central High School", value: "central-high" },
    { id: 2, name: "East Elementary", value: "east-elementary" },
    { id: 3, name: "West Middle School", value: "west-middle" },
    { id: 4, name: "North Secondary", value: "north-secondary" },
  ];

  const subjectOptions = [
    { id: 1, name: "Mathematics", value: "mathematics" },
    { id: 2, name: "Science", value: "science" },
    { id: 3, name: "English", value: "english" },
    { id: 4, name: "History", value: "history" },
    { id: 5, name: "Geography", value: "geography" },
    { id: 6, name: "Physics", value: "physics" },
    { id: 7, name: "Chemistry", value: "chemistry" },
    { id: 8, name: "Biology", value: "biology" },
  ];

  const classOptions = [
    { id: 1, name: "Grade 1", value: "grade-1" },
    { id: 2, name: "Grade 2", value: "grade-2" },
    { id: 3, name: "Grade 3", value: "grade-3" },
    { id: 4, name: "Grade 4", value: "grade-4" },
    { id: 5, name: "Grade 5", value: "grade-5" },
    { id: 6, name: "Grade 6", value: "grade-6" },
    { id: 7, name: "Grade 7", value: "grade-7" },
    { id: 8, name: "Grade 8", value: "grade-8" },
    { id: 9, name: "Grade 9", value: "grade-9" },
    { id: 10, name: "Grade 10", value: "grade-10" },
    { id: 11, name: "Grade 11", value: "grade-11" },
    { id: 12, name: "Grade 12", value: "grade-12" },
  ];

  // Check if teacher role is selected to show additional filters
  $: showTeacherFilters = filters.roles.some((role) => role === "educator");

  // Check if any filters are active
  $: hasActiveFilters =
    filters.name.trim() !== "" ||
    filters.username.trim() !== "" ||
    filters.roles.length > 0 ||
    filters.blocks.length > 0 ||
    filters.schools.length > 0 ||
    filters.subjects.length > 0 ||
    filters.classes.length > 0;

  // Apply filters
  function applyFilters() {
    dispatch("filtersChanged", { filters });
  }

  // Clear all filters
  function clearFilters() {
    filters = {
      name: "",
      username: "",
      roles: [],
      blocks: [],
      schools: [],
      subjects: [],
      classes: [],
    };
    showAdvancedFilters = false;
    closeAllDropdowns();
    dispatch("filtersChanged", { filters });
  }

  // Handle multiselect changes
  function handleMultiSelectChange(filterKey, value, checked) {
    if (checked) {
      filters[filterKey] = [...filters[filterKey], value];
    } else {
      filters[filterKey] = filters[filterKey].filter((item) => item !== value);
    }

    // Auto-apply filters on change
    applyFilters();
  }

  // Handle text input changes with debounce
  let debounceTimer;
  function handleTextChange() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      applyFilters();
    }, 300);
  }

  // Toggle dropdowns
  function toggleDropdown(dropdownName) {
    closeAllDropdowns();
    switch (dropdownName) {
      case "role":
        showRoleDropdown = !showRoleDropdown;
        break;
      case "block":
        showBlockDropdown = !showBlockDropdown;
        break;
      case "school":
        showSchoolDropdown = !showSchoolDropdown;
        break;
      case "subject":
        showSubjectDropdown = !showSubjectDropdown;
        break;
      case "class":
        showClassDropdown = !showClassDropdown;
        break;
    }
  }

  function closeAllDropdowns() {
    showRoleDropdown = false;
    showBlockDropdown = false;
    showSchoolDropdown = false;
    showSubjectDropdown = false;
    showClassDropdown = false;
  }

  // Handle click outside to close dropdowns
  function handleClickOutside(event) {
    if (!event.target.closest(".dropdown-container")) {
      closeAllDropdowns();
    }
  }

  // Search function for the button
  let selectedRoleName = "";
  let selectedRoleId = "";

  $: {
    if (filters.roles.length > 0) {
      const role = searchableRoleOptions.find(
        (r) => r.value === filters.roles[0],
      );
      if (role) {
        selectedRoleId = role.id;
        selectedRoleName = role.name;
      }
    } else {
      selectedRoleId = "";
      selectedRoleName = "";
    }
  }

  function handleRoleChange(event) {
    const roleVal =
      event.detail.value ||
      (event.detail.selectedItemName || event.detail.name || "").toLowerCase();
    console.log(event.detail);
    filters.roles = roleVal ? [roleVal] : [];
    applyFilters();
  }

  function handleRoleClear() {
    filters.roles = [];
    applyFilters();
  }
</script>

<svelte:window on:click={handleClickOutside} />

<div class=" rounded-lg p-6 mb-6 border border-stroke">
  <!-- Header with Search Filters icon -->
  <!-- <div class="flex items-center mb-6">
    <svg
      class="w-5 h-5 text-gray-400 mr-2"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z"
      />
    </svg>
    <h3 class="text-base font-medium text-gray-700">Search Filters</h3>
  </div> -->

  <!-- Basic Filters Grid -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <!-- Name Field -->
    <!-- <Input
      label="Name"
      placeholder="Search by username..."
      bind:value={filters.name}
      on:handleInputData={handleTextChange}
    /> -->

    <!-- Username Field -->
    <Input
      label="Username"
      placeholder="Search by username..."
      bind:value={filters.username}
      on:handleInputData={handleTextChange}
    />

    <!-- Role Field -->
    <SearchableComboBox
      options={searchableRoleOptions}
      selectedItemId={selectedRoleId}
      selectedItemName={selectedRoleName}
      label="Role"
      placeholder="Select role..."
      loading={rolesLoading}
      validationErrors={rolesError}
      errorHandler={retryLoadRoles}
      on:handleDispatchComboBoxData={handleRoleChange}
      on:handleDispatchFilterData={handleRoleClear}
    />
  </div>

  <!-- Teacher-specific Filters -->
  <!-- {#if showTeacherFilters}
    <div class="mt-8 pt-6 border-t border-gray-200">
      <h4 class="text-sm font-medium text-gray-700 mb-4">
        Teacher-specific Filters
      </h4>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="dropdown-container relative">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Blocks
          </label>
          <div class="relative">
            <button
              type="button"
              on:click={() => toggleDropdown("block")}
              class="w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between"
            >
              <span class="text-gray-500 text-sm">
                {#if filters.blocks.length === 0}
                  Select blocks...
                {:else if filters.blocks.length === 1}
                  {blockOptions.find((b) => b.value === filters.blocks[0])
                    ?.name}
                {:else}
                  {filters.blocks.length} blocks selected
                {/if}
              </span>
              <svg
                class="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {#if showBlockDropdown}
              <div
                class="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-auto"
              >
                {#each blockOptions as block}
                  <label
                    class="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.blocks.includes(block.value)}
                      on:change={(e) =>
                        handleMultiSelectChange(
                          "blocks",
                          block.value,
                          e.target.checked,
                        )}
                      class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span class="ml-3 text-sm text-gray-700">{block.name}</span>
                  </label>
                {/each}
              </div>
            {/if}
          </div>
        </div>

        <div class="dropdown-container relative">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Schools
          </label>
          <div class="relative">
            <button
              type="button"
              on:click={() => toggleDropdown("school")}
              class="w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between"
            >
              <span class="text-gray-500 text-sm">
                {#if filters.schools.length === 0}
                  Select schools...
                {:else if filters.schools.length === 1}
                  {schoolOptions.find((s) => s.value === filters.schools[0])
                    ?.name}
                {:else}
                  {filters.schools.length} schools selected
                {/if}
              </span>
              <svg
                class="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {#if showSchoolDropdown}
              <div
                class="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-auto"
              >
                {#each schoolOptions as school}
                  <label
                    class="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.schools.includes(school.value)}
                      on:change={(e) =>
                        handleMultiSelectChange(
                          "schools",
                          school.value,
                          e.target.checked,
                        )}
                      class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span class="ml-3 text-sm text-gray-700">{school.name}</span
                    >
                  </label>
                {/each}
              </div>
            {/if}
          </div>
        </div>

        <div class="dropdown-container relative">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Subjects
          </label>
          <div class="relative">
            <button
              type="button"
              on:click={() => toggleDropdown("subject")}
              class="w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between"
            >
              <span class="text-gray-500 text-sm">
                {#if filters.subjects.length === 0}
                  Select subjects...
                {:else if filters.subjects.length === 1}
                  {subjectOptions.find((s) => s.value === filters.subjects[0])
                    ?.name}
                {:else}
                  {filters.subjects.length} subjects selected
                {/if}
              </span>
              <svg
                class="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {#if showSubjectDropdown}
              <div
                class="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-auto"
              >
                {#each subjectOptions as subject}
                  <label
                    class="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.subjects.includes(subject.value)}
                      on:change={(e) =>
                        handleMultiSelectChange(
                          "subjects",
                          subject.value,
                          e.target.checked,
                        )}
                      class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span class="ml-3 text-sm text-gray-700"
                      >{subject.name}</span
                    >
                  </label>
                {/each}
              </div>
            {/if}
          </div>
        </div>

        <div class="dropdown-container relative">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Classes
          </label>
          <div class="relative">
            <button
              type="button"
              on:click={() => toggleDropdown("class")}
              class="w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between"
            >
              <span class="text-gray-500 text-sm">
                {#if filters.classes.length === 0}
                  Select classes...
                {:else if filters.classes.length === 1}
                  {classOptions.find((c) => c.value === filters.classes[0])
                    ?.name}
                {:else}
                  {filters.classes.length} classes selected
                {/if}
              </span>
              <svg
                class="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {#if showClassDropdown}
              <div
                class="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-auto"
              >
                {#each classOptions as class_option}
                  <label
                    class="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.classes.includes(class_option.value)}
                      on:change={(e) =>
                        handleMultiSelectChange(
                          "classes",
                          class_option.value,
                          e.target.checked,
                        )}
                      class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span class="ml-3 text-sm text-gray-700"
                      >{class_option.name}</span
                    >
                  </label>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>
  {/if} -->

  <!-- Action Buttons -->
  <!-- <div class="flex justify-end space-x-3 mt-8">
    <button
      type="button"
      on:click={clearFilters}
      disabled={!hasActiveFilters}
      class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
    >
      <svg
        class="w-4 h-4 mr-2"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
      Clear Filters
    </button>

    <button
      type="button"
      on:click={handleSearch}
      class="inline-flex items-center px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
    >
      <svg
        class="w-4 h-4 mr-2"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      Search
    </button>
  </div> -->
</div>
