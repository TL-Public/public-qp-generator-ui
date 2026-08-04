<script>
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { api } from "$lib/utils/api.js";
  import UserEditForm from "$lib/components/Admin/UserEditForm.svelte";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";

  // Get user ID from URL params
  $: userId = $page.url.searchParams.get("id");

  // State management
  let user = null;
  let loading = false;
  let error = "";

  // Load user data when component mounts or userId changes
  $: if (userId) {
    loadUser(userId);
  }

  onMount(() => {
    // Redirect if no user ID provided
    if (!userId) {
      goto("/users?error=" + encodeURIComponent("No user ID provided"));
      return;
    }
  });

  // Function to load user data
  async function loadUser(id) {
    if (!id) return;

    loading = true;
    error = "";
    user = null;

    try {
      // First get all users and find the specific one
      // This is a workaround since we don't have a direct "get user by ID" API
      const response = await api.adminListUsers.getAll({
        page: 1,
        limit: 1000, // Large limit to get all users
      });

      if (response.error) {
        throw new Error(response.error);
      }

      // Find the user with the matching ID
      const foundUser = response.data.users.find(
        (u) => u.id.toString() === id.toString(),
      );

      if (!foundUser) {
        throw new Error("User not found");
      }

      // Format the user data
      user = api.adminListUsers.formatUser(foundUser);
      console.log("Loaded user for editing:", user);
    } catch (err) {
      error = err.message || "Failed to load user";
      console.error("Error loading user:", err);
    } finally {
      loading = false;
    }
  }

  // Handle successful user update
  function handleUserUpdated(event) {
    const { updatedUser, message } = event.detail;

    console.log("User updated successfully:", updatedUser);

    // Redirect back to user management with success message
    const successMessage =
      message || `User "${updatedUser.username}" updated successfully!`;
    goto(
      "/users?userUpdated=true&message=" + encodeURIComponent(successMessage),
    );
  }

  // Handle cancel/close - redirect back to user management
  function handleClose() {
    goto("/users");
  }

  // Handle retry when there's an error
  function handleRetry() {
    if (userId) {
      loadUser(userId);
    }
  }
</script>

<svelte:head>
  <title>Edit User - Admin Panel</title>
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

      <h1 class="text-3xl font-bold text-gray-900">Edit User</h1>
      <p class="mt-2 text-gray-600">
        {#if user}
          Update user details and permissions for <span class="font-medium"
            >{user.username}</span
          >
        {:else if loading}
          Loading user information...
        {:else}
          Update user details and permissions
        {/if}
      </p>
    </div>

    <!-- Content -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200">
      {#if loading}
        <!-- Loading State -->
        <div class="p-12 text-center">
          <LoadingSpinner size="large" message="Loading user details..." />
        </div>
      {:else if error}
        <!-- Error State -->
        <div class="p-8 text-center">
          <div
            class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4"
          >
            <svg
              class="h-6 w-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">
            Failed to Load User
          </h3>
          <p class="text-sm text-gray-600 mb-6">{error}</p>
          <div class="flex justify-center space-x-3">
            <button
              type="button"
              on:click={handleRetry}
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Try Again
            </button>
            <button
              type="button"
              on:click={handleClose}
              class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go Back
            </button>
          </div>
        </div>
      {:else if user}
        <!-- Edit Form -->
        <UserEditForm
          {user}
          on:userUpdated={handleUserUpdated}
          on:close={handleClose}
          pageMode={true}
        />
      {:else}
        <!-- No User State -->
        <div class="p-8 text-center">
          <div
            class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4"
          >
            <svg
              class="h-6 w-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">No User Found</h3>
          <p class="text-sm text-gray-600 mb-6">
            The requested user could not be found.
          </p>
          <button
            type="button"
            on:click={handleClose}
            class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Back to User Management
          </button>
        </div>
      {/if}
    </div>
  </div>
</div>
