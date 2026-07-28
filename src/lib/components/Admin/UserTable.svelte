<script>
  import { createEventDispatcher } from "svelte";
  import FilterUsers from "./FilterUsers.svelte";
  import Pagination from "../SearchPageComponents/Pagination.svelte";
  import DataTable from "../DataTable.svelte";
  import Pill from "$lib/components/Pill.svelte";

  export let users = [];
  export let roleOptions = [];
  export let rolesLoading = false;
  export let rolesError = "";
  export let retryLoadRoles = () => {};
  export let currentPage = 1;
  export let totalPages = 1;
  export let totalUsers = 0;
  export let itemsPerPage = 10;

  const dispatch = createEventDispatcher();

  // Current filters
  let currentFilters = {};

  // Apply search filters
  $: filteredUsers = users.filter((user) => {
    // Apply search filters
    if (currentFilters.name && currentFilters.name.trim()) {
      const nameSearch = currentFilters.name.toLowerCase();
      const fullName =
        `${user.first_name || ""} ${user.last_name || ""}`.toLowerCase();
      if (
        !fullName.includes(nameSearch) &&
        !(user.username || "").toLowerCase().includes(nameSearch)
      ) {
        return false;
      }
    }

    if (currentFilters.username && currentFilters.username.trim()) {
      const usernameSearch = currentFilters.username.toLowerCase();
      if (!(user.username || "").toLowerCase().includes(usernameSearch)) {
        return false;
      }
    }

    if (currentFilters.roles && currentFilters.roles.length > 0) {
      const userRole = user.role_name?.toLowerCase();
      const hasMatchingRole = currentFilters.roles.some((role) => {
        return role?.toLowerCase() === userRole;
      });
      if (!hasMatchingRole) return false;
    }

    return true;
  });

  function handleEdit(user) {
    dispatch("editUser", { user });
  }

  function handlePageChange(event) {
    const page = event.detail;
    dispatch("pageChange", { page });
  }

  function handleFiltersChanged(event) {
    currentFilters = event.detail.filters;
    // Reset to first page when filters change
    dispatch("pageChange", { page: 1 });
  }

  function getStatusBadgeClass(isActive) {
    return isActive
      ? "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
      : "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800";
  }

  function getRoleBadgeClass(roleId) {
    switch (roleId) {
      case 1:
        return "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800";
      case 2:
        return "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800";
      default:
        return "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800";
    }
  }

  const tableHeaders = [
    // { key: 'id', name: 'ID', width: '8%', hideOnMobile: true },
    { key: "username", name: "Username", width: "25%" },
    { key: "role_name", name: "Role", width: "15%", hideOnMobile: true },
    { key: "status_text", name: "Status", width: "12%" },
    {
      key: "created_at_formatted",
      name: "Created",
      width: "20%",
      hideOnMobile: true,
    },
    {
      key: "updated_at_formatted",
      name: "Updated",
      width: "15%",
      hideOnMobile: true,
    },
  ];

  const actionConfigObject = [
    {
      actionName: "edit",
      label: "Edit",
    },
  ];

  const customRenderers = {
    role_name: (user) => ({
      component: Pill,
      props: {
        size: "sm",
        variant: user.role_id === 1 ? "primary" : "secondary",
        label: user.role_name,
      },
    }),
    status_text: (user) => ({
      component: Pill,
      props: {
        size: "sm",
        variant: user.is_active ? "success" : "danger",
        label: `
          <div class="flex items-center">
            <div class="w-1.5 h-1.5 rounded-full ${user.is_active ? "bg-green-400" : "bg-red-400"} mr-1.5"></div>
            ${user.status_text}
          </div>
        `,
      },
    }),
  };

  function handleTableAction(event) {
    const { actionName, actionData } = event.detail;
    if (actionName === "edit") {
      handleEdit(actionData);
    }
  }
</script>

<!-- Search and Filter Component -->
<FilterUsers
  {roleOptions}
  {rolesLoading}
  {rolesError}
  {retryLoadRoles}
  on:filtersChanged={handleFiltersChanged}
/>

