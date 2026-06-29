<script>
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { api, apiClient } from "$lib/utils/api.js";
  import UserTable from "./UserTable.svelte";
  import UserEditModal from "./UserEditModal.svelte";
  import UserAddModal from "./UserAddModal.svelte";
  import LoadingSpinner from "../LoadingSpinner.svelte";
  import Button from "$lib/components/Button.svelte";
  import { Plus, RefreshCcw } from "@lucide/svelte";
  import Pill from "$lib/components/Pill.svelte";
  import InlineNotification from "$lib/components/InlineNotification.svelte";
  // State management
  let users = [];
  let loading = false;
  let error = "";
  let successMessage = "";

  // Roles state
  let roleOptions = [];
  let rolesLoading = false;
  let rolesError = "";

  // Pagination state
  let currentPage = 1;
  let totalPages = 0;
  let totalUsers = 0;
  let itemsPerPage = 10;

  // Modal state
  let showEditModal = false;
  let showAddModal = false;
  let selectedUser = null;

  // Check for success message from URL params (when returning from add user page)
  $: if ($page.url.searchParams.get("userCreated") === "true") {
    const message = $page.url.searchParams.get("message");
    if (message) {
      successMessage = decodeURIComponent(message);
      // Clear the URL params
      const url = new URL($page.url);
      url.searchParams.delete("userCreated");
      url.searchParams.delete("message");
      goto(url.toString(), { replaceState: true });
    }
  }

  // Load users and roles on component mount
  onMount(() => {
    loadUsers();
    loadRoles();
  });

  // Function to load roles
  async function loadRoles() {
    rolesLoading = true;
    rolesError = "";
    try {
      const res = await apiClient({ url: "/apis/roles" });
      if (!res.ok) {
        throw new Error(`Failed to load roles:  status ${res.status}`);
      }
      const data = await res.json();
      roleOptions = Array.isArray(data) ? data : data.roles || data.data || [];
    } catch (err) {
      rolesError = err.message || "Failed to load roles";
      console.error("Error loading roles:", err);
    } finally {
      rolesLoading = false;
    }
  }

  // Function to load users
  async function loadUsers() {
    loading = true;
    error = "";

    try {
      const res = await apiClient({
        url: `/apis/users?page=${currentPage}&limit=${itemsPerPage}`,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.detail ||
            errorData.message ||
            `HTTP error! status: ${res.status}`,
        );
      }

      const responseData = await res.json();
      users = responseData.users.map((user) =>
        api.adminListUsers.formatUser(user),
      );
      totalUsers = responseData.total_users;
      totalPages = Math.ceil(totalUsers / itemsPerPage);
    } catch (err) {
      error = err.message || "Failed to load users";
      console.error("Error loading users:", err);
    } finally {
      loading = false;
    }
  }

  // Function to handle page change
  function handlePageChange(page) {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      currentPage = page;
      loadUsers();
    }
  }

  // Function to handle user edit
  function handleEditUser(user) {
    selectedUser = { ...user }; // Create a copy
    showEditModal = true;
  }

  // Function to handle user update success
  async function handleUserUpdated(event) {
    const { updatedUser } = event.detail;

    // Update the user in the local array
    const userIndex = users.findIndex((u) => u.id === updatedUser.id);
    if (userIndex !== -1) {
      users[userIndex] = api.adminListUsers.formatUser(updatedUser);
      users = [...users]; // Trigger reactivity
    }

    // Show success message
    successMessage = `User "${updatedUser.username}" updated successfully!`;

    // Close modal
    showEditModal = false;
    selectedUser = null;
  }

  // Function to close modals
  function handleCloseEditModal() {
    showEditModal = false;
    selectedUser = null;
  }

  // Function to open add user modal
  function handleAddUser() {
    showAddModal = true;
  }

  // Function to handle user addition success
  function handleUserAdded(event) {
    const { message } = event.detail;
    successMessage = message || "User added successfully!";
    showAddModal = false;
    loadUsers();
  }

  // Function to refresh users list
  function handleRefresh() {
    currentPage = 1;
    loadUsers();
    loadRoles();
  }

  // Clear error message
  function clearError() {
    error = "";
  }

  // Clear success message
  function clearSuccess() {
    successMessage = "";
  }
</script>

<!-- Rest of the component remains the same, just remove the Add User Modal section -->
<div class="bg-white rounded-lg border border-stroke">
  <!-- Header -->
  <div
    class="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-4 border-b border-gray-200"
  >
    <div
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0"
    >
      <div>
        <h2 class="large-header">User Management</h2>
        <p class="sub-heading">Manage system users and their permissions</p>
      </div>

      <!-- Actions Section -->
      <div
        class="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3"
      >
        <!-- User Count Badge -->
        <Pill variant="primary" size="md">
          {totalUsers} Total Users
        </Pill>

        <!-- Action Buttons -->
        <div class="flex space-x-2">
          <!-- Add User Button -->
          <Button on:click={handleAddUser} disabled={loading} btnType="success">
            <Plus class="h-5 w-5 " />
            <span class="hidden sm:inline">Add User</span>
            <span class="sm:hidden">Add</span>
          </Button>

          <!-- Refresh Button -->
          <Button
            on:click={handleRefresh}
            disabled={loading}
            btnType="tertiary"
          >
            <RefreshCcw class="h-5 w-5 " />
            <span class="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>
    </div>
  </div>

  <!-- Content -->
  <div class="p-4 sm:p-6">
    <!-- Success Message -->
    {#if successMessage}
      <div class="mb-4 sm:mb-6">
        <InlineNotification
          kind="success"
          title={successMessage}
          on:close={clearSuccess}
        />
      </div>
    {/if}

    <!-- Error Message -->
    {#if error}
      <div class="mb-4 sm:mb-6">
        <InlineNotification kind="error" title={error} on:close={clearError} />
      </div>
    {/if}

    <!-- Loading State -->
    {#if loading}
      <div class="text-center py-12">
        <LoadingSpinner size="large" message="Loading users..." />
      </div>
    {:else if users.length === 0 && !error}
      <!-- Empty State -->
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
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
          />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No users found</h3>
        <p class="mt-1 text-sm text-gray-500">
          No users are currently registered in the system.
        </p>
        <div class="mt-6">
          <Button type="button" on:click={handleAddUser} btnType="tertiary">
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
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Add First User
          </Button>
        </div>
      </div>
    {:else}
      <!-- Users Table -->
      <UserTable
        {users}
        {roleOptions}
        {rolesLoading}
        {rolesError}
        retryLoadRoles={loadRoles}
        {currentPage}
        {totalPages}
        {totalUsers}
        {itemsPerPage}
        on:editUser={({ detail }) => handleEditUser(detail.user)}
        on:pageChange={({ detail }) => handlePageChange(detail.page)}
      />
    {/if}
  </div>
</div>

<!-- Edit User Modal -->
{#if showEditModal && selectedUser}
  <UserEditModal
    user={selectedUser}
    {roleOptions}
    {rolesLoading}
    {rolesError}
    retryLoadRoles={loadRoles}
    on:userUpdated={handleUserUpdated}
    on:close={handleCloseEditModal}
  />
{/if}

<!-- Add User Modal -->
{#if showAddModal}
  <UserAddModal
    {roleOptions}
    {rolesLoading}
    {rolesError}
    retryLoadRoles={loadRoles}
    on:userAdded={handleUserAdded}
    on:close={() => (showAddModal = false)}
  />
{/if}
