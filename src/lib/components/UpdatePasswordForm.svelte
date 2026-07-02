<script>
  import { apiClient } from "$lib/utils/api.js";
  import { generateStrongPassword, validatePasswordInput, validatePassword as validatePasswordHelper } from "$lib/utils/helper.js";
  import Button from "$lib/components/Button.svelte";
  import Input from "$lib/components/Input.svelte";
  import InlineNotification from "$lib/components/InlineNotification.svelte";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import { Wrench, Eye, EyeOff } from "@lucide/svelte";

  export let userId;
  export let onSuccess = () => {};

  let passwordData = {
    new_password: "",
    confirm_password: "",
  };

  let passwordStrength = "weak";
  let showNewPassword = false;
  let showConfirmPassword = false;
  let passwordLoading = false;
  let passwordError = "";
  let passwordSuccess = "";
  let passwordValidationErrors = {};

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

  // Handle password input changes to clear errors
  function handlePasswordInputChange(field) {
    if (passwordValidationErrors[field]) {
      delete passwordValidationErrors[field];
      passwordValidationErrors = { ...passwordValidationErrors };
    }
    passwordError = "";
    passwordSuccess = "";
  }

  // Password validation
  function validatePassword() {
    const result = validatePasswordInput(
      passwordData.new_password,
      passwordData.confirm_password,
      validatePasswordHelper
    );
    passwordValidationErrors = result.errors;
    return result.isValid;
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
        url: `/apis/users/${userId}/password`,
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

      onSuccess();
    } catch (err) {
      passwordError = err.message || "Failed to update password";
      console.error("Error updating password:", err);
    } finally {
      passwordLoading = false;
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
    passwordError = "";
  }

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

  $: isUpdateDisabled = passwordLoading ||
    !passwordData.new_password ||
    !passwordData.confirm_password ||
    passwordData.new_password !== passwordData.confirm_password;
</script>

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
      on:handleInputData={() => handlePasswordInputChange("new_password")}
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
      on:handleInputData={() => handlePasswordInputChange("confirm_password")}
      validationErrors={passwordValidationErrors.confirm_password}
    >
      <Button
        type="button"
        btnType="custom"
        customClass="text-subtext cursor-pointer hover:text-dark p-1"
        on:click={() => (showConfirmPassword = !showConfirmPassword)}
        disabled={passwordLoading}
        title={showConfirmPassword ? "Hide password" : "Show password"}
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
        disabled={isUpdateDisabled}
      >
        {#if passwordLoading}
          <div class="flex items-center">
            <LoadingSpinner size="small" color="white" />
            <span class="ml-2">Updating...</span>
          </div>
        {:else}
          Update Password
        {/if}
      </Button>
    </div>
  </div>
</div>
