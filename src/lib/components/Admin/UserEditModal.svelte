<script>
  import { createEventDispatcher } from 'svelte';
  import { api } from '$lib/utils/api.js';
  import { authStore } from '$lib/stores/authStore.js';
  import LoadingSpinner from '../LoadingSpinner.svelte';

  export let user = null;

  const dispatch = createEventDispatcher();

  // Form state
  let formData = {
    username: '',
    role_code: '',
    is_active: true
  };

  // Password update state
  let passwordData = {
    new_password: '',
    confirm_password: ''
  };

  let showPasswordSection = false;
  let passwordStrength = 'weak';

  // UI state
  let loading = false;
  let passwordLoading = false;
  let error = '';
  let passwordError = '';
  let validationErrors = {};
  let passwordValidationErrors = {};
  let passwordSuccess = '';

  // Get correct data from auth store
  $: isAuthenticatedFromStore = $authStore.isAuthenticated;
  $: userNameFromStore = $authStore.username;
  $: roleCodeFromStore = $authStore.roleCode;
  $: roleFromStore = $authStore.role;
  
  // Enhanced debug logging
  // $: {
  //   console.log('Auth Store:', $authStore);
  //   console.log("Starting from here");
  //   console.log('isAuthenticated:', isAuthenticatedFromStore);
  //   console.log('username:', userNameFromStore);
  //   console.log('roleCode:', roleCodeFromStore);
  //   console.log('role:', roleFromStore);
  //   console.log('User being edited:', user);
  // }

  // Admin check using correct authStore properties
  $: isAdmin = !!(isAuthenticatedFromStore && roleCodeFromStore === '100');
  
  // Allow password update if user is admin OR if user is editing their own profile
  $: canUpdatePassword = !!(
    isAdmin || 
    (isAuthenticatedFromStore && userNameFromStore && user && userNameFromStore === user.username)
  );

  // // Enhanced debug logging for permission logic
  // $: {
  //   console.log('Is Admin:', isAdmin);
  //   console.log('Same User Check (username):', userNameFromStore === user?.username);
  //   console.log('Can Update Password:', canUpdatePassword);
  // }

  // Role options - updated based on documentation
  const roleOptions = [
    { code: '100', name: 'Admin' },
    { code: '101', name: 'Educator' }
  ];

  // Initialize form data when user prop changes
  $: if (user) {
    // Map the user's role_code properly
    let userRoleCode = '';
    if (user.role_code) {
      userRoleCode = user.role_code;
    } else if (user.role_name === 'admin') {
      userRoleCode = '100';
    } else if (user.role_name === 'educator') {
      userRoleCode = '101';
    } else if (user.role_id === 1) {
      userRoleCode = '100'; // Fallback for admin
    } else {
      userRoleCode = '101'; // Default to educator
    }

    formData = {
      username: user.username || '',
      role_code: userRoleCode,
      is_active: user.is_active ?? true
    };
  }

  // Watch password changes for strength indication
  $: if (passwordData.new_password && api.adminUpdatePassword?.validatePassword) {
    try {
      const validation = api.adminUpdatePassword.validatePassword({
        new_password: passwordData.new_password
      });
      passwordStrength = validation.strength || 'weak';
    } catch (e) {
      console.warn('Password validation not available:', e);
      passwordStrength = 'weak';
    }
  }

  // Form validation
  function validateForm() {
    validationErrors = {};
    let isValid = true;

    // Validate username
    if (!formData.username.trim()) {
      validationErrors.username = 'Username is required';
      isValid = false;
    } else if (formData.username.trim().length < 3) {
      validationErrors.username = 'Username must be at least 3 characters';
      isValid = false;
    } else if (formData.username.trim().length > 50) {
      validationErrors.username = 'Username cannot exceed 50 characters';
      isValid = false;
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username.trim())) {
      validationErrors.username = 'Username can only contain letters, numbers, underscores, and hyphens';
      isValid = false;
    }

    // Validate role_code
    if (!formData.role_code) {
      validationErrors.role_code = 'Role is required';
      isValid = false;
    }

    return isValid;
  }

  // Password validation
  function validatePassword() {
    passwordValidationErrors = {};
    let isValid = true;

    if (!passwordData.new_password) {
      passwordValidationErrors.new_password = 'New password is required';
      isValid = false;
    } else if (api.adminUpdatePassword?.validatePassword) {
      try {
        const validation = api.adminUpdatePassword.validatePassword({
          new_password: passwordData.new_password
        });
        
        if (!validation.isValid) {
          passwordValidationErrors.new_password = validation.errors.join('. ');
          isValid = false;
        }
      } catch (e) {
        console.warn('Password validation not available:', e);
        // Basic validation fallback
        if (passwordData.new_password.length < 8) {
          passwordValidationErrors.new_password = 'Password must be at least 8 characters long';
          isValid = false;
        }
      }
    }

    if (!passwordData.confirm_password) {
      passwordValidationErrors.confirm_password = 'Please confirm your password';
      isValid = false;
    } else if (passwordData.new_password !== passwordData.confirm_password) {
      passwordValidationErrors.confirm_password = 'Passwords do not match';
      isValid = false;
    }

    return isValid;
  }

  // Handle form submission
   async function handleSubmit() {
    if (!validateForm()) {
      return;
    }

    loading = true;
    error = '';

    try {
      // Prepare update data - Always include all required fields
      const updateData = {
        username: formData.username.trim(),
        role_code: formData.role_code,
        is_active: formData.is_active  // Always include this field
      };


      // Make API call
      const response = await api.adminListUsers.update(user.id, updateData);

      if (response.error) {
        throw new Error(response.error);
      }


      // Dispatch success event
      dispatch('userUpdated', { updatedUser: response.data });

    } catch (err) {
      // Better error handling for API responses
      let errorMessage = 'Failed to update user';
      
      if (err.message && err.message.includes('[object Object]')) {
        errorMessage = 'Invalid data provided. Please check all fields.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      error = errorMessage;
      console.error('Error updating user:', err);
    } finally {
      loading = false;
    }
  }

  // Handle password update
  async function handlePasswordUpdate() {
    if (!validatePassword()) {
      return;
    }

    passwordLoading = true;
    passwordError = '';
    passwordSuccess = '';

    try {

      // Check if the API method exists
      if (!api.adminUpdatePassword?.update) {
        throw new Error('Password update API not available');
      }

      const response = await api.adminUpdatePassword.update(user.id, {
        new_password: passwordData.new_password
      });

      if (response.error) {
        throw new Error(response.error);
      }

      passwordSuccess = 'Password updated successfully!';
      
      // Clear password form
      passwordData = {
        new_password: '',
        confirm_password: ''
      };
      
      // Hide password section after successful update
      setTimeout(() => {
        showPasswordSection = false;
        passwordSuccess = '';
      }, 3000);

    } catch (err) {
      passwordError = err.message || 'Failed to update password';
      console.error('Error updating password:', err);
    } finally {
      passwordLoading = false;
    }
  }

  // Generate strong password
  function generatePassword() {
    if (api.adminUpdatePassword?.generateStrongPassword) {
      try {
        const generated = api.adminUpdatePassword.generateStrongPassword(12);
        passwordData.new_password = generated;
        passwordData.confirm_password = generated;
      } catch (e) {
        console.warn('Password generation not available:', e);
        // Fallback password generation
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let result = '';
        for (let i = 0; i < 12; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        passwordData.new_password = result;
        passwordData.confirm_password = result;
      }
    }
    
    // Clear any existing errors
    passwordValidationErrors = {};
    passwordError = '';
  }

  // Toggle password section
  function togglePasswordSection() {
    showPasswordSection = !showPasswordSection;
    if (!showPasswordSection) {
      // Clear password data when hiding
      passwordData = {
        new_password: '',
        confirm_password: ''
      };
      passwordValidationErrors = {};
      passwordError = '';
      passwordSuccess = '';
    }
  }

  // Handle modal close
  function handleClose() {
    dispatch('close');
  }

  // Handle input changes to clear validation errors
  function handleInputChange(field) {
    if (validationErrors[field]) {
      delete validationErrors[field];
      validationErrors = { ...validationErrors };
    }
    error = '';
  }

  // Handle password input changes
  function handlePasswordInputChange(field) {
    if (passwordValidationErrors[field]) {
      delete passwordValidationErrors[field];
      passwordValidationErrors = { ...passwordValidationErrors };
    }
    passwordError = '';
    passwordSuccess = '';
  }

  // Get role name by code
  function getRoleName(code) {
    const role = roleOptions.find(r => r.code === code);
    return role ? role.name : code;
  }

  // Get password strength color
  function getPasswordStrengthColor(strength) {
    const colors = {
      'very weak': 'bg-red-500',
      'weak': 'bg-orange-500',
      'medium': 'bg-yellow-500',
      'strong': 'bg-blue-500',
      'very strong': 'bg-green-500'
    };
    return colors[strength] || 'bg-gray-300';
  }

  // Get password strength width
  function getPasswordStrengthWidth(strength) {
    const widths = {
      'very weak': '20%',
      'weak': '40%',
      'medium': '60%',
      'strong': '80%',
      'very strong': '100%'
    };
    return widths[strength] || '0%';
  }

  // Handle backdrop click
  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  }

  // Handle escape key
  function handleKeydown(event) {
    if (event.key === 'Escape') {
      handleClose();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- Modal Backdrop -->
<div 
  class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-50 flex items-center justify-center p-4"
  on:click={handleBackdropClick}
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
>
  <!-- Modal Container -->
  <div class="relative bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden transform transition-all">
    <!-- Modal Header -->
    <div class="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 id="modal-title" class="text-lg font-semibold text-gray-900">Edit User</h3>
            <p class="text-sm text-gray-600 mt-1">Update user details and permissions</p>
          </div>
        </div>
        <button
          type="button"
          class="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors duration-200"
          on:click={handleClose}
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Modal Body -->
    <div class="px-6 py-6 max-h-[70vh] overflow-y-auto">
      {#if user}
 

        <!-- Auth Warning -->
        {#if !isAuthenticatedFromStore}
          <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="ml-3">
                <h4 class="text-sm font-medium text-red-800">Authentication Issue</h4>
                <p class="text-sm text-red-700 mt-1">User is not authenticated. Please log in again.</p>
              </div>
            </div>
          </div>
        {/if}

        <!-- User Info Header -->
        <div class="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <div class="flex-shrink-0 h-10 w-10">
                <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span class="text-lg font-medium text-blue-800">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div class="ml-3">
                <h4 class="text-sm font-medium text-gray-900">User ID: #{user.id}</h4>
                <p class="text-xs text-gray-500">Created: {user.created_at_formatted || 'N/A'}</p>
                <p class="text-xs text-gray-500">Role: {user.role_name || 'Unknown'}</p>
              </div>
            </div>
            
            <!-- Password Update Button -->
            {#if canUpdatePassword}
              <button
                type="button"
                on:click={togglePasswordSection}
                class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200"
              >
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-3a1 1 0 011-1h2.586l6.243-6.243C12.121 8.48 12.975 8 14 8a2 2 0 012 2v0c0 .551.224 1.048.586 1.414z" />
                </svg>
                {showPasswordSection ? 'Hide' : 'Update'} Password
              </button>
            {:else}
              <div class="text-xs text-gray-500 italic">
                Password update not available
                {#if !isAuthenticatedFromStore}
                  (Not authenticated)
                {:else if !isAdmin && userNameFromStore !== user?.username}
                  (Not authorized)
                {/if}
              </div>
            {/if}
          </div>
        </div>

        <!-- Password Update Section -->
        {#if canUpdatePassword && showPasswordSection}
          <div class="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
            <div class="flex items-center mb-4">
              <svg class="w-5 h-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-3a1 1 0 011-1h2.586l6.243-6.243C12.121 8.48 12.975 8 14 8a2 2 0 012 2v0c0 .551.224 1.048.586 1.414z" />
              </svg>
              <h4 class="text-sm font-medium text-indigo-900">Update Password</h4>
              {#if isAdmin}
                <span class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  Admin Access
                </span>
              {:else}
                <span class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  Own Account
                </span>
              {/if}
            </div>

            <!-- Password Success Message -->
            {#if passwordSuccess}
              <div class="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
                <div class="flex">
                  <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div class="ml-3">
                    <p class="text-sm text-green-700">{passwordSuccess}</p>
                  </div>
                </div>
              </div>
            {/if}

            <!-- Password Error Message -->
            {#if passwordError}
              <div class="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <div class="flex">
                  <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div class="ml-3">
                    <p class="text-sm text-red-700">{passwordError}</p>
                  </div>
                </div>
              </div>
            {/if}

            <div class="space-y-4">
              <!-- New Password Field -->
              <div>
                <label for="new_password" class="block text-sm font-medium text-gray-700 mb-1">
                  New Password <span class="text-red-500">*</span>
                </label>
                <div class="relative">
                  <input
                    id="new_password"
                    type="password"
                    bind:value={passwordData.new_password}
                    on:input={() => handlePasswordInputChange('new_password')}
                    disabled={passwordLoading}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors duration-200 {passwordValidationErrors.new_password ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    on:click={generatePassword}
                    disabled={passwordLoading}
                    class="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-indigo-600 hover:text-indigo-800 disabled:text-gray-400"
                    title="Generate strong password"
                  >
                    Generate
                  </button>
                </div>
                
                <!-- Password Strength Indicator -->
                {#if passwordData.new_password}
                  <div class="mt-2">
                    <div class="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Password strength:</span>
                      <span class="capitalize font-medium">{passwordStrength}</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        class="h-2 rounded-full transition-all duration-300 {getPasswordStrengthColor(passwordStrength)}"
                        style="width: {getPasswordStrengthWidth(passwordStrength)}"
                      ></div>
                    </div>
                  </div>
                {/if}
                
                {#if passwordValidationErrors.new_password}
                  <p class="mt-1 text-xs text-red-600">{passwordValidationErrors.new_password}</p>
                {/if}
              </div>

              <!-- Confirm Password Field -->
              <div>
                <label for="confirm_password" class="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password <span class="text-red-500">*</span>
                </label>
                <input
                  id="confirm_password"
                  type="password"
                  bind:value={passwordData.confirm_password}
                  on:input={() => handlePasswordInputChange('confirm_password')}
                  disabled={passwordLoading}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors duration-200 {passwordValidationErrors.confirm_password ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}"
                  placeholder="Confirm new password"
                />
                {#if passwordValidationErrors.confirm_password}
                  <p class="mt-1 text-xs text-red-600">{passwordValidationErrors.confirm_password}</p>
                {/if}
              </div>

              <!-- Password Update Button -->
              <div class="flex justify-end">
                <button
                  type="button"
                  on:click={handlePasswordUpdate}
                  disabled={passwordLoading || !passwordData.new_password || !passwordData.confirm_password}
                  class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {#if passwordLoading}
                    <div class="flex items-center">
                      <LoadingSpinner size="small" color="white" />
                      <span class="ml-2">Updating...</span>
                    </div>
                  {:else}
                    <div class="flex items-center">
                      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-3a1 1 0 011-1h2.586l6.243-6.243C12.121 8.48 12.975 8 14 8a2 2 0 012 2v0c0 .551.224 1.048.586 1.414z" />
                      </svg>
                      Update Password
                    </div>
                  {/if}
                </button>
              </div>
            </div>
          </div>
        {/if}

        <!-- Error Message for general form -->
        {#if error}
          <div class="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
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
          </div>
        {/if}

        <!-- Form -->
        <form on:submit|preventDefault={handleSubmit} class="space-y-6">
          <!-- Username Field -->
          <div>
            <label for="username" class="block text-sm font-medium text-gray-700 mb-2">
              Username <span class="text-red-500">*</span>
            </label>
            <input
              id="username"
              type="text"
              bind:value={formData.username}
              on:input={() => handleInputChange('username')}
              disabled={loading}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors duration-200 {validationErrors.username ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}"
              placeholder="Enter username"
            />
            {#if validationErrors.username}
              <p class="mt-1 text-xs text-red-600">{validationErrors.username}</p>
            {/if}
          </div>

          <!-- Role Field -->
          <div>
            <label for="role" class="block text-sm font-medium text-gray-700 mb-2">
              Role <span class="text-red-500">*</span>
            </label>
            <select
              id="role"
              bind:value={formData.role_code}
              on:change={() => handleInputChange('role_code')}
              disabled={loading}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors duration-200 {validationErrors.role_code ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}"
            >
              <option value="">Select a role</option>
              {#each roleOptions as role}
                <option value={role.code}>{role.name}</option>
              {/each}
            </select>
            {#if validationErrors.role_code}
              <p class="mt-1 text-xs text-red-600">{validationErrors.role_code}</p>
            {/if}
          </div>

          <!-- Active Status Field -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-3">
              Account Status
            </label>
            <div class="flex items-center space-x-4">
              <label class="flex items-center cursor-pointer">
                <input
                  type="radio"
                  bind:group={formData.is_active}
                  value={true}
                  disabled={loading}
                  class="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 disabled:cursor-not-allowed"
                />
                <span class="ml-2 text-sm text-gray-700">
                  <span class="inline-flex items-center">
                    <div class="w-2 h-2 rounded-full bg-green-400 mr-1.5"></div>
                    Active
                  </span>
                </span>
              </label>
              <label class="flex items-center cursor-pointer">
                <input
                  type="radio"
                  bind:group={formData.is_active}
                  value={false}
                  disabled={loading}
                  class="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 disabled:cursor-not-allowed"
                />
                <span class="ml-2 text-sm text-gray-700">
                  <span class="inline-flex items-center">
                    <div class="w-2 h-2 rounded-full bg-red-400 mr-1.5"></div>
                    Inactive
                  </span>
                </span>
              </label>
            </div>
          </div>

          <!-- Current vs New Values Summary -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 class="text-sm font-medium text-blue-900 mb-3">Changes Summary</h4>
            <div class="space-y-2 text-xs">
              <div class="flex justify-between">
                <span class="text-blue-700">Username:</span>
                <span class="text-blue-900">
                  {user.username} → {formData.username}
                  {#if formData.username === user.username}
                    <span class="text-blue-600">(unchanged)</span>
                  {/if}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-blue-700">Role:</span>
                <span class="text-blue-900">
                  {user.role_name} → {getRoleName(formData.role_code)}
                  {#if (user.role_code || (user.role_name === 'admin' ? '100' : '101')) === formData.role_code}
                    <span class="text-blue-600">(unchanged)</span>
                  {/if}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-blue-700">Status:</span>
                <span class="text-blue-900">
                  {user.is_active ? 'Active' : 'Inactive'} → {formData.is_active ? 'Active' : 'Inactive'}
                  {#if formData.is_active === user.is_active}
                    <span class="text-blue-600">(unchanged)</span>
                  {/if}
                </span>
              </div>
            </div>
          </div>
        </form>
      {/if}
    </div>

    <!-- Modal Footer -->
    <div class="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
      <button
        type="button"
        on:click={handleClose}
        disabled={loading || passwordLoading}
        class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
      >
        Cancel
      </button>
      <button
        type="submit"
        on:click={handleSubmit}
        disabled={loading || passwordLoading}
        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
      >
        {#if loading}
          <div class="flex items-center">
            <LoadingSpinner size="small" color="white" />
            <span class="ml-2">Updating...</span>
          </div>
        {:else}
          <div class="flex items-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Update User
          </div>
        {/if}
      </button>
    </div>
  </div>
</div>