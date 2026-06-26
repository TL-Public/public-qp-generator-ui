<script>
  import { createEventDispatcher } from "svelte";
  import { api, apiClient } from "$lib/utils/api.js";
  import { authStore } from "$lib/stores/authStore.js";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import PortalModal from "$lib/components/PortalModal.svelte";
  import Button from "$lib/components/Button.svelte";
  import { SquarePen, X, Wrench, Eye, EyeOff } from "@lucide/svelte";
  import RadioGroup from "$lib/components/RadioGroup.svelte";
  import Input from "$lib/components/Input.svelte";
  import SearchableComboBox from "$lib/components/SearchableComboBox.svelte";
  import InlineNotification from "$lib/components/InlineNotification.svelte";
  export let user = null;

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
  let showNewPassword = false;
  let showConfirmPassword = false;

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
  $: if (
    passwordData.new_password &&
    api.adminUpdatePassword?.validatePassword
  ) {
    try {
      const validation = api.adminUpdatePassword.validatePassword({
        new_password: passwordData.new_password,
      });
      passwordStrength = validation.strength || "weak";
    } catch (e) {
      console.warn("Password validation not available:", e);
      passwordStrength = "weak";
    }
  }

  // Reactive check to see if passwords match when edited
  $: {
    if (passwordData.new_password && passwordData.confirm_password) {
      if (passwordData.new_password !== passwordData.confirm_password) {
        passwordValidationErrors.confirm_password = "Passwords do not match";
      } else {
        if (
          passwordValidationErrors.confirm_password === "Passwords do not match"
        ) {
          delete passwordValidationErrors.confirm_password;
          passwordValidationErrors = { ...passwordValidationErrors };
        }
      }
    } else if (!passwordData.confirm_password) {
      if (
        passwordValidationErrors.confirm_password === "Passwords do not match"
      ) {
        delete passwordValidationErrors.confirm_password;
        passwordValidationErrors = { ...passwordValidationErrors };
      }
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
    } else if (api.adminUpdatePassword?.validatePassword) {
      try {
        const validation = api.adminUpdatePassword.validatePassword({
          new_password: passwordData.new_password,
        });

        if (!validation.isValid) {
          passwordValidationErrors.new_password = validation.errors.join(". ");
          isValid = false;
        }
      } catch (e) {
        console.warn("Password validation not available:", e);
        // Basic validation fallback
        if (passwordData.new_password.length < 8) {
          passwordValidationErrors.new_password =
            "Password must be at least 8 characters long";
          isValid = false;
        }
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

      // Make API call via SvelteKit API route
      const response = await apiClient({
        url: `/apis/users/${user.id}`,
        options: {
          method: "PUT",
          body: JSON.stringify(updateData),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail ||
            errorData.message ||
            errorData.error ||
            `HTTP error! status: ${response.status}`,
        );
      }

      const responseData = await response.json();

      // Dispatch success event
      dispatch("userUpdated", { updatedUser: updateData });
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
      const response = await apiClient({
        url: `/apis/users/${user.id}/password`,
        options: {
          method: "PUT",
          body: JSON.stringify({
            new_password: passwordData.new_password,
          }),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail ||
            errorData.message ||
            errorData.error ||
            `HTTP error! status: ${response.status}`,
        );
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
    let generated = "";
    if (api.adminUpdatePassword?.generateStrongPassword) {
      try {
        generated = api.adminUpdatePassword.generateStrongPassword(12);
      } catch (e) {
        console.warn("Password generation not available:", e);
      }
    }

    if (!generated) {
      // Fallback password generation
      const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
      for (let i = 0; i < 12; i++) {
        generated += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }

    passwordData.new_password = generated;
    passwordData.confirm_password = generated;

    // Show the passwords so user can see and edit what was generated
    showNewPassword = true;
    showConfirmPassword = true;

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

  // Handle modal close
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

  // Handle backdrop click
  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  }

  function handleKeydown(event) {
    if (event.key === "Escape") {
      handleClose();
    }
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

<svelte:window on:keydown={handleKeydown} />

<PortalModal>
  <!-- Modal Container -->
  <div
    class="relative bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden transform transition-all"
  >
    <!-- Modal Header -->
    <div
      class="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200"
    >
      <div class="flex items-center justify-between">
        <div>
          <div class="flex items-center">
            <SquarePen class="h-5 w-5 text-primary" />
            <div class="ml-3">
              <h3
                id="modal-title"
                class="text-base font-semibold text-gray-900"
              >
                Edit User
              </h3>
            </div>
          </div>
          <p class="text-sm text-subtext mt-1">
            Update user details and permissions
          </p>
        </div>
        <Button
          type="button"
          btnType="custom"
          customClass="text-subtext cursor-pointer"
          on:click={handleClose}
        >
          <X class="h-5 w-5" />
        </Button>
      </div>
    </div>

    <!-- Modal Body -->
    <div class="px-6 py-6 max-h-[70vh] overflow-y-auto">
      {#if user}
        <!-- Auth Warning -->
        <!-- User Info Header -->
        <div class="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <div class="flex-shrink-0 h-10 w-10">
                <div
                  class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center"
                >
                  <span class="text-lg font-medium text-blue-800">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div class="ml-3">
                <p class="text-xs text-gray-500">
                  Created: {user.created_at_formatted || "N/A"}
                </p>
                <p class="text-xs text-gray-500">
                  Role: {user.role_name || "Unknown"}
                </p>
              </div>
            </div>

            <!-- Password Update Button -->
            {#if canUpdatePassword}
              <Button
                type="button"
                btnType="custom"
                on:click={togglePasswordSection}
                customClass="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-primary bg-blue-50 hover:bg-blue-200 border border-blue-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-200"
              >
                <Wrench class="h-4 w-4" />

                {showPasswordSection ? "Hide" : "Update"} Password
              </Button>
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
          <div class="mb-6 p-4 bg-blue-50 border border-stroke rounded-lg">
            <div class="flex items-center mb-4 gap-2">
              <Wrench class="h-4 w-4 text-primary" />
              <h4 class="text-sm font-medium text-primary">Update Password</h4>
            </div>

            <!-- Password Success Message -->
            {#if passwordSuccess}
              <div class="mb-4">
                <InlineNotification
                  kind="success"
                  title={passwordSuccess}
                  on:close={() => (passwordSuccess = "")}
                />
              </div>
            {/if}

            <!-- Password Error Message -->
            {#if passwordError}
              <div class="mb-4">
                <InlineNotification
                  kind="error"
                  title={passwordError}
                  on:close={() => (passwordError = "")}
                />
              </div>
            {/if}

            <div class="space-y-4">
              <!-- New Password Field -->
              <Input
                label="New Password"
                type={showNewPassword ? "text" : "password"}
                placeholder="Enter new password"
                required={true}
                disabled={passwordLoading}
                bind:value={passwordData.new_password}
                on:handleInputData={() =>
                  handlePasswordInputChange("new_password")}
                validationErrors={passwordValidationErrors.new_password}
              >
                <div class="flex items-center gap-2">
                  <Button
                    type="button"
                    btnType="custom"
                    customClass="text-subtext cursor-pointer hover:text-dark p-1"
                    on:click={() => (showNewPassword = !showNewPassword)}
                    disabled={passwordLoading}
                    title={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {#if showNewPassword}
                      <EyeOff class="h-4 w-4" />
                    {:else}
                      <Eye class="h-4 w-4" />
                    {/if}
                  </Button>
                  <Button
                    type="button"
                    btnType="custom"
                    customClass="text-xs text-primary hover:text-primary-hover disabled:text-gray-400 cursor-pointer font-medium border-l pl-2 border-gray-200"
                    on:click={generatePassword}
                    disabled={passwordLoading}
                    title="Generate strong password"
                  >
                    Generate
                  </Button>
                </div>
              </Input>

              <!-- Password Strength Indicator -->
              {#if passwordData.new_password}
                <div class="mt-2">
                  <div
                    class="flex items-center justify-between text-xs text-gray-600 mb-1"
                  >
                    <span>Password strength:</span>
                    <span class="capitalize font-medium"
                      >{passwordStrength}</span
                    >
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div
                      class="h-2 rounded-full transition-all duration-300 {getPasswordStrengthColor(
                        passwordStrength,
                      )}"
                      style="width: {getPasswordStrengthWidth(
                        passwordStrength,
                      )}"
                    ></div>
                  </div>
                </div>
              {/if}

              {#if passwordValidationErrors.new_password}
                <p class="mt-1 text-xs text-red-600">
                  {passwordValidationErrors.new_password}
                </p>
              {/if}

              <!-- Confirm Password Field -->
              <Input
                label="Confirm Password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm new password"
                required={true}
                disabled={passwordLoading}
                bind:value={passwordData.confirm_password}
                on:handleInputData={() =>
                  handlePasswordInputChange("confirm_password")}
                validationErrors={passwordValidationErrors.confirm_password}
              >
                <Button
                  type="button"
                  btnType="custom"
                  customClass="text-subtext cursor-pointer hover:text-dark p-1"
                  on:click={() => (showConfirmPassword = !showConfirmPassword)}
                  disabled={passwordLoading}
                  title={showConfirmPassword
                    ? "Hide password"
                    : "Show password"}
                >
                  {#if showConfirmPassword}
                    <EyeOff class="h-4 w-4" />
                  {:else}
                    <Eye class="h-4 w-4" />
                  {/if}
                </Button>
              </Input>

              <!-- Password Update Button -->
              <div class="flex justify-end">
                <Button
                  type="button"
                  on:click={handlePasswordUpdate}
                  disabled={passwordLoading ||
                    !passwordData.new_password ||
                    !passwordData.confirm_password}
                >
                  {#if passwordLoading}
                    <div class="flex items-center">
                      <LoadingSpinner size="small" color="white" />
                      <span class="ml-2">Updating...</span>
                    </div>
                  {:else}
                    <div class="flex items-center gap-2">
                      <Wrench class="h-4 w-4" />
                      Update Password
                    </div>
                  {/if}
                </Button>
              </div>
            </div>
          </div>
        {/if}

        <!-- Error Message for general form -->
        {#if error}
          <div class="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
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
          <div class="flex w-full justify-between items-center">
            <label class=" text-sm font-medium text-gray-700">
              Account Status
            </label>
            <RadioGroup
              options={["Active", "Inactive"]}
              bind:selected={activeStatusString}
            />
          </div>

          <!-- Current vs New Values Summary -->
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
                    <span class="text-blue-600">(unchanged)</span>
                  {/if}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-blue-700">Role:</span>
                <span class="text-blue-900">
                  {user.role_name} → {getRoleName(formData.role_code)}
                  {#if (user.role_code || (user.role_name === "admin" ? "100" : "101")) === formData.role_code}
                    <span class="text-blue-600">(unchanged)</span>
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
    <div
      class="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end space-x-3"
    >
      <Button
        type="button"
        on:click={handleClose}
        disabled={loading || passwordLoading}
        btnType="secondary"
      >
        Cancel
      </Button>
      <Button
        type="submit"
        on:click={handleSubmit}
        disabled={loading || passwordLoading}
        btnType="primary"
      >
        {#if loading}
          <div class="flex items-center">
            <LoadingSpinner size="small" color="white" />
            <span class="ml-2">Updating...</span>
          </div>
        {:else}
          <div class="flex items-center">
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
                d="M5 13l4 4L19 7"
              />
            </svg>
            Update User
          </div>
        {/if}
      </Button>
    </div>
  </div>
</PortalModal>
