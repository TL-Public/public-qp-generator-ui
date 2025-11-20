<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { api } from '$lib/utils/api.js';
  import UserTable from './UserTable.svelte';
  import UserEditModal from './UserEditModal.svelte';
  import LoadingSpinner from '../LoadingSpinner.svelte';

  // State management
  let users = [];
  let loading = false;
  let error = '';
  let successMessage = '';

  // Pagination state
  let currentPage = 1;
  let totalPages = 0;
  let totalUsers = 0;
  let itemsPerPage = 10;

  // Modal state
  let showEditModal = false;
  let selectedUser = null;

  // Check for success message from URL params (when returning from add user page)
  $: if ($page.url.searchParams.get('userCreated') === 'true') {
    const message = $page.url.searchParams.get('message');
    if (message) {
      successMessage = decodeURIComponent(message);
      // Clear the URL params
      const url = new URL($page.url);
      url.searchParams.delete('userCreated');
      url.searchParams.delete('message');
      goto(url.toString(), { replaceState: true });
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        successMessage = '';
      }, 5000);
    }
  }

  // Load users on component mount
  onMount(() => {
    loadUsers();
  });

  // Function to load users
  async function loadUsers() {
    loading = true;
    error = '';
    
    try {
      const response = await api.adminListUsers.getAll({
        page: currentPage,
        limit: itemsPerPage
      });

      if (response.error) {
        throw new Error(response.error);
      }

      users = response.data.users.map(user => api.adminListUsers.formatUser(user));
      totalUsers = response.data.total_users;
      totalPages = Math.ceil(totalUsers / itemsPerPage);

      console.log(`Loaded ${users.length} users (Page ${currentPage} of ${totalPages})`);

    } catch (err) {
      error = err.message || 'Failed to load users';
      console.error('Error loading users:', err);
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
    const userIndex = users.findIndex(u => u.id === updatedUser.id);
    if (userIndex !== -1) {
      users[userIndex] = api.adminListUsers.formatUser(updatedUser);
      users = [...users]; // Trigger reactivity
    }

    // Show success message
    successMessage = `User "${updatedUser.username}" updated successfully!`;
    
    // Clear success message after 5 seconds
    setTimeout(() => {
      successMessage = '';
    }, 5000);

    // Close modal
    showEditModal = false;
    selectedUser = null;
  }

  // Function to close modals
  function handleCloseEditModal() {
    showEditModal = false;
    selectedUser = null;
  }

  // Function to navigate to add user page
  function handleAddUser() {
    goto('/admin/addUsers');
  }

  // Function to refresh users list
  function handleRefresh() {
    currentPage = 1;
    loadUsers();
  }

  // Clear error message
  function clearError() {
    error = '';
  }

  // Clear success message
  function clearSuccess() {
    successMessage = '';
  }
</script>

<!-- Rest of the component remains the same, just remove the Add User Modal section -->
<div class="bg-white rounded-lg shadow-sm border border-gray-200">
  <!-- Header -->
  <div class="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-4 border-b border-gray-200">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
      <div>
        <h2 class="text-lg sm:text-xl font-semibold text-gray-900">User Management</h2>
        <p class="text-sm text-gray-600 mt-1">
          Manage system users and their permissions
        </p>
      </div>
      
      <!-- Actions Section -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
        <!-- User Count Badge -->
        <span class="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
          {totalUsers} Total Users
        </span>
        
        <!-- Action Buttons -->
        <div class="flex space-x-2">
          <!-- Add User Button -->
          <button
            on:click={handleAddUser}
            disabled={loading}
            class="inline-flex items-center px-3 sm:px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span class="hidden sm:inline">Add User</span>
            <span class="sm:hidden">Add</span>
          </button>
          
          <!-- Refresh Button -->
          <button
            on:click={handleRefresh}
            disabled={loading}
            class="inline-flex items-center px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <svg class="w-4 h-4 mr-2 {loading ? 'animate-spin' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span class="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Content -->
  <div class="p-4 sm:p-6">
    <!-- Success Message -->
    {#if successMessage}
      <div class="mb-4 sm:mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
        <div class="flex items-center justify-between">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm text-green-700">{successMessage}</p>
            </div>
          </div>
          <button
            on:click={clearSuccess}
            class="text-green-400 hover:text-green-600 transition-colors duration-200"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    {/if}

    <!-- Error Message -->
    {#if error}
      <div class="mb-4 sm:mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="flex items-center justify-between">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm text-red-700">{error}</p>
            </div>
          </div>
          <button
            on:click={clearError}
            class="text-red-400 hover:text-red-600 transition-colors duration-200"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
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
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No users found</h3>
        <p class="mt-1 text-sm text-gray-500">No users are currently registered in the system.</p>
        <div class="mt-6">
          <button
            type="button"
            on:click={handleAddUser}
            class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add First User
          </button>
        </div>
      </div>
    {:else}
      <!-- Users Table -->
      <UserTable 
        {users} 
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
    on:userUpdated={handleUserUpdated}
    on:close={handleCloseEditModal}
  />
{/if}

