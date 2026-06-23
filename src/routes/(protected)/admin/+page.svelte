<script>

  import { authStore } from '$lib/stores/authStore.js';
  import UserManagement from '$lib/components/Admin/UserManagement.svelte';


  
  function handleLogout() {
    // You call methods on the store directly, without the '$'
    authStore.logout();
  }
</script>

<main class="min-h-screen bg-gray-50">
  {#if $authStore?.isAuthenticated  && $authStore?.roleCode === '100'}
    <div class="w-full px-4 sm:px-6 lg:px-4 py-4">
      <!-- <div class="mb-8">
        <h1 class="large-header mb-1">Admin Dashboard</h1>
        <p class="sub-heading">Manage users and system settings</p>
      </div> -->
      
      <!-- User Management Component -->
      <UserManagement />
    </div>
  {:else}
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <svg class="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <h1 class="text-2xl font-bold text-gray-900 mt-4">Admin Access Required</h1>
        <p class="text-gray-600 mt-2">You need administrator privileges to access this page.</p>
      </div>
    </div>
  {/if}
</main>