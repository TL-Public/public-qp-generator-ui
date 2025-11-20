<script>
  import { createEventDispatcher } from 'svelte';
  import { api } from '$lib/utils/api.js';

  const dispatch = createEventDispatcher();

  // New prop to determine if we're in page mode or modal mode
  export let pageMode = false;

  // Form state
  let formData = {
    username: '',
    role_code: '101' // Default to teacher
  };

  // UI state
  let loading = false;
  let error = '';
  let successMessage = '';
  let defaultPassword = '';

  // Role options with correct role codes
  const roleOptions = [
    { value: '100', label: 'Admin', description: 'Administrator with full system access' },
    { value: '101', label: 'Teacher', description: 'Teacher with content creation permissions' }
  ];

  // Form validation - only check username now
  $: isFormValid = formData.username.trim() !== '';

  async function handleSubmit() {
    if (!isFormValid) return;

    loading = true;
    error = '';
    successMessage = '';
    defaultPassword = '';

    try {
      const userData = {
        username: formData.username.trim(),
        role_code: formData.role_code,
        password: "123456" // Required by API but will be overridden with default
      };

      console.log('Creating user with data:', { ...userData, password: '[REDACTED]' });

      const response = await api.auth.register(userData);

      if (response.error) {
        throw new Error(response.error);
      }

      console.log('User created successfully:', response.data);
      
      // Extract default password from response message
      const responseMessage = response.data.message || '';
      const passwordMatch = responseMessage.match(/default password: (.+)$/);
      if (passwordMatch) {
        defaultPassword = passwordMatch[1];
      }

      successMessage = responseMessage;
      
      // Dispatch success event
      dispatch('userCreated', {
        user: {
          username: userData.username,
          role_code: userData.role_code,
          default_password: defaultPassword
        },
        message: responseMessage,
        defaultPassword: defaultPassword
      });

      // In page mode, don't auto-reset form - let user decide
      if (!pageMode) {
        // Reset form after 3 seconds to show the success message (modal mode)
        setTimeout(() => {
          resetForm();
        }, 3000);
      }

    } catch (err) {
      console.error('Failed to create user:', err);
      error = err.message || 'Failed to create user';
    } finally {
      loading = false;
    }
  }

  function resetForm() {
    formData = {
      username: '',
      role_code: '101'
    };
    error = '';
    successMessage = '';
    defaultPassword = '';
  }

  function handleClose() {
    dispatch('close');
  }

  function handleBackdropClick(event) {
    // Only handle backdrop click in modal mode
    if (!pageMode && event.target === event.currentTarget) {
      handleClose();
    }
  }

  function copyPassword() {
    if (defaultPassword) {
      navigator.clipboard.writeText(defaultPassword).then(() => {
        // Optional: Show a brief "copied" indicator
        console.log('Password copied to clipboard');
      });
    }
  }
</script>

{#if pageMode}
  <!-- Page Mode - No Modal Wrapper -->
  <div class="p-6">
    <!-- Header for Page Mode -->
    <div class="border-b border-gray-200 pb-4 mb-6">
      <h2 class="text-lg font-medium text-gray-900">User Information</h2>
      <p class="mt-1 text-sm text-gray-600">
        Create a new user account with a system-generated password
      </p>
    </div>

    <!-- Form Content -->
    <div class="space-y-6">
      <!-- Success Message with Default Password -->
      {#if successMessage && defaultPassword}
        <div class="rounded-md bg-green-50 p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-green-800">User Created Successfully!</h3>
              <div class="mt-2 text-sm text-green-700">
                <p class="mb-3">{successMessage}</p>
                <div class="bg-green-100 border border-green-200 rounded-lg p-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="font-medium text-green-800">Default Password:</p>
                      <p class="font-mono text-green-900 bg-white px-3 py-2 rounded border text-lg">{defaultPassword}</p>
                    </div>
                    <button
                      type="button"
                      on:click={copyPassword}
                      class="ml-3 inline-flex items-center px-3 py-2 border border-green-300 text-sm font-medium rounded text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy Password
                    </button>
                  </div>
                  <p class="text-sm text-green-600 mt-3">⚠️ Please save this password and share it securely with the user.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      {/if}

      <!-- Error Message -->
      {#if error}
        <div class="rounded-md bg-red-50 p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">Error</h3>
              <p class="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      {/if}

      <!-- Form Fields -->
      <form on:submit|preventDefault={handleSubmit} class="space-y-6">
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <!-- Username -->
          <div>
            <label for="username" class="block text-sm font-medium text-gray-700">
              Username <span class="text-red-500">*</span>
            </label>
            <div class="mt-1">
              <input
                type="text"
                id="username"
                bind:value={formData.username}
                required
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Enter username"
                disabled={loading || successMessage}
              />
            </div>
            <p class="mt-1 text-xs text-gray-500">
              This will be the user's login username
            </p>
          </div>

          <!-- Role -->
          <div>
            <label for="role" class="block text-sm font-medium text-gray-700">
              Role <span class="text-red-500">*</span>
            </label>
            <div class="mt-1">
              <select
                id="role"
                bind:value={formData.role_code}
                required
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                disabled={loading || successMessage}
              >
                {#each roleOptions as role}
                  <option value={role.value}>{role.label}</option>
                {/each}
              </select>
            </div>
            {#each roleOptions as role}
              {#if role.value === formData.role_code}
                <p class="mt-1 text-sm text-gray-600">{role.description}</p>
              {/if}
            {/each}
          </div>
        </div>

        <!-- Password Info -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-blue-800">Password Information</h3>
              <div class="mt-1 text-sm text-blue-700">
                <p>A default password will be automatically generated by the system and displayed after successful user creation.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          {#if successMessage}
            <!-- Show "Create Another" and "Back" buttons after success -->
            <button
              type="button"
              on:click={resetForm}
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Create Another User
            </button>
            <button
              type="button"
              on:click={handleClose}
              class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Back to User Management
            </button>
          {:else}
            <!-- Show "Create User" and "Cancel" buttons during form -->
            <button
              type="button"
              on:click={handleClose}
              disabled={loading}
              class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid || loading}
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {#if loading}
                <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              {:else}
                Create User
              {/if}
            </button>
          {/if}
        </div>
      </form>
    </div>
  </div>
{:else}
  <!-- Modal Mode - Original Implementation -->
  <!-- Modal Backdrop -->
  <div 
    class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-50"
    on:click={handleBackdropClick}
    on:keydown={(e) => e.key === 'Escape' && handleClose()}
  >
    <!-- Modal Container -->
    <div class="fixed inset-0 z-10 overflow-y-auto">
      <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <!-- Modal Content -->
        <div 
          class="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
          on:click|stopPropagation
        >
          <!-- Header -->
          <div class="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 sm:px-6 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-medium leading-6 text-gray-900">
                  Add New User
                </h3>
                <p class="mt-1 text-sm text-gray-600">
                  Create a new user account with a system-generated password
                </p>
              </div>
              <button
                type="button"
                class="rounded-md bg-white text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                on:click={handleClose}
              >
                <span class="sr-only">Close</span>
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Rest of modal content... (keep existing modal implementation) -->
          <!-- [Previous modal implementation content goes here] -->
        </div>
      </div>
    </div>
  </div>
{/if}