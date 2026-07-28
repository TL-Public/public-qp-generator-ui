<script>
  import { createEventDispatcher } from "svelte";
  import { api } from "$lib/utils/api.js";
  import { authStore } from "$lib/stores/authStore.js";
  import {
    generateStrongPassword,
    validatePassword as validatePasswordHelper,
  } from "$lib/utils/helper.js";
  import LoadingSpinner from "../LoadingSpinner.svelte";
  import RadioGroup from "$lib/components/RadioGroup.svelte";
  import Input from "$lib/components/Input.svelte";
  import SearchableComboBox from "$lib/components/SearchableComboBox.svelte";

  export let user = null;
  export let pageMode = false; // New prop to determine if we're in page mode or modal mode

  const dispatch = createEventDispatcher();

  // Form state
  let formData = {
    username: "",
    role_code: "",
    is_active: true,
  };

  // Password update state
  let passwordData = {
    new_password: "",
    confirm_password: "",
  };

  let showPasswordSection = false;
  let passwordStrength = "weak";

  // UI state
  let loading = false;
  let passwordLoading = false;
  let error = "";
  let passwordError = "";
  let validationErrors = {};
  let passwordValidationErrors = {};
  let passwordSuccess = "";

  // Get correct data from auth store
  $: isAuthenticatedFromStore = $authStore?.isAuthenticated ? true : false;
  $: userNameFromStore = $authStore?.username;
  $: roleCodeFromStore = $authStore?.roleCode;
  $: roleFromStore = $authStore?.role;

  // Admin check using correct authStore properties
  $: isAdmin = !!(isAuthenticatedFromStore && roleCodeFromStore === "100");

  // Allow password update if user is admin OR if user is editing their own profile
  $: canUpdatePassword = !!(
    isAdmin ||
    (isAuthenticatedFromStore &&
      userNameFromStore &&
      user &&
      userNameFromStore === user.username)
  );

  // Role options - updated based on documentation
  const roleOptions = [
    { code: "100", name: "Admin" },
    { code: "101", name: "Educator" },
  ];

  // Initialize form data when user prop changes
  $: if (user) {
    // Map the user's role_code properly
    let userRoleCode = "";
    if (user.role_code) {
      userRoleCode = user.role_code;
    } else if (user.role_name === "admin") {
      userRoleCode = "100";
    } else if (user.role_name === "educator") {
      userRoleCode = "101";
    } else if (user.role_id === 1) {
      userRoleCode = "100"; // Fallback for admin
    } else {
      userRoleCode = "101"; // Default to educator
    }

    formData = {
      username: user.username || "",
      role_code: userRoleCode,
      is_active: user.is_active ?? true,
    };
  }

  // Watch password changes for strength indication
  $: if (passwordData.new_password) {
    try {
      const validation = validatePasswordHelper({
        new_password: passwordData.new_password,
      });
      passwordStrength = validation.strength || "weak";
    } catch (e) {
      console.warn("Password validation not available:", e);
      passwordStrength = "weak";
    }
  }

  // Form validation
  function validateForm() {
    validationErrors = {};
    let isValid = true;

    // Validate username
    if (!formData.username.trim()) {
      validationErrors.username = "Username is required";
      isValid = false;
    } else if (formData.username.trim().length < 3) {
      validationErrors.username = "Username must be at least 3 characters";
      isValid = false;
    } else if (formData.username.trim().length > 50) {
      validationErrors.username = "Username cannot exceed 50 characters";
      isValid = false;
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username.trim())) {
      validationErrors.username =
        "Username can only contain letters, numbers, underscores, and hyphens";
      isValid = false;
    }

    // Validate role_code
    if (!formData.role_code) {
      validationErrors.role_code = "Role is required";
      isValid = false;
    }

    return isValid;
  }

  // Password validation
  function validatePassword() {
    passwordValidationErrors = {};
    let isValid = true;

    if (!passwordData.new_password) {
      passwordValidationErrors.new_password = "New password is required";
      isValid = false;
    } else {
      const validation = validatePasswordHelper({
        new_password: passwordData.new_password,
      });

      if (!validation.isValid) {
        passwordValidationErrors.new_password = validation.errors.join(". ");
        isValid = false;
      }
    }

    if (!passwordData.confirm_password) {
      passwordValidationErrors.confirm_password =
        "Please confirm your password";
      isValid = false;
    } else if (passwordData.new_password !== passwordData.confirm_password) {
      passwordValidationErrors.confirm_password = "Passwords do not match";
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
    error = "";

    try {
      // Prepare update data - Always include all required fields
      const updateData = {
        username: formData.username.trim(),
        role_code: formData.role_code,
        is_active: formData.is_active, // Always include this field
      };

      // Make API call
      const response = await api.adminListUsers.update(user.id, updateData);

      if (response.error) {
        throw new Error(response.error);
      }

      // Dispatch success event
      dispatch("userUpdated", {
        updatedUser: response.data,
        message: `User "${response.data.username}" updated successfully!`,
      });
    } catch (err) {
      // Better error handling for API responses
      let errorMessage = "Failed to update user";

      if (err.message && err.message.includes("[object Object]")) {
        errorMessage = "Invalid data provided. Please check all fields.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      error = errorMessage;
      console.error("Error updating user:", err);
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
    passwordError = "";
    passwordSuccess = "";

    try {
      // Check if the API method exists
      if (!api.adminUpdatePassword?.update) {
        throw new Error("Password update API not available");
      }

      const response = await api.adminUpdatePassword.update(user.id, {
        new_password: passwordData.new_password,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      passwordSuccess = "Password updated successfully!";

      // Clear password form
      passwordData = {
        new_password: "",
        confirm_password: "",
      };

      // Hide password section after successful update
      setTimeout(() => {
        showPasswordSection = false;
        passwordSuccess = "";
      }, 3000);
    } catch (err) {
      passwordError = err.message || "Failed to update password";
      console.error("Error updating password:", err);
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
        console.warn("Password generation not available:", e);
        // Fallback password generation
        const chars =
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
        let result = "";
        for (let i = 0; i < 12; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        passwordData.new_password = result;
        passwordData.confirm_password = result;
      }
    }

    // Clear any existing errors
    passwordValidationErrors = {};
    passwordError = "";
  }

  // Toggle password section
  function togglePasswordSection() {
    showPasswordSection = !showPasswordSection;
    if (!showPasswordSection) {
      // Clear password data when hiding
      passwordData = {
        new_password: "",
        confirm_password: "",
      };
      passwordValidationErrors = {};
      passwordError = "";
      passwordSuccess = "";
    }
  }

  // Handle close
  function handleClose() {
    dispatch("close");
  }

  // Handle input changes to clear validation errors
  function handleInputChange(field) {
    if (validationErrors[field]) {
      delete validationErrors[field];
      validationErrors = { ...validationErrors };
    }
    error = "";
  }

  // Handle password input changes
  function handlePasswordInputChange(field) {
    if (passwordValidationErrors[field]) {
      delete passwordValidationErrors[field];
      passwordValidationErrors = { ...passwordValidationErrors };
    }
    passwordError = "";
    passwordSuccess = "";
  }

  // Get role name by code
  function getRoleName(code) {
    const role = roleOptions.find((r) => r.code === code);
    return role ? role.name : code;
  }

  // Get password strength color
  function getPasswordStrengthColor(strength) {
    const colors = {
      "very weak": "bg-red-500",
      weak: "bg-orange-500",
      medium: "bg-yellow-500",
      strong: "bg-blue-500",
      "very strong": "bg-green-500",
    };
    return colors[strength] || "bg-gray-300";
  }

  // Get password strength width
  function getPasswordStrengthWidth(strength) {
    const widths = {
      "very weak": "20%",
      weak: "40%",
      medium: "60%",
      strong: "80%",
      "very strong": "100%",
    };
    return widths[strength] || "0%";
  }

  let activeStatusString = "Active";
  $: activeStatusString = formData.is_active ? "Active" : "Inactive";
  $: formData.is_active = activeStatusString === "Active";

  $: searchableRoleOptions = roleOptions.map((r) => ({
    id: r.code,
    name: r.name,
    code: r.code,
  }));
  let selectedRoleName = "";
  let selectedRoleId = "";

  $: {
    const matched = roleOptions.find((r) => r.code === formData.role_code);
    if (matched) {
      selectedRoleId = matched.code;
      selectedRoleName = matched.name;
    } else {
      selectedRoleId = "";
      selectedRoleName = "";
    }
  }

  function handleRoleChange(event) {
    formData.role_code = event.detail.selectedItemId || "";
    handleInputChange("role_code");
  }

  function handleRoleClear() {
    formData.role_code = "";
    handleInputChange("role_code");
  }
</script>

arma/Desktop/Desktop/Internship
project/my-app/src/lib/components/Admin/UserEditForm.svelte -->
{#if pageMode}
  <!-- Page Mode - No Modal Wrapper -->
  <div class="p-6">
    <!-- Header for Page Mode -->
    <div class="border-b border-gray-200 pb-4 mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-medium text-dark">User Information</h2>
          <p class="mt-1 text-sm text-gray-600">
            Update user details and permissions
          </p>
        </div>

        <!-- User Avatar and Info -->
        {#if user}
          <div class="flex items-center space-x-3">
            <div class="flex-shrink-0 h-10 w-10">
              <div
                class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center"
              >
                <span class="text-lg font-medium text-blue-800">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div class="text-right">
              <div class="text-xs text-gray-500">
                {user.role_name || "Unknown Role"}
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- Rest of the form content goes here (same as modal, but without modal wrapper) -->
    <!-- This includes all the form fields, password section, etc. -->

    <!-- Auth Warning -->
    {#if !isAuthenticatedFromStore}
      <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg
              class="h-5 w-5 text-red-400"
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
          <div class="ml-3">
            <h4 class="text-sm font-medium text-red-800">
              Authentication Issue
            </h4>
            <p class="text-sm text-red-700 mt-1">
              User is not authenticated. Please log in again.
            </p>
          </div>
        </div>
      </div>
    {/if}

    <!-- Password Update Section -->
    {#if canUpdatePassword}
      <div class="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center">
            <svg
              class="w-5 h-5 text-indigo-600 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-3a1 1 0 011-1h2.586l6.243-6.243C12.121 8.48 12.975 8 14 8a2 2 0 012 2v0c0 .551.224 1.048.586 1.414z"
              />
            </svg>
            <h4 class="text-sm font-medium text-indigo-900">
              Password Management
            </h4>
            {#if isAdmin}
              <span
                class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
              >
                Admin Access
              </span>
            {:else}
              <span
                class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"
              >
                Own Account
              </span>
            {/if}
          </div>

          <button
            type="button"
            on:click={togglePasswordSection}
            class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200"
          >
            {showPasswordSection ? "Hide" : "Update"} Password
          </button>
        </div>

        {#if showPasswordSection}
          <!-- Password form content (same as modal) -->
          <!-- Include all password fields, validation, etc. -->
          <!-- ... (password section content from the modal) ... -->
        {/if}
      </div>
    {/if}

    <!-- Error Message -->
    {#if error}
      <div class="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg
              class="h-5 w-5 text-red-400"
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
          <div class="ml-3">
            <p class="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    {/if}

    <!-- Form -->
    <form on:submit|preventDefault={handleSubmit} class="space-y-6">
      <!-- Username Field -->
      <Input
        label="Username"
        placeholder="Enter username"
        required={true}
        disabled={loading}
        bind:value={formData.username}
        on:handleInputData={() => handleInputChange("username")}
        validationErrors={validationErrors.username}
      />

      <!-- Role Field -->
      <SearchableComboBox
        options={searchableRoleOptions}
        selectedItemId={selectedRoleId}
        selectedItemName={selectedRoleName}
        label="Role"
        required={true}
        disabled={loading}
        placeholder="Select a role"
        on:handleDispatchComboBoxData={handleRoleChange}
        on:handleDispatchFilterData={handleRoleClear}
        validationErrors={validationErrors.role_code}
      />

      <!-- Active Status Field -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-3">
          Account Status
        </label>
        <RadioGroup
          options={["Active", "Inactive"]}
          bind:selected={activeStatusString}
        />
      </div>

      <!-- Changes Summary -->
      {#if user}
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 class="text-sm font-medium text-blue-900 mb-3">
            Changes Summary
          </h4>
          <div class="space-y-2 text-xs">
            <div class="flex justify-between">
              <span class="text-blue-700">Username:</span>
              <span class="text-blue-900">
                {user.username} → {formData.username}
                {#if formData.username === user.username}
                  <span class="text-primary">(unchanged)</span>
                {/if}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-blue-700">Role:</span>
              <span class="text-blue-900">
                {user.role_name} → {getRoleName(formData.role_code)}
                {#if (user.role_code || (user.role_name === "admin" ? "100" : "101")) === formData.role_code}
                  <span class="text-primary">(unchanged)</span>
                {/if}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-blue-700">Status:</span>
              <span class="text-blue-900">
                {user.is_active ? "Active" : "Inactive"} → {formData.is_active
                  ? "Active"
                  : "Inactive"}
                {#if formData.is_active === user.is_active}
                  <span class="text-primary">(unchanged)</span>
                {/if}
              </span>
            </div>
          </div>
        </div>
      {/if}

      <!-- Action Buttons -->
      <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
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
          disabled={loading}
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {#if loading}
            <svg
              class="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Updating...
          {:else}
            Update User
          {/if}
        </button>
      </div>
    </form>
  </div>
{:else}
  <!-- Modal Mode - Keep existing modal implementation -->
  <!-- ... (existing modal code from UserEditModal.svelte) ... -->
{/if}
