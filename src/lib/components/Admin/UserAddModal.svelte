<script>
  import { createEventDispatcher, onMount } from "svelte";
  import { api, apiClient } from "$lib/utils/api.js";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import PortalModal from "$lib/components/PortalModal.svelte";
  import Button from "$lib/components/Button.svelte";
  import { UserPlus, X, Wrench, Eye, EyeOff } from "@lucide/svelte";
  import Input from "$lib/components/Input.svelte";
  import SearchableComboBox from "$lib/components/SearchableComboBox.svelte";
  import InlineNotification from "$lib/components/InlineNotification.svelte";
  import { generateStrongPassword, validatePasswordInput } from "$lib/utils/helper.js";

  const dispatch = createEventDispatcher();

  // Form state
  let formData = {
    username: "",
    role_code: "",
  };

  // Password state
  let passwordData = {
    new_password: "",
    confirm_password: "",
  };

  let passwordStrength = "weak";
  let showNewPassword = false;
  let showConfirmPassword = false;

  // UI state
  let loading = false;
  let rolesLoading = false;
  let error = "";
  let validationErrors = {};
  let passwordValidationErrors = {};
  let roleOptions = [];

  // Map roles for SearchableComboBox
  $: searchableRoleOptions = Array.isArray(roleOptions)
    ? roleOptions.map((role) => ({
        id: role.code || role.role_code || role.id,
        name: role.name || role.role_name || role.label,
      }))
    : [];

  $: selectedRoleId = formData.role_code;
  $: selectedRoleName =
    searchableRoleOptions.find((r) => r.id === selectedRoleId)?.name || "";

  // Fetch roles on mount
  onMount(async () => {
    rolesLoading = true;
    try {
      const res = await apiClient({ url: "/apis/roles" });
      if (res.ok) {
        const data = await res.json();
        roleOptions = Array.isArray(data)
          ? data
          : data.roles || data.data || [];
      }
    } catch (err) {
      console.error("Error fetching roles:", err);
    } finally {
      rolesLoading = false;
    }
  });

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

  // Reactive match checking
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

  // Username and Role validation
  function validateForm() {
    validationErrors = {};
    let isValid = true;

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

    if (!formData.role_code) {
      validationErrors.role_code = "Role is required";
      isValid = false;
    }

    return isValid;
  }

  // Password validation
  function validatePassword() {
    const result = validatePasswordInput(
      passwordData.new_password,
      passwordData.confirm_password,
      api.adminUpdatePassword?.validatePassword
    );
    passwordValidationErrors = result.errors;
    return result.isValid;
  }

  // Handle submit (Register User)
  async function handleSubmit() {
    const isFormValid = validateForm();
    const isPasswordValid = validatePassword();

    if (!isFormValid || !isPasswordValid) {
      return;
    }

    loading = true;
    error = "";

    try {
      const payload = {
        username: formData.username.trim(),
        password: passwordData.new_password,
        role_code: formData.role_code,
      };

      const response = await apiClient({
        url: "/apis/register",
        options: {
          method: "POST",
          body: JSON.stringify(payload),
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
      dispatch("userAdded", {
        newUser: responseData,
        message: responseData.message || "User created successfully!",
      });
    } catch (err) {
      error = err.message || "Failed to create user";
      console.error("Error creating user:", err);
    } finally {
      loading = false;
    }
  }

  // Generate strong password
  function generatePassword() {
    const generated = generateStrongPassword(12);

    passwordData.new_password = generated;
    passwordData.confirm_password = generated;

    showNewPassword = true;
    showConfirmPassword = true;

    passwordValidationErrors = {};
  }

  function handleRoleChange(e) {
    formData.role_code = e.detail.id;
    if (validationErrors.role_code) {
      delete validationErrors.role_code;
      validationErrors = { ...validationErrors };
    }
  }

  function handleRoleClear() {
    formData.role_code = "";
  }

  function handleInputChange(field) {
    if (validationErrors[field]) {
      delete validationErrors[field];
      validationErrors = { ...validationErrors };
    }
    error = "";
  }

  function handlePasswordInputChange(field) {
    if (passwordValidationErrors[field]) {
      delete passwordValidationErrors[field];
      passwordValidationErrors = { ...passwordValidationErrors };
    }
    error = "";
  }

  function handleClose() {
    dispatch("close");
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
</script>

<PortalModal>
  <!-- Modal container -->
  <div
    class="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-stroke flex flex-col max-h-[90vh]"
    on:click|stopPropagation
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <!-- Modal Header -->
    <div
      class="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-stroke flex items-center justify-between"
    >
      <div class="flex items-center gap-3">
        <div class="p-2 bg-blue-100 text-primary rounded-lg">
          <UserPlus class="h-5 w-5" />
        </div>
        <div>
          <h3 class="text-lg font-semibold text-dark leading-6">
            Add New User
          </h3>
          <p class="text-xs text-subtext mt-0.5">
            Create a new user account on the system
          </p>
        </div>
      </div>
      <Button
        type="button"
        btnType="custom"
        customClass="text-subtext hover:text-dark p-1 rounded-lg hover:bg-gray-100 transition-colors"
        on:click={handleClose}
      >
        <X class="h-5 w-5" />
      </Button>
    </div>

    <!-- Modal Body -->
    <div class="flex-1 overflow-y-auto p-6 space-y-6">
      {#if error}
        <div class="mb-4">
          <InlineNotification
            kind="error"
            title={error}
            on:close={() => (error = "")}
          />
        </div>
      {/if}

      <div class="space-y-4">
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
          loading={rolesLoading}
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

        <!-- New Password Field -->
        <Input
          label="Password"
          type={showNewPassword ? "text" : "password"}
          placeholder="Enter password"
          required={true}
          disabled={loading}
          bind:value={passwordData.new_password}
          on:handleInputData={() => handlePasswordInputChange("new_password")}
          validationErrors={passwordValidationErrors.new_password}
        >
          <div class="flex items-center gap-2">
            <Button
              type="button"
              btnType="custom"
              customClass="text-subtext cursor-pointer hover:text-dark p-1"
              on:click={() => (showNewPassword = !showNewPassword)}
              disabled={loading}
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
              disabled={loading}
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
              <span class="capitalize font-medium">{passwordStrength}</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                class="h-2 rounded-full transition-all duration-300 {getPasswordStrengthColor(
                  passwordStrength,
                )}"
                style="width: {getPasswordStrengthWidth(passwordStrength)}"
              ></div>
            </div>
          </div>
        {/if}

        <!-- Confirm Password Field -->
        <Input
          label="Confirm Password"
          type={showConfirmPassword ? "text" : "password"}
          placeholder="Confirm password"
          required={true}
          disabled={loading}
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
            disabled={loading}
            title={showConfirmPassword ? "Hide password" : "Show password"}
          >
            {#if showConfirmPassword}
              <EyeOff class="h-4 w-4" />
            {:else}
              <Eye class="h-4 w-4" />
            {/if}
          </Button>
        </Input>
      </div>
    </div>

    <!-- Modal Footer -->
    <div
      class="bg-gray-50 px-6 py-4 border-t border-stroke flex justify-end gap-3"
    >
      <Button
        type="button"
        on:click={handleClose}
        disabled={loading}
        btnType="secondary"
      >
        Cancel
      </Button>
      <Button
        type="submit"
        on:click={handleSubmit}
        disabled={loading}
        btnType="primary"
      >
        {#if loading}
          <div class="flex items-center">
            <LoadingSpinner size="small" color="white" />
            <span class="ml-2">Creating...</span>
          </div>
        {:else}
          <div class="flex items-center gap-2">
            <UserPlus class="h-4 w-4" />
            Create User
          </div>
        {/if}
      </Button>
    </div>
  </div>
</PortalModal>
