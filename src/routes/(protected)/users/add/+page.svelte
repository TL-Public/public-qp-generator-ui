<script>
  import { goto } from "$app/navigation";
  import AddUsers from "$lib/components/Admin/AddUsers.svelte";

  // Handle successful user creation
  function handleUserCreated(event) {
    const { user, message, defaultPassword } = event.detail;

    // You can show a success toast here or handle the success state

    // Optionally redirect back to user management with success message
    // You can pass the success message via URL params or store
    goto("/users?userCreated=true&message=" + encodeURIComponent(message));
  }

  // Handle cancel/close - redirect back to user management
  function handleClose() {
    goto("/users");
  }
</script>

<svelte:head>
  <title>Add New User - Admin Panel</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
  <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center space-x-3 mb-4">
        <!-- Back Button -->
        <button
          type="button"
          on:click={handleClose}
          class="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200"
        >
          <svg
            class="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to User Management
        </button>
      </div>

      <h1 class="text-3xl font-bold text-gray-900">Add New User</h1>
      <p class="mt-2 text-gray-600">
        Create a new user account with system-generated credentials
      </p>
    </div>

    <!-- Add Users Component (without modal wrapper) -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200">
      <AddUsers
        on:userCreated={handleUserCreated}
        on:close={handleClose}
        pageMode={true}
      />
    </div>
  </div>
</div>