<!-- Results Summary -->
{#if Object.keys(currentFilters).some((key) => currentFilters[key] && (Array.isArray(currentFilters[key]) ? currentFilters[key].length > 0 : currentFilters[key].trim() !== ""))}
  <div class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <svg
          class="w-4 h-4 text-primary"
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
        <span class="text-sm font-medium text-blue-800">
          Showing {filteredUsers.length} of {users.length} users
        </span>
      </div>
      <span class="text-xs text-primary">Filters applied</span>
    </div>
  </div>
{/if}

<!-- Empty State for Desktop -->
{#if filteredUsers.length === 0}
  <div
    class="hidden md:block text-center py-12 border border-gray-200 rounded-lg"
  >
    <div class="text-gray-400 text-6xl mb-4">👥</div>
    <h3 class="text-lg font-medium text-gray-900 mb-2">No users found</h3>
    <p class="text-sm text-gray-500">
      {#if Object.keys(currentFilters).some((key) => currentFilters[key] && (Array.isArray(currentFilters[key]) ? currentFilters[key].length > 0 : currentFilters[key].trim() !== ""))}
        No users match the current filters. Try adjusting your search criteria.
      {:else}
        No users are currently registered in the system.
      {/if}
    </p>
  </div>
{/if}
<!-- Desktop Table View -->
<div class="hidden md:block">
  <DataTable
    tableHeadersDisplay={tableHeaders}
    tableData={filteredUsers}
    showPagination={false}
    serverSidePagination={true}
    apiCurrentPage={currentPage}
    apiTotalItems={filteredUsers.length}
    apiPageSize={itemsPerPage}
    {actionConfigObject}
    {customRenderers}
    notFoundMessage="No users found matching your filters. Try adjusting your search criteria."
    on:tableActionClick={handleTableAction}
  />

  <!-- Use the existing Pagination component -->

  <Pagination {currentPage} {totalPages} on:pageChange={handlePageChange} />
</div>

<!-- Mobile Card View -->
<div class="md:hidden">
  {#if filteredUsers.length === 0}
    <div class="text-center py-8">
      <div class="text-gray-400 text-4xl mb-4">👥</div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">No users found</h3>
      <p class="text-sm text-gray-500">
        {#if Object.keys(currentFilters).some((key) => currentFilters[key] && (Array.isArray(currentFilters[key]) ? currentFilters[key].length > 0 : currentFilters[key].trim() !== ""))}
          No users match the current filters. Try adjusting your search
          criteria.
        {:else}
          No users are currently registered in the system.
        {/if}
      </p>
    </div>
  {:else}
    <div class="space-y-4">
      {#each filteredUsers as user}
        <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div class="flex items-start justify-between mb-3">
            <!-- User Info -->
            <div class="flex items-center space-x-3">
              <div class="flex-shrink-0 h-10 w-10">
                <div
                  class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center"
                >
                  <span class="text-sm font-medium text-blue-800">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div>
                <div class="text-sm font-medium text-gray-900">
                  {user.username}
                </div>
                <div class="text-xs text-gray-500">
                  ID: #{user.id}
                </div>
              </div>
            </div>

            <!-- Status Badge -->
            <Pill variant={user.is_active ? "success" : "danger"} size="sm">
              <div class="flex items-center">
                <div
                  class="w-1.5 h-1.5 rounded-full {user.is_active
                    ? 'bg-green-400'
                    : 'bg-red-400'} mr-1.5"
                ></div>
                {user.status_text}
              </div>
            </Pill>
          </div>

          <!-- Role Badge -->
          <div class="mb-3">
            <Pill
              variant={user.role_id === 1 ? "primary" : "secondary"}
              size="sm"
            >
              {user.role_name}
            </Pill>
          </div>

          <!-- Dates -->
          <div class="grid grid-cols-1 gap-2 mb-4">
            <div class="text-xs text-gray-500">
              <span class="font-medium">Created:</span>
              {user.created_at_formatted}
            </div>
            <div class="text-xs text-gray-500">
              <span class="font-medium">Updated:</span>
              {user.updated_at_formatted}
            </div>
          </div>

          <!-- Action Button -->
          <button
            type="button"
            class="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-150"
            on:click={() => handleEdit(user)}
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
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit User
          </button>
        </div>
      {/each}
    </div>
  {/if}
</div>
